# คู่มือ LLM Backend - สำหรับทีม No-Code

**Person 4: คุณรับผิดชอบระบบ LLM และ Backend API**  
คู่มือนี้จะพาคุณไปตั้งแต่การตั้งค่า LLM จนใช้งานได้จริงในระบบ

## เกี่ยวกับ LLM Backend

LLM Backend ใช้สำหรับ:
- ประมวลผลผลลัพธ์จาก AI Models (Hand A, Hand B, Face API)
- สร้างการตอบสนองที่เป็นธรรมชาติ (Natural Language Response)
- วิเคราะห์บริบท (Context Analysis) จากภาษามือและอารมณ์
- API Endpoints สำหรับ Frontend

### วัตถุประสงค์ในโปรเจค

1. **ปรับปรุงความแม่นยำ** - ใช้ AI วิเคราะห์ผลรวมจาก Hand + Face
2. **สร้างประสบการณ์ที่ดี** - ตอบสนองผู้ใช้อย่างเป็นธรรมชาติ
3. **Context-Aware** - เข้าใจบริบทจากหลายๆ ข้อมูล
4. **API Integration** - เชื่อมต่อ Frontend กับ AI Models

---

## การตั้งค่า LLM Backend

### ไฟล์ที่ต้องตรวจสอบและแก้ไข

```
thai-handmate/backend/
├── .env                        ← ไฟล์ API Keys (สร้างใหม่)
├── app.py                      ← FastAPI application
├── requirements.txt            ← Python dependencies  
├── README.md                   ← คู่มือนี้
└── api_demo.ipynb             ← ไฟล์ทดสอบ
```

### การสร้างไฟล์ .env
สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` และใส่ค่าต่อไปนี้:

```bash
# Thai-HandMate Backend Configuration

# Google Gemini API (แนะนำ - ฟรี)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_BASE=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# OpenAI API (ทางเลือก - ต้องจ่าย)
OPENAI_API_KEY=your_openai_api_key_here  
OPENAI_API_BASE=https://api.openai.com/v1/chat/completions

# การตั้งค่า
LLM_PROVIDER=gemini
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DEBUG=true
```

### วิธีขอ API Key

**สำหรับ Google Gemini (ฟรี)**:
1. ไปที่ https://aistudio.google.com/app/apikey
2. เข้าสู่ระบบด้วย Google Account
3. คลิก "Create API key"
4. คัดลอก API key มาใส่ในไฟล์ .env

**สำหรับ OpenAI (ต้องจ่าย)**:
1. ไปที่ https://platform.openai.com/api-keys
2. สร้างบัญชีและเติมเงิน
3. สร้าง API key ใหม่
4. คัดลอกมาใส่ในไฟล์ .env

### การปรับแต่งโค้ดในโปรเจค

**ไฟล์ที่อาจต้องแก้ไข**: `backend/app.py`

```python
# ปรับการตั้งค่า CORS หากมีปัญหา
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ปรับฟังก์ชันสร้างประโยค
@app.post("/generate-sentence")
async def generate_sentence(request: SentenceRequest):
    try:
        # รับข้อมูลจาก Frontend
        hand_words = request.words           # จาก Hand A + Hand B
        face_emotion = request.emotion       # จาก Face API
        context = request.context           # บริบทเพิ่มเติม
        
        # สร้าง prompt สำหรับ LLM
        prompt = f"""
        สร้างประโยคภาษาไทยที่เป็นธรรมชาติจากข้อมูลต่อไปนี้:
        
        คำภาษามือ: {', '.join(hand_words)}
        อารมณ์จากใบหน้า: {face_emotion}
        บริบท: {context}
        
        กฎการสร้างประโยค:
        1. ใช้คำภาษามือทั้งหมดที่ให้มา
        2. สะท้อนอารมณ์ที่ตรวจจับได้
        3. เป็นภาษาไทยที่เข้าใจง่าย
        4. ความยาว 1-2 ประโยค
        5. เหมาะสมกับบริบท
        
        ตัวอย่าง:
        คำ: ["สวัสดี", "สวย", "ยิ้ม"] อารมณ์: "happy" 
        -> "สวัสดีครับ คุณสวยมากและยิ้มแย้มแจ่มใส"
        """
        
        # เรียก LLM API
        response = await call_llm_api(prompt)
        
        return {
            "success": True,
            "sentence": response.strip(),
            "words_used": hand_words,
            "emotion": face_emotion
        }
        
    except Exception as e:
        logger.error(f"Error generating sentence: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback": f"ได้รับคำ: {', '.join(request.words)}"
        }
