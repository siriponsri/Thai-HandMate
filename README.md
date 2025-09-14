# Thai-HandMate
ระบบจดจำภาษามือไทย พร้อมสร้างประโยคอัตโนมัติด้วย AI

## ภาพรวม
Thai-HandMate เป็นเว็บแอปพลิเคชันที่ใช้กล้องถ่ายภาพมือ จดจำคำภาษามือไทย ตรวจจับอารมณ์จากใบหน้า และสร้างประโยคธรรมชาติด้วย AI 

**คุณสมบัติหลัก:**
- จดจำภาษามือไทย 23 คำ จาก 3 โมเดล (handA: 9 คำ, handB: 9 คำ, handC: 5 คำ) ด้วย Teachable Machine  
- ตรวจจับอารมณ์จากใบหน้า 7 แบบ (happy, sad, angry, fearful, disgusted, surprised, neutral) ด้วย face-api.js
- สร้างประโยคไทยธรรมชาติด้วย Typhoon-v2.1-12b-instruct LLM รวมกับการวิเคราะห์อารมณ์
- แสดงค่า confidence score สำหรับทั้งการจดจำมือและการตรวจจับอารมณ์
- ใช้งานง่ายผ่านเว็บเบราว์เซอร์

## โมเดลที่ใช้งาน

### Hand Gesture Models (Teachable Machine)
- **handA**: 9 คำ - ขอบคุณ, ยินดี, ตอน, เช้า, สวัสดี, ดีใจ, ที่, ได้, พบ
- **handB**: 9 คำ - ผม, ฉัน, คุณ, เขา, เธอ, รัก, ชอบ, อยาก, อร่อย  
- **handC**: 5 คำ - ขอโทษ, ไป, มา, เดิน, วิ่ง

### Face Emotion Detection (face-api.js)
- **7 อารมณ์**: happy, sad, angry, fearful, disgusted, surprised, neutral
- **แสดงผล**: ชื่ออารมณ์ + ค่า confidence percentage

### Backend LLM
- **โมเดล**: typhoon-v2.1-12b-instruct
- **ความสามารถ**: สร้างประโยคไทยที่สมเหตุสมผลจากคำที่ป้อนและอารมณ์ที่ตรวจพบ
- **Fallback**: หากไม่มี API key จะใช้การต่อคำแบบง่าย

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
   - ไปที่ <https://teachablemachine.withgoogle.com/train/image>
   - สร้าง hand models 3 ชุด (handA, handB, handC) ตามคำที่ระบุ
   - Export เป็น TensorFlow.js สำหรับแต่ละโปรเจ็กต์
   - ดาวน์โหลดไฟล์ 3 ไฟล์: model.json, metadata.json, weights.bin

