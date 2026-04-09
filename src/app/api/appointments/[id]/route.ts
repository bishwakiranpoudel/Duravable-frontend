import { NextRequest, NextResponse } from "next/server";
import { getAppointment } from "@/lib/appointment-store";
import { getClientScope, attachScopeHeaders } from "@/lib/request-scope";

/** GET: fetch a single appointment if it belongs to this client scope. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = getClientScope(req);
  try {
    const { id } = await params;
    if (!id) {
      return attachScopeHeaders(
        NextResponse.json({ error: "Appointment id is required" }, { status: 400 }),
        scope
      );
    }
    const appointment = await getAppointment(scope.key, id);
    if (!appointment) {
      return attachScopeHeaders(
        NextResponse.json({ error: "Appointment not found" }, { status: 404 }),
        scope
      );
    }
    return attachScopeHeaders(NextResponse.json({ appointment }), scope);
  } catch (e) {
    console.error("GET /api/appointments/[id] error:", e);
    return attachScopeHeaders(
      NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 }),
      scope
    );
  }
}
