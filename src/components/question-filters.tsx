'use client'

import { FormEvent, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookmarkPlus,
  Filter,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  addFavorite,
  buildFavoriteQueryString,
  createQuestionFilterFavorite,
  extractFavoriteFilters,
  parseStoredFavorites,
  QUESTION_FILTER_FAVORITES_STORAGE_KEY,
  removeFavorite,
  type QuestionFilterFavorite,
} from '@/lib/question-filter-favorites'
import { Specialty, Topic } from '@/lib/types'
import { getQuestionBankFilterChips } from '@/lib/study-flow'

interface QuestionFiltersProps {
  years: number[]
  specialties: Specialty[]
  topics: Topic[]
  currentFilters: Record<string, string | undefined>
}

function selectClassName() {
  return 'w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary/40'
}

function inputClassName() {
  return 'w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary/40'
}

export function QuestionFilters({
  years,
  specialties,
  topics,
  currentFilters,
}: QuestionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chips = getQuestionBankFilterChips(currentFilters, specialties, topics)
  const [favoriteName, setFavoriteName] = useState('')
  const [favorites, setFavorites] = useState<QuestionFilterFavorite[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    return parseStoredFavorites(
      window.localStorage.getItem(QUESTION_FILTER_FAVORITES_STORAGE_KEY)
    )
  })
  const filteredTopics = currentFilters.specialty
    ? topics.filter((topic) => topic.specialty_id === currentFilters.specialty)
    : topics

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      const queryString = params.toString()
      router.push(queryString ? `/questoes?${queryString}` : '/questoes')
    },
    [router]
  )

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      if (key === 'specialty') {
        params.delete('topic')
      }

      params.delete('page')
      pushParams(params)
    },
    [pushParams, searchParams]
  )

  const clearFilters = useCallback(() => {
    router.push('/questoes')
  }, [router])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    updateFilter('search', String(formData.get('search') || '').trim())
  }

  function saveCurrentFilters() {
    const filters = extractFavoriteFilters(currentFilters)
    if (Object.keys(filters).length === 0) {
      return
    }

    const favorite = createQuestionFilterFavorite({
      label: favoriteName,
      filters,
    })
    const nextFavorites = addFavorite(favorites, favorite)
    setFavorites(nextFavorites)
    window.localStorage.setItem(
      QUESTION_FILTER_FAVORITES_STORAGE_KEY,
      JSON.stringify(nextFavorites)
    )
    setFavoriteName('')
  }

  function applyFavorite(favorite: QuestionFilterFavorite) {
    const queryString = buildFavoriteQueryString(favorite.filters)
    router.push(queryString ? `/questoes?${queryString}` : '/questoes')
  }

  function deleteFavorite(favoriteId: string) {
    const nextFavorites = removeFavorite(favorites, favoriteId)
    setFavorites(nextFavorites)
    window.localStorage.setItem(
      QUESTION_FILTER_FAVORITES_STORAGE_KEY,
      JSON.stringify(nextFavorites)
    )
  }

  const hasFilters = chips.length > 0

  return (
    <section className="mb-6 rounded-[2rem] border border-white/65 bg-white/78 p-4 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-card/82 lg:sticky lg:top-6 lg:z-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#be185d,#f472b6)] text-white shadow-lg">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Recorte de estudo</p>
            <p className="text-sm text-muted-foreground">
              Busque no enunciado, refine por topico e salve combinacoes que valem revisita.
            </p>
          </div>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl">
            <X className="mr-1 h-4 w-4" />
            Limpar tudo
          </Button>
        )}
      </div>

      <form onSubmit={submitSearch} className="mt-4 grid gap-3 xl:grid-cols-[1.4fr,0.9fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            key={currentFilters.search || 'empty-search'}
            name="search"
            className={`${inputClassName()} pl-11`}
            defaultValue={currentFilters.search || ''}
            placeholder="Buscar por trecho do enunciado"
          />
        </div>

        <div className="flex gap-3">
          <select
            className={selectClassName()}
            value={currentFilters.sort || ''}
            onChange={(event) => updateFilter('sort', event.target.value)}
          >
            <option value="">Ordem padrao</option>
            <option value="recent">Mais recentes</option>
            <option value="most_wrong">Mais erradas por voce</option>
            <option value="least_reviewed">Menos revisadas</option>
          </select>
          <Button type="submit" className="rounded-2xl bg-[linear-gradient(145deg,#be185d,#f472b6)] text-white shadow-lg hover:opacity-95">
            Buscar
          </Button>
        </div>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <select
          className={selectClassName()}
          value={currentFilters.type || ''}
          onChange={(event) => updateFilter('type', event.target.value)}
        >
          <option value="">Todas as provas</option>
          <option value="ENARE">ENARE</option>
          <option value="ENAMED">ENAMED</option>
        </select>

        <select
          className={selectClassName()}
          value={currentFilters.year || ''}
          onChange={(event) => updateFilter('year', event.target.value)}
        >
          <option value="">Todos os anos</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          className={selectClassName()}
          value={currentFilters.specialty || ''}
          onChange={(event) => updateFilter('specialty', event.target.value)}
        >
          <option value="">Todas especialidades</option>
          {specialties.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {specialty.name}
            </option>
          ))}
        </select>

        <select
          className={selectClassName()}
          value={currentFilters.topic || ''}
          onChange={(event) => updateFilter('topic', event.target.value)}
        >
          <option value="">Todos os topicos</option>
          {filteredTopics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>

        <select
          className={selectClassName()}
          value={currentFilters.difficulty || ''}
          onChange={(event) => updateFilter('difficulty', event.target.value)}
        >
          <option value="">Todas dificuldades</option>
          <option value="facil">Facil</option>
          <option value="medio">Medio</option>
          <option value="dificil">Dificil</option>
        </select>

        <select
          className={selectClassName()}
          value={currentFilters.status || ''}
          onChange={(event) => updateFilter('status', event.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="unanswered">Nao respondidas</option>
          <option value="answered">Ja respondidas</option>
        </select>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-border/70 bg-background/65 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Recortes favoritos</p>
            <p className="text-sm text-muted-foreground">
              Salve combinacoes de filtros para voltar nelas com um clique.
            </p>
          </div>
          {hasFilters && (
            <div className="flex flex-wrap gap-2">
              <input
                className={inputClassName()}
                value={favoriteName}
                onChange={(event) => setFavoriteName(event.target.value)}
                placeholder="Nome do recorte"
              />
              <Button type="button" variant="outline" className="rounded-2xl" onClick={saveCurrentFilters}>
                <BookmarkPlus className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          )}
        </div>

        {favorites.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white/80 px-2 py-1 dark:bg-card/85"
              >
                <button
                  type="button"
                  onClick={() => applyFavorite(favorite)}
                  className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-foreground"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {favorite.label}
                </button>
                <button
                  type="button"
                  onClick={() => deleteFavorite(favorite.id)}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={`Remover ${favorite.label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum recorte salvo ainda. Monte um filtro e guarde os mais estrategicos.
          </p>
        )}
      </div>

      {hasFilters ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                updateFilter(chip.key, '')
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#db2777]/14 bg-[#db2777]/8 px-3 py-1.5 text-sm text-[#be185d] transition hover:bg-[#db2777]/12"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {chip.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Sem filtros ativos. O banco esta em modo amplo para exploracao.
        </p>
      )}
    </section>
  )
}
