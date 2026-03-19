"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Menu, ShieldCheck, Wifi } from "lucide-react";
import { toast } from "sonner";
import ChatSidebar from "@/components/ChatSidebar";
import type { ConversationItem } from "@/components/ChatSidebar";
import ChatInput, { type ChatInputHandle } from "@/components/ChatInput";
import ChatMessageComponent from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import DateTimePicker from "@/components/DateTimePicker";
import type { ChatMessage, Doctor } from "@/lib/mockData";
import type { CalendarEventPayload } from "@/lib/mockData";
import { getAuthorizationMessages, normalizeFundsAmount, digitalDoctorPlaceholder } from "@/lib/mockData";
import type { AppointmentRecord } from "@/lib/conversation-types";
import { DIGITAL_DOCTOR } from "@/lib/constants";

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

/** When showing Digital/In-person chips: remove any broken or truncated "Do you prefer to..." from the bubble, then append the promo line and full question inside the message. */
const DIGITAL_VS_IN_PERSON_PROMO =
  "Skip the waiting room. See a digital doctor now or get an in-person appointment.";
const DIGITAL_VS_IN_PERSON_QUESTION =
  "Do you prefer to see a digital doctor or an in-person appointment?";

function formatMessageForDigitalVsInPersonChips(content: string): string {
  if (!content?.trim()) return content;
  let trimmed = content
    .replace(/\n\s*Do you prefer to see a digital doctor or an?\s*in-?\s*person appointment\s*\??\s*$/i, "")
    .replace(/\n\s*Do you prefer to[^\n]*$/i, "")
    .replace(/\s+Do you prefer to see a digital doctor or an?\s*in-?\s*person appointment\s*\??\s*$/i, "")
    .replace(/\s+Do you prefer to[^.?!\n]*[.?!]?\s*$/i, "");
  trimmed = trimmed.trimEnd();
  if (!trimmed) return content;
  return `${trimmed}\n\n${DIGITAL_VS_IN_PERSON_PROMO}\n\n**${DIGITAL_VS_IN_PERSON_QUESTION}**`;
}

