# Thai-HandMate
ระบบจดจำภาษามือไทย พร้อมสร้างประโยคอัตโนมัติด้วย AI

## ภาพรวม
Thai-HandMate เป็นเว็บแอปพลิเคชันที่ใช้กล้องถ่ายภาพมือ จดจำคำภาษามือไทย และสร้างประโยคธรรมชาติด้วย AI 

**คุณสมบัติหลัก:**
- จดจำภาษามือไทย 10 คำ (5+5 คำ) ด้วย Teachable Machine  
- ตรวจสอบการพร้อมใช้งานจากใบหน้าด้วย face-api.js
- สร้างประโยคไทยธรรมชาติด้วย Typhoon LLM
- ใช้งานง่ายผ่านเว็บเบราว์เซอร์

## การแบ่งงานทีม

### Person 1: Hand Model A
- รับผิดชอบโมเดลจดจำภาษามือกลุ่ม A (9 คำ)
- ดู README ใน `public/models/handA/README.md`
- ทดสอบผ่าน `public/models/handA/handA_test.ipynb`

### Person 2: Hand Model B  
- รับผิดชอบโมเดลจดจำภาษามือกลุ่ม B (9 คำ)
- ดู README ใน `public/models/handB/README.md`
- ทดสอบผ่าน `public/models/handB/handB_test.ipynb`

### Person 3: Face Expression Detection
- รับผิดชอบระบบตรวจจับอารมณ์จากใบหน้า
- ดู README ใน `public/face-models/README.md`
- ทดสอบผ่าน `public/face-models/face_api_test.ipynb`

### Person 4: LLM Backend
- รับผิดชอบระบบ Backend API และ LLM
- ดู README ใน `backend/README.md`
- ทดสอบผ่าน `backend/api_demo.ipynb`Mate
> ระบบจดจำภาษามือไทย พร้อมสร้างประโยคอัตโนมัติด้วย AI

## ภาพรวม
Thai-HandMate เป็นเว็บแอปพลิเคชันที่ใช้กล้องถ่ายภาพมือ จดจำคำภาษามือไทย และสร้างประโยคธรรมชาติด้วย AI 

**คุณสมบัติหลัก:**
- จดจำภาษามือไทย 10 คำ (5+5 คำ) ด้วย Teachable Machine  
- ตรวจสอบการพร้อมใช้งานจากใบหน้าด้วย face-api.js
- สร้างประโยคไทยธรรมชาติด้วย Typhoon LLM
- ใช้งานง่ายผ่านเว็บเบราว์เซอร์

## วิธีติดตั้ง (สำหรับผู้ไม่มีพื้นฐานเทคนิค)

### ขั้นตอนที่ 1: ติดตั้งโปรแกรมที่จำเป็น

1. **ติดตั้ง Node.js 18+**
   - ไปที่ https://nodejs.org
   - ดาวน์โหลดเวอร์ชัน LTS (แนะนำ)
   - ติดตั้งตามขั้นตอน

2. **ติดตั้ง Python 3.10+**  
   - ไปที่ https://python.org/downloads
   - ดาวน์โหลดเวอร์ชันล่าสุด
   - ติดตั้งแล้วเลือก "Add to PATH"

3. **ติดตั้ง VS Code (ไม่บังคับแต่แนะนำ)**
   - ไปที่ https://code.visualstudio.com

### ขั้นตอนที่ 2: เตรียมไฟล์โมเดล

1. **สร้างโมเดล Teachable Machine**
   - ไปที่ https://teachablemachine.withgoogle.com/train/image
   - สร้าง 2 โปรเจ็กต์:
     - โปรเจ็กต์ A: ผม, รัก, คุณ, สวัสดี, ขอโทษ
     - โปรเจ็กต์ B: ขอบคุณ, โอเค, หยุด, ไป, มา
   - Export เป็น TensorFlow.js
   - ดาวน์โหลดไฟล์ 3 ไฟล์: model.json, metadata.json, weights.bin

