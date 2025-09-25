# Thai-HandMate
ระบบจดจำภาษามือไทย พร้อมสร้างประโยคอัตโนมัติด้วย AI

## ภาพรวม
Thai-HandMate เป็นเว็บแอปพลิเคชันที่ใช้กล้องถ่ายภาพมือ จดจำคำภาษามือไทย ตรวจจับใบหน้า และสร้างประโยคธรรมชาติด้วย AI 

**คุณสมบัติหลัก:**
- จดจำภาษามือไทย 9 คำ ด้วย TensorFlow.js (Teachable Machine)
- ตรวจจับใบหน้าด้วย face-api.js (SSD MobileNet)
- ตรวจจับอารมณ์ 7 แบบด้วย face-api.js Expression Model
- สร้างประโยคไทยธรรมชาติด้วย Typhoon LLM รวมกับการวิเคราะห์อารมณ์
- รองรับการอัปโหลดรูปภาพและถ่ายภาพจากกล้อง
- แสดงกรอบ Face Detection แบบ real-time
- แสดงค่า confidence score สำหรับทั้งการจดจำมือ การตรวจจับใบหน้า และอารมณ์
- ใช้งานง่ายผ่านเว็บเบราว์เซอร์
- รองรับการประมวลผลแบบ async สำหรับประสิทธิภาพสูง

## โมเดลที่ใช้งาน

### Hand Gesture Model (TensorFlow.js)
- **Unified Hand Model**: 9 คำ - เริ่ม, เรียนรู้, AI, อย่างไร, ช่วยเหลือ, ไม่ใช่, หยุด, ถัดไป, สถานะว่าง
  - **Model Type**: TensorFlow.js (LayersModel/GraphModel)
  - **Training**: Teachable Machine Image Model
  - **Input Resolution**: 224x224 pixels RGB
  - **Architecture**: MobileNetV2 + Dense layers
  - **Preprocessing**: Resize → Normalize [0,1] → Flatten (for Dense) or 4D (for Conv2D)

### Face Detection & Emotion (face-api.js)
- **Face Detection**: SSD MobileNet v1
- **Face Landmarks**: 68-point facial landmarks
- **Face Expression**: 7 emotions (angry, disgust, fear, happy, neutral, sad, surprised)
- **Input Resolution**: 224x224 pixels RGB
- **Confidence Threshold**: 0.5

### Backend LLM
- **โมเดล**: typhoon-v2.1-12b-instruct
- **ความสามารถ**: สร้างประโยคไทยที่สมเหตุสมผลจากคำที่ป้อนและอารมณ์ที่ตรวจพบ
- **Rate Limiting**: 10 requests/minute
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

1. **สร้าง Hand Model (Teachable Machine)**
   - ไปที่ https://teachablemachine.withgoogle.com/train/image
   - สร้าง Image Model สำหรับ 9 คำ: เริ่ม, เรียนรู้, AI, อย่างไร, ช่วยเหลือ, ไม่ใช่, หยุด, ถัดไป, สถานะว่าง
   - เก็บข้อมูลภาพแต่ละคำ 50-100 samples
   - Export เป็น TensorFlow.js Model
   - ดาวน์โหลดไฟล์: model.json, weights.bin

2. **Face Models (face-api.js)**
   - ระบบจะดาวน์โหลดอัตโนมัติจาก face-api.js repository
   - ไม่ต้องดาวน์โหลดเพิ่มเติม
   - ไฟล์จะถูกเก็บใน public/face-model/

