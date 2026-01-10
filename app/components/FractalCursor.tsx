'use client'

import { useEffect, useState } from 'react'

const PRISM_COLORS = [
  '#00CED1', // Teal
  '#FFD700', // Gold
  '#FF4757', // Red
  '#FF6B35', // Orange
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
]

interface Particle {
  id: number
  x: number
  y: number
  color: string
  delay: number
}

interface FractalCursorProps {
  enabled?: boolean
}

export default function FractalCursor({ enabled = true }: FractalCursorProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setParticles([])
      setIsMoving(false)
      return
    }

    let moveTimeout: NodeJS.Timeout
    let particleId = 0
    let lastSpawnTime = 0
    const SPAWN_INTERVAL = 30 // Spawn particle every 30ms when moving

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      setMousePos({ x: e.clientX, y: e.clientY })
      setIsMoving(true)

      // Spawn particles while moving
      if (now - lastSpawnTime > SPAWN_INTERVAL) {
        lastSpawnTime = now
        
        // Create multiple particles in a fractal pattern
        const numParticles = 3
        const angleStep = (Math.PI * 2) / numParticles
        
        const newParticles: Particle[] = []
        for (let i = 0; i < numParticles; i++) {
          const angle = angleStep * i + (now / 1000) // Rotating pattern
          const distance = Math.random() * 15 + 5
          const offsetX = Math.cos(angle) * distance
          const offsetY = Math.sin(angle) * distance
          
          newParticles.push({
            id: particleId++,
            x: e.clientX + offsetX,
            y: e.clientY + offsetY,
            color: PRISM_COLORS[Math.floor(Math.random() * PRISM_COLORS.length)],
            delay: i * 0.05,
          })
        }
        
        setParticles((prev) => [...prev, ...newParticles])
        
        // Clean up old particles
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)))
        }, 1500)
      }

      clearTimeout(moveTimeout)
      moveTimeout = setTimeout(() => {
        setIsMoving(false)
      }, 100)
    }

    const handleClick = (e: MouseEvent) => {
      // Create wave effect on click
      const wave = document.createElement('div')
      wave.className = 'fractal-wave'
      wave.style.left = `${e.clientX - 10}px`
      wave.style.top = `${e.clientY - 10}px`
      wave.style.borderColor = PRISM_COLORS[Math.floor(Math.random() * PRISM_COLORS.length)]
      document.body.appendChild(wave)
      
      setTimeout(() => wave.remove(), 1000)

      // Create burst of particles
      const burstParticles: Particle[] = []
      const numBurst = 12
      for (let i = 0; i < numBurst; i++) {
        const angle = (Math.PI * 2 * i) / numBurst
        const distance = Math.random() * 30 + 20
        const offsetX = Math.cos(angle) * distance
        const offsetY = Math.sin(angle) * distance
        
        burstParticles.push({
          id: particleId++,
          x: e.clientX + offsetX,
          y: e.clientY + offsetY,
          color: PRISM_COLORS[i % PRISM_COLORS.length],
          delay: i * 0.02,
        })
      }
      
      setParticles((prev) => [...prev, ...burstParticles])
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !burstParticles.find((bp) => bp.id === p.id)))
      }, 1500)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      clearTimeout(moveTimeout)
    }
  }, [enabled])

  return (
    <>
      {/* Render particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fractal-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            background: particle.color,
            boxShadow: `0 0 10px ${particle.color}`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* Custom cursor glow */}
      {isMoving && (
        <div
          className="fixed pointer-events-none z-[9997] transition-all duration-100 ease-out"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: '40px',
            height: '40px',
            marginLeft: '-20px',
            marginTop: '-20px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${PRISM_COLORS[Math.floor(Date.now() / 200) % PRISM_COLORS.length]}40 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
      )}
    </>
  )
}
