import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1 },
    { path: "/samasya-batayen", priority: 0.9 },
    { path: "/prathmiktayen", priority: 0.7 },
    { path: "/hamare-bare-mein", priority: 0.7 },
    { path: "/sampark", priority: 0.6 },
    { path: "/gopniyata-niti", priority: 0.3 },
  ];
  return routes.map((r) => ({ url: `${siteUrl}${r.path}`, changeFrequency: "monthly", priority: r.priority }));
}
