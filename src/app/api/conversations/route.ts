import { NextRequest, NextResponse } from "next/server";
import { listConversations } from "@/lib/conversation-store";
import { getClientScope, attachScopeHeaders } from "@/lib/request-scope";

/** GET: list conversations for this client scope only (geo + hashed IP). */
export async function GET(req: NextRequest) {
  const scope = getClientScope(req);
  try {
    const list = await listConversations(scope.key);
    return attachScopeHeaders(NextResponse.json({ conversations: list }), scope);
  } catch (e) {
    console.error("GET /api/conversations error:", e);
    return attachScopeHeaders(
      NextResponse.json({ error: "Failed to list conversations" }, { status: 500 }),
      scope
    );
  }
}
