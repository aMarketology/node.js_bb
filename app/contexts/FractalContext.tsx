'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface FractalContextType {
  fractalEnabled: boolean
  setFractalEnabled: (enabled: boolean) => void
}

const FractalContext = createContext<FractalContextType | undefined>(undefined)

export function FractalProvider({ children }: { children: ReactNode }) {
  const [fractalEnabled, setFractalEnabled] = useState(true)

  return (
    <FractalContext.Provider value={{ fractalEnabled, setFractalEnabled }}>
      {children}
    </FractalContext.Provider>
  )
}

export function useFractal() {
  const context = useContext(FractalContext)
  if (context === undefined) {
    throw new Error('useFractal must be used within a FractalProvider')
  }
  return context
}
