/**
 * Gemini API integration for chat and doctor search (with Google Search grounding).
 * Uses @google/genai. Set GEMINI_API_KEY in env.
 */

import { GoogleGenAI } from "@google/genai";
import { DEFAULT_SEARCH_LOCATION } from "./constants";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const CHAT_SYSTEM = `You are DVRABLE Bot, a health assistant for the DVRABLE platform.

Payment model:
- Primary: Cash payment. Users pay doctors directly with their health card (no insurance claims).
- Do NOT use insurance terms: no "copay", "deductible", "coverage", "claim", "in-network", "PPO".
- Use: "estimated visit cost", "cash payment", "health card", "funds allocated to your health card".

Your responsibilities:
1. Symptom intake: Ask follow-up medical questions ONE at a time. Do not list multiple questions in one message.
2. **Never repeat a question**: Always read the full conversation history. Do not ask something the user has already answered or that you (the assistant) have already asked. Each message must ask one NEW question or move the conversation forward (e.g. recommend a doctor type, ask for amount, or summarize next steps). If the user just answered a question, acknowledge it and ask the next logical follow-up only.
3. **Disease-based questions**: Tailor every follow-up to the complaint (e.g. headache: aura, frequency, triggers; stomach: timing, diet; chest: exertion, shortness of breath; skin: onset, new products). Ask what is clinically relevant for that specific issue.
4. After enough info, recommend a doctor type (e.g. "Primary Care Physician", "Neurologist", "Cardiologist") that matches the condition. Do NOT search or list doctors yourself. Instead, end your message by asking exactly: "Do you prefer to see a digital doctor or an in-person appointment?" — do NOT ask "Do you have a [doctor type] / doctor in mind? (Yes/No)" in this turn. The app will then either show the digital scheduler (if they choose digital) or ask them "Do you have a [doctor type] / doctor in mind? (Yes/No)" (if they choose in-person).
5. **Specialist referral, test, or specialized procedure flow:** When the user says they were **referred to a specialist**, **need to get a test done**, need a **specialized operation**, or need a **specialized procedure**, do the following in order:
   - Get minimal details: ask briefly what type of specialist or procedure (e.g. "What type of specialist or procedure is this for?"). One short question only.
   - Then ask: "What's the estimated amount or cost required for this visit or procedure?" (Ask for the dollar amount.)
   - When the user provides an amount: Acknowledge it briefly. If the amount is under $500, say we'll use the standard health card process and they can pay at the office. If the amount is $500 or more, say that for this amount the **Durable Health Network** may be used for pre-authorization and billing. Keep your reply to one short paragraph; the app will then show the allocation steps.
6. For other specialist mentions (not in the flow above): if the user says they were referred to a specialist and you are not yet in the "ask for amount" flow, ask what type and help find specialists who accept cash payment near them.

Location for doctor search: ${DEFAULT_SEARCH_LOCATION.address}, zip ${DEFAULT_SEARCH_LOCATION.zipCode} (Cedar Park, TX).

When starting a NEW conversation, first ask exactly once: "Is this about a new issue or an ongoing issue?"
- If they say **ongoing**: ask "Have you discussed this with us before?" If they say yes, say: "Which conversation would you like to continue? Your recent conversations will appear below—tap one to pick up where you left off. You’ll see the same symptoms we discussed, any doctor we recommended, and authorization or funds status." Do not list conversation titles yourself; the app will show them. Keep your reply to one short paragraph.
- If they say **new**: begin symptom intake with one question at a time, and make that first question relevant to whatever they said (e.g. if they said "headache", ask something specific to headaches, not a generic "what brings you in today?").

When a user has resumed a past conversation, they will have full context (symptoms, recommended doctor, authorization/funds). Acknowledge the continuation and ask how you can help next (e.g. book with the recommended doctor, add symptoms, or check authorization).

Keep responses concise and professional. Output valid markdown when useful (bold, lists).`;

