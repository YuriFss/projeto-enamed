'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Specialty } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface QuestionFiltersProps {
  years: number[]
  specialties: Specialty[]
  currentFilters: Record<string, string | undefined>
}

export function QuestionFilters({ years, specialties, currentFilters }: QuestionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/questoes?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = () => {
    router.push('/questoes')
  }

  const hasFilters = Object.values(currentFilters).some((v) => v && v !== '1')

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <select
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        value={currentFilters.type || ''}
        onChange={(e) => updateFilter('type', e.target.value)}
      >
        <option value="">Todas as provas</option>
        <option value="ENARE">ENARE</option>
        <option value="ENAMED">ENAMED</option>
      </select>

      <select
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        value={currentFilters.year || ''}
        onChange={(e) => updateFilter('year', e.target.value)}
      >
        <option value="">Todos os anos</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        value={currentFilters.specialty || ''}
        onChange={(e) => updateFilter('specialty', e.target.value)}
      >
        <option value="">Todas especialidades</option>
        {specialties.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <select
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        value={currentFilters.difficulty || ''}
        onChange={(e) => updateFilter('difficulty', e.target.value)}
      >
        <option value="">Todas dificuldades</option>
        <option value="facil">Facil</option>
        <option value="medio">Medio</option>
        <option value="dificil">Dificil</option>
      </select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
