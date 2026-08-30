import { useState } from 'react';
import { ownerApi } from '../lib/api';

export function Login({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', restaurant_name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload =
        mode === 'register'
          ? { ...form, password_confirmation: form.password }
          : { email: form.email, password: form.password };
      const { data } = await ownerApi.post(`/auth/${mode}`, payload);
      localStorage.setItem('snapmenu_token', data.token);
      onAuthed();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Authentication failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold">
          {mode === 'login' ? 'Owner sign in' : 'Create your restaurant'}
        </h1>
        {mode === 'register' && (
          <>
            <Field label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Restaurant name"
              value={form.restaurant_name}
              onChange={(v) => setForm({ ...form, restaurant_name: v })}
            />
          </>
        )}
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-lg bg-brand py-2 font-semibold text-white">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full text-sm text-gray-500 underline"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-600">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />
    </label>
  );
}
