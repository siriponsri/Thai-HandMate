// Prediction System - กัน NaN และจัดการ memory
import * as tf from '@tensorflow/tfjs'
import * as faceapi from '@vladmandic/face-api'
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

// Detect Face และ Emotion
export async function detectFaceAndEmotion(imageElement) {
  try {
    validateImageElement(imageElement)
    
    // ตรวจจับใบหน้า
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.SsdMobilenetv1Options({
        minConfidence: 0.5
      }))
      .withFaceLandmarks()
      .withFaceExpressions()
    
    if (!detection) {
      return {
        detected: false,
        faceCount: 0,
        faces: [],
        bestFace: null,
        bestFaceConfidence: 0,
        emotion: 'neutral',
        emotionConfidence: 0,
        source: 'face-api',
        details: 'No face detected'
      }
    }
    
    // วิเคราะห์อารมณ์
    const expressions = detection.expressions
    const emotions = Object.entries(expressions).map(([emotion, confidence]) => ({
      emotion,
      confidence
    }))
    
    // หาอารมณ์ที่มี confidence สูงสุด
    const bestEmotion = emotions.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    )
    
    // สร้าง face object
    const face = {
      faceId: 1,
      box: {
        x: detection.detection.box.x / imageElement.videoWidth,
        y: detection.detection.box.y / imageElement.videoHeight,
        width: detection.detection.box.width / imageElement.videoWidth,
        height: detection.detection.box.height / imageElement.videoHeight
      },
      confidence: detection.detection.score,
      landmarks: detection.landmarks.positions.map(pos => ({
        x: pos.x / imageElement.videoWidth,
        y: pos.y / imageElement.videoHeight
      }))
    }
    
    return {
      detected: true,
      faceCount: 1,
      faces: [face],
      bestFace: face,
      bestFaceConfidence: detection.detection.score,
      emotion: bestEmotion.emotion,
      emotionConfidence: bestEmotion.confidence,
      allEmotions: emotions,
      source: 'face-api',
      details: `Face: ${(detection.detection.score * 100).toFixed(1)}%, Emotion: ${bestEmotion.emotion} (${(bestEmotion.confidence * 100).toFixed(1)}%)`
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
      source: 'face-api-error',
      details: `Face Error: ${error.message}`
    }
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
