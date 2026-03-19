"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface DateTimePickerProps {
  onSelect: (datetime: Date) => void;
  onCancel: () => void;
  minDate?: Date;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

function getNextDays(count: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

function formatDateLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dNorm = new Date(d);
  dNorm.setHours(0, 0, 0, 0);
  if (dNorm.getTime() === today.getTime()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dNorm.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function DateTimePicker({ onSelect, onCancel, minDate }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const days = getNextDays(14);
  const minDateNorm = minDate ? (() => {
    const m = new Date(minDate);
    m.setHours(0, 0, 0, 0);
    return m;
  })() : null;

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    const [h, min] = selectedTime.split(":").map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h, min, 0, 0);
    onSelect(dt);
  };

  const canConfirm = selectedDate && selectedTime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Choose date and time</span>
      </div>

        <div className="mb-4">
        <p className="text-xs font-medium text-foreground-secondary mb-2">Date</p>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => {
              const dNorm = new Date(d);
              dNorm.setHours(0, 0, 0, 0);
              const disabled = minDateNorm ? dNorm < minDateNorm : false;
              const isSelected = selectedDate?.toDateString() === d.toDateString();
              const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              return (
                <button
                  key={dayKey}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedDate(d)}
                  className={`rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                    disabled
                      ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                      : isSelected
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                        : "bg-muted/80 text-foreground hover:bg-muted"
                  }`}
                >
                  {formatDateLabel(d)}
                </button>
              );
            })}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-foreground-secondary mb-2 flex items-center gap-1">
          <Clock className="h-3.5 w-3" /> Time
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={`rounded-lg px-2 py-2 text-[12px] font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/80 text-foreground hover:bg-muted"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="rounded-xl px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Confirm
        </button>
      </div>
    </motion.div>
  );
}
