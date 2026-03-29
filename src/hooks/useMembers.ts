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
  /** True when the primary membership end_date is in the past. */
  isExpired: boolean
}

export function useMembers(
  selectedCoachIds: string[],
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
    const selectCols = `
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
    `

    // Step 1: Fetch only PRIMARY memberships where coach_id or handoff_coach_id
    // is a selected coach. Filtering server-side avoids hitting the Supabase
    // default 1000-row limit that silently truncates unfiltered queries.
    const coachList = selectedCoachIds.join(',')
    let primaryQuery = supabase
      .from('member_memberships')
      .select(selectCols)
      .is('primary_membership_id', null)
      .or(`coach_id.in.(${coachList}),handoff_coach_id.in.(${coachList})`)

    if (gymFilter) {
      primaryQuery = primaryQuery.eq('gym', gymFilter)
    }

    const { data: primaryData, error: primaryError } = await primaryQuery

    if (primaryError) {
      console.error('Error fetching primary memberships:', primaryError)
      setLoading(false)
      return
    }

    const primaryRows = (primaryData ?? []) as unknown as Membership[]

    // Step 2: Keep only members whose effective coach is selected and not no_sale
    const primaryByMember = new Map<string, Membership>()
    for (const row of primaryRows) {
      if (!row.member_id) continue
      if (row.journey_stage === 'no_sale') continue
      const effectiveCoach = row.handoff_coach_id ?? row.coach_id
      if (!effectiveCoach || !selectedCoachIds.includes(effectiveCoach)) continue
      primaryByMember.set(row.member_id, row)
    }

    const qualifiedMemberIds = Array.from(primaryByMember.keys())
    if (qualifiedMemberIds.length === 0) {
      setMembers([])
      setLoading(false)
      return
    }

    // Step 3: Fetch secondary memberships + member names in parallel
    const [secondaryResult, nameResult] = await Promise.all([
      supabase
        .from('member_memberships')
        .select(selectCols)
        .in('member_id', qualifiedMemberIds)
        .not('primary_membership_id', 'is', null),
      supabase
        .from('member_database')
        .select('id, member_name, first_name')
        .in('id', qualifiedMemberIds),
    ])

    if (secondaryResult.error) {
      console.error('Error fetching secondary memberships:', secondaryResult.error)
    }

    const secondaryByMember = new Map<string, Membership[]>()
    for (const row of (secondaryResult.data ?? []) as unknown as Membership[]) {
      if (!row.member_id) continue
      const existing = secondaryByMember.get(row.member_id) ?? []
      existing.push(row)
      secondaryByMember.set(row.member_id, existing)
    }

    const nameMap = new Map<
      string,
      { memberName: string; firstName: string | null }
    >()
    for (const m of nameResult.data ?? []) {
      nameMap.set(m.id, {
        memberName: m.member_name ?? 'Unknown',
        firstName: m.first_name,
      })
    }

    const result: MemberWithMemberships[] = []

    for (const [memberId, primary] of primaryByMember) {
      const secondaries = secondaryByMember.get(memberId) ?? []
      const allMemberships = [primary, ...secondaries]

      const contractedSessions = allMemberships.reduce((sum, m) => {
        const freq = m.membership_types?.session_frequency_per_week ?? 0
        return sum + freq
      }, 0)

      const info = nameMap.get(memberId)
      const memberName = info?.memberName ?? 'Unknown'
      const isExpired = primary.end_date ? primary.end_date <= today : false

      result.push({
        memberId,
        memberName,
        firstNameSortKey: firstNameSortKey(info?.firstName, memberName),
        primaryMembership: primary,
        secondaryMemberships: secondaries,
        contractedSessions,
        membershipExpiry: primary.end_date,
        gym: primary.gym,
        isExpired,
      })
    }

    setMembers(result)
    setLoading(false)
  }, [selectedCoachIds, gymFilter])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return { members, loading, refetch: fetchMembers }
}
