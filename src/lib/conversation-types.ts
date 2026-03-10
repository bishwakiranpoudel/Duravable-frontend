/**
 * Conversation context and persistence types.
 * Structured for Redis (chat context) and DB (long-term records).
 */

export type MessageRole = "user" | "assistant" | "system";

/** Minimal doctor shape for persistence in conversation messages. */
export interface ConversationMessageDoctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  description: string;
  avatar: string;
  available: string;
  clinic?: string;
  location?: string;
  estimatedVisitCost?: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  /** Optional doctor list when assistant shows search results. */
  doctors?: ConversationMessageDoctor[];
}

export interface ConversationContext {
  /** Collected symptom descriptions and answers */
  symptoms: string[];
  /** Previous Q&A for intake */
  previousAnswers: Record<string, string>;
  /** e.g. "Primary Care Physician", "Specialist" */
  recommendedDoctorType: string | null;
  /** Previous consultations referenced */
  previousConsultations: string[];
  /** Referral history if user was referred to specialist */
  referralHistory: string[];
  /** After user selects doctor and we run authorization */
  authorizationStatus: "none" | "pending" | "approved" | "denied";
  /** Cash payment flow: funds allocated to health card */
  paymentStatus: "none" | "allocated" | "paid";
  /** For "ongoing issue" flow: linked prior conversation id */
  resumedConversationId: string | null;
}

/** Minimal shape for selected doctor when user picks one from the list. */
export interface SelectedDoctorInfo {
  id: string;
  name: string;
  specialty?: string;
}

export interface ConversationRecord {
  user_id: string | null;
  conversation_id: string;
  messages: ConversationMessage[];
  /** Optional title for list display (e.g. first user message preview) */
  title?: string | null;
  /** Parsed/extracted from messages for quick access */
  symptoms: string[];
  doctor_recommendation: string | null;
  authorization_status: ConversationContext["authorizationStatus"];
  payment_status: ConversationContext["paymentStatus"];
  /** Doctor user selected (when they tap "Select Doctor") */
  selected_doctor?: SelectedDoctorInfo | null;
  /** Amount allocated to health card for this visit (e.g. "100") */
  funds_allocated?: string | null;
  timestamp: string; // ISO
}

export const DEFAULT_CONTEXT: ConversationContext = {
  symptoms: [],
  previousAnswers: {},
  recommendedDoctorType: null,
  previousConsultations: [],
  referralHistory: [],
  authorizationStatus: "none",
  paymentStatus: "none",
  resumedConversationId: null,
};
