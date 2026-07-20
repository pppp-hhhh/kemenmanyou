import os
import json
import httpx
import random
import asyncio
import time
import uuid
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
from supabase import create_client, Client
from contextlib import asynccontextmanager

app = FastAPI(title="课文漫游-API")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")

# ================= 1. 配置区 =================

# --- Supabase 配置 ---
SUPABASE_URL = "https://sxxngtcljzwhvajubwno.supabase.co"
SUPABASE_KEY = "sb_publishable_p8dfH6Su7mQ13TeQfqvCRg_dKdQHWqz"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- DeepSeek 配置 ---
DEEPSEEK_API_KEY = "sk-c9ea6887cf524832bcd670fd82ed603e".strip()
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"

# --- ComfyUI 配置 (远程服务器) ---
COMFYUI_API_URL = "http://localhost:8000/prompt"
COMFYUI_OUTPUT_DIR = "../static/comfyui_output"

# --- 本地存储配置 ---
STATIC_DIR = "../static"
TEMP_DIR = "../static/temp"
WORKS_DIR = "../static/works"

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(WORKS_DIR, exist_ok=True)

# ================= 3. 内存任务存储 =================

tasks = {}
semaphore = asyncio.Semaphore(2)  # 最多2个并发

def get_cache_key(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()[:16]

# DeepSeek 缓存 (text_hash -> scenes)
analyze_cache = {}
CACHE_TTL = 86400  # 1天

# ================= 4. Pydantic 模型 =================

class AuthRegisterRequest(BaseModel):
    email: str
    password: str

class AuthLoginRequest(BaseModel):
    email: str
    password: str

class AuthRefreshRequest(BaseModel):
    refresh_token: str

class User(BaseModel):
    id: str
    email: str
    role: str = "user"
    created_at: Optional[str] = None

class AuthSession(BaseModel):
    access_token: str
    refresh_token: str
    user: User
    expires_at: float

class AnalyzeRequest(BaseModel):
    text: str
    style: str = "彩色插画"

class Scene(BaseModel):
    description_cn: str
    prompt_en: str

class AnalyzeResponse(BaseModel):
    scenes: list[Scene]

class GenerateRequest(BaseModel):
    prompts: list[str]
    style: str = "彩色插画"

class GenerateResponse(BaseModel):
    task_id: str

class TaskStatus(BaseModel):
    status: str  # pending | processing | completed | failed
    total: int
    completed: int
    images: list[dict]
    error: Optional[str] = None

class SaveWorkRequest(BaseModel):
    text_id: Optional[int] = None
    custom_title: Optional[str] = None
    custom_content: Optional[str] = None
    thumbnail: Optional[str] = None
    scenes: list[Scene]
    images: list[str]
    style: str
    is_public: bool = False

class SaveWorkResponse(BaseModel):
    work_id: int
    message: str

# ================= 5. 核心逻辑函数 =================

STYLE_PREFIXES = {
    "写实古风": "realistic ancient Chinese style, traditional Chinese painting aesthetic, detailed, historical accuracy,",
    "水墨风格": "Chinese ink painting style, wash painting, sumi-e, black and white, traditional brush strokes,",
    "彩色插画": "colorful illustration, vibrant, modern cartoon style, anime, bright colors,"
}

async def analyze_with_deepseek(text: str, style: str) -> list[Scene]:
    """DeepSeek 分析文本生成场景列表"""
    cache_key = get_cache_key(text + style)

    # 检查缓存
    if cache_key in analyze_cache:
        cached_data, cached_time = analyze_cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            print(f"📦 [DeepSeek] 命中缓存: {cache_key}")
            return cached_data

    print(f"🤖 [DeepSeek] 开始分析文本 (风格: {style})...")

    style_prefix = STYLE_PREFIXES.get(style, STYLE_PREFIXES["彩色插画"])

    style_guide = {
        "写实古风": "写实古风 - 传统中国画美学，工笔重彩，服饰建筑符合历史，色调温润",
        "水墨风格": "水墨风格 - 中国水墨画，留白写意，毛笔笔触，黑白灰层次，禅意悠远",
        "彩色插画": "彩色插画 - 现代动漫风格，色彩鲜艳明亮，线条流畅，视觉冲击强"
    }.get(style, "彩色插画 - 现代动漫风格，色彩鲜艳明亮，线条流畅")

    prompt = f"""你是一个漫画导演。请将以下课文内容转化成漫画分镜。

要求：
1. 根据内容合理划分场景数量，每个重要情节一个场景
2. 每个场景包含：中文描述(description_cn)和英文绘图提示词(prompt_en)
3. 英文提示词要详细，包含场景细节、人物动作、表情等，不要包含风格前缀
4. 风格要求：{style_guide}
5. 只返回JSON格式，不要其他文字

课文内容：
{text}

请按以下JSON格式返回：
{{"scenes": [{{"description_cn": "场景1中文描述", "prompt_en": "scene 1 English prompt"}}, ...]}}
"""

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(DEEPSEEK_URL, json=payload, headers=headers, timeout=60.0)

            if res.status_code != 200:
                print(f"❌ DeepSeek 错误: {res.status_code} - {res.text}")
                raise Exception(f"DeepSeek Error: {res.status_code}")

            content = res.json()['choices'][0]['message']['content'].strip()

            # 尝试解析JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            result = json.loads(content)
            scenes = [Scene(**s) for s in result.get("scenes", [])]

            # 缓存结果
            analyze_cache[cache_key] = (scenes, time.time())

            print(f"✅ [DeepSeek] 生成 {len(scenes)} 个场景")
            return scenes

        except Exception as e:
            print(f"❌ DeepSeek 分析失败: {e}")
            # 返回默认场景
            return [
                Scene(description_cn="课文场景", prompt_en="Manga style, high quality, anime, masterpiece")
            ]


async def generate_single_image(prompt: str, style: str, task_id: str, index: int) -> dict:
    """生成单张图片"""
    async with semaphore:
        print(f"🎨 [Task {task_id}] 开始生成第 {index + 1} 张图片...")

        try:
            # 读取 workflow 模板
            with open("image_z_image_turbo.json", "r", encoding="utf-8") as f:
                workflow = json.load(f)

            # 注入提示词和风格
            full_prompt = f"{STYLE_PREFIXES.get(style, '')} {prompt}"
            workflow["57:27"]["inputs"]["text"] = full_prompt
            workflow["57:3"]["inputs"]["seed"] = random.randint(1, 10**15)

            # 调用 ComfyUI
            async with httpx.AsyncClient() as client:
                res = await client.post(COMFYUI_API_URL, json={"prompt": workflow}, timeout=30.0)

                if res.status_code != 200:
                    raise Exception(f"ComfyUI Error: {res.status_code}")

            # 等待图片生成
            await asyncio.sleep(8)  # 等待 ComfyUI 生成

            # 查找生成的图片
            image_url = f"/static/temp/{task_id}_{index}.png"

            return {"index": index, "url": image_url, "status": "completed"}

        except Exception as e:
            print(f"❌ [Task {task_id}] 第 {index + 1} 张图片生成失败: {e}")
            return {"index": index, "url": "", "status": "failed", "error": str(e)}


async def process_generation(task_id: str, prompts: list[str], style: str):
    """后台处理图片生成"""
    tasks[task_id]["status"] = "processing"

    try:
        # 并发生成图片（最多2个并发）
        results = await asyncio.gather(*[
            generate_single_image(p, style, task_id, i)
            for i, p in enumerate(prompts)
        ])

        # 更新任务状态
        completed = sum(1 for r in results if r["status"] == "completed")
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["completed"] = completed
        tasks[task_id]["images"] = results

        print(f"✅ [Task {task_id}] 完成: {completed}/{len(prompts)} 张图片")

    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
        print(f"❌ [Task {task_id}] 失败: {e}")


# ================= 6. API 路由 =================

# ================= Auth API =================

@app.post("/api/auth/register", response_model=AuthSession)
async def register(request: AuthRegisterRequest):
    """用户注册"""
    try:
        res = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })

        if res.user is None:
            raise HTTPException(status_code=400, detail="注册失败")

        # 获取 session
        session = res.session
        if session is None:
            raise HTTPException(status_code=400, detail="注册成功但无法获取会话")

        # profiles 记录由数据库 trigger on_auth_user_created 自动创建，无需手动 upsert
        # 仅在 trigger 未生效时兜底（避免重发 trigger 已存在的情况）
        try:
            existing = supabase.table("profiles").select("id").eq("id", res.user.id).execute()
            if not existing.data:
                supabase.table("profiles").insert({
                    "id": res.user.id,
                    "email": res.user.email or request.email
                }).execute()
        except Exception as e:
            print(f"⚠️ profiles 兜底创建失败（可能由 trigger 已处理）: {e}")

        return AuthSession(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user=User(
                id=res.user.id,
                email=res.user.email or request.email,
                role="user"
            ),
            expires_at=datetime.now().timestamp() + 3600
        )
    except Exception as e:
        print(f"❌ 注册失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login", response_model=AuthSession)
