"use client";

import ReactMarkdown from "react-markdown";
import DoctorCard from "./DoctorCard";
import type { ChatMessage as ChatMessageType, Doctor } from "@/lib/mockData";
import { motion } from "framer-motion";
import { ShieldCheck, CircleCheckBig, Bot } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectDoctor: (doctor: Doctor) => void;
}

const authIcons: Record<number, React.ReactNode> = {
  1: <ShieldCheck className="h-4 w-4 text-primary animate-pulse" />,
  2: <CircleCheckBig className="h-4 w-4 text-primary" />,
  3: <CircleCheckBig className="h-4 w-4 text-primary" />,
};

export default function ChatMessageComponent({
  message,
  onSelectDoctor,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl font-display text-xs font-bold ${
          isUser
            ? "gradient-trust text-primary-foreground"
            : "gradient-trust text-primary-foreground"
        }`}
      >
        {isUser ? "AJ" : <Bot className="h-4 w-4" />}
      </div>

      <div className="max-w-[88%] sm:max-w-[80%] md:max-w-[70%] space-y-2 sm:space-y-3">
        {!isUser && (
          <span className="text-[10px] sm:text-[11px] font-semibold text-primary font-body ml-1">
            DVRABLE Bot
          </span>
        )}
        <div
          className={`rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
            isUser
              ? "rounded-tr-sm gradient-trust text-primary-foreground"
              : "rounded-tl-sm bg-card text-white border border-chat-ai-border shadow-card"
          }`}
        >
          {message.authorizationStep &&
            authIcons[message.authorizationStep] && (
              <div className="mb-2">
                {authIcons[message.authorizationStep]}
              </div>
            )}
          <div
            className={`prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 text-[13px] sm:text-sm [&_*]:text-white ${
              isUser ? "prose-invert" : "prose-invert prose-strong:text-white"
            }`}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {message.doctors && (
          <div className="grid gap-2 sm:gap-3">
            {message.doctors.map((doc, i) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onSelect={onSelectDoctor}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
