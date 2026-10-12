import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nest Egg",
    short_name: "Nest Egg",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ef",
    theme_color: "#1f6b4a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