```

**ไฟล์ที่ต้องแก้ไข**: `src/components/CameraFeed.jsx` (Frontend)

```javascript
// เพิ่มการเรียก Backend API
const [generatedSentence, setGeneratedSentence] = useState('');

const generateSentence = async () => {
  try {
    const response = await fetch('http://localhost:8000/generate-sentence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        words: [handAResult.word, handBResult.word].filter(Boolean),
        emotion: faceResult.emotion,
        context: 'การสื่อสารทั่วไป'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setGeneratedSentence(data.sentence);
    } else {
      setGeneratedSentence(data.fallback || 'เกิดข้อผิดพลาด');
    }
  } catch (error) {
    console.error('Backend API Error:', error);
    setGeneratedSentence('ไม่สามารถเชื่อมต่อ Backend ได้');
  }
};

// เรียกฟังก์ชันเมื่อมีการอัพเดท
useEffect(() => {
  if (handAResult && handBResult && faceResult) {
    generateSentence();
  }
}, [handAResult, handBResult, faceResult]);
```

### การรันและทดสอบ Backend

1. **ติดตั้ง dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **รัน Backend server**:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

3. **ทดสอบ API**:
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### การแก้ไขปัญหา

**ถ้า API Key ไม่ทำงาน**:
1. ตรวจสอบไฟล์ .env มี API key ถูกต้อง
2. ตรวจสอบ quota และ billing (สำหรับ OpenAI)
3. ลองเปลี่ยนจาก Gemini เป็น OpenAI หรือกลับกัน

**ถ้า CORS Error**:
1. ตรวจสอบ CORS_ORIGINS ในไฟล์ .env
2. เพิ่ม Frontend URL ที่กำลังใช้
3. รีสตาร์ท Backend server

**ถ้าประโยคไม่เป็นธรรมชาติ**:
1. ปรับปรุง prompt ใน app.py
2. เพิ่มตัวอย่างการใช้งาน
3. ปรับ temperature parameter

**เป้าหมาย**: LLM ตอบสนองได้ < 3 วินาที, ประโยคเป็นภาษาไทยที่เข้าใจได้

### ขั้นตอนที่ 1: เลือกโซลูชัน LLM

เรามี 3 ตัวเลือกหลัก:

**ตัวเลือก A: OpenAI GPT (แนะนำ - ดีที่สุด)**
- ⭐ คุณภาพดีที่สุด
- 💰 ต้องจ่ายค่าใช้จ่าย (~$0.002/1K tokens)
- 🔑 ต้องมี API Key
- ✅ เหมาะสำหรับ Production

**ตัวเลือก B: Google Gemini (ฟรี - คุณภาพดี)**
- 🆓 ฟรี (มีข้อจำกัดการใช้งาน)
- 🔑 ต้องมี API Key (ฟรี)
- ✅ เหมาะสำหรับทดสอบ
- 📚 รองรับภาษาไทยได้ดี

**ตัวเลือก C: Local LLM (ไม่แนะนำสำหรับมือใหม่)**
- 🆓 ไม่มีค่าใช้จ่าย
- 💻 ต้องใช้ทรัพยากรเครื่องสูง
- 🔧 ซับซ้อนในการติดตั้ง

**👉 เราแนะนำ Google Gemini สำหรับเริ่มต้น (ฟรี)**

### ขั้นตอนที่ 2: ขอ API Key

**สำหรับ Google Gemini (ฟรี):**

1. ไปที่ <https://aistudio.google.com/app/apikey>
2. สร้างบัญชี Google หากยังไม่มี
3. คลิก **"Create API Key"**
4. เลือก **"Create API key in new project"**
5. คัดลอก API Key ที่ได้

**สำหรับ OpenAI (เสียเงิน):**

1. ไปที่ <https://platform.openai.com/api-keys>
2. สร้างบัญชี OpenAI
3. เติมเงินเข้าบัญชี (อย่างน้อย $5)
4. สร้าง API Key

### ขั้นตอนที่ 3: ตั้งค่า Environment

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`:

