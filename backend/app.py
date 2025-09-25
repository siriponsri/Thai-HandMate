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
import time
import queue
import threading
import asyncio
from dotenv import load_dotenv

# โหลด environment variables
load_dotenv()

# Rate Limiting System
class TyphoonAPIRateLimiter:
    def __init__(self, requests_per_minute=10):
        self.requests_per_minute = requests_per_minute
        self.interval = 60 / requests_per_minute  # วินาทีระหว่างการ request
        self.last_request_time = 0
        self.request_queue = queue.Queue()
        self.lock = threading.Lock()
        self.is_processing = False
        
    async def make_request_async(self, payload, headers, timeout=30.0):
        """ทำ API request แบบ async พร้อม rate limiting"""
        
        # ตรวจสอบ rate limit
        current_time = time.time()
        with self.lock:
            time_since_last = current_time - self.last_request_time
            
            if time_since_last < self.interval:
                sleep_time = self.interval - time_since_last
                await asyncio.sleep(sleep_time)
            
            self.last_request_time = time.time()
        
        # ทำ API request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TYPHOON_API_BASE,
                json=payload,
                headers=headers,
                timeout=timeout
            )
            return response

# สร้าง rate limiter instance
typhoon_limiter = TyphoonAPIRateLimiter(requests_per_minute=10)  # 10 requests ต่อนาที

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
class LLMData(BaseModel):
    """ข้อมูลแบบ LLM format จาก frontend"""
    signLanguage: dict = {}
    emotion: dict = {}
    face: dict = {}
    context: dict = {}

class UnifiedRequest(BaseModel):
    """Request format ใหม่จาก unified processor"""
    capturedData: List[LLMData] = []
    summary: dict = {}

class GenerateRequest(BaseModel):
    """Request format เดิม (สำหรับ backward compatibility)"""
    words: List[str]
    emotion: str = "neutral"  # อารมณ์หลัก
    wordConfidences: List[float] = []  # ค่า confidence ของแต่ละคำ
    emotionConfidences: List[float] = []  # ค่า confidence ของอารมณ์

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
async def generate_sentences(request: dict):
    """สร้างประโยคไทยจากรายการคำ (รองรับทั้ง format เก่าและใหม่)"""
    
    # ตรวจสอบ format ของ request
    if "capturedData" in request and "summary" in request:
        # Format ใหม่จาก unified processor
        unified_req = UnifiedRequest(**request)
        
        # แปลงเป็น format เดิม
        words = unified_req.summary.get("words", [])
        emotion = unified_req.summary.get("overallEmotion", "neutral")
        
        # รวบรวม confidence จากทุกภาพ
        word_confidences = []
        emotion_confidences = []
        
        for capture in unified_req.capturedData:
            if capture.signLanguage:
                word_confidences.append(capture.signLanguage.get("confidence", 0))
            if capture.emotion:
                emotion_confidences.append(capture.emotion.get("confidence", 0))
    else:
        # Format เดิม
        gen_req = GenerateRequest(**request)
        words = gen_req.words
        emotion = gen_req.emotion
        word_confidences = gen_req.wordConfidences
        emotion_confidences = gen_req.emotionConfidences
    
    if not words:
        raise HTTPException(status_code=400, detail="ต้องระบุคำอย่างน้อย 1 คำ")
    
    # ลองใช้ Typhoon API ก่อน
    if TYPHOON_API_KEY:
        try:
            # ถ้ามี unified data ให้ส่งไปด้วย
            if "capturedData" in request:
                sentences = await generate_with_typhoon_unified(
                    unified_req.capturedData,
                    unified_req.summary
                )
            else:
                sentences = await generate_with_typhoon(
                    words, 
                    emotion, 
                    word_confidences, 
                    emotion_confidences
                )
            return GenerateResponse(sentences=sentences, provider="typhoon")
        except Exception as e:
            error_msg = str(e)
            if "Rate limit exceeded" in error_msg:
                print("[WARNING] Rate limit exceeded - using fallback")
            elif "Timeout" in error_msg:
                print("[WARNING] API Timeout - using fallback")
            else:
                print(f"[ERROR] Typhoon API failed: {e}")
            # If API fails, use fallback
    
    # Fallback: สร้างประโยคแบบง่าย
    fallback_sentences = generate_fallback_sentences(words, emotion, word_confidences)
    return GenerateResponse(sentences=fallback_sentences, provider="fallback")

