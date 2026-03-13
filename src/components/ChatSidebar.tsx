"use client";

import {
  MessageSquare,
  Plus,
  User,
  CreditCard,
  ShieldCheck,
  X,
} from "lucide-react";
import { mockProfile } from "@/lib/mockData";

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
}

export default function ChatSidebar({
  open,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isResuming = false,
}: ChatSidebarProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    if (diff < 7) return `${Math.floor(diff)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
            New conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-secondary">
            Recent chats
          </p>
          <div className="space-y-0.5">
            {conversations.length === 0 ? (
              <p className="px-2 text-[11px] text-foreground-tertiary">No past conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.conversation_id}
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
