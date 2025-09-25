import React, { useState } from 'react'
import { CONFIG } from '../lib/config.js'

export default function RightPanel() {
  const [capturedWords, setCapturedWords] = useState([])
  const [generatedSentence, setGeneratedSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [latestEmotion, setLatestEmotion] = useState('neutral') // เก็บอารมณ์ล่าสุด
  
  // ฟังก์ชันรับผลการจับภาพจาก CameraFeed
  React.useEffect(() => {
    // Listen for capture events from CameraFeed
    const handleCapture = (event) => {
      const captureData = event.detail
      
      // อัปเดตอารมณ์ล่าสุดจากข้อมูล emotion (ใช้ emotion แทน face)
      if (captureData.emotion && captureData.emotion.bestEmotion) {
        setLatestEmotion(captureData.emotion.bestEmotion)
        console.log('😊 อารมณ์ล่าสุด:', captureData.emotion.bestEmotion, 
                   `(${(captureData.emotion.confidence * 100).toFixed(1)}%)`)
      }
      
      // เพิ่มคำที่จับได้ (รวม Unknown ด้วย)
      const wordData = {
        ...captureData,
        id: Date.now(), // เพิ่ม ID สำหรับ key
        imageUrl: captureData.thumbnailUrl || (captureData.imageBlob ? URL.createObjectURL(captureData.imageBlob) : null)
      }
      
      setCapturedWords(prev => [...prev, wordData])
      console.log('📝 เพิ่มคำ:', captureData.hands?.bestWord || 'Unknown', 
                 `(${((captureData.hands?.confidence || 0) * 100).toFixed(1)}%)`)
      
      // แสดงข้อมูลเพิ่มเติมถ้ามี
      if (captureData.hands && captureData.hands.allResults) {
        console.log('🤏 ผลลัพธ์ทั้งหมด (Hand):', captureData.hands.allResults)
      }
      if (captureData.emotion && captureData.emotion.allEmotions) {
        console.log('😊 อารมณ์ทั้งหมด (Emotion):', captureData.emotion.allEmotions)
      }
      if (captureData.llmJson) {
        console.log('🤖 LLM JSON:', captureData.llmJson)
      }
    }
    
    // เชื่อมต่อกับ CameraFeed ผ่าน custom event
    window.addEventListener('wordCaptured', handleCapture)
    
    return () => {
      window.removeEventListener('wordCaptured', handleCapture)
    }
  }, [])
  
  // สร้างประโยค
  const handleGenerateSentence = async () => {
    if (capturedWords.length === 0) {
      alert('กรุณาจับภาพคำก่อนเพื่อสร้างประโยค')
      return
    }
    
    setIsGenerating(true)
    
    try {
      const words = capturedWords.map(item => item.word)
      
      console.log('📤 ส่งข้อมูลไป Backend:', { words, emotion: latestEmotion })
      
      // รวม JSON จากทุกภาพที่จับได้
      const llmData = {
        capturedData: capturedWords.map(item => item.llmJson).filter(Boolean),
        summary: {
          words: capturedWords.map(item => item.hands?.bestWord || 'Unknown'),
          emotions: capturedWords.map(item => item.emotion?.bestEmotion || 'neutral'),
          overallEmotion: latestEmotion,
          totalCaptures: capturedWords.length
        }
      }
      
      console.log('📤 ส่งข้อมูลไป Backend (LLM format):', llmData)
      
      // เรียก API backend พร้อมข้อมูลแบบใหม่
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(llmData)
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedSentence(data.sentences[0] || 'ไม่สามารถสร้างประโยคได้')
      } else {
        // Fallback: เรียงคำต่อกันง่ายๆ
        const fallbackSentence = words.join(' ')
        setGeneratedSentence(`${fallbackSentence} (สร้างจากคำที่จับได้)`)
      }
      
    } catch (error) {
      console.error('[ERROR] ข้อผิดพลาดในการสร้างประโยค:', error)
      
      // Fallback: เรียงคำต่อกันง่ายๆ
      const words = capturedWords.map(item => item.word)
      const fallbackSentence = words.join(' ')
      setGeneratedSentence(`${fallbackSentence} (ไม่สามารถเชื่อมต่อ API ได้)`)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // ลบคำทั้งหมด
  const handleClearWords = () => {
    setCapturedWords([])
    setGeneratedSentence('')
    setLatestEmotion('neutral') // รีเซ็ตอารมณ์ด้วย
  }
  
  return (
    <div className="space-y-6">
      {/* รายการคำที่จับได้ */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text">คำที่จับได้</h3>
          <div className="flex items-center gap-3">
            {/* แสดงอารมณ์ปัจจุบัน */}
            <div className="flex items-center gap-1 text-sm">
              <span>😊</span>
              <span className="text-muted-foreground">อารมณ์: {latestEmotion}</span>
            </div>
            {capturedWords.length > 0 && (
              <button 
                className="btn btn-secondary"
                onClick={handleClearWords}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                🗑️ ลบทั้งหมด
              </button>
            )}
          </div>
        </div>
        
        {capturedWords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>ยังไม่มีคำที่จับได้</p>
            <p className="text-sm">กดปุ่ม "📸 ถ่ายภาพ" เพื่อเริ่มจับคำ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {capturedWords.map((item, index) => (
              <div key={item.id || index} className="result-item">
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.hands?.bestWord || 'Unknown'}
                    className="result-thumbnail"
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <div className="flex-1">
                  <div className="result-label">
                    {item.hands?.bestWord || 'Unknown'}
                  </div>
                  <div className="result-confidence">
                    ความมั่นใจ: {((item.hands?.confidence || 0) * 100).toFixed(1)}%
                  </div>
                  {item.emotion && item.emotion.bestEmotion && (
                    <div className="text-sm text-blue-600">
                      😊 อารมณ์: {item.emotion.bestEmotion} ({(item.emotion.confidence * 100).toFixed(1)}%)
                    </div>
                  )}
                  {item.face && item.face.detected && (
                    <div className="text-sm text-green-600">
                      👤 ตรวจพบใบหน้า: {item.face.faceCount} ({(item.face.bestFaceConfidence * 100).toFixed(0)}%)
                    </div>
                  )}
                  {item.hands?.details && (
                    <div className="text-sm text-muted-foreground">
                      {item.hands.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* ปุ่มสร้างประโยค */}
      {capturedWords.length > 0 && (
        <div className="card">
          <button
            className={`btn ${isGenerating ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleGenerateSentence}
            disabled={isGenerating}
            style={{ width: '100%' }}
          >
            {isGenerating ? (
              <>
                <span className="loading"></span>
                <span style={{ marginLeft: '0.5rem' }}>กำลังสร้างประโยค...</span>
              </>
            ) : (
              '✨ สร้างประโยค'
            )}
          </button>
        </div>
      )}
      
      {/* ประโยคที่สร้างได้ */}
      {generatedSentence && (
        <div className="card">
          <h3 className="text-xl font-bold text-text mb-3">ประโยคที่สร้างได้</h3>
          <div className="p-4 bg-surface border border-border rounded-lg">
            <p className="text-lg text-text leading-relaxed">
              "{generatedSentence}"
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
