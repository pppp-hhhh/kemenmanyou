import os
import json
import httpx
import random
import asyncio
import time
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
from supabase import create_client, Client

# --- 初始化 (配置同主程序) ---
SUPABASE_URL = "https://sxxngtcljzwhvajubwno.supabase.co"
SUPABASE_KEY = "sb_publishable_p8dfH6Su7mQ13TeQfqvCRg_dKdQHWqz"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DEEPSEEK_API_KEY = "sk-c9ea6887cf524832bcd670fd82ed603e".strip()
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"

COMFYUI_API_URL = "http://127.0.0.1:8000/prompt"
COMFYUI_OUTPUT_DIR = os.path.join(os.path.expanduser("~"), "Documents", "ComfyUI", "output")
DESKTOP_PATH = os.path.join(os.path.expanduser("~"), "Desktop", "课文漫游长漫")

if not os.path.exists(DESKTOP_PATH):
    os.makedirs(DESKTOP_PATH)

app = FastAPI(title="分镜连排模块")

class MultiRequest(BaseModel):
    title: str
    content: str
    user_id: str = "boss_001"

# ================= 工具函数 =================

async def get_scenes_from_ds(title, content):
    """请求 DeepSeek 返回 3 个分镜提示词"""
    print("🤖 DeepSeek 正在构思分镜...")
    prompt = f"你是一个漫画导演。请将课文《{title}》的内容“{content}”拆分成3个分镜。返回JSON数组格式:['英文提示词1','英文提示词2','英文提示词3']。只要英文描述，Manga style。"
    
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"} 
    }

    async with httpx.AsyncClient(proxy=None) as client:
        res = await client.post(DEEPSEEK_URL, json=payload, headers=headers, timeout=30)
        raw = res.json()['choices'][0]['message']['content']
        try:
            data = json.loads(raw)
            return (data if isinstance(data, list) else list(data.values())[0])[:3]
        except:
            return [s.strip() for s in re.findall(r'"([^"]*)"', raw) if len(s)>10][:3]

def combine_images(paths, text):
    """物理拼接图片并压字幕"""
    print("叠图中...")
    imgs = [Image.open(p) for p in paths]
    w = imgs[0].width
    h = sum(i.height for i in imgs)
    
    combined = Image.new('RGB', (w, h))
    y = 0
    for i in imgs:
        combined.paste(i, (0, y))
        y += i.height
        
    # 压字幕
    draw = ImageDraw.Draw(combined, "RGBA")
    try: font = ImageFont.truetype("simhei.ttf", 45)
    except: font = ImageFont.load_default()
    
    rect_h = 150
    draw.rectangle([0, h-rect_h, w, h], fill=(0,0,0,180))
    draw.text((50, h-rect_h+40), text[:40]+"...", font=font, fill=(255,255,255))
    
    out = os.path.join(DESKTOP_PATH, f"长漫_{int(time.time())}.png")
    combined.save(out)
    return out

async def monitor_and_stitch(task_id, original_text):
    """监视 ComfyUI 生成，攒齐 3 张就拼图"""
    captured = []
    print("🎬 拼图监视器已就绪...")
    
    for _ in range(60): # 5分钟窗口
        await asyncio.sleep(5)
        files = [os.path.join(COMFYUI_OUTPUT_DIR, f) for f in os.listdir(COMFYUI_OUTPUT_DIR)]
        # 找 15秒内 的新图
        news = [f for f in files if (time.time()-os.path.getctime(f) < 15) and f not in captured]
        
        for f in news:
            captured.append(f)
            print(f"🚩 捕获分镜 {len(captured)}/3")
            if len(captured) == 3: break
        if len(captured) == 3: break
            
    if len(captured) == 3:
        captured.sort(key=os.path.getctime)
        final_file = combine_images(captured, original_text)
        # 改用 lesson_tasks 表（与 lessons 解耦）
        from datetime import datetime
        supabase.table("lesson_tasks").update({
            "image_url": final_file,
            "status": "completed",
            "completed_at": datetime.now().isoformat()
        }).eq("id", task_id).execute()
        print("🏆 长漫合成完毕！")
    else:
        # 超时未集齐 3 张，标记失败
        supabase.table("lesson_tasks").update({
            "status": "failed",
            "error_message": f"仅捕获 {len(captured)}/3 张分镜",
            "completed_at": datetime.now().isoformat()
        }).eq("id", task_id).execute()
        print(f"❌ 长漫合成失败：仅 {len(captured)}/3 张")

# ================= 接口 =================

@app.post("/api/stitch-story")
async def stitch_story(req: MultiRequest):
    from datetime import datetime
    # 1. 初始入库到 lesson_tasks（不再污染 lessons 课文库）
    insert_data = {
        "title": req.title,
        "content": req.content,
        "status": "splitting",
        "started_at": datetime.now().isoformat()
    }
    if req.user_id and req.user_id != "boss_001":
        try:
            insert_data["user_id"] = req.user_id
        except Exception:
            pass  # user_id 不是合法 UUID 时跳过

    res = supabase.table("lesson_tasks").insert(insert_data).execute()
    tid = res.data[0]['id']

    # 2. 获取分镜
    scenes = await get_scenes_from_ds(req.title, req.content)

    # 3. 循环喂给 ComfyUI
    with open("image_z_image_turbo.json", "r", encoding="utf-8") as f:
        wf = json.load(f)

    for s_prompt in scenes:
        wf["57:27"]["inputs"]["text"] = s_prompt
        wf["57:3"]["inputs"]["seed"] = random.randint(1, 999999)
        async with httpx.AsyncClient() as c:
            await c.post(COMFYUI_API_URL, json={"prompt": wf})
        await asyncio.sleep(3) # 缓冲

    # 4. 异步拼图
    asyncio.create_task(monitor_and_stitch(tid, req.content))
    return {"msg": "分镜已发送，请等待拼图", "scenes": scenes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002) # 注意：换个端口 8002
