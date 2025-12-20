'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  rating: number
  image?: string
}

interface TestimonialsCarouselProps {
  testimonials?: Testimonial[]
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  testimonials = [
    {
      id: 1,
      name: 'John Smith',
      role: 'Homeowner',
      content: 'Amazing work! My garage looks completely transformed. The team was professional and efficient.',
      rating: 5,
      image: '👨‍💼',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Business Owner',
      content: 'Best concrete coating service in Tampa Bay. Highly recommended for commercial spaces.',
      rating: 5,
      image: '👩‍💼',
    },
    {
      id: 3,
      name: 'Mike Davis',
      role: 'Homeowner',
      content: 'Excellent customer service and superior quality. Worth every penny!',
      rating: 5,
      image: '👨‍🔧',
    },
    {
      id: 4,
      name: 'Emily Rodriguez',
      role: 'Property Manager',
      content: 'Professional team, on-time delivery, and fantastic results. Highly satisfied!',
      rating: 5,
      image: '👩‍💼',
    },
  ],
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex(
      (prev) => (prev + newDirection + testimonials.length) % testimonials.length
    )
  }

  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000)
    return () => clearInterval(timer)
  }, [])

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative h-80 flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 },
            }}
            className="absolute w-full"
          >
            <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-orange-500">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{currentTestimonial.image}</div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900">
                    {currentTestimonial.name}
                  </h4>
                  <p className="text-sm text-orange-500 font-semibold">
                    {currentTestimonial.role}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-600 text-lg leading-relaxed italic">
                "{currentTestimonial.content}"
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-0 z-10 -translate-x-12 md:-translate-x-16 w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition shadow-lg"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => paginate(1)}
          className="absolute right-0 z-10 translate-x-12 md:translate-x-16 w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition shadow-lg"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`w-3 h-3 rounded-full transition ${
              index === currentIndex ? 'bg-orange-500' : 'bg-gray-300'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>
  )
}
