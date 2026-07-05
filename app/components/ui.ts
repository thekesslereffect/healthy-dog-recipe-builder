// Compact, mobile-first tokens — light + dark.
// Nunito reads a bit heavier than geometric sans, so we favor 500/600 over 700.

export const card =
  'rounded-2xl border border-zinc-100 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 print:border-0 print:p-0 print:rounded-none';

export const sectionTitle =
  'text-base font-semibold tracking-tight text-black dark:text-zinc-50';

export const fieldLabel = 'block text-xs font-medium text-zinc-500 mb-1 dark:text-zinc-400';

export const inputBase =
  'w-full px-3 py-2.5 text-sm font-normal text-black bg-zinc-50 rounded-xl border border-transparent focus:outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:bg-zinc-900 dark:focus:ring-zinc-700 dark:placeholder:text-zinc-500';

export const groupLabel =
  'text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500';

export const btnPrimary =
  'rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600';

export const btnSecondary =
  'rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700';

export const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus:ring-zinc-700';

export const segmentTrack =
  'inline-flex rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-800';

export const segmentBtn = (active: boolean) =>
  `rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'bg-white text-black shadow-sm dark:bg-zinc-700 dark:text-zinc-50 dark:shadow-none'
      : 'text-zinc-500 dark:text-zinc-400'
  }`;
