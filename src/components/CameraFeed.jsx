import React, { useRef, useEffect, useState } from 'react'
import { loadModels, getModelStatus, processImageAsync } from '../lib/tm.js'
import { CONFIG } from '../lib/config.js'

export default function CameraFeed({ onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [modelStatus, setModelStatus] = useState({ hand: false, face: false, initialized: false, isLoading: false })
  const [faceDetections, setFaceDetections] = useState([])
  const [uploadedImage, setUploadedImage] = useState(null)
  
  // เริ่มกล้อง
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: CONFIG.CAMERA.width,
            height: CONFIG.CAMERA.height,
            facingMode: CONFIG.CAMERA.facingMode
          }
        })
        
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
                console.error('[ERROR] ไม่สามารถเข้าถึงกล้องได้:', error)
        alert('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตให้เว็บไซต์เข้าถึงกล้อง')
      }
    }
    
    startCamera()
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  // โหลดโมเดล
  useEffect(() => {
    async function initModels() {
      const result = await loadModels()
      setModelStatus(getModelStatus())
      
      if (result.success) {
        console.log('✅ โหลดโมเดลเสร็จแล้ว')
      } else {
        console.warn('⚠️ ไม่สามารถโหลดโมเดลได้:', result.error)
      }
    }
    
    initModels()
  }, [])
  
  // จัดการการอัปโหลดรูปภาพ
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // ตรวจสอบชนิดไฟล์
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    
    setIsCapturing(true)
    
    try {
      // อ่านไฟล์เป็น data URL
      const reader = new FileReader()
      reader.onload = async (e) => {
        const img = new Image()
        img.onload = async () => {
          // สร้าง canvas สำหรับวาดภาพ
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          
          // ปรับขนาด canvas ตามภาพ
          canvas.width = img.width
          canvas.height = img.height
          
          // วาดภาพลงบน canvas
          ctx.drawImage(img, 0, 0)
          
          // แปลง canvas เป็น blob
          canvas.toBlob(async (blob) => {
            const thumbnailUrl = URL.createObjectURL(blob)
            
            try {
              // ประมวลผลภาพ
              const result = await processImageAsync(img)
              
              console.log('🎯 ผลการประมวลผลภาพที่อัปโหลด:', result)
              
              // อัปเดต face detections
              if (result.face && result.face.faces) {
                setFaceDetections(result.face.faces)
              }
              
              // ส่งผลไปยัง parent component
              const captureData = {
                word: result.hands.bestWord,
                confidence: result.hands.confidence,
                thumbnailUrl: thumbnailUrl,
                source: result.hands.source,
                details: result.hands.details,
                timestamp: result.timestamp,
                hands: result.hands,
                face: result.face,
                emotion: result.emotion,
                forLLM: result.forLLM,
                llmJson: result.llmJson,
                apiJson: result.apiJson,
                isUploaded: true
              }
              
              if (onCapture) {
                onCapture(captureData)
              }
              
              window.dispatchEvent(new CustomEvent('wordCaptured', { detail: captureData }))
              
            } catch (error) {
              console.error('❌ ข้อผิดพลาดในการประมวลผลภาพ:', error)
              alert('ไม่สามารถประมวลผลภาพได้')
            }
          }, 'image/jpeg', 0.8)
        }
        
        img.src = e.target.result
        setUploadedImage(e.target.result)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการอัปโหลดภาพ:', error)
      alert('ไม่สามารถอัปโหลดภาพได้')
    } finally {
      setIsCapturing(false)
      // รีเซ็ต input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  // ถ่ายภาพ
  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return
    
    setIsCapturing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      // ตั้งค่าขนาด canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // วาดภาพจากวิดีโอลงบน canvas
      ctx.drawImage(video, 0, 0)
      
      // แปลง canvas เป็น blob สำหรับ thumbnail  
      canvas.toBlob(async (blob) => {
        const thumbnailUrl = URL.createObjectURL(blob)
        
        try {
          // ใช้ฟังก์ชันใหม่ที่ประมวลผลแบบ async (Hand + Face + Emotion)
          const result = await processImageAsync(video)
          
          console.log('🎯 ผลการประมวลผล (Hand + Face + Emotion):', result)
          
          // อัปเดต face detections
          if (result.face && result.face.faces) {
            setFaceDetections(result.face.faces)
          }
          
          // ส่งผลไปยัง parent component และ dispatch event
          const captureData = {
            // ข้อมูลหลักสำหรับแสดงผล (backward compatibility)
            word: result.hands.word,
            confidence: result.hands.confidence,
            thumbnailUrl: thumbnailUrl,
            source: result.hands.source,
            details: result.hands.details,
            timestamp: result.timestamp,
            
            // ข้อมูลเพิ่มเติมสำหรับ LLM
            hands: result.hands,
            face: result.face,
            emotion: result.emotion,
            forLLM: result.forLLM,
            
            // JSON สำหรับ LLM
            llmJson: result.llmJson,
            apiJson: result.apiJson
          }
          
          if (onCapture) {
            onCapture(captureData)
          }
          
          // ส่ง custom event สำหรับ RightPanel
          window.dispatchEvent(new CustomEvent('wordCaptured', { detail: captureData }))
          
        } catch (error) {
          console.error('❌ ข้อผิดพลาดในการทำนาย:', error)
          
          if (onCapture) {
            const captureData = {
              word: 'Unknown',
              confidence: 0.0,
              thumbnailUrl: thumbnailUrl,
              source: 'error',
              details: error.message,
              timestamp: new Date().toISOString(),
              // ข้อมูลเริ่มต้นสำหรับ error case
              hands: { bestWord: 'Unknown', confidence: 0, source: 'error', allResults: [], details: error.message },
              face: { bestEmotion: 'neutral', confidence: 0, allEmotions: [], details: 'ไม่สามารถตรวจจับได้เนื่องจากข้อผิดพลาด' },
              forLLM: { words: [], emotion: 'neutral', wordConfidences: [], emotionConfidences: [] }
            }
            
            onCapture(captureData)
            
            // ส่ง custom event สำหรับ RightPanel
            window.dispatchEvent(new CustomEvent('wordCaptured', { detail: captureData }))
          }
        }
      }, 'image/jpeg', 0.8)
      
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการถ่ายภาพ:', error)
    } finally {
      setIsCapturing(false)
    }
  }
  
  return (
    <div className="card">
      {/* ส่วนกล้อง */}
      <div className="camera-container" style={{ position: 'relative', marginBottom: '1rem' }}>
        {/* วิดีโอ */}
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
          style={{ display: uploadedImage ? 'none' : 'block' }}
        />
        
        {/* แสดงภาพที่อัปโหลด */}
        {uploadedImage && (
          <img 
            src={uploadedImage} 
            alt="Uploaded" 
            className="camera-video"
            style={{ objectFit: 'contain' }}
          />
        )}
        
        {/* Canvas ซ่อน (สำหรับจับภาพ) */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* แสดงกรอบ Face Detection */}
        {faceDetections.map((face, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              border: '3px solid #00ff00',
              borderRadius: '8px',
              left: `${face.box.x * 100}%`,
              top: `${face.box.y * 100}%`,
              width: `${face.box.width * 100}%`,
              height: `${face.box.height * 100}%`,
              pointerEvents: 'none',
              boxShadow: '0 0 0 1px rgba(0, 255, 0, 0.3)'
            }}
          >
            <span style={{
              position: 'absolute',
              top: '-25px',
              left: '0',
              background: '#00ff00',
              color: '#000',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              Face {index + 1} ({(face.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
        
        {/* แสดงสถานะโมเดล */}
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          left: '1rem'
        }}>
          <div className={`badge ${(modelStatus.hand || modelStatus.face) ? 'badge-success' : 'badge-warning'}`}>
            {modelStatus.isLoading ? '⏳ โหลดโมเดล...' : 
             (modelStatus.hand || modelStatus.face) ? '✅ โมเดลพร้อม' : '⚠️ ไม่มีโมเดล'}
          </div>
        </div>
      </div>
      
      {/* ส่วนปุ่ม - ย้ายออกมานอกกรอบกล้อง */}
      <div style={{ 
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          className={`btn ${isCapturing ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleCapture}
          disabled={isCapturing || uploadedImage}
          style={{ minWidth: '120px' }}
        >
          {isCapturing ? (
            <>
              <span className="loading"></span>
              <span style={{ marginLeft: '0.5rem' }}>จับภาพ...</span>
            </>
          ) : (
            '📸 ถ่ายภาพ'
          )}
        </button>
        
        <button
          className="btn btn-accent"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCapturing}
          style={{ minWidth: '120px' }}
        >
          📁 อัปโหลดภาพ
        </button>
        
        {uploadedImage && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setUploadedImage(null)
              setFaceDetections([])
            }}
          >
            ❌ ล้าง
          </button>
        )}
      </div>
      
      {/* Input file ซ่อน */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}
