// จัดการ Teachable Machine โมเดล
import * as tmImage from '@teachablemachine/image'
import * as tmPose from '@teachablemachine/pose'
import { loadFaceDetection, detectFace as mediapipeDetectFace } from './faceDetection.js'
import { loadFaceEmotionModel, detectFaceEmotion } from './faceEmotionModel.js'
import { processUnifiedImage, createLLMJson, createAPIJson } from './unifiedProcessor.js'
import { CONFIG, isValidWord, isValidEmotion, preprocessImageForModel, filterPredictionsByThreshold, getModelInfo } from './config.js'

// ตรวจสอบประเภทโมเดล
function getModelType(modelName) {
  if (modelName.includes('handA') || modelName.includes('Hand A')) return CONFIG.MODEL_TYPES.handA
  if (modelName.includes('handB') || modelName.includes('Hand B')) return CONFIG.MODEL_TYPES.handB
  if (modelName.includes('handC') || modelName.includes('Hand C')) return CONFIG.MODEL_TYPES.handC
  if (modelName.includes('faceEmotion')) return CONFIG.MODEL_TYPES.faceEmotion
  return 'image' // default
}

// ฟังก์ชันช่วยสำหรับการทำนายที่ปลอดภัย
async function safePredict(model, imageElement, modelName) {
  try {
    // ตรวจสอบว่า model มีฟังก์ชัน predict หรือไม่
    if (!model || typeof model.predict !== 'function') {
      throw new Error(`Model ${modelName} ไม่มีฟังก์ชัน predict`)
    }
    
    // ตรวจสอบว่า imageElement พร้อมใช้งานหรือไม่
    if (!imageElement || imageElement.readyState < 2) {
      throw new Error(`Image element ยังไม่พร้อมใช้งาน`)
    }
    
    // ตรวจสอบว่ามีข้อมูลภาพหรือไม่
    if (imageElement.videoWidth === 0 || imageElement.videoHeight === 0) {
      throw new Error(`ไม่มีข้อมูลภาพใน video element`)
    }
    
    // ตรวจสอบประเภทโมเดล
    const modelType = getModelType(modelName)
    
    if (modelType === 'image') {
      // ประมวลผลภาพตามการตั้งค่าโมเดล
      const processedImage = preprocessImageForModel(imageElement, modelName)
      
      // ทำนายด้วยภาพที่ประมวลผลแล้ว
      const predictions = await model.predict(processedImage)
      
      // ตรวจสอบว่า predictions เป็น array หรือไม่
      if (!Array.isArray(predictions)) {
        throw new Error(`Model ${modelName} ส่งคืนข้อมูลไม่ถูกต้อง`)
      }
      
      // กรองผลลัพธ์ตาม threshold
      const filteredPredictions = filterPredictionsByThreshold(predictions, modelName)
      
      return filteredPredictions
    } else if (modelType === 'pose') {
      // สำหรับ Pose Model - ต้องประมวลผลภาพก่อน
      const processedImage = preprocessImageForModel(imageElement, modelName)
      
      // ใช้ tmPose predict
      const { pose, posenetOutput } = await model.estimatePose(processedImage)
      const predictions = await model.predict(posenetOutput)
      
      // ตรวจสอบว่า predictions เป็น array หรือไม่
      if (!Array.isArray(predictions)) {
        throw new Error(`Pose Model ${modelName} ส่งคืนข้อมูลไม่ถูกต้อง`)
      }
      
      // กรองผลลัพธ์ตาม threshold
      const filteredPredictions = filterPredictionsByThreshold(predictions, modelName)
      
      return filteredPredictions
    } else {
      throw new Error(`Model ${modelName} ใช้ประเภท ${modelType} ที่ไม่รองรับ`)
    }
  } catch (error) {
    console.warn(`[WARNING] โมเดล ${modelName} ทำนายไม่ได้:`, error.message)
    return []
  }
}

// เก็บโมเดลที่โหลดแล้ว
let modelA = null
let modelB = null
let modelC = null
let faceModelsLoaded = false
let emotionModelsLoaded = false
let isLoading = false
let hasShownUnknown = false // ตัวแปรเช็ค Unknown-first

