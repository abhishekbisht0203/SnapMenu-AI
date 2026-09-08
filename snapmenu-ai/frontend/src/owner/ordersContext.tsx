import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ownerApi, friendlyError, type Order, type OrderStatus } from '../lib/api';

type OrdersCtx = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  lastSync: number | null;
  refresh: () => Promise<void>;
  setStatus: (id: number, status: OrderStatus) => Promise<void>;
};

const Context = createContext<OrdersCtx | null>(null);
const POLL_MS = 4000;

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      // No `active` filter → all orders, so Overview can derive today's totals.
      const { data } = await ownerApi.get('/kitchen/orders');
      setOrders(data.data);
      setError(null);
      setLastSync(Date.now());
    } catch (e) {
      setError(friendlyError(e, 'Could not load orders.'));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  const setStatus = useCallback(
    async (id: number, status: OrderStatus) => {
      // Optimistic update — reconciled on the next poll / this call's response.
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
      const { data } = await ownerApi.patch(`/kitchen/orders/${id}/status`, { status });
      setOrders((os) => os.map((o) => (o.id === id ? data.data : o)));
    },
    [],
  );

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return (
    <Context.Provider value={{ orders, loading, error, lastSync, refresh, setStatus }}>
      {children}
    </Context.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}

export const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready'];
