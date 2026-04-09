"use client";

import { Star, MapPin, Clock, ChevronRight } from "lucide-react";
import type { Doctor } from "@/lib/mockData";
import { motion } from "framer-motion";

interface DoctorCardProps {
  doctor: Doctor;
  onSelect: (doctor: Doctor) => void;
  index: number;
}

/** Action card: white surface, Sand border, Copper primary CTA (Brand Guide v4.1). */
export default function DoctorCard({ doctor, onSelect, index }: DoctorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.35, ease: "easeOut" }}
      className="rounded-[4px] border border-[hsl(var(--sand))] bg-white p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all duration-200 group"
    >
      <div className="flex items-start gap-2.5 sm:gap-3.5">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-[4px] border border-[hsl(var(--sand))] bg-[hsl(var(--cream))] font-display text-xs sm:text-sm font-bold text-[hsl(var(--charcoal))]">
          {doctor.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-[13px] sm:text-[15px] font-bold text-[hsl(var(--charcoal))]">
            {doctor.name}
          </h4>
          <p className="text-xs sm:text-sm text-[hsl(var(--warm-stone))] font-semibold font-body">
            {doctor.specialty}
          </p>
          <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-[hsl(var(--warm-stone))] font-body">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[hsl(var(--copper))]" strokeWidth={1.5} />
              <span className="font-medium text-[hsl(var(--charcoal))]">{doctor.rating}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              {doctor.distance}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              {doctor.available}
            </span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[13px] text-[hsl(var(--warm-stone))] leading-relaxed line-clamp-2 font-body">
            {doctor.description}
          </p>
          {doctor.estimatedVisitCost && (
            <p className="mt-1 text-[11px] font-medium text-[hsl(var(--warm-stone))] font-body">
              Estimated visit cost: ${doctor.estimatedVisitCost} (cash pay)
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(doctor)}
        aria-label={`Select ${doctor.name} for this visit`}
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-[4px] bg-[hsl(var(--copper))] px-4 py-2 sm:py-2.5 text-[13px] sm:text-sm font-display font-bold text-white hover:opacity-90 transition-opacity"
      >
        Select doctor
        <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}
