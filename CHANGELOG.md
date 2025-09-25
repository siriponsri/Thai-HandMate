# CHANGELOG

## [1.0.0] - 2025-09-25

### Added
- ระบบจดจำภาษามือไทย 9 คำ ด้วย TensorFlow.js
- ระบบตรวจจับใบหน้าและอารมณ์ 7 แบบ ด้วย TensorFlow.js
- ระบบสร้างประโยคไทยธรรมชาติด้วย Typhoon LLM
- รองรับการถ่ายภาพและอัปโหลดรูปภาพ
- แสดงกรอบ Face Detection แบบ real-time
- แสดงค่า confidence score สำหรับทุกการทำนาย
- รองรับการประมวลผลแบบ async

### Changed
- เปลี่ยนจาก face-api.js เป็น TensorFlow.js สำหรับ face detection และ emotion
- ปรับปรุง preprocessing functions ให้รองรับ input shapes ที่ถูกต้อง
- ปรับปรุง UI layout โดยย้ายปุ่มออกมานอกกรอบกล้อง
- ปรับปรุง error handling และ fallback mechanisms

### Fixed
- แก้ไข Hand Model input shape mismatch (150528 → 14739)
- แก้ไข Face Model input dimensions (5D → 4D)
- แก้ไข grayscale conversion สำหรับ face emotion model
- แก้ไข weights loading สำหรับ face model

### Technical Details
- **Hand Model**: TensorFlow.js LayersModel (Dense layer, 14739 features)
- **Face Model**: TensorFlow.js LayersModel (Conv2D + Dense, 48x48 grayscale)
- **Backend**: FastAPI + Typhoon LLM
- **Frontend**: React + Vite + TensorFlow.js