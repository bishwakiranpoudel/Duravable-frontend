"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, ShieldCheck, Wifi } from "lucide-react";
import { toast } from "sonner";
import ChatSidebar from "@/components/ChatSidebar";
import type { ConversationItem } from "@/components/ChatSidebar";
import ChatInput from "@/components/ChatInput";
import ChatMessageComponent from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import type { ChatMessage, Doctor } from "@/lib/mockData";
import { getAuthorizationMessages, normalizeFundsAmount } from "@/lib/mockData";

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! 👋 I'm **DVRABLE Bot**, your health assistant. I'm here to help you with symptoms, find doctors who accept **cash payment**, and get you set up with your **health card**.\n\n**Is this about a new issue or an ongoing issue?**",
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  { label: "I'm not feeling well", icon: "🩺" },
  { label: "Find a doctor", icon: "👨‍⚕️" },
  { label: "I was referred to a specialist", icon: "📋" },
  { label: "New issue", icon: "✨" },
  { label: "Ongoing issue", icon: "🔄" },
];

/** Assistant message suggests showing "which conversation" picker (ongoing-issue flow). */
function suggestsConversationPicker(content: string): boolean {
  const lower = (content || "").toLowerCase();
  return (
    lower.includes("recent conversations") ||
    lower.includes("tap one") ||
    lower.includes("which conversation") ||
    lower.includes("pick up where you left") ||
    lower.includes("will appear below")
  );
}

function formatConversationDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
  if (diff < 7) return `${Math.floor(diff)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [showOngoingConversationPicker, setShowOngoingConversationPicker] = useState(false);
  const [isResumingConversation, setIsResumingConversation] = useState(false);
  const [selectedDoctorInfo, setSelectedDoctorInfo] = useState<{ id: string; name: string; specialty?: string } | null>(null);
  const [fundsAllocated, setFundsAllocated] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (sidebarOpen) loadConversations();
  }, [sidebarOpen, loadConversations]);

  const handleResumeConversation = useCallback(async (id: string) => {
    setShowOngoingConversationPicker(false);
    setIsResumingConversation(true);
    const ongoingConvId = conversationId;
    try {
      if (ongoingConvId && ongoingConvId !== id) {
        await fetch(`/api/conversations/${encodeURIComponent(ongoingConvId)}`, { method: "DELETE" });
      }
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`);
      if (!res.ok) {
        toast.error("Conversation not found or expired.");
        return;
      }
      const data = await res.json();
      const msgs: ChatMessage[] = (data.messages ?? []).map(
        (m: { id: string; role: string; content: string; timestamp: string; doctors?: Doctor[] }) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: new Date(m.timestamp),
          ...(m.doctors && { doctors: m.doctors }),
        })
      );
      if (msgs.length === 0) {
        toast.error("Conversation not found or expired.");
        return;
      }
      setMessages(msgs);
      setConversationId(data.conversation_id);
      setShowQuickActions(false);
      setSelectedDoctorInfo(data.selected_doctor ?? null);
      setFundsAllocated(data.funds_allocated ?? null);
      loadConversations();
    } catch {
      toast.error("Conversation not found or expired.");
    } finally {
      setIsResumingConversation(false);
    }
  }, [conversationId, loadConversations]);

  const handleNewConversation = useCallback(() => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setConversationId(null);
    setSelectedDoctorInfo(null);
    setFundsAllocated(null);
    setShowQuickActions(true);
    setShowOngoingConversationPicker(false);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const addMessage = (msg: ChatMessage) =>
    setMessages((prev) => [...prev, msg]);

  const handleSend = async (text: string) => {
    setShowQuickActions(false);
    setShowOngoingConversationPicker(false);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        ...(m.doctors && { doctors: m.doctors }),
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: history,
          userMessage: text,
          ...(selectedDoctorInfo && {
            selectedDoctor: selectedDoctorInfo,
            fundsAllocated: fundsAllocated ?? undefined,
          }),
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);
      loadConversations();

      const assistantMsg: ChatMessage = {
        id: data.message.id,
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
      };

      addMessage(assistantMsg);

      const isOngoingPicker = suggestsConversationPicker(data.message?.content ?? "");
      if (isOngoingPicker) {
        setShowOngoingConversationPicker(true);
        loadConversations();
      }

      // Specialist/large-procedure flow: user provided amount → show allocation steps. Only when we're NOT also showing the doctor list (auth is after selecting a doctor or after giving amount in specialist flow).
      const showingDoctorsThisTurn = (data.doctors?.length ?? 0) > 0;
      if (data.amount != null && typeof data.amount === "number" && !showingDoctorsThisTurn) {
        const amountStr = String(data.amount);
        setFundsAllocated(amountStr);
        const authMsgs = getAuthorizationMessages(amountStr);
        let delay = 1200;
        authMsgs.forEach((msg, i) => {
          setTimeout(() => {
            if (i === 0) setIsTyping(false);
            addMessage({
              ...msg,
              id: crypto.randomUUID(),
              timestamp: new Date(),
            });
          }, delay);
          delay += 1600 + i * 300;
        });
      }

      // Show doctor cards only when we're NOT in the ongoing "pick a conversation" flow.
      if (!isOngoingPicker) {
        const content = (data.message?.content || "") as string;
        const looksLikeRecommendation =
          /recommend|suggest seeing|you should see a/i.test(content) &&
          /physician|doctor|primary care|specialist|provider/i.test(content);

        if (data.doctors?.length) {
          const docMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Here are doctors near you who accept **cash payment** (Cedar Park, TX 78613):",
            timestamp: new Date(),
            doctors: data.doctors as Doctor[],
          };
          addMessage(docMsg);
        } else {
          const searchType = data.recommendedDoctorType || (looksLikeRecommendation ? "Primary Care Physician" : null);
          if (searchType) {
            const typeParam = encodeURIComponent(searchType);
            const searchRes = await fetch(`/api/doctors/search?type=${typeParam}`);
            if (searchRes.ok) {
              const { doctors } = await searchRes.json();
              if (doctors?.length) {
                const docMsg: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content:
                    "Here are doctors near you who accept **cash payment** (Cedar Park, TX 78613):",
                  timestamp: new Date(),
                  doctors,
                };
                addMessage(docMsg);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Something went wrong. Please try again. If the problem continues, check that the assistant is configured (GEMINI_API_KEY).",
        timestamp: new Date(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    const amount = normalizeFundsAmount(doctor.estimatedVisitCost);
    const selectedDoctorInfoPayload = { id: doctor.id, name: doctor.name, specialty: doctor.specialty };
    setSelectedDoctorInfo(selectedDoctorInfoPayload);
    setFundsAllocated(amount);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: `You selected **${doctor.name}** for this visit.`,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setIsTyping(true);

    const authMsgsRaw = getAuthorizationMessages(amount);
    const authMsgsWithIds: ChatMessage[] = authMsgsRaw.map((msg) => ({
      ...msg,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }));
    let delay = 1200;

    authMsgsWithIds.forEach((msg, i) => {
      setTimeout(() => {
        if (i === 0) setIsTyping(false);
        addMessage(msg);
        if (conversationId && i === authMsgsWithIds.length - 1) {
          const toStore = [
            ...messages,
            userMsg,
            ...authMsgsWithIds,
          ].map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
            ...(m.doctors && { doctors: m.doctors }),
          }));
          fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: toStore,
              selected_doctor: selectedDoctorInfoPayload,
              funds_allocated: amount,
            }),
          }).catch(() => {});
        }
      }, delay);
      delay += 1600 + i * 300;
    });
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={handleResumeConversation}
        onNewConversation={handleNewConversation}
        isResuming={isResumingConversation}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-2 sm:gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3.5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="font-brand text-lg sm:text-xl tracking-wide text-foreground uppercase">
            DVRABLE
          </h2>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
              <ShieldCheck className="h-3 w-3 text-secondary-foreground" />
              <span className="text-[11px] font-medium text-secondary-foreground">
                HIPAA Compliant
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3 text-chat-success" />
              <span className="text-[11px] text-muted-foreground font-body">
                Online
              </span>
            </div>
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto scrollbar-thin"
          style={{ background: "var(--gradient-warm)" }}
        >
          <div className="mx-auto max-w-3xl py-3 sm:py-4">
            {messages.map((msg) => (
              <ChatMessageComponent
                key={msg.id}
                message={msg}
                onSelectDoctor={handleSelectDoctor}
              />
            ))}

            {showQuickActions && !isTyping && (
              <div className="px-3 sm:px-4 py-3 sm:py-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-2.5 font-body">
                  Quick actions
                </p>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleSend(action.label)}
                      className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 rounded-xl border border-border bg-card px-3 sm:px-4 py-2.5 text-[13px] sm:text-sm font-medium text-foreground shadow-card hover:shadow-card-hover hover:border-accent/30 transition-all duration-200 font-body"
                    >
                      <span>{action.icon}</span>
                      <span className="truncate">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showOngoingConversationPicker && !isTyping && (
              <div className="px-3 sm:px-4 py-3 sm:py-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-2.5 font-body">
                  Continue a conversation
                </p>
                <p className="text-[11px] text-muted-foreground mb-3 font-body">
                  Tap one to pick up where you left off (symptoms, doctor, funds).
                </p>
                <div className="space-y-2">
                  {(() => {
                    const otherConversations = conversations.filter((c) => c.conversation_id !== conversationId);
                    return otherConversations.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-body">No past conversations yet. Start a new chat above.</p>
                    ) : (
                      otherConversations.map((c) => (
                      <button
                        key={c.conversation_id}
                        type="button"
                        onClick={() => handleResumeConversation(c.conversation_id)}
                        className="flex w-full flex-col items-start gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-card hover:shadow-card-hover hover:border-accent/30 transition-all duration-200"
                      >
                        <span className="text-[13px] font-medium text-foreground truncate w-full">
                          {c.title || "Conversation"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {c.doctor_recommendation
                            ? `${formatConversationDate(c.timestamp)} · ${c.doctor_recommendation}`
                            : formatConversationDate(c.timestamp)}
                        </span>
                      </button>
                    ))
                    );
                  })()}
                </div>
              </div>
            )}

            {(isTyping || isResumingConversation) && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
