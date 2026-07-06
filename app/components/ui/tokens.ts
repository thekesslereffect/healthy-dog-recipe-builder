// Design tokens — warm, premium pet wellness aesthetic

// Flat "cards": no chrome, just rounded hover/tap targets on the page background.
export const card = 'rounded-2xl p-4 sm:p-5 print:p-0 print:rounded-none';

export const cardElevated =
  'rounded-2xl p-4 transition-colors hover:bg-surface-muted sm:p-5 print:p-0 print:rounded-none';

export const sectionTitle = 'text-base font-semibold tracking-tight text-foreground';

export const fieldLabel = 'block text-xs font-medium text-muted mb-1.5';

export const inputBase =
  'w-full px-3.5 py-2.5 text-base font-normal text-foreground bg-surface-muted rounded-xl border border-transparent focus:outline-none focus:border-accent/30 focus:bg-surface focus:ring-2 focus:ring-accent/15 transition-all placeholder:text-muted/60 sm:text-sm';

export const groupLabel = 'text-[10px] font-semibold uppercase tracking-widest text-muted';

export const btnPrimary =
  'rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-border disabled:text-muted disabled:shadow-none disabled:active:scale-100';

export const btnSecondary =
  'rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-border active:scale-[0.98]';

export const btnGhost =
  'rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground';

export const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-all hover:bg-surface-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 active:scale-95';

export const segmentTrack = 'inline-flex h-9 items-center rounded-xl bg-surface-muted p-0.5';

export const segmentBtn = (active: boolean) =>
  `inline-flex h-8 items-center justify-center rounded-[10px] px-3 text-xs font-semibold transition-all sm:px-3.5 sm:text-sm ${
    active
      ? 'bg-surface text-foreground shadow-[var(--shadow-sm)]'
      : 'text-muted hover:text-foreground'
  }`;

export const stepperBtn =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold text-muted transition-all hover:text-foreground active:scale-95';

export const stepperValue =
  'flex h-8 min-w-[1.75rem] items-center justify-center px-0.5 text-sm font-bold tabular-nums text-foreground';

export const stepperReadout =
  'flex h-8 items-center gap-1 whitespace-nowrap px-1.5 sm:px-2';

export const stepperReadoutValue = 'text-sm font-bold tabular-nums text-foreground';

export const stepperReadoutLabel = 'text-xs font-semibold text-muted';

export const massUnitSelect =
  'rounded-lg border-0 bg-surface-muted py-1 pl-1.5 text-[11px] font-medium text-muted print:hidden';

/** Same look as massUnitSelect, sized to match the plan header toolbar controls. */
export const toolbarUnitSelect =
  'h-9 rounded-xl border-0 bg-surface-muted pl-3 text-xs font-medium text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 sm:pl-3.5 sm:text-sm print:hidden';

export const toolbarEditBtn =
  'inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98]';

export const pill =
  'inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent';

export const emptyIconWrap =
  'flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent';

/** Scroll areas that contain shadowed cards — padding prevents box-shadow clipping. */
export const scrollShadowRoom = 'overflow-y-auto overscroll-contain px-1 py-2';
