// Model Loading System - ใช้ TensorFlow.js ตัวเดียว
import * as tf from '@tensorflow/tfjs'
import * as faceapi from '@vladmandic/face-api'

// ตัวแปรเก็บโมเดล
let handModel = null
let faceModelsLoaded = false
let isInitialized = false

// โหลด Hand Model (LayersModel)
export async function loadHandModel() {
  try {
    console.log('[MODEL] Loading Hand Model...')
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    const modelUrl = '/hand-model/model.json'
    const response = await fetch(modelUrl)
    if (!response.ok) {
      throw new Error(`Hand model not found: ${response.status}`)
    }
    
    // ตรวจสอบว่าเป็น LayersModel หรือ GraphModel
    const modelJson = await response.json()
    if (modelJson.modelTopology) {
      // LayersModel (Teachable Machine)
      handModel = await tf.loadLayersModel(modelUrl)
    } else if (modelJson.format === 'graph-model') {
      // GraphModel
      handModel = await tf.loadGraphModel(modelUrl)
    } else {
      throw new Error('Unknown model type')
    }
    
    if (!handModel) {
      throw new Error('Hand model loaded but is null')
    }
    
    console.log('[SUCCESS] Hand Model loaded successfully')
    return true
  } catch (error) {
    console.error('[ERROR] Failed to load Hand Model:', error)
    handModel = null
    return false
  }
}

// โหลด Face Models (face-api)
export async function loadFaceModels() {
  try {
    console.log('[MODEL] Loading Face Models...')
    
    const modelPath = '/face-model'
    
    // ตรวจสอบว่าไฟล์ manifest มีอยู่และถูกต้อง
    const manifestUrls = [
      `${modelPath}/ssd_mobilenetv1_model-weights_manifest.json`,
      `${modelPath}/face_landmark_68_model-weights_manifest.json`,
      `${modelPath}/face_expression_model-weights_manifest.json`
    ]
    
    for (const url of manifestUrls) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`)
        }
        const text = await response.text()
        // ลบ BOM ถ้ามี
        const cleanText = text.replace(/^\uFEFF/, '').replace(/^ï»¿/, '')
        JSON.parse(cleanText) // ทดสอบ parse
        console.log(`[MODEL] ✓ ${url} is valid JSON`)
      } catch (error) {
        console.error(`[ERROR] Invalid JSON at ${url}:`, error)
        throw error
      }
    }
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
    ])
    
    faceModelsLoaded = true
    console.log('[SUCCESS] Face Models loaded successfully')
    return true
  } catch (error) {
    console.error('[ERROR] Failed to load Face Models:', error)
    faceModelsLoaded = false
    return false
  }
}

// โหลดโมเดลทั้งหมด
export async function loadAllModels() {
  if (isInitialized) {
    console.log('[MODEL] Models already loaded')
    return { hand: !!handModel, face: faceModelsLoaded }
  }
  
  try {
    console.log('[MODEL] Starting model loading...')
    
    const [handSuccess, faceSuccess] = await Promise.allSettled([
      loadHandModel(),
      loadFaceModels()
    ])
    
    isInitialized = true
    
    const result = {
      hand: handSuccess.status === 'fulfilled' && handSuccess.value,
      face: faceSuccess.status === 'fulfilled' && faceSuccess.value
    }
    
    console.log('[MODEL] Loading completed:', result)
    return result
  } catch (error) {
    console.error('[ERROR] Model loading failed:', error)
    return { hand: false, face: false }
  }
}

// ตรวจสอบสถานะโมเดล
export function getModelStatus() {
  return {
    hand: !!handModel,
    face: faceModelsLoaded,
    initialized: isInitialized
  }
}

// รับ Hand Model
export function getHandModel() {
  return handModel
}

// ตรวจสอบว่า Face Models พร้อมใช้งาน
export function isFaceModelsReady() {
  return faceModelsLoaded
}
