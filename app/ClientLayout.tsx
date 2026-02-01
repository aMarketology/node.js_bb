'use client'

import FractalCursor from './components/FractalCursor'
import { FractalProvider, useFractal } from './contexts/FractalContext'
import { ModeProvider } from './components/ModeToggle'
import { FanCreditProvider } from './contexts/FanCreditContext'
import { L2MarketsProvider } from './contexts/L2MarketsContext'

function FractalController() {
  const { fractalEnabled } = useFractal()
  return <FractalCursor enabled={fractalEnabled} />
}

export function ClientLayout({ children }: { children: React.NodeNode }) {
  return (
    <FractalProvider>
      <ModeProvider>
        <FanCreditProvider>
          <L2MarketsProvider>
            <FractalController />
            {children}
          </L2MarketsProvider>
        </FanCreditProvider>
      </ModeProvider>
    </FractalProvider>
  )
}
