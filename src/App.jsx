import React from 'react'
import CameraFeed from './components/CameraFeed'
import RightPanel from './components/RightPanel'
import StatusBadge from './components/StatusBadge'

function App() {
  return (
    <div className="min-h-screen bg-bg transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-brand to-accent">
                <span className="text-white text-2xl">TH</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text">Thai-HandMate</h1>
                <p className="text-sm text-muted-foreground">ระบบจดจำภาษามือไทย</p>
              </div>
            </div>
            <StatusBadge />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Camera */}
          <div className="space-y-6">
            <CameraFeed />
          </div>

          {/* Right Column - Results Panel */}
          <div className="space-y-6">
            <RightPanel />
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 border border-border text-sm">
            <span className="text-accent">*</span>
            <span className="text-text">จดจำภาษามือไทยด้วย AI พร้อมสร้างประโยคอัตโนมัติ</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
