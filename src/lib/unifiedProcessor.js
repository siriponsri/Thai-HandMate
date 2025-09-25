// Unified Processor สำหรับรวมผลลัพธ์ Hand + Face + Emotion
// สร้าง JSON สำหรับส่งเข้า LLM

import { CONFIG } from './config.js'

// ประมวลผลภาพแบบรวม (Hand + Face + Emotion)
export async function processUnifiedImage(videoElement, result) {
  try {
    console.log('[INFO] เริ่มประมวลผลภาพแบบรวม...')
    
    // สร้าง timestamp
    const timestamp = new Date().toISOString()
    
    // สร้าง canvas เพื่อจับภาพ
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    ctx.drawImage(videoElement, 0, 0)
    
    // แปลงเป็น blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })
    
    // สร้าง JSON สำหรับ LLM
    const llmJson = createLLMJson(result, timestamp, blob)
    
    console.log('[SUCCESS] ประมวลผลภาพแบบรวมเสร็จแล้ว :', llmJson)
    
    return llmJson
    
  } catch (error) {
    console.error('[ERROR] ประมวลผลภาพแบบรวมล้มเหลว:', error)
    throw error
  }
}

// สร้าง JSON สำหรับ LLM
export function createLLMJson(result, timestamp, imageBlob) {
  const { hands, face, emotion } = result
  
  return {
    timestamp,
    imageBlob,
    signLanguage: {
      word: hands.word || 'Unknown',
      confidence: hands.confidence || 0,
      source: hands.source || 'unknown',
      details: hands.details || ''
    },
    emotion: {
      emotion: emotion.emotion || 'neutral',
      confidence: emotion.confidence || 0,
      source: emotion.source || 'unknown',
      details: emotion.details || ''
    },
    face: {
      detected: face.detected || false,
      faceCount: face.faceCount || 0,
      bestFaceConfidence: face.bestFaceConfidence || 0,
      source: face.source || 'unknown',
      details: face.details || ''
    },
    context: {
      processingTime: new Date().toISOString(),
      modelVersion: '2.0.0',
      systemStatus: 'active'
    }
  }
}

// สร้าง JSON สำหรับ API
export function createAPIJson(result) {
  const { hands, face, emotion } = result
  
  return {
    words: [hands.word || 'Unknown'],
    wordConfidences: [hands.confidence || 0],
    emotion: emotion.emotion || 'neutral',
    emotionConfidences: [emotion.confidence || 0],
    faceDetected: face.detected || false,
    faceCount: face.faceCount || 0,
    timestamp: new Date().toISOString()
  }
}

// ตรวจสอบความถูกต้องของผลลัพธ์
export function validateResult(result) {
  if (!result || typeof result !== 'object') {
    return false
  }
  
  const { hands, face, emotion } = result
  
  // ตรวจสอบ hands
  if (!hands || typeof hands.word !== 'string' || typeof hands.confidence !== 'number') {
    return false
  }
  
  // ตรวจสอบ face
  if (!face || typeof face.detected !== 'boolean' || typeof face.faceCount !== 'number') {
    return false
  }
  
  // ตรวจสอบ emotion
  if (!emotion || typeof emotion.emotion !== 'string' || typeof emotion.confidence !== 'number') {
    return false
  }
  
  return true
}

// สร้าง fallback result
export function createFallbackResult() {
  return {
    hands: {
      word: 'Unknown',
      confidence: 0,
      source: 'fallback',
      details: 'Fallback result'
    },
    face: {
      detected: false,
      faceCount: 0,
      faces: [],
      bestFace: null,
      bestFaceConfidence: 0,
      emotion: 'neutral',
      emotionConfidence: 0,
      source: 'fallback',
      details: 'Fallback result'
    },
    emotion: {
      emotion: 'neutral',
      confidence: 0,
      source: 'fallback',
      details: 'Fallback result'
    }
  }
}