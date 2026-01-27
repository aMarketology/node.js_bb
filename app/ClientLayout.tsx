'use client'

import FractalCursor from './components/FractalCursor'
import { FractalProvider, useFractal } from './contexts/FractalContext'
import { ModeProvider } from './components/ModeToggle'

function FractalController() {
  const { fractalEnabled } = useFractal()
  return <FractalCursor enabled={fractalEnabled} />
}

export function ClientLayout({ children }: { children: React.NodeNode }) {
  return (
    <FractalProvider>
      <ModeProvider>
        <FractalController />
        {children}
      </ModeProvider>
    </FractalProvider>
  )
}
