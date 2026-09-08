import { LayoutDashboard, Flame, BookOpenText, Sparkles, QrCode, type LucideIcon } from 'lucide-react';

export type SectionKey = 'overview' | 'kitchen' | 'menu' | 'import' | 'tables';

export type Section = {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  ownerOnly: boolean;
};

export const SECTIONS: Section[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, ownerOnly: false },
  { key: 'kitchen', label: 'Kitchen', icon: Flame, ownerOnly: false },
  { key: 'menu', label: 'Menu', icon: BookOpenText, ownerOnly: false },
  { key: 'import', label: 'Import', icon: Sparkles, ownerOnly: true },
  { key: 'tables', label: 'Tables', icon: QrCode, ownerOnly: true },
];

export function sectionFromHash(): SectionKey {
  const raw = window.location.hash.replace(/^#\/?/, '') as SectionKey;
  return SECTIONS.some((s) => s.key === raw) ? raw : 'overview';
}
