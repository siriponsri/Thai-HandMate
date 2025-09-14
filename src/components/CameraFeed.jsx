import React, { useRef, useEffect, useState } from 'react'
import { predict, loadModels, getModelStatus, processImage } from '../lib/tm.js'
import { CONFIG } from '../lib/config.js'

export default function CameraFeed({ onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [modelStatus, setModelStatus] = useState({ hasAnyModel: false, isLoading: false })
  
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
          // ใช้ฟังก์ชันใหม่ที่ประมวลผลทั้ง hand และ face
          const result = await processImage(video)
          
          console.log('🎯 ผลการประมวลผล (Hand + Face):', result)
          
          // ส่งผลไปยัง parent component และ dispatch event
          const captureData = {
            // ข้อมูลหลักสำหรับแสดงผล (backward compatibility)
            word: result.hands.bestWord,
            confidence: result.hands.confidence,
            thumbnailUrl: thumbnailUrl,
            source: result.hands.source,
            details: result.hands.details,
            timestamp: result.timestamp,
            
            // ข้อมูลเพิ่มเติมสำหรับ LLM
            hands: result.hands,
            face: result.face,
            forLLM: result.forLLM
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
      <div className="camera-container">
        {/* วิดีโอ */}
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
        />
        
        {/* Canvas ซ่อน (สำหรับจับภาพ) */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* ปุ่มถ่ายภาพ */}
        <div style={{ 
          position: 'absolute', 
          bottom: '1rem', 
          left: '50%', 
          transform: 'translateX(-50%)'
        }}>
          <button
            className={`btn ${isCapturing ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleCapture}
            disabled={isCapturing}
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
        </div>
        
        {/* แสดงสถานะโมเดล */}
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          left: '1rem'
        }}>
          <div className={`badge ${modelStatus.hasAnyModel ? 'badge-success' : 'badge-warning'}`}>
            {modelStatus.isLoading ? '⏳ โหลดโมเดล...' : 
             modelStatus.hasAnyModel ? '✅ โมเดลพร้อม' : '⚠️ ไม่มีโมเดล'}
          </div>
        </div>
      </div>
    </div>
  )
}
