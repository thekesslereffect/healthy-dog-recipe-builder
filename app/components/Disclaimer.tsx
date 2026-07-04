export function Disclaimer() {
  return (
    <div
      role="note"
      className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 print:border-0 print:bg-white print:px-0 print:text-xs"
    >
      <span className="font-medium text-black dark:text-zinc-50">Please note:</span> this is a
      calorie &amp; portion planner — it balances daily energy and calcium, but
      not every one of the ~40 essential nutrients dogs need. Treat recipes as a
      starting point and confirm any long-term diet with your veterinarian or a
      board-certified veterinary nutritionist.
    </div>
  );
}
