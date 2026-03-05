import { cache } from 'react'
import { Topic } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

export const getExams = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.from('exams').select('*').order('year', { ascending: false })
  return data || []
})

export const getSpecialties = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.from('specialties').select('*').order('name')
  return data || []
})

export const getTopics = cache(async (): Promise<Topic[]> => {
  const supabase = await createClient()
  const { data } = await supabase.from('topics').select('*').order('name')
  return data || []
})
