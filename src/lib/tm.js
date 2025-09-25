// New TensorFlow.js Integration - ใช้ระบบใหม่ทั้งหมด
import { initTF } from './tfInit.js'
import { loadAllModels, getModelStatus as getModelStatusFromLoader } from './modelLoader.js'
import { processImageAsync } from './processor.js'
import { CONFIG } from './config.js'

// ตัวแปรสถานะ
let isInitialized = false
let isLoading = false

// โหลดโมเดลทั้งหมด
export async function loadModels() {
  if (isLoading) {
    return { success: false, error: 'กำลังโหลดอยู่แล้ว' }
  }
  
  if (isInitialized) {
    return { success: true, message: 'โมเดลโหลดแล้ว' }
  }
  
  try {
    isLoading = true
    console.log('[TM] เริ่มโหลดโมเดล...')
    
    // 1. เริ่มต้น TensorFlow.js
    await initTF()
    console.log('[TM] TensorFlow.js initialized')
    
    // 2. โหลดโมเดลทั้งหมด
    const modelResults = await loadAllModels()
    console.log('[TM] Model loading results:', modelResults)
    
    isInitialized = true
    
    return {
      success: true,
      message: 'โหลดโมเดลสำเร็จ',
      models: modelResults
    }
    
  } catch (error) {
    console.error('[TM] Model loading failed:', error)
    return {
      success: false,
      error: error.message
    }
  } finally {
    isLoading = false
  }
}

// ประมวลผลภาพแบบ async - ใช้ function จาก processor.js
export { processImageAsync }

// ตรวจสอบสถานะโมเดล - ใช้ function จาก modelLoader.js
export { getModelStatusFromLoader as getModelStatus }

// ตรวจสอบว่าโมเดลพร้อมใช้งาน
export function isModelReady() {
  return isInitialized
}

// เริ่มต้นระบบ
export async function initialize() {
  if (isInitialized) {
    return { success: true, message: 'Already initialized' }
  }
  
  try {
    const result = await loadModels()
    return result
  } catch (error) {
    console.error('[TM] Initialization failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Export สำหรับ backward compatibility
export { processImageAsync as processImage }
