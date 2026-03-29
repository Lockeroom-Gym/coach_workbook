interface Props {
  label: string
  expanded: boolean
  onToggle: () => void
}

export function CollapseToggle({ label, expanded, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <svg
        className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      {label}
    </button>
  )
}
