// การตั้งค่าสำหรับ Thai-HandMate

// ค่าคงที่หลัก
export const CONFIG = {
  // ค่าความมั่นใจขั้นต่ำ (50%)
  MIN_CONFIDENCE: 0.50,
  
  // เปิดใช้งาน Unknown-first (ครั้งแรกจะได้ Unknown เสมอ)
  UNKNOWN_FIRST: false,  // ปิดเพื่อให้ทำงานจริง
  
  // พาธโมเดล Teachable Machine (3 โมเดลมือ + 1 โมเดลอารมณ์)
  MODEL_PATHS: {
    handA: '/models/handA',  // สวัสดี, คิดถึง, น่ารัก, สวย, ชอบ, ไม่ชอบ, รัก, ขอโทษ, idle
    handB: '/models/handB',  // ขอบคุณ, ไม่เป็นไร, สบายดี, โชคดี, เก่ง, อิ่ม, หิว, เศร้า, idle
    handC: '/models/handC',  // ฉลาด, เป็นห่วง, ไม่สบาย, เข้าใจ, idle
    faceEmotion: '/models/face-emotion'  // angry, disgust, fear, happy, sad, surprised, neutral
  },
  
  // ประเภทโมเดล (สำหรับการเทรนใหม่)
  MODEL_TYPES: {
    handA: 'image',  // Picture Model
    handB: 'image',  // Picture Model  
    handC: 'image',  // Picture Model
    face: 'mediapipe', // MediaPipe Face Detection Model
    faceEmotion: 'image' // Teachable Machine Face Emotion Model
  },
  
  // พาธโมเดล MediaPipe (โหลดจาก CDN)
  FACE_MODEL_PATH: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
  
  // คำที่โมเดลแต่ละชุดควรจำได้ (ยึดตาม JSON จริง)
  WORD_SETS: {
    A: ['สวัสดี', 'คิดถึง', 'น่ารัก', 'สวย', 'ชอบ', 'ไม่ชอบ', 'รัก', 'ขอโทษ', 'idle'], // ยังไม่มี JSON
    B: ['ขอบคุณ', 'ไม่เป็นไร', 'สบายดี', 'โชคดี', 'เก่ง', 'อิ่ม', 'หิว', 'เศร้า', 'Idle'], // ตรงกับ JSON (Idle ตัวใหญ่)
    C: ['ฉลาด', 'เป็นห่วง', 'ไม่สบาย', 'เข้าใจ', 'Idle'] // ตรงกับ JSON (Idle ตัวใหญ่)
  },
  
  // การตั้งค่า Backend API
  API_BASE_URL: 'http://localhost:8000',
  
  // การตั้งค่า Typhoon API
  TYPHOON_API: {
    URL: 'https://api.opentyphoon.ai/v1/chat/completions',
    MODEL: 'typhoon-7b',
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7
  },
  
  // การตั้งค่ากล้อง
  CAMERA: {
    width: 640,
    height: 480,
    facingMode: 'user', // กล้องหน้า
    autoStart: true     // เปิดกล้องอัตโนมัติ
  },
  
  // การตั้งค่า Face Detection
  FACE_DETECTION: {
    enabled: true,  // เปิดใช้งาน Face Detection + Emotion Detection
    minConfidence: 0.5,
    emotions: ['neutral', 'happy', 'sad', 'surprised', 'angry', 'fear', 'disgust'],
    useEmotionDetection: true,  // เปิดใช้งาน Emotion Detection (Simple Mode)
    emotionMode: 'simple'  // ใช้ simple emotion detection
  },

  // การตั้งค่าเฉพาะสำหรับแต่ละโมเดล
  MODEL_CONFIGS: {
    handA: {
      inputSize: 224,
      threshold: 0.7,
      grayscale: false,
      description: 'Picture Model - 9 classes'
    },
    handB: {
      inputSize: 224,
      threshold: 0.7,
      grayscale: false,
      description: 'Picture Model - 9 classe'
    },
    handC: {
      inputSize: 96,
      threshold: 0.7,
      grayscale: true,
      description: 'Picture Model - 5 classes'
    },
    faceEmotion: {
      inputSize: 224,
      threshold: 0.6,
      grayscale: false,
      description: 'Face Emotion Model - 7 emotions'
    }
  },
  
  // การตั้งค่า UI
  UI: {
    maxCapturedImages: 10,        // จำนวนภาพสูงสุดที่แสดงใน RightPanel
    autoScrollToLatest: true,     // เลื่อนไปภาพล่าสุดอัตโนมัติ
    showImageThumbnails: true,    // แสดงภาพย่อ
    enableImageDownload: true     // เปิดใช้ดาวน์โหลดภาพ
  }
}

