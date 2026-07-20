# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供项目工作指引。

## 项目概述

**课文漫游** 将语文课文自动转化为漫画。用户选择课文，AI 分析场景，ComfyUI 生成对应图片。

## 架构（混合架构）

```
浏览器 → Nuxt Server Routes → 直连 Supabase（auth/admin/works/lessons CRUD）
                            ↘ 代理 → Python FastAPI (端口 8001) → DeepSeek + ComfyUI
```

- **`app/server/api/`** — Nuxt Server Routes，直接调用 Supabase REST API
- **`server/main.py`** — Python FastAPI，仅处理 AI 分析/图片生成/任务轮询/文件上传
- **Supabase** — PostgreSQL + Auth + RLS + 5 视图 + 3 RPC 函数

## 关键路径

| 路径 | 用途 |
|------|------|
| `app/app/pages/` | Vue 页面 |
| `app/app/stores/auth.ts` | Pinia 认证 store |
| `app/app/middleware/admin.ts` | 管理员路由守卫 |
| `app/server/api/auth/` | 认证 API |
| `app/server/api/admin/` | 管理员 API |
| `app/server/utils/auth.ts` | `requireLogin` / `requireAdmin` / `writeAuditLog` |
| `app/server/utils/rateLimit.ts` | 速率限制 |
| `app/server/utils/inviteCode.ts` | HMAC 邀请码生成/验证 |
| `server/main.py` | FastAPI 主程序 |
| `init_supabase.sql` | 数据库初始化脚本 |

## Nuxt Server Routes 约定

### 鉴权工具

```typescript
import { requireLogin, requireAdmin, writeAuditLog } from '~~/server/utils/auth'

// 普通用户接口
const user = await requireLogin(event)

// 管理员接口
const admin = await requireAdmin(event)

// 写审计日志
await writeAuditLog(event, admin.id, 'work_approve', 'works', workId, { reason })
```

**注意：** Nuxt 4 server 端 import 别名必须用 `~~/server/utils/*`，不能用 `~/server/utils/*`（后者解析到 `app/app/*`）。

### 调用 Supabase REST API

```typescript
const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
const supabaseKey = useRuntimeConfig().supabaseKey
const authHeader = getHeader(event, 'authorization')!

// PostgREST 过滤示例
await $fetch(`${supabaseUrl}/rest/v1/works?id=in.(${ids.join(',')})`, {
  method: 'PATCH',
  headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  body: { deleted_at: new Date().toISOString() },
})

// RPC 调用
await $fetch(`${supabaseUrl}/rest/v1/rpc/get_current_user`, {
  method: 'POST',
  headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  body: {},
})
```

## API 端点

### Nuxt Server Routes（端口 3000）

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录（含速率限制） | 否 |
| POST | `/api/auth/register` | 注册（支持邀请码） | 否 |
| POST | `/api/auth/verify-invite` | 校验邀请码 | 否 |
| POST | `/api/auth/logout` | 登出 | 是 |
| POST | `/api/auth/refresh` | 刷新 token | 否 |
| GET | `/api/auth/me` | 当前用户 | 是 |
| GET | `/api/works` | 作品列表 | 否 |
| GET | `/api/works/public` | 公开作品 | 否 |
| GET | `/api/works/my` | 我的作品 | 是 |
| GET/POST/PUT/DELETE | `/api/works/{id}` | 作品 CRUD | 部分 |
| GET | `/api/works/{id}/export` | 导出长图 | 否 |
| GET/POST | `/api/lessons` `/api/lessons/{id}` | 课文 CRUD | 部分 |
| POST | `/api/analyze` | 代理到 Python | 否 |
| POST | `/api/generate` | 代理到 Python | 否 |
| GET | `/api/task/{taskId}` | 代理到 Python | 否 |
| GET | `/api/admin/stats` | 仪表盘统计 | admin |
| GET | `/api/admin/works` `/pending` | 作品管理 | admin |
| POST/DELETE | `/api/admin/works/{id}/{approve,reject,delete}` | 作品审核 | admin |
| POST | `/api/admin/works/batch` | 批量操作 | admin |
| GET | `/api/admin/users` | 用户列表（搜索/分页） | admin |
| PUT | `/api/admin/users/{id}/role` | 修改角色 | admin |
| POST | `/api/admin/users/{id}/{ban,unban}` | 封禁/解封 | admin |
| GET | `/api/admin/lessons` | 课文列表 | admin |
| DELETE | `/api/admin/lessons/{id}` | 删除课文（软删除） | admin |
| GET | `/api/admin/audit` | 审计日志（过滤/分页） | admin |
| POST | `/api/admin/invite-codes` | 生成邀请码 | admin |

