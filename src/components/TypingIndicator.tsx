import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl gradient-trust text-primary-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-primary font-body ml-1">
          DVRABLE Bot
        </span>
        <div className="mt-1 rounded-2xl rounded-tl-sm bg-card border border-chat-ai-border px-4 sm:px-5 py-3 sm:py-3.5 shadow-card">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: "0s" }}
            />
            <span
              className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
