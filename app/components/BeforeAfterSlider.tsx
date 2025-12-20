'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface BeforeAfterSliderProps {
  beforeImage?: string
  afterImage?: string
  beforeLabel?: string
  afterLabel?: string
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage = '/images/before.jpg',
  afterImage = '/images/after.jpg',
  beforeLabel = 'Before',
  afterLabel = 'After',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg shadow-lg cursor-col-resize group"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Background (After) Image */}
      <div className="w-full h-96 bg-gray-300">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${afterImage})`,
          }}
        />
      </div>

      {/* Overlay (Before) Image */}
      <div
        className="absolute top-0 left-0 h-full bg-gray-300 overflow-hidden"
        style={{
          width: `${sliderPosition}%`,
        }}
      >
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${beforeImage})`,
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* Slider Handle */}
      <motion.div
        className="absolute top-0 w-1 h-full bg-white shadow-lg"
        style={{
          left: `${sliderPosition}%`,
        }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-orange-500 group-hover:scale-110 transition">
          <div className="flex gap-1">
            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Before Label */}
      <motion.div
        className="absolute top-4 left-4 text-white font-bold text-lg drop-shadow-lg"
        animate={{ x: 0 }}
      >
        <span className="bg-black bg-opacity-50 px-3 py-1 rounded">{beforeLabel}</span>
      </motion.div>

      {/* After Label */}
      <motion.div
        className="absolute top-4 right-4 text-white font-bold text-lg drop-shadow-lg"
        animate={{ x: 0 }}
      >
        <span className="bg-black bg-opacity-50 px-3 py-1 rounded">{afterLabel}</span>
      </motion.div>
    </div>
  )
}
