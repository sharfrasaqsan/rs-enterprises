import React from "react";
import { ImportStage } from "@/types/vehicle";

interface StepperProps {
  currentStage: ImportStage;
  expectedArrivalMonth?: string | null;
}

const STAGES: {
  key: ImportStage;
  label: string;
  location: string;
  stepNumber: number;
}[] = [
  {
    key: "japan_auction",
    label: "Secured at Japan Auction",
    location: "Tokyo / Kobe Yard",
    stepNumber: 1,
  },
  {
    key: "in_transit",
    label: "Ro-Ro Ocean Freight",
    location: "En Route to Sri Lanka",
    stepNumber: 2,
  },
  {
    key: "customs_clearing",
    label: "Port & Customs Clearance",
    location: "Hambantota / Colombo Port",
    stepNumber: 3,
  },
  {
    key: "in_stock",
    label: "Showroom Handover",
    location: "Kaduruwela Showroom",
    stepNumber: 4,
  },
];

export function ImportStageStepper({
  currentStage,
  expectedArrivalMonth,
}: StepperProps) {
  // Determine current active step index (0 to 3)
  const activeIndex = STAGES.findIndex((s) => s.key === currentStage);
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 1; // Default to in_transit if null

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

      {/* Semantic Ordered List: Vertical on Mobile, Horizontal on Desktop */}
      <ol
        className="flex flex-col md:flex-row items-stretch md:items-start justify-between relative gap-4 md:gap-0"
        aria-label="Import Logistics Stages"
      >
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < resolvedIndex;
          const isCurrent = idx === resolvedIndex;
          const isUpcoming = idx > resolvedIndex;

          return (
            <li
              key={stage.key}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Stage ${stage.stepNumber}: ${stage.label}. Status: ${
                isCompleted ? "Completed" : isCurrent ? "In Progress" : "Upcoming"
              }`}
              className="flex md:flex-col items-center md:items-center relative flex-1 text-left md:text-center group"
            >
              {/* Connector line on desktop */}
              {idx > 0 && (
                <div
                  className={`hidden md:block absolute top-3.5 right-1/2 w-full h-[1px] transition-colors -z-0 ${
                    idx <= resolvedIndex
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--border-hairline)]"
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Indicator Node */}
              <div
                className={`w-7 h-7 rounded-[2px] border flex items-center justify-center shrink-0 z-10 transition-colors ${
                  isCurrent
                    ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm"
                    : isCompleted
                    ? "bg-[var(--bg-base)] border-[var(--accent)] text-[var(--accent)]"
                    : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-50"
                }`}
                aria-hidden="true"
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="font-mono text-[10px] font-semibold">
                    0{stage.stepNumber}
                  </span>
                )}
              </div>

              {/* Stage labels */}
              <div className="ml-3 md:ml-0 md:mt-2.5">
                <span
                  className={`text-[11px] font-sans font-medium uppercase tracking-wider block ${
                    isCurrent
                      ? "text-[var(--text-primary)] font-semibold"
                      : isCompleted
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] opacity-70"
                  }`}
                >
                  {stage.label}
                </span>
                <span className="text-[10px] font-light text-[var(--text-secondary)] block mt-0.5">
                  {stage.location}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

