# 课文漫游 - AI 驱动的语文可视化平台

将语文课文自动转化为漫画的 AI 学习工具。

## 功能

- **AI 漫画生成**：输入课文 → DeepSeek 分析场景 → SenseNova U1 Fast 生成漫画
- **三种画风**：写实古风、水墨风格、彩色插画
- **场景编辑**：增删、移动、修改中文描述
- **边生成边预览**：图片逐步返回，无需等待全部完成
- **作品保存**：云端保存 / 下载导出长图
- **用户系统**：注册登录、个人作品管理
- **审核机制**：作品公开需管理员审核
- **管理后台**：作品/课文/用户/审计日志/邀请码管理
- **邀请码注册**：HMAC 签名 + 自带过期，管理员可生成管理员邀请码

## 用户角色

| 角色 | 权限 |
|------|------|
| 普通用户 | 登录/注册、管理自己的作品、申请公开 |
| 管理员 | 审核公开申请、管理所有作品和课文、管理用户、查看审计日志、生成邀请码 |

## 技术栈

| 前端 | 服务端 | AI 后端 |
|------|--------|---------|
| Nuxt 4 + Vue 3 | Nuxt Server Routes (Nitro) | FastAPI + Uvicorn (端口 8001) |
| Pinia | 直接调用 Supabase | DeepSeek API |
| Tailwind CSS | JWT 鉴权 + 速率限制 + 审计日志 | SenseNova U1 Fast（商汤日日新） |
| TypeScript | HMAC 邀请码 | Python 3.10 |

## 架构

```
┌──────────────────────────────────────────┐
│   浏览器 (Nuxt 4 前端)                    │
│   Vue 3 + Pinia + Tailwind               │
└────────────────┬─────────────────────────┘
                 │ HTTP
                 ▼
┌──────────────────────────────────────────┐
│   Nuxt Server Routes (app/server/)       │
│   ┌────────────┐  ┌─────────────────┐    │
│   │ /api/auth  │  │ /api/admin/*    │    │
│   │ /api/works │  │ /api/lessons    │    │
│   └─────┬──────┘  └────────┬────────┘    │
│         │ 直接调用          │ 代理转发     │
└─────────┼──────────────────┼─────────────┘
          │                  │
          ▼                  ▼
┌─────────────────┐  ┌────────────────────┐
│   Supabase      │  │  Python FastAPI    │
│   PostgreSQL    │  │  (端口 8001)        │
│   + Auth + RLS  │  │  /api/analyze      │
│   + 5 个视图     │  │  /api/generate     │
│   + RPC 函数    │  │  /api/task/{id}    │
└─────────────────┘  │  /api/upload       │
                     │  /api/works (保存)  │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │  DeepSeek +         │
                     │  SenseNova U1 Fast  │
                     └────────────────────┘
```

**职责划分：**

- **Nuxt Server Routes** 处理：认证、用户管理、作品/课文 CRUD、管理员操作、审计日志、邀请码、浏览历史 — 本地 JSON 存储（`app/server/utils/local-db.ts`，库文件 `data/app.db.json`）
- **Python FastAPI** 处理：AI 分析（供应商可切换）、图片生成、任务轮询、文件上传、长图导出

## 快速开始

### 1. 配置环境变量

统一配置文件：根目录 `.env`（已 gitignore；Nuxt 经 `pnpm dev` 内置的 `--dotenv ../.env` 读取，Python 经 `config.py` 自动加载）：
```env
# —— Nuxt 端 ——
PYTHON_BACKEND_URL=http://127.0.0.1:8001
INVITE_CODE_SECRET=your-random-secret    # 邀请码签名密钥（>=16 字符）
AUTH_SECRET=your-random-secret           # 登录令牌签名密钥
# —— Python 端 ——
ANALYZE_PROVIDER=sensenova               # 或 deepseek / openai / openrouter / custom
SENSE_NOVA_API_KEY=sk-xxxx
SENSE_NOVA_BASE_URL=https://token.sensenova.cn/v1
SENSE_NOVA_IMAGE_MODEL=sensenova-u1-fast
SENSE_NOVA_IMAGE_SIZE=2048x2048
SENSE_NOVA_WATERMARK=false               # false=无水印（公测免费）
SENSE_NOVA_CHAT_MODEL=deepseek-v4-flash  # 文本分析模型
DEEPSEEK_API_KEY=sk-xxxx                 # ANALYZE_PROVIDER=deepseek 时使用
```

> 数据库首次运行自动创建（`data/app.db.json`）；`init_supabase.sql` 仅作日后回迁云端参考，无需执行。

