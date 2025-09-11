// การตั้งค่าสำหรับ Thai-HandMate

// ค่าคงที่หลัก
export const CONFIG = {
  // ค่าความมั่นใจขั้นต่ำ (60%)
  MIN_CONFIDENCE: 0.60,
  
  // เปิดใช้งาน Unknown-first (ครั้งแรกจะได้ Unknown เสมอ)
  UNKNOWN_FIRST: true,
  
  // พาธโมเดล Teachable Machine
  MODEL_PATHS: {
    handA: '/models/handA',  // ผม, รัก, คุณ, สวัสดี, ขอโทษ
    handB: '/models/handB'   // ขอบคุณ, โอเค, หยุด, ไป, มา
  },
  
  // พาธโมเดล face-api.js
  FACE_MODEL_PATH: '/face-models',
  
  // คำที่โมเดลแต่ละชุดควรจำได้
  WORD_SETS: {
    A: ['ผม', 'รัก', 'คุณ', 'สวัสดี', 'ขอโทษ'],
    B: ['ขอบคุณ', 'โอเค', 'หยุด', 'ไป', 'มา']
  },
  
  // การตั้งค่า Backend API
  API_BASE_URL: 'http://localhost:8000',
  
  // การตั้งค่ากล้อง
  CAMERA: {
    width: 640,
    height: 480,
    facingMode: 'user' // กล้องหน้า
  }
}

// คำที่รวมทั้งหมด (สำหรับแสดงผล)
export const ALL_WORDS = [...CONFIG.WORD_SETS.A, ...CONFIG.WORD_SETS.B]

// ฟังก์ชันตรวจสอบว่าคำนี้อยู่ในรายการหรือไม่
export function isValidWord(word) {
  return ALL_WORDS.includes(word)
}

// ฟังก์ชันหาโมเดลที่ใช้สำหรับคำนั้น
export function getModelForWord(word) {
  if (CONFIG.WORD_SETS.A.includes(word)) return 'handA'
  if (CONFIG.WORD_SETS.B.includes(word)) return 'handB'
  return null
}
