import { NextRequest, NextResponse } from "next/server";
import { getConversation, deleteConversation, setConversation } from "@/lib/conversation-store";
import type { ConversationMessage, SelectedDoctorInfo } from "@/lib/conversation-types";
import { getClientScope, attachScopeHeaders } from "@/lib/request-scope";

/** GET: load a conversation for this client scope only. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = getClientScope(req);
  try {
    const { id } = await params;
    if (!id) {
      return attachScopeHeaders(
        NextResponse.json({ error: "Conversation id is required" }, { status: 400 }),
        scope
      );
    }
    const record = await getConversation(scope.key, id);
    if (!record) {
      return attachScopeHeaders(
        NextResponse.json({ error: "Conversation not found" }, { status: 404 }),
        scope
      );
    }
    return attachScopeHeaders(
      NextResponse.json({
        conversation_id: record.conversation_id,
        title: record.title,
        timestamp: record.timestamp,
        selected_doctor: record.selected_doctor ?? null,
        funds_allocated: record.funds_allocated ?? null,
        messages: record.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
          ...(m.doctors && { doctors: m.doctors }),
          ...(m.calendarEvent && { calendarEvent: m.calendarEvent }),
          ...(m.linkToVisit && { linkToVisit: m.linkToVisit }),
        })),
      }),
      scope
    );
  } catch (e) {
    console.error("GET /api/conversations/[id] error:", e);
    return attachScopeHeaders(
      NextResponse.json({ error: "Failed to load conversation" }, { status: 500 }),
      scope
    );
  }
}

/** PUT: update conversation within this client scope. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = getClientScope(req);
  try {
    const { id } = await params;
    if (!id) {
      return attachScopeHeaders(
        NextResponse.json({ error: "Conversation id is required" }, { status: 400 }),
        scope
      );
    }
    const body = await req.json();
    const {
      messages,
      selected_doctor,
      funds_allocated,
    }: {
      messages: Array<{ id: string; role: string; content: string; timestamp: string; doctors?: unknown; calendarEvent?: unknown; linkToVisit?: string }>;
      selected_doctor?: SelectedDoctorInfo | null;
      funds_allocated?: string | null;
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return attachScopeHeaders(
        NextResponse.json(
          { error: "messages array is required and must not be empty" },
          { status: 400 }
        ),
        scope
      );
    }

    const existing = await getConversation(scope.key, id);
    if (!existing) {
      return attachScopeHeaders(
        NextResponse.json({ error: "Conversation not found" }, { status: 404 }),
        scope
      );
    }

    const conversationMessages: ConversationMessage[] = messages.map((m) => {
      const out: ConversationMessage = {
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        timestamp: new Date(m.timestamp),
      };
      if (m.doctors) out.doctors = m.doctors as ConversationMessage["doctors"];
      if (m.calendarEvent) out.calendarEvent = m.calendarEvent as ConversationMessage["calendarEvent"];
      if (m.linkToVisit) out.linkToVisit = m.linkToVisit;
      return out;
    });

    await setConversation(scope.key, id, conversationMessages, {
      doctor_recommendation: existing.doctor_recommendation ?? null,
      symptoms: existing.symptoms ?? [],
      selected_doctor: selected_doctor ?? existing.selected_doctor ?? null,
      funds_allocated: funds_allocated ?? existing.funds_allocated ?? null,
    });

    return attachScopeHeaders(NextResponse.json({ ok: true }), scope);
  } catch (e) {
    console.error("PUT /api/conversations/[id] error:", e);
    return attachScopeHeaders(
      NextResponse.json({ error: "Failed to update conversation" }, { status: 500 }),
      scope
    );
  }
}

/** DELETE: remove a conversation in this scope. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = getClientScope(req);
  try {
    const { id } = await params;
    if (!id) {
      return attachScopeHeaders(
        NextResponse.json({ error: "Conversation id is required" }, { status: 400 }),
        scope
      );
    }
    await deleteConversation(scope.key, id);
    return attachScopeHeaders(NextResponse.json({ ok: true }), scope);
  } catch (e) {
    console.error("DELETE /api/conversations/[id] error:", e);
    return attachScopeHeaders(
      NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 }),
      scope
    );
  }
}
