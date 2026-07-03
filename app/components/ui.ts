// Shared Tailwind class tokens so the minimal black/white/zinc look stays
// consistent across components.
// Edge-to-edge on mobile (no chrome, max content width); a bordered card on
// larger screens. Keeps the app feeling native on phones.
export const card =
  'bg-white py-4 sm:rounded-2xl sm:border sm:border-zinc-200 sm:p-6 print:border-0 print:p-0 print:py-0 print:rounded-none';

export const sectionTitle =
  'text-lg sm:text-xl font-semibold tracking-tight text-black';

export const fieldLabel = 'block text-sm font-medium text-zinc-600 mb-1.5';

export const inputBase =
  'w-full px-3.5 py-2.5 text-black bg-zinc-50 rounded-lg border border-transparent focus:outline-none focus:border-zinc-300 focus:bg-white transition-colors';

export const groupLabel =
  'text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

export const btnPrimary =
  'rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400';

export const btnSecondary =
  'rounded-lg bg-zinc-100 px-6 py-3 font-medium text-black transition-colors hover:bg-zinc-200';

export const iconBtn =
  'inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-zinc-300';
