import type { ImportedEstimateLine, ComparisonLineResult, ComparisonReport, LineChangeType } from "./types";

// Sørensen–Dice coefficient for fuzzy string matching
export function getStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-zа-я0-9]/g, "");
  const s2 = str2.toLowerCase().replace(/[^a-zа-я0-9]/g, "");
  
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.length < 2 || s2.length < 2) {
    return s1 === s2 ? 1.0 : 0.0;
  }

  const bigrams1 = new Set<string>();
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.substring(i, i + 2));
  }

  let matches = 0;
  const bigrams2Count = s2.length - 1;
  for (let i = 0; i < bigrams2Count; i++) {
    const bigram = s2.substring(i, i + 2);
    if (bigrams1.has(bigram)) {
      matches++;
    }
  }

  return (2.0 * matches) / (bigrams1.size + bigrams2Count);
}

export function compareEstimates(
  originalLines: ImportedEstimateLine[],
  revisedLines: ImportedEstimateLine[]
): ComparisonReport {
  const results: ComparisonLineResult[] = [];
  
  // Track matched indices
  const matchedOriginals = new Set<number>();
  const matchedReviseds = new Set<number>();

  // Pass 1: Exact matches by name and unit
  originalLines.forEach((orig, origIdx) => {
    let bestRevIdx = -1;
    revisedLines.forEach((rev, revIdx) => {
      if (matchedReviseds.has(revIdx)) return;
      if (orig.name.trim().toLowerCase() === rev.name.trim().toLowerCase() && orig.unit === rev.unit) {
        bestRevIdx = revIdx;
      }
    });

    if (bestRevIdx !== -1) {
      matchedOriginals.add(origIdx);
      matchedReviseds.add(bestRevIdx);
      
      const rev = revisedLines[bestRevIdx];
      const isModified =
        orig.quantity !== rev.quantity || orig.unitPriceKopecks !== rev.unitPriceKopecks;
      
      results.push(createComparisonResult(orig, rev, isModified ? "modified" : "unchanged"));
    }
  });

  // Pass 2: Fuzzy matches by name similarity (threshold >= 0.7) and same unit
  originalLines.forEach((orig, origIdx) => {
    if (matchedOriginals.has(origIdx)) return;

    let bestRevIdx = -1;
    let highestSim = 0.0;

    revisedLines.forEach((rev, revIdx) => {
      if (matchedReviseds.has(revIdx)) return;
      if (orig.unit !== rev.unit) return;

      const sim = getStringSimilarity(orig.name, rev.name);
      if (sim >= 0.7 && sim > highestSim) {
        highestSim = sim;
        bestRevIdx = revIdx;
      }
    });

    if (bestRevIdx !== -1) {
      matchedOriginals.add(origIdx);
      matchedReviseds.add(bestRevIdx);

      const rev = revisedLines[bestRevIdx];
      results.push(createComparisonResult(orig, rev, "modified"));
    }
  });

  // Pass 3: Process remaining unmatched original lines (REMOVED)
  originalLines.forEach((orig, origIdx) => {
    if (matchedOriginals.has(origIdx)) return;
    results.push({
      id: orig.id,
      changeType: "removed",
      name: orig.name,
      unit: orig.unit,
      originalQuantity: orig.quantity,
      originalUnitPriceKopecks: orig.unitPriceKopecks,
      originalTotalKopecks: orig.calculatedTotalKopecks,
      totalDeltaKopecks: -orig.calculatedTotalKopecks,
      sourceRowNumber: orig.sourceRowNumber
    });
  });

  // Pass 4: Process remaining unmatched revised lines (ADDED)
  revisedLines.forEach((rev, revIdx) => {
    if (matchedReviseds.has(revIdx)) return;
    results.push({
      id: rev.id,
      changeType: "added",
      name: rev.name,
      unit: rev.unit,
      revisedQuantity: rev.quantity,
      revisedUnitPriceKopecks: rev.unitPriceKopecks,
      revisedTotalKopecks: rev.calculatedTotalKopecks,
      totalDeltaKopecks: rev.calculatedTotalKopecks,
      sourceRowNumber: rev.sourceRowNumber
    });
  });

  // Calculate totals and statistics
  let originalTotal = 0;
  let revisedTotal = 0;
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;

  results.forEach((res) => {
    originalTotal += res.originalTotalKopecks || 0;
    revisedTotal += res.revisedTotalKopecks || 0;

    if (res.changeType === "added") addedCount++;
    else if (res.changeType === "removed") removedCount++;
    else if (res.changeType === "modified") modifiedCount++;
    else if (res.changeType === "unchanged") unchangedCount++;
  });

  // Sort results by sourceRowNumber or position so that they display in order
  results.sort((a, b) => {
    const rowA = a.sourceRowNumber || 99999;
    const rowB = b.sourceRowNumber || 99999;
    return rowA - rowB;
  });

  return {
    summary: {
      originalTotalKopecks: originalTotal,
      revisedTotalKopecks: revisedTotal,
      totalDeltaKopecks: revisedTotal - originalTotal,
      addedLinesCount: addedCount,
      removedLinesCount: removedCount,
      modifiedLinesCount: modifiedCount,
      unchangedLinesCount: unchangedCount
    },
    lines: results
  };
}

function createComparisonResult(
  orig: ImportedEstimateLine,
  rev: ImportedEstimateLine,
  changeType: LineChangeType
): ComparisonLineResult {
  const quantityDelta = rev.quantity - orig.quantity;
  const unitPriceDeltaKopecks = rev.unitPriceKopecks - orig.unitPriceKopecks;
  const totalDeltaKopecks = rev.calculatedTotalKopecks - orig.calculatedTotalKopecks;

  return {
    id: rev.id,
    changeType,
    name: rev.name,
    unit: rev.unit,
    originalQuantity: orig.quantity,
    originalUnitPriceKopecks: orig.unitPriceKopecks,
    originalTotalKopecks: orig.calculatedTotalKopecks,
    revisedQuantity: rev.quantity,
    revisedUnitPriceKopecks: rev.unitPriceKopecks,
    revisedTotalKopecks: rev.calculatedTotalKopecks,
    quantityDelta: changeType === "modified" ? quantityDelta : 0,
    unitPriceDeltaKopecks: changeType === "modified" ? unitPriceDeltaKopecks : 0,
    totalDeltaKopecks: changeType === "modified" ? totalDeltaKopecks : 0,
    sourceRowNumber: rev.sourceRowNumber || orig.sourceRowNumber
  };
}