```bash
# สำหรับ Google Gemini
GOOGLE_API_KEY=your_gemini_api_key_here
LLM_PROVIDER=gemini

# หรือสำหรับ OpenAI (เลือกอันใดอันหนึ่ง)
# OPENAI_API_KEY=your_openai_api_key_here
# LLM_PROVIDER=openai

# การตั้งค่าอื่นๆ
MIN_CONFIDENCE_THRESHOLD=0.60
MAX_RESPONSE_LENGTH=200
LANGUAGE=th
```

### ขั้นตอนที่ 4: ติดตั้ง Python Libraries

รันคำสั่งในโฟลเดอร์ `backend/`:

```bash
pip install google-generativeai openai python-dotenv fastapi uvicorn
```

### ขั้นตอนที่ 5: สร้าง LLM Service

สร้างไฟล์ `backend/services/llm_service.py`:

```python
import os
from dotenv import load_dotenv
import google.generativeai as genai
from openai import OpenAI
from typing import Dict, List, Optional

load_dotenv()

class LLMService:
    def __init__(self):
        self.provider = os.getenv('LLM_PROVIDER', 'gemini')
        self.language = os.getenv('LANGUAGE', 'th')
        
        if self.provider == 'gemini':
            genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
            self.model = genai.GenerativeModel('gemini-pro')
            print("✅ ใช้ Google Gemini")
            
        elif self.provider == 'openai':
            self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            print("✅ ใช้ OpenAI GPT")
            
        else:
            raise ValueError("❌ LLM Provider ไม่ถูกต้อง")
    
    def create_context_prompt(self, results: Dict) -> str:
        """สร้าง Prompt จากผลลัพธ์ AI"""
        
        prompt = f"""คุณเป็น AI Assistant ที่เข้าใจภาษามือไทย

ผลลัพธ์จากการวิเคราะห์:
"""
        
        # Hand A Results
        if 'handA' in results:
            hand_a = results['handA']
            prompt += f"- ภาษามือ A: {hand_a['prediction']} (ความแม่นยำ: {hand_a['confidence']:.1%})\\n"
        
        # Hand B Results  
        if 'handB' in results:
            hand_b = results['handB']
            prompt += f"- ภาษามือ B: {hand_b['prediction']} (ความแม่นยำ: {hand_b['confidence']:.1%})\\n"
        
        # Face Emotion Results
        if 'face' in results:
            face = results['face']
            if face['detected']:
                prompt += f"- อารมณ์จากใบหน้า: {face['emotion']} (ความแม่นยำ: {face['confidence']:.1%})\\n"
        
        prompt += f\"\"\"
กรุณาตอบกลับเป็นภาษาไทยโดย:
1. บอกว่าเข้าใจภาษามืออะไร
2. แสดงความเข้าใจต่ออารมณ์ (ถ้ามี)
3. ตอบสนองให้เหมาะสมกับบริบท
4. ใช้คำพูดที่เป็นมิตรและเข้าใจง่าย
5. ความยาวไม่เกิน 100 คำ
\"\"\"
        
        return prompt
    
    async def generate_response(self, results: Dict) -> Dict:
        """สร้างการตอบสนองจาก LLM"""
        
        try:
            prompt = self.create_context_prompt(results)
            
            if self.provider == 'gemini':
                response = self.model.generate_content(prompt)
                text = response.text
                
            elif self.provider == 'openai':
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=150,
                    temperature=0.7
                )
                text = response.choices[0].message.content
            
            return {
                'success': True,
                'response': text.strip(),
                'provider': self.provider
            }
            
        except Exception as e:
            print(f"❌ LLM Error: {e}")
            return {
                'success': False,
                'response': self._get_fallback_response(results),
                'error': str(e)
            }
    
    def _get_fallback_response(self, results: Dict) -> str:
        """สร้างการตอบสนองสำรองเมื่อ LLM ไม่ทำงาน"""
        
        if 'handA' in results and results['handA']['confidence'] > 0.6:
            word = results['handA']['prediction']
            return f"ฉันเห็นคุณทำท่า '{word}' ค่ะ"
            
        elif 'handB' in results and results['handB']['confidence'] > 0.6:
            word = results['handB']['prediction'] 
            return f"ฉันเข้าใจว่าคุณหมายถึง '{word}' ใช่ไหมคะ"
            
        else:
            return "ขออิ้ช่วยทำท่าภาษามือให้ชัดเจนขึ้นหน่อยได้ไหมคะ"

# สร้าง instance
llm_service = LLMService()
```

