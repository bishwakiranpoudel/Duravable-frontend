import Link from "next/link";
import { DvrableWordmark } from "@/components/Wordmark";

/**
 * Website footer spec: Charcoal bg, spaced wordmark (cream + copper V), tagline, links, copyright.
 */
export function SiteFooter() {
  return (
    <footer className="bg-[hsl(var(--charcoal))] text-[hsl(var(--cream))] pt-20 pb-10 px-4">
      <div className="mx-auto max-w-3xl flex flex-col items-center text-center gap-3">
        <DvrableWordmark variant="dark" size="lg" />
        <p className="font-body italic text-sm text-[hsl(var(--cream))]">
          by design.
        </p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
          <Link
            href="/"
            className="text-[13px] text-[hsl(var(--sand))] hover:text-[hsl(var(--cream))] no-underline hover:underline"
          >
            Chat
          </Link>
          <Link
            href="/appointments"
            className="text-[13px] text-[hsl(var(--sand))] hover:text-[hsl(var(--cream))] no-underline hover:underline"
          >
            My Appointments
          </Link>
        </nav>
        <p className="text-xs text-[hsl(var(--sand))] mt-4">
          © {new Date().getFullYear()} DVRABLE Systems PBC
        </p>
      </div>
    </footer>
  );
}
