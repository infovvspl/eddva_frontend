import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft px-6">
      <div className="max-w-xl text-center">
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
          India's #1 AI EdTech Platform
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
          Smarter Learning. <br />
          <span className="text-gradient-brand">Brighter Futures.</span>
        </h1>
        <p className="mt-5 text-base text-muted-foreground sm:text-lg">
          AI-powered personalised education for JEE, NEET, UPSC and 20+ more
          exams. Identify gaps, practice smart and achieve your target score.
        </p>
        <Link
          to="/about"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-hero px-7 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
        >
          Learn About EDDVA <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
