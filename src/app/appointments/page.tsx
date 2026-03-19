"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarCheck, MessageSquare, ChevronLeft, CalendarX, Video } from "lucide-react";
import type { AppointmentRecord } from "@/lib/conversation-types";

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
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground"
          aria-label="Back to chat"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold text-foreground">
          My Appointments
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ background: "var(--gradient-warm)" }}>
        <div className="mx-auto max-w-2xl px-4 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-foreground-secondary">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm">Loading appointments…</p>
            </div>
          ) : scheduled.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 text-foreground-tertiary mb-4">
                <CalendarX className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                No upcoming appointments
              </h2>
              <p className="text-sm text-foreground-secondary max-w-xs mb-6">
                Start a chat to find a doctor and book a visit. You can schedule appointments and add them to your calendar from the chat.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="h-4 w-4" />
                Start chat
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-3">
                    Upcoming
                  </h2>
                  <ul className="space-y-3">
                    {upcoming.map((apt) => {
                      const isDigital = apt.appointment_type === "digital";
                      return (
                        <li key={apt.id}>
                          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                <CalendarCheck className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground">
                                  {apt.doctor_name}
                                  {isDigital && (
                                    <span className="ml-2 text-xs font-normal text-foreground-secondary">(Digital)</span>
                                  )}
                                </p>
                                {apt.doctor_specialty && !isDigital && (
                                  <p className="text-sm text-foreground-secondary mt-0.5">
                                    {apt.doctor_specialty}
                                  </p>
                                )}
                                <p className="text-sm text-foreground-tertiary mt-1">
                                  {formatAppointmentDateTime(apt.datetime)}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                                {isDigital && apt.id && (
                                  <Link
                                    href={`/digitaldoctor/${apt.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                                    aria-label={`Join digital visit with ${apt.doctor_name}`}
                                  >
                                    <Video className="h-4 w-4" />
                                    Join visit
                                  </Link>
                                )}
                                <Link
                                  href={`/?conversation=${encodeURIComponent(apt.conversation_id)}`}
                                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                                    isDigital
                                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                                      : "bg-primary/10 text-primary hover:bg-primary/20"
                                  }`}
                                  aria-label={`Open chat for appointment with ${apt.doctor_name}`}
                                >
                                  <MessageSquare className="h-4 w-4" />
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
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-3">
                    Past
                  </h2>
                  <ul className="space-y-3">
                    {past.map((apt) => {
                      const isDigital = apt.appointment_type === "digital";
                      return (
                        <li key={apt.id}>
                          <div className="rounded-2xl border border-border bg-card/80 p-4 opacity-80">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground-tertiary">
                                <CalendarCheck className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground">
                                  {apt.doctor_name}
                                  {isDigital && (
                                    <span className="ml-2 text-xs font-normal text-foreground-secondary">(Digital)</span>
                                  )}
                                </p>
                                {apt.doctor_specialty && !isDigital && (
                                  <p className="text-sm text-foreground-secondary mt-0.5">
                                    {apt.doctor_specialty}
                                  </p>
                                )}
                                <p className="text-sm text-foreground-tertiary mt-1">
                                  {formatAppointmentDateTime(apt.datetime)}
                                </p>
                              </div>
                              <Link
                                href={`/?conversation=${encodeURIComponent(apt.conversation_id)}`}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-muted transition-colors"
                                aria-label={`Open chat for past appointment with ${apt.doctor_name}`}
                              >
                                <MessageSquare className="h-4 w-4" />
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
    </div>
  );
}
