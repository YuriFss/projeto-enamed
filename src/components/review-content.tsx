'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Question, Specialty } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewItem {
  id: string
  question: Question | null
  selected_answer: string | null
  is_correct: boolean | null
  created_at: string
}

interface ReviewContentProps {
  tab: string
  items: ReviewItem[]
  specialties: Specialty[]
  currentSpecialty?: string
}

const tabs = [
  { value: 'erradas', label: 'Erradas' },
  { value: 'marcadas', label: 'Marcadas' },
  { value: 'todas', label: 'Todas' },
]

export function ReviewContent({ tab, items, specialties, currentSpecialty }: ReviewContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/revisao?${params.toString()}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Revisao</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => updateParam('tab', t.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              tab === t.value ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Specialty filter */}
      <div className="flex gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={currentSpecialty || ''}
          onChange={(e) => updateParam('specialty', e.target.value)}
        >
          <option value="">Todas especialidades</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">
            {tab === 'erradas' && 'Nenhuma questao errada ainda.'}
            {tab === 'marcadas' && 'Nenhuma questao marcada.'}
            {tab === 'todas' && 'Nenhuma questao respondida ainda.'}
          </p>
          <p className="text-sm mt-1">Continue estudando!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            if (!item.question) return null
            const q = item.question
            return (
              <Link key={item.id} href={`/questoes/${q.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {tab === 'marcadas' ? (
                          <Bookmark className="h-5 w-5 text-indigo-500" />
                        ) : item.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm text-muted-foreground">{q.exam?.name} — Q{q.number}</span>
                          <Badge variant="outline" style={{ borderColor: q.specialty?.color, color: q.specialty?.color }}>
                            {q.specialty?.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{q.statement}</p>
                        {item.selected_answer && (
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className={item.is_correct ? 'text-green-600' : 'text-red-600'}>
                              Sua resposta: ({item.selected_answer})
                            </span>
                            {!item.is_correct && (
                              <span className="text-green-600">
                                Correta: ({q.correct_answer})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
