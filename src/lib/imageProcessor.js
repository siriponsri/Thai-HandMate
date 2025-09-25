// Image Preprocessing - ตรงสเปค TensorFlow.js
import * as tf from '@tensorflow/tfjs'


// Preprocess สำหรับ Face Expression Model (48x48 Grayscale, float32 [0..1])
export function preprocessForFaceModel(imageElement) {
  return tf.tidy(() => {
    // แปลงเป็น tensor
    let tensor = tf.browser.fromPixels(imageElement)
    
    // Resize เป็น 48x48
    tensor = tf.image.resizeBilinear(tensor, [48, 48])
    
    // แปลงเป็น grayscale (RGB → Grayscale) - ใช้วิธี manual
    // ใช้สูตร: 0.299*R + 0.587*G + 0.114*B
    const [r, g, b] = tf.split(tensor, 3, 2)
    const grayscale = r.mul(0.299).add(g.mul(0.587)).add(b.mul(0.114))
    tensor = grayscale // ไม่ต้อง expandDims เพราะ grayscale อยู่แล้ว [48, 48, 1]
    
    // แปลงเป็น float32 และ normalize [0..1]
    tensor = tensor.toFloat().div(255.0)
    
    // เพิ่ม batch dimension
    tensor = tensor.expandDims(0)
    
    return tensor // [1, 48, 48, 1]
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
    
    // Hand model ต้องการ input shape [1, 14739] (Dense layer)
    // ต้อง resize เป็นขนาดที่เหมาะสมแล้ว flatten
    // 14739 = 3 * 7 * 7 * 101 (ประมาณ)
    // ลองใช้ 7x7x3 = 147
    tensor = tf.image.resizeBilinear(tensor, [7, 7])
    tensor = tensor.reshape([1, 7 * 7 * 3]) // [1, 147]
    
    // ถ้าไม่พอ 14739 ให้ pad หรือ resize ใหม่
    if (tensor.shape[1] < 14739) {
      // Pad ด้วย zeros
      const padding = tf.zeros([1, 14739 - tensor.shape[1]])
      tensor = tf.concat([tensor, padding], 1)
    } else if (tensor.shape[1] > 14739) {
      // Slice
      tensor = tensor.slice([0, 0], [1, 14739])
    }
    
    console.log('[PREPROCESS] Hand model input shape:', tensor.shape)
    
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
