"use client";

import { useEffect, useMemo, useState, type ReactNode, type ComponentType } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  CalendarCheck,
  Cake,
  ChevronLeft,
  CreditCard,
  FileText,
  IdCard,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Stethoscope,
  UserRound,
  Video,
  CalendarX,
  LayoutDashboard,
} from "lucide-react";
import type { AppointmentRecord } from "@/lib/conversation-types";
import { demoMemberDashboard } from "@/lib/member-dashboard-demo";
import { DvrableWordmark } from "@/components/Wordmark";
import { SiteFooter } from "@/components/SiteFooter";

const ProfileMetricsCharts = dynamic(() => import("@/components/dashboard/ProfileMetricsCharts"), {
  ssr: false,
  loading: () => (
    <section className="mt-10" aria-busy aria-label="Loading charts">
      <p className="text-xs font-display font-bold uppercase tracking-wider text-[hsl(var(--warm-stone))]">Metrics</p>
      <h2 className="font-display text-lg font-bold text-[hsl(var(--charcoal))]">Care overview</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex h-[200px] items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] cream-pulse"
          />
        ))}
      </div>
    </section>
  ),
});

function formatAppointmentDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Icon in a square tile — matches My Appointments / chat list affordances. */
function IconTile({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] text-[hsl(var(--copper))]">
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
  icon: Icon,
}: {
  label: string;
  children: ReactNode;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-[hsl(var(--sand))] last:border-0">
      {Icon ? (
        <IconTile>
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </IconTile>
      ) : null}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--warm-stone))]">
          {label}
        </p>
        <div className="mt-1 text-sm font-body text-[hsl(var(--charcoal))] leading-snug">{children}</div>
      </div>
    </div>
  );
}

function ProfilePanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 h-full flex-col rounded-[4px] border border-[hsl(var(--sand))] bg-white p-4 shadow-card sm:p-5 ${className}`}
    >
      <h2 className="shrink-0 text-xs font-display font-bold uppercase tracking-wider text-[hsl(var(--warm-stone))] mb-1 border-l-[3px] border-l-[hsl(var(--copper))] pl-3 -ml-px">
        {title}
      </h2>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const m = demoMemberDashboard;
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loadingApts, setLoadingApts] = useState(true);

  useEffect(() => {
    document.title = "Dashboard | DVRABLE";
    return () => {
      document.title = "DVRABLE";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAppointments(data.appointments ?? []);
        }
      } catch {
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoadingApts(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduled = useMemo(
    () => appointments.filter((a) => a.status === "scheduled"),
    [appointments],
  );
  const upcoming = useMemo(() => scheduled.filter((a) => isUpcoming(a.datetime)), [scheduled]);

  const phoneHref = `tel:${m.pcpPhone.replace(/\D/g, "")}`;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-[hsl(var(--sand))] bg-white px-4">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-[4px] hover:bg-[hsl(var(--cream))] transition-colors text-[hsl(var(--charcoal))] no-underline"
          aria-label="Back to chat"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </Link>
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] text-[hsl(var(--copper))]">
            <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-[hsl(var(--charcoal))] truncate">Dashboard</h1>
            <p className="hidden sm:block text-[11px] font-body text-[hsl(var(--warm-stone))]">Coverage, plan, and visits</p>
          </div>
        </div>
        <div className="ml-auto hidden sm:block">
          <DvrableWordmark variant="light" />
        </div>
      </header>

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5 xl:max-w-7xl sm:py-8">
          <p className="text-xs font-display font-bold uppercase tracking-wider text-[hsl(var(--warm-stone))] mb-3">
            Overview
          </p>

          <div className="grid grid-cols-12 gap-3 sm:gap-4 [grid-auto-rows:minmax(0,auto)] items-stretch">
            <article className="col-span-12 flex h-full min-h-0 flex-col rounded-[4px] border border-[hsl(var(--sand))] bg-white p-5 shadow-card sm:p-6 md:col-span-6 lg:col-span-7 lg:col-start-1 lg:row-start-1">
              <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-start">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[4px] bg-[hsl(var(--copper))] text-lg font-display font-bold text-white"
                  aria-hidden
                >
                  {initialsFromName(m.primaryName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[hsl(var(--charcoal))] leading-tight">
                    {m.primaryName}
                  </h2>
                  <p className="mt-2 text-sm font-body text-[hsl(var(--warm-stone))]">
                    {m.sex}, {m.ageYears} years
                    <span className="mx-2 text-[hsl(var(--sand))]">·</span>
                    <span className="font-display font-semibold text-[hsl(var(--brand-success))]">{m.statusLabel}</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 border-t border-[hsl(var(--sand))] pt-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
                {[
                  { label: "Coverage", icon: Shield, value: m.coverage },
                  { label: "Member ID", icon: IdCard, value: m.memberId },
                  { label: "Member name", icon: UserRound, value: m.dependentMemberName },
                  { label: "PCP name", icon: Stethoscope, value: m.pcpName },
                ].map(({ label, icon: Icon, value }) => (
                  <div key={label} className="flex gap-3">
                    <IconTile>
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--warm-stone))]">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-body text-[hsl(var(--charcoal))]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <ProfilePanel
              title="Address"
              className="col-span-12 md:col-span-6 lg:col-span-5 lg:col-start-8 lg:row-start-1"
            >
              <FieldRow label="Street" icon={MapPin}>
                {m.addressLine}
              </FieldRow>
              <FieldRow label="Date of birth" icon={Cake}>
                {m.dateOfBirth}
              </FieldRow>
            </ProfilePanel>

            <ProfilePanel
              title="Plan"
              className="col-span-12 md:col-span-6 lg:col-span-5 lg:col-start-1 lg:row-start-2"
            >
              <p className="text-[11px] font-body text-[hsl(var(--warm-stone))] mb-3 -mt-1">{m.planGroup}</p>
              <FieldRow label="Plan type" icon={FileText}>
                {m.planType}
              </FieldRow>
              <FieldRow label="Plan ID">
                <span className="font-display font-semibold">{m.planId}</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-[4px] border border-[hsl(var(--copper))] bg-white px-3 py-2 text-xs font-display font-semibold text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] transition-colors"
                  >
                    Benefits summary
                  </button>
                  <button
                    type="button"
                    className="rounded-[4px] border border-[hsl(var(--copper))] bg-white px-3 py-2 text-xs font-display font-semibold text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] transition-colors"
                  >
                    Schedule of care
                  </button>
                </div>
              </FieldRow>
              <div className="mt-auto grid min-w-0 grid-cols-1 gap-2 border-t border-[hsl(var(--sand))] pt-4 sm:grid-cols-3">
                <div className="min-w-0 rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-3 py-2.5">
                  <p className="text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--warm-stone))]">
                    Division
                  </p>
                  <p className="mt-1 text-sm font-body font-medium text-[hsl(var(--charcoal))] break-words">
                    {m.divisionId}
                  </p>
                </div>
                <div className="min-w-0 rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-3 py-2.5">
                  <p className="text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--warm-stone))]">
                    Plan start
                  </p>
                  <p className="mt-1 text-sm font-body font-medium text-[hsl(var(--charcoal))]">{m.planStart}</p>
                </div>
                <div className="min-w-0 rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-3 py-2.5">
                  <p className="text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--warm-stone))]">
                    Plan end
                  </p>
                  <p className="mt-1 text-sm font-body font-medium text-[hsl(var(--charcoal))]">{m.planEnd}</p>
                </div>
              </div>
            </ProfilePanel>

            <ProfilePanel
              title="Primary care"
              className="col-span-12 md:col-span-6 lg:col-span-7 lg:col-start-6 lg:row-start-2"
            >
              <p className="text-[11px] font-body text-[hsl(var(--warm-stone))] mb-3 -mt-1">Attributed PCP</p>
              <FieldRow label="Provider" icon={Stethoscope}>
                {m.currentPcp}
              </FieldRow>
              <FieldRow label="NPI">{m.pcpNpi}</FieldRow>
              <FieldRow label="Phone" icon={Phone}>
                <a
                  href={phoneHref}
                  className="text-[hsl(var(--copper))] font-display font-semibold no-underline hover:underline"
                >
                  {m.pcpPhone}
                </a>
              </FieldRow>
              <FieldRow label="Provider ID" icon={CreditCard}>
                {m.pcpProviderId}
              </FieldRow>
            </ProfilePanel>
          </div>

          <section className="mt-10">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-display font-bold uppercase tracking-wider text-[hsl(var(--warm-stone))]">
                  Scheduled
                </p>
                <h2 className="font-display text-lg font-bold text-[hsl(var(--charcoal))]">Appointments</h2>
              </div>
              <Link
                href="/appointments"
                className="text-sm font-display font-semibold text-[hsl(var(--copper))] no-underline hover:underline"
              >
                Open full list
              </Link>
            </div>

            {loadingApts ? (
              <div
                className="rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-6 py-12 cream-pulse flex flex-col items-center gap-3"
                aria-busy
                aria-label="Loading appointments"
              >
                <div className="h-0.5 w-48 max-w-full bg-[hsl(var(--sand))] overflow-hidden rounded-full">
                  <div className="h-full w-1/3 bg-[hsl(var(--copper))] nav-progress-indeterminate" />
                </div>
                <p className="text-sm text-[hsl(var(--warm-stone))] font-body">Loading your schedule</p>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-6 py-14 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-white text-[hsl(var(--warm-stone))]">
                  <CalendarX className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-base font-bold text-[hsl(var(--charcoal))]">Nothing on the calendar</h3>
                <p className="mt-1 max-w-sm text-sm text-[hsl(var(--warm-stone))] font-body">
                  When you book through chat, upcoming visits will appear here.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-[hsl(var(--copper))] px-5 py-2.5 text-sm font-display font-bold text-white hover:opacity-90 transition-opacity no-underline"
                >
                  <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                  Start chat
                </Link>
              </div>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {upcoming.map((apt) => {
                  const isDigital = apt.appointment_type === "digital";
                  return (
                    <li key={apt.id}>
                      <div className="h-full rounded-[4px] border border-[hsl(var(--sand))] bg-white p-4 shadow-card">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] text-[hsl(var(--copper))]">
                            <CalendarCheck className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-display font-bold text-[hsl(var(--charcoal))]">
                              {apt.doctor_name}
                              {isDigital && (
                                <span className="ml-2 text-xs font-normal text-[hsl(var(--warm-stone))]">(Digital)</span>
                              )}
                            </p>
                            {apt.doctor_specialty && !isDigital && (
                              <p className="text-sm text-[hsl(var(--warm-stone))] mt-0.5 font-body">{apt.doctor_specialty}</p>
                            )}
                            <p className="text-sm text-[hsl(var(--warm-stone))] mt-1 font-body">
                              {formatAppointmentDateTime(apt.datetime)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2">
                            {isDigital && apt.id && (
                              <Link
                                href={`/digitaldoctor/${apt.id}`}
                                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[hsl(var(--copper))] px-3 py-2 text-xs font-display font-bold text-white hover:opacity-90 transition-opacity no-underline"
                              >
                                <Video className="h-3.5 w-3.5" strokeWidth={1.5} />
                                Join
                              </Link>
                            )}
                            <Link
                              href={`/?conversation=${encodeURIComponent(apt.conversation_id)}`}
                              className="inline-flex items-center gap-1.5 rounded-[4px] border border-[hsl(var(--copper))] bg-white px-3 py-2 text-xs font-body font-medium text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] transition-colors no-underline"
                            >
                              Chat
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <ProfileMetricsCharts />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
