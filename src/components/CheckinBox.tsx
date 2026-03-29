interface Props {
  checked: boolean
  onChange: () => void
}

export function CheckinBox({ checked, onChange }: Props) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
    />
  )
}
