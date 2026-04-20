import heroImg from "@/assets/hero_illustration.png";

/** Static About page meta (SPA uses react-router-dom; wire to react-helmet etc. if needed). */
export const aboutPageMeta = [
  { title: "About Eddva — A New Standard in Learning" },
  {
    name: "description",
    content:
      "Eddva exists at the intersection of intelligence and intention—adaptive, elevated learning designed for clarity and mastery.",
  },
  { property: "og:title", content: "About Eddva — A New Standard in Learning" },
  {
    property: "og:description",
    content:
      "Redefining learning as precise, purposeful, and transformative—with AI that adapts to you and a team committed to excellence.",
  },
  { property: "og:image", content: heroImg },
  { name: "twitter:image", content: heroImg },
] as const;
