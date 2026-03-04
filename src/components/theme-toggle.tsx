'use client'

import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'

const cycle: Record<string, 'dark' | 'system' | 'light'> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = icons[theme]

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(cycle[theme])}
      title={`Tema: ${theme}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
