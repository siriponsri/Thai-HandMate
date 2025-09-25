// การตั้งค่าสำหรับ Thai-HandMate

// ค่าคงที่หลัก
export const CONFIG = {
  // ค่าความมั่นใจขั้นต่ำ (50%)
  MIN_CONFIDENCE: 0.50,
  
  // เปิดใช้งาน Unknown-first (ครั้งแรกจะได้ Unknown เสมอ)
  UNKNOWN_FIRST: false,  // ปิดเพื่อให้ทำงานจริง
  
  // พาธโมเดล Teachable Machine (โมเดลใหม่)
  MODEL_PATHS: {
    hand: '/hand-model',                    // โมเดลมือเดียว (รวมทุกคำ)
    face: '/face-model'                     // โมเดลใบหน้าและอารมณ์ (H5 format)
  },
  
  // ประเภทโมเดล (ตามโมเดลจริง)
  MODEL_TYPES: {
    hand: 'pose',       // Pose Model (Teachable Machine Pose)
    face: 'tensorflow'  // TensorFlow H5 Model
  },
  
  // พาธโมเดล MediaPipe (โหลดจาก CDN)
  FACE_MODEL_PATH: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
  
  // คำที่โมเดลควรจำได้ (จาก metadata จริง)
  WORD_SETS: {
    hand: ['เริ่ม', 'เรียนรู้', 'AI', 'อย่างไร', 'ช่วยเหลือ', 'ไม่ใช่', 'หยุด', 'ถัดไป', 'สถานะว่าง'], // 9 คำจาก HandModel_v4.0
    face: ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprised'] // 7 อารมณ์จาก Face Model
  },
  
  // การตั้งค่า Backend API
  API_BASE_URL: 'http://localhost:8000',
  
  // การตั้งค่า Typhoon API
  TYPHOON_API: {
    URL: 'https://api.opentyphoon.ai/v1/chat/completions',
    MODEL: 'typhoon-v2.1-12b-instruct',  // ใช้ model ที่ถูกต้องตาม backend
    MAX_TOKENS: 700,  // ตาม backend config
    TEMPERATURE: 0.5  // ตาม backend config
  },
  
  // การตั้งค่ากล้อง
  CAMERA: {
    width: 640,
    height: 480,
    facingMode: 'user', // กล้องหน้า
    autoStart: true     // เปิดกล้องอัตโนมัติ
  },
  
  // การตั้งค่า Face Detection (MediaPipe + Simple Fallback)
  FACE_DETECTION: {
    enabled: true,  // เปิดใช้งาน Face Detection + Emotion Detection
    minConfidence: 0.5,
    emotions: ['neutral', 'happy', 'sad', 'surprised', 'angry', 'fear', 'disgust'],
    useEmotionDetection: true,  // เปิดใช้งาน Emotion Detection
    detectionMethod: 'mediapipe',  // 'mediapipe', 'simple'
    fallbackEnabled: true,  // เปิดใช้งาน fallback system
    mediapipe: {
      model: 'short',
      minDetectionConfidence: 0.5
    },
    simple: {
      brightnessThreshold: 80,  // สำหรับ emotion detection
      faceBoxSize: 0.5  // ขนาด face box จำลอง
    }
  },

  // การตั้งค่าเฉพาะสำหรับแต่ละโมเดล (ตามโมเดลจริง)
  MODEL_CONFIGS: {
    hand: {
      inputSize: 257,  // PoseNet standard size (จาก metadata)
      threshold: 0.5,
      grayscale: false,
      description: 'HandModel_v4.0(Posture) - 9 gestures (MobileNetV1, PoseNet)'
    },
    faceEmotion: {
      inputSize: 48,   // 48x48 RGB (จาก face_expression_model.json)
      threshold: 0.6,
      grayscale: false, // ใช้ RGB input
      description: 'Face Expression Model - 7 emotions (CNN, 48x48x3)'
    },
    faceDetection: {
      inputSize: 416,  // MediaPipe standard size
      threshold: 0.5,
      grayscale: false,
      description: 'MediaPipe Face Detection - Real-time face detection'
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
export const ALL_WORDS = [...CONFIG.WORD_SETS.hand]

// ฟังก์ชันตรวจสอบว่าคำนี้อยู่ในรายการหรือไม่
export function isValidWord(word) {
  // รองรับทั้ง 'idle' และ 'Idle' (case insensitive)
  const normalizedWord = word.toLowerCase()
  const normalizedWords = ALL_WORDS.map(w => w.toLowerCase())
  return normalizedWords.includes(normalizedWord)
}

// ฟังก์ชันหาโมเดลที่ใช้สำหรับคำนั้น (โมเดลรวม)
export function getModelForWord(word) {
  const normalizedWord = word.toLowerCase()
  
  // เช็ค Hand Model (รวม)
  if (CONFIG.WORD_SETS.hand.some(w => w.toLowerCase() === normalizedWord)) return 'hand'
  
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
  
  // กำหนด wordSet ตาม modelName
  let wordSet = []
  if (modelName === 'hand') {
    wordSet = CONFIG.WORD_SETS.hand
  } else if (modelName === 'faceEmotion') {
    wordSet = CONFIG.WORD_SETS.face
  } else if (modelName === 'faceDetection') {
    wordSet = ['face_detected', 'no_face'] // สำหรับ face detection
  }
  
  return {
    name: modelName,
    config: modelConfig,
    words: wordSet,
    path: CONFIG.MODEL_PATHS[modelName] || CONFIG.MODEL_PATHS.face,
    type: CONFIG.MODEL_TYPES[modelName] || 'tensorflow'
  }
}
