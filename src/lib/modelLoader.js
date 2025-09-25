// Model Loading System - ใช้ TensorFlow.js ตัวเดียว
import * as tf from '@tensorflow/tfjs'

// ตัวแปรเก็บโมเดล
let handModel = null
let faceModel = null
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

// โหลด Face Model (TensorFlow.js LayersModel)
export async function loadFaceModel() {
  try {
    console.log('[MODEL] Loading Face Model...')
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    const modelUrl = '/face-model/model.json'
    const response = await fetch(modelUrl)
    if (!response.ok) {
      throw new Error(`Face model not found: ${response.status}`)
    }
    
    // ตรวจสอบ model format ก่อนโหลด
    const modelJson = await response.json()
    console.log('[MODEL] Face model format:', modelJson.format)
    
    // โหลด TensorFlow.js LayersModel
    faceModel = await tf.loadLayersModel(modelUrl)
    
    if (!faceModel) {
      throw new Error('Face model loaded but is null')
    }
    
    console.log('[SUCCESS] Face Model loaded successfully')
    return true
  } catch (error) {
    console.error('[ERROR] Failed to load Face Model:', error)
    console.log('[INFO] Using fallback: Simple face detection only')
    faceModel = null
    return false // ใช้ fallback แทน
  }
}

// โหลดโมเดลทั้งหมด
export async function loadAllModels() {
  if (isInitialized) {
    console.log('[MODEL] Models already loaded')
    return { hand: !!handModel, face: !!faceModel }
  }
  
  try {
    console.log('[MODEL] Starting model loading...')
    
    const [handSuccess, faceSuccess] = await Promise.allSettled([
      loadHandModel(),
      loadFaceModel()
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
    face: !!faceModel,
    initialized: isInitialized
  }
}

// รับ Hand Model
export function getHandModel() {
  return handModel
}

// รับ Face Model
export function getFaceModel() {
  return faceModel
}

// ตรวจสอบว่า Face Model พร้อมใช้งาน
export function isFaceModelReady() {
  return !!faceModel
}
