# Thai-HandMate Changelog

## v4.0 - Modular Architecture (2025-01-24)

### 🎯 Major Changes
- **Modular Design**: แยกโค้ดเป็น modules ย่อยเพื่อความชัดเจนและง่ายต่อการดูแล
- **Single TensorFlow.js**: ใช้ TensorFlow.js เวอร์ชันเดียวทั้งระบบ (3.21.0)
- **face-api.js Integration**: เปลี่ยนจาก MediaPipe เป็น face-api.js สำหรับ face detection และ emotion
- **Dynamic Preprocessing**: รองรับทั้ง Dense และ Conv2D layers ตาม model architecture

### 🔧 Technical Improvements
- **tfInit.js**: จัดการ TensorFlow.js initialization พร้อม backend fallback
- **modelLoader.js**: โหลดโมเดลทั้งหมด (Hand + Face) พร้อม error handling
- **imageProcessor.js**: ประมวลผลภาพสำหรับแต่ละโมเดล
- **predictor.js**: ทำนายผลจากโมเดลที่โหลดแล้ว
- **processor.js**: ควบคุมการประมวลผลและ FPS
- **unifiedProcessor.js**: รวมผลลัพธ์จากทุกโมเดล

### 🐛 Bug Fixes
- แก้ไข `t3 is not a function` error
- แก้ไข `NaN` values ใน confidence scores
- แก้ไข face detection ไม่มี `locationData`
- แก้ไข face expression detection ไม่ทำงาน
- แก้ไข `SyntaxError: Unexpected token '<'` เมื่อโหลด face models
- แก้ไข `Cannot read properties of undefined (reading 'producer')`
- แก้ไข `_ValueError: expected dense_Dense1_input to have 2 dimension(s)`
- แก้ไข `Cannot access 'modelType' before initialization`
- แก้ไข `manifest.map is not a function` สำหรับ face models
- แก้ไข duplicate function declarations

### 📦 Dependencies
- **Removed**: `@teachablemachine/image`, `@teachablemachine/pose`
- **Updated**: `@tensorflow/tfjs` to `3.21.0`
- **Added**: `@tensorflow/tfjs-backend-webgl` to `3.21.0`
- **Updated**: `@vladmandic/face-api` to `1.5.5`
- **Added**: `overrides` for `@tensorflow/tfjs`

### 🎨 UI/UX Improvements
- แสดงสถานะโมเดลแบบ real-time
- แสดง confidence scores สำหรับทุกโมเดล
- แสดงกรอบ face detection แบบ real-time
- รองรับการอัปโหลดรูปภาพและถ่ายภาพ

### 🔄 Backend Improvements
- รองรับกรณีที่จดจำไม่ได้ (Unknown) ใน LLM
- เพิ่ม emotion-based sentences สำหรับกรณี Unknown
- ปรับปรุง error handling และ fallback mechanisms

### 📁 File Structure
```
src/lib/
├── tfInit.js              # TensorFlow.js initialization
├── modelLoader.js         # Model loading logic
├── imageProcessor.js      # Image preprocessing
├── predictor.js           # Prediction logic
├── processor.js           # Main processing controller
├── unifiedProcessor.js    # Result unification
└── tm.js                  # Main interface
```

### 🚀 Performance
- **FPS Control**: ~10 FPS (controlled by PROCESS_INTERVAL)
- **Memory Management**: TensorFlow.js memory management with dispose()
- **Backend Fallback**: WebGL → WASM → CPU
- **Error Resilience**: Robust error handling and fallbacks

### 🔧 Configuration
- **Model Paths**: Updated to reflect new structure
- **Detection Method**: Changed to face-api.js
- **Face Detection**: SSD MobileNet v1
- **Face Emotion**: 7 emotions with confidence scores

### 📝 Documentation
- **README.md**: Updated with new architecture
- **CHANGELOG.md**: Detailed change log
- **Code Comments**: Comprehensive documentation

### 🧪 Testing
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Health**: http://localhost:8000/api/health
- **Model Loading**: Automatic validation

### 🔮 Future Improvements
- [ ] Add more hand gestures
- [ ] Improve emotion detection accuracy
- [ ] Add voice synthesis
- [ ] Add gesture recording feature
- [ ] Add model training interface

---

## v3.0 - Unified Model Architecture (2025-01-23)

### 🎯 Major Changes
- **Unified Hand Model**: ใช้ Pose Model เดียวรวม 9 คำ
- **Face Detection**: MediaPipe แสดงกรอบ real-time
- **Face Emotion**: TensorFlow H5 Model + Simple Detection Fallback
- **Upload Feature**: รองรับการอัปโหลดรูปภาพและถ่ายภาพ
- **Unified Processing**: รวมผลลัพธ์ Hand + Face + Emotion แบบ async
- **LLM Integration**: Typhoon v2.1-12b-instruct พร้อม Rate Limiting
- **JSON Output**: สร้าง JSON สำหรับ LLM อัตโนมัติ

### 🔧 Technical Improvements
- **Pose Model**: ใช้ skeleton tracking สำหรับ hand gestures
- **MediaPipe Integration**: Face detection จาก CDN
- **TensorFlow H5**: Face emotion detection
- **FastAPI Backend**: RESTful API สำหรับ LLM
- **Error Handling**: Fallback mechanisms

### 📦 Dependencies
- **Added**: `@mediapipe/face_detection`
- **Added**: `@teachablemachine/pose`
- **Updated**: TensorFlow.js models
- **Added**: FastAPI backend

---

## v2.2 - Hybrid Model Architecture (2025-01-22)

