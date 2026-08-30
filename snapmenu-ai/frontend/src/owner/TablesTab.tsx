import { useEffect, useState } from 'react';
import { ownerApi } from '../lib/api';

type Table = { id: number; label: string; qr_code_token: string; menu_url: string; qr_svg_url: string };

export function TablesTab() {
  const [tables, setTables] = useState<Table[]>([]);
  const [label, setLabel] = useState('');

  const load = () => ownerApi.get('/tables').then((r) => setTables(r.data.data));
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!label.trim()) return;
    await ownerApi.post('/tables', { label });
    setLabel('');
    load();
  };

  const remove = async (id: number) => {
    await ownerApi.delete(`/tables/${id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder="Table label, e.g. Table 4"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button onClick={add} className="rounded bg-brand px-4 py-2 text-sm text-white">
          Add table
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tables.map((t) => (
          <div key={t.id} className="rounded-lg border bg-white p-3 text-center">
            <p className="mb-2 font-medium">{t.label}</p>
            <img src={t.qr_svg_url} alt={`QR for ${t.label}`} className="mx-auto h-32 w-32" />
            <a href={t.menu_url} target="_blank" className="mt-2 block truncate text-xs text-blue-600">
              {t.menu_url}
            </a>
            <button onClick={() => remove(t.id)} className="mt-1 text-xs text-red-500 underline">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
