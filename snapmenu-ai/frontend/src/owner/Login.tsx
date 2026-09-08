import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ownerApi, friendlyError } from '../lib/api';
import { Button, Field, Input, useToast } from '../ui';

type Mode = 'login' | 'register';

export function Login({ onAuthed }: { onAuthed: (token: string) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', restaurant_name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      toast.success(mode === 'register' ? 'Welcome to SnapMenu AI' : 'Signed in');
      onAuthed(data.token);
    } catch (err) {
      setError(friendlyError(err, 'Those details didn’t work. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand p-12 text-brand-fg lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/10" />
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-extrabold">S</div>
          <span className="text-lg font-bold">SnapMenu AI</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight">
            The AI menu &amp; ordering system for modern restaurants.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-brand-fg/80">
            Turn a photo of your paper menu into a digital ordering page with QR codes, then run every
            table order from one live kitchen board.
          </p>
        </div>
        <p className="relative text-sm text-brand-fg/70">
          Demo · owner@demo.test / password
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-extrabold text-brand-fg">
              S
            </div>
            <span className="text-lg font-bold">SnapMenu AI</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {mode === 'login' ? 'Sign in to your dashboard' : 'Create your restaurant'}
          </h2>
          <p className="mt-1 text-sm text-content-muted">
            {mode === 'login'
              ? 'Enter your credentials to continue.'
              : 'Set up your account and menu workspace in one step.'}
          </p>

          <div className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <Field label="Your name" required htmlFor="name">
                  <Input id="name" value={form.name} onChange={set('name')} autoComplete="name" required />
                </Field>
                <Field label="Restaurant name" required htmlFor="restaurant_name">
                  <Input
                    id="restaurant_name"
                    value={form.restaurant_name}
                    onChange={set('restaurant_name')}
                    required
                  />
                </Field>
              </>
            )}
            <Field label="Email" required htmlFor="email">
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password" required htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-content-subtle hover:bg-surface-2 hover:text-content"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth loading={busy} size="lg">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="mt-4 w-full text-center text-sm font-medium text-content-muted transition hover:text-content"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
