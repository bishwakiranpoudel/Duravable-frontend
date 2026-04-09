import Link from "next/link";
import { DvrableWordmark } from "@/components/Wordmark";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex h-16 items-center justify-center border-b border-[hsl(var(--sand))] px-4">
        <DvrableWordmark variant="light" />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-[hsl(var(--charcoal))]">404</h1>
        <p className="text-lg text-[hsl(var(--warm-stone))] font-body text-center max-w-md">
          Page not found.
        </p>
        <Link
          href="/"
          className="text-[hsl(var(--copper))] font-display font-semibold no-underline hover:underline"
        >
          Return to chat
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
