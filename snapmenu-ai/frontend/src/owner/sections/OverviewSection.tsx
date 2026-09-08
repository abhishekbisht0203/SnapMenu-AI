import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  Flame,
  QrCode,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Trophy,
  Utensils,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  cn,
} from '../../ui';
import { ownerApi, type Restaurant } from '../../lib/api';
import { elapsed, isToday, money } from '../../lib/format';
import { useOrders } from '../ordersContext';
import type { SectionKey } from '../nav';

export function OverviewSection({
  isOwner,
  restaurant,
  onNavigate,
  activeCount,
}: {
  isOwner: boolean;
  restaurant: Restaurant | null;
  onNavigate: (s: SectionKey) => void;
  activeCount: number;
}) {
  const { orders, loading } = useOrders();
  const [counts, setCounts] = useState<{ items: number | null; tables: number | null }>({
    items: null,
    tables: null,
  });

  useEffect(() => {
    ownerApi
      .get('/categories')
      .then((r) =>
        setCounts((c) => ({
          ...c,
          items: (r.data.data as { items: unknown[] }[]).reduce((n, cat) => n + cat.items.length, 0),
        })),
      )
      .catch(() => {});
    if (isOwner) {
      ownerApi
        .get('/tables')
        .then((r) => setCounts((c) => ({ ...c, tables: r.data.data.length })))
        .catch(() => {});
    }
  }, [isOwner]);

  const today = useMemo(() => {
    const todays = orders.filter((o) => isToday(o.created_at));
    const served = todays.filter((o) => o.status === 'served');
    return {
      count: todays.length,
      revenue: served.reduce((s, o) => s + o.total_amount, 0),
      currency: orders[0]?.currency ?? 'USD',
    };
  }, [orders]);

  const popular = useMemo(() => {
    const tally = new Map<string, { name: string; qty: number; revenue: number }>();
    orders
      .filter((o) => isToday(o.created_at) && o.status !== 'cancelled')
      .forEach((o) =>
        o.items.forEach((i) => {
          const key = i.name ?? `Item ${i.menu_item_id}`;
          const cur = tally.get(key) ?? { name: key, qty: 0, revenue: 0 };
          cur.qty += i.quantity;
          cur.revenue += i.quantity * i.unit_price;
          tally.set(key, cur);
        }),
      );
    return [...tally.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 6),
    [orders],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={restaurant ? restaurant.name : 'Overview'}
        description="Today at a glance."
        actions={
          restaurant && (
            <Badge tone={restaurant.subscription_status === 'active' ? 'success' : 'warning'}>
              {restaurant.subscription_status === 'active' ? 'Active plan' : 'Trial'}
            </Badge>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Orders today" value={today.count} icon={ReceiptText} tone="brand" loading={loading} />
        <StatCard
          label="Revenue today"
          value={money(today.revenue, today.currency)}
          icon={TrendingUp}
          tone="success"
          loading={loading}
          hint="Served orders"
        />
        <StatCard label="Active now" value={activeCount} icon={Flame} tone="accent" loading={loading} />
        <StatCard
          label="Menu items"
          value={counts.items ?? '—'}
          icon={Utensils}
          tone="info"
          loading={counts.items === null}
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          icon={Flame}
          title="Open kitchen board"
          desc={activeCount > 0 ? `${activeCount} order${activeCount === 1 ? '' : 's'} in progress` : 'All caught up'}
          onClick={() => onNavigate('kitchen')}
        />
        {isOwner && (
          <QuickAction
            icon={Sparkles}
            title="Import a menu"
            desc="Turn a photo into a digital menu"
            onClick={() => onNavigate('import')}
          />
        )}
        {isOwner && (
          <QuickAction
            icon={QrCode}
            title="Manage tables"
            desc={counts.tables != null ? `${counts.tables} table${counts.tables === 1 ? '' : 's'}` : 'QR ordering pages'}
            onClick={() => onNavigate('tables')}
          />
        )}
        {!isOwner && (
          <QuickAction
            icon={BookOpenText}
            title="View the menu"
            desc={counts.items != null ? `${counts.items} items` : 'Browse dishes'}
            onClick={() => onNavigate('menu')}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent orders */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="text-sm font-semibold text-content">Recent orders</h2>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('kitchen')}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          {recent.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={ReceiptText}
                title="No orders yet"
                description="Orders placed from a table QR code will show up here."
                className="border-0 py-8"
              />
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <span className="text-sm font-bold text-content">#{o.id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-content">
                      {o.items.reduce((n, i) => n + i.quantity, 0)} items
                      {o.customer_name ? ` · ${o.customer_name}` : ''}
                    </p>
                    <p className="text-xs text-content-subtle">{elapsed(o.created_at)} ago</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-content">
                    {money(o.total_amount, o.currency)}
                  </span>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Popular today */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-content">
              <Trophy className="h-4 w-4 text-accent" /> Popular today
            </h2>
          </CardHeader>
          {popular.length === 0 ? (
            <CardBody>
              <p className="py-6 text-center text-sm text-content-subtle">
                No sales yet today.
              </p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {popular.map((p, idx) => (
                <li key={p.name} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-md text-xs font-bold',
                      idx === 0 ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-content-muted',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-content">{p.name}</span>
                  <span className="text-xs text-content-subtle">×{p.qty}</span>
                  <span className="text-sm font-semibold tabular-nums text-content">
                    {money(p.revenue, today.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: typeof Flame;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-left shadow-xs transition-all hover:border-line-strong hover:shadow-md"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-content">{title}</span>
        <span className="block truncate text-xs text-content-muted">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