### Python FastAPI（端口 8001）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/analyze` | DeepSeek 分析课文 → 场景列表 |
| POST | `/api/generate` | 提交生成任务（后台执行） |
| GET | `/api/task/{task_id}` | 查询任务状态 |
| POST | `/api/works` | 保存作品（写 Supabase） |
| GET | `/api/works/public` | 公开作品（直查 Supabase） |
| GET/PUT/DELETE | `/api/works/{id}` | 作品操作 |
| GET | `/api/works/{id}/export` | 导出长图 |
| GET/POST | `/api/lessons` | 课文操作 |
| PUT/DELETE | `/api/lessons/{id}` | 课文操作 |
| POST | `/api/upload` | 上传图片 |
| POST | `/api/auth/*` | 兼容旧接口（建议用 Nuxt 路由） |

## 鉴权流程

1. 客户端登录 → Supabase Auth 返回 `access_token` + `refresh_token`
2. 后续请求带 `Authorization: Bearer <access_token>`
3. 服务端 `requireLogin(event)` → 调 RPC `get_current_user()` → 返回 `{id, email, role, status}`
4. 封禁用户（`status='banned'`）抛 403
5. 非管理员访问 admin 路由抛 403

## 数据库

7 张表（详见 `init_supabase.sql`）：`profiles` / `lessons` / `lesson_tasks` / `works` / `work_images` / `work_scenes` / `audit_logs`

5 个视图：`work_stats` / `lesson_stats` / `user_stats` / `lesson_task_stats` / `admin_stats_view`

3 个 RPC：`get_current_user()` / `write_audit_log()` / `increment_work_view()`

软删除：所有表都有 `deleted_at` 字段 + BEFORE DELETE 触发器。

## 关键约束

- **文本长度**：≤3000 字符（分析接口）
- **场景数**：每个作品最多 30 个场景
- **并发**：图片生成最多 2 个并发（Python `asyncio.Semaphore`）
- **DeepSeek 缓存**：相同 text+style 缓存 1 天
- **临时图片清理**：`./static/temp/` 任务完成 1 小时后清理
- **登录限流**：每 IP 每分钟 5 次

## 邀请码机制

```typescript
// 生成（管理员）
import { generateInviteCode } from '~~/server/utils/inviteCode'
const code = generateInviteCode({ role: 'admin', expiresInDays: 7 })
// 格式: {payloadBase64Url}.{signatureBase64Url}

// 验证（注册时）
import { verifyInviteCode } from '~~/server/utils/inviteCode'
const decoded = verifyInviteCode(code)
// → { role, exp, iat, jti, ttl } 或 null
```

- 无状态：无需数据库存储
- HMAC-SHA256 签名，密钥来自 `INVITE_CODE_SECRET` 环境变量
- 自带过期时间，过期自动失效
- 改密钥即让所有旧码失效

## 画风

| 画风 | Prompt 前缀 |
|------|------------|
| 写实古风 | `realistic ancient Chinese style, traditional Chinese painting aesthetic, detailed, historical accuracy,` |
| 水墨风格 | `Chinese ink painting style, wash painting, sumi-e, black and white, traditional brush strokes,` |
| 彩色插画 | `colorful illustration, vibrant, modern cartoon style, anime, bright colors,` |

## 常见问题

### `~/server/utils/auth` 找不到

Nuxt 4 server 端 `~/*` 解析到 `app/app/*`，应使用 `~~/*`（解析到项目根 `app/*`）。

### 用户登录后读不到数据

检查 RLS 策略，确保请求带了 `Authorization: Bearer <token>` 头。

### 邀请码升级管理员失败

查看服务端日志 `Failed to upgrade invite-code user to admin`，可能是 RLS 阻止用户更新自己的 role。临时方案：在 Supabase Dashboard 用 service_role key 手动改。

### ComfyUI 连接失败

确认 ComfyUI 运行在 8000 端口，`COMFYUI_API_URL=http://localhost:8000/prompt` 配置正确。

## 开发命令

```bash
cd app && pnpm dev          # 前端
cd server && uvicorn main:app --reload --port 8001  # 后端
cd app && pnpm build        # 前端构建
```
