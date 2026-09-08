import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { Skeleton } from './Skeleton';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'info' | 'neutral';

const toneStyles: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-3 text-content-muted',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  hint,
  loading,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-content-muted">{label}</span>
        <span className={cn('grid h-8 w-8 place-items-center rounded-lg', toneStyles[tone])}>
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-16" />
      ) : (
        <p className="mt-2 text-2xl font-bold tracking-tight text-content tabular-nums">{value}</p>
      )}
      {hint && !loading && <p className="mt-0.5 text-xs text-content-subtle">{hint}</p>}
    </div>
  );
}
