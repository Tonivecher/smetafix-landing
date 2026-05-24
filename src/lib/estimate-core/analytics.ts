import type { ImportedEstimateLine, AbcClass, SectionCostBreakdown, BudgetAnomaly, EstimateAnalyticsResult } from "./types";
import { formatMoney } from "./money";

export function runEstimateAnalytics(lines: ImportedEstimateLine[]): EstimateAnalyticsResult {
  const abcClasses: Record<string, AbcClass> = {};
  const anomalies: BudgetAnomaly[] = [];

  const totalBudgetKopecks = lines.reduce((acc, line) => acc + line.calculatedTotalKopecks, 0);
  const averageLineCostKopecks = lines.length > 0 ? Math.round(totalBudgetKopecks / lines.length) : 0;

  // 1. ABC Analysis
  // Sort lines by cost descending
  const sortedLines = [...lines].sort((a, b) => b.calculatedTotalKopecks - a.calculatedTotalKopecks);
  let cumulativeKopecks = 0;
  let classACostKopecks = 0;
  let classACount = 0;

  sortedLines.forEach((line) => {
    const lineCost = line.calculatedTotalKopecks;
    // Calculate cumulative percentage BEFORE this line
    const prevPercent = totalBudgetKopecks > 0 ? (cumulativeKopecks / totalBudgetKopecks) * 100 : 0;
    
    cumulativeKopecks += lineCost;

    let abcClass: AbcClass = "C";
    if (prevPercent <= 80) {
      abcClass = "A";
      classACostKopecks += lineCost;
      classACount++;
    } else if (prevPercent <= 95) {
      abcClass = "B";
    } else {
      abcClass = "C";
    }

    abcClasses[line.id] = abcClass;
  });

  // 2. Sections Breakdown
  const sectionsMap = new Map<string, { totalKopecks: number; itemCount: number }>();
  lines.forEach((line) => {
    const sectionName = (line.section || "Общие работы").trim();
    const current = sectionsMap.get(sectionName) || { totalKopecks: 0, itemCount: 0 };
    sectionsMap.set(sectionName, {
      totalKopecks: current.totalKopecks + line.calculatedTotalKopecks,
      itemCount: current.itemCount + 1,
    });
  });

  const sectionsBreakdown: SectionCostBreakdown[] = Array.from(sectionsMap.entries())
    .map(([name, data]) => {
      const percent = totalBudgetKopecks > 0 ? Number(((data.totalKopecks / totalBudgetKopecks) * 100).toFixed(1)) : 0;
      return {
        name,
        totalKopecks: data.totalKopecks,
        percent,
        itemCount: data.itemCount,
      };
    })
    .sort((a, b) => b.totalKopecks - a.totalKopecks);

  // 3. Price Averages by Unit (to detect price anomalies)
  const unitStats = new Map<string, { totalKopecks: number; count: number }>();
  lines.forEach((line) => {
    const unit = (line.unit || "ед.").trim().toLowerCase();
    if (line.unitPriceKopecks > 0) {
      const current = unitStats.get(unit) || { totalKopecks: 0, count: 0 };
      unitStats.set(unit, {
        totalKopecks: current.totalKopecks + line.unitPriceKopecks,
        count: current.count + 1,
      });
    }
  });

  const unitAverages = new Map<string, number>();
  unitStats.forEach((data, unit) => {
    unitAverages.set(unit, Math.round(data.totalKopecks / data.count));
  });

  // 4. Anomaly Detection and Recommendations
  lines.forEach((line) => {
    const cost = line.calculatedTotalKopecks;
    const percent = totalBudgetKopecks > 0 ? (cost / totalBudgetKopecks) * 100 : 0;

    // A. High Cost Concentration Anomaly
    if (percent > 15 && totalBudgetKopecks > 0) {
      anomalies.push({
        lineId: line.id,
        lineName: line.name,
        type: "high_concentration",
        severity: "critical",
        message: `Позиция составляет ${percent.toFixed(1)}% от всего бюджета сметы (${formatMoney(cost)}). Любое изменение объемов или расценок по этой работе окажет критическое влияние на смету. Рекомендуется тщательно перепроверить замеры и провести конъюнктурный анализ рынка по данной позиции.`,
        impactPercent: Number(percent.toFixed(1)),
      });
    }

    // B. Anomalous Unit Price Anomaly
    const unit = (line.unit || "ед.").trim().toLowerCase();
    const avgPrice = unitAverages.get(unit) || 0;
    if (avgPrice > 0 && line.unitPriceKopecks > avgPrice * 2.2) {
      const surgePercent = Math.round(((line.unitPriceKopecks - avgPrice) / avgPrice) * 100);
      anomalies.push({
        lineId: line.id,
        lineName: line.name,
        type: "anomalous_price",
        severity: "warning",
        message: `Стоимость за единицу ${formatMoney(line.unitPriceKopecks)} превышает среднее значение по смете для единиц «${line.unit}» (${formatMoney(avgPrice)}) на ${surgePercent}%. Рекомендуется запросить детальную калькуляцию затрат у подрядчика.`,
        impactPercent: Number(percent.toFixed(1)),
      });
    }
  });

  // Sort anomalies by severity (critical first) and impact
  anomalies.sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (a.severity !== "critical" && b.severity === "critical") return 1;
    return b.impactPercent - a.impactPercent;
  });

  return {
    abcClasses,
    sectionsBreakdown,
    anomalies,
    metrics: {
      totalBudgetKopecks,
      classACostKopecks,
      classACount,
      averageLineCostKopecks,
    },
  };
}