### ขั้นตอนที่ 6: เพิ่ม API Endpoints

ปรับไฟล์ `backend/app.py`:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from services.llm_service import llm_service

app = FastAPI(title="Thai Handmate API")

class PredictionRequest(BaseModel):
    handA: Optional[Dict] = None
    handB: Optional[Dict] = None 
    face: Optional[Dict] = None

class PredictionResponse(BaseModel):
    message: str
    confidence: float
    llm_response: str
    provider: str

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        # รวมผลลัพธ์จาก AI Models
        results = {}
        best_confidence = 0.0
        best_prediction = "unknown"
        
        # ประมวลผล Hand A
        if request.handA and request.handA.get('confidence', 0) > 0.6:
            results['handA'] = request.handA
            if request.handA['confidence'] > best_confidence:
                best_confidence = request.handA['confidence'] 
                best_prediction = request.handA['prediction']
        
        # ประมวลผล Hand B
        if request.handB and request.handB.get('confidence', 0) > 0.6:
            results['handB'] = request.handB
            if request.handB['confidence'] > best_confidence:
                best_confidence = request.handB['confidence']
                best_prediction = request.handB['prediction']
        
        # ประมวลผล Face
        if request.face:
            results['face'] = request.face
        
        # ส่งไป LLM เพื่อสร้างการตอบสนอง
        llm_result = await llm_service.generate_response(results)
        
        return PredictionResponse(
            message=best_prediction,
            confidence=best_confidence,
            llm_response=llm_result['response'],
            provider=llm_result.get('provider', 'fallback')
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Thai Handmate API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 🔧 การทดสอบและปรับแต่ง

### การรัน Backend Server

```bash
cd backend
python app.py
```

Server จะทำงานที่ <http://localhost:8000>

### การทดสอบ API

```bash
# ทดสอบ Health Check
curl http://localhost:8000/api/health

# ทดสอบ Prediction
curl -X POST "http://localhost:8000/api/predict" \\
     -H "Content-Type: application/json" \\
     -d '{
       "handA": {"prediction": "สวัสดี", "confidence": 0.85},
       "face": {"detected": true, "emotion": "happy", "confidence": 0.75}
     }'
```

### การปรับแต่ง LLM

ปรับค่าใน `.env`:

```bash
# เปลี่ยนความยาวการตอบกลับ
MAX_RESPONSE_LENGTH=150

# เปลี่ยนเกณฑ์ความแม่นยำ
MIN_CONFIDENCE_THRESHOLD=0.70

# เปลี่ยนภาษา
LANGUAGE=en  # หรือ th
```

---

## 🎯 การปรับปรุงประสิทธิภาพ

### 1. Context Enhancement

ปรับปรุงการสร้าง Prompt:

```python
def create_advanced_context_prompt(self, results: Dict, history: List = None) -> str:
    prompt = f"""คุณเป็น AI ที่เชี่ยวชาญด้านภาษามือไทย

การวิเคราะห์ปัจจุบัน:
"""
    
    # เพิ่มประวัติการสนทนา
    if history:
        prompt += "ประวัติการสนทนา:\\n"
        for msg in history[-3:]:  # เอา 3 ข้อความล่าสุด
            prompt += f"- {msg}\\n"
    
    # เพิ่มการวิเคราะห์ความสัมพันธ์
    if 'handA' in results and 'handB' in results:
        prompt += "หมายเหตุ: ตรวจพบภาषามือจากทั้ง 2 โมเดล\\n"
    
    # เพิ่มการวิเคราะห์อารมณ์
    if 'face' in results and results['face']['detected']:
        emotion = results['face']['emotion']
        prompt += f"บริบทอารมณ์: ผู้ใช้ดู{emotion}\\n"
    
    return prompt
```

### 2. Response Quality

ปรับปรุงการตอบสนอง:

```python
def enhance_response(self, raw_response: str, results: Dict) -> str:
    """ปรับปรุงคุณภาพการตอบสนอง"""
    
    # เพิ่ม Emoji ตามอารมณ์
    if 'face' in results:
        emotion = results['face'].get('emotion', 'neutral')
        emoji_map = {
            'happy': '😊',
            'sad': '😢', 
            'angry': '😠',
            'surprised': '😲',
            'neutral': '😊'
        }
        raw_response = f"{emoji_map.get(emotion, '😊')} {raw_response}"
    
    # ตรวจสอบความยาว
    if len(raw_response) > 100:
        raw_response = raw_response[:97] + "..."
    
    return raw_response
```

### 3. Error Handling

ปรับปรุงการจัดการข้อผิดพลาด:

```python
async def safe_generate_response(self, results: Dict) -> Dict:
    """สร้างการตอบสนองพร้อม Error Handling"""
    
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            return await self.generate_response(results)
            
        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed: {e}")
            
            if attempt == max_retries - 1:
                return {
                    'success': False,
                    'response': self._get_fallback_response(results),
                    'error': 'LLM service unavailable'
                }
            
            await asyncio.sleep(1)  # รอ 1 วินาที
```

---

## 🚨 การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: API Key ไม่ทำงาน

```bash
❌ Error: Invalid API Key
```

**วิธีแก้:**
1. ตรวจสอบว่า API Key ถูกต้อง
2. ตรวจสอบว่าไฟล์ `.env` อยู่ในโฟลเดอร์ `backend/`
3. รีสตาร์ท server: `python app.py`

### ปัญหา: LLM ตอบช้า

```bash
⚠️ Response time > 5 seconds
```

**วิธีแก้:**
1. ใช้ `gemini-pro` แทน `gpt-4`
2. ลด `max_tokens` ในการตั้งค่า
3. เพิ่ม timeout handling

### ปัญหา: ตอบไม่เป็นภาษาไทย

**วิธีแก้:**
1. เพิ่ม "ตอบเป็นภาษาไทยเท่านั้น" ใน Prompt
2. ตั้งค่า `LANGUAGE=th` ในไฟล์ `.env`
3. ใช้ Gemini (รองรับภาษาไทยดีกว่า GPT)

### ปัญหา: หน่วยความจำเต็ม

**วิธีแก้:**
1. เคลียร์ประวัติการสนทนา
2. ลดขนาด context window
3. ใช้ model ที่เล็กกว่า

---

## 📊 การ Monitor และ Analytics

### 1. Logging

เพิ่มการบันทึกข้อมูล:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def generate_response(self, results: Dict) -> Dict:
    start_time = time.time()
    
    try:
        # ... การประมวลผล ...
        
        response_time = time.time() - start_time
        logger.info(f"LLM Response time: {response_time:.2f}s")
        
        return result
        
    except Exception as e:
        logger.error(f"LLM Error: {e}")
        raise
```

### 2. Usage Tracking

ติดตามการใช้งาน:

```python
class UsageTracker:
    def __init__(self):
        self.requests = 0
        self.successful_requests = 0
        self.total_tokens = 0
    
    def track_request(self, tokens: int, success: bool):
        self.requests += 1
        self.total_tokens += tokens
        if success:
            self.successful_requests += 1
    
    def get_stats(self):
        success_rate = self.successful_requests / self.requests * 100
        return {
            'total_requests': self.requests,
            'success_rate': f'{success_rate:.1f}%',
            'total_tokens': self.total_tokens,
            'avg_tokens': self.total_tokens / self.requests
        }
```

---

## 📞 การติดต่อทีม

**มีปัญหา?** ติดต่อ:

- Person 1 & 2: ส่งผลลัพธ์จาก Hand Models
- Person 3: ส่งผลลัพธ์จาก Face API
- หรือถามในกลุ่มทีม

**ไฟล์ทดสอบ:** `llm_backend_test.ipynb` - ใช้ทดสอบ LLM ก่อนใส่ระบบจริง

---

## 🎉 ขั้นตอนถัดไป

เมื่อ LLM Backend ทำงานได้แล้ว:

1. **ทดสอบ API Endpoints** - ตรวจสอบว่าทุก endpoint ทำงานได้
2. **ผสาน Frontend** - เชื่อมต่อกับ Frontend แสดงผล
3. **ทดสอบระบบรวม** - ทดสอบร่วมกับ AI Models ทั้งหมด
4. **Deploy Production** - นำขึ้น Server จริง

**🌟 เป้าหมาย: LLM Backend ที่ตอบสนองได้เป็นธรรมชาติและแม่นยำ**
