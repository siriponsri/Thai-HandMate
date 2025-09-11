# คู่มือ Face API Models - สำหรับทีม No-Code

**Person 3: คุณรับผิดชอบระบบ Face Expression Detection**  
คู่มือนี้จะพาคุณไปตั้งแต่การติดตั้งโมเดลจนใช้งานได้จริงในระบบ

## เกี่ยวกับ Face API

Face API ใช้สำหรับ:
- ตรวจจับอารมณ์จากใบหน้า (Happy, Sad, Angry, Surprised, etc.)
- ตรวจจับใบหน้า (Face Detection)
- วิเคราะห์ลักษณะใบหน้า (Age, Gender - เป็นตัวเลือก)

### วัตถุประสงค์ในโปรเจค

1. **เพิ่มความแม่นยำ** - ใช้อารมณ์จากใบหน้าช่วยการทำนายภาษามือ
2. **Real-time Analysis** - วิเคราะห์อารมณ์แบบ Real-time จากกล้อง
3. **User Experience** - แสดงผลอารมณ์ให้ผู้ใช้เห็น

---

## การติดตั้งและใช้งาน Face-api.js

### ไฟล์โมเดลที่ต้องมี
```
ไฟล์โมเดลจาก face-api.js repository:
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json  
├── face_recognition_model-shard1
├── face_expression_model-weights_manifest.json
├── face_expression_model-shard1
├── tiny_face_detector_model-weights_manifest.json
└── tiny_face_detector_model-shard1
```

### Path ที่ต้องวางไฟล์ในโปรเจค
```
thai-handmate/
└── public/
    └── face-models/                    ← โฟลเดอร์สำหรับ Person 3
        ├── face_landmark_68_model-weights_manifest.json
        ├── face_landmark_68_model-shard1
        ├── face_recognition_model-weights_manifest.json
        ├── face_recognition_model-shard1
        ├── face_expression_model-weights_manifest.json
        ├── face_expression_model-shard1
        ├── tiny_face_detector_model-weights_manifest.json
        ├── tiny_face_detector_model-shard1
        ├── README.md                   ← คู่มือนี้
        └── face_api_test.ipynb         ← ไฟล์ทดสอบ
```

### ลิงค์ดาวน์โหลดโมเดล
ดาวน์โหลดจาก: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

**โมเดลที่จำเป็น:**
1. **tiny_face_detector** - ตรวจจับใบหน้า (เบา, เร็ว)
2. **face_landmark_68** - ตรวจจับจุดสำคัญบนใบหน้า
3. **face_expression** - ตรวจจับอารมณ์
4. **face_recognition** - จดจำใบหน้า (ตัวเลือก)

### การปรับแต่งโค้ดในโปรเจค

**ไฟล์ที่ต้องแก้ไข**: `src/lib/config.js`

```javascript
// อัพเดทการตั้งค่า Face API
export const CONFIG = {
  faceApi: {
    modelPath: '/face-models/',
    models: [
      'tiny_face_detector',
      'face_landmark_68', 
      'face_expression'
    ],
    options: {
      inputSize: 416,           ← ขนาดอินพุต (224, 320, 416, 512, 608)
      scoreThreshold: 0.5,      ← ความแม่นยำขั้นต่ำ
      maxFaces: 1              ← จำนวนใบหน้าสูงสุด
    },
    expressions: [
      'neutral', 'happy', 'sad', 'angry', 
      'fearful', 'disgusted', 'surprised'
    ]
  }
}
```

**ไฟล์ที่ต้องสร้างใหม่**: `src/lib/faceApi.js`

