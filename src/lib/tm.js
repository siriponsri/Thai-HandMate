// จัดการ Teachable Machine โมเดล
import * as tmImage from '@teachablemachine/image'
import * as faceapi from 'face-api.js'
import { CONFIG, isValidWord, isValidEmotion } from './config.js'

// เก็บโมเดลที่โหลดแล้ว
let modelA = null
let modelB = null
let modelC = null
let faceModelsLoaded = false
let isLoading = false
let hasShownUnknown = false // ตัวแปรเช็ค Unknown-first

// โหลดโมเดลทั้ง 3 ชุด + Face Detection
export async function loadModels() {
  if (isLoading) return { success: false, error: 'กำลังโหลดอยู่แล้ว' }
  
  try {
    isLoading = true
    console.log('[INFO] เริ่มโหลดโมเดล...')
    
    // โหลดโมเดล Hand A
    try {
      const modelAUrl = CONFIG.MODEL_PATHS.handA + '/model.json'
      const metadataAUrl = CONFIG.MODEL_PATHS.handA + '/metadata.json'
      modelA = await tmImage.load(modelAUrl, metadataAUrl)
      console.log('[SUCCESS] โหลดโมเดล Hand A เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล Hand A โหลดไม่ได้:', error.message)
    }
    
    // โหลดโมเดล Hand B
    try {
      const modelBUrl = CONFIG.MODEL_PATHS.handB + '/model.json'
      const metadataBUrl = CONFIG.MODEL_PATHS.handB + '/metadata.json'
      modelB = await tmImage.load(modelBUrl, metadataBUrl)
      console.log('[SUCCESS] โหลดโมเดล Hand B เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล Hand B โหลดไม่ได้:', error.message)
    }
    
    // โหลดโมเดล Hand C
    try {
      const modelCUrl = CONFIG.MODEL_PATHS.handC + '/model.json'
      const metadataCUrl = CONFIG.MODEL_PATHS.handC + '/metadata.json'
      modelC = await tmImage.load(modelCUrl, metadataCUrl)
      console.log('[SUCCESS] โหลดโมเดล Hand C เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล Hand C โหลดไม่ได้:', error.message)
    }
    
    // โหลด Face Detection Models
    if (CONFIG.FACE_DETECTION.enabled) {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CONFIG.FACE_MODEL_PATH),
          faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.FACE_MODEL_PATH),
          faceapi.nets.faceExpressionNet.loadFromUri(CONFIG.FACE_MODEL_PATH)
        ])
        faceModelsLoaded = true
        console.log('[SUCCESS] โหลด Face Detection Models เสร็จแล้ว')
      } catch (error) {
        console.warn('[WARNING] Face Detection Models โหลดไม่ได้:', error.message)
        faceModelsLoaded = false
      }
    }
    
    return { 
      success: modelA !== null || modelB !== null || modelC !== null, 
      models: { 
        handA: !!modelA, 
        handB: !!modelB, 
        handC: !!modelC,
        face: faceModelsLoaded
      }
    }
    
  } catch (error) {
    console.error('[ERROR] ไม่สามารถโหลดโมเดลได้:', error)
    return { success: false, error: error.message }
  } finally {
    isLoading = false
  }
}

// เพิ่มฟังก์ชันประมวลผลรวม hand + face
export async function processImage(videoElement) {
  try {
    console.log('[INFO] เริ่มประมวลผลภาพ (Hand + Face)...')
    
    // ประมวลผล Hand Gestures
    const handResults = await predictAllModels(videoElement)
    
    // ประมวลผล Face Emotions
    const faceResults = await detectFace(videoElement)
    
    // รวมผลลัพธ์
    const combinedResult = {
      timestamp: new Date().toISOString(),
      
      // ผลลัพธ์ Hand Gestures
      hands: {
        bestWord: handResults.word,
        confidence: handResults.confidence,
        source: handResults.source,
        allResults: handResults.allResults, // ผลลัพธ์ทั้งหมดจากทุกโมเดล
        details: handResults.details
      },
      
      // ผลลัพธ์ Face Emotions
      face: {
        bestEmotion: faceResults.emotion,
        confidence: faceResults.confidence,
        allEmotions: faceResults.allEmotions, // อารมณ์ทั้งหมดที่ตรวจพบ
        details: faceResults.details
      },
      
      // ข้อมูลสำหรับ LLM (เลือกผลลัพธ์ที่ดีที่สุด)
      forLLM: {
        words: handResults.allResults.filter(r => r.confidence > CONFIG.MIN_CONFIDENCE).map(r => r.word),
        emotion: faceResults.emotion || 'neutral',
        wordConfidences: handResults.allResults.filter(r => r.confidence > CONFIG.MIN_CONFIDENCE),
        emotionConfidences: faceResults.allEmotions || []
      }
    }
    
    console.log('[SUCCESS] ประมวลผลภาพเสร็จแล้ว:', combinedResult)
    return combinedResult
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการประมวลผลภาพ:', error)
    return {
      timestamp: new Date().toISOString(),
      hands: { bestWord: 'Unknown', confidence: 0, source: 'error', allResults: [], details: error.message },
      face: { bestEmotion: 'neutral', confidence: 0, allEmotions: [], details: error.message },
      forLLM: { words: [], emotion: 'neutral', wordConfidences: [], emotionConfidences: [] }
    }
  }
}

