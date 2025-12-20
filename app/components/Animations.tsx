'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FadeInViewProps {
  children: ReactNode
  delay?: number
  duration?: number
}

export const FadeInView: React.FC<FadeInViewProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.6 
}) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  )
}

interface SlideInViewProps {
  children: ReactNode
  direction?: 'left' | 'right'
  delay?: number
}

export const SlideInView: React.FC<SlideInViewProps> = ({ 
  children, 
  direction = 'left', 
  delay = 0 
}) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const initialX = direction === 'left' ? -50 : 50

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: initialX }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: initialX }}
      transition={{ delay, duration: 0.6 }}
    >
      {children}
    </motion.div>
  )
}

interface ScaleInViewProps {
  children: ReactNode
  delay?: number
}

export const ScaleInView: React.FC<ScaleInViewProps> = ({ 
  children, 
  delay = 0 
}) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ delay, duration: 0.6 }}
    >
      {children}
    </motion.div>
  )
}

interface ParallaxProps {
  children: ReactNode
  offset?: number
}

export const Parallax: React.FC<ParallaxProps> = ({ children, offset = 50 }) => {
  const { ref, inView } = useInView({ triggerOnce: false })

  return (
    <motion.div
      ref={ref}
      style={{
        y: inView ? offset : 0,
      }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  )
}

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
}
