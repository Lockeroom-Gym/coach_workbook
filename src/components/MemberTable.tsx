import { useState, useMemo, type ReactNode } from 'react'
import type { CollapseState } from '../types'
import type { MemberWithMemberships } from '../hooks/useMembers'
import {
  sortMembersList,
  type SortColumn,
  type SortDirection,
} from '../lib/memberSort'
import { CollapseToggle } from './CollapseToggle'
import { ExpandNotesToggle } from './ExpandNotesToggle'
import { MemberRow } from './MemberRow'
import { useNotes } from '../hooks/useNotes'
import { useSessions } from '../hooks/useSessions'

interface Props {
  members: MemberWithMemberships[]
  selectedCoachIds: string[]
  collapse: CollapseState
  onToggleCollapse: (key: keyof CollapseState) => void
  expandAllNotes: boolean
  onToggleExpandAllNotes: () => void
  loading: boolean
}

export function MemberTable({
  members,
  selectedCoachIds,
  collapse,
  onToggleCollapse,
  expandAllNotes,
  onToggleExpandAllNotes,
  loading,
}: Props) {
  const memberIds = useMemo(() => members.map((m) => m.memberId), [members])

  const {
    notesMap,
    updateNote,
    createNote,
    catalogAndCreate,
    createAndCheckin,
    toggleCheckin,
    clearAllCheckins,
  } = useNotes(memberIds, selectedCoachIds)

  const { statsMap, monthFullWeeks } = useSessions(memberIds)

  const [sortColumn, setSortColumn] = useState<SortColumn | null>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const sortedMembers = useMemo(
    () =>
      sortMembersList(
        members,
        sortColumn,
        sortDir,
        statsMap,
        notesMap,
        monthFullWeeks
      ),
    [members, sortColumn, sortDir, statsMap, notesMap, monthFullWeeks]
  )

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDir('asc')
    }
  }

  const personalNoteIds = useMemo(() => {
    const ids: string[] = []
    for (const m of members) {
      const memberNotes = notesMap.get(m.memberId)
      const pn = memberNotes?.get('general notes')
      if (pn) ids.push(pn.id)
    }
    return ids
  }, [members, notesMap])

  function handleClearAll() {
    clearAllCheckins(personalNoteIds)
  }

  if (selectedCoachIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Select one or more coaches to view their clients
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading members...
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No members found for the selected filters
      </div>
    )
  }

  return (
    <div>
      {/* Collapse toggles and clear button */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <CollapseToggle
          label="Sessions"
          expanded={collapse.sessions}
          onToggle={() => onToggleCollapse('sessions')}
        />
        <CollapseToggle
          label="Memberships"
          expanded={collapse.memberships}
          onToggle={() => onToggleCollapse('memberships')}
        />
        <CollapseToggle
          label="Goals & Habits"
          expanded={collapse.goalsHabits}
          onToggle={() => onToggleCollapse('goalsHabits')}
        />
        <ExpandNotesToggle expanded={expandAllNotes} onToggle={onToggleExpandAllNotes} />
        <div className="ml-auto flex items-center gap-2">
          <ClearAllButton onClear={handleClearAll} count={members.length} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <SortableTh
                column="name"
                sortColumn={sortColumn}
                sortDir={sortDir}
                onSort={handleSort}
                align="left"
                sticky
                title="Sort by first name (uses first_name when set, otherwise first word of name)"
              >
                Name
              </SortableTh>
              <SortableTh
                column="sessWk"
                sortColumn={sortColumn}
                sortDir={sortDir}
                onSort={handleSort}
                align="center"
              >
                Sess/wk
              </SortableTh>
              {collapse.sessions && (
                <>
                  <SortableTh
                    column="lastWk"
                    sortColumn={sortColumn}
                    sortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  >
                    Last wk
                  </SortableTh>
                  <SortableTh
                    column="pctLastWk"
                    sortColumn={sortColumn}
                    sortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                    className="max-w-[7rem]"
                    title="Last week: sessions attended ÷ contracted sessions per week"
                  >
                    % Last wk
                  </SortableTh>
                  <SortableTh
                    column="monthPct"
                    sortColumn={sortColumn}
                    sortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                    className="max-w-[7rem]"
                    title="Previous calendar month vs contracted × weeks in that month"
                  >
                    Month %
                  </SortableTh>
                </>
              )}
              {collapse.memberships && (
                <>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Primary
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Secondary
                  </th>
                </>
              )}
              <th
                className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-help"
                title="these notes stay private on this page"
              >
                Personal Notes
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-help"
                title="these notes will be displayed to coaches on the floor"
              >
                Team Notes
              </th>
              {collapse.goalsHabits && (
                <>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Goals
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Habits
                  </th>
                </>
              )}
              <SortableTh
                column="expiry"
                sortColumn={sortColumn}
                sortDir={sortDir}
                onSort={handleSort}
                align="left"
              >
                Expiry
              </SortableTh>
              <SortableTh
                column="checkin"
                sortColumn={sortColumn}
                sortDir={sortDir}
                onSort={handleSort}
                align="center"
              >
                Check-in
              </SortableTh>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((m) => {
              const memberNotes = notesMap.get(m.memberId)
              const effectiveCoachId =
                m.primaryMembership?.handoff_coach_id ??
                m.primaryMembership?.coach_id ??
                selectedCoachIds[0]

              return (
                <MemberRow
                  key={m.memberId}
                  member={m}
                  personalNote={memberNotes?.get('general notes') ?? null}
                  teamNote={memberNotes?.get('team') ?? null}
                  latestGoal={memberNotes?.get('goal') ?? null}
                  latestHabits={memberNotes?.get('habits') ?? null}
                  sessionStats={statsMap.get(m.memberId) ?? null}
                  monthFullWeeks={monthFullWeeks}
                  collapse={collapse}
                  onUpdateNote={updateNote}
                  onCreateNote={createNote}
                  onCatalogNote={catalogAndCreate}
                  onToggleCheckin={toggleCheckin}
                  onCreateAndCheckin={createAndCheckin}
                  effectiveCoachId={effectiveCoachId}
                  expandAllNotes={expandAllNotes}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-right">
        {members.length} member{members.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

function SortableTh({
  column,
  sortColumn,
  sortDir,
  onSort,
  align,
  className = '',
  title,
  sticky = false,
  children,
}: {
  column: SortColumn
  sortColumn: SortColumn | null
  sortDir: SortDirection
  onSort: (c: SortColumn) => void
  align: 'left' | 'center'
  className?: string
  title?: string
  sticky?: boolean
  children: ReactNode
}) {
  const active = sortColumn === column
  const justify = align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <th
      className={`px-4 py-3 text-xs uppercase tracking-wider ${className} ${
        align === 'center' ? 'text-center' : 'text-left'
      } ${sticky ? 'sticky left-0 z-10 bg-gray-50' : ''}`}
      title={title}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`group inline-flex w-full items-center gap-1 font-semibold transition-colors hover:text-gray-800 ${justify} ${
          active ? 'text-blue-700' : 'text-gray-500'
        }`}
      >
        <span>{children}</span>
        <span
          className="shrink-0 text-[10px] leading-none opacity-70 group-hover:opacity-100"
          aria-hidden
        >
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  )
}

function ClearAllButton({ onClear, count }: { onClear: () => void; count: number }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onClear()
              setConfirming(false)
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            Confirm clear ({count})
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Clear all check-ins
        </button>
      )}
    </>
  )
}