// ปรับปรุงฟังก์ชัน predict ให้ส่งคืนผลลัพธ์ทั้งหมด
async function predictAllModels(imageElement) {
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
  if (!modelA && !modelB && !modelC) {
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
            source: 'handA'
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
            source: 'handB'
          })
        }
      }
    }
    
    // ทำนายด้วยโมเดล C
    if (modelC) {
      const predC = await modelC.predict(imageElement)
      for (let i = 0; i < predC.length; i++) {
        const className = predC[i].className
        const probability = predC[i].probability
        
        // เช็คว่าเป็นคำที่ถูกต้องไหม
        if (isValidWord(className)) {
          predictions.push({
            word: className,
            confidence: probability,
            source: 'handC'
          })
        }
      }
    }
    
    // หาผลลัพธ์ที่มี confidence สูงสุด
    if (predictions.length > 0) {
      // เรียงลำดับตาม confidence จากมากไปน้อย
      const sortedPredictions = [...predictions].sort((a, b) => b.confidence - a.confidence)
      const best = sortedPredictions[0]
      
      // ถ้า confidence ต่ำกว่าเกณฑ์ จะได้ Unknown
      if (best.confidence < CONFIG.MIN_CONFIDENCE) {
        return {
          word: 'Unknown',
          confidence: best.confidence,
          source: 'low-confidence',
          allResults: sortedPredictions, // ส่งผลลัพธ์ทั้งหมด
          details: `ค่าความมั่นใจ ${(best.confidence * 100).toFixed(1)}% ต่ำกว่าเกณฑ์ ${CONFIG.MIN_CONFIDENCE * 100}%`
        }
      }
      
      return {
        word: best.word,
        confidence: best.confidence,
        source: best.source,
        allResults: sortedPredictions, // ส่งผลลัพธ์ทั้งหมด
        details: `จาก ${best.source} ด้วยความมั่นใจ ${(best.confidence * 100).toFixed(1)}%`
      }
    }
    
    // ไม่มีผลลัพธ์
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'no-prediction',
      allResults: [], // ส่งอาร์เรย์ว่าง
      details: 'ไม่สามารถจดจำได้'
    }
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการทำนาย:', error)
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'error',
      allResults: [], // ส่งอาร์เรย์ว่าง
      details: error.message
    }
  }
}

// เพิ่มฟังก์ชัน predict แบบเดิมสำหรับ backward compatibility
export async function predict(imageElement) {
  const result = await predictAllModels(imageElement)
  // ส่งคืนเฉพาะข้อมูลหลักเหมือนเดิม
  return {
    word: result.word,
    confidence: result.confidence,
    source: result.source,
    details: result.details
  }
}

// ตรวจจับใบหน้าและอารมณ์ (ปรับปรุงให้ส่งคืนข้อมูลที่ครบถ้วน)
export async function detectFace(imageElement) {
  if (!faceModelsLoaded) {
    return {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      faces: [],
      source: 'no-face-model',
      details: 'Face Detection Models ไม่ได้โหลด'
    }
  }
  
  try {
    // ตรวจจับใบหน้าและอารมณ์
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
    
    if (detections.length === 0) {
      return {
        emotion: 'neutral',
        confidence: 0,
        allEmotions: [],
        faces: [],
        source: 'no-face-detected',
        details: 'ไม่พบใบหน้าในภาพ'
      }
    }
    
    const results = detections.map((detection, index) => {
      const expressions = detection.expressions
      
      // เรียงลำดับอารมณ์ตาม confidence
      const sortedEmotions = Object.entries(expressions)
        .map(([emotion, confidence]) => ({ emotion, confidence }))
        .sort((a, b) => b.confidence - a.confidence)
      
      const topEmotion = sortedEmotions[0]
      
      return {
        faceId: index + 1,
        box: detection.detection.box,
        faceConfidence: detection.detection.score,
        emotion: topEmotion.emotion,
        emotionConfidence: topEmotion.confidence,
        allEmotions: sortedEmotions, // ส่งอารมณ์ทั้งหมดเรียงตาม confidence
        rawExpressions: expressions
      }
    })
    
    // เลือกใบหน้าที่มี confidence สูงสุด
    const bestFace = results.reduce((prev, current) => 
      current.faceConfidence > prev.faceConfidence ? current : prev
    )
    
    return {
      emotion: bestFace.emotion,
      confidence: bestFace.emotionConfidence,
      allEmotions: bestFace.allEmotions, // อารมณ์ทั้งหมดของใบหน้าที่ดีที่สุด
      faces: results, // ข้อมูลใบหน้าทั้งหมด
      source: 'face-api',
      details: `ตรวจพบ ${results.length} ใบหน้า, อารมณ์หลัก: ${bestFace.emotion} (${(bestFace.emotionConfidence * 100).toFixed(1)}%)`
    }
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการตรวจจับใบหน้า:', error)
    return {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      faces: [],
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
    hasModelC: !!modelC,
    hasFaceModels: faceModelsLoaded,
    hasAnyModel: !!(modelA || modelB || modelC),
    hasAnyHandModel: !!(modelA || modelB || modelC),
    allModelsReady: !!(modelA && modelB && modelC && faceModelsLoaded)
  }
}

// รีเซ็ต Unknown-first (สำหรับทดสอบ)
export function resetUnknownFirst() {
  hasShownUnknown = false
  console.log('🔄 รีเซ็ต Unknown-first')
}
