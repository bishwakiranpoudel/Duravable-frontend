"use client";

import {
  demoBenefitMix,
  demoMonthlyTouchpoints,
  demoVisitMix,
} from "@/lib/member-dashboard-demo";
import { BenefitMixChart, TouchpointsBarChart, VisitMixChart } from "@/components/dashboard/MemberMetricsCharts";

/** Client-only metrics block (Recharts) — loaded in a separate chunk to avoid dev ChunkLoadError / RSC preload issues. */
export default function ProfileMetricsCharts() {
  return (
    <section className="mt-10">
      <p className="text-xs font-display font-bold uppercase tracking-wider text-[hsl(var(--warm-stone))]">Metrics</p>
      <h2 className="font-display text-lg font-bold text-[hsl(var(--charcoal))]">Care overview</h2>
      <p className="mt-1 text-sm font-body text-[hsl(var(--warm-stone))] max-w-2xl">
        Illustrative breakdowns for demos; replace with your analytics when available.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-white p-4 shadow-card">
          <h3 className="font-display text-sm font-bold text-[hsl(var(--charcoal))]">Visit mix</h3>
          <p className="mt-0.5 text-xs font-body text-[hsl(var(--warm-stone))]">By care setting (sample)</p>
          <VisitMixChart data={demoVisitMix} />
        </div>
        <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-white p-4 shadow-card">
          <h3 className="font-display text-sm font-bold text-[hsl(var(--charcoal))]">Benefit focus</h3>
          <p className="mt-0.5 text-xs font-body text-[hsl(var(--warm-stone))]">Utilization mix (sample)</p>
          <BenefitMixChart data={demoBenefitMix} />
        </div>
        <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-white p-4 shadow-card md:col-span-2 xl:col-span-1">
          <h3 className="font-display text-sm font-bold text-[hsl(var(--charcoal))]">Recent months</h3>
          <p className="mt-0.5 text-xs font-body text-[hsl(var(--warm-stone))]">Visits per month (sample)</p>
          <TouchpointsBarChart data={demoMonthlyTouchpoints} />
        </div>
      </div>
    </section>
  );
}
