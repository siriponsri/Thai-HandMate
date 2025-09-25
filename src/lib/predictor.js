// Prediction System - กัน NaN และจัดการ memory
import * as tf from '@tensorflow/tfjs'
import { preprocessForHandModel, preprocessForFaceModel, validateImageElement, cropFaceFromImage } from './imageProcessor.js'

// Labels สำหรับ Hand Model
const HAND_LABELS = ['เริ่ม', 'เรียนรู้', 'AI', 'อย่างไร', 'ช่วยเหลือ', 'ไม่ใช่', 'หยุด', 'ถัดไป', 'สถานะว่าง']

// Labels สำหรับ Emotion
const EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprised']

// Predict Hand Gesture
export async function predictHand(imageElement, handModel) {
  if (!handModel) {
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'no-model',
      details: 'Hand model not loaded'
    }
  }
  
  try {
    validateImageElement(imageElement)
    
    const input = preprocessForHandModel(imageElement, handModel)
    let prediction = null
    
    try {
      // ใช้ predict หรือ execute ตามประเภทโมเดล
      if (handModel.predict) {
        // LayersModel
        prediction = handModel.predict(input)
      } else if (handModel.execute) {
        // GraphModel
        prediction = handModel.execute(input)
      } else {
        throw new Error('Model has no predict or execute method')
      }
      
      // แปลงเป็น array
      const probs = await prediction.data()
      
      // ตรวจสอบ NaN
      if (!probs.every(p => Number.isFinite(p))) {
        throw new Error('NaN detected in prediction')
      }
      
      // หา class ที่มี probability สูงสุด
      const maxIndex = probs.indexOf(Math.max(...probs))
      const maxProb = probs[maxIndex]
      
      const word = HAND_LABELS[maxIndex] || 'Unknown'
      const confidence = maxProb
      
      return {
        word,
        confidence,
        source: 'tensorflow',
        details: `Hand: ${word} (${(confidence * 100).toFixed(1)}%)`
      }
      
    } finally {
      input.dispose()
      if (prediction) {
        prediction.dispose()
      }
    }
    
  } catch (error) {
    console.error('[ERROR] Hand prediction failed:', error)
    return {
      word: 'Unknown',
      confidence: 0.0,
      source: 'error',
      details: `Hand Error: ${error.message}`
    }
  }
}

// Predict Face Emotion (ใช้ TensorFlow.js)
export async function predictFaceEmotion(imageElement, faceModel) {
  if (!faceModel) {
    return {
      emotion: 'neutral',
      confidence: 0.0,
      allEmotions: [],
      source: 'no-model',
      details: 'Face model not loaded'
    }
  }
  
  try {
    validateImageElement(imageElement)
    
    const input = preprocessForFaceModel(imageElement)
    let prediction = null
    
    try {
      // ใช้ predict สำหรับ LayersModel
      prediction = faceModel.predict(input)
      
      // แปลงเป็น array
      const probs = await prediction.data()
      
      // ตรวจสอบ NaN
      if (!probs.every(p => Number.isFinite(p))) {
        throw new Error('NaN detected in face prediction')
      }
      
      // สร้าง emotion objects
      const emotions = EMOTION_LABELS.map((emotion, index) => ({
        emotion,
        confidence: probs[index]
      }))
      
      // หาอารมณ์ที่มี confidence สูงสุด
      const maxIndex = probs.indexOf(Math.max(...probs))
      const bestEmotion = emotions[maxIndex]
      
      return {
        emotion: bestEmotion.emotion,
        confidence: bestEmotion.confidence,
        allEmotions: emotions,
        source: 'tensorflow',
        details: `Face: ${bestEmotion.emotion} (${(bestEmotion.confidence * 100).toFixed(1)}%)`
      }
      
    } finally {
      input.dispose()
      if (prediction) {
        prediction.dispose()
      }
    }
    
  } catch (error) {
    console.error('[ERROR] Face emotion prediction failed:', error)
    return {
      emotion: 'neutral',
      confidence: 0.0,
      allEmotions: [],
      source: 'error',
      details: `Face Error: ${error.message}`
    }
  }
}

// Detect Face และ Emotion (ใช้ TensorFlow.js)
export async function detectFaceAndEmotion(imageElement, faceModel) {
  try {
    validateImageElement(imageElement)
    
    // ใช้ simple face detection (brightness-based)
    const faceDetected = await detectFaceSimple(imageElement)
    
    if (!faceDetected) {
      return {
        detected: false,
        faceCount: 0,
        faces: [],
        bestFace: null,
        bestFaceConfidence: 0,
        emotion: 'neutral',
        emotionConfidence: 0,
        source: 'simple-detection',
        details: 'No face detected'
      }
    }
    
    // วิเคราะห์อารมณ์ด้วย TensorFlow.js
    const emotionResult = await predictFaceEmotion(imageElement, faceModel)
    
    // สร้าง face object
    const face = {
      faceId: 1,
      box: {
        x: 0.2, // กลางภาพ
        y: 0.2,
        width: 0.6,
        height: 0.6
      },
      confidence: 0.8, // confidence สำหรับ simple detection
      landmarks: [] // ไม่มี landmarks สำหรับ simple detection
    }
    
    return {
      detected: true,
      faceCount: 1,
      faces: [face],
      bestFace: face,
      bestFaceConfidence: face.confidence,
      emotion: emotionResult.emotion,
      emotionConfidence: emotionResult.confidence,
      allEmotions: emotionResult.allEmotions,
      source: 'tensorflow',
      details: `Face: ${(face.confidence * 100).toFixed(1)}%, Emotion: ${emotionResult.emotion} (${(emotionResult.confidence * 100).toFixed(1)}%)`
    }
    
  } catch (error) {
    console.error('[ERROR] Face detection failed:', error)
    return {
      detected: false,
      faceCount: 0,
      faces: [],
      bestFace: null,
      bestFaceConfidence: 0,
      emotion: 'neutral',
      emotionConfidence: 0,
      source: 'error',
      details: `Face Error: ${error.message}`
    }
  }
}

// Simple Face Detection (brightness-based)
async function detectFaceSimple(imageElement) {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = imageElement.videoWidth || imageElement.width
    canvas.height = imageElement.videoHeight || imageElement.height
    
    ctx.drawImage(imageElement, 0, 0)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // คำนวณความสว่างเฉลี่ย
    let totalBrightness = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3
      totalBrightness += brightness
    }
    
    const avgBrightness = totalBrightness / (data.length / 4)
    
    // ถ้าความสว่างอยู่ในช่วงที่เหมาะสม (ไม่มืดเกินไป ไม่สว่างเกินไป)
    return avgBrightness > 50 && avgBrightness < 200
    
  } catch (error) {
    console.error('[ERROR] Simple face detection failed:', error)
    return false
  }
}

// ตรวจสอบว่า prediction result ถูกต้อง
export function validatePredictionResult(result) {
  if (!result || typeof result !== 'object') {
    return false
  }
  
  if (typeof result.confidence !== 'number' || !Number.isFinite(result.confidence)) {
    return false
  }
  
  if (result.confidence < 0 || result.confidence > 1) {
    return false
  }
  
  return true
}
