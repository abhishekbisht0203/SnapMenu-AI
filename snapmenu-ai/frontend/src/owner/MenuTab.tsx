import { useEffect, useState } from 'react';
import { ownerApi, type Category } from '../lib/api';

export function MenuTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState('');

  const load = () => ownerApi.get('/categories').then((r) => setCategories(r.data.data));
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
    await ownerApi.patch(`/menu-items/${id}`, { is_available: !is_available });
    load();
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder="New category"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
        />
        <button onClick={addCategory} className="rounded bg-brand px-4 py-2 text-sm text-white">
          Add
        </button>
      </div>

      {categories.length === 0 && <p className="text-sm text-gray-500">No categories yet.</p>}

      {categories.map((c) => (
        <section key={c.id} className="mb-5">
          <h3 className="mb-2 font-semibold">{c.name}</h3>
          <ul className="divide-y rounded-lg border bg-white">
            {c.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  {i.name} — ${i.price.toFixed(2)}
                </span>
                <button
                  onClick={() => toggleAvailable(i.id, i.is_available)}
                  className={`rounded px-2 py-1 text-xs ${
                    i.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i.is_available ? 'Available' : '86’d'}
                </button>
              </li>
            ))}
            {c.items.length === 0 && <li className="px-3 py-2 text-xs text-gray-400">No items</li>}
          </ul>
        </section>
      ))}
    </div>
  );
}
