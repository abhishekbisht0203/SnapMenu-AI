import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-content-muted',
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function Badge({
  tone = 'neutral',
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const ORDER_STATUS: Record<string, { tone: Tone; label: string }> = {
  placed: { tone: 'neutral', label: 'New' },
  confirmed: { tone: 'info', label: 'Confirmed' },
  preparing: { tone: 'warning', label: 'Preparing' },
  ready: { tone: 'success', label: 'Ready' },
  served: { tone: 'success', label: 'Served' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS[status] ?? { tone: 'neutral' as Tone, label: status };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
