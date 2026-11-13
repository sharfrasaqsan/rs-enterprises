import { getAllPublishedVehicles } from "@/lib/vehicles";
import { getCompanySettings } from "@/lib/settings";
import { Hero } from "@/components/home/Hero";
import { SearchStrip } from "@/components/home/SearchStrip";
import { NewArrivals } from "@/components/home/NewArrivals";
import { DirectFromJapan } from "@/components/home/DirectFromJapan";
import { IncomingBand } from "@/components/home/IncomingBand";
import { ServicesList } from "@/components/home/ServicesList";
import { BranchesSection } from "@/components/home/BranchesSection";
import { ClosingCta } from "@/components/home/ClosingCta";

export default async function HomePage() {
  const [vehicles, settings] = await Promise.all([
    getAllPublishedVehicles(),
    getCompanySettings(),
  ]);

  // 1. Featured LCP Vehicle: Primary flagship unit (e.g. LC300 or Prado)
  const featuredVehicle =
    vehicles.find((v) => v.slug.includes("land-cruiser-300")) ||
    vehicles[0];

  // 2. Unique available makes for Search Strip
  const availableMakes = Array.from(new Set(vehicles.map((v) => v.make))).sort();

  // 3. New Arrivals: Recent showroom acquisitions (excluding featured if possible)
  const newArrivals = vehicles
    .filter((v) => v.id !== featuredVehicle.id && v.status !== "sold")
    .slice(0, 3);

  // 4. Incoming in-transit pipeline units
  const incomingVehicles = vehicles
    .filter((v) => v.status === "incoming")
    .slice(0, 2);

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* 1. Full-Bleed Hero (Featured vehicle is the exclusive LCP image) */}
      <Hero featuredVehicle={featuredVehicle} settings={settings} />

      {/* 2. Slim Search Strip (Overlapping Hero edge) */}
      <SearchStrip availableMakes={availableMakes} />

      {/* 3. New Arrivals (Asymmetric 12-column editorial layout) */}
      <NewArrivals vehicles={newArrivals} />

      {/* 4. Direct from Japan (Inverted Theme Variant with 3 numbered points) */}
      <DirectFromJapan />

      {/* 5. Incoming Stock Band (Refined 4-stage import logistics indicator) */}
      <IncomingBand incomingVehicles={incomingVehicles} />

      {/* 6. Curated Services (Hairline-divided list, no boxed feature cards) */}
      <ServicesList />

      {/* 7. Showroom Branches & Contacts (Kaduruwela Main & Trincomalee) */}
      <BranchesSection settings={settings} />

      {/* 8. Closing Call-To-Action */}
      <ClosingCta settings={settings} />
    </div>
  );
}
