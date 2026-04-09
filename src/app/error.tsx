"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 bg-white py-16">
      <h2 className="text-lg font-display font-bold text-[hsl(var(--charcoal))]">
        Something went wrong
      </h2>
      <p className="text-sm text-[hsl(var(--warm-stone))] text-center max-w-md font-body">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-[4px] bg-[hsl(var(--copper))] px-4 py-2.5 text-sm font-display font-bold text-white hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-[4px] border border-[hsl(var(--copper))] px-4 py-2.5 text-sm font-body font-medium text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] no-underline inline-flex items-center"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
