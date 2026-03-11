type InfoHintProps = {
  label: string;
  content: string;
};

export function InfoHint({ label, content }: InfoHintProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-[11px] font-bold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-[var(--foreground)] shadow-[var(--shadow-soft)] group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}
