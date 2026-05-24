import {
  applyPercent,
  calculateEstimate,
  buildCheckReport,
  calculateVatExcluded,
  calculateVatIncluded,
  formatMoney,
  multiplyMoney,
  parseEstimateText,
  parseMoneyToKopecks,
  runEstimateSelfChecks,
  compareEstimates,
} from "../src/lib/estimate-core";

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const base = parseMoneyToKopecks("100000");
assertEqual(formatMoney(base), "100 000,00 ₽", "money formatting");

const excluded = calculateVatExcluded(base, 20);
assertEqual(excluded.vatKopecks, 2_000_000, "VAT excluded amount");
assertEqual(excluded.totalKopecks, 12_000_000, "VAT excluded total");

const included = calculateVatIncluded(12_000_000, 20);
assertEqual(included.netKopecks, 10_000_000, "VAT included net");
assertEqual(included.vatKopecks, 2_000_000, "VAT included amount");

assertEqual(multiplyMoney(parseMoneyToKopecks("800"), 12.5), 1_000_000, "line total");
assertEqual(applyPercent(parseMoneyToKopecks("50000"), 10), 500_000, "percent amount");

const estimate = calculateEstimate({
  mode: "russianNormative",
  officialFormat: "strictRf",
  strictRfForm: "localEstimate",
  vatMode: "excluded",
  vatRate: 20,
  discountPercent: 0,
  markupPercent: 0,
  coefficient: 1.15,
  overheadPercent: 16,
  estimatedProfitPercent: 8,
  indexationCoefficient: 1.1,
  metadata: {
    region: "Москва",
    priceLevel: "Текущий",
    method: "resourceIndex",
    objectType: "Капитальный ремонт",
  },
  lines: [
    {
      id: "demo",
      name: "Демонтаж",
      unit: "м2",
      quantity: 12.5,
      unitPriceKopecks: parseMoneyToKopecks("800"),
    },
  ],
});

assertEqual(estimate.subtotalKopecks, 1_000_000, "estimate subtotal");
assertEqual(estimate.normative?.directCostKopecks, 1_150_000, "normative direct cost");
assertEqual(estimate.normative?.beforeVatKopecks, 1_568_600, "normative before VAT");
assertEqual(estimate.grandTotalKopecks, 1_882_320, "normative grand total");

const checks = runEstimateSelfChecks();
assertEqual(checks.ok, true, "runtime self-check");

const parsedText = parseEstimateText(`Работа;Ед.;Кол.;Цена;Сумма
Демонтаж;м2;12,5;800;10000
Грунтовка;м2;10;120;1100`);

assertEqual(parsedText.lines.length, 2, "parsed estimate rows");
assertEqual(parsedText.lines[0].quantity, 12.5, "parsed quantity with comma");
assertEqual(parsedText.lines[0].unitPriceKopecks, 80_000, "parsed unit price");
assertEqual(parsedText.lines[0].declaredTotalKopecks, 1_000_000, "parsed declared total");
assertEqual(parsedText.lines[0].sourceRowNumber, 2, "parsed source row number");
assertEqual(parsedText.lines[1].calculatedTotalKopecks, 120_000, "parsed calculated total");
assertEqual(parsedText.lines[1].differenceKopecks, 10_000, "parsed declared difference");
assertEqual(parsedText.issues.some((issue) => issue.code === "import-total-mismatch-3"), true, "import mismatch warning");

const reportEstimateInput = {
  mode: "commercial" as const,
  officialFormat: "business" as const,
  vatMode: "excluded" as const,
  vatRate: 20,
  discountPercent: 0,
  markupPercent: 0,
  coefficient: 1,
  overheadPercent: 16,
  estimatedProfitPercent: 8,
  indexationCoefficient: 1,
  metadata: {},
  lines: parsedText.lines,
};
const reportEstimate = calculateEstimate(reportEstimateInput);
const report = buildCheckReport({
  fileName: "demo.csv",
  importResult: parsedText,
  estimateInput: reportEstimateInput,
  estimateResult: reportEstimate,
});

