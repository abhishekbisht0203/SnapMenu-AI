import { Search, X } from 'lucide-react';
import { cn } from './cn';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-sm text-content shadow-xs',
          'placeholder:text-content-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-content-subtle hover:bg-surface-2 hover:text-content"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
