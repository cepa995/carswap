"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  /** Spoken value, e.g. "3.000 €". */
  valueText?: string;
  className?: string;
}

/** A native range input, so keyboard, screen readers and touch all just work. */
export function RangeSlider({ value, min, max, step, onChange, label, valueText, className }: RangeSliderProps) {
  const ratio = max === min ? 0 : (value - min) / (max - min);
  // The thumb's centre travels between half a thumb from each end, not edge to edge.
  const style = { "--fill": `calc(1rem + (100% - 2rem) * ${ratio})` } as CSSProperties;

  return (
    <input
      type="range"
      className={cn("slider", className)}
      style={style}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      aria-valuetext={valueText}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (next !== value) haptic("tick");
        onChange(next);
      }}
    />
  );
}
