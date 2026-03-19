"use client";

import Link from "next/link";
import {
  MessageSquare,
  Plus,
  User,
  CreditCard,
  ShieldCheck,
  X,
  CalendarCheck,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { mockProfile } from "@/lib/mockData";
import type { AppointmentRecord } from "@/lib/conversation-types";

export interface ConversationItem {
  conversation_id: string;
  timestamp: string;
  title: string | null;
  doctor_recommendation?: string | null;
}

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isResuming?: boolean;
  appointments?: AppointmentRecord[];
}

export default function ChatSidebar({
  open,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isResuming = false,
  appointments = [],
}: ChatSidebarProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    if (diff < 7) return `${Math.floor(diff)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const formatAppointmentDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[280px] flex-col bg-background border-r border-sidebar-border transition-transform duration-300 md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 sm:py-5">
          <h1 className="font-brand text-[22px] sm:text-[26px] tracking-wide text-primary uppercase">
            DVRABLE
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => { onNewConversation(); onClose(); }}
            className="flex w-full items-center gap-2 rounded-xl border border-sidebar-border px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Plus className="h-4 w-4 text-primary" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
            My Appointments
          </p>
          <div className="mb-4">
            {appointments.filter((a) => a.status === "scheduled").length === 0 ? (
              <Link
                href="/appointments"
                onClick={onClose}
                aria-label="No upcoming appointments — open My Appointments page"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-foreground-tertiary hover:bg-sidebar-accent hover:text-foreground transition-colors"
              >
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>No upcoming appointments</span>
                <ChevronRight className="h-4 w-4 shrink-0 ml-auto" />
              </Link>
            ) : (
              <>
                <div className="space-y-0.5 mb-2">
                  {appointments
                    .filter((a) => a.status === "scheduled")
                    .slice(0, 2)
                    .map((apt, idx) => {
                      const isDigital = apt.appointment_type === "digital";
                      return (
                        <div
                          key={apt.id ?? `apt-${idx}`}
                          className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 border border-sidebar-border/50"
                        >
                          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <button
                            type="button"
                            disabled={isResuming}
                            onClick={() => {
                              onSelectConversation(apt.conversation_id);
                              onClose();
                            }}
                            className="min-w-0 flex-1 text-left hover:opacity-80 disabled:opacity-60 disabled:pointer-events-none"
                          >
                            <p className="truncate text-[13px] font-medium text-foreground">
                              {apt.doctor_name}
                              {isDigital && (
                                <span className="ml-1 text-[10px] font-normal text-foreground-tertiary">(Digital)</span>
                              )}
                            </p>
                            <p className="text-[11px] text-foreground-tertiary">
                              {formatAppointmentDateTime(apt.datetime)}
                              {apt.doctor_specialty && !isDigital ? ` · ${apt.doctor_specialty}` : ""}
                            </p>
                          </button>
                          {isDigital && apt.id ? (
                            <Link
                              href={`/digitaldoctor/${apt.id}`}
                              onClick={onClose}
                              className="shrink-0 text-[11px] font-medium text-primary hover:underline"
                            >
                              Join
                            </Link>
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-foreground-tertiary" />
                          )}
                        </div>
                      );
                    })}
                </div>
                <Link
                  href="/appointments"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-primary hover:bg-sidebar-accent rounded-xl transition-colors"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
            Recent Chats
          </p>
          <div className="space-y-0.5">
            {conversations.length === 0 ? (
              <p className="px-2 text-[11px] text-foreground-tertiary">No conversations yet.</p>
            ) : (
              conversations.map((c, idx) => (
                <button
                  key={c.conversation_id ?? `conv-${idx}`}
                  type="button"
                  disabled={isResuming}
                  onClick={() => { onSelectConversation(c.conversation_id); onClose(); }}
                  className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-sidebar-accent transition-colors group disabled:opacity-60 disabled:pointer-events-none ${
                    currentConversationId === c.conversation_id ? "bg-sidebar-accent" : ""
                  }`}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-foreground-tertiary group-hover:text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {c.title || "Conversation"}
                    </p>
                    <p className="truncate text-[11px] text-foreground-tertiary">
                      {c.doctor_recommendation
                        ? `${formatDate(c.timestamp)} · ${c.doctor_recommendation}`
                        : formatDate(c.timestamp)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <div className="rounded-xl bg-sidebar-accent/80 p-3 sm:p-4 ring-1 ring-sidebar-border">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20">
                <User className="h-4 w-4 text-sidebar-primary" />
              </div>
              <div>
                <span className="text-[13px] sm:text-sm font-semibold text-foreground">
                  {mockProfile.name}
                </span>
                <p className="text-[10px] text-foreground-tertiary">
                  Member since 2022
                </p>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <CreditCard className="h-3 w-3 text-primary" />
                <span>ID: {mockProfile.memberId}</span>
              </div>
              {mockProfile.healthCardLast4 && (
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  <span>Health card ···{mockProfile.healthCardLast4}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