async def generate_with_typhoon(words: List[str], emotion: str = "neutral", word_confidences: List[float] = None, emotion_confidences: List[float] = None) -> List[str]:
    """สร้างประโยคด้วย Typhoon LLM"""
    
    # สร้าง JSON สำหรับข้อมูลภาษามือและอารมณ์ (รวม confidence)
    data_for_llm = {
        "words": words,
        "emotion": emotion
    }
    
    # เพิ่ม confidence หากมี
    if word_confidences:
        data_for_llm["wordConfidences"] = word_confidences
    if emotion_confidences:
        data_for_llm["emotionConfidences"] = emotion_confidences
    
    words_json = json.dumps(data_for_llm, ensure_ascii=False)
    
    # Prompt ใหม่ตามที่คุณระบุ
    system_prompt = """คุณเป็นผู้ช่วย AI ที่เชี่ยวชาญภาษาไทยและภาษามือไทย ให้สร้างประโยคไทยที่เป็นธรรมชาติ ถูกต้องตามหลักภาษา และใช้ในชีวิตประจำวันได้จริง"""

    # ตรวจสอบว่าเป็น unknown หรือไม่
    is_unknown = all(word.lower() == "unknown" for word in words)
    
    if is_unknown:
        user_prompt = f"""จากข้อมูลภาษามือไทยและอารมณ์เหล่านี้: {words_json}

ระบบไม่สามารถจดจำภาษามือได้ (Unknown) แต่ตรวจพบอารมณ์เป็น {emotion}

กรุณาสร้างประโยคไทยที่แสดงอารมณ์ {emotion} จำนวน 3 ประโยค โดย:
- สื่อถึงอารมณ์ที่ตรวจพบได้อย่างชัดเจน
- เป็นประโยคทั่วไปที่ใช้แสดงอารมณ์นั้นๆ
- เหมาะสมกับการสื่อสารด้วยภาษามือ
- ใช้คำพูดที่สุภาพและเป็นมิตร

ตัวอย่างถ้าอารมณ์เป็น happy: "วันนี้อากาศดีจัง", "ดีใจที่ได้เจอกัน", "มีความสุขมากเลย"

ตอบเป็นรายการประโยคเท่านั้น เช่น:
1. [ประโยคที่ 1]
2. [ประโยคที่ 2] 
3. [ประโยคที่ 3]"""
    else:
        user_prompt = f"""จากข้อมูลภาษามือไทยและอารมณ์เหล่านี้: {words_json}

กรุณาสร้างประโยคไทยที่เป็นธรรมชาติ 3 ประโยค โดย:
- ใช้คำภาษามือที่ให้มาทั้งหมดหรือส่วนใหญ่
- พิจารณาอารมณ์ที่ตรวจพบเพื่อให้ประโยคสอดคล้องกับบริบท
- เป็นประโยคที่คนไทยใช้จริงในชีวิตประจำวัน
- ถูกต้องตามหลักไวยากรณ์ไทย
- สื่อความหมายได้ชัดเจน
- เรียงคำต่อกันเป็นประโยคภาษาไทยที่สมบูรณ์ที่สุด
- หากมีคำว่า Unknown ให้ข้ามไปและใช้คำอื่นๆที่มี

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

    try:
        # ใช้ rate limiter สำหรับการ request
        response = await typhoon_limiter.make_request_async(payload, headers, timeout=30.0)
        
        if response.status_code == 429:  # Too Many Requests
            print("[WARNING] Rate limit exceeded, waiting...")
            await asyncio.sleep(5)  # Wait 5 seconds and retry
            response = await typhoon_limiter.make_request_async(payload, headers, timeout=30.0)
        
        if response.status_code != 200:
            raise Exception(f"API Error: {response.status_code} - {response.text}")
        
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
        
    except httpx.TimeoutException:
        raise Exception("API Timeout - request took too long")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise Exception("Rate limit exceeded - please try again later")
        raise Exception(f"HTTP Error: {e.response.status_code}")
    except Exception as e:
        raise Exception(f"API Request Failed: {str(e)}")

async def generate_with_typhoon_unified(captured_data: List[LLMData], summary: dict) -> List[str]:
    """สร้างประโยคด้วย Typhoon LLM จาก unified data format"""
    
    # สร้าง JSON สำหรับข้อมูลทั้งหมด
    data_for_llm = {
        "captures": [
            {
                "word": cap.signLanguage.get("bestWord", "Unknown"),
                "wordConfidence": cap.signLanguage.get("confidence", 0),
                "emotion": cap.emotion.get("emotion", "neutral"),
                "emotionConfidence": cap.emotion.get("confidence", 0),
                "faceDetected": cap.face.get("detected", False),
                "faceCount": cap.face.get("faceCount", 0)
            }
            for cap in captured_data
        ],
        "summary": summary
    }
    
    data_json = json.dumps(data_for_llm, ensure_ascii=False)
    
    # Prompt พิเศษสำหรับ unified data
    system_prompt = """คุณเป็นผู้ช่วย AI ที่เชี่ยวชาญภาษาไทยและภาษามือไทย ให้สร้างประโยคไทยที่เป็นธรรมชาติ ถูกต้องตามหลักภาษา และใช้ในชีวิตประจำวันได้จริง

