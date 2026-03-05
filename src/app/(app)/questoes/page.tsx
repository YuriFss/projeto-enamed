import { getUser } from '@/lib/supabase/get-user'
import { getSpecialties } from '@/lib/queries'
import {
  buildQuestionBrowserQueryString,
  getQuestionBankData,
  sanitizeQuestionBrowserFilters,
} from '@/lib/question-browser'
import { QuestionFilters } from '@/components/question-filters'
import { QuestionList } from '@/components/question-list'

interface SearchParams {
  [key: string]: string | undefined
  year?: string
  type?: string
  specialty?: string
  difficulty?: string
  status?: string
  page?: string
}

const PAGE_SIZE = 10

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const user = await getUser()
  const specialties = await getSpecialties()
  const page = parseInt(params.page || '1')
  const filters = sanitizeQuestionBrowserFilters(params)
  const { questions, totalCount, totalPages, currentPage, years } = await getQuestionBankData({
    userId: user!.id,
    filters,
    page,
    pageSize: PAGE_SIZE,
  })
  const detailQueryString = buildQuestionBrowserQueryString(params)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Banco de Questoes</h1>

      <QuestionFilters
        years={years}
        specialties={specialties}
        currentFilters={params}
      />

      <QuestionList
        questions={questions}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        detailQueryString={detailQueryString}
        currentStatus={filters.status}
      />
    </div>
  )
}
