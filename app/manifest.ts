import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RemedyHome",
    short_name: "RemedyHome",
    description: "Family homeopathy remedy tracker — research remedies, track what works, build your family's history.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F7F2DB",
    theme_color: "#325E4D",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