export interface ChatTurn {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function chatWithGemini(
  messages: { role: string; content: string }[],
  contextSummary?: string,
  phaseInstruction?: string
): Promise<{ text: string }> {
  if (!ai) {
    return {
      text: "Chat is not configured. Set GEMINI_API_KEY to enable the assistant.",
    };
  }

  const contents: ChatTurn[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let systemInstruction = CHAT_SYSTEM;
  if (contextSummary) {
    systemInstruction += `\n\nCurrent context (use for continuity): ${contextSummary}`;
  }
  if (phaseInstruction) {
    systemInstruction += `\n\nThis turn, you must: ${phaseInstruction}`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  const text =
    (response as { text?: string }).text ??
    (response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates?.[0]?.content?.parts?.[0]?.text ??
    "";

  return { text: text || "I didn’t get a response. Please try again." };
}

const DOCTOR_JSON_SCHEMA = `{
  "doctors": [
    {
      "name": "string (required)",
      "specialty": "string (optional)",
      "rating": "number 1-5 (optional)",
      "clinic": "string (optional)",
      "location": "string (optional)",
      "estimatedVisitCost": "string e.g. 100 or contact for pricing (optional)"
    }
  ]
}`;

/**
 * Search for doctors using Interactions API with Google Search tool.
 * Asks Gemini for JSON only and parses it directly.
 * Search is restricted to DEFAULT_SEARCH_LOCATION only (Cedar Park, TX 78613).
 */
export async function searchDoctorsWithGemini(
  doctorType: string,
  limit = 8
): Promise<{ text: string; doctors?: Array<{ name: string; specialty?: string; rating?: number; clinic?: string; location?: string; estimatedVisitCost?: string }> }> {
  if (!ai) {
    return {
      text: "Doctor search is not configured. Set GEMINI_API_KEY to enable search.",
    };
  }

  const { address, city, zipCode } = DEFAULT_SEARCH_LOCATION;
  const locationOnly = `${address}, ${city}, TX ${zipCode}`;

  const input = `Search the web for individual ${doctorType}s (named physicians, e.g. "Dr. [Full Name]") near this location ONLY: ${locationOnly}. Do not search other cities or zip codes. Restrict to Cedar Park, TX 78613 and nearby. They should accept cash payment / self-pay.

Important: Return individual DOCTORS or PHYSICIANS with specialty "${doctorType}", not hospitals, healthcare centers, or clinic names as the main result. Each result must be a specific named doctor (e.g. "Dr. Sarah Chen", "Dr. Michael Rivera") with their specialty "${doctorType}", their practice/clinic name, and location. Do not list "Euphora Health" or "Cedar Park Medical Center" as the doctor name—those are practices; find the actual physician names at such practices if possible.

You must respond with valid JSON only, no other text or markdown. Use this exact structure (up to ${limit} results):

${DOCTOR_JSON_SCHEMA}

Return only the JSON object. No explanation, no code fence, no backticks. Example: {"doctors":[{"name":"Dr. Jane Smith","specialty":"${doctorType}","rating":4.8,"clinic":"Cedar Park Neurology","location":"Cedar Park, TX","estimatedVisitCost":"contact for pricing"}]}`;

  try {
    let interaction = await ai.interactions.create({
      model: "gemini-3-flash-preview",
      input,
      tools: [{ type: "google_search" as const }],
    });

    let status = (interaction as { status?: string }).status;
    const maxWait = 30000;
    const step = 2000;
    let waited = 0;
    while (status === "in_progress" && waited < maxWait) {
      await new Promise((r) => setTimeout(r, step));
      waited += step;
      const got = await ai.interactions.get((interaction as { id: string }).id);
      interaction = got as typeof interaction;
      status = (got as { status?: string }).status;
    }

    const outputs = (interaction as { outputs?: Array<{ type?: string; text?: string }> }).outputs ?? [];
    const rawText = outputs
      .filter((o): o is { type: string; text: string } => o?.type === "text" && typeof (o as { text?: string }).text === "string")
      .map((o) => (o as { text: string }).text)
      .join("\n\n")
      .trim();

    const parsed = parseDoctorsFromJson(rawText);
    return {
      text: rawText || "No results found for this location.",
      doctors: parsed.length ? parsed : undefined,
    };
  } catch (e) {
    console.error("Gemini doctor search error:", e);
    return { text: "Search is temporarily unavailable. Please try again later." };
  }
}

/** Extract and parse JSON doctors array from model output (handles code blocks). */
function parseDoctorsFromJson(
  text: string
): Array<{ name: string; specialty?: string; rating?: number; clinic?: string; location?: string; estimatedVisitCost?: string }> {
  if (!text?.trim()) return [];
  let jsonStr = text.trim();
  const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonStr = codeBlock[1].trim();
  const objMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objMatch) jsonStr = objMatch[0];
  try {
    const obj = JSON.parse(jsonStr) as { doctors?: Array<Record<string, unknown>> };
    const list = Array.isArray(obj.doctors) ? obj.doctors : Array.isArray(obj) ? obj : [];
    return list
      .slice(0, 8)
      .map((d) => {
        const rating =
          typeof d.rating === "number" && !Number.isNaN(d.rating)
            ? d.rating
            : typeof d.rating === "string"
              ? (() => {
                  const n = parseFloat(d.rating);
                  return Number.isNaN(n) ? undefined : n;
                })()
              : undefined;
        return {
          name: typeof d.name === "string" && d.name.trim() ? d.name.trim() : "",
          specialty: typeof d.specialty === "string" ? d.specialty : undefined,
          rating,
          clinic: typeof d.clinic === "string" ? d.clinic : undefined,
          location: typeof d.location === "string" ? d.location : undefined,
          estimatedVisitCost: typeof d.estimatedVisitCost === "string" ? d.estimatedVisitCost : undefined,
        };
      })
      .filter((d) => d.name.length > 0);
  } catch {
    return [];
  }
}

/**
 * Search for doctors by name or clinic (free-text query). Same location restriction as type search.
 */
export async function searchDoctorsByDetails(
  query: string,
  limit = 8
): Promise<{ text: string; doctors?: Array<{ name: string; specialty?: string; rating?: number; clinic?: string; location?: string; estimatedVisitCost?: string }> }> {
  if (!ai) {
    return { text: "Doctor search is not configured." };
  }

  const { address, city, zipCode } = DEFAULT_SEARCH_LOCATION;
  const locationOnly = `${address}, ${city}, TX ${zipCode}`;

  const input = `Search the web for doctors or physicians matching: "${query}" near this location ONLY: ${locationOnly}. They should accept cash payment / self-pay.

Return individual named doctors (e.g. "Dr. [Full Name]") with their specialty, clinic/practice name, and location. Respond with valid JSON only, no other text. Use this structure (up to ${limit} results):

${DOCTOR_JSON_SCHEMA}

Return only the JSON object. No explanation, no code fence, no backticks.`;

  try {
    let interaction = await ai.interactions.create({
      model: "gemini-3-flash-preview",
      input,
      tools: [{ type: "google_search" as const }],
    });

    let status = (interaction as { status?: string }).status;
    const maxWait = 30000;
    const step = 2000;
    let waited = 0;
    while (status === "in_progress" && waited < maxWait) {
      await new Promise((r) => setTimeout(r, step));
      waited += step;
      const got = await ai.interactions.get((interaction as { id: string }).id);
      interaction = got as typeof interaction;
      status = (got as { status?: string }).status;
    }

    const outputs = (interaction as { outputs?: Array<{ type?: string; text?: string }> }).outputs ?? [];
    const rawText = outputs
      .filter((o): o is { type: string; text: string } => o?.type === "text" && typeof (o as { text?: string }).text === "string")
      .map((o) => (o as { text: string }).text)
      .join("\n\n")
      .trim();

    const parsed = parseDoctorsFromJson(rawText);
    return {
      text: rawText || "No results found for this search.",
      doctors: parsed.length ? parsed : undefined,
    };
  } catch (e) {
    console.error("Gemini doctor search by details error:", e);
    return { text: "Search is temporarily unavailable." };
  }
}