// โหลดโมเดลทั้ง 3 ชุด + Face Detection
export async function loadModels() {
  if (isLoading) return { success: false, error: 'กำลังโหลดอยู่แล้ว' }
  
  try {
    isLoading = true
    console.log('[INFO] เริ่มโหลดโมเดล...')
    
    // โหลดโมเดล Hand A (Pose Model)
    try {
      const modelAUrl = CONFIG.MODEL_PATHS.handA + '/model.json'
      const metadataAUrl = CONFIG.MODEL_PATHS.handA + '/metadata.json'
      modelA = await tmPose.load(modelAUrl, metadataAUrl)
      console.log('[SUCCESS] โหลดโมเดล Hand A (Pose) เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล Hand A โหลดไม่ได้:', error.message)
    }
    
    // โหลดโมเดล Hand B (Pose Model)
    try {
      const modelBUrl = CONFIG.MODEL_PATHS.handB + '/model.json'
      const metadataBUrl = CONFIG.MODEL_PATHS.handB + '/metadata.json'
      modelB = await tmPose.load(modelBUrl, metadataBUrl)
      console.log('[SUCCESS] โหลดโมเดล Hand B (Pose) เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล Hand B โหลดไม่ได้:', error.message)
    }
    
    // โหลดโมเดล Hand C (Pose Model)
    try {
      const modelCUrl = CONFIG.MODEL_PATHS.handC + '/model.json'
      const metadataCUrl = CONFIG.MODEL_PATHS.handC + '/metadata.json'
      modelC = await tmPose.load(modelCUrl, metadataCUrl)
      console.log('[SUCCESS] โหลดโมเดล Hand C (Pose) เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] โมเดล Hand C โหลดไม่ได้:', error.message)
    }
    
    // โหลด MediaPipe Face Detection (ถ้าเปิดใช้งาน)
    if (CONFIG.FACE_DETECTION.enabled) {
      try {
        await loadFaceDetection()
        faceModelsLoaded = true
        console.log('[SUCCESS] โหลด MediaPipe Face Detection เสร็จแล้ว')
      } catch (error) {
        console.warn('[WARNING] MediaPipe Face Detection โหลดไม่ได้:', error.message)
        faceModelsLoaded = false
      }
    } else {
      console.log('[INFO] Face Detection ปิดใช้งาน')
      faceModelsLoaded = false
    }
    
    // โหลด Face Emotion Model (Teachable Machine)
    try {
      await loadFaceEmotionModel()
      emotionModelsLoaded = true
      console.log('[SUCCESS] โหลด Face Emotion Model เสร็จแล้ว')
    } catch (error) {
      console.warn('[WARNING] Face Emotion Model โหลดไม่ได้:', error.message)
      emotionModelsLoaded = false
    }
    
    return { 
      success: modelA !== null || modelB !== null || modelC !== null, 
      models: { 
        handA: !!modelA, 
        handB: !!modelB, 
        handC: !!modelC,
        face: faceModelsLoaded,
        emotion: emotionModelsLoaded
      }
    }
    
  } catch (error) {
    console.error('[ERROR] ไม่สามารถโหลดโมเดลได้:', error)
    return { success: false, error: error.message }
  } finally {
    isLoading = false
  }
}

