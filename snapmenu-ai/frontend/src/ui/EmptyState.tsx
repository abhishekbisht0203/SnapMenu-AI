import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center',
        className,
      )}
    >
      <div
        className={cn(
          'mb-4 grid h-12 w-12 place-items-center rounded-xl',
          tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-surface-3 text-content-subtle',
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="text-sm font-semibold text-content">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-content-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