2. **วางไฟล์โมเดลใน public/models/**
   ```
   public/
   ├── models/
   │   ├── handA/
   │   │   ├── model.json
   │   │   ├── metadata.json
   │   │   └── weights.bin
   │   └── handB/
   │       ├── model.json
   │       ├── metadata.json
   │       └── weights.bin
   └── face-models/
       └── tiny_face_detector_model-weights_manifest.json
       └── tiny_face_detector_model-shard1
   ```

3. **ดาวน์โหลดไฟล์ face-api.js**
   - ไปที่ https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   - ดาวน์โหลด: tiny_face_detector_model-weights_manifest.json และ tiny_face_detector_model-shard1
   - วางใน public/face-models/

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

1. **สร้างไฟล์ .env ในโฟลเดอร์ backend/**
   ```env
   TYPHOON_API_KEY=your_typhoon_api_key_here
   TYPHOON_API_BASE=https://api.typhoon.io/v1/chat/completions
   ```

2. **ถ้าไม่มี API Key**
   - ระบบจะใช้ fallback แบบกำหนดเอง (ไม่เป็นไร)
   - แค่ปล่อยให้ TYPHOON_API_KEY ว่างไว้

### ขั้นตอนที่ 4: รันระบบ

1. **ติดตั้ง Dependencies**
   ```bash
   # ติดตั้ง frontend dependencies
   npm install
   
   # ติดตั้ง backend dependencies
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

2. **รันระบบ**
   ```bash
   # รัน frontend (เทอร์มินัลแรก)
   npm run dev
   
   # รัน backend (เทอร์มินัลที่สอง)
   cd backend
   python app.py
   ```

3. **เปิดเว็บไซต์**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## วิธีใช้งาน

1. **เปิดหน้าเว็บ** → จะเห็นกล้องด้านซ้าย และแผงผลลัพธ์ด้านขวา
2. **ทำท่าภาษามือ** → กดปุ่ม "Capture" เพื่อถ่ายภาพ  
3. **ดูผลลัพธ์** → ระบบจะแสดงคำที่จดจำได้ พร้อม % ความมั่นใจ
4. **สร้างประโยค** → กดปุ่ม "สร้างประโยค" เพื่อให้ AI แต่งประโยคจากคำที่เก็บไว้

## ทดสอบ API

สำหรับนักพัฒนา สามารถทดสอบ backend API ได้:

```bash
# ทดสอบ health check
curl http://localhost:8000/api/health

# ทดสอบสร้างประโยค
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"words": ["ผม", "รัก", "คุณ"]}'

# หรือใช้ HTTPie
http POST localhost:8000/api/generate words:='["ผม", "รัก", "คุณ"]'
```

## โครงสร้างไฟล์

```
thai-handmate/
├─ README.md                     # คู่มือนี้
├─ package.json                  # การตั้งค่า npm
├─ vite.config.js                # การตั้งค่า Vite
├─ index.html                    # หน้าหลัก
├─ public/
│  ├─ models/
│  │  ├─ handA/                  # โมเดล Teachable Machine ชุด A
│  │  └─ handB/                  # โมเดล Teachable Machine ชุด B
│  └─ face-models/               # โมเดล face-api.js
├─ src/
│  ├─ main.jsx                   # จุดเริ่มต้น React
│  ├─ App.jsx                    # หน้าหลัก
│  ├─ styles.css                 # สไตล์หลัก
│  ├─ components/
│  │  ├─ CameraFeed.jsx          # กล้องถ่ายภาพ
│  │  ├─ RightPanel.jsx          # แผงผลลัพธ์
│  │  └─ StatusBadge.jsx         # แสดงสถานะใบหน้า
│  └─ lib/
│     ├─ config.js               # การตั้งค่า
│     └─ tm.js                   # จัดการ Teachable Machine
└─ backend/
   ├─ app.py                     # เซิร์ฟเวอร์ FastAPI
   ├─ api_demo.ipynb            # Jupyter Notebook สำหรับทดสอบ
   ├─ requirements.txt           # Python dependencies
   └─ .env                       # ตัวแปรสภาพแวดล้อม
```

## ❓ แก้ไขปัญหา

**โมเดลไม่ทำงาน**
- ตรวจสอบไฟล์โมเดลใน public/models/
- ดู console log ในเบราว์เซอร์ (F12)

**Backend เชื่อมต่อไม่ได้**  
- ตรวจสอบว่าเปิด backend แล้ว (python app.py)
- ลองเข้า http://localhost:8000/api/health

**การ์ดแสดง "ใบหน้า: ไม่พร้อม"**
- ตรวจสอบไฟล์ face-api.js ใน public/face-models/
- อนุญาตให้เว็บไซต์เข้าถึงกล้อง

**ไม่มี API Key**
- ไม่เป็นไร! ระบบจะใช้ fallback โดยจะเรียงคำต่อกันง่ายๆ

## ลิงก์ที่เป็นประโยชน์

- **Teachable Machine**: https://teachablemachine.withgoogle.com
- **face-api.js Models**: https://github.com/justadudewhohacks/face-api.js
- **Typhoon AI**: https://typhoon.io
- **FastAPI Docs**: https://fastapi.tiangolo.com
