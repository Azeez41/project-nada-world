import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const Experience = lazy(() => import("@/components/world/Experience"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NADA — An Unnecessary 3D Simulation" },
      {
        name: "description",
        content:
          "A futuristic interactive 3D world built for Nada: a database of nonsense, a memory tunnel, a tiny planet, one chaos room and one honest message.",
      },
      { property: "og:title", content: "NADA — An Unnecessary 3D Simulation" },
      {
        property: "og:description",
        content:
          "Scroll through a cinematic 3D world made for one person. Beautiful, chaotic, slightly stupid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <h1 className="sr-only">Nada — an interactive 3D simulation</h1>
      {mounted ? (
        <Suspense fallback={<Boot />}>
          <Experience />
        </Suspense>
      ) : (
        <Boot />
      )}
    </main>
  );
}

function Boot() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="h-2 w-2 animate-ping rounded-full bg-primary" />
    </div>
  );
}