คุณจะได้รับข้อมูลที่มีทั้งภาษามือ อารมณ์ใบหน้า และการตรวจจับใบหน้า พร้อมค่าความมั่นใจ ให้พิจารณาข้อมูลทั้งหมดเพื่อสร้างประโยคที่เหมาะสม"""

    user_prompt = f"""จากข้อมูลการจับภาพภาษามือไทยและการแสดงออกทางใบหน้า: {data_json}

กรุณาวิเคราะห์ข้อมูลทั้งหมดและสร้างประโยคไทยที่เป็นธรรมชาติ 3 ประโยค โดย:
- พิจารณาลำดับคำภาษามือที่จับได้ตามลำดับเวลา
- พิจารณาค่าความมั่นใจ (confidence) ของแต่ละคำ
- พิจารณาอารมณ์ที่ตรวจพบในแต่ละภาพ
- สร้างประโยคที่สอดคล้องกับบริบทและอารมณ์
- เป็นประโยคที่คนไทยใช้จริงในชีวิตประจำวัน
- ถูกต้องตามหลักไวยากรณ์ไทย

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

    try:
        # ใช้ rate limiter สำหรับการ request
        response = await typhoon_limiter.make_request_async(payload, headers, timeout=30.0)
        
        if response.status_code == 429:  # Too Many Requests
            print("[WARNING] Rate limit exceeded, waiting...")
            await asyncio.sleep(5)  # Wait 5 seconds and retry
            response = await typhoon_limiter.make_request_async(payload, headers, timeout=30.0)
        
        if response.status_code != 200:
            raise Exception(f"API Error: {response.status_code} - {response.text}")
        
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
        
    except httpx.TimeoutException:
        raise Exception("API Timeout - request took too long")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise Exception("Rate limit exceeded - please try again later")
        raise Exception(f"HTTP Error: {e.response.status_code}")
    except Exception as e:
        raise Exception(f"API Request Failed: {str(e)}")

