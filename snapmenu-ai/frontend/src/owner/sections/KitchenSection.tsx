import { useEffect, useMemo, useState } from 'react';
import {
  AlarmClock,
  ChefHat,
  CheckCheck,
  Flame,
  RefreshCw,
  Soup,
  Utensils,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SearchBar,
  Segmented,
  Skeleton,
  StatCard,
  StatusBadge,
  cn,
  useToast,
} from '../../ui';
import { friendlyError, type Order, type OrderStatus } from '../../lib/api';
import { elapsed, isToday, money } from '../../lib/format';
import { useOrders, ACTIVE_STATUSES } from '../ordersContext';

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  placed: { to: 'confirmed', label: 'Confirm' },
  confirmed: { to: 'preparing', label: 'Start preparing' },
  preparing: { to: 'ready', label: 'Mark ready' },
  ready: { to: 'served', label: 'Complete' },
};

const COLUMNS: { status: OrderStatus; label: string; icon: typeof Flame }[] = [
  { status: 'placed', label: 'New', icon: AlarmClock },
  { status: 'confirmed', label: 'Confirmed', icon: ChefHat },
  { status: 'preparing', label: 'Preparing', icon: Soup },
  { status: 'ready', label: 'Ready', icon: CheckCheck },
];

type Filter = 'all' | OrderStatus;
type Sort = 'newest' | 'oldest';

function useTick(ms: number) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

