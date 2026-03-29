interface Props {
  expanded: boolean
  onToggle: () => void
}

export function ExpandNotesToggle({ expanded, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
        expanded
          ? 'border-blue-300 bg-blue-50 text-blue-800'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
      title={
        expanded
          ? 'Show shortened notes (click cells to read full text)'
          : 'Expand all note cells to show full text for every row'
      }
    >
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h7"
        />
      </svg>
      {expanded ? 'Collapse notes' : 'Expand notes'}
    </button>
  )
}
