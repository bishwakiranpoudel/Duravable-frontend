import { Suspense } from "react";
import HomePage from "@/components/HomePage";

function PageLoading() {
  return (
    <div
      className="flex h-[100dvh] w-full items-center justify-center bg-white px-6"
      aria-busy
      aria-label="Loading"
    >
      <div className="w-full max-w-md rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-8 py-12 cream-pulse">
        <div className="h-0.5 w-full bg-[hsl(var(--sand))] overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-[hsl(var(--copper))] nav-progress-indeterminate" />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomePage />
    </Suspense>
  );
}
