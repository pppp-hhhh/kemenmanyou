# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供项目工作指引。

## 项目概述

**课文漫游** 将语文课文自动转化为漫画。用户选择课文，AI 分析场景，SenseNova U1 Fast 生成对应图片。

## 架构（本地存储版）

```
浏览器 → Nuxt Server Routes → 本地 JSON 库（local-db.ts，./data/app.db.json）
                            ↘ 代理 → Python FastAPI (端口 8001，模块化) → 多供应商 LLM + SenseNova U1 Fast
```

- **`app/server/api/`** — Nuxt Server Routes，数据读写走本地存储层 `app/server/utils/local-db.ts`，鉴权用本地 HMAC token（`authToken.ts` + `auth.ts`）
- **`server/`** — Python FastAPI，模块化拆分（main/config/schemas/state/analyzer/image_gen/routes_*），仅负责 AI 分析/图片生成/任务轮询/文件上传/长图导出；文本分析供应商可经 `ANALYZE_PROVIDER` 切换（deepseek/sensenova/openai/openrouter/custom）
- **Supabase** — 运行时已弃用；`init_supabase.sql` 保留作为日后回迁云端的 schema 参考

## 关键路径

| 路径 | 用途 |
|------|------|
| `app/app/pages/` | Vue 页面 |
| `app/app/components/workspace/ComicPage.vue` | 前端漫画页渲染核心（网格+gutter+角标+气泡/旁白/拟声词） |
| `app/app/utils/comic.ts` | 分镜渲染共享工具（resolveScenePanels/anchor 映射/layout→size，与后端同步） |
| `app/app/stores/auth.ts` | Pinia 认证 store |
| `app/app/middleware/admin.ts` | 管理员路由守卫 |
| `app/server/api/auth/` | 认证 API |
| `app/server/api/admin/` | 管理员 API |
| `app/server/utils/auth.ts` | `requireLogin` / `requireAdmin` / `writeAuditLog` |
| `app/server/utils/rateLimit.ts` | 速率限制 |
| `app/server/utils/inviteCode.ts` | HMAC 邀请码生成/验证 |
| `app/server/utils/local-db.ts` | 本地 JSON 存储层（事务锁 + 原子写，库文件 `data/app.db.json`；work_scenes 存 panels/page 分镜结构） |
| `app/server/utils/authToken.ts` | HMAC-SHA256 access/refresh 令牌签发与校验 |
| `server/main.py` | FastAPI 入口（模块化，详见 `server/README.md`） |
| `server/analyzer.py` | 课文→分镜 storyboard（characters[] + scenes[].panels[]，失败降级单格） |
| `server/image_gen.py` | panel 级逐格生成（size 白名单 + panel_id 回绑 + CharacterLock + 风格前缀单次注入 + no-text） |
| `server/composer.py` | 漫画页合成（网格/gutter/cover-crop/分格线/阅读角标/rtl 镜像）+ layout→size |
| `server/lettering.py` | 台词/旁白/拟声词 Pillow 绘制（内置 `server/fonts/` Noto Sans SC，OFL） |
| `server/character_ref.py` | 参考图 Provider 协议（C1 实测不可行仅占位，主线走 C0 prompt 锁定） |
| `server/consistency_qa.py` | 跨格一致性 VLM QA（`CONSISTENCY_QA=true` 启用，尽力而为） |
| `init_supabase.sql` | 云端回迁参考（运行时不使用） |

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

### 调用本地存储层

```typescript
import { addWork, getWork, getViewHistory } from '~~/server/utils/local-db'

// 写操作经 tx() 事务锁 + 原子落盘；读操作用快照查询函数
const work = await addWork({ title, style, author_id: user.id, /* ... */ })
```

**注意：** 不要在路由里直接读写 `data/app.db.json`，一律走 local-db.ts 的函数，保证锁与原子性。

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
| GET | `/api/works/{id}/export` | 导出长图（代理 Python 拼接） | 是 |
| GET/POST | `/api/lessons` `/api/lessons/{id}` | 课文 CRUD | 部分 |
| GET/DELETE | `/api/users/me/view-history` | 浏览历史（分页 / 清空，body 可选 `workIds`） | 是 |
| POST | `/api/analyze` | 代理到 Python（文本→场景） | 是 |
| POST | `/api/generate` | 代理到 Python（提交生图任务） | 是 |
| GET | `/api/task/{taskId}` | 代理到 Python（轮询任务） | 是 |
| POST | `/api/upload` | 代理到 Python（上传图片） | 是 |
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

### Python FastAPI（端口 8001，5 个活端点）

