/**
 * Brand: no spinners or dots. Copper-on-sand bar + calm copy; cream surface uses
 * .cream-pulse on a layer behind content so the loader stays readable.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
      <div
        className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded border border-[hsl(var(--sand))] bg-white"
        aria-hidden
      >
        <span className="font-display text-base font-bold text-[hsl(var(--copper))]">
          V
        </span>
      </div>
      <div className="max-w-[88%] sm:max-w-[80%] space-y-1">
        <span className="text-[10px] sm:text-[11px] font-bold text-[hsl(var(--charcoal))] font-display ml-0.5">
          DVRABLE
        </span>
        <div
          className="relative overflow-hidden rounded rounded-tl-sm border border-[hsl(var(--sand))] min-h-[3.25rem] px-4 sm:px-5 py-3 sm:py-4 flex flex-col justify-center gap-2.5"
          aria-busy
          aria-live="polite"
          aria-label="DVRABLE is thinking"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[hsl(var(--cream))] cream-pulse"
            aria-hidden
          />
          <div className="relative z-[1] flex flex-col justify-center gap-2.5">
            <span className="sr-only">DVRABLE is thinking.</span>
            <div
              className="h-0.5 w-full max-w-[220px] rounded-full bg-[hsl(var(--sand))] overflow-hidden"
              aria-hidden
            >
              <div className="h-full w-2/5 rounded-full bg-[hsl(var(--copper))] nav-progress-indeterminate" />
            </div>
            <p className="text-[12px] sm:text-[13px] text-[hsl(var(--warm-stone))] font-body italic leading-snug">
              Thinking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
