import { NextRequest, NextResponse } from "next/server";
import { getConversation, deleteConversation, setConversation } from "@/lib/conversation-store";
import type { ConversationMessage, SelectedDoctorInfo } from "@/lib/conversation-types";

/** GET: load a conversation by id for resume (returns messages + metadata). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Conversation id is required" },
        { status: 400 }
      );
    }
    const record = await getConversation(id);
    if (!record) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
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
      })),
    });
  } catch (e) {
    console.error("GET /api/conversations/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 }
    );
  }
}

/** PUT: update conversation with messages and optional meta (e.g. after doctor selection + auth steps). */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Conversation id is required" },
        { status: 400 }
      );
    }
    const body = await req.json();
    const {
      messages,
      selected_doctor,
      funds_allocated,
    }: {
      messages: Array<{ id: string; role: string; content: string; timestamp: string; doctors?: unknown }>;
      selected_doctor?: SelectedDoctorInfo | null;
      funds_allocated?: string | null;
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    const existing = await getConversation(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
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
      return out;
    });

    await setConversation(id, conversationMessages, {
      doctor_recommendation: existing.doctor_recommendation ?? null,
      symptoms: existing.symptoms ?? [],
      selected_doctor: selected_doctor ?? existing.selected_doctor ?? null,
      funds_allocated: funds_allocated ?? existing.funds_allocated ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/conversations/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

/** DELETE: remove a conversation (e.g. temporary "ongoing" chat after user resumes another). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Conversation id is required" },
        { status: 400 }
      );
    }
    await deleteConversation(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/conversations/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