```javascript
import * as faceapi from 'face-api.js';

// โหลดโมเดลทั้งหมด
export async function loadFaceApiModels() {
  const modelPath = '/face-models/';
  
  try {
    console.log('⏳ กำลังโหลดโมเดล Face API...');
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
    ]);
    
    console.log('✅ โหลดโมเดล Face API สำเร็จ');
    return true;
  } catch (error) {
    console.error('❌ โหลดโมเดล Face API ไม่สำเร็จ:', error);
    throw error;
  }
}

// ตรวจจับใบหน้าและอารมณ์
export async function detectFaceExpression(videoElement) {
  try {
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5
    });

    const detection = await faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks()
      .withFaceExpressions();

    return detection;
  } catch (error) {
    console.error('❌ ตรวจจับใบหน้าไม่สำเร็จ:', error);
    return null;
  }
}

// แปลงอารมณ์เป็นภาษาไทย
export function translateExpression(expression) {
  const translations = {
    'neutral': 'ปกติ',
    'happy': 'ยิ้ม',
    'sad': 'เศร้า', 
    'angry': 'โกรธ',
    'fearful': 'กลัว',
    'disgusted': 'รังเกียจ',
    'surprised': 'ตกใจ'
  };
  
  return translations[expression] || expression;
}
```

**ไฟล์ที่ต้องแก้ไข**: `src/components/CameraFeed.jsx`

```javascript
import { loadFaceApiModels, detectFaceExpression, translateExpression } from '../lib/faceApi';

// เพิ่ม state สำหรับ Face API
const [faceResult, setFaceResult] = useState('');
const [faceApiLoaded, setFaceApiLoaded] = useState(false);

// โหลดโมเดล Face API
useEffect(() => {
  const initFaceApi = async () => {
    try {
      await loadFaceApiModels();
      setFaceApiLoaded(true);
    } catch (error) {
      console.error('Face API initialization failed:', error);
    }
  };
  
  initFaceApi();
}, []);

// ตรวจจับใบหน้าและอารมณ์
useEffect(() => {
  if (faceApiLoaded && webcamRef.current) {
    const detectFace = async () => {
      const detection = await detectFaceExpression(webcamRef.current.video);
      
      if (detection && detection.expressions) {
        // หาอารมณ์ที่มีค่าสูงสุด
        const expressions = detection.expressions;
        const maxExpression = Object.keys(expressions).reduce((a, b) => 
          expressions[a] > expressions[b] ? a : b
        );
        
        const confidence = (expressions[maxExpression] * 100).toFixed(1);
        const thaiExpression = translateExpression(maxExpression);
        
        setFaceResult(`${thaiExpression}: ${confidence}%`);
      } else {
        setFaceResult('ไม่พบใบหน้า');
      }
    };
    
    const interval = setInterval(detectFace, 1000); // ทุก 1 วินาที
    return () => clearInterval(interval);
  }
}, [faceApiLoaded]);
```

### การตรวจสอบความถูกต้อง

1. **ตรวจสอบไฟล์โมเดล**: ใช้ `face_api_test.ipynb`
2. **ตรวจสอบ console**: ดู error messages ใน Developer Tools
3. **ทดสอบการทำงาน**: ลองแสดงอารมณ์ต่างๆ หน้ากล้อง
4. **ปรับ parameters**: หาค่าที่เหมาะสมกับสภาพแสง

**เป้าหมาย**: ตรวจจับใบหน้าได้ > 90%, ความแม่นยำอารมณ์ > 70%

### ขั้นตอนที่ 1: เลือกโซลูชัน

เรามี 2 ตัวเลือก:

**ตัวเลือก A: Face-api.js (แนะนำ - ง่ายที่สุด)**
- ✅ ใช้งานง่าย ไม่ต้องติดตั้งอะไรเพิ่ม
- ✅ รองรับ Browser ทุกตัว
- ✅ มีโมเดลสำเร็จรูป
- ✅ เหมาะกับทีม No-Code

**ตัวเลือก B: Azure Face API (ต้องจ่าย)**
- 💰 ต้องสมัคร Microsoft Azure
- 🔑 ต้องใช้ API Key
- 💵 เสียค่าใช้จ่าย
- 🔧 ซับซ้อนกว่า

**👉 เราแนะนำ Face-api.js สำหรับทีม No-Code**

### ขั้นตอนที่ 2: ดาวน์โหลดโมเดล Face-api.js

