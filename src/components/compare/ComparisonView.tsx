"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Vehicle, formatBodyType, formatBranch } from "@/types/vehicle";
import { Heading } from "@/components/ui/Heading";
import { Numeral } from "@/components/ui/Numeral";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CompareToolbar } from "@/components/compare/CompareToolbar";
import { RemoveVehicleButton } from "@/components/compare/RemoveVehicleButton";

export function ComparisonView({
  vehicles,
  shareUrl,
}: {
  vehicles: Vehicle[];
  shareUrl: string;
}) {
  const [showDiffOnly, setShowDiffOnly] = useState(false);

  // 1. Calculate Best Values for Emphasis
  const validPrices = vehicles.map((v) => v.price).filter((p): p is number => p !== null);
  const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const lowestMileage = Math.min(...vehicles.map((v) => v.mileage));
  const newestYear = Math.max(...vehicles.map((v) => v.year));

  // 2. Row Equality Checks for "Show Differences Only"
  const isAllSameYear = vehicles.every((v) => v.year === vehicles[0].year);
  const isAllSamePrice = vehicles.every((v) => v.price === vehicles[0].price);
  const isAllSameMileage = vehicles.every((v) => v.mileage === vehicles[0].mileage);
  const isAllSameEngine = vehicles.every((v) => v.engineCC === vehicles[0].engineCC);
  const isAllSameFuel = vehicles.every((v) => v.fuel === vehicles[0].fuel);
  const isAllSameTransmission = vehicles.every((v) => v.transmission === vehicles[0].transmission);
  const isAllSameGrade = vehicles.every((v) => v.grade === vehicles[0].grade);
  const isAllSameColor = vehicles.every((v) => v.color.toLowerCase() === vehicles[0].color.toLowerCase());
  const isAllSameBody = vehicles.every((v) => v.bodyType === vehicles[0].bodyType);
  const isAllSameDrive = vehicles.every((v) => v.driveType === vehicles[0].driveType);
  const isAllSameSeats = vehicles.every((v) => v.seats === vehicles[0].seats);
  const isAllSameReg = vehicles.every((v) => v.registrationStatus === vehicles[0].registrationStatus);
  const isAllSameBranch = vehicles.every((v) => v.branch === vehicles[0].branch);
  const isAllSameStatus = vehicles.every((v) => v.status === vehicles[0].status);

  const vehicleTitles = vehicles.map((v) => `${v.year} ${v.make} ${v.model}`);

  // Grid column sizing: 1 label column (min 150px) + N vehicle columns (min 260px each)
  const gridColClass =
    vehicles.length === 2
      ? "grid-cols-[140px_repeat(2,minmax(280px,1fr))]"
      : "grid-cols-[140px_repeat(3,minmax(260px,1fr))]";

  return (
    <div className="space-y-6">
      {/* Interactive Toolbar */}
      <CompareToolbar
        vehicleTitles={vehicleTitles}
        shareUrl={shareUrl}
        showDiffOnly={showDiffOnly}
        onToggleDiff={setShowDiffOnly}
      />

      {/* 
        Scroll-Snap Matrix: Horizontal overflow confined strictly inside this container.
        Prevents full page horizontal scrolling at 360px–390px.
      */}
      <div className="w-full overflow-x-auto snap-x snap-mandatory border border-[var(--border-hairline)] rounded-[2px] bg-[var(--bg-base)]">
        <div className={`grid ${gridColClass} min-w-[700px] divide-x divide-[var(--border-hairline)]`}>
          {/* ========================================================= */}
          {/* STICKY HEADER ROW: Vehicles Overview & Quick CTAs */}
          {/* ========================================================= */}
          <div className="p-4 bg-[var(--bg-surface)] flex flex-col justify-between sticky left-0 z-30 border-b border-[var(--border-hairline)]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
              Vehicle Dossier
            </span>
            <span className="text-xs text-[var(--text-muted)] font-light">
              Comparing {vehicles.length} Units
            </span>
          </div>

          {vehicles.map((v) => {
            const currentUrl = `https://rsenterprises.lk/vehicles/${v.slug}`;
            const waInquiryMsg = `Hello RS Enterprises, I am inquiring regarding the ${v.year} ${v.make} ${v.model} (${currentUrl}) compared on your website.`;

            return (
              <div
                key={v.id}
                className="p-5 bg-[var(--bg-surface)] flex flex-col justify-between space-y-4 snap-start border-b border-[var(--border-hairline)]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusLabel status={v.status} />
                    <RemoveVehicleButton
                      slug={v.slug}
                      title={`${v.year} ${v.make} ${v.model}`}
                    />
                  </div>

                  <Link href={`/vehicles/${v.slug}`} className="block group">
                    <VehicleImage
                      src={v.images[0] || "/images/vehicles/sample-prado.svg"}
                      alt={`${v.year} ${v.make} ${v.model}`}
                      aspectRatio="16/10"
                    />
                  </Link>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                      {v.grade}
                    </span>
                    <Link href={`/vehicles/${v.slug}`} className="block group">
                      <Heading level={4} className="group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                        {v.year} {v.make} {v.model}
                      </Heading>
                    </Link>
                  </div>
                </div>

                <div className="pt-2 space-y-2 border-t border-[var(--border-hairline)]">
                  {v.price ? (
                    <Numeral
                      value={v.price.toLocaleString("en-US")}
                      prefix="LKR"
                      size="sm"
                    />
                  ) : (
                    <span className="text-xs font-sans uppercase font-medium tracking-widest text-[var(--accent)]">
                      Call For Price
                    </span>
                  )}

                  <WhatsAppButton
                    message={waInquiryMsg}
                    label="Enquire via WhatsApp"
                    className="w-full text-center"
                  />
                </div>
              </div>
            );
          })}

          {/* ========================================================= */}
          {/* SPEC ROW 1: Production Year */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameYear) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Year
              </div>
              {vehicles.map((v) => {
                const isBest = v.year === newestYear && vehicles.length > 1;
                return (
                  <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans">
                    <span className="font-serif text-base font-medium tabular-nums text-[var(--text-primary)]">
                      {v.year}
                    </span>
                    {isBest && (
                      <span className="flex items-center gap-1.5 mt-1 text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--accent)]" aria-hidden="true" />
                        Newest Model
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 2: Price */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSamePrice) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Price (LKR)
              </div>
              {vehicles.map((v) => {
                const isBest = lowestPrice && v.price === lowestPrice && vehicles.length > 1;
                return (
                  <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans">
                    {v.price ? (
                      <span className="font-serif text-base font-semibold tabular-nums text-[var(--text-primary)]">
                        LKR {v.price.toLocaleString("en-US")}
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-wider text-[var(--accent)]">
                        Call For Price
                      </span>
                    )}
                    {isBest && (
                      <span className="flex items-center gap-1.5 mt-1 text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--accent)]" aria-hidden="true" />
                        Best Price
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 3: Certified Mileage */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameMileage) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Mileage
              </div>
              {vehicles.map((v) => {
                const isBest = v.mileage === lowestMileage && vehicles.length > 1;
                return (
                  <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans">
                    <span className="font-serif text-base tabular-nums text-[var(--text-primary)]">
                      {v.mileage.toLocaleString("en-US")} km
                    </span>
                    {isBest && (
                      <span className="flex items-center gap-1.5 mt-1 text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--accent)]" aria-hidden="true" />
                        Lowest Mileage
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 4: Engine Displacement */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameEngine) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Engine
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--text-primary)] tabular-nums">
                  {v.engineCC.toLocaleString("en-US")} CC
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 5: Fuel System */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameFuel) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Fuel
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--text-primary)] uppercase tracking-wider">
                  {v.fuel}
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 6: Transmission */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameTransmission) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Transmission
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--text-primary)] uppercase tracking-wider">
                  {v.transmission}
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 7: Auction Grade */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameGrade) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Auction Grade
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--text-primary)] font-medium">
                  {v.grade}
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 8: Exterior Color */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameColor) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Color
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--text-primary)]">
                  {v.color}
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 8.1: Body Type */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameBody) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Body Type
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--text-primary)] font-medium">
                  {formatBodyType(v.bodyType)}
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 8.2: Drive Type & Seats */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameDrive || !isAllSameSeats) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Drive &amp; Seats
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--text-primary)]">
                  <span className="font-mono">{v.driveType}</span> &bull; {v.seats} Seats
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 8.3: Registration Status */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameReg) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Registration
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans">
                  <span className={v.registrationStatus === "unregistered" ? "text-emerald-400 font-medium" : "text-[var(--text-primary)]"}>
                    {v.registrationStatus === "unregistered" ? "Unregistered (Direct Import)" : `Registered (${v.owners} Owner)`}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 8.4: Showroom Branch Location */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameBranch) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
                Showroom
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans text-[var(--accent)] font-medium">
                  {formatBranch(v.branch)}
                </div>
              ))}
            </>
          )}

          {/* ========================================================= */}
          {/* SPEC ROW 9: Features Comparison */}
          {/* ========================================================= */}
          <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 border-b border-[var(--border-hairline)] flex items-center">
            Features
          </div>
          {vehicles.map((v) => (
            <div key={v.id} className="p-4 border-b border-[var(--border-hairline)] text-xs font-sans space-y-1.5">
              {v.features.length > 0 ? (
                v.features.map((feat) => (
                  <div key={feat} className="flex items-center space-x-1.5 text-[var(--text-secondary)]">
                    <span className="w-1 h-1 rounded-[1px] bg-[var(--accent)] shrink-0" />
                    <span className="text-[11px]">{feat}</span>
                  </div>
                ))
              ) : (
                <span className="text-[var(--text-muted)] text-[11px] italic">Standard Equipment</span>
              )}
            </div>
          ))}

          {/* ========================================================= */}
          {/* SPEC ROW 10: Availability Status */}
          {/* ========================================================= */}
          {(!showDiffOnly || !isAllSameStatus) && (
            <>
              <div className="p-4 bg-[var(--bg-surface)] text-[11px] font-sans uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium sticky left-0 z-20 flex items-center">
                Status
              </div>
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 text-xs font-sans">
                  <StatusLabel status={v.status} />
                  {v.expectedArrival && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-1">
                      ETA: {v.expectedArrival}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

