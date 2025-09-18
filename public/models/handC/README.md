# Hand C Model (Pose)

## คำที่รองรับ (5 คำ)
- ฉลาด
- เป็นห่วง
- ไม่สบาย
- เข้าใจ
- Idle

## วิธีการเทรนโมเดล
1. ไปที่ [Teachable Machine](https://teachablemachine.withgoogle.com/train/pose)
2. เลือก **Pose Project** (ไม่ใช่ Image Project)
3. สร้าง 5 Classes ตามคำด้านบน
4. บันทึกท่าทางภาษามือสำหรับแต่ละคำ:
   - ใช้กล้อง webcam บันทึกท่าทาง
   - บันทึกอย่างน้อย 50-100 samples ต่อท่า
   - ลองหลายมุม หลายระยะ
5. Train Model
6. Export เป็น **TensorFlow.js** format
7. วางไฟล์ 3 ไฟล์ในโฟลเดอร์นี้:
   - `model.json`
   - `metadata.json`
   - `weights.bin`

## การตั้งค่า
- Model Type: **Pose Model** (Skeleton Tracking)
- Input Size: 224x224
- Confidence Threshold: 0.7
- Skeleton Points: 17 keypoints

## หมายเหตุ
- Pose Model จะตรวจจับโครงกระดูก (skeleton) แทนรูปภาพ
- ทำให้ไม่ขึ้นกับพื้นหลังหรือสีผิว
- แม่นยำกว่าสำหรับท่าทางภาษามือ
