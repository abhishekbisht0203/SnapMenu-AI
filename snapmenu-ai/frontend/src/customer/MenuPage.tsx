import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicApi, type Category } from '../lib/api';

type Cart = Record<number, number>;

export function MenuPage() {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<{ name: string; primary_color: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    publicApi
      .get(`/menu/${slug}`)
      .then((r) => {
        const cats: Category[] = r.data.categories.data ?? r.data.categories;
        setRestaurant(r.data.restaurant.data ?? r.data.restaurant);
        setCategories(cats);
        setActiveCat(cats[0]?.id ?? null);
      })
      .catch(() => setError('Menu not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const itemsById = useMemo(() => {
    const m = new Map<number, { name: string; price: number }>();
    categories.forEach((c) => c.items.forEach((i) => m.set(i.id, { name: i.name, price: i.price })));
    return m;
  }, [categories]);

  const total = Object.entries(cart).reduce(
    (sum, [id, qty]) => sum + (itemsById.get(Number(id))?.price ?? 0) * qty,
    0,
  );
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const setQty = (id: number, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const placeOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const { data } = await publicApi.post('/orders', {
        restaurant_slug: slug,
        table_token: token ?? null,
        customer_name: name || null,
        items: Object.entries(cart).map(([id, quantity]) => ({ menu_item_id: Number(id), quantity })),
      });
      navigate(`/track/${data.data.tracking_token}`);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not place order.');
    } finally {
      setPlacing(false);
    }
  };

  const accent = restaurant?.primary_color || '#0f766e';

  if (loading) return <MenuSkeleton />;
  if (error && !restaurant) return <Centered>{error}</Centered>;
  if (!restaurant) return <Centered>Loading menu…</Centered>;

  const active = categories.find((c) => c.id === activeCat);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white pb-32 shadow-xl">
      <header
        className="relative overflow-hidden px-5 pb-8 pt-10 text-white"
        style={{ background: `linear-gradient(135deg, ${accent}, ${shade(accent, -18)})` }}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-black/10" />
        <p className="relative text-xs font-medium uppercase tracking-widest text-white/70">
          {token ? 'Table ordering' : 'Digital menu'}
        </p>
        <h1 className="relative mt-1 font-display text-3xl font-extrabold tracking-tight">
          {restaurant.name}
        </h1>
      </header>

      <nav className="sticky top-0 z-20 -mt-4 flex gap-2 overflow-x-auto rounded-t-2xl border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              c.id === activeCat
                ? 'text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            style={c.id === activeCat ? { background: accent } : undefined}
          >
            {c.name}
          </button>
        ))}
      </nav>

      <ul className="divide-y divide-slate-100">
        {active?.items.map((i, idx) => {
          const qty = cart[i.id] ?? 0;
          return (
            <li
              key={i.id}
              className="flex animate-fade-up items-start gap-4 px-5 py-4"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{i.name}</p>
                {i.description && (
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">{i.description}</p>
                )}
                <p className="mt-1.5 text-sm font-bold" style={{ color: accent }}>
                  ${i.price.toFixed(2)}
                </p>
              </div>
              {qty === 0 ? (
                <button
                  onClick={() => setQty(i.id, 1)}
                  className="mt-1 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition active:scale-95"
                  style={{ background: accent }}
                >
                  Add
                </button>
              ) : (
                <div className="mt-1 flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    className="h-8 w-8 rounded-lg bg-white text-lg font-medium shadow-sm"
                    onClick={() => setQty(i.id, -1)}
                  >
                    –
                  </button>
                  <span className="w-4 text-center text-sm font-bold">{qty}</span>
                  <button
                    className="h-8 w-8 rounded-lg text-lg font-medium text-white shadow-sm"
                    style={{ background: accent }}
                    onClick={() => setQty(i.id, 1)}
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md animate-fade-up border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
          <input
            className="field mb-2"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className="mb-2 text-sm font-medium text-red-600">{error}</p>}
          <button
            disabled={placing}
            onClick={placeOrder}
            className="flex w-full items-center justify-between rounded-2xl px-5 py-3.5 font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60"
            style={{ background: accent }}
          >
            <span>{placing ? 'Placing…' : 'Place order'}</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
              {cartCount} · ${total.toFixed(2)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <div className="skeleton h-40 w-full" />
      <div className="flex gap-2 px-5 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
          <div className="skeleton h-9 w-14 rounded-xl" />
        </div>
      ))}
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

/** Lighten/darken a hex color by a percentage for the header gradient. */
function shade(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + Math.round((255 * percent) / 100));
  const g = clamp(((n >> 8) & 0xff) + Math.round((255 * percent) / 100));
  const b = clamp((n & 0xff) + Math.round((255 * percent) / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
