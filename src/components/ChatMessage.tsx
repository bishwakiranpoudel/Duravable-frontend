"use client";

import ReactMarkdown from "react-markdown";
import DoctorCard from "./DoctorCard";
import type { ChatMessage as ChatMessageType, Doctor } from "@/lib/mockData";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, CircleCheckBig, Video, LayoutDashboard } from "lucide-react";
import { CalendarEventActions } from "@/components/CalendarEventActions";

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectDoctor: (doctor: Doctor) => void;
}

const authIcons: Record<number, React.ReactNode> = {
  1: <ShieldCheck className="h-4 w-4 text-[hsl(var(--copper))]" strokeWidth={1.5} />,
  2: <CircleCheckBig className="h-4 w-4 text-[hsl(var(--copper))]" strokeWidth={1.5} />,
  3: <CircleCheckBig className="h-4 w-4 text-[hsl(var(--copper))]" strokeWidth={1.5} />,
};

export default function ChatMessageComponent({
  message,
  onSelectDoctor,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded border text-xs font-bold font-display ${
          isUser
            ? "border-[hsl(var(--copper))] bg-[hsl(var(--copper))] text-white"
            : "border-[hsl(var(--sand))] bg-white text-[hsl(var(--copper))]"
        }`}
      >
        {isUser ? "AJ" : <span className="text-sm font-bold">V</span>}
      </div>

      <div className="max-w-[88%] sm:max-w-[80%] md:max-w-[70%] space-y-2 sm:space-y-3">
        {!isUser && (
          <span className="text-[10px] sm:text-[11px] font-bold text-[hsl(var(--charcoal))] font-display ml-0.5">
            DVRABLE
          </span>
        )}
        <div
          className={`rounded rounded-[4px] px-3 sm:px-4 py-2.5 sm:py-3 border shadow-card ${
            isUser
              ? "rounded-tr-sm bg-[hsl(var(--copper))] border-[hsl(var(--copper))] text-white"
              : "rounded-tl-sm bg-[hsl(var(--cream))] border-[hsl(var(--sand))] text-[hsl(var(--charcoal))]"
          }`}
        >
          {message.authorizationStep &&
            authIcons[message.authorizationStep] && (
              <div className="mb-2">
                {authIcons[message.authorizationStep]}
              </div>
            )}
          <div
            className={
              isUser
                ? "prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 text-[13px] sm:text-sm text-white prose-headings:text-white prose-strong:text-white prose-a:text-white prose-a:underline-offset-2 hover:prose-a:underline"
                : "prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 text-[13px] sm:text-sm text-[hsl(var(--charcoal))] prose-headings:font-display prose-headings:text-[hsl(var(--charcoal))] prose-strong:text-[hsl(var(--charcoal))] prose-a:text-[hsl(var(--copper))] prose-a:no-underline hover:prose-a:underline"
            }
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {!isUser && message.calendarEvent && (
            <div className="mt-3 pt-3 border-t border-[hsl(var(--sand))]" key={`add-to-cal-${message.id}`}>
              <p className="mb-2 text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--warm-stone))]">
                Next steps
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                <CalendarEventActions event={message.calendarEvent} className="sm:flex-1 sm:min-w-0" />
                <Link
                  href="/dashboard"
                  className="flex h-11 min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[4px] border border-[hsl(var(--copper))] bg-white px-4 py-2.5 text-[13px] font-display font-semibold text-[hsl(var(--copper))] shadow-card hover:bg-[hsl(var(--cream))] transition-colors no-underline sm:min-w-0"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  Dashboard
                </Link>
              </div>
            </div>
          )}
          {!isUser && message.linkToVisit && (
            <div className="mt-3 pt-3 border-t border-[hsl(var(--sand))]">
              <Link
                href={message.linkToVisit}
                className="inline-flex items-center gap-2 rounded-[4px] bg-[hsl(var(--copper))] px-4 py-2.5 text-[13px] font-display font-bold text-white hover:opacity-90 transition-opacity no-underline"
              >
                <Video className="h-4 w-4" strokeWidth={1.5} />
                Join your visit
              </Link>
            </div>
          )}
        </div>

        {message.doctors && (
          <div className="grid gap-2 sm:gap-3">
            {message.doctors.map((doc, i) => (
              <DoctorCard
                key={doc?.id ?? `doctor-${i}`}
                doctor={doc}
                onSelect={onSelectDoctor}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