1. ไปที่เว็บไซต์: <https://github.com/justadudewhohacks/face-api.js>
2. ไปที่ส่วน **"Getting Started"**
3. ดาวน์โหลดโมเดลไฟล์เหล่านี้:

```text
📁 โมเดลที่ต้องดาวน์โหลด:
├── 📄 tiny_face_detector_model-shard1
├── 📄 tiny_face_detector_model-weights_manifest.json
├── 📄 face_expression_model-shard1
├── 📄 face_expression_model-weights_manifest.json
├── 📄 age_gender_model-shard1 (ถ้าต้องการ)
└── 📄 age_gender_model-weights_manifest.json (ถ้าต้องการ)
```

4. **คัดลอกไฟล์ทั้งหมดมาวางในโฟลเดอร์นี้** (`public/face-models/`)

### ขั้นตอนที่ 3: เขียน JavaScript Code

สร้างไฟล์ `face-detection.js` ในโฟลเดอร์ `src/lib/`:

```javascript
// src/lib/face-detection.js
import * as faceapi from 'face-api.js'

class FaceDetector {
    constructor() {
        this.isLoaded = false
        this.detectionOptions = null
    }

    async loadModels() {
        console.log('🔄 กำลังโหลดโมเดล Face API...')
        
        try {
            // โหลดโมเดลจากโฟลเดอร์ face-models
            await faceapi.nets.tinyFaceDetector.loadFromUri('/face-models')
            await faceapi.nets.faceExpressionNet.loadFromUri('/face-models')
            
            // ตั้งค่าการตรวจจับ
            this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,      // ขนาดอินพุต
                scoreThreshold: 0.5  // เกณฑ์ความแม่นยำ
            })
            
            this.isLoaded = true
            console.log('✅ โหลดโมเดล Face API สำเร็จ!')
            
        } catch (error) {
            console.error('❌ ไม่สามารถโหลดโมเดลได้:', error)
            throw error
        }
    }

    async detectFace(imageElement) {
        if (!this.isLoaded) {
            console.warn('⚠️  โปรดโหลดโมเดลก่อน')
            return null
        }

        try {
            // ตรวจจับใบหน้าและอารมณ์
            const result = await faceapi
                .detectSingleFace(imageElement, this.detectionOptions)
                .withFaceExpressions()

            if (result) {
                // ดึงอารมณ์ที่มี confidence สูงสุด
                const expressions = result.expressions
                const topExpression = Object.keys(expressions).reduce((a, b) => 
                    expressions[a] > expressions[b] ? a : b
                )

                return {
                    detected: true,
                    confidence: result.detection.score,
                    expressions: expressions,
                    topExpression: topExpression,
                    topExpressionScore: expressions[topExpression]
                }
            }

            return { detected: false }
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการตรวจจับใบหน้า:', error)
            return null
        }
    }
}

// Export instance
export const faceDetector = new FaceDetector()
```

### ขั้นตอนที่ 4: ใช้งานใน Component

ปรับไฟล์ `src/components/CameraFeed.jsx`:

```javascript
// เพิ่ม import
import { faceDetector } from '../lib/face-detection.js'

// ใน component
useEffect(() => {
    const initFaceDetection = async () => {
        try {
            await faceDetector.loadModels()
            console.log('Face Detection พร้อมใช้งาน')
        } catch (error) {
            console.error('ไม่สามารถเริ่ม Face Detection ได้')
        }
    }
    
    initFaceDetection()
}, [])

// ในฟังก์ชัน capture
const captureImage = async () => {
    // ... โค้ดเดิม ...
    
    // เพิ่มการตรวจจับใบหน้า
    const faceResult = await faceDetector.detectFace(canvas)
    
    if (faceResult && faceResult.detected) {
        console.log(`😊 ตรวจจับอารมณ์: ${faceResult.topExpression} (${faceResult.topExpressionScore:.2f})`)
        
        // ส่งข้อมูลไปยัง RightPanel
        setFaceEmotion({
            emotion: faceResult.topExpression,
            confidence: faceResult.topExpressionScore,
            allEmotions: faceResult.expressions
        })
    }
}
```

