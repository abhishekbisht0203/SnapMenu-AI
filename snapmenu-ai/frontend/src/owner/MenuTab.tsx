import { useEffect, useState } from 'react';
import { ownerApi, type Category } from '../lib/api';

export function MenuTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    ownerApi.get('/categories').then((r) => {
      setCategories(r.data.data);
      setLoaded(true);
    });
  useEffect(() => {
    load();
  }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await ownerApi.post('/categories', { name: newCat });
    setNewCat('');
    load();
  };

  const toggleAvailable = async (id: number, is_available: boolean) => {
    setCategories((cs) =>
      cs.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === id ? { ...i, is_available: !is_available } : i)),
      })),
    );
    await ownerApi.patch(`/menu-items/${id}`, { is_available: !is_available });
  };

  const itemCount = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-display text-lg font-bold">Menu</p>
          <p className="text-sm text-slate-500">
            {categories.length} categories · {itemCount} items
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="field sm:w-56"
            placeholder="New category name"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button onClick={addCategory} className="btn-primary whitespace-nowrap">
            Add
          </button>
        </div>
      </div>

      {loaded && categories.length === 0 && (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">
            📋
          </div>
          <p className="font-semibold">No menu yet</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Add a category above, or head to the <b>Upload</b> tab to let AI build your menu from a
            photo.
          </p>
        </div>
      )}

      {categories.map((c) => (
        <section key={c.id} className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold">{c.name}</h3>
            <span className="chip bg-slate-100 text-slate-500">{c.items.length}</span>
          </header>
          <ul className="divide-y divide-slate-100">
            {c.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{i.name}</p>
                  <p className="text-xs text-slate-400">${i.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => toggleAvailable(i.id, i.is_available)}
                  className={`chip transition ${
                    i.is_available
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                  }`}
                >
                  {i.is_available ? '● Available' : '○ 86’d'}
                </button>
              </li>
            ))}
            {c.items.length === 0 && (
              <li className="px-4 py-4 text-xs text-slate-400">No items in this category yet.</li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
