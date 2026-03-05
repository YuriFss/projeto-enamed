import type { QuestionBankSort } from './types'

export interface FavoriteQuestionFilters {
  type?: string
  year?: string
  specialty?: string
  difficulty?: string
  status?: string
  topic?: string
  search?: string
  sort?: QuestionBankSort
}

export interface QuestionFilterFavorite {
  id: string
  label: string
  filters: FavoriteQuestionFilters
  createdAt: string
}

const FAVORITE_KEYS = [
  'type',
  'year',
  'specialty',
  'difficulty',
  'status',
  'topic',
  'search',
  'sort',
] as const

export const QUESTION_FILTER_FAVORITES_STORAGE_KEY = 'question-bank-favorites'

function isQuestionBankSort(value: string): value is QuestionBankSort {
  return value === 'recent' || value === 'most_wrong' || value === 'least_reviewed'
}

export function extractFavoriteFilters(
  params: Record<string, string | undefined>
): FavoriteQuestionFilters {
  const filters: FavoriteQuestionFilters = {}

  FAVORITE_KEYS.forEach((key) => {
    const value = params[key]
    if (value) {
      if (key === 'sort') {
        if (isQuestionBankSort(value)) {
          filters.sort = value
        }
        return
      }

      filters[key] = value
    }
  })

  return filters
}

export function buildFavoriteQueryString(filters: FavoriteQuestionFilters) {
  const searchParams = new URLSearchParams()

  FAVORITE_KEYS.forEach((key) => {
    const value = filters[key]
    if (value) {
      searchParams.set(key, value)
    }
  })

  return searchParams.toString()
}

export function getDefaultFavoriteLabel(filters: FavoriteQuestionFilters) {
  const parts = [filters.search, filters.specialty, filters.topic, filters.type, filters.year].filter(
    Boolean
  )

  if (parts.length === 0) {
    return 'Recorte favorito'
  }

  return String(parts[0]).slice(0, 36)
}

export function createQuestionFilterFavorite(args: {
  label?: string
  filters: FavoriteQuestionFilters
  now?: Date
}) {
  const now = args.now || new Date()
  const label = args.label?.trim() || getDefaultFavoriteLabel(args.filters)
  const id = `${now.getTime()}-${label.toLowerCase().replace(/\s+/g, '-')}`

  return {
    id,
    label,
    filters: args.filters,
    createdAt: now.toISOString(),
  } satisfies QuestionFilterFavorite
}

export function addFavorite(
  favorites: QuestionFilterFavorite[],
  favorite: QuestionFilterFavorite,
  maxFavorites = 8
) {
  const withoutDuplicate = favorites.filter((item) => item.label !== favorite.label)
  return [favorite, ...withoutDuplicate].slice(0, maxFavorites)
}

export function removeFavorite(favorites: QuestionFilterFavorite[], favoriteId: string) {
  return favorites.filter((favorite) => favorite.id !== favoriteId)
}

export function parseStoredFavorites(value: string | null): QuestionFilterFavorite[] {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is QuestionFilterFavorite => {
      return (
        typeof item?.id === 'string' &&
        typeof item?.label === 'string' &&
        typeof item?.createdAt === 'string' &&
        typeof item?.filters === 'object' &&
        item.filters !== null
      )
    })
  } catch {
    return []
  }
}
