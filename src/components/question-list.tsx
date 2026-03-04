'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Question } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface QuestionListProps {
  questions: Question[]
  currentPage: number
  totalPages: number
  totalCount: number
}

const difficultyColors: Record<string, string> = {
  facil: 'bg-green-100 text-green-800',
  medio: 'bg-yellow-100 text-yellow-800',
  dificil: 'bg-red-100 text-red-800',
}

export function QuestionList({ questions, currentPage, totalPages, totalCount }: QuestionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/questoes?${params.toString()}`)
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Nenhuma questao encontrada.</p>
        <p className="text-sm mt-1">Tente ajustar os filtros.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{totalCount} questoes encontradas</p>

      <div className="space-y-3">
        {questions.map((q) => (
          <Link key={q.id} href={`/questoes/${q.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      {q.exam?.name} — Q{q.number}
                    </span>
                    <Badge variant="outline" style={{ borderColor: q.specialty?.color, color: q.specialty?.color }}>
                      {q.specialty?.name}
                    </Badge>
                    <Badge className={difficultyColors[q.difficulty]}>
                      {q.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {q.statement}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Pagina {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