### 3. 启动后端（Python FastAPI，端口 8001）

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

无需本地 ComfyUI，图像由 SenseNova U1 Fast 云端接口生成。

### 4. 启动前端（Nuxt，端口 3000）

```bash
cd app
pnpm install
pnpm dev
```

访问 http://localhost:3000

### 5. 创建第一个管理员

- 方式 A：在 Supabase Dashboard Auth 中手动注册用户，再把对应 `profiles.role` 改为 `'admin'`
- 方式 B：让已管理员在 `/admin/invite-codes` 生成邀请码 → 新用户在 `/register` 填入邀请码注册即自动成为管理员

## 项目结构

```
kemenmanyou/
├── app/                            # Nuxt 4 项目
│   ├── app/                        # Vue 应用
│   │   ├── pages/
│   │   │   ├── admin/              # 管理后台
│   │   │   │   ├── index.vue       # 仪表盘（图表+最近操作）
│   │   │   │   ├── works.vue       # 作品管理
│   │   │   │   ├── lessons.vue     # 课文管理
│   │   │   │   ├── users.vue       # 用户管理（搜索/封禁/分页）
│   │   │   │   ├── audit.vue       # 审计日志
│   │   │   │   └── invite-codes.vue # 邀请码生成
│   │   │   ├── watch/[id].vue      # 观看页
│   │   │   ├── workspace.vue       # 工作台
│   │   │   ├── gallery.vue         # 展示广场
│   │   │   ├── login.vue
│   │   │   ├── register.vue        # 注册（支持邀请码）
│   │   │   ├── my-works.vue
│   │   │   └── profile.vue
│   │   ├── stores/                 # Pinia (auth, workspace)
│   │   ├── middleware/             # auth, admin
│   │   └── types/                  # api.ts, auth.ts
│   └── server/                     # Nuxt Server Routes
│       ├── api/
│       │   ├── auth/               # login/register/logout/refresh/me/verify-invite
│       │   ├── admin/              # stats/works/users/lessons/audit/invite-codes
│       │   ├── works/              # CRUD + my + public + export
│       │   ├── lessons/            # CRUD
│       │   ├── analyze.post.ts     # 代理到 Python
│       │   ├── generate.post.ts    # 代理到 Python
│       │   └── task/[taskId].get.ts # 代理到 Python
│       └── utils/
│           ├── auth.ts             # requireLogin/requireAdmin/writeAuditLog
│           ├── rateLimit.ts        # 速率限制
│           └── inviteCode.ts       # HMAC 邀请码生成/验证
├── server/                         # Python FastAPI 后端
│   ├── main.py                     # 主入口
│   ├── multi_stitcher.py           # 长漫拼接
│   ├── image_z_image_turbo.json    # ComfyUI 工作流（multi_stitcher 使用）
│   └── requirements.txt
├── doc/API.md                      # API 文档
├── init_supabase.sql               # 数据库初始化
└── README.md
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

## 数据库

7 张表（详见 `init_supabase.sql`）：

| 表 | 说明 |
|---|---|
| `profiles` | 用户资料（关联 auth.users，含 role/status） |
| `lessons` | 课文库（title/content/grade/source） |
| `lesson_tasks` | 长漫任务（pending/splitting/completed/failed） |
| `works` | 作品（含 review_status/author_name/tags） |
| `work_images` | 作品图片 |
| `work_scenes` | 作品场景 |
| `audit_logs` | 审计日志（admin_id/action/target_type/target_id/detail） |

5 个视图：`work_stats` / `lesson_stats` / `user_stats` / `lesson_task_stats` / `admin_stats_view`

关键 RPC：`get_current_user()` / `write_audit_log()` / `increment_work_view()`

## 安全特性

- **JWT 鉴权**：所有需登录接口通过 Supabase Auth 验证 Bearer token
- **RLS 行级安全**：所有表配置 RLS 策略
- **速率限制**：登录接口每 IP 每分钟 5 次
- **封禁机制**：`profiles.status='banned'` 用户无法登录或调用接口
- **软删除**：`deleted_at` 字段 + BEFORE DELETE 触发器
- **审计日志**：所有管理员操作记录到 `audit_logs`
- **邀请码签名**：HMAC-SHA256 + 过期 + 常量时间比较防时序攻击

## API

详见 [doc/API.md](doc/API.md)

## 开发

```bash
# 前端开发
cd app && pnpm dev

# 后端开发
cd server && uvicorn main:app --reload --port 8001

# 前端构建
cd app && pnpm build

# 后端生产
cd server && gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```
