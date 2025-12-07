import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://teamcinder.com";
  return [
    { url: `${base}/`, changefreq: "weekly", priority: 1.0 },
    { url: `${base}/coach`, changefreq: "weekly", priority: 0.9 },
    { url: `${base}/login`, changefreq: "monthly", priority: 0.5 },
    { url: `${base}/terms`, changefreq: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changefreq: "yearly", priority: 0.2 },
  ];
}
