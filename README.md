# Thai-HandMate
ระบบจดจำภาษามือไทย พร้อมสร้างประโยคอัตโนมัติด้วย AI

## ภาพรวม
Thai-HandMate เป็นเว็บแอปพลิเคชันที่ใช้กล้องถ่ายภาพมือ จดจำคำภาษามือไทย ตรวจจับใบหน้า และสร้างประโยคธรรมชาติด้วย AI 

**คุณสมบัติหลัก:**
- จดจำภาษามือไทย 9 คำ ด้วย TensorFlow.js (Teachable Machine)
- ตรวจจับใบหน้าด้วย TensorFlow.js (Simple Brightness Detection)
- ตรวจจับอารมณ์ 7 แบบด้วย TensorFlow.js (Custom Face Model)
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

### Face Detection & Emotion (TensorFlow.js)
- **Face Detection**: Simple Brightness Detection (Fallback)
- **Face Expression**: 7 emotions (angry, disgust, fear, happy, neutral, sad, surprised)
- **Input Resolution**: 48x48 pixels Grayscale
- **Architecture**: Conv2D + Dense layers
- **Confidence Threshold**: 0.5

### Backend LLM
- **โมเดล**: typhoon-v2.1-12b-instruct
- **ความสามารถ**: สร้างประโยคไทยที่สมเหตุสมผลจากคำที่ป้อนและอารมณ์ที่ตรวจพบ
- **Rate Limiting**: 10 requests/minute
- **Fallback**: หากไม่มี API key จะใช้การต่อคำแบบง่าย

## โครงสร้างโปรเจกต์

```
thai-handmate/
├── public/                          # ไฟล์สาธารณะ
│   ├── hand-model/                  # Hand Model (Teachable Machine)
│   │   ├── model.json
│   │   ├── weights.bin
│   │   └── metadata.json
│   └── face-model/                  # Face Model (TensorFlow.js)
│       ├── model.json
│       ├── weights.bin
│       ├── group1-shard1of5.bin
│       ├── group1-shard2of5.bin
│       ├── group1-shard3of5.bin
│       ├── group1-shard4of5.bin
│       └── group1-shard5of5.bin
├── src/                            # Source Code
│   ├── components/                 # React Components
│   │   ├── CameraFeed.jsx         # กล้องและปุ่มถ่ายภาพ
│   │   ├── RightPanel.jsx         # แผงผลลัพธ์และประวัติ
│   │   └── StatusBadge.jsx        # แสดงสถานะโมเดล
│   ├── lib/                       # ไลบรารีหลัก
│   │   ├── tm.js                  # ระบบหลักสำหรับ model loading
│   │   ├── tfInit.js              # เริ่มต้น TensorFlow.js
│   │   ├── modelLoader.js         # โหลดโมเดล TensorFlow.js
│   │   ├── imageProcessor.js      # preprocess ภาพ
│   │   ├── predictor.js           # ทำนายผลจากโมเดล
│   │   ├── processor.js           # ควบคุมการประมวลผล
│   │   ├── unifiedProcessor.js    # รวมผลลัพธ์
│   │   └── config.js              # การตั้งค่าระบบ
│   ├── App.jsx                    # Main App Component
│   ├── main.jsx                   # Entry Point
│   └── styles.css                 # Global Styles
├── backend/                        # Backend API
│   ├── app.py                     # FastAPI Application
│   └── requirements.txt           # Python Dependencies
├── package.json                   # Node.js Dependencies
├── vite.config.js                 # Vite Configuration
├── start.bat                      # Windows Start Script
└── README.md                      # เอกสารโปรเจกต์
```

## User Workflow

### 1. เริ่มต้นใช้งาน
1. **เปิดเว็บแอป** → ระบบจะเริ่มโหลดโมเดลอัตโนมัติ
2. **อนุญาตกล้อง** → กล้องจะเริ่มทำงานและแสดงวิดีโอ
3. **รอโมเดลโหลด** → แสดงสถานะ "✅ ทุกโมเดลพร้อม (2/2)"

### 2. การจดจำภาษามือ
1. **ทำท่าภาษามือ** → ระบบจะประมวลผลแบบ real-time
2. **ดูผลลัพธ์** → แสดงคำที่จับได้พร้อม confidence score
3. **ดูกรอบใบหน้า** → แสดงกรอบสีเขียวรอบใบหน้าที่ตรวจพบ
4. **ดูอารมณ์** → แสดงอารมณ์ที่ตรวจพบพร้อม confidence

