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

console.log("estimate-core self-check passed");
