import { createClient } from '@/lib/supabase/server'
import { getExams, getSpecialties } from '@/lib/queries'
import { QuestionFilters } from '@/components/question-filters'
import { QuestionList } from '@/components/question-list'

interface SearchParams {
  [key: string]: string | undefined
  year?: string
  type?: string
  specialty?: string
  difficulty?: string
  page?: string
}

const PAGE_SIZE = 10

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch filter options (cached)
  const [exams, specialties] = await Promise.all([getExams(), getSpecialties()])

  // Build query
  const page = parseInt(params.page || '1')
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('questions')
    .select('*, exam:exams(*), specialty:specialties(*)', { count: 'exact' })
    .order('number')
    .range(from, to)

  if (params.year) {
    const examIds = exams.filter((e) => e.year === parseInt(params.year!)).map((e) => e.id) || []
    if (examIds.length > 0) query = query.in('exam_id', examIds)
  }
  if (params.type) {
    const examIds = exams.filter((e) => e.type === params.type).map((e) => e.id) || []
    if (examIds.length > 0) query = query.in('exam_id', examIds)
  }
  if (params.specialty) {
    query = query.eq('specialty_id', params.specialty)
  }
  if (params.difficulty) {
    query = query.eq('difficulty', params.difficulty)
  }

  const { data: questions, count } = await query

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  // Get unique years
  const years = [...new Set(exams.map((e) => e.year))].sort((a, b) => b - a)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Banco de Questoes</h1>

      <QuestionFilters
        years={years}
        specialties={specialties}
        currentFilters={params}
      />

      <QuestionList
        questions={questions || []}
        currentPage={page}
        totalPages={totalPages}
        totalCount={count || 0}
      />
    </div>
  )
}
