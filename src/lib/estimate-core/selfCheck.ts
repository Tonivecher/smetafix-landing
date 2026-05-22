import { calculateEstimate } from "./calculators";
import {
  applyPercent,
  calculateVatExcluded,
  calculateVatIncluded,
  multiplyMoney,
  parseMoneyToKopecks,
} from "./money";
import type { SelfCheckResult } from "./types";

function check(name: string, actual: number | boolean, expected: number | boolean) {
  return {
    name,
    ok: actual === expected,
    expected: String(expected),
    actual: String(actual),
  };
}

export function runEstimateSelfChecks(): SelfCheckResult {
  const excluded = calculateVatExcluded(parseMoneyToKopecks("100000"), 20);
  const included = calculateVatIncluded(parseMoneyToKopecks("120000"), 20);
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

  const checks = [
    check("VAT excluded amount", excluded.vatKopecks, 2_000_000),
    check("VAT excluded total", excluded.totalKopecks, 12_000_000),
    check("VAT included net", included.netKopecks, 10_000_000),
    check("VAT included amount", included.vatKopecks, 2_000_000),
    check("Line total", multiplyMoney(parseMoneyToKopecks("800"), 12.5), 1_000_000),
    check("Discount amount", applyPercent(parseMoneyToKopecks("50000"), 10), 500_000),
    check("Coefficient amount", multiplyMoney(parseMoneyToKopecks("80000"), 1.15), 9_200_000),
    check("Normative direct cost", estimate.normative?.directCostKopecks ?? 0, 1_150_000),
    check("Normative before VAT", estimate.normative?.beforeVatKopecks ?? 0, 1_568_600),
    check("Normative grand total", estimate.grandTotalKopecks, 1_882_320),
  ];

  return {
    ok: checks.every((item) => item.ok),
    checks,
  };
}
