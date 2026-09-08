import { useEffect, useState } from 'react';
import { ownerApi } from '../lib/api';

type Table = { id: number; label: string; qr_code_token: string; menu_url: string; qr_svg_url: string };

export function TablesTab() {
  const [tables, setTables] = useState<Table[]>([]);
  const [label, setLabel] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    ownerApi.get('/tables').then((r) => {
      setTables(r.data.data);
      setLoaded(true);
    });
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
    <div className="space-y-6">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-display text-lg font-bold">Tables &amp; QR codes</p>
          <p className="text-sm text-slate-500">
            Print each QR and place it on the table. Scanning opens that table’s ordering page.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="field sm:w-48"
            placeholder="e.g. Table 4"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button onClick={add} className="btn-primary whitespace-nowrap">
            Add table
          </button>
        </div>
      </div>

      {loaded && tables.length === 0 && (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">
            🍽️
          </div>
          <p className="font-semibold">No tables yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first table above to generate a QR code.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((t) => (
          <div key={t.id} className="card group flex flex-col items-center p-4 text-center">
            <p className="font-semibold text-ink">{t.label}</p>
            <div className="my-3 rounded-xl bg-white p-2 ring-1 ring-slate-100">
              <img src={t.qr_svg_url} alt={`QR for ${t.label}`} className="h-28 w-28" />
            </div>
            <a
              href={t.menu_url}
              target="_blank"
              rel="noreferrer"
              className="w-full truncate text-xs text-brand-700 hover:underline"
            >
              Open page ↗
            </a>
            <button
              onClick={() => remove(t.id)}
              className="mt-1 text-xs text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