### 3. การถ่ายภาพและสร้างประโยค
1. **กดปุ่ม "ถ่ายภาพ"** → จับภาพจากกล้อง
2. **กดปุ่ม "อัปโหลดภาพ"** → อัปโหลดรูปจากเครื่อง
3. **ดูประวัติ** → ภาพที่จับได้จะแสดงในแผงด้านขวา
4. **กดปุ่ม "สร้างประโยค"** → AI จะสร้างประโยคไทยจากคำและอารมณ์

### 4. การแสดงผล
- **แผงซ้าย**: กล้อง, ปุ่มถ่ายภาพ/อัปโหลด
- **แผงขวา**: ผลลัพธ์, ประวัติ, ปุ่มสร้างประโยค
- **สถานะ**: แสดงสถานะโมเดลและความมั่นใจ

## Code Structure

### 1. Frontend Architecture (React + Vite)
```
src/
├── components/                 # UI Components
│   ├── CameraFeed.jsx         # กล้อง, ถ่ายภาพ, อัปโหลด
│   ├── RightPanel.jsx         # แผงผลลัพธ์, ประวัติ, สร้างประโยค
│   └── StatusBadge.jsx        # แสดงสถานะโมเดล
├── lib/                       # Core Libraries
│   ├── tm.js                  # Main API for model operations
│   ├── tfInit.js              # TensorFlow.js initialization
│   ├── modelLoader.js         # Model loading system
│   ├── imageProcessor.js      # Image preprocessing
│   ├── predictor.js           # Model prediction
│   ├── processor.js           # Processing controller
│   ├── unifiedProcessor.js    # Result unification
│   └── config.js              # Configuration settings
├── App.jsx                    # Main App Component
├── main.jsx                   # React Entry Point
└── styles.css                 # Global Styles
```

### 2. Model Loading System
- **tfInit.js**: เริ่มต้น TensorFlow.js backend (WebGL/WASM/CPU)
- **modelLoader.js**: โหลด Hand Model และ Face Model
- **tm.js**: ระบบหลักสำหรับ model loading และ processing

### 3. Image Processing Pipeline
- **imageProcessor.js**: preprocess ภาพสำหรับแต่ละโมเดล
  - Hand Model: 224x224 RGB → Flatten to 14739 features
  - Face Model: 48x48 Grayscale → 4D tensor
- **predictor.js**: ทำนายผลจากโมเดลที่โหลดแล้ว
- **processor.js**: ควบคุมการประมวลผลแบบ async

### 4. Backend API (FastAPI)
- **app.py**: FastAPI server สำหรับสร้างประโยค
- **Typhoon LLM**: สร้างประโยคไทยจากคำและอารมณ์
- **Rate Limiting**: จำกัดการเรียกใช้ API

## Datasets

### 1. Hand Gesture Dataset
- **แหล่งที่มา**: Teachable Machine Image Model
- **จำนวนคำ**: 9 คำ (เริ่ม, เรียนรู้, AI, อย่างไร, ช่วยเหลือ, ไม่ใช่, หยุด, ถัดไป, สถานะว่าง)
- **จำนวนภาพ**: 50-100 samples ต่อคำ
- **รูปแบบ**: RGB images, 224x224 pixels
- **การแบ่งข้อมูล**: 80% training, 20% validation
- **การเพิ่มข้อมูล**: Rotation, brightness, contrast augmentation

### 2. Face Expression Dataset
- **แหล่งที่มา**: Custom TensorFlow.js Model
- **จำนวนอารมณ์**: 7 อารมณ์ (angry, disgust, fear, happy, neutral, sad, surprised)
- **รูปแบบ**: Grayscale images, 48x48 pixels
- **สถาปัตยกรรม**: Conv2D + Dense layers
- **การเพิ่มข้อมูล**: Grayscale conversion, normalization

### 3. Thai Language Dataset
- **แหล่งที่มา**: Typhoon LLM (typhoon-v2.1-12b-instruct)
- **ภาษา**: ไทย
- **ประเภท**: Text generation, sentence construction
- **การใช้งาน**: สร้างประโยคจากคำและอารมณ์
- **Rate Limiting**: 10 requests/minute