def generate_fallback_sentences(words: List[str], emotion: str = "neutral", word_confidences: List[float] = None) -> List[str]:
    """สร้างประโยคแบบ fallback เมื่อ API ไม่พร้อมใช้งาน"""
    
    words_text = " ".join(words)
    
    # เลือกคำที่มี confidence สูงที่สุด (หากมีข้อมูล)
    if word_confidences and len(word_confidences) == len(words):
        # จับคู่คำกับ confidence
        word_conf_pairs = list(zip(words, word_confidences))
        # เรียงตาม confidence จากสูงไปต่ำ
        word_conf_pairs.sort(key=lambda x: x[1], reverse=True)
        # เอาคำที่มี confidence สูงสุด 2-3 คำ
        high_conf_words = [word for word, conf in word_conf_pairs[:3] if conf > 0.5]
        if high_conf_words:
            words_text = " ".join(high_conf_words)
    
    # ปรับประโยคตามอารมณ์
    emotion_suffix = ""
    if emotion == "happy":
        emotion_suffix = " 😊"
    elif emotion == "sad":
        emotion_suffix = " 😢"
    elif emotion == "angry":
        emotion_suffix = " 😠"
    
    # ตรวจสอบว่าเป็น unknown หรือไม่
    is_unknown = all(word.lower() == "unknown" for word in words)
    
    if is_unknown:
        # ประโยคตามอารมณ์สำหรับ unknown
        if emotion == "happy":
            return [
                "ดีใจมากเลยครับ/ค่ะ 😊",
                "มีความสุขจังเลย 😊",
                "วันนี้อารมณ์ดีมากครับ/ค่ะ 😊"
            ]
        elif emotion == "sad":
            return [
                "เศร้าใจนิดหน่อยครับ/ค่ะ 😢",
                "รู้สึกไม่ค่อยดีเท่าไหร่ 😢",
                "วันนี้ใจไม่ค่อยดีครับ/ค่ะ 😢"
            ]
        elif emotion == "angry":
            return [
                "รู้สึกหงุดหงิดนิดหน่อย 😠",
                "อารมณ์ไม่ค่อยดีครับ/ค่ะ 😠",
                "รู้สึกไม่พอใจเล็กน้อย 😠"
            ]
        else:  # neutral หรืออื่นๆ
            return [
                "สวัสดีครับ/ค่ะ",
                "ยินดีที่ได้พบกันครับ/ค่ะ",
                "มีอะไรให้ช่วยไหมครับ/คะ"
            ]
    
    # ประโยคพื้นฐาน
    basic = f"{words_text}{emotion_suffix}"
    
    # เพิ่มคำสุภาพ
    polite = f"{words_text} ครับ/ค่ะ{emotion_suffix}"
    
    # เพิ่มบริบท
    contextual = f"ฉันต้องการสื่อว่า {words_text}{emotion_suffix}"
    
    return [basic, polite, contextual]

# รันเซิร์ฟเวอร์
if __name__ == "__main__":
    import uvicorn
    import sys
    
    # แก้ไข encoding สำหรับ Windows console
    try:
        if sys.platform.startswith('win'):
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
    
    # ใช้ข้อความภาษาอังกฤษเพื่อหลีกเลี่ยงปัญหา encoding
    try:
        print("[INFO] Starting Thai-HandMate Backend...")
        print("[API] Available at: http://localhost:8000")
        print("[DOCS] API Documentation: http://localhost:8000/docs")
        print(f"[KEY] Has API Key: {'YES' if TYPHOON_API_KEY else 'NO (will use fallback)'}")
    except UnicodeEncodeError:
        print("[INFO] Starting Thai-HandMate Backend...")
        print("[API] Available at: http://localhost:8000")
        print("[DOCS] API Documentation: http://localhost:8000/docs")
        print(f"[KEY] Has API Key: {'YES' if TYPHOON_API_KEY else 'NO'}")
    
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )
