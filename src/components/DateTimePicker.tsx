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
  const minDateNorm = minDate
    ? (() => {
        const m = new Date(minDate);
        m.setHours(0, 0, 0, 0);
        return m;
      })()
    : null;

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
      className="rounded-[4px] border border-[hsl(var(--sand))] bg-white p-4 sm:p-5 shadow-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-[hsl(var(--copper))]" strokeWidth={1.5} />
        <span className="text-sm font-display font-bold text-[hsl(var(--charcoal))]">
          Choose date and time
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs font-display font-semibold text-[hsl(var(--warm-stone))] mb-2">Date</p>
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
                className={`rounded-[4px] px-3 py-2 text-[13px] font-body font-medium transition-all ${
                  disabled
                    ? "opacity-50 cursor-not-allowed bg-[hsl(var(--cream))] text-[hsl(var(--sand))]"
                    : isSelected
                      ? "bg-[hsl(var(--copper))] text-white ring-2 ring-[hsl(var(--copper))]/40"
                      : "bg-[hsl(var(--cream))] text-[hsl(var(--charcoal))] hover:bg-[hsl(var(--sand))]/30"
                }`}
              >
                {formatDateLabel(d)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-display font-semibold text-[hsl(var(--warm-stone))] mb-2 flex items-center gap-1">
          <Clock className="h-3.5 w-3" strokeWidth={1.5} /> Time
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={`rounded-[4px] px-2 py-2 text-[12px] font-body font-medium transition-all ${
                  isSelected
                    ? "bg-[hsl(var(--copper))] text-white"
                    : "bg-[hsl(var(--cream))] text-[hsl(var(--charcoal))] hover:bg-[hsl(var(--sand))]/30"
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
          className="rounded-[4px] border border-[hsl(var(--copper))] bg-white px-4 py-2 text-sm font-body font-medium text-[hsl(var(--copper))] hover:bg-[hsl(var(--cream))] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="rounded-[4px] px-4 py-2 text-sm font-display font-bold bg-[hsl(var(--copper))] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Confirm
        </button>
      </div>
    </motion.div>
  );
}
