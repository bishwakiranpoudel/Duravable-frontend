import { Suspense } from "react";
import HomePage from "@/components/HomePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-[100dvh] items-center justify-center bg-background" aria-label="Loading" />}>
      <HomePage />
    </Suspense>
  );
}
