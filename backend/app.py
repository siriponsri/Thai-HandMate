#!/usr/bin/env python3
"""
Thai-HandMate Backend API
FastAPI application สำหรับสร้างประโยคไทยด้วย Typhoon LLM
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import json
import httpx
from dotenv import load_dotenv

# โหลด environment variables
load_dotenv()

app = FastAPI(
    title="Thai-HandMate Backend",
    description="API สำหรับสร้างประโยคไทยจากคำภาษามือ",
    version="1.0.0"
)

# ตั้งค่า CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# การตั้งค่า
TYPHOON_API_KEY = os.getenv('TYPHOON_API_KEY', '')
TYPHOON_API_BASE = os.getenv('TYPHOON_API_BASE', 'https://api.typhoon.io/v1/chat/completions')

# Models
class GenerateRequest(BaseModel):
    words: List[str]
    emotion: str = "neutral"  # เพิ่มข้อมูลอารมณ์

class GenerateResponse(BaseModel):
    sentences: List[str]
    provider: str

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """ตรวจสอบสถานะ API"""
    return {
        "status": "ok",
        "service": "thai-handmate-backend",
        "version": "1.0.0",
        "has_api_key": bool(TYPHOON_API_KEY)
    }

# Generate sentences endpoint
@app.post("/api/generate", response_model=GenerateResponse)
async def generate_sentences(request: GenerateRequest):
    """สร้างประโยคไทยจากรายการคำ"""
    
    if not request.words:
        raise HTTPException(status_code=400, detail="ต้องระบุคำอย่างน้อย 1 คำ")
    
    words_text = " ".join(request.words)
    
    # ลองใช้ Typhoon API ก่อน
    if TYPHOON_API_KEY:
        try:
            sentences = await generate_with_typhoon(request.words, request.emotion)
            return GenerateResponse(sentences=sentences, provider="typhoon")
        except Exception as e:
            print(f"[ERROR] Typhoon API ไม่สามารถใช้งานได้: {e}")
            # ถ้า API ไม่ได้ ใช้ fallback
    
    # Fallback: สร้างประโยคแบบง่าย
    fallback_sentences = generate_fallback_sentences(words_text)
    return GenerateResponse(sentences=fallback_sentences, provider="fallback")

async def generate_with_typhoon(words: List[str], emotion: str = "neutral") -> List[str]:
    """สร้างประโยคด้วย Typhoon LLM"""
    
    # สร้าง JSON สำหรับข้อมูลภาษามือและอารมณ์
    words_json = json.dumps({
        "words": words,
        "emotion": emotion
    }, ensure_ascii=False)
    
    # Prompt ใหม่ตามที่คุณระบุ
    system_prompt = """คุณเป็นผู้ช่วย AI ที่เชี่ยวชาญภาษาไทยและภาษามือไทย ให้สร้างประโยคไทยที่เป็นธรรมชาติ ถูกต้องตามหลักภาษา และใช้ในชีวิตประจำวันได้จริง"""

    user_prompt = f"""จากข้อมูลภาษามือไทยและอารมณ์เหล่านี้: {words_json}

กรุณาสร้างประโยคไทยที่เป็นธรรมชาติ 3 ประโยค โดย:
- ใช้คำภาษามือที่ให้มาทั้งหมดหรือส่วนใหญ่
- พิจารณาอารมณ์ที่ตรวจพบเพื่อให้ประโยคสอดคล้องกับบริบท
- เป็นประโยคที่คนไทยใช้จริงในชีวิตประจำวัน
- ถูกต้องตามหลักไวยากรณ์ไทย
- สื่อความหมายได้ชัดเจน
- เรียงคำต่อกันเป็นประโยคภาษาไทยที่สมบูรณ์ที่สุด

ตอบเป็นรายการประโยคเท่านั้น เช่น:
1. [ประโยคที่ 1]
2. [ประโยคที่ 2] 
3. [ประโยคที่ 3]"""

    payload = {
        "model": "typhoon-v2.1-12b-instruct",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 700,
        "temperature": 0.5
    }

    headers = {
        "Authorization": f"Bearer {TYPHOON_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            TYPHOON_API_BASE,
            json=payload,
            headers=headers,
            timeout=30.0
        )
        
        if response.status_code != 200:
            raise Exception(f"API Error: {response.status_code}")
        
        data = response.json()
        content = data['choices'][0]['message']['content']
        
        # แปลงการตอบกลับเป็นรายการประโยค
        sentences = []
        for line in content.strip().split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                # ลบหมายเลข หรือ bullet points
                clean_line = line.lstrip('123456789.- ')
                if clean_line:
                    sentences.append(clean_line)
        
        return sentences[:3]  # เอาแค่ 3 ประโยคแรก

def generate_fallback_sentences(words_text: str) -> List[str]:
    """สร้างประโยคแบบ fallback เมื่อ API ไม่พร้อมใช้งาน"""
    
    # ประโยคพื้นฐาน
    basic = words_text
    
    # เพิ่มคำสุภาพ
    polite = f"{words_text} ครับ/ค่ะ"
    
    # เพิ่มบริบท
    contextual = f"ฉันต้องการสื่อว่า {words_text}"
    
    return [basic, polite, contextual]

# รันเซิร์ฟเวอร์
if __name__ == "__main__":
    import uvicorn
    
    print("[INFO] เริ่มต้น Thai-HandMate Backend...")
    print("[API] พร้อมใช้งานที่: http://localhost:8000")
    print("[DOCS] API Docs: http://localhost:8000/docs")
    print(f"[KEY] มี API Key: {'YES' if TYPHOON_API_KEY else 'NO (จะใช้ fallback)'}")
    
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )
