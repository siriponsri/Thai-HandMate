// Face Emotion Model (Teachable Machine)
// ใช้ TensorFlow.js เวอร์ชันเดียวกับ Hand Models

import * as tmImage from '@teachablemachine/image'

// ตัวแปรเก็บโมเดล
let faceEmotionModel = null
let isLoaded = false

// โหลด Face Emotion Model
export async function loadFaceEmotionModel() {
  try {
    console.log('[INFO] กำลังโหลด Face Emotion Model (Teachable Machine)...')
    
    // โหลดโมเดลจาก public/models/face-emotion/
    const modelUrl = '/models/face-emotion/model.json'
    const metadataUrl = '/models/face-emotion/metadata.json'
    
    faceEmotionModel = await tmImage.load(modelUrl, metadataUrl)
    isLoaded = true
    
    console.log('[SUCCESS] Face Emotion Model โหลดสำเร็จ')
    return true
  } catch (error) {
    console.warn('[WARNING] ไม่สามารถโหลด Face Emotion Model ได้:', error.message)
    
    // Fallback: ใช้ simple emotion detection
    console.log('[INFO] ใช้ Simple Emotion Detection แทน')
    isLoaded = true
    faceEmotionModel = 'simple'
    return true
  }
}

// ตรวจจับอารมณ์จากภาพ
export async function detectFaceEmotion(imageElement) {
  if (!isLoaded) {
    return {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      source: 'no-model',
      details: 'Face Emotion Model ไม่ได้โหลด'
    }
  }
  
  try {
    // ตรวจสอบว่า imageElement มีอยู่จริงหรือไม่
    if (!imageElement) {
      throw new Error('ไม่พบ image element')
    }
    
    // ตรวจสอบว่า imageElement พร้อมใช้งานหรือไม่
    if (imageElement.readyState < 2) {
      throw new Error('Image element ยังไม่พร้อมใช้งาน')
    }
    
    if (faceEmotionModel === 'simple') {
      // ใช้ simple emotion detection
      return await detectSimpleEmotion(imageElement)
    }
    
    // ใช้ Teachable Machine Model
    return await detectWithTeachableModel(imageElement)
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการตรวจจับอารมณ์:', error)
    return {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      source: 'error',
      details: error.message
    }
  }
}

// ตรวจจับอารมณ์ด้วย Teachable Machine Model
async function detectWithTeachableModel(imageElement) {
  try {
    // ทำนายอารมณ์
    const predictions = await faceEmotionModel.predict(imageElement)
    
    // แปลงผลลัพธ์เป็น array
    const emotionScores = predictions.map(pred => pred.probability)
    const emotionLabels = predictions.map(pred => pred.className)
    
    // สร้างผลลัพธ์อารมณ์
    const allEmotions = emotionLabels.map((emotion, index) => ({
      emotion: emotion,
      confidence: emotionScores[index]
    }))
    
    // หาอารมณ์ที่มี confidence สูงสุด
    const bestEmotionIndex = emotionScores.indexOf(Math.max(...emotionScores))
    const bestEmotion = emotionLabels[bestEmotionIndex]
    const bestConfidence = emotionScores[bestEmotionIndex]
    
    return {
      emotion: bestEmotion,
      confidence: bestConfidence,
      allEmotions: allEmotions,
      source: 'teachable-machine',
      details: `Teachable Machine: ${bestEmotion} (${(bestConfidence * 100).toFixed(1)}%)`
    }
    
  } catch (error) {
    console.error('[ERROR] Teachable Machine Model error:', error)
    // Fallback to simple detection
    return await detectSimpleEmotion(imageElement)
  }
}

// Simple emotion detection (fallback)
async function detectSimpleEmotion(imageElement) {
  // สร้าง canvas เพื่อประมวลผลภาพ
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = imageElement.videoWidth || imageElement.width
  canvas.height = imageElement.videoHeight || imageElement.height
  
  // วาดภาพลงบน canvas
  ctx.drawImage(imageElement, 0, 0)
  
  const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  let totalBrightness = 0
  let pixelCount = 0
  
  // วิเคราะห์ความสว่างของภาพ
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    const brightness = (r + g + b) / 3
    totalBrightness += brightness
    pixelCount++
  }
  
  const averageBrightness = totalBrightness / pixelCount
  
  // สร้างอารมณ์ตามความสว่าง
  const emotions = [
    { emotion: 'neutral', confidence: 0.6 },
    { emotion: 'happy', confidence: Math.min(0.4, averageBrightness / 255 * 0.8) },
    { emotion: 'sad', confidence: Math.min(0.3, (255 - averageBrightness) / 255 * 0.6) },
    { emotion: 'surprised', confidence: Math.min(0.2, Math.random() * 0.4) },
    { emotion: 'angry', confidence: Math.min(0.1, Math.random() * 0.2) },
    { emotion: 'fear', confidence: Math.min(0.1, Math.random() * 0.2) },
    { emotion: 'disgust', confidence: Math.min(0.1, Math.random() * 0.2) }
  ]
  
  const bestEmotion = emotions.reduce((prev, current) => 
    current.confidence > prev.confidence ? current : prev
  )
  
  return {
    emotion: bestEmotion.emotion,
    confidence: bestEmotion.confidence,
    allEmotions: emotions,
    source: 'simple-fallback',
    details: `Simple: ${bestEmotion.emotion} (${(bestEmotion.confidence * 100).toFixed(1)}%)`
  }
}

// ตรวจสอบสถานะ
export function getFaceEmotionModelStatus() {
  return {
    isLoaded,
    hasModel: !!faceEmotionModel,
    modelType: faceEmotionModel === 'simple' ? 'simple' : 'teachable-machine'
  }
}
