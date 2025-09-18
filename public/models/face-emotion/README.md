# Face Emotion Model (Picture - FER2013)

## อารมณ์ที่รองรับ (7 อารมณ์)
- angry
- disgust
- fear
- happy
- sad
- surprised
- neutral

## วิธีการเทรนโมเดล
1. ไปที่ [Teachable Machine](https://teachablemachine.withgoogle.com/train/image)
2. เลือก **Image Project** (Standard Image Model)
3. สร้าง 7 Classes ตามอารมณ์ด้านบน
4. นำเข้าภาพจาก FER2013 dataset:
   - Download FER2013 dataset จาก [Kaggle](https://www.kaggle.com/datasets/msambare/fer2013)
   - แยกภาพตาม emotion label (0=Angry, 1=Disgust, 2=Fear, 3=Happy, 4=Sad, 5=Surprise, 6=Neutral)
   - Upload ภาพอย่างน้อย 200-500 ภาพต่ออารมณ์
5. Train Model
6. Export เป็น **TensorFlow.js** format
7. วางไฟล์ 3 ไฟล์ในโฟลเดอร์นี้:
   - `model.json`
   - `metadata.json`
   - `weights.bin`

## การตั้งค่า
- Model Type: **Picture Model** (Standard Image)
- Input Size: 48x48 (FER2013 standard)
- Image Type: Grayscale
- Confidence Threshold: 0.6
- Dataset: FER2013 (35,887 images)

## หมายเหตุ
- FER2013 เป็น dataset มาตรฐานสำหรับ emotion recognition
- ภาพทั้งหมดเป็น grayscale ขนาด 48x48 pixels
- ถ้าไม่มีโมเดล ระบบจะใช้ Simple Emotion Detection แทน (fallback)
