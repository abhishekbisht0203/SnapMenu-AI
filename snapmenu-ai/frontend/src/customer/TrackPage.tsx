import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi, type Order } from '../lib/api';

const STEPS = [
  { key: 'placed', label: 'Order placed', hint: 'Sent to the kitchen' },
  { key: 'confirmed', label: 'Confirmed', hint: 'The kitchen has it' },
  { key: 'preparing', label: 'Preparing', hint: 'Being cooked now' },
  { key: 'ready', label: 'Ready', hint: 'Coming to your table' },
  { key: 'served', label: 'Served', hint: 'Enjoy!' },
];

export function TrackPage() {
  const { token } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = () =>
      publicApi
        .get(`/orders/track/${token}`)
        .then((r) => setOrder(r.data.data))
        .catch(() => setNotFound(true));
    load();
    const t = setInterval(load, 4000); // polling fallback; Reverb pushes live in prod
    return () => clearInterval(t);
  }, [token]);

  if (notFound)
    return <Centered>We couldn’t find that order.</Centered>;
  if (!order)
    return <Centered>Loading your order…</Centered>;

  const currentStep = STEPS.findIndex((s) => s.key === order.status);
  const cancelled = order.status === 'cancelled';

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl">
      <header className="bg-brand-radial px-6 pb-10 pt-12 text-white">
        <p className="text-xs font-medium uppercase tracking-widest text-white/70">Live order status</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Order #{order.id}</h1>
        <p className="mt-1 text-sm text-white/80">
          {order.customer_name ? `${order.customer_name} · ` : ''}${order.total_amount.toFixed(2)}
        </p>
      </header>

      <div className="px-6 py-8">
        {cancelled ? (
          <div className="rounded-2xl bg-red-50 p-5 text-red-700 ring-1 ring-red-100">
            <p className="font-semibold">This order was cancelled.</p>
            <p className="mt-1 text-sm">Please speak to a member of staff if this is unexpected.</p>
          </div>
        ) : (
          <ol className="relative space-y-6 border-l-2 border-slate-100 pl-7">
            {STEPS.map((step, idx) => {
              const done = idx < currentStep;
              const active = idx === currentStep;
              return (
                <li key={step.key} className="relative">
                  <span
                    className={`absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-white ${
                      done
                        ? 'bg-brand text-white'
                        : active
                          ? 'bg-ember text-white'
                          : 'bg-slate-200 text-slate-500'
                    } ${active ? 'animate-pulse' : ''}`}
                  >
                    {done ? '✓' : idx + 1}
                  </span>
                  <p className={`font-semibold ${idx <= currentStep ? 'text-ink' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-400">{step.hint}</p>
                </li>
              );
            })}
          </ol>
        )}

        <h2 className="mb-2 mt-10 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Your items
        </h2>
        <ul className="divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-100">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-3 text-sm">
              <span className="font-medium text-ink">
                {i.quantity}× {i.name ?? `Item ${i.id}`}
              </span>
              <span className="text-slate-500">${(i.unit_price * i.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <Link
          to={`/r/demo-bistro`}
          className="mt-8 block text-center text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to menu
        </Link>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-white p-8 text-center text-slate-500">
      {children}
    </div>
  );
}