async def login(request: AuthLoginRequest):
    """用户登录"""
    try:
        res = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        if res.user is None:
            raise HTTPException(status_code=401, detail="登录失败")

        session = res.session
        if session is None:
            raise HTTPException(status_code=401, detail="无法获取会话")

        # 确保 profiles 记录存在（trigger 应已创建，此处为兜底）
        try:
            existing = supabase.table("profiles").select("id").eq("id", res.user.id).execute()
            if not existing.data:
                supabase.table("profiles").insert({
                    "id": res.user.id,
                    "email": res.user.email or request.email
                }).execute()
            # 更新最后登录时间
            supabase.table("profiles").update({
                "last_login_at": datetime.now().isoformat()
            }).eq("id", res.user.id).execute()
        except Exception as e:
            print(f"⚠️ 同步 profiles 记录失败: {e}")

        return AuthSession(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user=User(
                id=res.user.id,
                email=res.user.email or request.email,
                role="user"
            ),
            expires_at=datetime.now().timestamp() + 3600
        )
    except Exception as e:
        print(f"❌ 登录失败: {e}")
        raise HTTPException(status_code=401, detail="邮箱或密码错误")


@app.post("/api/auth/logout")
async def logout():
    """用户登出"""
    try:
        supabase.auth.sign_out()
        return {"status": "success", "message": "已登出"}
    except Exception as e:
        print(f"❌ 登出失败: {e}")
        return {"status": "success", "message": "已登出"}


