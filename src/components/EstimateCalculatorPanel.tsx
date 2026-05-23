"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  buildCheckReport,
  calculateEstimate,
  calculateLineTotal,
  formatMoney,
  officialFormatLabels,
  parseMoneyToKopecks,
  runEstimateSelfChecks,
  strictRfFormLabels,
  type EstimateInput,
  type EstimateMode,
  type ImportedEstimateLine,
  type OfficialFormat,
  type StrictRfForm,
  type VatMode,
} from "@/lib/estimate-core";
import { EstimateCheckReport } from "./EstimateCheckReport";
import type { ImportedEstimate } from "./FileUploadChecker";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

function Field({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-tight text-zinc-500">{label}</span>
      <span className="mt-2 flex min-h-[3rem] items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-950 transition-colors focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
        {suffix && <span className="ml-2 text-sm text-zinc-400">{suffix}</span>}
      </span>
    </label>
  );
}

function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map(([option, label]) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`relative min-h-[2.75rem] rounded-xl px-4 py-2 text-left text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isActive ? "text-zinc-950" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="segment-bg"
                className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-zinc-200"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EstimateCalculatorPanel({
  importedEstimate,
}: {
  importedEstimate: ImportedEstimate | null;
}) {
  const [mode, setMode] = useState<EstimateMode>("commercial");
  const [officialFormat, setOfficialFormat] = useState<OfficialFormat>("business");
  const [strictRfForm, setStrictRfForm] = useState<StrictRfForm>("localEstimate");
  const [vatMode, setVatMode] = useState<VatMode>("excluded");
  const [vatRate, setVatRate] = useState(20);
  const [quantity, setQuantity] = useState(42);
  const [unitPrice, setUnitPrice] = useState(1350);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [markupPercent, setMarkupPercent] = useState(12);
  const [coefficient, setCoefficient] = useState(1);
  const [overheadPercent, setOverheadPercent] = useState(16);
  const [estimatedProfitPercent, setEstimatedProfitPercent] = useState(8);
  const [indexationCoefficient, setIndexationCoefficient] = useState(1.1);
  const [region, setRegion] = useState("Москва");
  const [priceLevel, setPriceLevel] = useState("Текущий уровень цен");
  const [objectType, setObjectType] = useState("Капитальный ремонт");

  const selfCheck = runEstimateSelfChecks();
  const activeLines: ImportedEstimateLine[] = importedEstimate?.lines.length
    ? importedEstimate.lines
    : [
        {
          id: "main",
          name: "Работы по смете",
          unit: "м2",
          quantity,
          unitPriceKopecks: parseMoneyToKopecks(unitPrice),
          sourceRowNumber: 1,
          calculatedTotalKopecks: calculateLineTotal(quantity, parseMoneyToKopecks(unitPrice)),
        },
      ];

  const estimateInput: EstimateInput = {
    mode,
    officialFormat,
    strictRfForm: officialFormat === "strictRf" ? strictRfForm : undefined,
    vatMode,
    vatRate,
    discountPercent,
    markupPercent,
    coefficient,
    overheadPercent,
    estimatedProfitPercent,
    indexationCoefficient,
    metadata: {
      region,
      priceLevel,
      method: "resourceIndex",
      objectType,
    },
    lines: activeLines,
  };

  const result = calculateEstimate(estimateInput);
  const report = buildCheckReport({
    fileName: importedEstimate?.fileName,
    importResult: importedEstimate,
    estimateInput,
    estimateResult: result,
  });

  const allIssues = [...(importedEstimate?.issues ?? []), ...result.issues];
  const blockingIssues = allIssues.filter((issue) => issue.severity === "error");
  const warnings = allIssues.filter((issue) => issue.severity !== "error");

  return (
    <section id="calculator" className="mx-auto max-w-7xl px-4 pb-14 pt-8 md:px-8 md:pb-24">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-tight text-zinc-600">
            калькулятор проверки
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 md:text-5xl leading-tight">
            Расчёт и валидация данных
          </h2>
          <p className="mt-6 max-w-lg leading-relaxed text-zinc-600">
            Калькулятор пересчитывает все позиции сметы, применяя актуальные налоги и коэффициенты. 
            Если результат расходится с вашим файлом — вы сразу увидите разницу.
          </p>
          
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex items-center gap-3">
              {selfCheck.ok ? (
                <CheckCircle size={24} weight="fill" className="text-emerald-500" />
              ) : (
                <WarningCircle size={24} weight="fill" className="text-red-500" />
              )}
              <h3 className="font-semibold text-zinc-950">Статус ядра расчётов</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {selfCheck.ok
                ? "Все внутренние тесты пройдены. Модуль расчётов стабилен."
                : "Тесты провалены. Итоги требуют ручной проверки."}
            </p>
          </div>
        </div>

        <motion.div
          layout
          className="rounded-[2.5rem] border border-slate-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] md:p-10"
        >
          <div className="grid gap-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-zinc-950">Тип сметы</p>
                <div className="rounded-xl bg-zinc-100/50 p-1">
                  <Segment
                    value={mode}
                    onChange={setMode}
                    options={[
                      ["commercial", "Коммерческая"],
                      ["russianNormative", "Нормативная РФ"],
                    ]}
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-zinc-950">Официальный формат</p>
                <div className="rounded-xl bg-zinc-100/50 p-1">
                  <Segment
                    value={officialFormat}
                    onChange={setOfficialFormat}
                    options={[
                      ["none", officialFormatLabels.none],
                      ["business", officialFormatLabels.business],
                      ["strictRf", officialFormatLabels.strictRf],
                    ]}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {officialFormat === "strictRf" && (
                <motion.label
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="block"
                >
                  <span className="text-sm font-semibold text-zinc-950">Форма строгого профиля РФ</span>
                  <select
                    value={strictRfForm}
                    onChange={(event) => setStrictRfForm(event.target.value as StrictRfForm)}
                    className="mt-3 block min-h-[3rem] w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    {Object.entries(strictRfFormLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </motion.label>
              )}
            </AnimatePresence>

            {importedEstimate ? (
              <motion.div layout className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-5">
                <p className="font-semibold text-zinc-950">{importedEstimate.fileName}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  В расчёте используются {importedEstimate.lines.length} строк из файла.
                </p>
                <div className="mt-4 max-h-44 overflow-y-auto rounded-xl border border-zinc-200 bg-white">
                  {importedEstimate.lines.slice(0, 8).map((line) => (
                    <div key={line.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0">
                      <span className="truncate text-zinc-600">{line.name}</span>
                      <span className="font-mono text-zinc-950">{formatMoney(Math.round(line.quantity * line.unitPriceKopecks))}</span>
                    </div>
                  ))}
                  {importedEstimate.lines.length > 8 && (
                    <div className="bg-zinc-50 px-4 py-2 text-center text-xs text-zinc-500">
                      И ещё {importedEstimate.lines.length - 8} строк...
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div layout className="grid gap-4 sm:grid-cols-2">
                <Field label="Количество" value={quantity} onChange={setQuantity} suffix="ед." />
                <Field label="Цена за единицу" value={unitPrice} onChange={setUnitPrice} suffix="₽" />
              </motion.div>
            )}

            <motion.div layout className="grid gap-4 sm:grid-cols-2">
              {mode === "commercial" && (
                <>
                  <Field label="Скидка" value={discountPercent} onChange={setDiscountPercent} suffix="%" />
                  <Field label="Наценка" value={markupPercent} onChange={setMarkupPercent} suffix="%" />
                </>
              )}
              <Field label="Коэффициент" value={coefficient} onChange={setCoefficient} step={0.01} />
              <Field label="НДС" value={vatRate} onChange={setVatRate} suffix="%" />
            </motion.div>

            <motion.div layout>
              <p className="mb-3 text-sm font-semibold text-zinc-950">Режим НДС</p>
              <div className="rounded-xl bg-zinc-100/50 p-1">
                <Segment
                  value={vatMode}
                  onChange={setVatMode}
                  options={[
                    ["excluded", "НДС сверху"],
                    ["included", "НДС внутри суммы"],
                    ["none", "Без НДС"],
                  ]}
                />
              </div>
            </motion.div>

            <AnimatePresence mode="popLayout">
              {(mode === "russianNormative" || officialFormat === "strictRf") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-5"
                >
                  <p className="text-sm font-semibold text-zinc-950">Профиль нормативной проверки РФ</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Накладные расходы" value={overheadPercent} onChange={setOverheadPercent} suffix="%" />
                    <Field label="Сметная прибыль" value={estimatedProfitPercent} onChange={setEstimatedProfitPercent} suffix="%" />
                    <Field label="Индекс пересчёта" value={indexationCoefficient} onChange={setIndexationCoefficient} step={0.01} />
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Регион</span>
                      <input value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 min-h-[3rem] w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Уровень цен</span>
                      <input value={priceLevel} onChange={(event) => setPriceLevel(event.target.value)} className="mt-2 min-h-[3rem] w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Тип объекта</span>
                      <input value={objectType} onChange={(event) => setObjectType(event.target.value)} className="mt-2 min-h-[3rem] w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout className="grid gap-6 rounded-[2rem] border border-zinc-200 bg-zinc-50 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">До НДС</p>
                <motion.p
                  key={result.beforeVatKopecks}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 font-mono text-3xl font-semibold text-zinc-950"
                >
                  {formatMoney(result.beforeVatKopecks)}
                </motion.p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Итого</p>
                <motion.p
                  key={result.grandTotalKopecks}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 font-mono text-3xl font-semibold text-emerald-600"
                >
                  {formatMoney(result.grandTotalKopecks)}
                </motion.p>
              </div>
              <div className="sm:col-span-2 grid gap-4 border-t border-zinc-200 pt-5 text-sm text-zinc-500 sm:grid-cols-3">
                <span className="flex flex-col gap-1"><span className="text-xs uppercase text-zinc-400">Подытог</span><span className="font-mono text-zinc-700">{formatMoney(result.subtotalKopecks)}</span></span>
                <span className="flex flex-col gap-1"><span className="text-xs uppercase text-zinc-400">НДС</span><span className="font-mono text-zinc-700">{formatMoney(result.vat.vatKopecks)}</span></span>
                <span className="flex flex-col gap-1"><span className="text-xs uppercase text-zinc-400">Замечаний</span><span className="font-medium text-zinc-700">{allIssues.length}</span></span>
              </div>
            </motion.div>

            <AnimatePresence>
              {allIssues.length > 0 && (
                <motion.div layout className="grid gap-3">
                  {blockingIssues.map((issue) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={issue.code}
                      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                      <WarningCircle size={20} weight="fill" className="shrink-0 text-red-500 mt-0.5" />
                      <p>{issue.message}</p>
                    </motion.div>
                  ))}
                  {warnings.slice(0, 4).map((issue) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={issue.code}
                      className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                    >
                      <WarningCircle size={20} weight="fill" className="shrink-0 text-amber-500 mt-0.5" />
                      <p>{issue.message}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <EstimateCheckReport
              report={report}
              lines={activeLines}
              vatRate={vatRate}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
