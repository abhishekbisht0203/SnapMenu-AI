import { cn } from './cn';

export function Switch({
  checked,
  onChange,
  label,
  size = 'md',
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const dims = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const travel = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:opacity-50',
        dims,
        checked ? 'bg-brand' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200',
          knob,
          checked ? travel : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
