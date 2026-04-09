import { cn } from "@/lib/utils";

type WordmarkVariant = "light" | "dark";

const LETTERS = ["D", "V", "R", "A", "B", "L", "E"] as const;

/**
 * Primary wordmark: Georgia Bold, letter-spaced, copper V only.
 * @see DVRABLE Brand Guide v4.1
 */
export function DvrableWordmark({
  variant = "light",
  className,
  size = "default",
}: {
  variant?: WordmarkVariant;
  className?: string;
  /** default ≈14–16px cap height context; lg for sidebar hero */
  size?: "default" | "lg";
}) {
  const letterColor =
    variant === "light" ? "text-[hsl(var(--charcoal))]" : "text-[hsl(var(--cream))]";
  const vColor = "text-[hsl(var(--copper))]";
  const textSize = size === "lg" ? "text-xl sm:text-2xl" : "text-sm sm:text-base";

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-[0.35em] font-display font-bold uppercase tracking-[0.02em]",
        textSize,
        className
      )}
      aria-label="DVRABLE"
    >
      {LETTERS.map((ch) => (
        <span key={ch} className={ch === "V" ? vColor : letterColor}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** Standalone V mark: Georgia Bold, copper. */
export function DvrableVMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz =
    size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <span
      className={cn(
        "font-display font-bold text-[hsl(var(--copper))]",
        sz,
        className
      )}
      aria-hidden
    >
      V
    </span>
  );
}