2. **วางไฟล์โมเดลใน public/models/**

   ```text
   public/
   ├── models/
   │   ├── handA/
   │   │   ├── model.json
   │   │   ├── metadata.json
   │   │   └── weights.bin
   │   ├── handB/
   │   │   ├── model.json
   │   │   ├── metadata.json
   │   │   └── weights.bin
   │   └── handC/
   │       ├── model.json
   │       ├── metadata.json
   │       └── weights.bin
   └── face-models/
       ├── tiny_face_detector_model-weights_manifest.json
       ├── tiny_face_detector_model-shard1
       ├── face_expression_model-weights_manifest.json
       └── face_expression_model-shard1
   ```

3. **ดาวน์โหลดไฟล์ face-api.js**
   - ไปที่ <https://github.com/justadudewhohacks/face-api.js/tree/master/weights>
   - ดาวน์โหลดไฟล์ 4 ไฟล์:
     - tiny_face_detector_model-weights_manifest.json และ tiny_face_detector_model-shard1
     - face_expression_model-weights_manifest.json และ face_expression_model-shard1
   - วางใน public/face-models/

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

1. **สร้างไฟล์ .env ในโฟลเดอร์ backend/**

   ```env
   TYPHOON_API_KEY=your_typhoon_api_key_here
   TYPHOON_API_BASE=https://api.opentyphoon.ai/v1/chat/completions
   ```

2. **ถ้าไม่มี API Key**
   - ไม่เป็นไร! ระบบจะใช้ fallback แบบกำหนดเอง
   - แค่ปล่อยให้ TYPHOON_API_KEY ว่างไว้หรือไม่ต้องสร้างไฟล์ .env

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

   **วิธีที่ 1: รัน command เดียว (แนะนำ)**
   ```bash
   # Windows
   start.bat
   
   # หรือใช้ npm
   npm run start
   
   # Linux/Mac
   ./start.sh
   ```
   
   **วิธีที่ 2: รันแยกกัน**
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
2. **ทำท่าภาษามือ** → ระบบจะทำนายแบบ real-time และแสดงผลลัพธ์พร้อม confidence score
3. **ดูการตรวจจับอารมณ์** → ระบบจะแสดงอารมณ์ที่ตรวจพบจากใบหน้าพร้อม confidence score
4. **เก็บคำ** → กดปุ่ม "เก็บคำ" เพื่อเพิ่มคำที่ทำนายได้ลงในรายการ
5. **สร้างประโยค** → กดปุ่ม "สร้างประโยค" เพื่อให้ AI แต่งประโยคจากคำที่เก็บไว้ โดยจะพิจารณาอารมณ์ที่ตรวจพบด้วย
6. **ล้างรายการ** → กดปุ่ม "ล้างทั้งหมด" เพื่อเริ่มใหม่

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

```text
thai-handmate/
├── README.md                     # คู่มือนี้
├── package.json                  # การตั้งค่า npm และ scripts
├── vite.config.js                # การตั้งค่า Vite
├── index.html                    # หน้าหลัก
├── start.bat                     # Windows startup script
├── start.sh                      # Linux/Mac startup script
├── public/
│  ├── models/
│  │  ├── handA/                  # โมเดล Teachable Machine ชุด A (9 คำ)
│  │  ├── handB/                  # โมเดล Teachable Machine ชุด B (9 คำ)
│  │  └── handC/                  # โมเดล Teachable Machine ชุด C (5 คำ)
│  └── face-models/               # โมเดล face-api.js สำหรับตรวจจับอารมณ์
├── src/
│  ├── main.jsx                   # จุดเริ่มต้น React
│  ├── App.jsx                    # หน้าหลัก
│  ├── styles.css                 # สไตล์หลัก
│  ├── components/
│  │  ├── CameraFeed.jsx          # กล้องถ่ายภาพพร้อมการทำนาย real-time
│  │  ├── RightPanel.jsx          # แผงผลลัพธ์และการจัดการ
│  │  └── StatusBadge.jsx         # แสดงสถานะใบหน้าและอารมณ์
│  └── lib/
│     ├── config.js               # การตั้งค่า (โมเดล, API endpoints)
│     └── tm.js                   # จัดการ Teachable Machine และ face-api.js
└── backend/
   ├── app.py                     # เซิร์ฟเวอร์ FastAPI พร้อม Typhoon LLM
   ├── api_demo.ipynb            # Jupyter Notebook สำหรับทดสอบ API
   ├── requirements.txt           # Python dependencies
   └── .env                       # ตัวแปรสภาพแวดล้อม (API keys)
```

## ❓ แก้ไขปัญหา

### โมเดลไม่ทำงาน

- ตรวจสอบไฟล์โมเดลใน public/models/ (ต้องมี handA, handB, handC)
- ดู console log ในเบราว์เซอร์ (F12)
- ตรวจสอบว่าไฟล์ model.json, metadata.json, weights.bin ครบทั้ง 3 โมเดล

### Backend เชื่อมต่อไม่ได้

- ตรวจสอบว่าเปิด backend แล้ว (python app.py หรือ npm run start)
- ลองเข้า <http://localhost:8000/api/health>
- ตรวจสอบว่า Python dependencies ติดตั้งครบ (pip install -r requirements.txt)

### การ์ดแสดง "ใบหน้า: ไม่พร้อม"

- ตรวจสอบไฟล์ face-api.js ใน public/face-models/ (ต้องมี 4 ไฟล์)
- อนุญาตให้เว็บไซต์เข้าถึงกล้อง
- ตรวจสอบว่าหน้าเว็บทำงานผ่าน HTTPS หรือ localhost

### ไม่มี API Key

- ไม่เป็นไร! ระบบจะใช้ fallback โดยจะเรียงคำต่อกันแบบง่ายๆ
- หากต้องการใช้ AI จริง ให้ใส่ TYPHOON_API_KEY ในไฟล์ backend/.env

### การทำนายไม่แม่นยำ

- ตรวจสอบแสงส่องกล้อง (ควรมีแสงเพียงพอ)
- วางมือให้อยู่ในกรอบกล้องอย่างชัดเจน
- ทำท่าภาษามือให้ตรงกับที่ train ไว้

## ลิงก์ที่เป็นประโยชน์

- **Teachable Machine**: <https://teachablemachine.withgoogle.com>
- **face-api.js Models**: <https://github.com/justadudewhohacks/face-api.js>
- **Typhoon AI**: <https://typhoon.io>
- **FastAPI Docs**: <https://fastapi.tiangolo.com>
