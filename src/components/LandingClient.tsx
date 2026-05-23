"use client";

import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { EstimateCalculatorPanel } from "./EstimateCalculatorPanel";
import { EstimateComparisonReport } from "./EstimateComparisonReport";
import { HistoryPanel } from "./HistoryPanel";
import {
  compareEstimates,
  getHistory,
  saveToHistory,
  deleteFromHistory,
  type HistoryItem,
} from "@/lib/estimate-core";
import type { ImportedEstimate } from "./FileUploadChecker";

export function LandingClient() {
  const [activeTab, setActiveTab] = useState<"audit" | "compare">("audit");

  // Single audit state
  const [importedEstimate, setImportedEstimate] = useState<ImportedEstimate | null>(null);

  // Comparison state
  const [origEstimate, setOrigEstimate] = useState<ImportedEstimate | null>(null);
  const [revEstimate, setRevEstimate] = useState<ImportedEstimate | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

/* eslint-disable react-hooks/set-state-in-effect */

// Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Auto-save comparison to history when both files are loaded
  useEffect(() => {
    if (origEstimate && revEstimate) {
      const comparison = compareEstimates(origEstimate.lines, revEstimate.lines);
      const summary = {
        errorCount: 0,
        warningCount: comparison.summary.modifiedLinesCount,
        grandTotalKopecks: comparison.summary.revisedTotalKopecks,
        totalDifferenceKopecks: comparison.summary.totalDeltaKopecks,
        readinessStatus: (comparison.summary.totalDeltaKopecks !== 0 ? "needsReview" : "ready") as "ready" | "needsReview" | "blocked",
      };

      const updated = saveToHistory(
        origEstimate.fileName,
        origEstimate.lines,
        summary,
        true,
        revEstimate.fileName,
        revEstimate.lines
      );
      setHistory(updated);
    }
  }, [origEstimate, revEstimate]);

  // Handle single estimate audit load and save
  const handleSingleImport = (estimate: ImportedEstimate | null) => {
    setImportedEstimate(estimate);
    if (estimate) {
      const subtotal = estimate.lines.reduce((acc, l) => acc + l.calculatedTotalKopecks, 0);
      const totalDiff = estimate.lines.reduce((acc, l) => acc + (l.differenceKopecks || 0), 0);
      const criticalCount = estimate.lines.filter((l) => l.differenceSeverity === "critical").length;
      const errorCount =
        estimate.issues.filter((i) => i.severity === "error").length + (criticalCount > 0 ? 1 : 0);

      const summary = {
        errorCount,
        warningCount: estimate.issues.filter((i) => i.severity === "warning").length,
        grandTotalKopecks: subtotal * 1.2, // default 20% VAT сверху
        totalDifferenceKopecks: totalDiff,
        readinessStatus: (errorCount > 0
          ? "blocked"
          : estimate.issues.length > 0
          ? "needsReview"
          : "ready") as "ready" | "needsReview" | "blocked",
      };

      const updated = saveToHistory(estimate.fileName, estimate.lines, summary, false);
      setHistory(updated);
    }
  };

  // Restore state from history item click
  const handleLoadHistoryItem = (item: HistoryItem) => {
    if (item.isComparison) {
      setActiveTab("compare");
      setOrigEstimate({
        fileName: item.fileName,
        lines: item.lines,
        issues: [],
      });
      setRevEstimate({
        fileName: item.revisedFileName || "Смета 2",
        lines: item.revisedLines || [],
        issues: [],
      });
    } else {
      setActiveTab("audit");
      setImportedEstimate({
        fileName: item.fileName,
        lines: item.lines,
        issues: [],
      });
    }

    // Scroll smoothly to report/calculator
    setTimeout(() => {
      document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    setHistory(deleteFromHistory(id));
  };

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
        onImported={handleSingleImport}
        origEstimate={origEstimate}
        setOrigEstimate={setOrigEstimate}
        revEstimate={revEstimate}
        setRevEstimate={setRevEstimate}
      />

      <HistoryPanel
        history={history}
        onLoad={handleLoadHistoryItem}
        onDelete={handleDeleteHistoryItem}
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
