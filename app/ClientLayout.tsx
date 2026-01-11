'use client'

import FractalCursor from './components/FractalCursor'
import { FractalProvider, useFractal } from './contexts/FractalContext'

function FractalController() {
  const { fractalEnabled } = useFractal()
  return <FractalCursor enabled={fractalEnabled} />
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <FractalProvider>
      <FractalController />
      {children}
    </FractalProvider>
  )
}
