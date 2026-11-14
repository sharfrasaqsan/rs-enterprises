import React from "react";
import { ImportStage, normalizeImportStage, StandardImportStage } from "@/types/vehicle";

interface StepperProps {
  currentStage: ImportStage;
  expectedArrivalMonth?: string | null;
}

const STAGES: {
  key: StandardImportStage;
  label: string;
  location: string;
  stepNumber: number;
}[] = [
  {
    key: "purchased",
    label: "Purchased",
    location: "Tokyo / Kobe Yard",
    stepNumber: 1,
  },
  {
    key: "shipped",
    label: "Shipped",
    location: "Ro-Ro Ocean Freight",
    stepNumber: 2,
  },
  {
    key: "at_port",
    label: "At port",
    location: "Hambantota / Colombo Port",
    stepNumber: 3,
  },
  {
    key: "clearing",
    label: "Clearing",
    location: "Sri Lanka Customs Clearance",
    stepNumber: 4,
  },
  {
    key: "ready",
    label: "Ready",
    location: "Kaduruwela Showroom Floor",
    stepNumber: 5,
  },
];

export function ImportStageStepper({
  currentStage,
  expectedArrivalMonth,
}: StepperProps) {
  const normalized = normalizeImportStage(currentStage) || "purchased";
  const activeIndex = STAGES.findIndex((s) => s.key === normalized);
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="w-full space-y-4 py-3" aria-label="Vehicle Import Progress Stepper">
      {expectedArrivalMonth && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] text-[10px]">
            Expected Arrival
          </span>
          <span className="font-serif text-sm font-medium text-[var(--accent)]">
            {expectedArrivalMonth}
          </span>
        </div>
      )}

      {/* Desktop Horizontal Stepper (5 Steps: Purchased -> Shipped -> At port -> Clearing -> Ready) */}
      <div className="hidden sm:block">
        <ol className="flex items-center w-full" role="list">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < resolvedIndex;
            const isCurrent = idx === resolvedIndex;
            const isUpcoming = idx > resolvedIndex;

            return (
              <li
                key={stage.key}
                className={`flex-1 relative flex flex-col items-center text-center ${
                  idx !== STAGES.length - 1 ? "after:content-[''] after:w-full after:h-[1px] after:top-3.5 after:left-1/2 after:absolute after:z-0" : ""
                } ${
                  isCompleted
                    ? "after:bg-[var(--accent)]"
                    : "after:bg-[var(--border-hairline)]"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Step Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] z-10 transition-colors border ${
                    isCurrent
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] ring-4 ring-[var(--accent)]/15"
                      : isCompleted
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-hairline)]"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    stage.stepNumber
                  )}
                </div>

                {/* Step Text Info */}
                <div className="mt-2 space-y-0.5">
                  <span
                    className={`block text-[11px] font-sans uppercase font-medium tracking-[0.1em] ${
                      isCurrent
                        ? "text-[var(--text-primary)] font-semibold"
                        : isCompleted
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] opacity-60"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="block text-[9px] font-mono text-[var(--text-secondary)] leading-tight">
                    {stage.location}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden">
        <ol className="space-y-4" role="list">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < resolvedIndex;
            const isCurrent = idx === resolvedIndex;

            return (
              <li
                key={stage.key}
                className="flex items-start space-x-3"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 border ${
                    isCurrent
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                      : isCompleted
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-hairline)]"
                  }`}
                >
                  {isCompleted ? "✓" : stage.stepNumber}
                </div>
                <div className="space-y-0.5">
                  <p
                    className={`text-xs uppercase font-sans tracking-wider ${
                      isCurrent
                        ? "text-[var(--text-primary)] font-semibold"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {stage.location}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
