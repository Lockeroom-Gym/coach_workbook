import { useState, useRef, useEffect } from 'react'

interface Props {
  content: string
  label: string
  expandAll?: boolean
  onSave: (content: string) => void
}

export function NoteCell({ content, label, expandAll = false, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [hovered, setHovered] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(content)
  }, [content])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
      autoResize(textareaRef.current)
    }
  }, [editing])

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.max(120, el.scrollHeight) + 'px'
  }

  function handleSave() {
    setEditing(false)
    if (draft.trim() !== content.trim()) {
      onSave(draft.trim())
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setDraft(content)
      setEditing(false)
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
  }

  if (editing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            autoResize(e.target)
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[120px] rounded-lg border border-blue-300 bg-white p-3 text-sm leading-relaxed text-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
        <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">
          Ctrl+Enter to save / Esc to cancel
        </span>
      </div>
    )
  }

  const isEmpty = !content.trim()

  if (expandAll) {
    return (
      <div
        ref={cellRef}
        className="relative cursor-pointer rounded-lg border border-transparent px-1 py-1 hover:border-gray-200 hover:bg-gray-50/80"
        onClick={() => setEditing(true)}
      >
        {isEmpty ? (
          <span className="text-sm text-gray-400 italic">Click to add {label.toLowerCase()}</span>
        ) : (
          <div className="max-h-80 min-h-[4rem] overflow-y-auto whitespace-pre-wrap text-left text-sm leading-relaxed text-gray-800">
            {content}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={cellRef}
      className="relative group cursor-pointer"
      onClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="truncate max-w-[200px] text-sm text-gray-700 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors">
        {isEmpty ? (
          <span className="text-gray-400 italic">Click to add {label.toLowerCase()}</span>
        ) : (
          content.length > 40 ? content.slice(0, 40) + '...' : content
        )}
      </div>

      {hovered && !isEmpty && (
        <div className="absolute z-40 bottom-full left-0 mb-2 w-72 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl whitespace-pre-wrap">
          <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
          {content}
        </div>
      )}
    </div>
  )
}
