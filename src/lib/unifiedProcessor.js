// Unified Processor สำหรับรวมผลลัพธ์ Hand + Face + Emotion
// สร้าง JSON สำหรับส่งเข้า LLM

import { CONFIG } from './config.js'

// ประมวลผลภาพแบบรวม (Hand + Face + Emotion)
export async function processUnifiedImage(videoElement, handResults, faceResults, emotionResults) {
  try {
    console.log('[INFO] เริ่มประมวลผลภาพแบบรวม...')
    
    // สร้าง timestamp
    const timestamp = new Date().toISOString()
    
    // สร้าง canvas เพื่อจับภาพ
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    ctx.drawImage(videoElement, 0, 0)
    
    // แปลง canvas เป็น blob สำหรับแสดงผล
    const imageBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })
    
    // รวมผลลัพธ์ทั้งหมด
    const unifiedResult = {
      timestamp: timestamp,
      imageBlob: imageBlob,
      
      // ผลลัพธ์ Hand Gestures
      hands: {
        bestWord: handResults?.word || 'Unknown',
        confidence: handResults?.confidence || 0,
        source: handResults?.source || 'no-model',
        allResults: handResults?.allResults || [],
        details: handResults?.details || 'ไม่สามารถประมวลผลได้'
      },
      
      // ผลลัพธ์ Face Detection
      face: {
        detected: faceResults?.faces?.length > 0,
        faceCount: faceResults?.faces?.length || 0,
        bestFaceConfidence: faceResults?.faces?.length > 0 ? 
          Math.max(...faceResults.faces.map(f => f.confidence)) : 0,
        source: faceResults?.source || 'no-face-detected',
        details: faceResults?.details || 'ไม่พบใบหน้า'
      },
      
      // ผลลัพธ์ Emotion Detection
      emotion: {
        bestEmotion: emotionResults?.emotion || 'neutral',
        confidence: emotionResults?.confidence || 0,
        allEmotions: emotionResults?.allEmotions || [],
        source: emotionResults?.source || 'no-emotion-model',
        details: emotionResults?.details || 'ไม่สามารถตรวจจับอารมณ์ได้'
      },
      
      // ข้อมูลสำหรับ LLM
      forLLM: {
        words: extractWordsForLLM(handResults),
        emotion: emotionResults?.emotion || 'neutral',
        wordConfidences: extractWordConfidences(handResults),
        emotionConfidences: emotionResults?.allEmotions || [],
        faceDetected: faceResults?.faces?.length > 0,
        faceConfidence: faceResults?.faces?.length > 0 ? 
          Math.max(...faceResults.faces.map(f => f.confidence)) : 0
      },
      
      // ข้อมูลเพิ่มเติม
      metadata: {
        processingTime: Date.now(),
        imageSize: {
          width: canvas.width,
          height: canvas.height
        },
        modelVersions: {
          hand: 'teachable-machine',
          face: 'mediapipe',
          emotion: emotionResults?.source || 'simple'
        }
      }
    }
    
    console.log('[SUCCESS] ประมวลผลภาพแบบรวมเสร็จแล้ว:', unifiedResult)
    return unifiedResult
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการประมวลผลภาพแบบรวม:', error)
    return createErrorResult(error.message)
  }
}

// สร้าง JSON สำหรับ LLM
export function createLLMJson(unifiedResult) {
  const { hands, emotion, face } = unifiedResult
  
  // กรองคำที่มี confidence สูงกว่าเกณฑ์
  const validWords = hands.allResults
    .filter(result => result.confidence > CONFIG.MIN_CONFIDENCE)
    .map(result => result.word)
  
  // สร้าง JSON สำหรับ LLM
  const llmJson = {
    timestamp: unifiedResult.timestamp,
    
    // ข้อมูลหลัก
    signLanguage: {
      words: validWords,
      bestWord: hands.bestWord,
      confidence: hands.confidence,
      source: hands.source
    },
    
    // ข้อมูลอารมณ์
    emotion: {
      emotion: emotion.bestEmotion,
      confidence: emotion.confidence,
      source: emotion.source
    },
    
    // ข้อมูลใบหน้า
    face: {
      detected: face.detected,
      faceCount: face.faceCount,
      confidence: face.bestFaceConfidence
    },
    
    // ข้อมูลสำหรับการสร้างประโยค
    context: {
      hasSignLanguage: validWords.length > 0,
      hasEmotion: emotion.confidence > 0.3,
      hasFace: face.detected,
      overallConfidence: calculateOverallConfidence(unifiedResult)
    }
  }
  
  return llmJson
}

// สร้าง JSON สำหรับ API
export function createAPIJson(unifiedResult) {
  const llmJson = createLLMJson(unifiedResult)
  
  return {
    ...llmJson,
    
    // ข้อมูลเพิ่มเติมสำหรับ API
    api: {
      version: '1.0.0',
      endpoint: '/api/generate',
      method: 'POST'
    },
    
    // ข้อมูลสำหรับ debugging
    debug: {
      processingTime: unifiedResult.metadata.processingTime,
      modelVersions: unifiedResult.metadata.modelVersions,
      imageSize: unifiedResult.metadata.imageSize
    }
  }
}

// Helper functions
function extractWordsForLLM(handResults) {
  if (!handResults?.allResults) return []
  
  return handResults.allResults
    .filter(result => result.confidence > CONFIG.MIN_CONFIDENCE)
    .map(result => result.word)
}

function extractWordConfidences(handResults) {
  if (!handResults?.allResults) return []
  
  return handResults.allResults
    .filter(result => result.confidence > CONFIG.MIN_CONFIDENCE)
    .map(result => ({
      word: result.word,
      confidence: result.confidence,
      source: result.source
    }))
}

function calculateOverallConfidence(unifiedResult) {
  const { hands, emotion, face } = unifiedResult
  
  let totalConfidence = 0
  let count = 0
  
  // Hand confidence
  if (hands.confidence > 0) {
    totalConfidence += hands.confidence
    count++
  }
  
  // Emotion confidence
  if (emotion.confidence > 0) {
    totalConfidence += emotion.confidence
    count++
  }
  
  // Face confidence
  if (face.bestFaceConfidence > 0) {
    totalConfidence += face.bestFaceConfidence
    count++
  }
  
  return count > 0 ? totalConfidence / count : 0
}

function createErrorResult(errorMessage) {
  return {
    timestamp: new Date().toISOString(),
    imageBlob: null,
    hands: { bestWord: 'Unknown', confidence: 0, source: 'error', allResults: [], details: errorMessage },
    face: { detected: false, faceCount: 0, bestFaceConfidence: 0, source: 'error', details: errorMessage },
    emotion: { bestEmotion: 'neutral', confidence: 0, allEmotions: [], source: 'error', details: errorMessage },
    forLLM: { words: [], emotion: 'neutral', wordConfidences: [], emotionConfidences: [], faceDetected: false, faceConfidence: 0 },
    metadata: { processingTime: Date.now(), imageSize: { width: 0, height: 0 }, modelVersions: { hand: 'error', face: 'error', emotion: 'error' } }
  }
}