// คำที่รวมทั้งหมด (สำหรับแสดงผล)
export const ALL_WORDS = [...CONFIG.WORD_SETS.A, ...CONFIG.WORD_SETS.B, ...CONFIG.WORD_SETS.C]

// ฟังก์ชันตรวจสอบว่าคำนี้อยู่ในรายการหรือไม่
export function isValidWord(word) {
  // รองรับทั้ง 'idle' และ 'Idle' (case insensitive)
  const normalizedWord = word.toLowerCase()
  const normalizedWords = ALL_WORDS.map(w => w.toLowerCase())
  return normalizedWords.includes(normalizedWord)
}

// ฟังก์ชันหาโมเดลที่ใช้สำหรับคำนั้น
export function getModelForWord(word) {
  const normalizedWord = word.toLowerCase()
  
  // เช็ค Hand A (ยังไม่มี JSON)
  if (CONFIG.WORD_SETS.A.some(w => w.toLowerCase() === normalizedWord)) return 'handA'
  
  // เช็ค Hand B (มี JSON)
  if (CONFIG.WORD_SETS.B.some(w => w.toLowerCase() === normalizedWord)) return 'handB'
  
  // เช็ค Hand C (มี JSON)
  if (CONFIG.WORD_SETS.C.some(w => w.toLowerCase() === normalizedWord)) return 'handC'
  
  return null
}

// ฟังก์ชันสร้าง JSON สำหรับ Typhoon API
export function createTyphoonPayload(capturedData) {
  // แยกข้อมูลมือและหน้า
  const handGestures = capturedData.filter(item => item.type === 'hand').map(item => item.word)
  const faceEmotions = capturedData.filter(item => item.type === 'face').map(item => item.emotion)
  
  return {
    model: CONFIG.TYPHOON_API.MODEL,
    messages: [
      {
        role: "system",
        content: `คุณเป็นผู้ช่วยสร้างประโยคภาษาไทยจากภาษามือและการแสดงออกทางใบหน้า กรุณาสร้างประโยคที่สมเหตุสมผลและเป็นธรรมชาติ`
      },
      {
        role: "user", 
        content: `จากภาษามือ: ${handGestures.join(', ')} และอารมณ์จากใบหน้า: ${faceEmotions.join(', ')} กรุณาสร้างประโยคภาษาไทยที่เหมาะสม`
      }
    ],
    max_tokens: CONFIG.TYPHOON_API.MAX_TOKENS,
    temperature: CONFIG.TYPHOON_API.TEMPERATURE
  }
}

// ฟังก์ชันตรวจสอบว่าเป็นอารมณ์ที่ถูกต้องหรือไม่
export function isValidEmotion(emotion) {
  return CONFIG.FACE_DETECTION.emotions.includes(emotion)
}

// ฟังก์ชันประมวลผลภาพสำหรับแต่ละโมเดล
export function preprocessImageForModel(imageElement, modelName) {
  const modelConfig = CONFIG.MODEL_CONFIGS[modelName]
  if (!modelConfig) {
    throw new Error(`ไม่พบการตั้งค่าสำหรับโมเดล ${modelName}`)
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // ตั้งค่าขนาดตามโมเดล
  canvas.width = modelConfig.inputSize
  canvas.height = modelConfig.inputSize
  
  // วาดภาพ
  ctx.drawImage(imageElement, 0, 0, modelConfig.inputSize, modelConfig.inputSize)
  
  // แปลงเป็น grayscale ถ้าจำเป็น
  if (modelConfig.grayscale) {
    const imageData = ctx.getImageData(0, 0, modelConfig.inputSize, modelConfig.inputSize)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      data[i] = gray     // Red
      data[i + 1] = gray // Green
      data[i + 2] = gray // Blue
      // Alpha channel remains unchanged
    }
    
    ctx.putImageData(imageData, 0, 0)
  }
  
  return canvas
}

// ฟังก์ชันกรองผลลัพธ์ตาม threshold
export function filterPredictionsByThreshold(predictions, modelName) {
  const modelConfig = CONFIG.MODEL_CONFIGS[modelName]
  if (!modelConfig) {
    return predictions
  }
  
  return predictions.filter(p => p.probability >= modelConfig.threshold)
}

// ฟังก์ชันสร้างข้อมูลโมเดลสำหรับแสดงผล
export function getModelInfo(modelName) {
  const modelConfig = CONFIG.MODEL_CONFIGS[modelName]
  const wordSet = CONFIG.WORD_SETS[modelName.replace('hand', '').toUpperCase()]
  
  return {
    name: modelName,
    config: modelConfig,
    words: wordSet || [],
    path: CONFIG.MODEL_PATHS[modelName],
    type: CONFIG.MODEL_TYPES[modelName]
  }
}