> Python 端已模块化拆分（main/config/schemas/state/analyzer/image_gen/composer/lettering/routes_*），不连数据库；详见 [server/README.md](server/README.md)。
> 真漫画契约（design-comic-reconstruction.md）：一个场景 = 一页漫画（Scene→panels[] 分镜结构，panel 含台词/镜头/构图/布局/阅读次序/转场）。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/analyze` | 文本分析 → 分镜 storyboard：`{scenes:[{description_cn,page,panels:[...]}], characters:[...]}`（≤3000 字符，缓存 1 天，缓存 key 带 schema 版本） |
| POST | `/api/generate` | 提交 panel 级生成任务：`{panels:[{panel_id,prompt_en,size,characters,shot,angle}], characters, character_mode, style}`；旧 `{prompts}` 分支兼容；返回 task_id |
| GET | `/api/task/{task_id}` | 查询任务状态（内存级，重启丢失）；`images[]` 含 `panel_id` 供前端逐格回绑 |
| POST | `/api/works/{work_id}/export` | 导出漫画页长图：新分支 body `{scenes, images}` → 逐 scene 用 composer+lettering 合成漫画页（网格/gutter/角标/气泡/旁白/拟声词）；旧 `{images}` 分支纵向拼接 |
| POST | `/api/upload` | 上传图片 |

## 鉴权流程（本地）

1. 注册：密码 scrypt 哈希入 `users`；邀请码可授 admin
2. 登录：`/api/auth/login` 校验哈希 → 签发 HMAC-SHA256 `access_token`(2h) + `refresh_token`(30d)
3. 后续请求带 `Authorization: Bearer <access_token>`
4. 服务端 `requireLogin(event)` → `authToken.verify` + 查本地 `users` → 返回 `{id, email, role, status}`
5. 封禁用户（`status='banned'`）抛 403；非管理员访问 admin 路由抛 403

## 数据库（本地 JSON）

库文件：`data/app.db.json`（Git 忽略），由 `app/server/utils/local-db.ts` 管理，事务锁 + 临时文件原子 rename 写。

集合：`users` / `lessons` / `works` / `work_images` / `work_scenes` / `audit_logs` / `view_histories`（浏览历史，upsert 去重 + 30 分钟幂等窗口）

- 软删除：业务表有 `deleted_at`（`view_histories` 除外，清空即物理删除）
- 自增：`next_ids` 计数器
- 回迁云端：按 `init_supabase.sql` 建 PG 表，local-db 函数集换 PG 实现（`DATA_BACKEND` 开关思路），路由层零改动

## 关键约束

- **文本长度**：≤3000 字符（分析接口）
- **场景数**：每个作品最多 30 个场景；**panel 总数** ≤ `MAX_PANELS_PER_WORK`（默认 120）
- **并发**：图片生成最多 2 个并发（Python `asyncio.Semaphore`）
- **分析缓存**：相同 text+style 缓存 1 天（供应商无关；key 含 schema 版本，结构升级自动失效）
- **分析供应商**：`ANALYZE_PROVIDER` 切换（deepseek/sensenova/openai/openrouter/custom），见 `server/model_providers/__init__.py`
- **角色一致性**：主线 C0 = CharacterLock prompt 锁定（t2 spike 实测跨格一致率 9.3/10）；`CHAR_CONSISTENCY_MODE=multiref` 仅占位（托管网关无多参考通道，实测记录见 `doc/spike-character-consistency-t2.md`）
- **可读文字永不来自模型**：台词/旁白/拟声词全由 `text` 字段 + 程序化叠加（Pillow/前端 DOM 共用 anchor 映射），生成 prompt 强制 `No text`
- **导出回源**：Python 合成页回源地址 `SERVE_BASE_URL`（默认 http://localhost:8001）
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

> **前缀只由服务端注入一次**（`server/config.py::STYLE_PREFIXES` + `image_gen._strip_style_tokens` 去重）；
> 前端提交纯 prompt（勿再附加风格描述），panel 级生成时还会叠加 CharacterLock 与 No-text 指令。

## 常见问题

### `~/server/utils/auth` 找不到

Nuxt 4 server 端 `~/*` 解析到 `app/app/*`，应使用 `~~/*`（解析到项目根 `app/*`）。

### 用户登录后读不到数据

确认请求带了 `Authorization: Bearer <token>` 头，且 token 未过期（access 2 小时；过期走 `/api/auth/refresh`）。

### 邀请码升级管理员失败

注册时 `invite_code` 校验失败会静默降级为普通用户；检查邀请码是否过期（`/api/auth/verify-invite`）与 `INVITE_CODE_SECRET` 是否与签发时一致。

### SenseNova U1 Fast 图像生成失败

确认 `SENSE_NOVA_API_KEY` 有效，`SENSE_NOVA_BASE_URL=https://token.sensenova.cn/v1` 配置正确。接口为 `POST {base_url}/images/generations`，模型 `sensenova-u1-fast`，支持尺寸见 `server/config.py` 注释。

## 开发命令

```bash
cd app && pnpm dev          # 前端
cd server && uvicorn main:app --reload --port 8001  # 后端
cd app && pnpm build        # 前端构建
```
