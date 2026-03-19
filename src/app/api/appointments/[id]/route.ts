import { NextRequest, NextResponse } from "next/server";
import { getAppointment } from "@/lib/appointment-store";

/** GET: fetch a single appointment by id (e.g. for digital doctor page). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Appointment id is required" }, { status: 400 });
    }
    const appointment = await getAppointment(id);
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ appointment });
  } catch (e) {
    console.error("GET /api/appointments/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}
