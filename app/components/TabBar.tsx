import type { SVGProps } from 'react';

export type TabId = 'home' | 'build' | 'saved' | 'profile';

export interface TabDef {
  id: TabId;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
}

interface TabBarProps {
  tabs: TabDef[];
  active: TabId;
  onChange: (id: TabId) => void;
}

// Top segmented tabs — desktop only.
export function TopTabs({ tabs, active, onChange }: TabBarProps) {
  return (
    <nav
      aria-label="Sections"
      className="hidden sm:inline-flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm print:hidden"
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
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Icon width={16} height={16} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

// Fixed bottom navigation — mobile only.
export function BottomTabs({ tabs, active, onChange }: TabBarProps) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/90 backdrop-blur-lg sm:hidden print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-black' : 'text-zinc-400'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  isActive ? 'bg-zinc-100' : ''
                }`}
              >
                <Icon width={20} height={20} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
