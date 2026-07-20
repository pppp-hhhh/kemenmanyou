# 课文漫游 - 前端（Nuxt 4）

## 技术栈

- Nuxt 4 + Vue 3 + TypeScript
- Pinia 状态管理
- Tailwind CSS
- Nuxt Server Routes（直接调用 Supabase，部分代理到 Python FastAPI）

## 开发

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # 生产构建
```

## 配置

`nuxt.config.ts` 中的 `runtimeConfig`：
- `supabaseKey` — Supabase anon key（可由环境变量 `SUPABASE_KEY` 覆盖）
- `public.supabaseUrl` — Supabase 项目 URL

环境变量：
- `SUPABASE_KEY` — Supabase anon key
- `INVITE_CODE_SECRET` — 邀请码签名密钥（>=16 字符，生产环境必须设置）

## 目录结构

```
app/
├── app/                       # Vue 应用
│   ├── pages/                 # 页面
│   │   ├── admin/             # 管理后台（仪表盘/作品/课文/用户/审计/邀请码）
│   │   ├── watch/[id].vue     # 观看页
│   │   ├── workspace.vue      # 工作台
│   │   ├── gallery.vue        # 展示广场
│   │   ├── login.vue
│   │   ├── register.vue       # 支持邀请码
│   │   ├── my-works.vue
│   │   └── profile.vue
│   ├── stores/                # auth.ts / workspace.ts
│   ├── middleware/            # auth.ts / admin.ts
│   ├── composables/           # useDarkMode / useTaskPoll / useWorks
│   └── types/                 # api.ts / auth.ts
└── server/                    # Nuxt Server Routes
    ├── api/
    │   ├── auth/              # 认证（login/register/logout/refresh/me/verify-invite）
    │   ├── admin/             # 管理员（stats/works/users/lessons/audit/invite-codes）
    │   ├── works/             # 作品 CRUD
    │   ├── lessons/           # 课文 CRUD
    │   ├── analyze.post.ts    # 代理到 Python
    │   ├── generate.post.ts   # 代理到 Python
    │   └── task/[taskId].get.ts # 代理到 Python
    └── utils/
        ├── auth.ts            # requireLogin / requireAdmin / writeAuditLog
        ├── rateLimit.ts       # 速率限制
        └── inviteCode.ts      # HMAC 邀请码生成/验证
```

## 页面

| 路由 | 说明 | 权限 |
|------|------|------|
| `/` | 重定向到 /gallery | 公开 |
| `/gallery` | 展示广场 | 公开 |
| `/watch/{id}` | 观看页 | 公开 |
| `/login` `/register` | 登录注册 | 公开 |
| `/workspace` | 工作台 | 需登录 |
| `/my-works` `/profile` | 我的作品/个人中心 | 需登录 |
| `/admin` | 管理员仪表盘 | 管理员 |
| `/admin/works` | 作品管理 | 管理员 |
| `/admin/lessons` | 课文管理 | 管理员 |
| `/admin/users` | 用户管理 | 管理员 |
| `/admin/audit` | 审计日志 | 管理员 |
| `/admin/invite-codes` | 邀请码生成 | 管理员 |

## 路由保护

- `auth` 中间件：保护 `/workspace`、`/profile`、`/my-works`
- `admin` 中间件：保护 `/admin/**`

## 状态管理

`stores/auth.ts` 管理认证状态：
- `user` / `session` — 当前用户和会话
- `isAuthenticated` / `isAdmin` — 计算属性
- `initialize()` — 从 localStorage 恢复 session
- `login()` / `register(email, password, inviteCode?)` / `logout()`
- `getAuthHeader()` — 返回 `Bearer <token>`

## 服务端工具

```typescript
// 鉴权
import { requireLogin, requireAdmin, writeAuditLog } from '~~/server/utils/auth'

// 速率限制
import { checkRateLimit, getClientIP } from '~~/server/utils/rateLimit'

// 邀请码
import { generateInviteCode, verifyInviteCode } from '~~/server/utils/inviteCode'
```

**注意：** Nuxt 4 server 端 import 别名必须用 `~~/server/utils/*`，不能用 `~/server/utils/*`。

## API 文档

详见 [../doc/API.md](../doc/API.md)
