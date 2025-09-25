// Main Processing Loop - ควบคุมจังหวะและป้องกัน overload
import { initTF } from './tfInit.js'
import { loadAllModels, getHandModel, isFaceModelsReady } from './modelLoader.js'
import { predictHand, detectFaceAndEmotion, validatePredictionResult } from './predictor.js'

let isProcessing = false
let processingQueue = []
let lastProcessTime = 0
const PROCESS_INTERVAL = 100 // 100ms = ~10fps

// ตรวจสอบว่า image element พร้อมใช้งาน
function isImageReady(imageElement) {
  if (!imageElement) return false
  if (imageElement.readyState && imageElement.readyState < 2) return false
  if (imageElement.videoWidth === 0 || imageElement.videoHeight === 0) return false
  return true
}

// หน่วงเวลาเพื่อควบคุม FPS
function nextFrameDelay(ms = PROCESS_INTERVAL) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ประมวลผลภาพแบบ async
export async function processImageAsync(imageElement) {
  // ตรวจสอบว่า TensorFlow.js เริ่มต้นแล้วหรือไม่
  if (!isProcessing) {
    try {
      await initTF()
    } catch (error) {
      console.error('[PROCESSOR] TensorFlow.js initialization failed:', error)
    }
  }
  
  if (!isImageReady(imageElement)) {
    console.warn('[PROCESSOR] Image element not ready')
    return {
      hands: {
        word: 'Unknown',
        confidence: 0,
        source: 'not-ready',
        details: 'Image not ready'
      },
      face: {
        detected: false,
        faceCount: 0,
        faces: [],
        bestFace: null,
        bestFaceConfidence: 0,
        emotion: 'neutral',
        emotionConfidence: 0,
        source: 'not-ready',
        details: 'Image not ready'
      },
      emotion: {
        emotion: 'neutral',
        confidence: 0,
        source: 'not-ready',
        details: 'Image not ready'
      }
    }
  }
  
  // ตรวจสอบว่าไม่ busy
  if (isProcessing) {
    console.log('[PROCESSOR] Already processing, skipping frame')
    return null
  }
  
  // ตรวจสอบ interval
  const now = Date.now()
  if (now - lastProcessTime < PROCESS_INTERVAL) {
    return null
  }
  
  isProcessing = true
  lastProcessTime = now
  
  try {
    console.log('[PROCESSOR] Starting image processing...')
    
    // 1. Hand Prediction
    const handModel = getHandModel()
    const handResult = await predictHand(imageElement, handModel)
    
    // 2. Face Detection และ Emotion
    const faceResult = await detectFaceAndEmotion(imageElement)
    
    // 3. สร้าง emotion result แยก
    const emotionResult = {
      emotion: faceResult.emotion || 'neutral',
      confidence: faceResult.emotionConfidence || 0,
      allEmotions: faceResult.allEmotions || [],
      source: faceResult.source,
      details: faceResult.details
    }
    
    // ตรวจสอบผลลัพธ์
    if (!validatePredictionResult(handResult)) {
      console.warn('[PROCESSOR] Invalid hand prediction result')
    }
    
    const result = {
      hands: handResult,
      face: faceResult,
      emotion: emotionResult,
      timestamp: new Date().toISOString()
    }
    
    console.log('[PROCESSOR] Processing completed:', {
      hand: handResult.word,
      handConfidence: handResult.confidence,
      faceDetected: faceResult.detected,
      emotion: emotionResult.emotion,
      emotionConfidence: emotionResult.confidence
    })
    
    return result
    
  } catch (error) {
    console.error('[PROCESSOR] Processing failed:', error)
    return {
      hands: {
        word: 'Unknown',
        confidence: 0,
        source: 'error',
        details: `Processing Error: ${error.message}`
      },
      face: {
        detected: false,
        faceCount: 0,
        faces: [],
        bestFace: null,
        bestFaceConfidence: 0,
        emotion: 'neutral',
        emotionConfidence: 0,
        source: 'error',
        details: `Processing Error: ${error.message}`
      },
      emotion: {
        emotion: 'neutral',
        confidence: 0,
        source: 'error',
        details: `Processing Error: ${error.message}`
      }
    }
  } finally {
    isProcessing = false
  }
}

// เริ่ม processing loop
export function startProcessingLoop(imageElement, onResult) {
  if (!imageElement) {
    console.error('[PROCESSOR] No image element provided')
    return
  }
  
  console.log('[PROCESSOR] Starting processing loop...')
  
  async function loop() {
    try {
      const result = await processImageAsync(imageElement)
      if (result && onResult) {
        onResult(result)
      }
    } catch (error) {
      console.error('[PROCESSOR] Loop error:', error)
    }
    
    // หน่วงเวลาแล้วเรียกใหม่
    await nextFrameDelay()
    requestAnimationFrame(loop)
  }
  
  loop()
}

// หยุด processing loop
export function stopProcessingLoop() {
  isProcessing = false
  processingQueue = []
  console.log('[PROCESSOR] Processing loop stopped')
}

// ตรวจสอบสถานะ
export function getProcessingStatus() {
  return {
    isProcessing,
    queueLength: processingQueue.length,
    lastProcessTime
  }
}
