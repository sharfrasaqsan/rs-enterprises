import type { MetadataRoute } from "next";
import { getAllPublishedVehicles } from "@/lib/vehicles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rsenterprises.lk";
  const now = new Date();

  // 1. Static Core Public Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/vehicles`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/incoming`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/request-vehicle`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/spare-parts`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // 2. Dynamic Vehicle Detail Pages
  try {
    const publishedVehicles = await getAllPublishedVehicles();
    const vehicleEntries: MetadataRoute.Sitemap = publishedVehicles.map((vehicle) => ({
      url: `${baseUrl}/vehicles/${vehicle.slug}`,
      lastModified: new Date(vehicle.updatedAt || vehicle.createdAt || now),
      changeFrequency: vehicle.status === "available" ? "daily" : "weekly",
      priority: vehicle.status === "available" ? 0.9 : 0.7,
    }));

    return [...staticPages, ...vehicleEntries];
  } catch (error) {
    console.warn("Sitemap vehicle generation fallback:", error);
    return staticPages;
  }
}
