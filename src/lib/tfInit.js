// TensorFlow.js Initialization - ใช้ตัวเดียวทั้งแอป
import * as tf from '@tensorflow/tfjs'

let isInitialized = false

export async function initTF() {
  if (isInitialized) {
    console.log('[TF] Already initialized')
    return
  }

  try {
    // ลำดับความชอบ: webgl -> wasm -> cpu
    const backends = ['webgl', 'wasm', 'cpu']
    
    for (const backend of backends) {
      try {
        console.log(`[TF] Trying backend: ${backend}`)
        await tf.setBackend(backend)
        await tf.ready()
        console.log(`[TF] Successfully initialized with backend: ${backend}`)
        isInitialized = true
        return
      } catch (error) {
        console.warn(`[TF] Failed to initialize ${backend}:`, error.message)
      }
    }
    
    throw new Error('All backends failed to initialize')
  } catch (error) {
    console.error('[TF] Initialization failed:', error)
    throw error
  }
}

export function getTFBackend() {
  return tf.getBackend()
}

export function isTFReady() {
  return isInitialized
}
