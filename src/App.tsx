import { useState, useMemo } from 'react'
import type { CollapseState } from './types'
import { useCoaches } from './hooks/useCoaches'
import { useMembers } from './hooks/useMembers'
import { CoachSelector } from './components/CoachSelector'
import { GymFilter } from './components/GymFilter'
import { MemberTable } from './components/MemberTable'

function App() {
  const { coaches, loading: coachesLoading } = useCoaches()
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([])
  const [activeOnly, setActiveOnly] = useState(true)
  const [gymFilter, setGymFilter] = useState<string | null>(null)
  const [collapse, setCollapse] = useState<CollapseState>({
    sessions: false,
    memberships: false,
    goalsHabits: false,
  })
  const [expandAllNotes, setExpandAllNotes] = useState(false)

  const { members, loading: membersLoading } = useMembers(selectedCoachIds, gymFilter)

  const activeCount = useMemo(() => members.filter((m) => !m.isExpired).length, [members])

  function toggleCollapse(key: keyof CollapseState) {
    setCollapse((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Coach Check-in Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Weekly client check-ins and notes
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-4 flex-wrap justify-end">
                {/* Coach Selector */}
                <CoachSelector
                  coaches={coaches}
                  selectedIds={selectedCoachIds}
                  onChange={setSelectedCoachIds}
                />

                {/* Active Only Toggle */}
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      activeOnly ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onClick={() => setActiveOnly(!activeOnly)}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        activeOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                  Active only
                </label>
              </div>

              {/* Client count summary — shown under the coach selector */}
              {selectedCoachIds.length > 0 && !membersLoading && (
                <div className="text-xs text-gray-500 text-right">
                  <span className="font-medium text-gray-700">{activeCount}</span> active clients
                </div>
              )}
            </div>
          </div>

          {/* Second row: Gym filter */}
          {selectedCoachIds.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <GymFilter value={gymFilter} onChange={setGymFilter} />
              {gymFilter && (
                <span className="text-xs text-gray-500">
                  Filtered to {gymFilter}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {coachesLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Loading coaches...
          </div>
        ) : (
          <MemberTable
            members={members}
            selectedCoachIds={selectedCoachIds}
            activeOnly={activeOnly}
            collapse={collapse}
            onToggleCollapse={toggleCollapse}
            expandAllNotes={expandAllNotes}
            onToggleExpandAllNotes={() => setExpandAllNotes((v) => !v)}
            loading={membersLoading}
          />
        )}
      </main>
    </div>
  )
}

export default App
