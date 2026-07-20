# 课文漫游 API 文档

## Base URL

- **前端 API（Nuxt Server Routes）**：`http://localhost:3000/api`
- **AI 后端（Python FastAPI）**：`http://localhost:8001/api`

前端 API 是主要入口，部分 AI 相关接口由 Nuxt 代理转发到 Python 后端。

## 鉴权

除登录/注册/校验邀请码/公开作品查询外，所有接口需要 HTTP 头：

```
Authorization: Bearer <access_token>
```

`access_token` 由 Supabase Auth 签发，登录或注册时返回。

---

## 认证接口

### 注册

```
POST /api/auth/register
```

**请求**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "invite_code": "可选，填入后自动成为管理员"
}
```

**响应**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "expires_at": 1720000000,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "display_name": null,
    "avatar_url": null,
    "created_at": "2026-07-20T..."
  }
}
```

若填入有效邀请码，`role` 将为 `admin`。无效或过期邀请码返回 400。

### 校验邀请码

```
POST /api/auth/verify-invite
```

**请求**
```json
{ "code": "邀请码字符串" }
```

**响应**
```json
{
  "valid": true,
  "role": "admin",
  "exp": 1720000000,
  "iat": 1719900000,
  "ttl": 86400
}
```

或 `{ "valid": false, "reason": "邀请码无效或已过期" }`

### 登录

```
POST /api/auth/login
```

**请求**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**：同注册。失败返回 401，错误信息不区分邮箱/密码错误（防用户枚举）。

**速率限制**：每 IP 每分钟 5 次，超出返回 429。

### 登出

```
POST /api/auth/logout
```

需要 Authorization header。

### 刷新 Token

```
POST /api/auth/refresh
```

**请求**
```json
{ "refresh_token": "eyJ..." }
```

**响应**：同登录。

### 获取当前用户

```
GET /api/auth/me
```

需要 Authorization header。