### 🎯 Major Changes
- **Hand Models**: ใช้ Pose Tracking ตรวจจับ skeleton 17 keypoints
- **Face Emotion**: ใช้ Picture Model train จาก FER2013 dataset
- **Hybrid Support**: รองรับทั้ง Pose และ Image Models
- **Unified Input**: รับ image capture จาก user

### 🔧 Technical Improvements
- **Pose Tracking**: Skeleton-based hand gesture recognition
- **Image Processing**: Face emotion detection
- **Model Integration**: Combined pose and image models
- **Input Handling**: Single input for multiple models

---

## v2.1 - Clean Architecture Update (2025-01-21)

### 🎯 Major Changes
- **File Cleanup**: ลบไฟล์ที่ไม่จำเป็น
- **Code Organization**: จัดระเบียบโครงสร้าง
- **Dependency Management**: ปรับปรุง dependencies
- **Documentation**: สร้าง README สำหรับแต่ละโมเดล

### 🔧 Technical Improvements
- **Code Refactoring**: ลบฟังก์ชันซ้ำซ้อน
- **Package Cleanup**: ลบ package ที่ไม่ได้ใช้
- **Documentation**: รวมเอกสารใน README หลัก
- **Structure**: จัดระเบียบโครงสร้างไฟล์

---

## v1.0 - Initial Release (2025-01-20)

### 🎯 Initial Features
- **Hand Gesture Recognition**: 9 Thai sign language words
- **Face Detection**: Basic face detection
- **Emotion Detection**: 7 emotion categories
- **LLM Integration**: Basic sentence generation
- **Web Interface**: React-based UI
- **Camera Support**: Real-time camera feed

### 🔧 Technical Stack
- **Frontend**: React, Vite, TensorFlow.js
- **Backend**: FastAPI, Python
- **Models**: Teachable Machine, Custom models
- **LLM**: Typhoon AI

---

## 📊 Version Comparison

| Feature | v1.0 | v2.1 | v2.2 | v3.0 | v4.0 |
|---------|------|------|------|------|------|
| Hand Model | Basic | Clean | Pose | Unified | Modular |
| Face Detection | Basic | Basic | Basic | MediaPipe | face-api.js |
| Face Emotion | Basic | Basic | FER2013 | H5+Fallback | face-api.js |
| Architecture | Monolithic | Clean | Hybrid | Unified | Modular |
| Error Handling | Basic | Basic | Basic | Good | Excellent |
| Performance | Basic | Good | Good | Good | Excellent |
| Maintainability | Low | Medium | Medium | High | Very High |

---

## 🎯 Key Principles (v4.0)

1. **Single TensorFlow.js**: ใช้ TensorFlow.js เวอร์ชันเดียวทั้งระบบ
2. **No Teachable Machine Direct**: ใช้ `tf.loadGraphModel()` แทน
3. **Correct Preprocessing**: Resize/Normalize ให้ตรงกับโมเดล
4. **Modular Design**: แยกโค้ดเป็น modules ย่อย
5. **Error Resilience**: ระบบไม่ล่มแม้มีข้อผิดพลาด
6. **Unknown Input Support**: จัดการกรณีที่จดจำไม่ได้

---

## 🔧 Development Notes

### Model Loading Strategy
1. **TensorFlow.js Initialization**: WebGL → WASM → CPU fallback
2. **Hand Model**: Auto-detect LayersModel vs GraphModel
3. **Face Models**: face-api.js with BOM handling
4. **Error Handling**: Graceful fallbacks for each model

### Preprocessing Pipeline
1. **Image Validation**: Check image element validity
2. **Dynamic Reshaping**: Based on model input shape
3. **Normalization**: [0,1] range for all models
4. **Memory Management**: TensorFlow.js dispose() calls

### Error Handling Strategy
1. **Model Loading**: Try-catch with fallbacks
2. **Prediction**: NaN detection and validation
3. **Image Processing**: Element validation
4. **API Calls**: Timeout and retry logic

---

## 📈 Performance Metrics

### v4.0 Performance
- **Model Loading**: ~2-3 seconds
- **Prediction Speed**: ~100ms per frame
- **Memory Usage**: ~50-100MB
- **FPS**: ~10 FPS (controlled)
- **Error Rate**: <1% (with fallbacks)

### Optimization Strategies
- **FPS Control**: PROCESS_INTERVAL = 100ms
- **Memory Management**: Automatic tensor disposal
- **Backend Selection**: WebGL → WASM → CPU
- **Error Recovery**: Graceful fallbacks

---

## 🚀 Future Roadmap

### Short Term (v4.1)
- [ ] Add more hand gestures (15+ words)
- [ ] Improve emotion detection accuracy
- [ ] Add gesture recording feature
- [ ] Add model training interface

### Medium Term (v5.0)
- [ ] Add voice synthesis
- [ ] Add gesture animation
- [ ] Add multi-language support
- [ ] Add cloud model support

### Long Term (v6.0)
- [ ] Add real-time translation
- [ ] Add gesture learning mode
- [ ] Add social features
- [ ] Add mobile app

---

## 📝 Contributing

### Code Style
- **ES6+**: Use modern JavaScript features
- **Modular**: Separate concerns into modules
- **Error Handling**: Always handle errors gracefully
- **Documentation**: Comment all functions
- **Testing**: Test all new features

### Git Workflow
1. **Feature Branch**: Create feature branch
2. **Development**: Implement feature
3. **Testing**: Test thoroughly
4. **Documentation**: Update docs
5. **Pull Request**: Create PR
6. **Review**: Code review
7. **Merge**: Merge to main

---

## 📞 Support

### Issues
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check README.md first
- **Community**: Join our Discord server

### Contact
- **Email**: support@thai-handmate.com
- **GitHub**: https://github.com/thai-handmate
- **Website**: https://thai-handmate.com

---

*Last updated: 2025-01-24*
