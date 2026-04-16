/**
 * Types and mock data. Cash payment primary; no insurance wording in primary flow.
 */

import { PAYMENT_MODEL, DIGITAL_DOCTOR } from "@/lib/constants";
import type { MessageRole } from "@/lib/conversation-types";

export type { MessageRole };

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  description: string;
  avatar: string;
  available: string;
  /** Clinic or practice name */
  clinic?: string;
  /** Address or approximate location */
  location?: string;
  /** Estimated cash visit cost (e.g. "100") */
  estimatedVisitCost?: string;
}

/** Placeholder Doctor object for digital/scheduling flow (Dr. Chen). */
export const digitalDoctorPlaceholder: Doctor = {
  id: DIGITAL_DOCTOR.id,
  name: DIGITAL_DOCTOR.name,
  specialty: DIGITAL_DOCTOR.specialty,
  rating: 5,
  distance: "N/A",
  description: "Our digital doctor for virtual visits.",
  avatar: "DC",
  available: "Video visit",
  location: "Digital visit",
  estimatedVisitCost: "0",
};

export const mockDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    specialty: "Internal Medicine",
    rating: 4.9,
    distance: "0.8 mi",
    description:
      "Board-certified internist with 12+ years of experience. Specializes in preventive care and chronic disease management.",
    avatar: "SC",
    available: "Today, 2:30 PM",
    clinic: "Cedar Park Family Medicine",
    location: "Cedar Park, TX",
    estimatedVisitCost: "100",
  },
  {
    id: "2",
    name: "Dr. Michael Rivera",
    specialty: "Family Medicine",
    rating: 4.8,
    distance: "1.2 mi",
    description:
      "Family medicine specialist focused on comprehensive primary care for patients of all ages.",
    avatar: "MR",
    available: "Tomorrow, 10:00 AM",
    clinic: "Austin Regional Medical",
    location: "Cedar Park, TX",
    estimatedVisitCost: "95",
  },
  {
    id: "3",
    name: "Dr. Aisha Patel",
    specialty: "Urgent Care",
    rating: 4.7,
    distance: "2.1 mi",
    description:
      "Experienced urgent care physician. Quick consultations for non-emergency acute conditions.",
    avatar: "AP",
    available: "Today, 4:00 PM",
    clinic: "QuickCare Cedar Park",
    location: "Cedar Park, TX",
    estimatedVisitCost: "120",
  },
];

export interface ConversationPreview {
  id: string;
  title: string;
  date: string;
  preview: string;
}

export const mockConversations: ConversationPreview[] = [
  {
    id: "1",
    title: "Back pain consultation",
    date: "Mar 4",
    preview: "Dr. Chen was recommended...",
  },
  {
    id: "2",
    title: "Annual checkup",
    date: "Feb 28",
    preview: "Visit scheduled...",
  },
  {
    id: "3",
    title: "Allergy symptoms",
    date: "Feb 15",
    preview: "Telehealth visit scheduled...",
  },
];

/** User profile: health card and plan participant ID for cash/authorization flow. No insurance plan/copay/deductible in primary flow. */
export interface UserProfile {
  name: string;
  memberId: string;
  healthCardLast4?: string;
}

export const mockProfile: UserProfile = {
  name: "Alex Johnson",
  memberId: "DUR-2847291",
  healthCardLast4: "4521",
};

/** Event details for "Add to calendar" button (Google, Apple, Outlook, etc.). */
export interface CalendarEventPayload {
  /** Event title */
  name: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** HH:MM (24h) for timed events */
  startTime: string;
  /** HH:MM (24h), e.g. 1 hour after start */
  endTime: string;
  /** IANA timezone, e.g. America/Chicago */
  timeZone?: string;
  description?: string;
  location?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  doctors?: Doctor[];
  authorizationStep?: number;
  /** When set, show "Add to calendar" button (e.g. after appointment scheduled). */
  calendarEvent?: CalendarEventPayload;
  /** When set, show "Join your visit" link (e.g. after digital appointment scheduled). */
  linkToVisit?: string;
}

/** Default funds amount when not available or "contact for pricing". */
const DEFAULT_FUNDS_USD = "100";

/** Normalize estimated visit cost: use $100 when missing or contact-like. */
export function normalizeFundsAmount(value: string | undefined): string {
  if (!value || !value.trim()) return DEFAULT_FUNDS_USD;
  const lower = value.toLowerCase().trim();
  if (lower.includes("contact") || lower === "—" || lower === "n/a" || lower === "-") return DEFAULT_FUNDS_USD;
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  return !Number.isNaN(num) && num > 0 ? String(Math.round(num)) : DEFAULT_FUNDS_USD;
}

/** Shown right after the user picks a doctor, before the availability / authorization steps. */
export const DOCTOR_SELECTION_NEGOTIATING_MESSAGE =
  "We're currently negotiating pricing and appointment slots with the doctor's office. Hang tight—we'll update you as soon as it's done.";

/** Cash payment + health card. No copay/coverage/claim/deductible wording. */
export function getAuthorizationMessages(amount = DEFAULT_FUNDS_USD): Omit<ChatMessage, "id">[] {
  const num = parseFloat(String(amount).replace(/[^0-9.]/g, "")) || 0;
  const useInsuranceNetwork = !Number.isNaN(num) && num >= PAYMENT_MODEL.LARGE_PROCEDURE_THRESHOLD_USD;
  const networkNote = useInsuranceNetwork
    ? "\n\nFor this amount, the **Durable Health Network** may be used for pre-authorization and billing."
    : "";

  return [
    {
      role: "assistant",
      content: "**Checking availability** and preparing your visit.",
      timestamp: new Date(),
      authorizationStep: 1,
    },
    {
      role: "assistant",
      content: "**Authorization granted.**",
      timestamp: new Date(),
      authorizationStep: 2,
    },
    {
      role: "assistant",
      content: `**Funds allocated.** $${amount} has been deposited into your health card for this visit. You are all set. Pay at the office with your health card.${networkNote}\n\n**Summary:**\n- Provider confirmed\n- Estimated visit cost: $${amount} (cash pay)\n\n**Rx refill or procedure:** For an **Rx refill** or to **schedule a procedure**, the amount will be negotiated and paid **directly**. We will get back to you once that is done.\n\nAnything else I can help with?`,
      timestamp: new Date(),
      authorizationStep: 3,
    },
  ];
}

/** Labels that receive the negotiated-service assistant reply (initial quick actions, etc.). */
export const NEGOTIATED_SERVICE_QUICK_LABELS = ["Rx Refill", "Schedule Procedure"] as const;
