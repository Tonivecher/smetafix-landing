"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { EstimateCalculatorPanel } from "./EstimateCalculatorPanel";
import { EstimateComparisonReport } from "./EstimateComparisonReport";
import { compareEstimates } from "@/lib/estimate-core";
import type { ImportedEstimate } from "./FileUploadChecker";

export function LandingClient() {
  const [activeTab, setActiveTab] = useState<"audit" | "compare">("audit");

  // Single audit state
  const [importedEstimate, setImportedEstimate] = useState<ImportedEstimate | null>(null);

  // Comparison state
  const [origEstimate, setOrigEstimate] = useState<ImportedEstimate | null>(null);
  const [revEstimate, setRevEstimate] = useState<ImportedEstimate | null>(null);

  // Compute comparison if both are loaded
  const comparisonReport =
    origEstimate && revEstimate ? compareEstimates(origEstimate.lines, revEstimate.lines) : null;

  return (
    <main className="min-h-screen w-full bg-zinc-50 text-zinc-950">
      <Header />
      <Hero
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        importedEstimate={importedEstimate}
        onImported={setImportedEstimate}
        origEstimate={origEstimate}
        setOrigEstimate={setOrigEstimate}
        revEstimate={revEstimate}
        setRevEstimate={setRevEstimate}
      />

      {activeTab === "audit" ? (
        <EstimateCalculatorPanel importedEstimate={importedEstimate} />
      ) : (
        comparisonReport && (
          <section id="comparison-report" className="mx-auto max-w-7xl px-4 pb-14 pt-8 md:px-8 md:pb-24">
            <EstimateComparisonReport
              report={comparisonReport}
              origFileName={origEstimate?.fileName ?? "Смета 1"}
              revFileName={revEstimate?.fileName ?? "Смета 2"}
              onReset={() => {
                setOrigEstimate(null);
                setRevEstimate(null);
              }}
            />
          </section>
        )
      )}
    </main>
  );
}
