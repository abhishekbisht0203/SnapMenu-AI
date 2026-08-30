import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Owner dashboard client — attaches the Sanctum bearer token. */
export const ownerApi = axios.create({ baseURL: `${API_BASE}/api` });

ownerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('snapmenu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Public customer client — no auth, scoped by slug / table token. */
export const publicApi = axios.create({ baseURL: `${API_BASE}/api` });

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  menu_category_id: number | null;
};

export type Category = { id: number; name: string; items: MenuItem[] };

export type Order = {
  id: number;
  tracking_token: string;
  customer_name: string | null;
  status: string;
  total_amount: number;
  currency: string;
  items: { id: number; name?: string; quantity: number; unit_price: number }[];
  created_at: string;
};
