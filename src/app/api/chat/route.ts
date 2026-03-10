import { NextRequest, NextResponse } from "next/server";
import { chatWithGemini, searchDoctorsWithGemini } from "@/lib/gemini";
import { parseRecommendedDoctorType, looksLikeDoctorRecommendation } from "@/lib/doctorType";
import {
  getConversation,
  setConversation,
  generateConversationId,
} from "@/lib/conversation-store";
import type { ConversationMessage, ConversationMessageDoctor, SelectedDoctorInfo } from "@/lib/conversation-types";
import { DEFAULT_SEARCH_LOCATION, PAYMENT_MODEL } from "@/lib/constants";
import { mockDoctors, type Doctor } from "@/lib/mockData";

export const maxDuration = 30;

/** Parse a dollar amount from user message (e.g. "$6000", "around 5000", "it's $5,000"). Returns null if none found. */
function parseAmountFromMessage(text: string | undefined): number | null {
  if (!text?.trim()) return null;
  const normalized = text.trim();
  const withCommas = normalized.replace(/,/g, "");
  const match = withCommas.match(/\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:dollars?|usd)?/i) ?? withCommas.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return Number.isNaN(num) || num <= 0 ? null : Math.round(num);
}

/** Map Gemini parsed doctors to conversation-stored doctor shape. */
function parsedToMessageDoctors(
  parsed: Array<{ name: string; specialty?: string; rating?: number; clinic?: string; location?: string; estimatedVisitCost?: string }>,
  doctorType: string
): ConversationMessageDoctor[] {
  return parsed.map((d, i) => {
    const name = d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`;
    const description = d.clinic ? `${d.clinic}${d.location ? ` · ${d.location}` : ""}` : "Accepting cash payment.";
    const avatar = name.replace(/\b(\w)\w*\s+(\w)\w*/, "$1$2").slice(0, 2).toUpperCase() || "DR";
    return {
      id: `gs_${i + 1}`,
      name,
      specialty: d.specialty ?? doctorType,
      rating: d.rating ?? 4.5,
      distance: "—",
      description,
      avatar,
      available: "Contact for availability",
      clinic: d.clinic,
      location: d.location ?? `${DEFAULT_SEARCH_LOCATION.city}, TX`,
      estimatedVisitCost: d.estimatedVisitCost && !/contact|—/i.test(d.estimatedVisitCost) ? d.estimatedVisitCost : "100",
    };
  });
}

/** Map mock Doctor[] to conversation-stored doctor shape (fallback when search fails or returns empty). */
function mockToMessageDoctors(docs: Doctor[]): ConversationMessageDoctor[] {
  return docs.map((d) => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    rating: d.rating,
    distance: d.distance,
    description: d.description,
    avatar: d.avatar,
    available: d.available,
    clinic: d.clinic,
    location: d.location ?? `${DEFAULT_SEARCH_LOCATION.city}, TX`,
    estimatedVisitCost: d.estimatedVisitCost && !/contact|—/i.test(d.estimatedVisitCost) ? d.estimatedVisitCost : "100",
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId: existingId,
      messages,
      userMessage,
      selectedDoctor,
      fundsAllocated,
    }: {
      conversationId?: string;
      messages: { id: string; role: string; content: string; timestamp: string }[];
      userMessage: string;
      selectedDoctor?: SelectedDoctorInfo | null;
      fundsAllocated?: string | null;
    } = body;

    if (!userMessage?.trim()) {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      );
    }

    const conversationId = existingId || generateConversationId();

    const history = messages
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }));

    const contextRecord = await getConversation(conversationId);
    const contextSummary = contextRecord
      ? [
          contextRecord.symptoms.length && `Symptoms: ${contextRecord.symptoms.join(", ")}`,
          contextRecord.doctor_recommendation &&
            `Recommended type: ${contextRecord.doctor_recommendation}`,
        ]
          .filter(Boolean)
          .join(". ")
      : undefined;

    const { text } = await chatWithGemini(
      [...history, { role: "user", content: userMessage.trim() }],
      contextSummary
    );

    const recommendedDoctorType = parseRecommendedDoctorType(text);
    const shouldFetchDoctors = recommendedDoctorType || looksLikeDoctorRecommendation(text);
    const doctorSearchType = recommendedDoctorType || "Primary Care Physician";
    let doctorsList: ConversationMessageDoctor[] | undefined;

    if (shouldFetchDoctors) {
      try {
        const { doctors: parsedDoctors } = await searchDoctorsWithGemini(doctorSearchType);
        if (parsedDoctors?.length) {
          doctorsList = parsedToMessageDoctors(parsedDoctors, doctorSearchType);
        } else {
          doctorsList = mockToMessageDoctors(mockDoctors);
        }
      } catch {
        doctorsList = mockToMessageDoctors(mockDoctors);
      }
    }

    const userMsg: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: userMessage.trim(),
      timestamp: new Date(),
    };
    const assistantMsg: ConversationMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: "assistant",
      content: text,
      timestamp: new Date(),
    };

    const priorMessages: ConversationMessage[] = (messages || []).map(
      (m: { id: string; role: string; content: string; timestamp: string; doctors?: unknown }) => {
        const base = { id: m.id, role: m.role as "user" | "assistant" | "system", content: m.content, timestamp: new Date(m.timestamp) };
        return m.doctors ? { ...base, doctors: m.doctors as ConversationMessageDoctor[] } : base;
      }
    );
    const doctorListMessage: ConversationMessage[] =
      (doctorsList?.length ?? 0) > 0
        ? [
            {
              id: `msg_${Date.now()}_doctors`,
              role: "assistant" as const,
              content: "Here are doctors near you who accept **cash payment** (Cedar Park, TX 78613):",
              timestamp: new Date(),
              doctors: doctorsList,
            },
          ]
        : [];
    const allMessages: ConversationMessage[] = [
      ...priorMessages,
      userMsg,
      assistantMsg,
      ...doctorListMessage,
    ];

    const parsedAmount = parseAmountFromMessage(userMessage.trim());
    const fundsToStore =
      parsedAmount != null
        ? String(parsedAmount)
        : fundsAllocated ?? contextRecord?.funds_allocated ?? null;

    await setConversation(conversationId, allMessages, {
      doctor_recommendation: recommendedDoctorType ?? contextRecord?.doctor_recommendation ?? null,
      symptoms: contextRecord?.symptoms ?? [],
      selected_doctor: selectedDoctor ?? contextRecord?.selected_doctor ?? null,
      funds_allocated: fundsToStore,
    });

    const responsePayload: {
      conversationId: string;
      message: { id: string; role: "assistant"; content: string; timestamp: Date };
      recommendedDoctorType?: string;
      doctors?: ConversationMessageDoctor[];
      amount?: number;
      isLargeProcedure?: boolean;
    } = {
      conversationId,
      message: {
        id: assistantMsg.id,
        role: "assistant" as const,
        content: text,
        timestamp: assistantMsg.timestamp,
      },
      recommendedDoctorType: recommendedDoctorType ?? undefined,
      doctors: doctorsList?.length ? doctorsList : undefined,
    };
    if (parsedAmount != null) {
      responsePayload.amount = parsedAmount;
      responsePayload.isLargeProcedure = parsedAmount >= PAYMENT_MODEL.LARGE_PROCEDURE_THRESHOLD_USD;
    }
    return NextResponse.json(responsePayload);
  } catch (e) {
    console.error("POST /api/chat error:", e);
    return NextResponse.json(
      { error: "Failed to get assistant response" },
      { status: 500 }
    );
  }
}
