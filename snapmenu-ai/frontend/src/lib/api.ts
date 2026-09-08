import axios, { AxiosError } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Owner dashboard client — attaches the Sanctum bearer token. */
export const ownerApi = axios.create({ baseURL: `${API_BASE}/api` });

ownerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('snapmenu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** A revoked/expired token anywhere in the app drops the session cleanly. */
ownerApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && localStorage.getItem('snapmenu_token')) {
      localStorage.removeItem('snapmenu_token');
      window.dispatchEvent(new Event('snapmenu:unauthorized'));
    }
    return Promise.reject(err);
  },
);

/** Public customer client — no auth, scoped by slug / table token. */
export const publicApi = axios.create({ baseURL: `${API_BASE}/api` });

/* ------------------------------------------------------------------ */
/* Types (mirror the Laravel API resources)                            */
/* ------------------------------------------------------------------ */

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency?: string;
  is_available: boolean;
  menu_category_id: number | null;
  category?: string | null;
  sort_order?: number;
};

export type Category = { id: number; name: string; sort_order: number; items: MenuItem[] };

export type OrderItem = {
  id: number;
  menu_item_id: number;
  name?: string;
  quantity: number;
  unit_price: number;
  notes?: string | null;
};

export type Order = {
  id: number;
  tracking_token: string;
  restaurant_id: number;
  table_id: number | null;
  customer_name: string | null;
  status: OrderStatus;
  payment_status: string;
  total_amount: number;
  currency: string;
  items: OrderItem[];
  created_at: string;
};

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled';

export type Table = {
  id: number;
  label: string;
  qr_code_token: string;
  menu_url: string;
  qr_svg_url: string;
};

export type StagedItem = {
  category: string | null;
  name: string;
  description: string | null;
  price: number | null;
  valid?: boolean;
};

export type MenuUpload = {
  id: number;
  status: 'processing' | 'parsed' | 'needs_review' | 'failed';
  ai_confidence_score: number | null;
  processing_attempts: number;
  failure_reason: string | null;
  parsed_items: StagedItem[];
  raw_ocr_text: string | null;
  created_at: string;
};

export type Restaurant = {
  id: number;
  name: string;
  slug: string;
  logo_path: string | null;
  primary_color: string;
  subscription_status: string;
};

export type Me = { id: number; name: string; email: string; roles: string[] };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Pull a human-readable message out of a Laravel error response. */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0];
      if (first) return first;
    }
    if (data?.message && !/^Server Error/i.test(data.message)) return data.message;
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
  }
  return fallback;
}

export const unwrap = <T>(res: { data: { data: T } }): T => res.data.data;
