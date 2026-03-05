import type { Specialty, Topic } from './types'

export interface StudyFlowFilters {
  type?: string
  year?: string
  specialty?: string
  topic?: string
  difficulty?: string
  status?: string
  search?: string
  sort?: string
}

export interface FilterChip {
  key: keyof StudyFlowFilters
  label: string
}

const difficultyLabels: Record<string, string> = {
  facil: 'Dificuldade: Facil',
  medio: 'Dificuldade: Medio',
  dificil: 'Dificuldade: Dificil',
}

const statusLabels: Record<string, string> = {
  unanswered: 'Status: Nao respondidas',
  answered: 'Status: Ja respondidas',
}

const sortLabels: Record<string, string> = {
  recent: 'Ordenacao: Mais recentes',
  most_wrong: 'Ordenacao: Mais erradas',
  least_reviewed: 'Ordenacao: Menos revisadas',
}

export function getQuestionBankFilterChips(
  filters: StudyFlowFilters,
  specialties: Specialty[],
  topics: Topic[] = []
): FilterChip[] {
  const chips: FilterChip[] = []

  if (filters.type) {
    chips.push({ key: 'type', label: `Prova: ${filters.type}` })
  }

  if (filters.year) {
    chips.push({ key: 'year', label: `Ano: ${filters.year}` })
  }

  if (filters.specialty) {
    const specialty = specialties.find((item) => item.id === filters.specialty)
    chips.push({
      key: 'specialty',
      label: `Especialidade: ${specialty?.name || 'Selecionada'}`,
    })
  }

  if (filters.topic) {
    const topic = topics.find((item) => item.id === filters.topic)
    chips.push({
      key: 'topic',
      label: `Topico: ${topic?.name || 'Selecionado'}`,
    })
  }

  if (filters.difficulty && difficultyLabels[filters.difficulty]) {
    chips.push({ key: 'difficulty', label: difficultyLabels[filters.difficulty] })
  }

  if (filters.status && statusLabels[filters.status]) {
    chips.push({ key: 'status', label: statusLabels[filters.status] })
  }

  if (filters.search) {
    chips.push({ key: 'search', label: `Busca: ${filters.search}` })
  }

  if (filters.sort && sortLabels[filters.sort]) {
    chips.push({ key: 'sort', label: sortLabels[filters.sort] })
  }

  return chips
}

export function getQuestionBankOverview(totalCount: number, filters: StudyFlowFilters): string {
  if (totalCount === 0) {
    return 'Nenhuma questao encontrada para o recorte atual.'
  }

  if (filters.search) {
    return `${totalCount} questoes encontradas para "${filters.search}".`
  }

  if (filters.status === 'answered') {
    return `${totalCount} questoes prontas para revisao no recorte atual.`
  }

  if (filters.status === 'unanswered') {
    return `${totalCount} questoes novas para avancar sem repetir.`
  }

  return `${totalCount} questoes disponiveis neste recorte de estudo.`
}

export function getQuestionBankFocusLabel(filters: StudyFlowFilters): string {
  if (filters.status === 'answered') return 'Modo revisao'
  if (filters.status === 'unanswered') return 'Modo progresso'
  return 'Modo exploracao'
}

export function getReviewTabMeta(tab: string) {
  if (tab === 'marcadas') {
    return {
      title: 'Revisar o que voce marcou',
      description: 'Volte aos pontos que voce separou como importantes, duvidosos ou estrategicos.',
    }
  }

  if (tab === 'todas') {
    return {
      title: 'Historico de respostas',
      description: 'Retome questoes respondidas para consolidar memoria e acompanhar estabilidade.',
    }
  }

  return {
    title: 'Corrigir pontos fracos',
    description: 'Revise erros recentes sem spoiler antes da nova tentativa e recupere pontos rapidamente.',
  }
}

export function getReviewReason(tab: string, createdAt: string): string {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(createdAt))

  if (tab === 'marcadas') {
    return `Marcada para revisitar desde ${formattedDate}`
  }

  if (tab === 'todas') {
    return `Respondida em ${formattedDate}`
  }

  return `Ultimo erro registrado em ${formattedDate}`
}
