// Face Detection ด้วย MediaPipe
import { FaceDetection } from '@mediapipe/face_detection'

// ตัวแปรเก็บ Face Detection
let faceDetection = null
let isLoaded = false

// โหลด Face Detection
export async function loadFaceDetection() {
  try {
    console.log('[INFO] กำลังโหลด MediaPipe Face Detection...')
    
    faceDetection = new FaceDetection({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
      }
    })
    
    faceDetection.setOptions({
      model: 'short', // 'short' หรือ 'full'
      minDetectionConfidence: 0.5
    })
    
    // รอให้โหลดเสร็จ
    await new Promise((resolve) => {
      faceDetection.onResults((results) => {
        // ไม่ต้องทำอะไร
      })
      
      // เริ่มต้น
      faceDetection.initialize().then(() => {
        isLoaded = true
        console.log('[SUCCESS] MediaPipe Face Detection โหลดสำเร็จ')
        resolve()
      })
    })
    
    
    return true
  } catch (error) {
    console.error('[ERROR] ไม่สามารถโหลด MediaPipe Face Detection ได้:', error)
    return false
  }
}

// ตรวจจับใบหน้า
export async function detectFace(imageElement) {
  if (!isLoaded || !faceDetection) {
    return {
      emotion: 'neutral',
      confidence: 0,
      allEmotions: [],
      faces: [],
      source: 'no-face-model',
      details: 'MediaPipe Face Detection ไม่ได้โหลด'
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
    
    // ตรวจจับใบหน้า
    const results = await new Promise((resolve, reject) => {
      faceDetection.onResults((results) => {
        resolve(results)
      })
      
      faceDetection.send({ image: imageElement })
      
      // timeout 3 วินาที
      setTimeout(() => {
        reject(new Error('Face detection timeout'))
      }, 3000)
    })
    
    if (!results.detections || results.detections.length === 0) {
      return {
        emotion: 'neutral',
        confidence: 0,
        allEmotions: [],
        faces: [],
        source: 'no-face-detected',
        details: 'ไม่พบใบหน้าในภาพ'
      }
    }
    
    // ประมวลผลผลลัพธ์
    const faces = results.detections.map((detection, index) => {
      const bbox = detection.locationData.relativeBoundingBox
      const landmarks = detection.locationData.relativeKeypoints || []
      
      return {
        faceId: index + 1,
        box: {
          x: bbox.xCenter - bbox.width / 2,
          y: bbox.yCenter - bbox.height / 2,
          width: bbox.width,
          height: bbox.height
        },
        confidence: detection.score,
        landmarks: landmarks
      }
    })
    
    // เลือกใบหน้าที่มี confidence สูงสุด
    const bestFace = faces.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    )
    
    return {
      faces: faces,
      source: 'mediapipe',
      details: `ตรวจพบ ${faces.length} ใบหน้า, ความมั่นใจ: ${(bestFace.confidence * 100).toFixed(1)}%`
    }
    
  } catch (error) {
    console.error('[ERROR] ข้อผิดพลาดในการตรวจจับใบหน้า:', error)
    return {
      faces: [],
      source: 'error',
      details: error.message
    }
  }
}

// ตรวจสอบสถานะ
export function getFaceDetectionStatus() {
  return {
    isLoaded,
    hasModel: !!faceDetection
  }
}
