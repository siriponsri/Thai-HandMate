import React, { useEffect, useState } from 'react'
import { getModelStatus } from '../lib/tm.js'
import { CONFIG } from '../lib/config.js'

export default function StatusBadge() {
  const [modelStatus, setModelStatus] = useState({
    hasAnyModel: false,
    hasModelA: false,
    hasModelB: false,
    hasModelC: false,
    hasFaceModels: false,
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
    const { hasAnyModel, hasModelA, hasModelB, hasModelC, hasFaceModels, isLoading } = modelStatus
    
    if (isLoading) {
      return { text: '⏳ กำลังโหลด...', className: 'badge-warning' }
    }
    
    // นับโมเดลที่พร้อมใช้งาน
    const handModels = [hasModelA, hasModelB, hasModelC].filter(Boolean)
    const totalReady = handModels.length + (hasFaceModels ? 1 : 0)
    
    if (totalReady === 4) {
      return { text: '✅ ทุกโมเดลพร้อม (4/4)', className: 'badge-success' }
    } else if (totalReady >= 2) {
      return { text: `🟡 โมเดลพร้อม (${totalReady}/4)`, className: 'badge-warning' }
    } else if (hasAnyModel || hasFaceModels) {
      return { text: `🟠 โมเดลพร้อม (${totalReady}/4)`, className: 'badge-warning' }
    } else {
      return { text: '❌ ไม่มีโมเดล (0/4)', className: 'badge-error' }
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
        <span className={`w-2 h-2 rounded-full ${modelStatus.hasModelA ? 'bg-green-500' : 'bg-gray-400'}`} title="Hand Model A"></span>
        <span className={`w-2 h-2 rounded-full ${modelStatus.hasModelB ? 'bg-green-500' : 'bg-gray-400'}`} title="Hand Model B"></span>
        <span className={`w-2 h-2 rounded-full ${modelStatus.hasModelC ? 'bg-green-500' : 'bg-gray-400'}`} title="Hand Model C"></span>
        <span className={`w-2 h-2 rounded-full ${modelStatus.hasFaceModels ? 'bg-green-500' : 'bg-gray-400'}`} title="Face API"></span>
      </div>
    </div>
  )
}
