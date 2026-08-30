import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi, type Order } from '../lib/api';

const STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'served'];

export function TrackPage() {
  const { token } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const load = () =>
      publicApi.get(`/orders/track/${token}`).then((r) => setOrder(r.data.data)).catch(() => {});
    load();
    const t = setInterval(load, 4000); // polling fallback; Reverb pushes live in prod
    return () => clearInterval(t);
  }, [token]);

  if (!order) return <div className="p-8 text-center text-gray-500">Loading order…</div>;

  const currentStep = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">Order #{order.id}</h1>
      <p className="text-sm text-gray-500">
        {order.customer_name ? `${order.customer_name} · ` : ''}${order.total_amount.toFixed(2)}
      </p>

      {order.status === 'cancelled' ? (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">This order was cancelled.</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {STEPS.map((step, idx) => (
            <li key={step} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  idx <= currentStep ? 'bg-brand-accent text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {idx + 1}
              </span>
              <span className={idx <= currentStep ? 'font-medium' : 'text-gray-400'}>
                {step[0].toUpperCase() + step.slice(1)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-8 divide-y border-t">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between py-2 text-sm">
            <span>
              {i.quantity}× {i.name ?? `Item ${i.id}`}
            </span>
            <span>${(i.unit_price * i.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
