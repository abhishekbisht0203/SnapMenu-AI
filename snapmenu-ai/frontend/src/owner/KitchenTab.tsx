import { useEffect, useState } from 'react';
import { ownerApi, type Order } from '../lib/api';

const NEXT: Record<string, string> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const STATUS_STYLE: Record<string, string> = {
  placed: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready: 'bg-emerald-100 text-emerald-700',
};

function minutesAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return m <= 0 ? 'just now' : `${m}m ago`;
}

export function KitchenTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    ownerApi.get('/kitchen/orders?active=1').then((r) => {
      setOrders(r.data.data);
      setLoaded(true);
    });

  useEffect(() => {
    load();
    // Polling fallback. In production the kitchen subscribes to the private
    // `restaurant.{id}` channel and updates arrive instantly via Reverb.
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const advance = async (o: Order, status: string) => {
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status } : x)));
    await ownerApi.patch(`/kitchen/orders/${o.id}/status`, { status });
    load();
  };

  if (loaded && orders.length === 0)
    return (
      <div className="card grid place-items-center px-6 py-20 text-center">
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">
          🍳
        </div>
        <p className="font-semibold text-ink">All caught up</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          New orders appear here automatically the moment a diner places them.
        </p>
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-sm font-semibold text-slate-500">
          {orders.length} active order{orders.length === 1 ? '' : 's'} · live
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => (
          <div key={o.id} className="card flex flex-col p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">#{o.id}</span>
              <span className={`chip ${STATUS_STYLE[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {o.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {o.customer_name ? `${o.customer_name} · ` : ''}
              {minutesAgo(o.created_at)}
            </p>

            <ul className="my-3 flex-1 space-y-1 text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex gap-2">
                  <span className="font-bold text-brand-700">{i.quantity}×</span>
                  <span className="text-ink">{i.name ?? `Item ${i.id}`}</span>
                </li>
              ))}
            </ul>

            <p className="mb-3 text-sm font-bold text-ink">${o.total_amount.toFixed(2)}</p>

            <div className="flex gap-2">
              {NEXT[o.status] && (
                <button onClick={() => advance(o, NEXT[o.status])} className="btn-accent flex-1 !py-2">
                  Mark {NEXT[o.status]}
                </button>
              )}
              <button
                onClick={() => advance(o, 'cancelled')}
                className="btn-ghost !px-3 !py-2 text-red-500 hover:!bg-red-50"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
