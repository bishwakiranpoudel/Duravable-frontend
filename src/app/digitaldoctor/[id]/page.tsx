"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Video, CalendarCheck, LayoutDashboard } from "lucide-react";
import { DIGITAL_DOCTOR } from "@/lib/constants";
import type { AppointmentRecord } from "@/lib/conversation-types";
import { DvrableWordmark } from "@/components/Wordmark";
import { SiteFooter } from "@/components/SiteFooter";

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

function LoadingMain() {
  return (
    <main className="flex-1 flex items-center justify-center bg-white px-4">
      <div
        className="w-full max-w-sm rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] px-6 py-10 cream-pulse flex flex-col items-center gap-3"
        aria-busy
        aria-label="Loading"
      >
        <div className="h-0.5 w-full bg-[hsl(var(--sand))] overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-[hsl(var(--copper))] nav-progress-indeterminate" />
        </div>
        <p className="text-sm text-[hsl(var(--warm-stone))] font-body">Loading</p>
      </div>
    </main>
  );
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
      <div className="min-h-[100dvh] flex flex-col bg-white">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-[hsl(var(--sand))] bg-white px-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-[4px] hover:bg-[hsl(var(--cream))] transition-colors text-[hsl(var(--charcoal))]"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
          </Link>
          <h1 className="font-display text-lg font-bold text-[hsl(var(--charcoal))]">
            Digital visit
          </h1>
          <div className="ml-auto hidden sm:block">
            <DvrableWordmark variant="light" />
          </div>
        </header>
        <LoadingMain />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-white">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-[hsl(var(--sand))] bg-white px-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-[4px] hover:bg-[hsl(var(--cream))] transition-colors text-[hsl(var(--charcoal))]"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
          </Link>
          <h1 className="font-display text-lg font-bold text-[hsl(var(--charcoal))]">
            Digital visit
          </h1>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 bg-white">
          <div className="text-center max-w-sm">
            <p className="text-[hsl(var(--warm-stone))] mb-4 font-body">
              Appointment not found or it may have expired.
            </p>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 rounded-[4px] bg-[hsl(var(--copper))] px-4 py-2.5 text-sm font-display font-bold text-white hover:opacity-90 no-underline"
            >
              View My Appointments
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const isUpcoming = new Date(appointment.datetime) >= new Date();

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
        <h1 className="font-display text-lg font-bold text-[hsl(var(--charcoal))] min-w-0 truncate pr-2">
          Your digital visit with {DIGITAL_DOCTOR.name}
        </h1>
        <div className="ml-auto hidden sm:block shrink-0">
          <DvrableWordmark variant="light" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-white p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] text-[hsl(var(--copper))]">
                <Video className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display font-bold text-[hsl(var(--charcoal))]">
                  {appointment.doctor_name}
                </p>
                <p className="text-sm text-[hsl(var(--warm-stone))] font-body">
                  {appointment.doctor_specialty ?? "Digital Doctor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[hsl(var(--warm-stone))] mb-6 font-body">
              <CalendarCheck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="text-sm">
                {formatAppointmentDateTime(appointment.datetime)}
              </span>
            </div>

            {isUpcoming ? (
              <div className="space-y-3">
                <p className="text-sm text-[hsl(var(--warm-stone))] font-body">
                  Your visit is scheduled. When it is time, you can join from here or from My Appointments.
                </p>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[hsl(var(--copper))] px-4 py-3 text-sm font-display font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  disabled
                  aria-disabled
                >
                  <Video className="h-4 w-4" strokeWidth={1.5} />
                  Join visit (coming soon)
                </button>
                <p className="text-xs text-[hsl(var(--warm-stone))] text-center font-body">
                  Video and chat will be available here when your appointment time arrives.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--warm-stone))] font-body">
                This visit was scheduled for the past. Open the chat to see your conversation or book a new visit.
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-[hsl(var(--sand))] flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href={`/?conversation=${encodeURIComponent(appointment.conversation_id)}`}
                className="inline-flex items-center gap-2 text-sm font-display font-semibold text-[hsl(var(--copper))] no-underline hover:underline"
              >
                Open chat for this visit
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-[hsl(var(--copper))] bg-white px-4 py-2.5 text-sm font-display font-semibold text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] transition-colors no-underline sm:shrink-0"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
