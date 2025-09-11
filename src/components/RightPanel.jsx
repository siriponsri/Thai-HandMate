import React, { useState } from 'react'
import { CONFIG } from '../lib/config.js'

export default function RightPanel() {
  const [capturedWords, setCapturedWords] = useState([])
  const [generatedSentence, setGeneratedSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // ฟังก์ชันรับผลการจับภาพจาก CameraFeed
  React.useEffect(() => {
    // Listen for capture events from CameraFeed
    const handleCapture = (event) => {
      const captureData = event.detail
      
      // เพิ่มคำที่จับได้ (ยกเว้น Unknown)
      if (captureData.word !== 'Unknown' && captureData.confidence >= CONFIG.MIN_CONFIDENCE) {
        setCapturedWords(prev => [...prev, captureData])
        console.log('📝 เพิ่มคำ:', captureData.word, `(${(captureData.confidence * 100).toFixed(1)}%)`)
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
      
      // เรียก API backend
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words })
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
  }
  
  return (
    <div className="space-y-6">
      {/* รายการคำที่จับได้ */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text">คำที่จับได้</h3>
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
        
        {capturedWords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>ยังไม่มีคำที่จับได้</p>
            <p className="text-sm">กดปุ่ม "📸 ถ่ายภาพ" เพื่อเริ่มจับคำ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {capturedWords.map((item, index) => (
              <div key={index} className="result-item">
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.word}
                  className="result-thumbnail"
                />
                <div className="flex-1">
                  <div className="result-label">{item.word}</div>
                  <div className="result-confidence">
                    ความมั่นใจ: {(item.confidence * 100).toFixed(1)}%
                  </div>
                  {item.details && (
                    <div className="text-sm text-muted-foreground">
                      {item.details}
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
