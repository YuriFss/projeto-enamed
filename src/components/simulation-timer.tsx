'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface SimulationTimerProps {
  initialSeconds: number
  timeLimitMinutes: number | null
  onTick: (seconds: number) => void
  onTimeUp: () => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function SimulationTimer({ initialSeconds, timeLimitMinutes, onTick, onTimeUp }: SimulationTimerProps) {
  const [elapsed, setElapsed] = useState(initialSeconds)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        onTick(next)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onTick])

  useEffect(() => {
    if (timeLimitMinutes && elapsed >= timeLimitMinutes * 60) {
      onTimeUp()
    }
  }, [elapsed, timeLimitMinutes, onTimeUp])

  const display = timeLimitMinutes
    ? formatTime(Math.max(0, timeLimitMinutes * 60 - elapsed))
    : formatTime(elapsed)

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <Clock className="h-4 w-4" />
      {display}
    </div>
  )
}
