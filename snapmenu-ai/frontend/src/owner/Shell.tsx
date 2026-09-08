import { useState, type ReactNode } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { useTheme, type ThemeChoice } from '../lib/theme';
import {
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  cn,
} from '../ui';
import { SECTIONS, type SectionKey } from './nav';
import type { Me, Restaurant } from '../lib/api';

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-extrabold text-brand-fg">
        S
      </div>
      <span className="text-[15px] font-bold tracking-tight text-content">SnapMenu AI</span>
    </div>
  );
}

function ThemeMenu() {
  const { choice, setChoice, resolved } = useTheme();
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Change theme">
          {resolved === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      )}
    >
      {(close) => (
        <>
          <DropdownLabel>Theme</DropdownLabel>
          {THEME_OPTIONS.map((o) => (
            <DropdownItem
              key={o.value}
              icon={<o.icon className="h-4 w-4" />}
              onClick={() => {
                setChoice(o.value);
                close();
              }}
            >
              <span className="flex-1">{o.label}</span>
              {choice === o.value && <Check className="h-4 w-4 text-brand" />}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

function ProfileMenu({
  me,
  restaurant,
  onLogout,
  onSettings,
}: {
  me: Me | null;
  restaurant: Restaurant | null;
  onLogout: () => void;
  onSettings: () => void;
}) {
  const initials = (me?.name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-surface-2"
          aria-label="Account menu"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent-soft text-xs font-bold text-accent">
            {initials}
          </span>
          <ChevronDown className="h-4 w-4 text-content-subtle" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-content">{me?.name}</p>
            <p className="truncate text-xs text-content-muted">{me?.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {me?.roles.map((r) => (
                <Badge key={r} tone={r === 'Owner' ? 'brand' : 'neutral'}>
                  {r}
                </Badge>
              ))}
            </div>
          </div>
          <DropdownSeparator />
          {restaurant && (
            <p className="px-2.5 pb-1.5 text-xs text-content-subtle">
              Managing <span className="font-medium text-content-muted">{restaurant.name}</span>
            </p>
          )}
          {me?.roles.includes('Owner') && (
            <DropdownItem
              icon={<Settings className="h-4 w-4" />}
              onClick={() => {
                onSettings();
                close();
              }}
            >
              Restaurant settings
            </DropdownItem>
          )}
          <DropdownItem
            danger
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => {
              onLogout();
              close();
            }}
          >
            Log out
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

export function Shell({
  me,
  restaurant,
  section,
  onSection,
  readyCount,
  onLogout,
  onSettings,
  children,
}: {
  me: Me | null;
  restaurant: Restaurant | null;
  section: SectionKey;
  onSection: (s: SectionKey) => void;
  readyCount: number;
  onLogout: () => void;
  onSettings: () => void;
  children: ReactNode;
}) {
  const [pulse, setPulse] = useState(false);
  const isOwner = !!me?.roles.includes('Owner');
  const visible = SECTIONS.filter((s) => !s.ownerOnly || isOwner);

  return (
    <div className="min-h-screen bg-bg pb-16 md:pb-0">
      {/* ---- Top bar ---- */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo />

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {visible.map((s) => {
              const active = s.key === section;
              return (
                <button
                  key={s.key}
                  onClick={() => onSection(s.key)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-14 items-center gap-1.5 px-3 text-sm font-semibold transition-colors',
                    active ? 'text-content' : 'text-content-muted hover:text-content',
                  )}
                >
                  <s.icon className="h-4 w-4" strokeWidth={2} />
                  {s.label}
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              className="relative grid h-9 w-9 place-items-center rounded-lg text-content-muted transition-colors hover:bg-surface-2 hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={`${readyCount} orders ready`}
              onClick={() => {
                onSection('kitchen');
                setPulse(true);
                setTimeout(() => setPulse(false), 600);
              }}
            >
              <Bell className={cn('h-4 w-4', pulse && 'animate-fade-up')} />
              {readyCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
                  {readyCount}
                </span>
              )}
            </button>
            <ThemeMenu />
            <div className="mx-1 hidden h-5 w-px bg-line sm:block" />
            <ProfileMenu me={me} restaurant={restaurant} onLogout={onLogout} onSettings={onSettings} />
          </div>
        </div>
      </header>

      {/* ---- Page content ---- */}
      <main key={section} className="mx-auto max-w-6xl animate-fade-up px-4 py-5 sm:px-6 sm:py-7">
        {children}
      </main>

      {/* ---- Mobile bottom nav ---- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur-md md:hidden">
        {visible.map((s) => {
          const active = s.key === section;
          return (
            <button
              key={s.key}
              onClick={() => onSection(s.key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors',
                active ? 'text-brand' : 'text-content-subtle',
              )}
            >
              <span className="relative">
                <s.icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {s.key === 'kitchen' && readyCount > 0 && (
                  <span className="absolute -right-2 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-accent-fg">
                    {readyCount}
                  </span>
                )}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
