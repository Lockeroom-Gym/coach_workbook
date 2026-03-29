import { useState, useRef, useEffect } from 'react'
import type { Coach } from '../types'

interface Props {
  coaches: Coach[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function CoachSelector({ coaches, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const label =
    selectedIds.length === 0
      ? 'Select coaches...'
      : selectedIds.length === 1
        ? coaches.find((c) => c.id === selectedIds[0])?.coach_name ?? 'Unknown'
        : `${selectedIds.length} coaches selected`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 min-w-[200px] justify-between"
      >
        <span className="truncate">{label}</span>
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[240px] rounded-lg border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
          {coaches.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">{c.coach_name ?? `${c.first_name} ${c.last_name ?? ''}`}</span>
              <span className="ml-auto text-xs text-gray-400">{c.role}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
