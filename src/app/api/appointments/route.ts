import { NextRequest, NextResponse } from "next/server";
import { listAppointments, createAppointment } from "@/lib/appointment-store";
import { getClientScope, attachScopeHeaders } from "@/lib/request-scope";

/** GET: list appointments for this client scope only. */
export async function GET(req: NextRequest) {
  const scope = getClientScope(req);
  try {
    const appointments = await listAppointments(scope.key);
    return attachScopeHeaders(NextResponse.json({ appointments }), scope);
  } catch (e) {
    console.error("GET /api/appointments error:", e);
    return attachScopeHeaders(
      NextResponse.json({ error: "Failed to list appointments" }, { status: 500 }),
      scope
    );
  }
}

/** POST: create an appointment in this client scope. */
export async function POST(req: NextRequest) {
  const scope = getClientScope(req);
  try {
    const body = await req.json();
    const {
      conversation_id,
      doctor_id,
      doctor_name,
      doctor_specialty,
      datetime,
      appointment_type,
    }: {
      conversation_id: string;
      doctor_id: string;
      doctor_name: string;
      doctor_specialty?: string;
      datetime: string; // ISO
      appointment_type?: "in_person" | "digital";
    } = body;

    if (!conversation_id || !doctor_id || !doctor_name || !datetime) {
      return attachScopeHeaders(
        NextResponse.json(
          { error: "conversation_id, doctor_id, doctor_name, and datetime are required" },
          { status: 400 }
        ),
        scope
      );
    }

    const record = await createAppointment(scope.key, {
      conversation_id,
      doctor_id,
      doctor_name,
      doctor_specialty,
      datetime,
      ...(appointment_type && { appointment_type }),
    });
    return attachScopeHeaders(NextResponse.json({ appointment: record }), scope);
  } catch (e) {
    console.error("POST /api/appointments error:", e);
    return attachScopeHeaders(
      NextResponse.json({ error: "Failed to create appointment" }, { status: 500 }),
      scope
    );
  }
}
