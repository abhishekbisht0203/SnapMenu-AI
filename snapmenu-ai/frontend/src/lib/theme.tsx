import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'snapmenu_theme';

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(choice: ThemeChoice): 'light' | 'dark' {
  return choice === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : choice;
}

function apply(choice: ThemeChoice) {
  const mode = resolve(choice);
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.style.colorScheme = mode;
}

type Ctx = {
  choice: ThemeChoice;
  resolved: 'light' | 'dark';
  setChoice: (c: ThemeChoice) => void;
  toggle: () => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ThemeChoice) || 'system';
    } catch {
      return 'system';
    }
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(choice));

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
    apply(c);
    setResolved(resolve(c));
  }, []);

  useEffect(() => {
    apply(choice);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (choice === 'system') {
        apply('system');
        setResolved(resolve('system'));
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [choice]);

  const toggle = useCallback(() => {
    setChoice(resolve(choice) === 'dark' ? 'light' : 'dark');
  }, [choice, setChoice]);

  return (
    <ThemeContext.Provider value={{ choice, resolved, setChoice, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Inline in <head> to prevent a flash of the wrong theme before React mounts. */
export const themeBootScript = `(function(){try{var c=localStorage.getItem('${STORAGE_KEY}')||'system';var d=c==='dark'||(c==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