export default function HomePage() {
  const searchParams = useSearchParams();
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
  const [waitingForScheduleAnswer, setWaitingForScheduleAnswer] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pendingScheduleDoctor, setPendingScheduleDoctor] = useState<Doctor | null>(null);
  const [pendingDigitalAppointment, setPendingDigitalAppointment] = useState(false);
  const [showDigitalVsInPersonChips, setShowDigitalVsInPersonChips] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const prevTypingRef = useRef(isTyping);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (prevTypingRef.current && !isTyping) {
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
    prevTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    const t = setTimeout(() => chatInputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

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

  const loadAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments ?? []);
      }
    } catch {
      setAppointments([]);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadAppointments();
  }, [loadConversations, loadAppointments]);

  useEffect(() => {
    if (sidebarOpen) {
      loadConversations();
      loadAppointments();
    }
  }, [sidebarOpen, loadConversations, loadAppointments]);

  const handleResumeConversation = useCallback(async (id: string, fromOngoingPicker = false) => {
    setShowOngoingConversationPicker(false);
    setIsResumingConversation(true);
    const ongoingConvId = conversationId;
    try {
      if (fromOngoingPicker && ongoingConvId && ongoingConvId !== id) {
        await fetch(`/api/conversations/${encodeURIComponent(ongoingConvId)}`, { method: "DELETE" });
      }
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`);
      if (!res.ok) {
        toast.error("Conversation not found or expired.");
        return;
      }
      const data = await res.json();
      const msgs: ChatMessage[] = (data.messages ?? []).map(
        (m: { id: string; role: string; content: string; timestamp: string; doctors?: Doctor[]; calendarEvent?: CalendarEventPayload; linkToVisit?: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: new Date(m.timestamp),
          ...(m.doctors && { doctors: m.doctors }),
          ...(m.calendarEvent && { calendarEvent: m.calendarEvent }),
          ...(m.linkToVisit && { linkToVisit: m.linkToVisit }),
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
      setWaitingForScheduleAnswer(false);
      setShowDateTimePicker(false);
      setPendingScheduleDoctor(null);
      setPendingDigitalAppointment(false);
      setShowDigitalVsInPersonChips(false);
      loadConversations();
    } catch {
      toast.error("Conversation not found or expired.");
    } finally {
      setIsResumingConversation(false);
    }
  }, [conversationId, loadConversations]);

  // Open a specific conversation from URL (e.g. from My Appointments "Go to chat")
  const conversationFromUrl = searchParams.get("conversation");
  const lastResumedConversationId = useRef<string | null>(null);
  useEffect(() => {
    if (!conversationFromUrl) return;
    if (lastResumedConversationId.current === conversationFromUrl) return;
    lastResumedConversationId.current = conversationFromUrl;
    handleResumeConversation(conversationFromUrl, false);
  }, [conversationFromUrl, handleResumeConversation]);

  const handleNewConversation = useCallback(() => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setConversationId(null);
    setSelectedDoctorInfo(null);
    setFundsAllocated(null);
    setShowQuickActions(true);
    setShowOngoingConversationPicker(false);
    setWaitingForScheduleAnswer(false);
    setShowDateTimePicker(false);
    setPendingScheduleDoctor(null);
    setPendingDigitalAppointment(false);
    setShowDigitalVsInPersonChips(false);
  }, []);

  /** User said "yes" or "no" to scheduling; parse loosely (include "ye", "ya" etc.). */
  const isScheduleYes = (t: string) => {
    const s = t.trim().toLowerCase();
    return s === "y" || s === "ye" || s === "ya" || /\b(yes|yeah|yep|sure|please|yup|ok|okay)\b/i.test(s);
  };
  const isScheduleNo = (t: string) => /\b(no|nope|not now|later|skip)\b/i.test(t.trim()) || t.trim().toLowerCase() === "n";

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

    // Intercept: user answering "Should I schedule an appointment?"
    if (waitingForScheduleAnswer && pendingScheduleDoctor) {
      setWaitingForScheduleAnswer(false);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      if (isScheduleYes(text)) {
        addMessage(userMsg);
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "When would you like to schedule? Choose a date and time below.",
          timestamp: new Date(),
        });
        setShowDateTimePicker(true);
        return;
      }
      if (isScheduleNo(text)) {
        addMessage(userMsg);
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "No problem. You can schedule anytime from **My Appointments** in the menu. Anything else I can help with?",
          timestamp: new Date(),
        });
        setPendingScheduleDoctor(null);
        return;
      }
      setPendingScheduleDoctor(null);
      // Fall through to normal chat with same message
    }

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

      const isOngoingPicker = suggestsConversationPicker(data.message?.content ?? "");
      const showingDoctorsThisTurn = (data.doctors?.length ?? 0) > 0;
      const content = (data.message?.content || "") as string;
      const messageAsksDoctorInMind = /doctor in mind|in mind\s*[?)]/i.test(content);
      const askDoctorInMind = data.askDoctorInMind === true || messageAsksDoctorInMind;
      const looksLikeRecommendationForChips =
        /recommend|suggest seeing|you should see a/i.test(content) &&
        /physician|doctor|primary care|specialist|provider/i.test(content);
      const askDigitalVsInPerson =
        data.askDigitalVsInPerson === true ||
        (looksLikeRecommendationForChips && !askDoctorInMind);
      if (askDigitalVsInPerson) setShowDigitalVsInPersonChips(true);
      if (askDoctorInMind) setShowDigitalVsInPersonChips(false);
      if (data.showDigitalScheduler === true) {
        setShowDateTimePicker(true);
        setPendingDigitalAppointment(true);
        setPendingScheduleDoctor(null);
        setShowDigitalVsInPersonChips(false);
      }
      const looksLikeRecommendation =
        /recommend|suggest seeing|you should see a/i.test(content) &&
        /physician|doctor|primary care|specialist|provider/i.test(content);
      const searchType = data.recommendedDoctorType || (looksLikeRecommendation ? "Primary Care Physician" : null);
      const willSearchDoctors = !isOngoingPicker && !data.doctors?.length && searchType && !askDoctorInMind && !askDigitalVsInPerson;

      // When showing Digital/In-person chips, show the recommendation plus the full "Do you prefer to see a digital doctor or an in-person appointment?" so the text is complete and the chips are the options.
      const messageToAdd =
        askDigitalVsInPerson
          ? { ...assistantMsg, content: formatMessageForDigitalVsInPersonChips(assistantMsg.content as string) }
          : assistantMsg;

      // If we're about to run a client-side doctor search, keep typing visible and add the assistant message only after search completes.
      if (!willSearchDoctors) {
        addMessage(messageToAdd);
      }

      if (isOngoingPicker) {
        setShowOngoingConversationPicker(true);
        loadConversations();
      }

      // Specialist/test direct-allocation flow only: show allocation steps when user gave amount after we asked in that context (referred to specialist / need a test). Never show auth here during normal symptom → recommend doctor flow; auth after doctor selection is handled in handleSelectDoctor.
      const isDirectAllocationFlow = data.showAllocationSteps === true;
      if (data.amount != null && typeof data.amount === "number" && !showingDoctorsThisTurn && isDirectAllocationFlow) {
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

      // Show doctor cards only when we're NOT in the ongoing "pick a conversation" flow,
      // NOT waiting for "Do you have a doctor in mind? (Yes/No)", and NOT showing digital vs in-person chips.
      if (!isOngoingPicker && !askDoctorInMind && !askDigitalVsInPerson) {
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
        } else if (searchType) {
          const typeParam = encodeURIComponent(searchType);
          const searchRes = await fetch(`/api/doctors/search?type=${typeParam}`);
          addMessage(assistantMsg);
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
    } catch (e) {
      console.error(e);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Something went wrong. Please try again.",
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
    setPendingScheduleDoctor(doctor);

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
    const schedulePromptMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
        content: `Should I **schedule an appointment** with ${doctor.name}? (Yes/No)`,
      timestamp: new Date(),
    };
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
            schedulePromptMsg,
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
          setWaitingForScheduleAnswer(true);
        }
      }, delay);
      delay += 1600 + i * 300;
    });
    setTimeout(() => addMessage(schedulePromptMsg), delay);
  };

  const handleScheduleConfirm = useCallback(
    async (datetime: Date, doctor: Doctor) => {
      if (!conversationId) return;
      const isDigital = doctor.id === DIGITAL_DOCTOR.id;
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            doctor_id: doctor.id,
            doctor_name: doctor.name,
            doctor_specialty: doctor.specialty,
            datetime: datetime.toISOString(),
            ...(isDigital && { appointment_type: "digital" as const }),
          }),
        });
        if (!res.ok) throw new Error("Failed to create appointment");
        const data = await res.json();
        const appointmentId = data?.appointment?.id ?? null;
        setShowDateTimePicker(false);
        setPendingScheduleDoctor(null);
        setPendingDigitalAppointment(false);
        loadAppointments();

        const formatted = datetime.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const endDatetime = new Date(datetime.getTime() + 30 * 60 * 1000);
        const toIsoDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const toIsoTime = (d: Date) =>
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        const calendarEvent: CalendarEventPayload = {
          name: `Visit with ${doctor.name}`,
          startDate: toIsoDate(datetime),
          startTime: toIsoTime(datetime),
          endTime: toIsoTime(endDatetime),
          timeZone: "America/Chicago",
          description: isDigital
            ? `DVRABLE digital visit with ${doctor.name}. Join at your scheduled time.`
            : `DVRABLE health visit with ${doctor.name}${doctor.specialty ? ` (${doctor.specialty})` : ""}. Pay at the office with your health card.`,
          location: isDigital ? "Digital visit" : (doctor.clinic ?? doctor.location ?? "Cedar Park, TX"),
        };
        const content = isDigital
          ? `✅ **Your appointment is set with Dr. Chen**, our digital doctor, for **${formatted}**. You can add it to your calendar below and join your visit when it's time.`
          : `✅ **Appointment scheduled.** Your visit with **${doctor.name}** is set for **${formatted}**. You can view it in **My Appointments** and add it to your calendar below.`;
        const confirmMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          timestamp: new Date(),
          calendarEvent,
          ...(isDigital && appointmentId && { linkToVisit: `/digitaldoctor/${appointmentId}` }),
        };
        addMessage(confirmMsg);

        const currentMessages = messagesRef.current;
        const toStore = [
          ...currentMessages,
          {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: `Appointment set for ${formatted}.`,
            timestamp: new Date(),
          },
          confirmMsg,
        ].map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
          ...("doctors" in m && m.doctors && { doctors: m.doctors }),
          ...("calendarEvent" in m && m.calendarEvent && { calendarEvent: m.calendarEvent }),
          ...("linkToVisit" in m && m.linkToVisit && { linkToVisit: m.linkToVisit }),
        }));
        await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: toStore,
            selected_doctor: selectedDoctorInfo,
            funds_allocated: fundsAllocated,
          }),
        });
      } catch (e) {
        console.error(e);
        toast.error("Failed to schedule. Please try again.");
      }
    },
    [conversationId, selectedDoctorInfo, fundsAllocated, loadAppointments]
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={(id) => handleResumeConversation(id, false)}
        onNewConversation={handleNewConversation}
        isResuming={isResumingConversation}
        appointments={appointments}
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
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
              <ShieldCheck className="h-3 w-3 text-secondary-foreground" />
              <span className="text-[11px] font-medium text-secondary-foreground">
                HIPAA Compliant
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3 text-chat-success" />
              <span className="text-[11px] text-foreground-tertiary font-body">
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
            {messages.map((msg, idx) => (
              <ChatMessageComponent
                key={msg.id ?? `msg-${idx}`}
                message={msg}
                onSelectDoctor={handleSelectDoctor}
              />
            ))}

            {showQuickActions && !isTyping && (
              <div className="px-3 sm:px-4 py-3 sm:py-4">
                <p className="text-xs font-medium text-foreground-secondary mb-2 sm:mb-2.5 font-body">
                  Quick actions
                </p>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleSend(action.label)}
                      className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 rounded-xl border border-border bg-card px-3 sm:px-4 py-2.5 text-[13px] sm:text-sm font-medium text-white shadow-card hover:shadow-card-hover hover:border-accent/30 transition-all duration-200 font-body"
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
                <p className="text-xs font-medium text-foreground-secondary mb-2 sm:mb-2.5 font-body">
                  Continue a conversation
                </p>
                <p className="text-[11px] text-foreground-tertiary mb-3 font-body">
                  Tap one to pick up where you left off (symptoms, doctor, funds).
                </p>
                <div className="space-y-2">
                  {(() => {
                    const otherConversations = conversations.filter((c) => c.conversation_id !== conversationId);
                    return otherConversations.length === 0 ? (
                      <p className="text-xs text-foreground-tertiary font-body">No other conversations yet. Start a new chat above.</p>
                    ) : (
                      otherConversations.map((c) => (
                      <button
                        key={c.conversation_id}
                        type="button"
                        onClick={() => handleResumeConversation(c.conversation_id, true)}
                        className="flex w-full flex-col items-start gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-card hover:shadow-card-hover hover:border-accent/30 transition-all duration-200"
                      >
                        <span className="text-[13px] font-medium text-white truncate w-full">
                          {c.title || "Conversation"}
                        </span>
                        <span className="text-[11px] text-foreground-tertiary">
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

            {showDigitalVsInPersonChips && !isTyping && (
              <div className="px-3 sm:px-4 py-3 sm:py-4">
                <p className="text-xs font-medium text-foreground-secondary mb-2 sm:mb-2.5 font-body">
                  Choose an option
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSend("Digital doctor")}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-medium text-white shadow-card hover:shadow-card-hover hover:border-accent/30 transition-all duration-200"
                  >
                    <span>📱</span>
                    Digital doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("In-person appointment")}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-medium text-white shadow-card hover:shadow-card-hover hover:border-accent/30 transition-all duration-200"
                  >
                    <span>🏥</span>
                    In-person appointment
                  </button>
                </div>
              </div>
            )}

            {showDateTimePicker && (pendingScheduleDoctor || pendingDigitalAppointment) && (
              <div className="px-3 sm:px-4 py-3">
                <DateTimePicker
                  onSelect={(dt) => handleScheduleConfirm(dt, pendingScheduleDoctor ?? digitalDoctorPlaceholder)}
                  onCancel={() => {
                    setShowDateTimePicker(false);
                    setPendingScheduleDoctor(null);
                    setPendingDigitalAppointment(false);
                  }}
                />
              </div>
            )}
            {(isTyping || isResumingConversation) && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput ref={chatInputRef} onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
