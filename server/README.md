# 课文漫游 - Python FastAPI 后端

AI 后端服务，处理课文分析、图片生成、任务轮询、文件上传。**端口 8001**。

> **注意：** 认证、用户管理、作品/课文 CRUD、管理员操作由 Nuxt Server Routes 直接调用 Supabase 处理，不在本服务。本服务仅负责 AI 相关功能 + 作品保存（写入 Supabase）。

## 技术栈

- **框架**: Python 3.10 + FastAPI + Uvicorn
- **AI**: DeepSeek API（课文分析与分镜）
- **图像生成**: ComfyUI + SD1.5 + LCM LoRA
- **数据库**: Supabase (PostgreSQL)，使用 anon key
- **任务队列**: 内存 dict + `BackgroundTasks`（无 Celery）

## 安装

```bash
pip install -r requirements.txt
```

## 配置

创建 `server.env`：
```env
DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
COMFYUI_API_URL=http://localhost:8000/prompt
```

或在 `main.py` 顶部直接修改配置（开发环境）。

## 启动

```bash
# 开发
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# 生产
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001
```

Swagger 文档：http://localhost:8001/docs

需要 ComfyUI 运行在 8000 端口。

## 实际暴露的接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/analyze` | DeepSeek 分析课文 → 场景列表 |
| POST | `/api/generate` | 提交生成任务（后台执行） |
| GET | `/api/task/{task_id}` | 查询任务状态 |
| POST | `/api/works` | 保存作品（写 Supabase + 静态文件） |
| GET | `/api/works` | 所有作品（直查 Supabase） |
| GET | `/api/works/public` | 公开作品 |
| GET/PUT/DELETE | `/api/works/{work_id}` | 作品操作 |
| GET | `/api/works/{work_id}/export` | 导出长图 |
| GET/POST | `/api/lessons` | 课文操作 |
| PUT/DELETE | `/api/lessons/{lesson_id}` | 课文操作 |
| POST | `/api/upload` | 上传图片 |
| POST | `/api/auth/*` | 兼容旧接口（建议用 Nuxt 路由） |
| POST | `/api/generate-lesson-images` | 兼容旧接口 |

## 画风

| 画风 | Prompt 前缀 |
|------|-----------|
| 写实古风 | `realistic ancient Chinese style, traditional Chinese painting aesthetic, detailed, historical accuracy,` |
| 水墨风格 | `Chinese ink painting style, wash painting, sumi-e, black and white, traditional brush strokes,` |
| 彩色插画 | `colorful illustration, vibrant, modern cartoon style, anime, bright colors,` |

## 任务状态

```
pending → processing → completed
                   ↘ failed
```

内存级存储（`tasks` dict），重启后丢失。

## 鉴权

本服务不验证 JWT，仅从 `Authorization` header 解析 user_id 写入 `works.user_id`。**真正的鉴权由 Nuxt Server Routes 处理。**

## 关键约束

- **文本长度**：分析接口 ≤3000 字符
- **场景数**：每个作品最多 30 个场景
- **并发**：图片生成最多 2 个并发（`asyncio.Semaphore(2)`）
- **DeepSeek 缓存**：相同 text+style 缓存 1 天（内存级）
- **临时图片**：`./static/temp/{task_id}_{index}.png`，任务完成 1 小时后清理
- **作品图片**：`./static/works/{work_id}/`，永久保存

## 文件

| 文件 | 用途 |
|------|------|
| `main.py` | FastAPI 主程序 |
| `multi_stitcher.py` | 长漫拼接模块（用于 lesson_tasks） |
| `image_z_image_turbo.json` | ComfyUI 工作流模板 |
| `requirements.txt` | Python 依赖 |

## 审查流程

```
用户提交公开申请（is_public=true）→ review_status='pending'
        ↓
管理员审查（在 Nuxt 端 /api/admin/works/* 处理）
        ↓
   批准 → review_status='approved' → 展示广场可见
   拒绝 → review_status='rejected' → 用户可见拒绝原因
```

## API 文档

完整 API 文档详见 [../doc/API.md](../doc/API.md)
