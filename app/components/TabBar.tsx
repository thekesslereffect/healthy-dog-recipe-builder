import type { LucideIcon } from 'lucide-react';

export type TabId = 'home' | 'build' | 'edit' | 'saved' | 'profile';

export interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps {
  tabs: TabDef[];
  active: TabId;
  onChange: (id: TabId) => void;
}

export function TopTabs({ tabs, active, onChange }: TabBarProps) {
  return (
    <nav
      aria-label="Sections"
      className="hidden shrink-0 rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-800 sm:inline-flex print:hidden"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-black shadow-sm dark:bg-zinc-700 dark:text-zinc-50 dark:shadow-none'
                : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50'
            }`}
          >
            <Icon size={15} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function BottomTabs({ tabs, active, onChange }: TabBarProps) {
  return (
    <nav
      aria-label="Sections"
      className="shrink-0 border-t border-zinc-200/80 bg-white/95 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/95 sm:hidden print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? 'text-black dark:text-zinc-50' : 'text-zinc-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
