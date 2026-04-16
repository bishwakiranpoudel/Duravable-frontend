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
import { DvrableWordmark } from "@/components/Wordmark";

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
          className="fixed inset-0 z-40 bg-[hsl(var(--charcoal))]/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[280px] flex-col bg-[hsl(var(--charcoal))] border-r border-[hsl(var(--warm-stone))]/40 transition-transform duration-300 md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-2 px-5 py-4 sm:py-5">
          <div className="min-w-0">
            <DvrableWordmark variant="dark" size="lg" className="leading-tight" />
            <p className="mt-1.5 text-[11px] sm:text-xs text-[hsl(var(--sand))] font-body leading-snug">
              The Agent-First Health System
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] hover:bg-[hsl(var(--sidebar-accent))] transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-[hsl(var(--cream))]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-[4px] border border-[hsl(var(--copper))] bg-white px-3.5 py-2.5 text-sm font-display font-semibold text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin">
          <p className="mb-2 px-2 text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--sand))]">
            My Appointments
          </p>
          <div className="mb-4">
            {appointments.filter((a) => a.status === "scheduled").length === 0 ? (
              <Link
                href="/appointments"
                onClick={onClose}
                aria-label="No upcoming appointments. Open My Appointments page."
                className="flex items-center gap-2 rounded-[4px] px-3 py-2.5 text-left text-[13px] text-[hsl(var(--sand))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--cream))] transition-colors no-underline"
              >
                <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>No upcoming appointments</span>
                <ChevronRight className="h-4 w-4 shrink-0 ml-auto" strokeWidth={1.5} />
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
                          className="flex w-full items-start gap-2.5 rounded-[4px] px-3 py-2.5 border border-[hsl(var(--warm-stone))]/30"
                        >
                          <CalendarCheck
                            className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--copper))]"
                            strokeWidth={1.5}
                          />
                          <button
                            type="button"
                            disabled={isResuming}
                            onClick={() => {
                              onSelectConversation(apt.conversation_id);
                              onClose();
                            }}
                            className="min-w-0 flex-1 text-left hover:opacity-80 disabled:opacity-60 disabled:pointer-events-none"
                          >
                            <p className="truncate text-[13px] font-display font-semibold text-[hsl(var(--cream))]">
                              {apt.doctor_name}
                              {isDigital && (
                                <span className="ml-1 text-[10px] font-normal text-[hsl(var(--sand))]">
                                  (Digital)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[hsl(var(--sand))]">
                              {formatAppointmentDateTime(apt.datetime)}
                              {apt.doctor_specialty && !isDigital
                                ? ` · ${apt.doctor_specialty}`
                                : ""}
                            </p>
                          </button>
                          {isDigital && apt.id ? (
                            <Link
                              href={`/digitaldoctor/${apt.id}`}
                              onClick={onClose}
                              className="shrink-0 text-[11px] font-display font-semibold text-[hsl(var(--copper))] no-underline hover:underline"
                            >
                              Join
                            </Link>
                          ) : (
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-[hsl(var(--sand))]"
                              strokeWidth={1.5}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
                <Link
                  href="/appointments"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-display font-semibold text-[hsl(var(--copper))] hover:bg-[hsl(var(--sidebar-accent))] rounded-[4px] transition-colors no-underline hover:underline"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
              </>
            )}
          </div>
          <p className="mb-2 px-2 text-[10px] font-display font-bold uppercase tracking-[0.12em] text-[hsl(var(--sand))]">
            Recent Chats
          </p>
          <div className="space-y-0.5">
            {conversations.length === 0 ? (
              <p className="px-2 text-[11px] text-[hsl(var(--sand))]">No conversations yet.</p>
            ) : (
              conversations.map((c, idx) => {
                const selected = currentConversationId === c.conversation_id;
                return (
                  <button
                    key={c.conversation_id ?? `conv-${idx}`}
                    type="button"
                    disabled={isResuming}
                    onClick={() => {
                      onSelectConversation(c.conversation_id);
                      onClose();
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-[4px] px-3 py-2.5 text-left transition-colors group disabled:opacity-60 disabled:pointer-events-none border-l-[3px] ${
                      selected
                        ? "border-l-[hsl(var(--copper))] bg-[hsl(var(--sidebar-accent))]"
                        : "border-l-transparent hover:bg-[hsl(var(--sidebar-accent))]"
                    }`}
                  >
                    <MessageSquare
                      className={`mt-0.5 h-4 w-4 shrink-0 stroke-[1.5] ${
                        selected
                          ? "text-[hsl(var(--cream))]"
                          : "text-[hsl(var(--sand))] group-hover:text-[hsl(var(--cream))]"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] font-display font-semibold ${
                          selected ? "text-[hsl(var(--cream))]" : "text-[hsl(var(--cream))]"
                        }`}
                      >
                        {c.title || "Conversation"}
                      </p>
                      <p className="truncate text-[11px] text-[hsl(var(--sand))]">
                        {c.doctor_recommendation
                          ? `${formatDate(c.timestamp)} · ${c.doctor_recommendation}`
                          : formatDate(c.timestamp)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-auto px-4 py-3 border-t border-[hsl(var(--warm-stone))]/30">
          <p className="text-center font-body italic text-sm text-[hsl(var(--cream))] mb-3">
            by design.
          </p>
          <div className="rounded-[4px] border border-[hsl(var(--warm-stone))]/40 p-3 sm:p-4">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <Link
                href="/profile"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] hover:bg-[hsl(var(--sidebar-accent))] transition-colors no-underline"
                aria-label="Open member profile"
              >
                <User className="h-4 w-4 text-[hsl(var(--cream))]" strokeWidth={1.5} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="block text-[13px] sm:text-sm font-display font-bold text-[hsl(var(--cream))] no-underline hover:underline truncate"
                >
                  {mockProfile.name}
                </Link>
                <p className="text-[10px] text-[hsl(var(--sand))] font-body">
                  Plan participant since 2022
                </p>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px] font-body">
              <div className="flex items-center gap-2 text-[hsl(var(--sand))]">
                <CreditCard className="h-3 w-3 text-[hsl(var(--copper))]" strokeWidth={1.5} />
                <span>ID: {mockProfile.memberId}</span>
              </div>
              {mockProfile.healthCardLast4 && (
                <div className="flex items-center gap-2 text-[hsl(var(--sand))]">
                  <ShieldCheck className="h-3 w-3 text-[hsl(var(--copper))]" strokeWidth={1.5} />
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
