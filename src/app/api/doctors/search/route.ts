import { NextRequest, NextResponse } from "next/server";
import { searchDoctorsWithGemini } from "@/lib/gemini";
import { mockDoctors } from "@/lib/mockData";
import type { Doctor } from "@/lib/mockData";
import { DEFAULT_SEARCH_LOCATION } from "@/lib/constants";

/**
 * GET: search doctors near DEFAULT_SEARCH_LOCATION only (608 Spanish Mustang Dr, Cedar Park, TX 78613).
 * Uses Gemini Interactions API with Google Search when GEMINI_API_KEY is set.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorType =
      searchParams.get("type") || searchParams.get("q") || "Primary Care Physician";

    const { text, doctors: parsedDoctors } = await searchDoctorsWithGemini(doctorType);

    const hasRealSearch = !!process.env.GEMINI_API_KEY;
    const doctors: Doctor[] = (() => {
      if (hasRealSearch && parsedDoctors?.length) {
        return parsedDoctors.map((d, i) => ({
          id: `gs_${i + 1}`,
          name: d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`,
          specialty: d.specialty ?? doctorType,
          rating: d.rating ?? 4.5,
          distance: "N/A",
          description: d.clinic ? `${d.clinic}${d.location ? ` · ${d.location}` : ""}` : "Accepting cash payment.",
          avatar: d.name.replace(/\b(\w)\w*\s+(\w)\w*/, "$1$2").slice(0, 2).toUpperCase() || "DR",
          available: "Contact for availability",
          clinic: d.clinic,
          location: d.location ?? `${DEFAULT_SEARCH_LOCATION.city}, TX`,
          estimatedVisitCost: d.estimatedVisitCost && !/contact/i.test(d.estimatedVisitCost) ? d.estimatedVisitCost : "100",
        }));
      }
      return mockDoctors.map((d) => ({
        ...d,
        clinic: d.clinic ?? "Clinic",
        location: d.location ?? `${DEFAULT_SEARCH_LOCATION.city}, TX`,
        estimatedVisitCost: d.estimatedVisitCost && !/contact|—/i.test(d.estimatedVisitCost) ? d.estimatedVisitCost : "100",
      }));
    })();

    return NextResponse.json({
      query: doctorType,
      location: DEFAULT_SEARCH_LOCATION,
      geminiSummary: text,
      doctors,
    });
  } catch (e) {
    console.error("GET /api/doctors/search error:", e);
    return NextResponse.json(
      { error: "Doctor search failed" },
      { status: 500 }
    );
  }
}
