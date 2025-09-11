# โครงสร้างทีม Thai-HandMate Project

## 📋 สารบัญ (Index)

### 📖 คู่มือและเอกสารหลัก

- [📝 README หลักโปรเจค](./README.md) - ข้อมูลทั่วไปและการติดตั้ง
- [👥 TEAM GUIDE นี้](./TEAM_GUIDE.md) - คู่มือทีมและการแบ่งงาน

### 🤖 คู่มือแต่ละส่วนงาน

#### 👋 Person 1: Hand Model A

- [📋 คู่มือ Hand Model A](./public/models/handA/README.md) - วิธีสร้างและใช้งานโมเดล A
- [🔬 Jupyter Notebook ทดสอบ](./public/models/handA/handA_test.ipynb) - ทดสอบโมเดล A

#### 🤏 Person 2: Hand Model B

- [📋 คู่มือ Hand Model B](./public/models/handB/README.md) - วิธีสร้างและใช้งานโมเดล B
- [🔬 Jupyter Notebook ทดสอบ](./public/models/handB/handB_test.ipynb) - ทดสอบโมเดล B

#### 😊 Person 3: Face Expression Detection

- [📋 คู่มือ Face API](./public/face-models/README.md) - การติดตั้งและใช้งาน Face API
- [🔬 Jupyter Notebook ทดสอบ](./public/face-models/face_api_test.ipynb) - ทดสอบ Face API

#### 🧠 Person 4: LLM Backend

- [📋 คู่มือ Backend](./backend/README.md) - การตั้งค่า Backend และ LLM
- [🔬 Jupyter Notebook API Demo](./backend/api_demo.ipynb) - ทดสอบ API

---

## การแบ่งงานทีม (4 คน)

### Person 1: Hand Model A
**หน้าที่**: ดูแลโมเดลจดจำภาษามือกลุ่ม A
**ไฟล์สำคัญ**:
- `public/models/handA/README.md` - คู่มือการสร้างโมเดล
- `public/models/handA/handA_test.ipynb` - Notebook ทดสอบ
- `public/models/handA/` - วางไฟล์โมเดล

**ไฟล์โมเดลที่ต้องวาง**:
- `model.json` - โครงสร้างโมเดล (ห้ามเปลี่ยนชื่อ)
- `metadata.json` - ข้อมูลคลาส (ห้ามเปลี่ยนชื่อ)
- `weights.bin` - น้ำหนักโมเดล (ห้ามเปลี่ยนชื่อ)

**คำที่รับผิดชอบ**: สวัสดี, คิดถึง, น่ารัก, สวย, ชอบ, ไม่ชอบ, รัก, ขอโทษ, idle

**โค้ดที่อาจต้องแก้ไข**:
- `src/lib/config.js` - ปรับ threshold และ labels
- `src/lib/tm.js` - ปรับฟังก์ชัน loadHandAModel()
- `src/components/CameraFeed.jsx` - แสดงผล Hand A

### Person 2: Hand Model B  
**หน้าที่**: ดูแลโมเดลจดจำภาษามือกลุ่ม B
**ไฟล์สำคัญ**:
- `public/models/handB/README.md` - คู่มือการสร้างโมเดล
- `public/models/handB/handB_test.ipynb` - Notebook ทดสอบ
- `public/models/handB/` - วางไฟล์โมเดล

**ไฟล์โมเดลที่ต้องวาง**:
- `model.json` - โครงสร้างโมเดล (ห้ามเปลี่ยนชื่อ)
- `metadata.json` - ข้อมูลคลาส (ห้ามเปลี่ยนชื่อ)  
- `weights.bin` - น้ำหนักโมเดล (ห้ามเปลี่ยนชื่อ)

**คำที่รับผิดชอบ**: ขอบคุณ, ไม่เป็นไร, สบายดี, โชคดี, เก่ง, อิ่ม, หิว, เศร้า, idle

**โค้ดที่อาจต้องแก้ไข**:
- `src/lib/config.js` - ปรับ threshold และ labels
- `src/lib/tm.js` - ปรับฟังก์ชัน loadHandBModel()
- `src/components/CameraFeed.jsx` - แสดงผล Hand B

### Person 3: Face Expression Detection
**หน้าที่**: ดูแลระบบตรวจจับอารมณ์จากใบหน้า
**ไฟล์สำคัญ**:
- `public/face-models/README.md` - คู่มือติดตั้ง Face API
- `public/face-models/face_api_test.ipynb` - Notebook ทดสอบ
- `public/face-models/` - วางไฟล์โมเดล

