import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Business Management System",
    short_name: "David System",
    description:
      "Complete business management for inventory, sales, purchases, payments, and reports",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF9500",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    categories: ["productivity", "business"],
    prefer_related_applications: false,
  };
}
