import React, { useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'
import { CONFIG } from '../lib/config.js'

export default function StatusBadge() {
  const [faceStatus, setFaceStatus] = useState('loading') // 'loading', 'ready', 'not-ready'
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function initFaceAPI() {
      try {
        console.log('🔄 เริ่มโหลด face-api.js...')
        
        // พยายามโหลด tiny face detector model
        await faceapi.nets.tinyFaceDetector.loadFromUri(CONFIG.FACE_MODEL_PATH)
        
        console.log('✅ โหลด face-api.js เสร็จแล้ว')
        setFaceStatus('ready')
        
      } catch (error) {
        console.warn('⚠️ ไม่สามารถโหลด face-api.js ได้:', error.message)
        setFaceStatus('not-ready')
      } finally {
        setIsLoading(false)
      }
    }
    
    initFaceAPI()
  }, [])
  
  const getStatusInfo = () => {
    switch (faceStatus) {
      case 'loading':
        return { text: '⏳ กำลังโหลด...', className: 'badge-warning' }
      case 'ready':
        return { text: '✅ ใบหน้า: พร้อม', className: 'badge-success' }
      case 'not-ready':
      default:
        return { text: '⚠️ ใบหน้า: ไม่พร้อม', className: 'badge-warning' }
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <div className={`badge ${statusInfo.className}`}>
      {statusInfo.text}
    </div>
  )
}