**响应**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "status": "active",
  "display_name": null,
  "avatar_url": null
}
```

---

## 作品接口

### 获取所有作品

```
GET /api/works
```

### 获取公开作品

```
GET /api/works/public
```

仅返回 `is_public=true AND review_status='approved' AND deleted_at IS NULL`。

### 我的作品

```
GET /api/works/my
```

需要 Authorization header。

### 获取作品详情

```
GET /api/works/{work_id}
```

自动通过 RPC `increment_work_view()` 原子自增浏览数。

### 创建作品

```
POST /api/works
```

需要 Authorization header。代理到 Python 后端。

**请求**
```json
{
  "text_id": 1,
  "custom_title": "我的荷塘月色",
  "custom_content": "可选课文内容",
  "thumbnail": "/static/works/xxx/thumbnail.png",
  "scenes": [
    { "description_cn": "场景1", "prompt_en": "scene 1 prompt" }
  ],
  "images": ["/static/temp/abc_0.png"],
  "style": "彩色插画",
  "is_public": false
}
```

### 更新作品

```
PUT /api/works/{work_id}
```

**请求**（所有字段可选）
```json
{
  "title": "新标题",
  "style": "水墨风格",
  "scenes": [...],
  "images": [...],
  "is_public": true,
  "tags": ["风景", "古诗"],
  "thumbnail": "..."
}
```

### 删除作品

```
DELETE /api/works/{work_id}
```

软删除：仅设置 `deleted_at` 字段。

### 导出作品长图

```
GET /api/works/{work_id}/export
```

返回 PNG 文件下载。

---

## 课文接口

### 获取课文列表

```
GET /api/lessons
```

### 创建课文

```
POST /api/lessons
```

**请求**
```json
{
  "title": "荷塘月色",
  "content": "曲曲折折的荷塘上面...",
  "grade": "高一",
  "source": "朱自清散文集",
  "user_id": "可选"
}
```

### 更新课文

```
PUT /api/lessons/{lesson_id}
```

### 删除课文

```
DELETE /api/lessons/{lesson_id}
```

软删除。

---

## AI 生成接口

### 分析课文

```
POST /api/analyze
```

代理到 Python FastAPI `/api/analyze`。

**请求**
```json
{
  "text": "课文内容（≤3000 字）",
  "style": "彩色插画"
}
```

**响应**
```json
{
  "scenes": [
    {
      "description_cn": "月光下的荷塘，荷叶田田",
      "prompt_en": "moonlit lotus pond..."
    }
  ]
}
```

### 提交生成任务

```
POST /api/generate
```

代理到 Python FastAPI。

**请求**
```json
{
  "prompts": ["prompt1", "prompt2", "prompt3"],
  "style": "彩色插画"
}
```

**响应**
```json
{ "task_id": "a1b2c3d4" }
```

### 查询任务状态

```
GET /api/task/{task_id}
```

代理到 Python FastAPI。

**响应**
```json
{
  "status": "processing",
  "total": 6,
  "completed": 2,
  "images": [
    { "index": 0, "url": "/static/temp/a1b2c3d4_0.png", "status": "completed" }
  ],
  "error": null
}
```

| status | 说明 |
|--------|------|
| pending | 等待开始 |
| processing | 生成中 |
| completed | 全部完成 |
| failed | 失败 |

### 上传图片

```
POST /api/upload
```

multipart/form-data，字段名 `file`。

**响应**
```json
{ "url": "/static/uploads/xxxx.png" }
```

---

## 管理员接口

所有 `/api/admin/*` 接口需要 Authorization header 且 `role='admin'`，否则返回 403。所有管理员操作会记录到 `audit_logs` 表。

### 仪表盘统计

```
GET /api/admin/stats
```

**响应**
```json
{
  "works": {
    "total": 100,
    "pending": 5,
    "approved": 80,
    "rejected": 15
  },
  "lessons": { "total": 50 },
  "users": {
    "total": 20,
    "active": 18,
    "banned": 2
  },
  "daily_works": [
    { "date": "2026-07-14", "total": 8, "approved": 5, "pending": 3 }
  ],
  "recent_logs": [
    {
      "id": 1,
      "admin_id": "uuid",
      "action": "work_approve",
      "target_type": "works",
      "target_id": "123",
      "detail": null,
      "created_at": "2026-07-20T..."
    }
  ]
}
```

### 作品管理

#### 作品列表

```
GET /api/admin/works?status=pending&search=标题&page=1&page_size=20
```

| 参数 | 说明 |
|------|------|
| status | pending / approved / rejected / all |
| search | 标题模糊搜索 |
| page | 页码（默认 1） |
| page_size | 每页数量（默认 20） |

#### 待审核作品

```
GET /api/admin/works/pending
```

#### 批准作品

```
POST /api/admin/works/{id}/approve
```

#### 拒绝作品

```
POST /api/admin/works/{id}/reject
```

**请求**
```json
{ "reason": "图片质量不佳" }
```

#### 删除作品

```
DELETE /api/admin/works/{id}
```

软删除。

#### 批量操作

```
POST /api/admin/works/batch
```

**请求**
```json
{
  "ids": [1, 2, 3],
  "action": "delete"
}
```

`action` 可选：`approve` / `reject` / `delete`。使用 PostgREST `in.()` 过滤避免 N+1。

**响应**
```json
{
  "success": true,
  "affected": 3,
  "failed": []
}
```

### 用户管理

#### 用户列表

```
GET /api/admin/users?search=邮箱&status=banned&page=1&page_size=20
```

**响应**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "用户名",
      "role": "user",
      "status": "active",
      "created_at": "2026-...",
      "last_login_at": "2026-..."
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

#### 修改角色

```
PUT /api/admin/users/{id}/role
```

**请求**
```json
{ "role": "admin" }
```

`role` 可选：`admin` / `user`。不能修改自己的角色（防自降级丢失权限）。

#### 封禁用户

```
POST /api/admin/users/{id}/ban
```

设置 `status='banned'`，用户将无法登录或调用接口。不能封禁自己。

#### 解封用户

```
POST /api/admin/users/{id}/unban
```

设置 `status='active'`。

### 课文管理

#### 课文列表

```
GET /api/admin/lessons
```

#### 删除课文

```
DELETE /api/admin/lessons/{id}
```

软删除 + 审计日志。

### 审计日志

```
GET /api/admin/audit?action=work_approve&target_type=works&page=1&page_size=50
```

| 参数 | 说明 |
|------|------|
| action | 操作类型过滤 |
| target_type | 对象类型：users / works / lessons / system |
| admin_id | 操作员 ID 过滤 |
| page | 页码 |
| page_size | 每页数量（默认 50） |

**响应**
```json
{
  "data": [
    {
      "id": 1,
      "admin_id": "uuid",
      "admin": {
        "email": "admin@example.com",
        "display_name": "管理员"
      },
      "action": "work_approve",
      "target_type": "works",
      "target_id": "123",
      "detail": { "reason": "..." },
      "created_at": "2026-07-20T..."
    }
  ],
  "total": 200,
  "page": 1,
  "page_size": 50,
  "actions": ["work_approve", "work_reject", "user_ban", ...]
}
```

#### 审计动作类型

| action | 说明 |
|--------|------|
| `user_ban` | 封禁用户 |
| `user_unban` | 解封用户 |
| `user_role_change` | 修改用户角色 |
| `work_approve` | 通过作品 |
| `work_reject` | 拒绝作品 |
| `work_delete` | 删除作品 |
| `work_batch_delete` | 批量删除作品 |
| `lesson_delete` | 删除课文 |
| `invite_code_generate` | 生成邀请码 |

### 邀请码

#### 生成邀请码

```
POST /api/admin/invite-codes
```

**请求**
```json
{ "expires_in_days": 7 }
```

`expires_in_days` 范围 1-90，默认 7。

**响应**
```json
{
  "code": "eyJyb2xlIjoiYWRtaW4i...",
  "role": "admin",
  "expires_in_days": 7,
  "exp": 1720600000,
  "ttl_text": "7 天 0 小时",
  "note": "请妥善保存..."
}
```

邀请码格式：`{payloadBase64Url}.{signatureBase64Url}`

- payload 包含：`role` / `iat` / `exp` / `jti`
- signature = HMAC-SHA256(payload, INVITE_CODE_SECRET)
- 无状态：无需数据库存储
- 改 `INVITE_CODE_SECRET` 环境变量即让所有旧码失效

---

## 画风

| 画风 | Prompt 前缀 |
|------|------------|
| 写实古风 | `realistic ancient Chinese style, traditional Chinese painting aesthetic, detailed, historical accuracy,` |
| 水墨风格 | `Chinese ink painting style, wash painting, sumi-e, black and white, traditional brush strokes,` |
| 彩色插画 | `colorful illustration, vibrant, modern cartoon style, anime, bright colors,` |

---

## 错误响应

```json
{
  "statusCode": 400,
  "statusMessage": "错误描述",
  "message": "错误描述"
}
```

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未登录或登录已过期 |
| 403 | 无权限（非管理员/账号已封禁） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（速率限制） |
| 500 | 服务器内部错误 |

---

## 审查流程

```
用户提交公开申请 (is_public=true)
        ↓
review_status='pending'
        ↓
管理员查看待审核列表 (/api/admin/works/pending)
        ↓
   ┌────────────┴────────────┐
   批准                     拒绝
   ↓                        ↓
review_status='approved'   review_status='rejected'
is_public=true            reject_reason='原因'
   ↓                        ↓
展示广场可见              用户可见拒绝原因
```
