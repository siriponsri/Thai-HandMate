import React, { useEffect, useState } from 'react'
import { getModelStatus } from '../lib/tm.js'
import { CONFIG } from '../lib/config.js'

export default function StatusBadge() {
  const [modelStatus, setModelStatus] = useState({
    hand: false,
    face: false,
    initialized: false,
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
    const { hand, face, initialized, isLoading } = modelStatus
    
    if (isLoading) {
      return { text: '⏳ กำลังโหลด...', className: 'badge-warning' }
    }
    
    // นับโมเดลที่พร้อมใช้งาน (2 โมเดล: Hand, Face)
    const totalReady = (hand ? 1 : 0) + (face ? 1 : 0)
    
    if (totalReady === 2) {
      return { text: '✅ ทุกโมเดลพร้อม (2/2)', className: 'badge-success' }
    } else if (totalReady === 1) {
      return { text: `🟡 โมเดลพร้อม (${totalReady}/2)`, className: 'badge-warning' }
    } else {
      return { text: '❌ ไม่มีโมเดล (0/2)', className: 'badge-error' }
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
        <span className={`w-2 h-2 rounded-full ${modelStatus.hand ? 'bg-green-500' : 'bg-gray-400'}`} title="Hand Model"></span>
        <span className={`w-2 h-2 rounded-full ${modelStatus.face ? 'bg-green-500' : 'bg-gray-400'}`} title="Face Model"></span>
      </div>
    </div>
  )
}
