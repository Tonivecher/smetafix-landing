import {
  applyPercent,
  calculateEstimate,
  calculateVatExcluded,
  calculateVatIncluded,
  formatMoney,
  multiplyMoney,
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

console.log("estimate-core self-check passed");
