import { useEffect, useState } from 'react';
import { ownerApi } from '../lib/api';
import { Login } from './Login';
import { MenuTab } from './MenuTab';
import { UploadTab } from './UploadTab';
import { TablesTab } from './TablesTab';
import { KitchenTab } from './KitchenTab';

const TABS = ['Kitchen', 'Menu', 'Upload', 'Tables'] as const;
type Tab = (typeof TABS)[number];

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
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">SnapMenu AI</h1>
          {restaurant && <p className="text-sm text-gray-500">{restaurant.name}</p>}
        </div>
        <button onClick={logout} className="text-sm text-gray-500 underline">
          Log out
        </button>
      </header>

      <nav className="mb-6 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t ? 'border-b-2 border-brand-accent text-brand' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Kitchen' && <KitchenTab />}
      {tab === 'Menu' && <MenuTab />}
      {tab === 'Upload' && <UploadTab />}
      {tab === 'Tables' && <TablesTab />}
    </div>
  );
}