3. **วางไฟล์โมเดลใน public/**

   ```text
   public/
   ├── hand-model/                   # Hand Model (Teachable Machine)
   │   ├── model.json
   │   └── weights.bin
   └── face-model/                   # Face Models (face-api.js)
       ├── ssd_mobilenetv1_model-weights_manifest.json
       ├── ssd_mobilenetv1_model-shard1.bin
       ├── face_landmark_68_model-weights_manifest.json
       ├── face_landmark_68_model-shard1.bin
       ├── face_expression_model-weights_manifest.json
       └── face_expression_model-shard1.bin
   ```

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
3. **ดูกรอบ Face Detection** → ระบบจะแสดงกรอบสีเขียวรอบใบหน้าที่ตรวจพบพร้อม confidence score
4. **ดูการตรวจจับอารมณ์** → ระบบจะแสดงอารมณ์ที่ตรวจพบพร้อม confidence score
5. **ถ่ายภาพหรืออัปโหลด** → 
   - กดปุ่ม "📸 ถ่ายภาพ" เพื่อจับภาพจากกล้อง
   - กดปุ่ม "📁 อัปโหลดภาพ" เพื่ออัปโหลดรูปภาพจากเครื่อง
6. **สร้างประโยค** → กดปุ่ม "✨ สร้างประโยค" เพื่อให้ AI แต่งประโยคจากคำที่จับได้ โดยจะพิจารณาอารมณ์ที่ตรวจพบด้วย
7. **ดูประวัติ** → ดูภาพที่จับได้ในแผงด้านขวาพร้อมข้อมูล confidence

## ทดสอบ API

สำหรับนักพัฒนา สามารถทดสอบ backend API ได้:

```bash
# ทดสอบ health check
curl http://localhost:8000/api/health

# ทดสอบสร้างประโยค
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"words": ["ผม", "รัก", "คุณ"], "emotion": "happy"}'

# หรือใช้ HTTPie
http POST localhost:8000/api/generate words:='["ผม", "รัก", "คุณ"]' emotion:=happy
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
│  ├── hand-model/                # Hand Model (Teachable Machine)
│  │  ├── model.json
│  │  └── weights.bin
│  └── face-model/                # Face Models (face-api.js)
│      ├── ssd_mobilenetv1_model-weights_manifest.json
│      ├── ssd_mobilenetv1_model-shard1.bin
│      ├── face_landmark_68_model-weights_manifest.json
│      ├── face_landmark_68_model-shard1.bin
│      ├── face_expression_model-weights_manifest.json
│      └── face_expression_model-shard1.bin
├── src/
│  ├── main.jsx                   # จุดเริ่มต้น React
│  ├── App.jsx                    # หน้าหลัก
│  ├── styles.css                 # สไตล์หลัก
│  ├── components/
│  │  ├── CameraFeed.jsx          # กล้องถ่ายภาพ + อัปโหลด + Face Detection
│  │  ├── RightPanel.jsx          # แผงผลลัพธ์และการสร้างประโยค
│  │  └── StatusBadge.jsx         # แสดงสถานะโมเดล
│  └── lib/
│     ├── config.js               # การตั้งค่า (โมเดล, API endpoints)
│     ├── tfInit.js               # TensorFlow.js initialization
│     ├── modelLoader.js          # โหลดโมเดลทั้งหมด
│     ├── imageProcessor.js       # ประมวลผลภาพ
│     ├── predictor.js            # ทำนายผล
│     ├── processor.js            # ควบคุมการประมวลผล
│     ├── unifiedProcessor.js     # รวมผลลัพธ์ Hand + Face + Emotion
│     └── tm.js                   # จัดการ Hand Model (main interface)
└── backend/
   ├── app.py                     # เซิร์ฟเวอร์ FastAPI พร้อม Typhoon LLM
   ├── api_demo.ipynb            # Jupyter Notebook สำหรับทดสอบ API
   ├── requirements.txt           # Python dependencies
   └── .env                       # ตัวแปรสภาพแวดล้อม (API keys)
```

## ❓ แก้ไขปัญหา

### โมเดลไม่ทำงาน

- ตรวจสอบไฟล์โมเดลใน public/hand-model/ (ต้องมี model.json, weights.bin)
- ดู console log ในเบราว์เซอร์ (F12)
- ตรวจสอบว่า Hand Model โหลดได้หรือไม่
- ตรวจสอบว่า face-api models โหลดได้หรือไม่

### Backend เชื่อมต่อไม่ได้

- ตรวจสอบว่าเปิด backend แล้ว (python app.py หรือ npm run start)
- ลองเข้า http://localhost:8000/api/health
- ตรวจสอบว่า Python dependencies ติดตั้งครบ (pip install -r requirements.txt)

### การ์ดแสดง "ใบหน้า: ไม่พร้อม"

- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต (face-api โหลดจาก repository)
- อนุญาตให้เว็บไซต์เข้าถึงกล้อง
- ตรวจสอบว่าหน้าเว็บทำงานผ่าน HTTPS หรือ localhost
- ดู console log ในเบราว์เซอร์ (F12) เพื่อดูข้อผิดพลาด

### ไม่มี API Key

- ไม่เป็นไร! ระบบจะใช้ fallback โดยจะเรียงคำต่อกันแบบง่ายๆ
- หากต้องการใช้ AI จริง ให้ใส่ TYPHOON_API_KEY ในไฟล์ backend/.env

### การทำนายไม่แม่นยำ

- ตรวจสอบแสงส่องกล้อง (ควรมีแสงเพียงพอ)
- วางมือให้อยู่ในกรอบกล้องอย่างชัดเจน
- ทำท่าภาษามือให้ตรงกับที่ train ไว้
- ตรวจสอบว่า Face Detection ทำงานได้ (กรอบสีเขียวรอบใบหน้า)

## ลิงก์ที่เป็นประโยชน์

- **Teachable Machine**: https://teachablemachine.withgoogle.com
- **face-api.js**: https://github.com/vladmandic/face-api
- **TensorFlow.js**: https://www.tensorflow.org/js
- **Typhoon AI**: https://typhoon.io
- **FastAPI Docs**: https://fastapi.tiangolo.com

## การเปลี่ยนแปลงล่าสุด

### v4.0 - Modular Architecture (ปัจจุบัน)
- ✅ **Modular Design** - แยกโค้ดเป็น modules ย่อย (tfInit, modelLoader, imageProcessor, predictor, processor)
- ✅ **Single TensorFlow.js** - ใช้ TensorFlow.js เวอร์ชันเดียวทั้งระบบ (3.21.0)
- ✅ **face-api.js Integration** - ใช้ face-api.js สำหรับ face detection และ emotion
- ✅ **Dynamic Preprocessing** - รองรับทั้ง Dense และ Conv2D layers
- ✅ **Error Handling** - ระบบจัดการข้อผิดพลาดที่แข็งแกร่ง
- ✅ **BOM Handling** - จัดการ BOM ใน JSON files
- ✅ **Unknown Input Support** - รองรับกรณีที่จดจำไม่ได้ (Unknown) ใน LLM

### v3.0 - Unified Model Architecture
- ✅ **Hand Model ใหม่** - ใช้ Pose Model เดียวรวม 9 คำ
- ✅ **Face Detection** - MediaPipe แสดงกรอบ real-time
- ✅ **Face Emotion** - TensorFlow H5 Model + Simple Detection Fallback
- ✅ **Upload Feature** - รองรับการอัปโหลดรูปภาพและถ่ายภาพ
- ✅ **Unified Processing** - รวมผลลัพธ์ Hand + Face + Emotion แบบ async
- ✅ **LLM Integration** - Typhoon v2.1-12b-instruct พร้อม Rate Limiting
- ✅ **JSON Output** - สร้าง JSON สำหรับ LLM อัตโนมัติ

### ข้อดีของระบบใหม่ v4.0
- **Modular Architecture** - โค้ดแยกเป็น modules ง่ายต่อการดูแล
- **Single TensorFlow.js** - ไม่มี version conflicts
- **face-api.js Integration** - ใช้ library ที่เสถียรสำหรับ face detection
- **Dynamic Preprocessing** - รองรับ model architectures หลายแบบ
- **Robust Error Handling** - ระบบไม่ล่มแม้มีข้อผิดพลาด
- **Unknown Input Support** - จัดการกรณีที่จดจำไม่ได้อย่างชาญฉลาด

## Backend API

### การตั้งค่า Backend
1. ติดตั้ง Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. สร้างไฟล์ `.env` ใน `backend/`:
   ```env
   # Typhoon API (หรือ LLM อื่นๆ)
   TYPHOON_API_KEY=your_api_key_here
   ```

3. รัน Backend:
   ```bash
   python app.py
   ```

### API Endpoints
- `GET /api/health` - ตรวจสอบสถานะ API
- `POST /api/generate` - สร้างประโยคจากภาษามือและอารมณ์

### การใช้งาน API
```javascript
// ตัวอย่างการเรียกใช้ API
const response = await fetch('http://localhost:8000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    words: ['สวัสดี', 'ขอบคุณ'],
    emotion: 'happy'
  })
});
```

## Technical Details

### Dependencies
- **Frontend**: React 18, Vite, TensorFlow.js 3.21.0, face-api.js 1.5.5
- **Backend**: FastAPI, Python 3.10+, Typhoon LLM
- **Models**: Teachable Machine (Hand), face-api.js (Face)

### Performance
- **FPS**: ~10 FPS (controlled by PROCESS_INTERVAL)
- **Memory**: TensorFlow.js memory management with dispose()
- **Backend**: WebGL → WASM → CPU fallback
- **Rate Limiting**: 10 requests/minute for LLM

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+