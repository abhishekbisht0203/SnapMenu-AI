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

  useEffect(() => {
    publicApi
      .get(`/menu/${slug}`)
      .then((r) => {
        setRestaurant(r.data.restaurant.data ?? r.data.restaurant);
        setCategories(r.data.categories.data ?? r.data.categories);
        setActiveCat((r.data.categories.data ?? r.data.categories)[0]?.id ?? null);
      })
      .catch(() => setError('Menu not found.'));
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

  if (error && !restaurant) return <Centered>{error}</Centered>;
  if (!restaurant) return <Centered>Loading menu…</Centered>;

  const active = categories.find((c) => c.id === activeCat);

  return (
    <div className="mx-auto max-w-md pb-28">
      <header className="px-4 py-6" style={{ background: restaurant.primary_color, color: '#fff' }}>
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <p className="text-sm opacity-80">{token ? 'Table ordering' : 'Browse menu'}</p>
      </header>

      <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b bg-white px-4 py-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              c.id === activeCat ? 'bg-brand text-white' : 'bg-gray-100'
            }`}
          >
            {c.name}
          </button>
        ))}
      </nav>

      <ul className="divide-y">
        {active?.items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 px-4 py-4">
            <div className="flex-1">
              <p className="font-medium">{i.name}</p>
              {i.description && <p className="text-sm text-gray-500">{i.description}</p>}
              <p className="mt-1 text-sm font-semibold">${i.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full bg-gray-100 text-lg" onClick={() => setQty(i.id, -1)}>
                –
              </button>
              <span className="w-4 text-center">{cart[i.id] ?? 0}</span>
              <button
                className="h-8 w-8 rounded-full bg-brand text-lg text-white"
                onClick={() => setQty(i.id, 1)}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-white p-4">
          <input
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <button
            disabled={placing}
            onClick={placeOrder}
            className="w-full rounded-lg bg-brand-accent py-3 font-semibold text-white disabled:opacity-50"
          >
            Place order · {cartCount} item{cartCount > 1 ? 's' : ''} · ${total.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-8 text-gray-500">{children}</div>;
}
