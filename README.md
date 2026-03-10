# Duravable Frontend

Next.js app for the Duravable health platform. **Cash payment** is the primary flow; insurance network is used only for large procedures (e.g. $5000+). The chat assistant is powered by **Google Gemini** for symptom intake, follow-up questions, and doctor recommendations.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS, tailwindcss-animate, @tailwindcss/typography
- **AI:** Google Gemini (`@google/genai`) for chat and doctor search
- **State:** React state, conversation persistence (in-memory; Redis-ready interface)
- **UI:** Radix, Sonner, Framer Motion, react-markdown

## Setup

1. **Install and run**

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY (from https://aistudio.google.com/apikey)
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000).

Without `GEMINI_API_KEY`, the chat will show a message asking you to set it; doctor search still returns mock results for Cedar Park, TX 78613.

## Payment model

- **Primary:** Cash payment. Users pay doctors directly; funds are allocated to the user’s health card after authorization.
- **Secondary:** For large procedures ($5000+), the system can move to the traditional insurance network (e.g. Durable Health Network).

All in-app copy uses “estimated visit cost”, “cash payment”, and “health card”; insurance terms (copay, deductible, coverage, claim) are not used in the primary flow.

## Chat assistant (Gemini)

- Asks **one follow-up question at a time** for symptom intake.
- First prompt: “Is this about a new issue or an ongoing issue?” (and “Have you discussed this with us before?” for ongoing).
- Recommends doctor type (e.g. Primary Care Physician), then doctor search is triggered for **Cedar Park, TX 78613** (608 Spanish Mustang Dr, zip 78613).
- Supports specialist referral flow and health card authorization messaging.

## Conversation storage

- **In-memory** by default (see `src/lib/conversation-store.ts`). Structure is ready for **Redis** (get/set by `conversation_id`).
- Stored fields: `user_id`, `conversation_id`, `messages`, `symptoms`, `doctor_recommendation`, `authorization_status`, `payment_status`, `timestamp`.

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Run production server
- `npm run lint` — Run ESLint

## Project structure

- `src/app/` — Layout, page, not-found, **api/chat**, **api/doctors/search**, providers, globals.css
- `src/components/` — ChatSidebar, ChatInput, ChatMessage, DoctorCard, TypingIndicator, HomePage
- `src/lib/` — **gemini**, **conversation-types**, **conversation-store**, **constants**, utils, mockData
