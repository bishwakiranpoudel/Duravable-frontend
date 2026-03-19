"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Video, CalendarCheck } from "lucide-react";
import { DIGITAL_DOCTOR } from "@/lib/constants";
import type { AppointmentRecord } from "@/lib/conversation-types";

function formatAppointmentDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DigitalDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const appointmentId = id as string;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/appointments/${encodeURIComponent(appointmentId)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAppointment(data.appointment ?? null);
        } else if (!cancelled) {
          setAppointment(null);
        }
      } catch {
        if (!cancelled) setAppointment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    document.title = appointment
      ? `Digital visit with ${DIGITAL_DOCTOR.name} | DVRABLE`
      : "Digital visit | DVRABLE";
    return () => {
      document.title = "DVRABLE";
    };
  }, [appointment]);

  if (loading || !id) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-semibold text-foreground">
            Digital visit
          </h1>
        </header>
        <main className="flex-1 flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
          <div className="flex flex-col items-center gap-3 text-foreground-secondary">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-semibold text-foreground">
            Digital visit
          </h1>
        </header>
        <main className="flex-1 flex items-center justify-center px-4" style={{ background: "var(--gradient-warm)" }}>
          <div className="text-center max-w-sm">
            <p className="text-foreground-secondary mb-4">
              Appointment not found or it may have expired.
            </p>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              View My Appointments
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isUpcoming = new Date(appointment.datetime) >= new Date();

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
          Your digital visit with {DIGITAL_DOCTOR.name}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ background: "var(--gradient-warm)" }}>
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{appointment.doctor_name}</p>
                <p className="text-sm text-foreground-secondary">
                  {appointment.doctor_specialty ?? "Digital Doctor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-foreground-secondary mb-6">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                {formatAppointmentDateTime(appointment.datetime)}
              </span>
            </div>

            {isUpcoming ? (
              <div className="space-y-3">
                <p className="text-sm text-foreground-secondary">
                  Your visit is scheduled. When it’s time, you can join from here or from My Appointments.
                </p>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  disabled
                  aria-disabled
                >
                  <Video className="h-4 w-4" />
                  Join visit (coming soon)
                </button>
                <p className="text-xs text-foreground-tertiary text-center">
                  Video and chat will be available here when your appointment time arrives.
                </p>
              </div>
            ) : (
              <p className="text-sm text-foreground-secondary">
                This visit was scheduled for the past. You can open the chat to see your conversation or book a new visit.
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <Link
                href={`/?conversation=${encodeURIComponent(appointment.conversation_id)}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Open chat for this visit
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
