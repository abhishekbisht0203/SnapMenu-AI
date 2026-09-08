import { useCallback, useEffect, useMemo, useState } from 'react';
import { ownerApi, friendlyError, unwrap, type Me, type Restaurant } from '../lib/api';
import { useToast } from '../ui';
import { Login } from './Login';
import { Shell } from './Shell';
import { OrdersProvider, useOrders, ACTIVE_STATUSES } from './ordersContext';
import { sectionFromHash, SECTIONS, type SectionKey } from './nav';
import { OverviewSection } from './sections/OverviewSection';
import { KitchenSection } from './sections/KitchenSection';
import { MenuSection } from './sections/MenuSection';
import { ImportSection } from './sections/ImportSection';
import { TablesSection } from './sections/TablesSection';
import { SettingsModal } from './sections/SettingsModal';
import { BootScreen } from './sections/BootScreen';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('snapmenu_token'));
  const [me, setMe] = useState<Me | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const toast = useToast();

  const logout = useCallback(() => {
    ownerApi.post('/auth/logout').catch(() => {});
    localStorage.removeItem('snapmenu_token');
    setToken(null);
    setMe(null);
    setRestaurant(null);
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    try {
      const [meRes, restRes] = await Promise.all([
        ownerApi.get('/auth/me'),
        ownerApi.get('/restaurant'),
      ]);
      setMe(meRes.data.user);
      setRestaurant(unwrap(restRes));
      setStatus('ready');
    } catch (e) {
      if ((e as any)?.response?.status === 401) {
        localStorage.removeItem('snapmenu_token');
        setToken(null);
      } else {
        setStatus('error');
        toast.error(friendlyError(e));
      }
    }
  }, [toast]);

  useEffect(() => {
    if (token) bootstrap();
  }, [token, bootstrap]);

  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setMe(null);
      setRestaurant(null);
    };
    window.addEventListener('snapmenu:unauthorized', onUnauthorized);
    return () => window.removeEventListener('snapmenu:unauthorized', onUnauthorized);
  }, []);

  if (!token) return <Login onAuthed={(t) => setToken(t)} />;
  if (status !== 'ready') return <BootScreen error={status === 'error'} onRetry={bootstrap} />;

  return (
    <OrdersProvider>
      <Dashboard
        me={me}
        restaurant={restaurant}
        onLogout={logout}
        onRestaurantUpdated={setRestaurant}
      />
    </OrdersProvider>
  );
}

function Dashboard({
  me,
  restaurant,
  onLogout,
  onRestaurantUpdated,
}: {
  me: Me | null;
  restaurant: Restaurant | null;
  onLogout: () => void;
  onRestaurantUpdated: (r: Restaurant) => void;
}) {
  const isOwner = !!me?.roles.includes('Owner');
  const { orders } = useOrders();
  const [section, setSection] = useState<SectionKey>(sectionFromHash);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const go = useCallback(
    (s: SectionKey) => {
      const allowed = SECTIONS.find((x) => x.key === s && (!x.ownerOnly || isOwner));
      const next = allowed ? s : 'overview';
      setSection(next);
      window.location.hash = `/${next}`;
    },
    [isOwner],
  );

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Guard against a staff member deep-linking to an owner-only section.
  useEffect(() => {
    const cfg = SECTIONS.find((s) => s.key === section);
    if (cfg?.ownerOnly && !isOwner) go('overview');
  }, [section, isOwner, go]);

  const readyCount = useMemo(
    () => orders.filter((o) => o.status === 'ready').length,
    [orders],
  );
  const activeCount = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    [orders],
  );

  return (
    <>
      <Shell
        me={me}
        restaurant={restaurant}
        section={section}
        onSection={go}
        readyCount={readyCount}
        onLogout={onLogout}
        onSettings={() => setSettingsOpen(true)}
      >
        {section === 'overview' && (
          <OverviewSection isOwner={isOwner} restaurant={restaurant} onNavigate={go} activeCount={activeCount} />
        )}
        {section === 'kitchen' && <KitchenSection />}
        {section === 'menu' && <MenuSection isOwner={isOwner} />}
        {section === 'import' && isOwner && <ImportSection onNavigate={go} />}
        {section === 'tables' && isOwner && <TablesSection />}
      </Shell>

      {restaurant && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          restaurant={restaurant}
          onSaved={onRestaurantUpdated}
        />
      )}
    </>
  );
}
