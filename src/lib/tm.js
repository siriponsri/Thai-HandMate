// จัดการ Teachable Machine โมเดล
import * as tmImage from '@teachablemachine/image'
import { CONFIG, isValidWord } from './config.js'

// เก็บโมเดลที่โหลดแล้ว
let modelA = null
let modelB = null
let isLoading = false
let hasShownUnknown = false // ตัวแปรเช็ค Unknown-first

// โหลดโมเดลทั้ง 2 ชุด
export async function loadModels() {
  if (isLoading) return { success: false, error: 'กำลังโหลดอยู่แล้ว' }
  
  try {
    isLoading = true
    console.log('[INFO] เริ่มโหลดโมเดล...')
    
    // โหลดโมเดล A (ผม, รัก, คุณ, สวัสดี, ขอโทษ)
    try {
      const modelAUrl = CONFIG.MODEL_PATHS.handA + '/model.json'
      const metadataAUrl = CONFIG.MODEL_PATHS.handA + '/metadata.json'
      modelA = await tmImage.load(modelAUrl, metadataAUrl)
      console.log('[SUCCESS] โหลดโมเดล A เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล A โหลดไม่ได้:', error.message)
    }
    
    // โหลดโมเดล B (ขอบคุณ, โอเค, หยุด, ไป, มา)
    try {
      const modelBUrl = CONFIG.MODEL_PATHS.handB + '/model.json'
      const metadataBUrl = CONFIG.MODEL_PATHS.handB + '/metadata.json'
      modelB = await tmImage.load(modelBUrl, metadataBUrl)
      console.log('[SUCCESS] โหลดโมเดล B เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล B โหลดไม่ได้:', error.message)
    }
    
    return { 
      success: modelA !== null || modelB !== null, 
      models: { A: !!modelA, B: !!modelB }
    }
    
  } catch (error) {
    console.error('[ERROR] ไม่สามารถโหลดโมเดลได้:', error)
    return { success: false, error: error.message }
  } finally {
    isLoading = false
  }
}

// ทำนายผลจากรูปภาพ
export async function predict(imageElement) {
  // Unknown-first: ครั้งแรกจะได้ Unknown เสมอ
  if (CONFIG.UNKNOWN_FIRST && !hasShownUnknown) {
    hasShownUnknown = true
    console.log('[UNKNOWN-FIRST] แสดง Unknown ครั้งแรก')
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'unknown-first',
      details: 'แสดง Unknown ในครั้งแรกตามการตั้งค่า'
    }
  }
  
  // ตรวจสอบว่ามีโมเดลหรือไม่
  if (!modelA && !modelB) {
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'no-model',
      details: 'ไม่มีโมเดลที่โหลดได้'
    }
  }
  
  try {
    const predictions = []
    
    // ทำนายด้วยโมเดล A
    if (modelA) {
      const predA = await modelA.predict(imageElement)
      for (let i = 0; i < predA.length; i++) {
        const className = predA[i].className
        const probability = predA[i].probability
        
        // เช็คว่าเป็นคำที่ถูกต้องไหม
        if (isValidWord(className)) {
          predictions.push({
            word: className,
            confidence: probability,
            source: 'modelA'
          })
        }
      }
    }
    
    // ทำนายด้วยโมเดล B
    if (modelB) {
      const predB = await modelB.predict(imageElement)
      for (let i = 0; i < predB.length; i++) {
        const className = predB[i].className
        const probability = predB[i].probability
        
        // เช็คว่าเป็นคำที่ถูกต้องไหม
        if (isValidWord(className)) {
          predictions.push({
            word: className,
            confidence: probability,
            source: 'modelB'
          })
        }
      }
    }
    
    // หาผลลัพธ์ที่มี confidence สูงสุด
    if (predictions.length > 0) {
      const best = predictions.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      )
      
      // ถ้า confidence ต่ำกว่าเกณฑ์ จะได้ Unknown
      if (best.confidence < CONFIG.MIN_CONFIDENCE) {
        return {
          word: 'Unknown',
          confidence: best.confidence,
          source: 'low-confidence',
          details: `ค่าความมั่นใจ ${(best.confidence * 100).toFixed(1)}% ต่ำกว่าเกณฑ์ ${CONFIG.MIN_CONFIDENCE * 100}%`
        }
      }
      
      return {
        word: best.word,
        confidence: best.confidence,
        source: best.source,
        details: `จาก ${best.source} ด้วยความมั่นใจ ${(best.confidence * 100).toFixed(1)}%`
      }
    }
    
    // ไม่มีผลลัพธ์
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'no-prediction',
      details: 'ไม่สามารถจดจำได้'
    }
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการทำนาย:', error)
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'error',
      details: error.message
    }
  }
}

// ตรวจสอบสถานะโมเดล
export function getModelStatus() {
  return {
    isLoading,
    hasModelA: !!modelA,
    hasModelB: !!modelB,
    hasAnyModel: !!(modelA || modelB)
  }
}

// รีเซ็ต Unknown-first (สำหรับทดสอบ)
export function resetUnknownFirst() {
  hasShownUnknown = false
  console.log('🔄 รีเซ็ต Unknown-first')
}