@app.post("/api/auth/refresh", response_model=AuthSession)
async def refresh(request: AuthRefreshRequest):
    """刷新 Token"""
    try:
        res = supabase.auth.refresh_session({
            "refresh_token": request.refresh_token
        })

        if res.user is None:
            raise HTTPException(status_code=401, detail="刷新失败")

        session = res.session
        if session is None:
            raise HTTPException(status_code=401, detail="无法获取会话")

        return AuthSession(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user=User(
                id=res.user.id,
                email=res.user.email or "",
                role="user"
            ),
            expires_at=datetime.now().timestamp() + 3600
        )
    except Exception as e:
        print(f"❌ 刷新 token 失败: {e}")
        raise HTTPException(status_code=401, detail="刷新失败，请重新登录")


@app.get("/api/auth/me", response_model=User)
async def get_me():
    """获取当前用户信息"""
    try:
        user = supabase.auth.get_user()
        if user.user is None:
            raise HTTPException(status_code=401, detail="未登录")

        return User(
            id=user.user.id,
            email=user.user.email or "",
            role="user"
        )
    except Exception as e:
        print(f"❌ 获取用户信息失败: {e}")
        raise HTTPException(status_code=401, detail="未登录")


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    """分析课文，生成场景列表"""
    if len(request.text) > 3000:
        raise HTTPException(status_code=400, detail="文本长度不能超过3000字")

    scenes = await analyze_with_deepseek(request.text, request.style)
    return AnalyzeResponse(scenes=scenes)


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_images(request: GenerateRequest, background_tasks: BackgroundTasks):
    """提交图片生成任务"""
    task_id = str(uuid.uuid4())[:8]

    tasks[task_id] = {
        "status": "pending",
        "total": len(request.prompts),
        "completed": 0,
        "images": [],
        "error": None
    }

    # 启动后台生成
    background_tasks.add_task(process_generation, task_id, request.prompts, request.style)

    return GenerateResponse(task_id=task_id)


