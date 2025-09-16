# Face Emotion Model (Teachable Machine)

## โมเดลตรวจจับอารมณ์จากใบหน้า

### ไฟล์ที่ต้องมี:
- `model.json` - โครงสร้างโมเดล
- `metadata.json` - ข้อมูลเมตาดาต้า
- `weights.bin` - น้ำหนักของโมเดล

### วิธีการสร้าง:
1. ไปที่ https://teachablemachine.withgoogle.com/train/image
2. สร้าง Image Project
3. สร้าง 7 classes: angry, disgust, fear, happy, sad, surprised, neutral
4. เก็บข้อมูลภาพแต่ละ class 200-500 ภาพ
5. Train Model
6. Export เป็น TensorFlow.js
7. วางไฟล์ 3 ไฟล์ในโฟลเดอร์นี้

### การใช้งาน:
- โมเดลจะถูกโหลดโดย `faceEmotionModel.js`
- ใช้ร่วมกับ `unifiedProcessor.js`
- ส่งผลลัพธ์เป็น JSON สำหรับ LLM
