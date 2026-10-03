interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

export function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <select
      data-testid={`select-filter-${id}`}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-[180px] rounded-lg border border-input bg-background px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