assertEqual(report.summary.fileName, "demo.csv", "report file name");
assertEqual(report.summary.lineCount, 2, "report line count");
assertEqual(report.summary.declaredTotalKopecks, 1_110_000, "report declared total");
assertEqual(report.summary.calculatedTotalKopecks, 1_120_000, "report calculated total");
assertEqual(report.summary.totalDifferenceKopecks, 10_000, "report total difference");
assertEqual(report.findings.some((finding) => finding.type === "lineDifference"), true, "report line difference finding");
assertEqual(report.recommendations.length > 0, true, "report recommendations");

// Comparison tests
const origParsed = parseEstimateText(`Работа;Ед.;Кол.;Цена;Сумма
Демонтаж старого паркета;м2;10;100;1000
Штукатурка стен по маякам;м2;12;200;2400`);

const revParsed = parseEstimateText(`Работа;Ед.;Кол.;Цена;Сумма
Демонтаж старого паркета;м2;10;120;1200
Покраска стен водоэмульсионной краской;м2;8;150;1200`);

const comparison = compareEstimates(origParsed.lines, revParsed.lines);

assertEqual(comparison.summary.originalTotalKopecks, 340_000, "comparison original total");
assertEqual(comparison.summary.revisedTotalKopecks, 240_000, "comparison revised total");
assertEqual(comparison.summary.totalDeltaKopecks, -100_000, "comparison total delta");
assertEqual(comparison.summary.addedLinesCount, 1, "comparison added lines count");
assertEqual(comparison.summary.removedLinesCount, 1, "comparison removed lines count");
assertEqual(comparison.summary.modifiedLinesCount, 1, "comparison modified lines count");
assertEqual(comparison.summary.unchangedLinesCount, 0, "comparison unchanged lines count");

assertEqual(comparison.lines.length, 3, "comparison lines length");
assertEqual(comparison.lines.find(l => l.name.includes("Демонтаж"))?.changeType, "modified", "comparison line modified");
assertEqual(comparison.lines.find(l => l.name.includes("Штукатурка"))?.changeType, "removed", "comparison line removed");
assertEqual(comparison.lines.find(l => l.name.includes("Покраска"))?.changeType, "added", "comparison line added");

// Analytics tests
import { runEstimateAnalytics } from "../src/lib/estimate-core";

const parsedAnalytics = parseEstimateText(`Работа;Ед.;Кол.;Цена;Сумма
Раздел 1;;;;
Работа 1;шт;10;1000;10000
Работа 2;шт;2;500;1000
Раздел 2;;;;
Работа 3;м2;1;50000;50000`);

assertEqual(parsedAnalytics.lines.length, 3, "analytics lines length");
assertEqual(parsedAnalytics.lines[0].section, "Раздел 1", "analytics section 1 name");
assertEqual(parsedAnalytics.lines[1].section, "Раздел 1", "analytics section 1 name 2");
assertEqual(parsedAnalytics.lines[2].section, "Раздел 2", "analytics section 2 name");

const analyticsResult = runEstimateAnalytics(parsedAnalytics.lines);

// Metrics
assertEqual(analyticsResult.metrics.totalBudgetKopecks, 6_100_000, "analytics total budget"); // 10000 + 1000 + 50000 = 61000
assertEqual(analyticsResult.abcClasses[parsedAnalytics.lines[2].id], "A", "analytics ABC class for Работа 3"); // 50000 is 81.9% of budget
assertEqual(analyticsResult.abcClasses[parsedAnalytics.lines[0].id], "B", "analytics ABC class for Работа 1");
assertEqual(analyticsResult.abcClasses[parsedAnalytics.lines[1].id], "C", "analytics ABC class for Работа 2");

// Sections Breakdown
assertEqual(analyticsResult.sectionsBreakdown.length, 2, "analytics sections count");
assertEqual(analyticsResult.sectionsBreakdown[0].name, "Раздел 2", "analytics section cost breakdown descending 1");
assertEqual(analyticsResult.sectionsBreakdown[0].totalKopecks, 5_000_000, "analytics section cost total");
assertEqual(analyticsResult.sectionsBreakdown[1].name, "Раздел 1", "analytics section cost breakdown descending 2");

// Anomalies
assertEqual(analyticsResult.anomalies.length > 0, true, "analytics anomalies count");
assertEqual(analyticsResult.anomalies[0].type, "high_concentration", "analytics critical concentration anomaly");
assertEqual(analyticsResult.anomalies[0].lineName, "Работа 3", "analytics anomaly target");

console.log("estimate-core self-check and comparison tests passed");