---

## 🔧 การปรับแต่งและทดสอบ

### การปรับค่าความไว

```javascript
// ในไฟล์ face-detection.js
this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,         // 224, 320, 416, 512, 608 (สูงขึ้น = แม่นขึ้นแต่ช้าขึ้น)
    scoreThreshold: 0.5     // 0.1-0.9 (สูงขึ้น = เข้มงวดขึ้น)
})
```

### การแสดงผลอารมณ์

```javascript
// แปลงชื่ออารมณ์เป็นภาษาไทย
const emotionMap = {
    'neutral': '😐 เฉยๆ',
    'happy': '😊 มีความสุข',
    'sad': '😢 เศร้า',
    'angry': '😠 โกรธ',
    'fearful': '😨 กลัว',
    'disgusted': '🤢 รังเกียจ',
    'surprised': '😲 ประหลาดใจ'
}

console.log(`อารมณ์: ${emotionMap[faceResult.topExpression]}`)
```

---

## 🎯 เป้าหมายความสำเร็จ

**ระบบ Face API ใช้งานได้ดีเมื่อ:**

- ✅ ตรวจจับใบหน้าได้ใน Real-time
- ✅ วิเคราะห์อารมณ์ได้แม่นยำ > 60%
- ✅ แสดงผลอารมณ์ใน Frontend ได้
- ✅ ไม่มี Error ในการโหลดโมเดล
- ✅ ทำงานร่วมกับระบบ Hand Detection ได้

**หากผลไม่ดี:**

- 🔄 ปรับค่า `scoreThreshold` ให้เหมาะสม
- 🔄 เปลี่ยนขนาด `inputSize` 
- 🔄 ตรวจสอบว่าไฟล์โมเดลครบถ้วน
- 🔄 ทดสอบในแสงที่ดี

---

## 🚨 การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: โมเดลโหลดไม่ได้

```bash
❌ Error: Failed to load model
```

**วิธีแก้:**
1. ตรวจสอบว่าไฟล์โมเดลอยู่ในโฟลเดอร์ `public/face-models/`
2. ตรวจสอบชื่อไฟล์ให้ถูกต้อง
3. รีสตาร์ท dev server: `npm run dev`

### ปัญหา: ตรวจจับใบหน้าไม่ได้

```bash
⚠️ No face detected
```

**วิธีแก้:**
1. ปรับค่า `scoreThreshold` ให้ต่ำลง (0.3-0.4)
2. ตรวจสอบแสงในการถ่าย
3. หันหน้าตรงเข้ากล้อง

### ปัญหา: ช้าเกินไป

**วิธีแก้:**
1. ลด `inputSize` เป็น 224
2. ใช้ `TinyFaceDetector` แทน `SsdMobilenetv1`
3. ลดความถี่ในการตรวจจับ

---

## 📞 การติดต่อทีม

**มีปัญหา?** ติดต่อ:

- Person 1: ดูแล Hand A Model  
- Person 2: ดูแล Hand B Model
- Person 4: ดูแลระบบ Backend/LLM
- หรือถามในกลุ่มทีม

**ไฟล์ทดสอบ:** `face_api_test.ipynb` - ใช้ทดสอบโมเดลก่อนใส่ระบบจริง

---

## 🎉 ขั้นตอนถัดไป

เมื่อ Face API ทำงานได้แล้ว:

1. **ทดสอบร่วมกับ Hand Models** - ตรวจสอบว่าทำงานพร้อมกันได้
2. **ปรับปรุง UI** - แสดงผลอารมณ์ใน Interface
3. **ส่งข้อมูลไป Backend** - ประสานกับ Person 4
4. **ทดสอบระบบรวม** - ทดสอบทั้งระบบร่วมกันกับทีม

**🌟 เป้าหมาย: ระบบตรวจจับใบหน้าที่ทำงานได้ Real-time และแม่นยำ**
