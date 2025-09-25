import React, { useEffect, useState } from 'react'
import { getModelStatus } from '../lib/tm.js'
import { CONFIG } from '../lib/config.js'

export default function StatusBadge() {
  const [modelStatus, setModelStatus] = useState({
    hasAnyModel: false,
    hasHandModel: false,
    hasFaceModels: false,
    hasEmotionModels: false,
    isLoading: true
  })
  
  useEffect(() => {
    // ตรวจสอบสถานะโมเดลทุก ๆ 1 วินาที
    const checkStatus = () => {
      const status = getModelStatus()
      setModelStatus(status)
    }
    
    // เช็คครั้งแรก
    checkStatus()
    
    // เช็คทุก 1 วินาที
    const interval = setInterval(checkStatus, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const getStatusInfo = () => {
    const { hasAnyModel, hasHandModel, hasFaceModels, hasEmotionModels, isLoading } = modelStatus
    
    if (isLoading) {
      return { text: '⏳ กำลังโหลด...', className: 'badge-warning' }
    }
    
    // นับโมเดลที่พร้อมใช้งาน (3 โมเดล: Hand, Face Detection, Emotion)
    const totalReady = (hasHandModel ? 1 : 0) + (hasFaceModels ? 1 : 0) + (hasEmotionModels ? 1 : 0)
    
    if (totalReady === 3) {
      return { text: '✅ ทุกโมเดลพร้อม (3/3)', className: 'badge-success' }
    } else if (totalReady >= 2) {
      return { text: `🟡 โมเดลพร้อม (${totalReady}/3)`, className: 'badge-warning' }
    } else if (hasAnyModel || hasFaceModels || hasEmotionModels) {
      return { text: `🟠 โมเดลพร้อม (${totalReady}/3)`, className: 'badge-warning' }
    } else {
      return { text: '❌ ไม่มีโมเดล (0/3)', className: 'badge-error' }
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <div className="flex items-center gap-2">
      <div className={`badge ${statusInfo.className}`}>
        {statusInfo.text}
      </div>
      
      {/* แสดงรายละเอียดโมเดลแต่ละตัว */}
      <div className="hidden md:flex items-center gap-1 text-xs">
        <span className={`w-2 h-2 rounded-full ${modelStatus.hasHandModel ? 'bg-green-500' : 'bg-gray-400'}`} title="Hand Model"></span>
        <span className={`w-2 h-2 rounded-full ${modelStatus.hasFaceModels ? 'bg-green-500' : 'bg-gray-400'}`} title="Face Detection"></span>
        <span className={`w-2 h-2 rounded-full ${modelStatus.hasEmotionModels ? 'bg-green-500' : 'bg-gray-400'}`} title="Emotion Detection"></span>
      </div>
    </div>
  )
}
