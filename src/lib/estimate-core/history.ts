import type { ImportedEstimateLine } from "./types";

export type HistoryItem = {
  id: string;
  timestamp: number;
  fileName: string;
  lineCount: number;
  errorCount: number;
  warningCount: number;
  grandTotalKopecks: number;
  totalDifferenceKopecks: number;
  readinessStatus: "ready" | "needsReview" | "blocked";
  lines: ImportedEstimateLine[];
  // Comparison fields
  isComparison: boolean;
  revisedFileName?: string;
  revisedLines?: ImportedEstimateLine[];
};

const HISTORY_KEY = "smetafix_audit_history";

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToHistory(
  fileName: string,
  lines: ImportedEstimateLine[],
  summary: {
    errorCount: number;
    warningCount: number;
    grandTotalKopecks: number;
    totalDifferenceKopecks: number;
    readinessStatus: "ready" | "needsReview" | "blocked";
  },
  isComparison = false,
  revisedFileName?: string,
  revisedLines?: ImportedEstimateLine[]
): HistoryItem[] {
  if (typeof window === "undefined") return [];

  const history = getHistory();
  
  // Create new item
  const newItem: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    fileName,
    lineCount: lines.length,
    errorCount: summary.errorCount,
    warningCount: summary.warningCount,
    grandTotalKopecks: summary.grandTotalKopecks,
    totalDifferenceKopecks: summary.totalDifferenceKopecks,
    readinessStatus: summary.readinessStatus,
    lines,
    isComparison,
    revisedFileName,
    revisedLines
  };

  // Prepend and limit to 5 items
  const updated = [newItem, ...history.filter(item => item.fileName !== fileName)].slice(0, 5);
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history to localStorage", e);
  }

  return updated;
}

export function deleteFromHistory(id: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  const history = getHistory();
  const updated = history.filter(item => item.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete from localStorage", e);
  }
  return updated;
}