export function KitchenSection() {
  const { orders, loading, error, lastSync, refresh, setStatus } = useOrders();
  const toast = useToast();
  useTick(30_000);

  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [query, setQuery] = useState('');
  const [cancelId, setCancelId] = useState<number | null>(null);

  const active = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders],
  );

  const counts = useMemo(() => {
    const by = (s: OrderStatus) => active.filter((o) => o.status === s).length;
    const servedToday = orders.filter((o) => o.status === 'served' && isToday(o.created_at));
    return {
      active: active.length,
      preparing: by('preparing'),
      ready: by('ready'),
      completed: servedToday.length,
      revenue: servedToday.reduce((s, o) => s + o.total_amount, 0),
    };
  }, [active, orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = active.filter((o) => filter === 'all' || o.status === filter);
    if (q) {
      list = list.filter(
        (o) =>
          String(o.id).includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.items.some((i) => i.name?.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) =>
      sort === 'newest'
        ? +new Date(b.created_at) - +new Date(a.created_at)
        : +new Date(a.created_at) - +new Date(b.created_at),
    );
  }, [active, filter, query, sort]);

  const advance = async (o: Order, to: OrderStatus) => {
    try {
      await setStatus(o.id, to);
      toast.success(`Order #${o.id} → ${to}`);
    } catch (e) {
      toast.error(friendlyError(e, 'Could not update the order.'));
      refresh();
    }
  };

  const currency = orders[0]?.currency ?? 'USD';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kitchen"
        description="Every table order, live. New orders appear here automatically."
        actions={
          <div className="flex items-center gap-2 text-xs text-content-subtle">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Live
            </span>
            {lastSync && <span className="hidden sm:inline">· synced {elapsed(new Date(lastSync).toISOString())}</span>}
            <Button variant="ghost" size="icon" onClick={refresh} aria-label="Refresh orders">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Active" value={counts.active} icon={Flame} tone="accent" loading={loading} />
        <StatCard label="Preparing" value={counts.preparing} icon={Soup} tone="warning" loading={loading} />
        <StatCard label="Ready" value={counts.ready} icon={CheckCheck} tone="success" loading={loading} />
        <StatCard label="Completed today" value={counts.completed} icon={Utensils} tone="brand" loading={loading} />
        <StatCard
          label="Revenue today"
          value={money(counts.revenue, currency)}
          icon={Utensils}
          tone="info"
          loading={loading}
          hint="Served orders only"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: active.length },
            { value: 'placed', label: 'New', count: active.filter((o) => o.status === 'placed').length },
            { value: 'preparing', label: 'Preparing', count: counts.preparing },
            { value: 'ready', label: 'Ready', count: counts.ready },
          ]}
        />
        <div className="flex items-center gap-2">
          <SearchBar value={query} onChange={setQuery} placeholder="Search orders" className="flex-1 sm:w-56" />
          <Segmented<Sort>
            value={sort}
            onChange={setSort}
            size="sm"
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
            ]}
          />
        </div>
      </div>

      {error && !loading && (
        <EmptyState
          icon={X}
          tone="danger"
          title="Couldn’t load orders"
          description={error}
          action={<Button variant="secondary" onClick={refresh}>Try again</Button>}
        />
      )}

      {loading && orders.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !error && active.length === 0 && (
        <EmptyState
          icon={ChefHat}
          title="No active orders"
          description="When a diner places an order it lands here instantly — nothing to do right now."
        />
      )}

      {!error && active.length > 0 && (
        <>
          {/* Kanban board — desktop */}
          {filter === 'all' && !query && (
            <div className="hidden gap-4 lg:grid lg:grid-cols-4">
              {COLUMNS.map((col) => {
                const items = visible.filter((o) => o.status === col.status);
                return (
                  <div key={col.status} className="flex min-h-[8rem] flex-col rounded-xl border border-line bg-surface-2/60 p-2">
                    <div className="mb-2 flex items-center gap-2 px-1.5 py-1">
                      <col.icon className="h-4 w-4 text-content-muted" />
                      <span className="text-sm font-semibold text-content">{col.label}</span>
                      <span className="ml-auto rounded bg-surface-3 px-1.5 text-xs font-semibold text-content-muted tabular-nums">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((o) => (
                        <OrderCard
                          key={o.id}
                          order={o}
                          compact
                          onAdvance={advance}
                          onCancel={() => setCancelId(o.id)}
                        />
                      ))}
                      {items.length === 0 && (
                        <p className="px-1.5 py-4 text-center text-xs text-content-subtle">Empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid / list — always on mobile & tablet, and on desktop when filtering */}
          <div
            className={cn(
              'grid gap-4 sm:grid-cols-2',
              filter === 'all' && !query ? 'lg:hidden' : 'lg:grid-cols-3',
            )}
          >
            {visible.map((o) => (
              <OrderCard key={o.id} order={o} onAdvance={advance} onCancel={() => setCancelId(o.id)} />
            ))}
          </div>

          {visible.length === 0 && (
            <p className="py-8 text-center text-sm text-content-subtle">No orders match your filters.</p>
          )}
        </>
      )}

      <ConfirmDialog
        open={cancelId !== null}
        onClose={() => setCancelId(null)}
        title={`Cancel order #${cancelId}?`}
        message="The diner will see this order as cancelled. This can’t be undone."
        confirmLabel="Cancel order"
        onConfirm={async () => {
          const o = orders.find((x) => x.id === cancelId);
          if (o) await advance(o, 'cancelled');
        }}
      />
    </div>
  );
}

function OrderCard({
  order,
  compact,
  onAdvance,
  onCancel,
}: {
  order: Order;
  compact?: boolean;
  onAdvance: (o: Order, to: OrderStatus) => void;
  onCancel: () => void;
}) {
  const next = NEXT[order.status];
  const waited = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const stale = waited >= 15 && (order.status === 'placed' || order.status === 'preparing');

  return (
    <article
      className={cn(
        'flex flex-col rounded-xl border bg-surface p-3.5 shadow-xs transition-shadow hover:shadow-md',
        stale ? 'border-danger/40' : 'border-line',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-content">
            #{order.id}
            <span className="ml-2 font-medium text-content-muted">
              {order.table_id ? `Table ${order.table_id}` : 'Walk-in'}
            </span>
          </p>
          {order.customer_name && (
            <p className="text-xs text-content-subtle">{order.customer_name}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {!compact && <StatusBadge status={order.status} />}
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              stale ? 'text-danger' : 'text-content-subtle',
            )}
          >
            <AlarmClock className="h-3 w-3" />
            {elapsed(order.created_at)}
          </span>
        </div>
      </header>

      <ul className="my-3 space-y-1.5">
        {order.items.map((i) => (
          <li key={i.id} className="text-sm">
            <div className="flex gap-2">
              <span className="font-bold tabular-nums text-brand">{i.quantity}×</span>
              <span className="text-content">{i.name ?? `Item ${i.menu_item_id}`}</span>
            </div>
            {i.notes && (
              <p className="ml-6 mt-0.5 text-xs italic text-content-muted">“{i.notes}”</p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-2.5">
        <span className="text-sm font-semibold text-content">
          {money(order.total_amount, order.currency)}
        </span>
        {order.payment_status === 'paid' && <Badge tone="success">Paid</Badge>}
      </div>

      <div className="mt-2.5 flex gap-2">
        {next && (
          <Button size="sm" fullWidth variant="accent" onClick={() => onAdvance(order, next.to)}>
            {next.label}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          aria-label={`Cancel order ${order.id}`}
          className="text-danger hover:bg-danger-soft"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
