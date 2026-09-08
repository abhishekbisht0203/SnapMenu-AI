import { useEffect, useState } from 'react';
import { ownerApi } from '../lib/api';
import { Login } from './Login';
import { MenuTab } from './MenuTab';
import { UploadTab } from './UploadTab';
import { TablesTab } from './TablesTab';
import { KitchenTab } from './KitchenTab';

const TABS = [
  { key: 'Kitchen', icon: '🔥' },
  { key: 'Menu', icon: '📋' },
  { key: 'Upload', icon: '✨' },
  { key: 'Tables', icon: '🍽️' },
] as const;
type Tab = (typeof TABS)[number]['key'];

export function App() {
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem('snapmenu_token'));
  const [restaurant, setRestaurant] = useState<{ name: string; slug: string } | null>(null);
  const [tab, setTab] = useState<Tab>('Kitchen');

  useEffect(() => {
    if (!authed) return;
    ownerApi
      .get('/restaurant')
      .then((r) => setRestaurant(r.data.data))
      .catch(() => logout());
  }, [authed]);

  const logout = () => {
    localStorage.removeItem('snapmenu_token');
    setAuthed(false);
    setRestaurant(null);
  };

  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-radial text-sm font-black text-white">
              S
            </div>
            <div>
              <p className="font-display text-sm font-bold leading-none">SnapMenu AI</p>
              {restaurant && <p className="text-xs text-slate-500">{restaurant.name}</p>}
            </div>
          </div>
          <button onClick={logout} className="btn-ghost !px-3 !py-1.5 text-xs">
            Log out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-2 sm:px-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold transition ${
                tab === t.key ? 'text-ink' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{t.icon}</span>
              {t.key}
              {tab === t.key && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ember" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl animate-fade-up px-4 py-6 sm:px-6 sm:py-8">
        {tab === 'Kitchen' && <KitchenTab />}
        {tab === 'Menu' && <MenuTab />}
        {tab === 'Upload' && <UploadTab />}
        {tab === 'Tables' && <TablesTab />}
      </main>
    </div>
  );
}
