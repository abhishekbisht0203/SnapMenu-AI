import { cn } from './cn';

export type SegmentedOption<T extends string> = { value: T; label: string; count?: number };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-semibold transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[13px]',
              active
                ? 'bg-surface text-content shadow-xs'
                : 'text-content-muted hover:text-content',
            )}
          >
            {o.label}
            {o.count != null && (
              <span
                className={cn(
                  'rounded px-1 text-[11px] tabular-nums',
                  active ? 'bg-surface-3 text-content-muted' : 'text-content-subtle',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