### 4. Model Files
```
public/
├── hand-model/                  # Hand Gesture Model
│   ├── model.json              # Model topology
│   ├── weights.bin             # Model weights
│   └── metadata.json           # Model metadata
└── face-model/                  # Face Expression Model
    ├── model.json              # Model topology
    ├── weights.bin             # Combined weights
    ├── group1-shard1of5.bin    # Weight shard 1
    ├── group1-shard2of5.bin    # Weight shard 2
    ├── group1-shard3of5.bin    # Weight shard 3
    ├── group1-shard4of5.bin    # Weight shard 4
    └── group1-shard5of5.bin    # Weight shard 5
```

## การรันโปรเจกต์

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm หรือ yarn

### Installation
```bash
# ติดตั้ง dependencies
npm install

# ติดตั้ง backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Running
```bash
# รันทั้ง Frontend และ Backend
npm run start

# หรือรันแยกกัน
npm run dev          # Frontend (port 5173)
cd backend && python app.py  # Backend (port 8000)
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## API Endpoints

### POST /api/generate
สร้างประโยคไทยจากคำและอารมณ์

**Request Body:**
```json
{
  "words": ["เริ่ม", "เรียนรู้"],
  "emotion": "happy",
  "word_confidences": [0.8, 0.7],
  "emotion_confidences": [0.6, 0.2, 0.1, 0.8, 0.1, 0.1, 0.1]
}
```

**Response:**
```json
{
  "sentences": [
    "เริ่มเรียนรู้กันเถอะ",
    "มาดูกันว่าเริ่มเรียนรู้อย่างไร",
    "เริ่มต้นการเรียนรู้ใหม่"
  ]
}
```

## การเปลี่ยนแปลงล่าสุด

### [1.0.0] - 2025-09-25

#### ✅ เพิ่มฟีเจอร์ใหม่
- ระบบจดจำภาษามือไทย 9 คำ ด้วย TensorFlow.js
- ระบบตรวจจับใบหน้าและอารมณ์ 7 แบบ ด้วย TensorFlow.js
- ระบบสร้างประโยคไทยธรรมชาติด้วย Typhoon LLM
- รองรับการถ่ายภาพและอัปโหลดรูปภาพ
- แสดงกรอบ Face Detection แบบ real-time
- แสดงค่า confidence score สำหรับทุกการทำนาย
- รองรับการประมวลผลแบบ async

#### 🔄 ปรับปรุงระบบ
- เปลี่ยนจาก face-api.js เป็น TensorFlow.js สำหรับ face detection และ emotion
- ปรับปรุง preprocessing functions ให้รองรับ input shapes ที่ถูกต้อง
- ปรับปรุง UI layout โดยย้ายปุ่มออกมานอกกรอบกล้อง
- ปรับปรุง error handling และ fallback mechanisms

#### 🐛 แก้ไขปัญหา
- แก้ไข Hand Model input shape mismatch (150528 → 14739)
- แก้ไข Face Model input dimensions (5D → 4D)
- แก้ไข grayscale conversion สำหรับ face emotion model
- แก้ไข weights loading สำหรับ face model

#### 🔧 รายละเอียดเทคนิค
- **Hand Model**: TensorFlow.js LayersModel (Dense layer, 14739 features)
- **Face Model**: TensorFlow.js LayersModel (Conv2D + Dense, 48x48 grayscale)
- **Backend**: FastAPI + Typhoon LLM
- **Frontend**: React + Vite + TensorFlow.js

## ไฟล์สำคัญ

### Frontend
- `src/lib/tm.js` - ระบบหลักสำหรับ model loading และ processing
- `src/lib/modelLoader.js` - โหลดโมเดล TensorFlow.js
- `src/lib/imageProcessor.js` - preprocess ภาพสำหรับแต่ละโมเดล
- `src/lib/predictor.js` - ทำนายผลจากโมเดล
- `src/lib/processor.js` - ควบคุมการประมวลผล
- `src/components/CameraFeed.jsx` - กล้องและปุ่มถ่ายภาพ
- `src/components/RightPanel.jsx` - แผงผลลัพธ์และประวัติ

### Backend
- `backend/app.py` - FastAPI backend สำหรับสร้างประโยค
- `backend/requirements.txt` - Python dependencies

## License
MIT License