@app.get("/api/task/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """获取任务状态"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks[task_id]
    return TaskStatus(
        status=task["status"],
        total=task["total"],
        completed=task["completed"],
        images=task["images"],
        error=task["error"]
    )


@app.post("/api/works", response_model=SaveWorkResponse)
async def save_work(request: SaveWorkRequest, authorization: Optional[str] = Header(None)):
    """保存作品到 Supabase"""
    try:
        # 从 token 解析 user_id（Python 后端用 anon key，必须显式提取 user_id 写入）
        user_id = None
        author_name = None
        if authorization and authorization.startswith("Bearer "):
            try:
                token = authorization.replace("Bearer ", "")
                # 用 user 而非 admin 拿用户信息
                user_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                user_client.auth.set_session(token, "")
                user_resp = user_client.auth.get_user(token)
                if user_resp and user_resp.user:
                    user_id = user_resp.user.id
                    user_email = user_resp.user.email or ""
                    # 取 display_name 作为作者名
                    try:
                        p = supabase.table("profiles").select("display_name").eq("id", user_id).execute()
                        if p.data:
                            author_name = p.data[0].get("display_name") or user_email.split("@")[0]
                        else:
                            author_name = user_email.split("@")[0]
                    except Exception:
                        author_name = user_email.split("@")[0]
            except Exception as e:
                print(f"⚠️ 解析用户身份失败: {e}")

        insert_data = {
            "title": request.custom_title or f"课文漫画 - {datetime.now().strftime('%Y-%m-%d')}",
            "text_id": request.text_id,
            "custom_content": request.custom_content,
            "thumbnail": request.thumbnail,
            "scenes": [s.model_dump() for s in request.scenes],
            "images": request.images,  # JSONB 列直接传 list
            "style": request.style,
            "is_public": request.is_public,
            "view_count": 0
        }
        if user_id:
            insert_data["user_id"] = user_id
        if author_name:
            insert_data["author_name"] = author_name

        res = supabase.table("works").insert(insert_data).execute()

        work_id = res.data[0].get("id") if res.data else random.randint(1000, 9999)
        return SaveWorkResponse(work_id=work_id, message="作品保存成功")

    except Exception as e:
        print(f"❌ 保存作品失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/works/public")
async def get_public_works():
    """获取公开作品列表（仅审核通过的）"""
    res = (
        supabase.table("works")
        .select("*")
        .eq("is_public", True)
        .eq("review_status", "approved")
        .is_("deleted_at", "null")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data


@app.get("/api/works/{work_id}")
async def get_work(work_id: int):
    """获取作品详情"""
    res = supabase.table("works").select("*").eq("id", work_id).is_("deleted_at", "null").execute()
    if res.data:
        # 原子自增 view_count
        try:
            supabase.rpc("increment_work_view", {"work_id": work_id}).execute()
        except Exception as e:
            print(f"⚠️ view_count 自增失败: {e}")
        return res.data[0]
    raise HTTPException(status_code=404, detail="作品不存在")


@app.get("/api/works/{work_id}/export")
async def export_work(work_id: int):
    """导出作品图片（合并为长图）"""
    from fastapi.responses import FileResponse

    work_dir = os.path.join(WORKS_DIR, str(work_id))
    metadata_path = os.path.join(work_dir, "metadata.json")

    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="作品不存在")

    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    images = metadata.get("images", [])
    if not images:
        raise HTTPException(status_code=400, detail="作品没有图片")

    # 下载并合并图片
    merged_images = []
    width = 512  # 固定宽度

    async with httpx.AsyncClient() as client:
        for img_url in images:
            try:
                # 处理相对路径
                if img_url.startswith("/"):
                    img_url = f"http://localhost:8001{img_url}"

                res = await client.get(img_url, timeout=30.0)
                if res.status_code == 200:
                    from io import BytesIO
                    img = Image.open(BytesIO(res.content))
                    img = img.convert("RGBA")
                    merged_images.append(img)
            except Exception as e:
                print(f"⚠️ 下载图片失败: {img_url} - {e}")
                continue

    if not merged_images:
        raise HTTPException(status_code=400, detail="无法获取任何图片")

    # 计算总高度
    total_height = sum(img.height for img in merged_images)

    # 创建长图
    from io import BytesIO
    merged = Image.new("RGBA", (width, total_height), (255, 255, 255, 255))
    y_offset = 0
    for img in merged_images:
        # 缩放到统一宽度
        ratio = width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((width, new_height), Image.LANCZOS)
        merged.paste(img, (0, y_offset))
        y_offset += new_height

    # 保存到临时文件
    output_path = os.path.join(work_dir, f"export_{work_id}.png")
    merged.convert("RGB").save(output_path, "PNG")

    return FileResponse(output_path, media_type="image/png", filename=f"课文漫画_{work_id}.png")


# ================= 7. 保留原有接口（兼容性） =================

class LessonRequest(BaseModel):
    title: str
    content: str
    user_id: str = None

class AddLessonRequest(BaseModel):
    title: str
    content: str
    user_id: Optional[str] = None

@app.post("/api/lessons")
async def add_lesson(request: AddLessonRequest):
    """添加课文到 Supabase lessons 表（仅课文库，不含状态/图片）"""
    try:
        data = {
            "title": request.title,
            "content": request.content,
        }
        if request.user_id:
            data["user_id"] = request.user_id

        res = supabase.table("lessons").insert(data).execute()
        return {"status": "success", "data": res.data, "message": "课文添加成功"}
    except Exception as e:
        print(f"❌ 添加课文失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-lesson-images")
async def generate_lesson_images(request: LessonRequest):
    """原有接口 - 生成课文图片"""
    # 分析文本
    scenes = await analyze_with_deepseek(request.content, "彩色插画")

    # 生成任务
    task_id = str(uuid.uuid4())[:8]
    prompts = [s.prompt_en for s in scenes]

    tasks[task_id] = {
        "status": "pending",
        "total": len(prompts),
        "completed": 0,
        "images": [],
        "error": None
    }

    # 启动后台生成
    asyncio.create_task(process_generation(task_id, prompts, "彩色插画"))

    return {
        "status": "success",
        "task_id": task_id,
        "ai_prompt": [s.prompt_en for s in scenes],
        "scenes": [s.model_dump() for s in scenes],
        "message": "任务已启动"
    }


class UpdateWorkRequest(BaseModel):
    title: Optional[str] = None
    style: Optional[str] = None
    scenes: Optional[list] = None
    images: Optional[list] = None
    is_public: Optional[bool] = None
    tags: Optional[list] = None
    thumbnail: Optional[str] = None

@app.get("/api/works")
async def get_all_works():
    """获取所有作品（仅未软删除的）"""
    res = supabase.table("works").select("*").is_("deleted_at", "null").order("created_at", desc=True).execute()
    return res.data

@app.put("/api/works/{work_id}")
async def update_work(work_id: int, request: UpdateWorkRequest):
    """更新作品"""
    try:
        update_data = {}
        if request.title is not None:
            update_data["title"] = request.title
        if request.style is not None:
            update_data["style"] = request.style
        if request.scenes is not None:
            update_data["scenes"] = request.scenes
        if request.images is not None:
            update_data["images"] = request.images  # JSONB 列直接传 list
        if request.is_public is not None:
            update_data["is_public"] = request.is_public
        if request.tags is not None:
            update_data["tags"] = request.tags
        if request.thumbnail is not None:
            update_data["thumbnail"] = request.thumbnail

        if not update_data:
            raise HTTPException(status_code=400, detail="没有要更新的字段")

        res = supabase.table("works").update(update_data).eq("id", work_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="作品不存在")
        return {"status": "success", "data": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 更新作品失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/works/{work_id}")
async def delete_work(work_id: int):
    """删除作品（软删除）"""
    try:
        res = supabase.table("works").update({"deleted_at": datetime.now().isoformat()}).eq("id", work_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="作品不存在")
        return {"status": "success", "message": "删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 删除作品失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class UpdateLessonRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    grade: Optional[str] = None
    source: Optional[str] = None

@app.get("/api/lessons")
async def get_all_lessons():
    """获取所有课文（仅未软删除的）"""
    try:
        res = supabase.table("lessons").select("*").is_("deleted_at", "null").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"⚠️ 获取课文列表失败: {e}")
        return []

@app.put("/api/lessons/{lesson_id}")
async def update_lesson(lesson_id: int, request: UpdateLessonRequest):
    """更新课文"""
    try:
        update_data = {}
        if request.title is not None:
            update_data["title"] = request.title
        if request.content is not None:
            update_data["content"] = request.content
        if request.grade is not None:
            update_data["grade"] = request.grade
        if request.source is not None:
            update_data["source"] = request.source

        if not update_data:
            raise HTTPException(status_code=400, detail="没有要更新的字段")

        res = supabase.table("lessons").update(update_data).eq("id", lesson_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="课文不存在")
        return {"status": "success", "data": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 更新课文失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/lessons/{lesson_id}")
async def delete_lesson(lesson_id: int):
    """删除课文（软删除）"""
    try:
        res = supabase.table("lessons").update({"deleted_at": datetime.now().isoformat()}).eq("id", lesson_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="课文不存在")
        return {"status": "success", "message": "删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 删除课文失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ================= 文件上传 =================
from fastapi import UploadFile, File

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """上传图片文件，返回 URL"""
    try:
        # 确保目录存在
        upload_dir = os.path.join(STATIC_DIR, "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        # 生成唯一文件名
        ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(upload_dir, filename)

        # 保存文件
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        return {"url": f"/static/uploads/{filename}"}
    except Exception as e:
        print(f"❌ 上传文件失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
