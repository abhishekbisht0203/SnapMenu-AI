import { useEffect, useState } from 'react';
import { ownerApi, type Order } from '../lib/api';

const NEXT: Record<string, string> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

export function KitchenTab() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => ownerApi.get('/kitchen/orders?active=1').then((r) => setOrders(r.data.data));
  useEffect(() => {
    load();
    // Polling fallback. In production the kitchen subscribes to the private
    // `restaurant.{id}` channel and orders/updates arrive instantly via Reverb.
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const advance = async (o: Order, status: string) => {
    await ownerApi.patch(`/kitchen/orders/${o.id}/status`, { status });
    load();
  };

  if (orders.length === 0)
    return <p className="text-sm text-gray-500">No active orders. New orders appear here automatically.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold">#{o.id}</span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase">{o.status}</span>
          </div>
          {o.customer_name && <p className="text-sm text-gray-500">{o.customer_name}</p>}
          <ul className="my-3 space-y-1 text-sm">
            {o.items.map((i) => (
              <li key={i.id}>
                {i.quantity}× {i.name ?? `Item ${i.id}`}
              </li>
            ))}
          </ul>
          <p className="mb-3 text-sm font-semibold">${o.total_amount.toFixed(2)}</p>
          <div className="flex gap-2">
            {NEXT[o.status] && (
              <button
                onClick={() => advance(o, NEXT[o.status])}
                className="flex-1 rounded bg-brand-accent py-1.5 text-sm font-medium text-white"
              >
                → {NEXT[o.status]}
              </button>
            )}
            <button
              onClick={() => advance(o, 'cancelled')}
              className="rounded border px-3 py-1.5 text-sm text-red-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
