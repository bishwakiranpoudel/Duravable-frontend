import { NextRequest, NextResponse } from "next/server";
import { listAppointments, createAppointment } from "@/lib/appointment-store";

/** GET: list all appointments (for "My Appointments" sidebar). */
export async function GET() {
  try {
    const appointments = await listAppointments();
    return NextResponse.json({ appointments });
  } catch (e) {
    console.error("GET /api/appointments error:", e);
    return NextResponse.json(
      { error: "Failed to list appointments" },
      { status: 500 }
    );
  }
}

/** POST: create an appointment (after user selects date/time). */
export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { error: "conversation_id, doctor_id, doctor_name, and datetime are required" },
        { status: 400 }
      );
    }

    const record = await createAppointment({
      conversation_id,
      doctor_id,
      doctor_name,
      doctor_specialty,
      datetime,
      ...(appointment_type && { appointment_type }),
    });
    return NextResponse.json({ appointment: record });
  } catch (e) {
    console.error("POST /api/appointments error:", e);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
