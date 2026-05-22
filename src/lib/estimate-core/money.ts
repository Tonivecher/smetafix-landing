const KOPECKS_IN_RUBLE = 100;

export function parseMoneyToKopecks(value: string | number): number {
  if (typeof value === "number") {
    return Math.round(value * KOPECKS_IN_RUBLE);
  }

  const normalized = value
    .replace(/[₽\s]/g, "")
    .replace(",", ".")
    .trim();

  if (!normalized || Number.isNaN(Number(normalized))) {
    return 0;
  }

  return Math.round(Number(normalized) * KOPECKS_IN_RUBLE);
}

export function formatMoney(kopecks: number): string {
  const sign = kopecks < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(kopecks));
  const rubles = Math.floor(absolute / KOPECKS_IN_RUBLE);
  const cents = absolute % KOPECKS_IN_RUBLE;

  const formattedRubles = new Intl.NumberFormat("ru-RU")
    .format(rubles)
    .replace(/\u00a0/g, " ");

  return `${sign}${formattedRubles},${String(cents).padStart(2, "0")} ₽`;
}

export function multiplyMoney(kopecks: number, multiplier: number): number {
  return Math.round(kopecks * multiplier);
}

export function applyPercent(kopecks: number, percent: number): number {
  return Math.round((kopecks * percent) / 100);
}

export function calculateVatExcluded(netKopecks: number, vatRate: number) {
  const vatKopecks = applyPercent(netKopecks, vatRate);

  return {
    netKopecks,
    vatKopecks,
    totalKopecks: netKopecks + vatKopecks,
  };
}

export function calculateVatIncluded(totalKopecks: number, vatRate: number) {
  if (vatRate <= 0) {
    return {
      netKopecks: totalKopecks,
      vatKopecks: 0,
      totalKopecks,
    };
  }

  const netKopecks = Math.round((totalKopecks * 100) / (100 + vatRate));
  const vatKopecks = totalKopecks - netKopecks;

  return {
    netKopecks,
    vatKopecks,
    totalKopecks,
  };
}
