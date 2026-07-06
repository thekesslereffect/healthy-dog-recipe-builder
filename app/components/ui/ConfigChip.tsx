import { ChevronRight } from 'lucide-react';

export interface ConfigChipProps {
  label: string;
  detail: string;
  onClick: () => void;
}

export function ConfigChip({ label, detail, onClick }: ConfigChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 text-left transition-colors hover:bg-border active:scale-[0.98]"
    >
      <span className="truncate text-sm font-semibold text-foreground">{label}</span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted">
        {detail}
        <ChevronRight size={12} />
      </span>
    </button>
  );
}
