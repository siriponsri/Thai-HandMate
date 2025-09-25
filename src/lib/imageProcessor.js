// Image Preprocessing - ตรงสเปค TensorFlow.js
import * as tf from '@tensorflow/tfjs'


// Preprocess สำหรับ Face Expression Model (48x48 RGB, float32 [0..1])
export function preprocessForFaceModel(imageElement) {
  return tf.tidy(() => {
    // แปลงเป็น tensor
    let tensor = tf.browser.fromPixels(imageElement)
    
    // Resize เป็น 48x48
    tensor = tf.image.resizeBilinear(tensor, [48, 48])
    
    // แปลงเป็น float32 และ normalize [0..1]
    tensor = tensor.toFloat().div(255.0)
    
    // เพิ่ม batch dimension
    tensor = tensor.expandDims(0)
    
    return tensor // [1, 48, 48, 3]
  })
}

// Preprocess สำหรับ Hand Model (รองรับทั้ง Dense และ Conv2D)
export function preprocessForHandModel(imageElement, handModel = null) {
  return tf.tidy(() => {
    // แปลงเป็น tensor
    let tensor = tf.browser.fromPixels(imageElement)
    
    // Resize เป็น 224x224
    tensor = tf.image.resizeBilinear(tensor, [224, 224])
    
    // แปลงเป็น float32 และ normalize [0..1]
    tensor = tensor.toFloat().div(255.0)
    
    // ตรวจสอบ input shape ของโมเดล
    if (handModel && handModel.inputs && handModel.inputs[0]) {
      const inputShape = handModel.inputs[0].shape
      console.log('[PREPROCESS] Hand model input shape:', inputShape)
      
      if (inputShape.length === 2) {
        // Dense layer: [null, features] - ต้อง flatten
        const features = Number(inputShape[1]) || (224 * 224 * 3)
        tensor = tensor.reshape([1, features])
        console.log('[PREPROCESS] Flattened to 2D:', tensor.shape)
      } else {
        // Conv2D layer: [null, h, w, c] - เพิ่ม batch dimension
        tensor = tensor.expandDims(0)
        console.log('[PREPROCESS] Expanded to 4D:', tensor.shape)
      }
    } else {
      // Default: ใช้ 4D สำหรับ Conv2D
      tensor = tensor.expandDims(0)
      console.log('[PREPROCESS] Default 4D shape:', tensor.shape)
    }
    
    return tensor
  })
}

// ตรวจสอบว่า image element พร้อมใช้งาน
export function validateImageElement(imageElement) {
  if (!imageElement) {
    throw new Error('Image element is null or undefined')
  }
  
  if (imageElement.readyState && imageElement.readyState < 2) {
    throw new Error('Image element not ready')
  }
  
  if (imageElement.videoWidth === 0 || imageElement.videoHeight === 0) {
    throw new Error('Image element has no video data')
  }
  
  return true
}

// Crop ใบหน้าจาก bounding box
export function cropFaceFromImage(imageElement, boundingBox) {
  return tf.tidy(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    const { x, y, width, height } = boundingBox
    const imgWidth = imageElement.videoWidth || imageElement.width
    const imgHeight = imageElement.videoHeight || imageElement.height
    
    // คำนวณ pixel coordinates
    const pixelX = Math.max(0, Math.floor(x * imgWidth))
    const pixelY = Math.max(0, Math.floor(y * imgHeight))
    const pixelWidth = Math.min(imgWidth - pixelX, Math.floor(width * imgWidth))
    const pixelHeight = Math.min(imgHeight - pixelY, Math.floor(height * imgHeight))
    
    // ตั้งค่า canvas
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    
    // วาดภาพที่ crop แล้ว
    ctx.drawImage(
      imageElement,
      pixelX, pixelY, pixelWidth, pixelHeight,
      0, 0, pixelWidth, pixelHeight
    )
    
    // แปลงเป็น tensor
    return tf.browser.fromPixels(canvas)
  })
}
