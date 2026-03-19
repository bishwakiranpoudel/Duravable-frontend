"use client";

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import DoctorCard from "./DoctorCard";
import type { ChatMessage as ChatMessageType, Doctor, CalendarEventPayload } from "@/lib/mockData";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, CircleCheckBig, Bot, CalendarPlus, Video } from "lucide-react";

const AddToCalendarButton = dynamic(
  () => import("add-to-calendar-button-react").then((mod) => mod.AddToCalendarButton),
  { ssr: false }
);

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectDoctor: (doctor: Doctor) => void;
}

const authIcons: Record<number, React.ReactNode> = {
  1: <ShieldCheck className="h-4 w-4 text-primary animate-pulse" />,
  2: <CircleCheckBig className="h-4 w-4 text-primary" />,
  3: <CircleCheckBig className="h-4 w-4 text-primary" />,
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
        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl font-display text-xs font-bold ${
          isUser
            ? "gradient-trust text-primary-foreground"
            : "gradient-trust text-primary-foreground"
        }`}
      >
        {isUser ? "AJ" : <Bot className="h-4 w-4" />}
      </div>

      <div className="max-w-[88%] sm:max-w-[80%] md:max-w-[70%] space-y-2 sm:space-y-3">
        {!isUser && (
          <span className="text-[10px] sm:text-[11px] font-semibold text-primary font-body ml-1">
            DVRABLE Bot
          </span>
        )}
        <div
          className={`rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
            isUser
              ? "rounded-tr-sm gradient-trust text-primary-foreground"
              : "rounded-tl-sm bg-card text-white border border-chat-ai-border shadow-card"
          }`}
        >
          {message.authorizationStep &&
            authIcons[message.authorizationStep] && (
              <div className="mb-2">
                {authIcons[message.authorizationStep]}
              </div>
            )}
          <div
            className={`prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 text-[13px] sm:text-sm [&_*]:text-white ${
              isUser ? "prose-invert" : "prose-invert prose-strong:text-white"
            }`}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {!isUser && message.calendarEvent && (
            <div className="mt-3 pt-3 border-t border-white/20" key={`add-to-cal-${message.id}`}>
              <p className="text-[11px] font-medium text-white/90 mb-2 flex items-center gap-1.5">
                <CalendarPlus className="h-3.5 w-3.5" />
                Add to calendar
              </p>
              <AddToCalendarButton
                name={message.calendarEvent.name}
                startDate={message.calendarEvent.startDate}
                startTime={message.calendarEvent.startTime}
                endTime={message.calendarEvent.endTime}
                timeZone={message.calendarEvent.timeZone ?? "America/Chicago"}
                description={message.calendarEvent.description}
                location={message.calendarEvent.location}
                options={["Apple", "Google", "Outlook.com", "Yahoo", "iCal"]}
                buttonStyle="round"
                size="5"
                lightMode="light"
                styleLight="--btn-background: rgba(255,255,255,0.95); --btn-text: #1a1a1a; --btn-text-hover: #1a1a1a;"
              />
            </div>
          )}
          {!isUser && message.linkToVisit && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <Link
                href={message.linkToVisit}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/25 transition-colors"
              >
                <Video className="h-4 w-4" />
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
