import Link from "next/link";
import { MessageSquare, CalendarCheck, LayoutDashboard } from "lucide-react";
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
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-[hsl(var(--sand))] hover:text-[hsl(var(--cream))] no-underline hover:underline"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={1.5} aria-hidden />
            Chat
          </Link>
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1.5 text-[13px] text-[hsl(var(--sand))] hover:text-[hsl(var(--cream))] no-underline hover:underline"
          >
            <CalendarCheck className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={1.5} aria-hidden />
            My Appointments
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] text-[hsl(var(--sand))] hover:text-[hsl(var(--cream))] no-underline hover:underline"
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={1.5} aria-hidden />
            Dashboard
          </Link>
        </nav>
        <p className="text-xs text-[hsl(var(--sand))] mt-4">
          © {new Date().getFullYear()} DVRABLE Systems PBC
        </p>
      </div>
    </footer>
  );
}