// เพิ่มฟังก์ชันประมวลผลแบบ async (Hand + Face + Emotion)
export async function processImageAsync(videoElement) {
  try {
    console.log('[INFO] เริ่มประมวลผลภาพแบบ async (Hand + Face + Emotion)...')
    
    // ตรวจสอบว่า videoElement มีอยู่จริงหรือไม่
    if (!videoElement) {
      throw new Error('ไม่พบ video element')
    }
    
    // ตรวจสอบว่า video element มีข้อมูลหรือไม่
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      throw new Error('วิดีโอยังไม่พร้อมใช้งาน')
    }
    
    // รอให้วิดีโอพร้อมใช้งาน
    if (videoElement.readyState < 2) {
      console.log('[INFO] รอให้วิดีโอพร้อมใช้งาน...')
      await new Promise(resolve => {
        const checkReady = () => {
          if (videoElement.readyState >= 2) {
            resolve()
          } else {
            setTimeout(checkReady, 100)
          }
        }
        checkReady()
        setTimeout(resolve, 3000)
      })
    }
    
    // ประมวลผลแบบ async (parallel)
    const [handResults, faceResults, emotionResults] = await Promise.allSettled([
      predictAllModels(videoElement),
      detectFace(videoElement),
      detectFaceEmotion(videoElement)
    ])
    
    // จัดการผลลัพธ์
    const handData = handResults.status === 'fulfilled' ? handResults.value : {
      word: 'Unknown',
      confidence: 0,
      source: 'no-model',
      allResults: [],
      details: 'ไม่มีโมเดลมือ'
    }
    
    const faceData = faceResults.status === 'fulfilled' ? faceResults.value : {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      faces: [],
      source: 'error',
      details: faceResults.reason?.message || 'Face detection failed'
    }
    
    const emotionData = emotionResults.status === 'fulfilled' ? emotionResults.value : {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      source: 'error',
      details: emotionResults.reason?.message || 'Emotion detection failed'
    }
    
    // ใช้ unified processor
    const unifiedResult = await processUnifiedImage(videoElement, handData, faceData, emotionData)
    
    // สร้าง JSON สำหรับ LLM
    const llmJson = createLLMJson(unifiedResult)
    const apiJson = createAPIJson(unifiedResult)
    
    console.log('[SUCCESS] ประมวลผลภาพแบบ async เสร็จแล้ว:', unifiedResult)
    console.log('[INFO] LLM JSON:', llmJson)
    
    return {
      ...unifiedResult,
      llmJson: llmJson,
      apiJson: apiJson
    }
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการประมวลผลภาพแบบ async:', error)
    return createErrorResult(error.message)
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
    
    // ทำนายด้วยโมเดล A (Pose)
    if (modelA) {
      const predA = await safePredict(modelA, imageElement, 'handA')
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
    
    // ทำนายด้วยโมเดล B (Pose)
    if (modelB) {
      const predB = await safePredict(modelB, imageElement, 'handB')
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
    
    // ทำนายด้วยโมเดล C (Pose)
    if (modelC) {
      const predC = await safePredict(modelC, imageElement, 'handC')
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

// ตรวจจับใบหน้าและอารมณ์ (ใช้ Simple Face Detection)
export async function detectFace(imageElement) {
  // ตรวจสอบว่า Face Detection เปิดใช้งานหรือไม่
  if (!CONFIG.FACE_DETECTION.enabled) {
    return {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      faces: [],
      source: 'face-detection-disabled',
      details: 'Face Detection ปิดใช้งาน'
    }
  }
  
  if (!faceModelsLoaded) {
    return {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      faces: [],
      source: 'no-face-model',
      details: 'Simple Face Detection ไม่ได้โหลด'
    }
  }
  
  // ใช้ MediaPipe Face Detection
  return await mediapipeDetectFace(imageElement)
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

// ฟังก์ชันแสดงข้อมูลโมเดลทั้งหมด
export function getAllModelInfo() {
  return {
    handA: getModelInfo('handA'),
    handB: getModelInfo('handB'),
    handC: getModelInfo('handC'),
    faceEmotion: getModelInfo('faceEmotion')
  }
}

// ฟังก์ชันแสดงข้อมูลโมเดลเฉพาะ
export function getModelInfoByName(modelName) {
  return getModelInfo(modelName)
}

// รีเซ็ต Unknown-first (สำหรับทดสอบ)
export function resetUnknownFirst() {
  hasShownUnknown = false
  console.log('🔄 รีเซ็ต Unknown-first')
}

// ฟังก์ชันสร้างผลลัพธ์ error
function createErrorResult(errorMessage) {
  return {
    timestamp: new Date().toISOString(),
    imageBlob: null,
    hands: { bestWord: 'Unknown', confidence: 0, source: 'error', allResults: [], details: errorMessage },
    face: { bestEmotion: 'neutral', confidence: 0, allEmotions: [], faces: [], source: 'error', details: errorMessage },
    forLLM: { words: [], emotion: 'neutral', wordConfidences: [], emotionConfidences: [] },
    llmJson: {
      timestamp: new Date().toISOString(),
      signLanguage: { words: [], bestWord: 'Unknown', confidence: 0, source: 'error' },
      emotion: { emotion: 'neutral', confidence: 0, source: 'error' },
      face: { detected: false, faceCount: 0, confidence: 0 },
      context: { hasSignLanguage: false, hasEmotion: false, hasFace: false, overallConfidence: 0 }
    },
    apiJson: null
  }
}
