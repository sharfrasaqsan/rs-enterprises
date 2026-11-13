import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rsenterprises.lk";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/admin", "/compare", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

