import { getUser } from '@/lib/supabase/get-user'
import { getSpecialties, getTopics } from '@/lib/queries'
import {
  buildQuestionBrowserQueryString,
  getQuestionBankData,
  sanitizeQuestionBrowserFilters,
} from '@/lib/question-browser'
import {
  getQuestionBankFilterChips,
  getQuestionBankFocusLabel,
  getQuestionBankOverview,
} from '@/lib/study-flow'
import { QuestionFilters } from '@/components/question-filters'
import { QuestionList } from '@/components/question-list'

interface SearchParams {
  [key: string]: string | undefined
  year?: string
  type?: string
  specialty?: string
  topic?: string
  difficulty?: string
  status?: string
  search?: string
  sort?: string
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
  const [specialties, topics] = await Promise.all([getSpecialties(), getTopics()])
  const page = parseInt(params.page || '1')
  const filters = sanitizeQuestionBrowserFilters(params)
  const {
    questions,
    totalCount,
    totalPages,
    currentPage,
    years,
    answeredCount,
    unansweredCount,
    sequenceStartQuestionId,
  } = await getQuestionBankData({
    userId: user!.id,
    filters,
    page,
    pageSize: PAGE_SIZE,
  })
  const detailQueryString = buildQuestionBrowserQueryString(params)
  const activeChips = getQuestionBankFilterChips(filters, specialties, topics)
  const overview = getQuestionBankOverview(totalCount, filters)
  const focusLabel = getQuestionBankFocusLabel(filters)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/65 bg-[linear-gradient(140deg,rgba(131,24,67,0.98),rgba(236,72,153,0.88))] text-white shadow-[0_35px_90px_-50px_rgba(219,39,119,0.55)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
              Banco de questoes
            </span>
            <span className="rounded-full border border-white/16 bg-black/12 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
              {focusLabel}
            </span>
          </div>

          <div className="mt-4 max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Monte um fluxo de estudo com contexto, nao uma lista sem direcao.
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
              Filtre o banco, avance para a proxima nao respondida e use o historico para revisar sem perder o recorte escolhido.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Disponiveis</p>
              <p className="mt-2 text-3xl font-semibold">{totalCount}</p>
              <p className="mt-1 text-sm text-white/72">{overview}</p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Recorte ativo</p>
              <p className="mt-2 text-3xl font-semibold">{activeChips.length}</p>
              <p className="mt-1 text-sm text-white/72">
                {activeChips.length > 0 ? 'Filtros aplicados para reduzir ruido e acelerar o foco.' : 'Nenhum filtro ativo no momento.'}
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-black/12 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/62">Ritmo de navegação</p>
              <p className="mt-2 text-3xl font-semibold">{currentPage}</p>
              <p className="mt-1 text-sm text-white/72">
                Pagina atual de um banco preparado para continuar no mesmo contexto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <QuestionFilters
        years={years}
        specialties={specialties}
        topics={topics}
        currentFilters={params}
      />

      <QuestionList
        questions={questions}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        sequenceStartQuestionId={sequenceStartQuestionId}
        detailQueryString={detailQueryString}
        currentStatus={filters.status}
        overview={overview}
        focusLabel={focusLabel}
      />
    </div>
  )
}
