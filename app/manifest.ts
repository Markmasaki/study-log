import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "学習記録",
    short_name: "学習記録",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#1f6f5c",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
