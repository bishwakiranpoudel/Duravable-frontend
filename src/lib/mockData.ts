/**
 * Types and mock data. Cash payment primary; no insurance wording in primary flow.
 */

import { PAYMENT_MODEL } from "@/lib/constants";
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

/** User profile: health card and member id for cash/authorization flow. No insurance plan/copay/deductible in primary flow. */
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

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  doctors?: Doctor[];
  authorizationStep?: number;
}

/** Default funds amount when not available or "contact for pricing". */
const DEFAULT_FUNDS_USD = "100";

/** Normalize estimated visit cost: use $100 when missing or contact-like. */
export function normalizeFundsAmount(value: string | undefined): string {
  if (!value || !value.trim()) return DEFAULT_FUNDS_USD;
  const lower = value.toLowerCase().trim();
  if (lower.includes("contact") || lower === "—" || lower === "-") return DEFAULT_FUNDS_USD;
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  return !Number.isNaN(num) && num > 0 ? String(Math.round(num)) : DEFAULT_FUNDS_USD;
}

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
      content: "🔄 **Checking availability** and preparing your visit...",
      timestamp: new Date(),
      authorizationStep: 1,
    },
    {
      role: "assistant",
      content: "✅ **Authorization granted.**",
      timestamp: new Date(),
      authorizationStep: 2,
    },
    {
      role: "assistant",
      content: `📋 **Funds allocated.** $${amount} has been deposited into your health card for this visit. You're all set—pay at the office with your health card.${networkNote}\n\n**Summary:**\n- Provider confirmed\n- Estimated visit cost: $${amount} (cash payment)\n\nAnything else I can help with?`,
      timestamp: new Date(),
      authorizationStep: 3,
    },
  ];
}
