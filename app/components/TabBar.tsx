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
      className="hidden shrink-0 rounded-2xl bg-surface-muted p-1 shadow-[var(--shadow-sm)] sm:inline-flex print:hidden"
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
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
              isActive
                ? 'bg-surface text-foreground shadow-[var(--shadow-sm)]'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
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
      className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:hidden print:hidden"
    >
      <div className="flex items-center justify-around rounded-2xl border border-border bg-surface/90 px-2 py-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(tab.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition-all ${
                isActive ? 'text-accent' : 'text-muted'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-accent-soft" aria-hidden />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="relative z-10"
              />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
