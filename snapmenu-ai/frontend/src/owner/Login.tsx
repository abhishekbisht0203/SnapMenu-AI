import { useState } from 'react';
import { ownerApi } from '../lib/api';

export function Login({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', restaurant_name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-radial p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-black/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 font-black">S</div>
          <span className="font-display text-lg font-bold">SnapMenu AI</span>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Your paper menu,
            <br />
            live in minutes.
          </h1>
          <p className="mt-4 max-w-sm text-white/80">
            Upload a photo, let AI structure it, print the QR codes, and watch orders land on the
            kitchen board in real time.
          </p>
        </div>
        <p className="relative text-sm text-white/60">
          Demo: owner@demo.test · password
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-7">
          <div>
            <h2 className="font-display text-xl font-bold">
              {mode === 'login' ? 'Welcome back' : 'Create your restaurant'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login'
                ? 'Sign in to your owner dashboard.'
                : 'Set up your account and menu workspace.'}
            </p>
          </div>

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

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
          )}

          <button disabled={busy} className="btn-primary w-full">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full text-sm font-medium text-slate-500 hover:text-ink"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
          </button>
        </form>
      </div>
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
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </label>
  );
}
