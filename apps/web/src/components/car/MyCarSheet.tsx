"use client";

import { ChevronLeft, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Sheet } from "@/components/ui/Sheet";
import { track } from "@/lib/analytics";
import { useCurrentYear } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { copy, fuelLabel } from "@/lib/copy";
import { BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, countSwaps } from "@/lib/domain/deck";
import type { Fuel, UserCar } from "@/lib/domain/types";
import { typicalKm } from "@/lib/domain/valuation";
import { carsCount, formatEur, formatInt, formatKm } from "@/lib/format";
import { catalog } from "@/lib/seed/catalog";
import { dealers, listings } from "@/lib/seed";
import { useApp } from "@/lib/store";
import { useEstimate } from "@/lib/useEstimate";

const OLDEST_YEAR = 1995;
const KM_MAX = 400_000;
const KM_STEP = 5_000;
const FUELS: Fuel[] = ["petrol", "diesel", "lpg", "hybrid", "electric"];
const STEPS = ["make", "model", "year", "km", "result"] as const;
type Step = (typeof STEPS)[number];

interface MyCarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the visitor finishes with a car saved. */
  onDone?: () => void;
}

/** "What do you drive?" in four taps and a drag, ending on the estimate. */
export function MyCarSheet({ open, onOpenChange, onDone }: MyCarSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={copy.wizard.title} height="tall">
      <Wizard
        onClose={() => onOpenChange(false)}
        onDone={() => {
          onOpenChange(false);
          onDone?.();
        }}
      />
    </Sheet>
  );
}

function Wizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const savedCar = useApp((state) => state.car);
  const setCar = useApp((state) => state.setCar);
  const currentYear = useCurrentYear();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<Step>(savedCar ? "result" : "make");
  const [make, setMake] = useState(savedCar?.make ?? "");
  const [model, setModel] = useState(savedCar?.model ?? "");
  const [year, setYear] = useState(savedCar?.year ?? currentYear - 12);
  const [km, setKm] = useState(savedCar?.km ?? 0);
  const [fuel, setFuel] = useState<Fuel>(savedCar?.fuel ?? "petrol");

  // One object per distinct car, so the estimate is not recomputed on every render.
  const draft = useMemo<UserCar>(() => ({ make, model, year, km, fuel }), [make, model, year, km, fuel]);

  const index = STEPS.indexOf(step);
  const back = () => setStep(STEPS[Math.max(0, index - 1)]);

  function save() {
    setCar(draft);
    track("car_saved", { make, model, year });
    setStep("result");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 px-3 pb-3">
        <button
          type="button"
          onClick={back}
          disabled={index === 0}
          aria-label={copy.common.back}
          className="flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-raised hover:text-fg disabled:invisible"
        >
          <ChevronLeft className="size-6" />
        </button>
        <ol className="flex flex-1 justify-center gap-1.5" aria-label={copy.wizard.stepOf(index + 1, STEPS.length)}>
          {STEPS.map((name, position) => (
            <li
              key={name}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 ease-out-expo",
                position === index ? "w-7 bg-accent" : position < index ? "w-1.5 bg-accent/60" : "w-1.5 bg-line-strong",
              )}
            />
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.common.close}
          className="flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-raised hover:text-fg"
        >
          <X className="size-5" />
        </button>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="flex min-h-0 flex-1 flex-col"
          initial={reduceMotion ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -28 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === "make" ? (
            <MakeStep
              onPick={(next) => {
                setMake(next);
                setModel("");
                setStep("model");
              }}
            />
          ) : null}

          {step === "model" ? (
            <ModelStep
              make={make}
              onPick={(next) => {
                setModel(next);
                setStep("year");
              }}
            />
          ) : null}

          {step === "year" ? (
            <YearStep
              currentYear={currentYear}
              selected={year}
              onPick={(next) => {
                setYear(next);
                // Start the mileage where a car of that age usually is.
                setKm(Math.round(typicalKm(currentYear - next) / KM_STEP) * KM_STEP);
                setStep("km");
              }}
            />
          ) : null}

          {step === "km" ? <KmStep km={km} fuel={fuel} onKm={setKm} onFuel={setFuel} onSubmit={save} /> : null}

          {step === "result" ? (
            <ResultStep
              car={draft}
              currentYear={currentYear}
              onDone={onDone}
              onEdit={() => setStep("make")}
              onRemove={() => {
                setCar(null);
                onClose();
              }}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── steps ────────────────────────────────────────────────────────────────

function StepTitle({ eyebrow, children }: { eyebrow?: string; children: string }) {
  return (
    <div className="shrink-0 px-6 pb-4">
      {eyebrow ? <p className="mb-1 text-sm font-medium text-sky">{eyebrow}</p> : null}
      <h2 className="font-display text-[1.9rem] leading-none font-bold tracking-tight">{children}</h2>
    </div>
  );
}

const tile =
  "flex min-h-14 items-center justify-center rounded-2xl bg-raised px-3 py-2 text-center text-[15px] font-semibold " +
  "ring-1 ring-line ring-inset transition duration-150 ease-out-expo hover:bg-hover active:scale-[0.97]";

function MakeStep({ onPick }: { onPick: (make: string) => void }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("sr-Latn");
  const matches = needle ? catalog.filter((entry) => entry.name.toLocaleLowerCase("sr-Latn").includes(needle)) : null;

  const grid = "grid grid-cols-2 gap-2 min-[23rem]:grid-cols-3";

  return (
    <>
      <StepTitle>{copy.wizard.title}</StepTitle>
      <div className="shrink-0 px-5 pb-3">
        <label className="flex h-12 items-center gap-3 rounded-2xl bg-raised px-4 ring-1 ring-line ring-inset focus-within:ring-2 focus-within:ring-sky">
          <Search className="size-5 shrink-0 text-fg-faint" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.wizard.searchMake}
            aria-label={copy.wizard.searchMake}
            autoComplete="off"
            className="w-full bg-transparent text-base outline-none placeholder:text-fg-faint [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        {matches ? (
          matches.length > 0 ? (
            <div className={grid}>
              {matches.map((entry) => (
                <button key={entry.name} type="button" className={tile} onClick={() => onPick(entry.name)}>
                  {entry.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-fg-muted">{copy.wizard.noMake}</p>
          )
        ) : (
          <>
            <GroupLabel>{copy.wizard.popular}</GroupLabel>
            <div className={grid}>
              {catalog
                .filter((entry) => entry.popular)
                .map((entry) => (
                  <button key={entry.name} type="button" className={tile} onClick={() => onPick(entry.name)}>
                    {entry.name}
                  </button>
                ))}
            </div>
            <GroupLabel className="mt-6">{copy.wizard.otherMakes}</GroupLabel>
            <div className={grid}>
              {catalog
                .filter((entry) => !entry.popular)
                .map((entry) => (
                  <button key={entry.name} type="button" className={tile} onClick={() => onPick(entry.name)}>
                    {entry.name}
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function GroupLabel({ children, className }: { children: string; className?: string }) {
  return (
    <p className={cn("mb-2.5 text-xs font-semibold tracking-wider text-fg-faint uppercase", className)}>{children}</p>
  );
}

function ModelStep({ make, onPick }: { make: string; onPick: (model: string) => void }) {
  const models = catalog.find((entry) => entry.name === make)?.models ?? [];
  return (
    <>
      <StepTitle eyebrow={make}>{copy.wizard.pickModel}</StepTitle>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        <div className="grid grid-cols-2 gap-2">
          {models.map((entry) => (
            <button key={entry.name} type="button" className={tile} onClick={() => onPick(entry.name)}>
              {entry.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function YearStep({
  currentYear,
  selected,
  onPick,
}: {
  currentYear: number;
  selected: number;
  onPick: (year: number) => void;
}) {
  const years = Array.from({ length: currentYear - OLDEST_YEAR + 1 }, (_, offset) => currentYear - offset);
  return (
    <>
      <StepTitle>{copy.wizard.pickYear}</StepTitle>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        <div className="grid grid-cols-4 gap-2">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onPick(year)}
              className={cn(tile, "min-h-12 tabular-nums", year === selected && "bg-hover ring-line-strong")}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function KmStep({
  km,
  fuel,
  onKm,
  onFuel,
  onSubmit,
}: {
  km: number;
  fuel: Fuel;
  onKm: (km: number) => void;
  onFuel: (fuel: Fuel) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <StepTitle>{copy.wizard.kmTitle}</StepTitle>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
        <GroupLabel>{copy.wizard.kmLabel}</GroupLabel>
        <p className="font-display text-5xl leading-none font-bold tracking-tight tabular-nums">
          {formatInt(km)}
          {km >= KM_MAX ? "+" : ""}
          <span className="ml-2 text-2xl text-fg-muted">km</span>
        </p>
        <RangeSlider
          className="mt-4"
          value={km}
          min={0}
          max={KM_MAX}
          step={KM_STEP}
          onChange={onKm}
          label={copy.wizard.kmLabel}
          valueText={formatKm(km)}
        />

        <GroupLabel className="mt-8">{copy.wizard.fuelLabel}</GroupLabel>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={copy.wizard.fuelLabel}>
          {FUELS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === fuel}
              onClick={() => onFuel(option)}
              className={cn(
                "h-11 rounded-full px-4 text-[15px] font-semibold ring-1 transition duration-150 ease-out-expo ring-inset active:scale-[0.97]",
                option === fuel ? "bg-fg text-canvas ring-fg" : "bg-raised text-fg ring-line hover:bg-hover",
              )}
            >
              {fuelLabel[option]}
            </button>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-5 pt-4 pb-safe">
        <Button size="lg" className="w-full" onClick={onSubmit}>
          {copy.wizard.estimate}
        </Button>
      </div>
    </>
  );
}

function ResultStep({
  car,
  currentYear,
  onDone,
  onEdit,
  onRemove,
}: {
  car: UserCar;
  currentYear: number;
  onDone: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const budget = useApp((state) => state.budget);
  const setBudget = useApp((state) => state.setBudget);

  const estimate = useEstimate(car);
  const inBudget = useMemo(
    () => countSwaps({ listings, dealers, car, estimate, budget, currentYear }),
    [car, estimate, budget, currentYear],
  );

  // There is always an estimate for a car; the check is for the type's sake.
  if (!estimate) return null;

  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Plate className="text-lg">
            {car.model} · {car.year}
          </Plate>
          <span className="text-fg-muted">{copy.wizard.resultLead}</span>
        </div>

        <p className="mt-4 font-display text-[clamp(2rem,11vw,3.3rem)] leading-none font-extrabold tracking-tight text-fg tabular-nums">
          <AnimatedNumber value={estimate.low} from={0} />
          <span className="mx-1.5 text-fg-faint">–</span>
          <AnimatedNumber value={estimate.high} from={0} />
          <span className="ml-2">€</span>
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-fg-faint">{copy.wizard.resultNote}</p>

        <div className="mt-7 rounded-3xl bg-raised p-5 ring-1 ring-line ring-inset">
          <p className="text-sm font-medium text-fg-muted">{copy.wizard.budgetQuestion}</p>
          <p className="mt-1 font-display text-4xl leading-none font-bold tracking-tight tabular-nums">
            {budget === 0 ? copy.budget.evenSwap : formatEur(budget)}
          </p>
          <RangeSlider
            className="mt-3"
            value={budget}
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            onChange={setBudget}
            label={copy.budget.sliderLabel}
            valueText={formatEur(budget)}
          />
          <p className="mt-2 flex items-baseline justify-between text-sm text-fg-muted">
            <span>{copy.budget.inBudget}</span>
            <span className="font-display text-lg font-bold text-fg">{carsCount(inBudget)}</span>
          </p>
        </div>

        <div className="mt-4 flex justify-center gap-1 pb-4 text-sm">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full px-3 py-2 text-fg-muted hover:bg-raised hover:text-fg"
          >
            {copy.car.edit}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full px-3 py-2 text-fg-faint hover:bg-raised hover:text-accent-soft"
          >
            {copy.car.remove}
          </button>
        </div>
      </div>

      <div className="shrink-0 px-5 pt-3 pb-safe">
        <Button size="lg" className="w-full" onClick={onDone}>
          {copy.wizard.show}
        </Button>
      </div>
    </>
  );
}
