"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { EstimateCalculatorPanel } from "./EstimateCalculatorPanel";
import type { ImportedEstimate } from "./FileUploadChecker";

export function LandingClient() {
  const [importedEstimate, setImportedEstimate] = useState<ImportedEstimate | null>(null);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950">
      <Header />
      <Hero
        importedEstimate={importedEstimate}
        onImported={setImportedEstimate}
      />
      <EstimateCalculatorPanel importedEstimate={importedEstimate} />
    </main>
  );
}