**ไฟล์โมเดลที่ต้องวาง** (ดาวน์โหลดจาก face-api.js):
- `tiny_face_detector_model-weights_manifest.json` และ `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json` และ `face_landmark_68_model-shard1`  
- `face_expression_model-weights_manifest.json` และ `face_expression_model-shard1`
- `face_recognition_model-weights_manifest.json` และ `face_recognition_model-shard1`

**ความรับผิดชอบ**: ตรวจจับอารมณ์ (Happy, Sad, Angry, Surprised, Neutral, Fearful, Disgusted)

**โค้ดที่ต้องสร้าง/แก้ไข**:
- `src/lib/faceApi.js` - สร้างไฟล์ใหม่สำหรับ Face API
- `src/lib/config.js` - เพิ่มการตั้งค่า Face API
- `src/components/CameraFeed.jsx` - เพิ่มการแสดงผลอารมณ์

### Person 4: LLM Backend
**หน้าที่**: ดูแลระบบ Backend API และ LLM
**ไฟล์สำคัญ**:
- `backend/README.md` - คู่มือตั้งค่า LLM และ Backend
- `backend/api_demo.ipynb` - Notebook ทดสอب API
- `backend/app.py` - FastAPI application
- `backend/requirements.txt` - Python dependencies

**ไฟล์ที่ต้องสร้าง**:
- `backend/.env` - API Keys และการตั้งค่า
```bash
GEMINI_API_KEY=your_api_key_here
LLM_PROVIDER=gemini
CORS_ORIGINS=http://localhost:5173
```

**ความรับผิดชอบ**: API Endpoints, Google Gemini/OpenAI integration, ประมวลผลข้อมูล

**โค้ดที่อาจต้องแก้ไข**:
- `backend/app.py` - ปรับ CORS, prompt engineering
- `src/components/CameraFeed.jsx` - เรียก Backend API

## ขั้นตอนการทำงาน

### ขั้นตอนที่ 1: เตรียมโมเดล (Person 1-3)
1. Person 1: สร้างโมเดล Hand A ตาม README
2. Person 2: สร้างโมเดล Hand B ตาม README  
3. Person 3: ตั้งค่า Face API ตาม README
4. ทุกคนทดสอบผ่าน Jupyter Notebooks

### ขั้นตอนที่ 2: ตั้งค่า Backend (Person 4)
1. ติดตั้ง Python dependencies: `pip install -r requirements.txt`
2. ตั้งค่า API Key ในไฟล์ `.env`
3. ทดสอบ LLM ผ่าน `backend/api_demo.ipynb`
4. รัน Backend server: `uvicorn app:app --reload`

### ขั้นตอนที่ 3: รันระบบ (ทุกคน)
1. รัน Frontend: `npm run dev`
2. เปิดเว็บไซต์: http://localhost:5173
3. ทดสอบการทำงานร่วมกันของทุกโมเดล

## การสื่อสารทีม

### เมื่อมีปัญหา
- **โมเดล Hand A ไม่แม่นยำ** → ติดต่อ Person 1
- **โมเดล Hand B ไม่แม่นยำ** → ติดต่อ Person 2  
- **Face API ไม่ทำงาน** → ติดต่อ Person 3
- **Backend API error** → ติดต่อ Person 4
- **Frontend ไม่ทำงาน** → ปรึกษาร่วมกัน

### การประชุมทีม
1. **Daily Standup**: ประชุมสั้นๆ ทุกวัน รายงานความคืบหน้า
2. **Weekly Review**: ทบทวนผลงานและแผนสัปดาห์หน้า
3. **Testing Session**: ทดสอบระบบร่วมกันเมื่อทุกคนเสร็จ

## เป้าหมายคุณภาพ

### ความแม่นยำโมเดล
- **Hand Models**: > 85% accuracy
- **Face API**: > 70% confidence
- **LLM Response**: เป็นภาษาไทยที่เข้าใจได้

### ประสิทธิภาพระบบ
- **Response Time**: < 2 วินาที
- **Real-time Detection**: > 15 FPS
- **Error Rate**: < 5%

## ไฟล์ที่ถูกลบออกแล้ว (ไม่ต้องสนใจ)

- README_new.md
- package_new.json  
- index_new.html
- backend/app_new.py
- backend/requirements_new.txt
- backend/api_demo_fixed.ipynb
- PROJECT_STRUCTURE_FINAL.md
- RESTRUCTURE_COMPLETE.md

**สถานะ**: โปรเจ็กต์พร้อมเริ่มงาน - ไม่มีไฟล์ซ้ำซ้อน
