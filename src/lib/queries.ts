import { cache } from 'react'
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
