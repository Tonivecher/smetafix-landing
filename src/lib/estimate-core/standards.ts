import type { OfficialFormat, StrictRfForm } from "./types";

export const officialFormatLabels: Record<OfficialFormat, string> = {
  none: "Без официального формата",
  business: "Деловой формат для клиента",
  strictRf: "Строгий профиль РФ",
};

export const strictRfFormLabels: Record<StrictRfForm, string> = {
  localEstimate: "Локальная смета / ЛСР",
  objectEstimate: "Объектная смета",
  consolidatedEstimate: "Сводный сметный расчёт",
  ks2: "КС-2",
  ks3: "КС-3",
};

export const strictRfRequiredMetadata = [
  "region",
  "priceLevel",
  "method",
  "objectType",
] as const;

export const normativeLimitations = [
  "Проверка не заменяет государственную или негосударственную экспертизу.",
  "Актуальные индексы, ФРСН и ФГИС ЦС в локальном MVP не подтягиваются автоматически.",
  "Строгий профиль проверяет готовность данных к форме, но не выпускает юридически значимый документ.",
];
