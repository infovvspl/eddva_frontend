import heroImg from "@/assets/hero_illustration.png";

/** Static About page meta (SPA uses react-router-dom; wire to react-helmet etc. if needed). */
export const aboutPageMeta = [
  { title: "About EDDVA — Building the Future of Learning" },
  {
    name: "description",
    content:
      "EDDVA leverages AI to create personalized educational experiences that adapt to every student's pace, style, and dreams.",
  },
  { property: "og:title", content: "About EDDVA — Building the Future of Learning" },
  {
    property: "og:description",
    content:
      "Discover how EDDVA's AI-powered platform is reshaping education for over 1.2M learners worldwide.",
  },
  { property: "og:image", content: heroImg },
  { name: "twitter:image", content: heroImg },
] as const;
