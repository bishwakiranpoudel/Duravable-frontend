"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarCheck, MessageSquare, ChevronLeft, CalendarX, Video } from "lucide-react";
import type { AppointmentRecord } from "@/lib/conversation-types";
import { DvrableWordmark } from "@/components/Wordmark";
import { SiteFooter } from "@/components/SiteFooter";

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

function InlineLoadingCard() {
  return (
    <div
      className="rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-6 py-12 cream-pulse flex flex-col items-center gap-3"
      aria-busy
      aria-label="Loading"
    >
      <div className="h-0.5 w-48 max-w-full bg-[hsl(var(--sand))] overflow-hidden rounded-full">
        <div className="h-full w-1/3 bg-[hsl(var(--copper))] nav-progress-indeterminate" />
      </div>
      <p className="text-sm text-[hsl(var(--warm-stone))] font-body">Loading appointments</p>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "My Appointments | DVRABLE";
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
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduled = appointments.filter((a) => a.status === "scheduled");
  const upcoming = scheduled.filter((a) => isUpcoming(a.datetime));
  const past = scheduled.filter((a) => !isUpcoming(a.datetime));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-[hsl(var(--sand))] bg-white px-4">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-[4px] hover:bg-[hsl(var(--cream))] transition-colors text-[hsl(var(--charcoal))]"
          aria-label="Back to chat"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </Link>
        <h1 className="font-display text-lg font-bold text-[hsl(var(--charcoal))]">
          My Appointments
        </h1>
        <div className="ml-auto hidden sm:block">
          <DvrableWordmark variant="light" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {loading ? (
            <InlineLoadingCard />
          ) : scheduled.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] text-[hsl(var(--warm-stone))] mb-4">
                <CalendarX className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-display font-bold text-[hsl(var(--charcoal))] mb-1">
                No upcoming appointments
              </h2>
              <p className="text-sm text-[hsl(var(--warm-stone))] max-w-xs mb-6 font-body">
                Start a chat to find a doctor and book a visit. You can schedule visits and add them to your calendar from the chat.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-[4px] bg-[hsl(var(--copper))] px-5 py-2.5 text-sm font-display font-bold text-white hover:opacity-90 transition-opacity no-underline"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                Start chat
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-xs font-display font-bold uppercase tracking-wider text-[hsl(var(--warm-stone))] mb-3">
                    Upcoming
                  </h2>
                  <ul className="space-y-3">
                    {upcoming.map((apt) => {
                      const isDigital = apt.appointment_type === "digital";
                      return (
                        <li key={apt.id}>
                          <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-white p-4 shadow-card">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] text-[hsl(var(--copper))]">
                                <CalendarCheck className="h-5 w-5" strokeWidth={1.5} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-display font-bold text-[hsl(var(--charcoal))]">
                                  {apt.doctor_name}
                                  {isDigital && (
                                    <span className="ml-2 text-xs font-normal text-[hsl(var(--warm-stone))]">
                                      (Digital)
                                    </span>
                                  )}
                                </p>
                                {apt.doctor_specialty && !isDigital && (
                                  <p className="text-sm text-[hsl(var(--warm-stone))] mt-0.5 font-body">
                                    {apt.doctor_specialty}
                                  </p>
                                )}
                                <p className="text-sm text-[hsl(var(--warm-stone))] mt-1 font-body">
                                  {formatAppointmentDateTime(apt.datetime)}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                                {isDigital && apt.id && (
                                  <Link
                                    href={`/digitaldoctor/${apt.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-[4px] bg-[hsl(var(--copper))] px-3 py-2 text-sm font-display font-bold text-white hover:opacity-90 transition-opacity no-underline"
                                    aria-label={`Join digital visit with ${apt.doctor_name}`}
                                  >
                                    <Video className="h-4 w-4" strokeWidth={1.5} />
                                    Join visit
                                  </Link>
                                )}
                                <Link
                                  href={`/?conversation=${encodeURIComponent(apt.conversation_id)}`}
                                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-[hsl(var(--copper))] bg-white px-3 py-2 text-sm font-body font-medium text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] transition-colors no-underline"
                                  aria-label={`Open chat for appointment with ${apt.doctor_name}`}
                                >
                                  <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                                  Open chat
                                </Link>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <h2 className="text-xs font-display font-bold uppercase tracking-wider text-[hsl(var(--warm-stone))] mb-3">
                    Past
                  </h2>
                  <ul className="space-y-3">
                    {past.map((apt) => {
                      const isDigital = apt.appointment_type === "digital";
                      return (
                        <li key={apt.id}>
                          <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))]/80 p-4 opacity-90">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] text-[hsl(var(--warm-stone))]">
                                <CalendarCheck className="h-5 w-5" strokeWidth={1.5} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-display font-bold text-[hsl(var(--charcoal))]">
                                  {apt.doctor_name}
                                  {isDigital && (
                                    <span className="ml-2 text-xs font-normal text-[hsl(var(--warm-stone))]">
                                      (Digital)
                                    </span>
                                  )}
                                </p>
                                {apt.doctor_specialty && !isDigital && (
                                  <p className="text-sm text-[hsl(var(--warm-stone))] mt-0.5 font-body">
                                    {apt.doctor_specialty}
                                  </p>
                                )}
                                <p className="text-sm text-[hsl(var(--warm-stone))] mt-1 font-body">
                                  {formatAppointmentDateTime(apt.datetime)}
                                </p>
                              </div>
                              <Link
                                href={`/?conversation=${encodeURIComponent(apt.conversation_id)}`}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-[4px] border border-[hsl(var(--sand))] px-3 py-2 text-sm font-body font-medium text-[hsl(var(--warm-stone))] hover:bg-white transition-colors no-underline"
                                aria-label={`Open chat for past appointment with ${apt.doctor_name}`}
                              >
                                <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                                Open chat
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
