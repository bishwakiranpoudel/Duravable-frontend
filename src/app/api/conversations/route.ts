import { NextResponse } from "next/server";
import { listConversations } from "@/lib/conversation-store";

/** GET: list conversations for resume (sorted by timestamp, newest first). */
export async function GET() {
  try {
    const list = await listConversations();
    return NextResponse.json({ conversations: list });
  } catch (e) {
    console.error("GET /api/conversations error:", e);
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}
