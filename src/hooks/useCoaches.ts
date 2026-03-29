import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Coach } from '../types'

const COACHING_ROLES = [
  'Coach',
  'Advanced Coach',
  'Senior Coach',
  'Gym Manager',
  'Head of Exercise',
]

export function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('staff_database')
        .select('id, first_name, last_name, coach_name, role, staff_status, home_gym')
        .in('role', COACHING_ROLES)
        .eq('staff_status', 'active')
        .order('first_name')

      if (error) {
        console.error('Error fetching coaches:', error)
      } else {
        setCoaches(data ?? [])
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return { coaches, loading }
}
