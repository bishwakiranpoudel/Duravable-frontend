"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarPlus, ChevronDown, Download, ExternalLink } from "lucide-react";
import type { CalendarEventPayload } from "@/lib/mockData";
import {
  buildCalendarIcs,
  buildGoogleCalendarUrl,
  buildOutlookLiveUrl,
  buildOutlookOfficeUrl,
  buildYahooCalendarUrl,
} from "@/lib/calendar-export";

interface CalendarEventActionsProps {
  event: CalendarEventPayload;
  className?: string;
}

export function CalendarEventActions({ event, className = "" }: CalendarEventActionsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const googleUrl = buildGoogleCalendarUrl(event);
  const outlookLiveUrl = buildOutlookLiveUrl(event);
  const outlookOfficeUrl = buildOutlookOfficeUrl(event);
  const yahooUrl = buildYahooCalendarUrl(event);

  const downloadIcs = useCallback(() => {
    const ics = buildCalendarIcs(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.name.replace(/[^\w\s-]/g, "").slice(0, 40) || "visit"}.ics`;
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }, [event]);

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 w-full min-h-[44px] items-center justify-center gap-2 rounded-[4px] bg-[hsl(var(--copper))] px-4 py-2.5 text-[13px] font-display font-bold text-white shadow-card hover:opacity-90 transition-opacity"
      >
        <CalendarPlus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        Add to calendar
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-[min(70vh,22rem)] overflow-y-auto rounded-[4px] border border-[hsl(var(--sand))] bg-white py-1 shadow-elevated sm:left-0 sm:right-auto sm:min-w-[260px]"
          role="menu"
        >
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-body text-[hsl(var(--charcoal))] no-underline hover:bg-[hsl(var(--cream))] transition-colors"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-[hsl(var(--copper))]" strokeWidth={1.5} />
            Google Calendar
          </a>
          <a
            href={outlookLiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-body text-[hsl(var(--charcoal))] no-underline hover:bg-[hsl(var(--cream))] transition-colors"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-[hsl(var(--copper))]" strokeWidth={1.5} />
            Outlook.com
          </a>
          <a
            href={outlookOfficeUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-body text-[hsl(var(--charcoal))] no-underline hover:bg-[hsl(var(--cream))] transition-colors"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-[hsl(var(--copper))]" strokeWidth={1.5} />
            Microsoft 365 (Outlook)
          </a>
          <a
            href={yahooUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-body text-[hsl(var(--charcoal))] no-underline hover:bg-[hsl(var(--cream))] transition-colors"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-[hsl(var(--copper))]" strokeWidth={1.5} />
            Yahoo Calendar
          </a>
          <div className="my-1 border-t border-[hsl(var(--sand))]" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-body text-[hsl(var(--charcoal))] hover:bg-[hsl(var(--cream))] transition-colors"
            onClick={downloadIcs}
          >
            <Download className="h-4 w-4 shrink-0 text-[hsl(var(--copper))]" strokeWidth={1.5} />
            Apple Calendar (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
