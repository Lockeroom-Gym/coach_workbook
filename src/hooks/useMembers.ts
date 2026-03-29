import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Membership } from '../types'

/** Lowercase key for sorting: `first_name` when set, else first word of `member_name`. */
export function firstNameSortKey(
  firstName: string | null | undefined,
  memberName: string
): string {
  const f = firstName?.trim()
  if (f) return f.toLocaleLowerCase()
  const token = memberName.trim().split(/\s+/)[0] ?? ''
  return token.toLocaleLowerCase()
}

export interface MemberWithMemberships {
  memberId: string
  memberName: string
  /** For default / Name-column sort (first name, case-insensitive). */
  firstNameSortKey: string
  primaryMembership: Membership | null
  secondaryMemberships: Membership[]
  contractedSessions: number
  membershipExpiry: string | null
  gym: string | null
}

export function useMembers(
  selectedCoachIds: string[],
  activeOnly: boolean,
  gymFilter: string | null
) {
  const [members, setMembers] = useState<MemberWithMemberships[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (selectedCoachIds.length === 0) {
      setMembers([])
      return
    }
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('member_memberships')
      .select(`
        id,
        member_id,
        membership_type_id,
        start_date,
        end_date,
        status,
        coach_id,
        handoff_coach_id,
        primary_membership_id,
        gym,
        journey_stage,
        membership_types (
          id,
          name,
          session_frequency_per_week,
          category
        )
      `)
      .neq('journey_stage', 'no_sale')

    if (activeOnly) {
      query = query.gte('end_date', today)
    }

    if (gymFilter) {
      query = query.eq('gym', gymFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching memberships:', error)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as Membership[]

    // Group by member and filter by effective coach
    const memberMap = new Map<string, Membership[]>()

    for (const row of rows) {
      const effectiveCoach = row.handoff_coach_id ?? row.coach_id
      if (!effectiveCoach || !selectedCoachIds.includes(effectiveCoach)) continue
      if (!row.member_id) continue

      const existing = memberMap.get(row.member_id) ?? []
      existing.push(row)
      memberMap.set(row.member_id, existing)
    }

    // Fetch member names
    const memberIds = Array.from(memberMap.keys())
    if (memberIds.length === 0) {
      setMembers([])
      setLoading(false)
      return
    }

    const { data: memberData } = await supabase
      .from('member_database')
      .select('id, member_name, first_name')
      .in('id', memberIds)

    const nameMap = new Map<
      string,
      { memberName: string; firstName: string | null }
    >()
    for (const m of memberData ?? []) {
      nameMap.set(m.id, {
        memberName: m.member_name ?? 'Unknown',
        firstName: m.first_name,
      })
    }

    const result: MemberWithMemberships[] = []

    for (const [memberId, memberships] of memberMap) {
      const primary = memberships.find((m) => m.primary_membership_id === null) ?? null
      const secondaries = memberships.filter((m) => m.primary_membership_id !== null)

      // Only include if they have a primary membership
      if (!primary) continue

      const contractedSessions = memberships.reduce((sum, m) => {
        const freq = m.membership_types?.session_frequency_per_week ?? 0
        return sum + freq
      }, 0)

      const info = nameMap.get(memberId)
      const memberName = info?.memberName ?? 'Unknown'
      result.push({
        memberId,
        memberName,
        firstNameSortKey: firstNameSortKey(info?.firstName, memberName),
        primaryMembership: primary,
        secondaryMemberships: secondaries,
        contractedSessions,
        membershipExpiry: primary.end_date,
        gym: primary.gym,
      })
    }

    setMembers(result)
    setLoading(false)
  }, [selectedCoachIds, activeOnly, gymFilter])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return { members, loading, refetch: fetchMembers }
}
