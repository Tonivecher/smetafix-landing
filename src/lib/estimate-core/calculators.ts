import {
  applyPercent,
  calculateVatExcluded,
  calculateVatIncluded,
  multiplyMoney,
} from "./money";
import type {
  EstimateInput,
  EstimateLineResult,
  EstimateResult,
  NormativeResult,
  VatResult,
} from "./types";
import { validateEstimateInput } from "./validators";

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function calculateLineTotal(quantity: number, unitPriceKopecks: number) {
  return multiplyMoney(unitPriceKopecks, quantity);
}

export function calculateEstimateLines(input: EstimateInput): EstimateLineResult[] {
  return input.lines.map((line) => ({
    ...line,
    totalKopecks: calculateLineTotal(line.quantity, line.unitPriceKopecks),
  }));
}

function calculateVat(baseKopecks: number, vatMode: EstimateInput["vatMode"], vatRate: number): VatResult {
  if (vatMode === "none") {
    return {
      netKopecks: baseKopecks,
      vatKopecks: 0,
      totalKopecks: baseKopecks,
    };
  }

  if (vatMode === "included") {
    return calculateVatIncluded(baseKopecks, vatRate);
  }

  return calculateVatExcluded(baseKopecks, vatRate);
}

function calculateNormative(input: EstimateInput, subtotalKopecks: number): NormativeResult {
  const directCostKopecks = multiplyMoney(subtotalKopecks, input.coefficient);
  const overheadKopecks = applyPercent(directCostKopecks, input.overheadPercent);
  const estimatedProfitKopecks = applyPercent(directCostKopecks, input.estimatedProfitPercent);
  const beforeIndexKopecks = directCostKopecks + overheadKopecks + estimatedProfitKopecks;
  const beforeVatKopecks = multiplyMoney(beforeIndexKopecks, input.indexationCoefficient);

  return {
    directCostKopecks,
    overheadKopecks,
    estimatedProfitKopecks,
    beforeIndexKopecks,
    beforeVatKopecks,
  };
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const lines = calculateEstimateLines(input);
  const subtotalKopecks = sum(lines.map((line) => line.totalKopecks));

  if (input.mode === "russianNormative") {
    const normative = calculateNormative(input, subtotalKopecks);
    const vat = calculateVat(normative.beforeVatKopecks, input.vatMode, input.vatRate);

    return {
      lines,
      subtotalKopecks,
      discountKopecks: 0,
      markupKopecks: 0,
      coefficientKopecks: normative.directCostKopecks - subtotalKopecks,
      beforeVatKopecks: normative.beforeVatKopecks,
      vat,
      grandTotalKopecks: vat.totalKopecks,
      normative,
      issues: validateEstimateInput(input),
    };
  }

  const discountKopecks = applyPercent(subtotalKopecks, input.discountPercent);
  const afterDiscountKopecks = subtotalKopecks - discountKopecks;
  const markupKopecks = applyPercent(afterDiscountKopecks, input.markupPercent);
  const afterMarkupKopecks = afterDiscountKopecks + markupKopecks;
  const beforeVatKopecks = multiplyMoney(afterMarkupKopecks, input.coefficient);
  const vat = calculateVat(beforeVatKopecks, input.vatMode, input.vatRate);

  return {
    lines,
    subtotalKopecks,
    discountKopecks,
    markupKopecks,
    coefficientKopecks: beforeVatKopecks - afterMarkupKopecks,
    beforeVatKopecks,
    vat,
    grandTotalKopecks: vat.totalKopecks,
    issues: validateEstimateInput(input),
  };
}
