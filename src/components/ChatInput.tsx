"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { SendHorizontal } from "lucide-react";

export interface ChatInputHandle {
  focus: () => void;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({ onSend, disabled }, ref) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
  }), []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div className="border-t border-[hsl(var(--sand))] bg-white px-3 sm:px-4 py-3 sm:py-4 safe-bottom">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[4px] border border-[hsl(var(--sand))] bg-white p-2 sm:p-2.5 shadow-card focus-within:shadow-card-hover focus-within:border-[hsl(var(--copper))]/40 transition-all duration-200">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Describe symptoms, find a doctor, or ask a question..."
          disabled={disabled}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[hsl(var(--charcoal))] placeholder:text-[hsl(var(--warm-stone))] focus:outline-none disabled:opacity-50 font-body min-h-[44px]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-[4px] bg-[hsl(var(--copper))] text-white hover:opacity-90 transition-opacity disabled:opacity-30"
          aria-label="Send message"
        >
          <SendHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-3xl flex items-center justify-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--teal))]" />
        <p className="text-[10px] sm:text-[11px] text-[hsl(var(--warm-stone))] font-body">
          Agentic AI guidance · Not a substitute for medical advice
        </p>
      </div>
    </div>
  );
});

export default ChatInput;
