"use client";

import Link from "next/link";
import { useState } from "react";
import {
  errorExamples,
  estimateRows,
  faq,
  features,
  pricing,
  problems,
  workflow,
} from "@/lib/content";
import {
  calculateEstimate,
  formatMoney,
  officialFormatLabels,
  parseEstimateRows,
  parseEstimateText,
  parseMoneyToKopecks,
  runEstimateSelfChecks,
  strictRfFormLabels,
  type EstimateInput,
  type EstimateIssue,
  type EstimateLineInput,
  type EstimateMode,
  type OfficialFormat,
  type StrictRfForm,
  type VatMode,
} from "@/lib/estimate-core";

type Variant = "awwwards" | "minimal";
type UploadState = "empty" | "loading" | "success" | "error";
type ImportedEstimate = {
  fileName: string;
  lines: EstimateLineInput[];
  issues: EstimateIssue[];
};

function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
    >
      <path
        d="M4 12.6 9.1 18 20 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Header({ variant }: { variant: Variant }) {
  const dark = variant === "awwwards";
  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 px-4 py-4 md:px-8 ${
        dark ? "text-[#f7eddc]" : "text-[#27231d]"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border px-4 py-3 backdrop-blur-xl ${
          dark
            ? "border-white/10 bg-[#1f211d]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]"
            : "border-[#27231d]/10 bg-[#fbf7ec]/86 shadow-[0_18px_50px_-34px_rgba(39,35,29,0.45)]"
        }`}
        aria-label="Основная навигация"
      >
        <Link href="/" className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#b98142]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#b98142] text-sm font-semibold text-[#1f211d]">
            SF
          </span>
          <span className="text-sm font-semibold tracking-tight">SmetaFix</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm md:flex">
          <a href="#process" className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#b98142]">Как работает</a>
          <a href="#pricing" className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#b98142]">Тарифы</a>
          <a href="#faq" className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#b98142]">Вопросы</a>
        </div>
        <a
          href="#calculator"
          className={`rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#b98142] ${
            dark ? "bg-[#f7eddc] text-[#1f211d]" : "bg-[#27231d] text-[#fbf7ec]"
          }`}
        >
          Проверить
        </a>
      </nav>
    </header>
  );
}

function CTAButton({
  children,
  tone = "dark",
  onClick,
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-full px-6 py-3 text-sm font-semibold transition duration-300 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#b98142] focus:ring-offset-2 ${
        tone === "dark"
          ? "bg-[#27231d] text-[#fbf7ec] hover:bg-[#3a342b] focus:ring-offset-[#fbf7ec]"
          : "bg-[#fbf7ec] text-[#27231d] hover:bg-white focus:ring-offset-[#27231d]"
      }`}
    >
      {children}
    </button>
  );
}

function EstimateTablePreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#27231d]/12 bg-[#fbf7ec] shadow-[0_24px_70px_-42px_rgba(39,35,29,0.55)]">
      <div className="flex items-center justify-between border-b border-[#27231d]/10 px-5 py-4">
        <div>
          <p className="text-sm font-semibold">Смета_ремонт_квартиры.xlsx</p>
          <p className="text-xs text-[#776d5f]">5 разделов, 84 строки, НДС 20%</p>
        </div>
        <span className="rounded-full bg-[#e6d4b8] px-3 py-1 text-xs font-medium text-[#5a4127]">
          проверка
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[620px] w-full text-left text-sm">
          <thead className="bg-[#efe4d1] text-xs uppercase tracking-[0.14em] text-[#776d5f]">
            <tr>
              {["Работа", "Ед.", "Кол.", "Цена", "Сумма"].map((item) => (
                <th key={item} className="px-5 py-3 font-medium">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27231d]/10">
            {estimateRows.slice(0, compact ? 4 : 5).map((row, index) => (
              <tr key={row[0]} className={index === 3 ? "bg-[#fff7e6]" : ""}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cell}
                    className={`px-5 py-3 ${cellIndex > 1 ? "font-mono text-xs" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function parseEstimateFile(file: File) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv") || fileName.endsWith(".tsv") || fileName.endsWith(".txt")) {
    return parseEstimateText(await file.text());
  }

  if (fileName.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    const rows = await readSheet(file);

    return parseEstimateRows(rows);
  }

  return {
    lines: [],
    issues: [
      {
        code: "unsupported-file-type",
        severity: "error" as const,
        message: "Поддерживаются XLSX, CSV, TSV и TXT. Старый XLS лучше сохранить как XLSX.",
      },
    ],
  };
}

function FileUploadChecker({
  variant,
  importedEstimate,
  onImported,
}: {
  variant: Variant;
  importedEstimate: ImportedEstimate | null;
  onImported: (estimate: ImportedEstimate | null) => void;
}) {
  const [state, setState] = useState<UploadState>("empty");
  const [error, setError] = useState("");
  const dark = variant === "awwwards";

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setState("loading");
    setError("");

    try {
      const result = await parseEstimateFile(file);
      onImported({
        fileName: file.name,
        lines: result.lines,
        issues: result.issues,
      });
      setState(result.lines.length > 0 ? "success" : "error");
      setError(result.lines.length > 0 ? "" : result.issues[0]?.message ?? "Файл не распознан.");
    } catch {
      onImported(null);
      setState("error");
      setError("Не удалось прочитать файл. Попробуйте XLSX, CSV или TSV с колонками работа, количество, цена, сумма.");
    }
  }

  return (
    <section
      aria-label="Загрузка и проверка сметы"
      className={`relative overflow-hidden rounded-[2rem] border p-5 md:p-6 ${
        dark
          ? "border-white/10 bg-[#292a24] text-[#f7eddc] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-[#27231d]/12 bg-white text-[#27231d] shadow-[0_28px_80px_-54px_rgba(39,35,29,0.48)]"
      }`}
    >
      <div className="absolute left-0 right-0 top-0 h-1 bg-[#b98142]" />
      {state === "loading" && <div className="animate-scan-line absolute left-0 top-0 h-1/3 w-full bg-gradient-to-b from-[#b98142]/0 via-[#b98142]/20 to-[#b98142]/0" />}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Загрузка и проверка</h2>
            <p className={`mt-1 text-sm ${dark ? "text-[#d8c9b0]" : "text-[#776d5f]"}`}>
              Загрузите свою смету, сервис прочитает строки и проверит суммы.
            </p>
          </div>
          {importedEstimate && (
            <button
              type="button"
              onClick={() => {
                onImported(null);
                setState("empty");
              }}
              className={`rounded-full border px-3 py-1.5 text-xs transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#b98142] ${
                dark ? "border-white/12 hover:bg-white/8" : "border-[#27231d]/12 hover:bg-[#f4efe4]"
              }`}
            >
              Сбросить
            </button>
          )}
        </div>

        <label
          className={`block cursor-pointer rounded-[1.5rem] border border-dashed p-5 transition focus-within:ring-2 focus-within:ring-[#b98142] ${
            dark ? "border-white/16 bg-white/[0.03] hover:bg-white/[0.06]" : "border-[#27231d]/16 bg-[#f8f1e4] hover:bg-white"
          }`}
        >
          <input
            type="file"
            accept=".xlsx,.csv,.tsv,.txt"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <p className="font-medium">
            {state === "empty" && "Выберите XLSX, CSV или TSV"}
            {state === "loading" && "Читаем файл и проверяем строки"}
            {state === "success" && `${importedEstimate?.fileName ?? "Смета"} загружена`}
            {state === "error" && "Файл не удалось проверить"}
          </p>
          <p className={`mt-2 text-sm ${dark ? "text-[#d8c9b0]" : "text-[#776d5f]"}`}>
            Нужны колонки с работой, количеством и ценой. Если есть колонка суммы, сервис сверит её с количеством × ценой.
          </p>
        </label>

        {state === "loading" ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className={`shimmer relative h-12 overflow-hidden rounded-2xl ${dark ? "bg-white/8" : "bg-[#e9dcc8]"}`} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {importedEstimate ? (
              <>
                <div className={`rounded-2xl border p-3 text-sm ${dark ? "border-white/10 bg-black/12" : "border-[#27231d]/10 bg-white"}`}>
                  <p className="font-semibold">{importedEstimate.lines.length} строк распознано</p>
                  <p className={`mt-1 ${dark ? "text-[#d8c9b0]" : "text-[#776d5f]"}`}>
                    Замечаний при импорте: {importedEstimate.issues.length}
                  </p>
                </div>
                {importedEstimate.issues.slice(0, 2).map((item) => (
                  <div
                    key={item.code}
                    className={`flex gap-3 rounded-2xl border p-3 text-sm ${
                      dark ? "border-white/10 bg-black/12" : "border-[#27231d]/10 bg-white"
                    }`}
                  >
                    <Mark className="mt-0.5 h-4 w-4 shrink-0 text-[#b98142]" />
                    <span>{item.message}</span>
                  </div>
                ))}
              </>
            ) : (
              errorExamples.slice(0, 2).map((item) => (
                <div
                  key={item}
                  className={`flex gap-3 rounded-2xl border p-3 text-sm ${
                    dark ? "border-white/10 bg-black/12" : "border-[#27231d]/10 bg-white"
                  }`}
                >
                  <Mark className="mt-0.5 h-4 w-4 shrink-0 text-[#b98142]" />
                  <span>{item}</span>
                </div>
              ))
            )}
            {error && (
              <p className={`rounded-2xl border p-3 text-sm ${dark ? "border-red-300/30 bg-red-500/10 text-red-100" : "border-red-300 bg-red-50 text-red-800"}`}>
                {error}
              </p>
            )}
          </div>
        )}

        <a
          href="#calculator"
          className={`grid min-h-12 place-items-center rounded-full px-6 py-3 text-sm font-semibold transition active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#b98142] ${
            dark ? "bg-[#fbf7ec] text-[#27231d] hover:bg-white" : "bg-[#27231d] text-[#fbf7ec] hover:bg-[#3a342b]"
          }`}
        >
          Смотреть расчёт
        </a>
      </div>
    </section>
  );
}

function WorkflowSteps({ dark = false }: { dark?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-4" id="process">
      {workflow.map((step, index) => (
        <article
          key={step}
          className={`rounded-[1.5rem] border p-5 ${
            dark ? "border-white/10 bg-white/[0.04]" : "border-[#27231d]/10 bg-[#fbf7ec]"
          }`}
        >
          <p className="font-mono text-xs text-[#b98142]">{String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-6 text-base font-semibold leading-snug">{step}</h3>
        </article>
      ))}
    </div>
  );
}

function Pricing({ dark = false }: { dark?: boolean }) {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
      <div className="mb-10 max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Тарифы для разовой проверки и регулярной работы</h2>
        <p className={`mt-4 text-base leading-7 ${dark ? "text-[#d8c9b0]" : "text-[#776d5f]"}`}>
          Цены показаны как продуктовый ориентир MVP. Оплата и личный кабинет не реализованы в этом фронтенде.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {pricing.map(([title, price, caption]) => (
          <article
            key={title}
            className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-1 ${
              dark ? "border-white/10 bg-white/[0.04]" : "border-[#27231d]/10 bg-[#fbf7ec]"
            }`}
          >
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-5 font-mono text-xl font-semibold text-[#b98142]">{price}</p>
            <p className={`mt-4 text-sm leading-6 ${dark ? "text-[#d8c9b0]" : "text-[#776d5f]"}`}>{caption}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

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
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#8f8068]">{label}</span>
      <span className="mt-2 flex min-h-12 items-center rounded-2xl border border-[#27231d]/10 bg-white px-4 text-[#27231d]">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-transparent text-base font-semibold outline-none"
        />
        {suffix && <span className="ml-2 text-sm text-[#776d5f]">{suffix}</span>}
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
      {options.map(([option, label]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-11 rounded-2xl border px-4 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#b98142] ${
            value === option
              ? "border-[#b98142] bg-[#b98142] text-[#1f211d]"
              : "border-[#27231d]/10 bg-white text-[#27231d] hover:bg-[#f7eddc]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function EstimateCalculatorPanel({
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
  const activeLines =
    importedEstimate?.lines.length
      ? importedEstimate.lines
      : [
          {
            id: "main",
            name: "Работы по смете",
            unit: "м2",
            quantity,
            unitPriceKopecks: parseMoneyToKopecks(unitPrice),
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
  const allIssues = [...(importedEstimate?.issues ?? []), ...result.issues];
  const blockingIssues = allIssues.filter((issue) => issue.severity === "error");
  const warnings = allIssues.filter((issue) => issue.severity !== "error");

  return (
    <section id="calculator" className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-[#b98142]">калькулятор проверки</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
            Сервис считает смету и сразу показывает, готова ли она к нужному формату
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-[#d8c9b0]">
            Локальный MVP проверяет арифметику, НДС, коэффициенты, накладные расходы, сметную прибыль и готовность данных к строгому профилю РФ.
          </p>
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${selfCheck.ok ? "border-[#b98142]/30 bg-[#b98142]/10 text-[#f7eddc]" : "border-red-400/40 bg-red-500/10 text-red-100"}`}>
            {selfCheck.ok
              ? "Самопроверка расчётного ядра пройдена."
              : "Самопроверка расчётного ядра не пройдена. Итоги требуют проверки."}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#f7eddc] p-5 text-[#27231d] shadow-[0_30px_90px_-60px_rgba(0,0,0,0.6)] md:p-7">
          <div className="grid gap-5">
            <div>
              <p className="mb-3 text-sm font-semibold">Тип сметы</p>
              <Segment
                value={mode}
                onChange={setMode}
                options={[
                  ["commercial", "Коммерческая"],
                  ["russianNormative", "Нормативная РФ"],
                ]}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Нужен официальный формат?</p>
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

            {officialFormat === "strictRf" && (
              <label className="block">
                <span className="text-sm font-semibold">Форма строгого профиля РФ</span>
                <select
                  value={strictRfForm}
                  onChange={(event) => setStrictRfForm(event.target.value as StrictRfForm)}
                  className="mt-3 min-h-12 w-full rounded-2xl border border-[#27231d]/10 bg-white px-4 font-semibold outline-none focus:ring-2 focus:ring-[#b98142]"
                >
                  {Object.entries(strictRfFormLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            )}

            {importedEstimate ? (
              <div className="rounded-[1.5rem] border border-[#27231d]/10 bg-white p-4">
                <p className="text-sm font-semibold">{importedEstimate.fileName}</p>
                <p className="mt-2 text-sm text-[#776d5f]">
                  В расчёте используются {importedEstimate.lines.length} строк из файла. Ручные поля количества и цены скрыты до сброса файла.
                </p>
                <div className="mt-4 max-h-44 overflow-auto rounded-2xl border border-[#27231d]/10">
                  {importedEstimate.lines.slice(0, 8).map((line) => (
                    <div key={line.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#27231d]/10 px-4 py-3 text-sm last:border-b-0">
                      <span className="min-w-0 truncate">{line.name}</span>
                      <span className="font-mono">{formatMoney(Math.round(line.quantity * line.unitPriceKopecks))}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Количество" value={quantity} onChange={setQuantity} suffix="ед." />
                <Field label="Цена за единицу" value={unitPrice} onChange={setUnitPrice} suffix="₽" />
                {mode === "commercial" && (
                  <>
                    <Field label="Скидка" value={discountPercent} onChange={setDiscountPercent} suffix="%" />
                    <Field label="Наценка" value={markupPercent} onChange={setMarkupPercent} suffix="%" />
                  </>
                )}
                <Field label="Коэффициент" value={coefficient} onChange={setCoefficient} step={0.01} />
                <Field label="НДС" value={vatRate} onChange={setVatRate} suffix="%" />
              </div>
            )}

            {importedEstimate && (
              <div className="grid gap-3 sm:grid-cols-2">
              {mode === "commercial" && (
                <>
                  <Field label="Скидка" value={discountPercent} onChange={setDiscountPercent} suffix="%" />
                  <Field label="Наценка" value={markupPercent} onChange={setMarkupPercent} suffix="%" />
                </>
              )}
              <Field label="Коэффициент" value={coefficient} onChange={setCoefficient} step={0.01} />
              <Field label="НДС" value={vatRate} onChange={setVatRate} suffix="%" />
            </div>
            )}

            <div>
              <p className="mb-3 text-sm font-semibold">Режим НДС</p>
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

            {(mode === "russianNormative" || officialFormat === "strictRf") && (
              <div className="rounded-[1.5rem] border border-[#27231d]/10 bg-white p-4">
                <p className="text-sm font-semibold">Профиль нормативной проверки РФ</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Накладные расходы" value={overheadPercent} onChange={setOverheadPercent} suffix="%" />
                  <Field label="Сметная прибыль" value={estimatedProfitPercent} onChange={setEstimatedProfitPercent} suffix="%" />
                  <Field label="Индекс пересчёта" value={indexationCoefficient} onChange={setIndexationCoefficient} step={0.01} />
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#8f8068]">Регион</span>
                    <input value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[#27231d]/10 px-4 font-semibold outline-none focus:ring-2 focus:ring-[#b98142]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#8f8068]">Уровень цен</span>
                    <input value={priceLevel} onChange={(event) => setPriceLevel(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[#27231d]/10 px-4 font-semibold outline-none focus:ring-2 focus:ring-[#b98142]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#8f8068]">Тип объекта</span>
                    <input value={objectType} onChange={(event) => setObjectType(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[#27231d]/10 px-4 font-semibold outline-none focus:ring-2 focus:ring-[#b98142]" />
                  </label>
                </div>
              </div>
            )}

            <div className="grid gap-3 rounded-[1.5rem] bg-[#27231d] p-5 text-[#f7eddc] sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#d8c9b0]">До НДС</p>
                <p className="mt-2 text-2xl font-semibold">{formatMoney(result.beforeVatKopecks)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#d8c9b0]">Итого</p>
                <p className="mt-2 text-2xl font-semibold text-[#b98142]">{formatMoney(result.grandTotalKopecks)}</p>
              </div>
              <div className="sm:col-span-2 grid gap-2 border-t border-white/10 pt-4 text-sm text-[#d8c9b0] sm:grid-cols-3">
                <span>Подытог: {formatMoney(result.subtotalKopecks)}</span>
                <span>НДС: {formatMoney(result.vat.vatKopecks)}</span>
                <span>Замечаний: {allIssues.length}</span>
              </div>
            </div>

            <div className="grid gap-2">
              {blockingIssues.map((issue) => (
                <p key={issue.code} className="rounded-2xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-800">{issue.message}</p>
              ))}
              {warnings.slice(0, 4).map((issue) => (
                <p key={issue.code} className="rounded-2xl border border-[#b98142]/30 bg-[#fff7e6] px-4 py-3 text-sm text-[#5a4127]">{issue.message}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ({ dark = false }: { dark?: boolean }) {
  return (
    <section id="faq" className="mx-auto max-w-5xl px-4 py-24 md:px-8 md:py-32">
      <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Коротко о важных ограничениях</h2>
      <div className="mt-10 divide-y divide-current/10">
        {faq.map(([question, answer]) => (
          <details key={question} className="group py-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#b98142]">
              {question}
              <span className="text-[#b98142] transition group-open:rotate-45">+</span>
            </summary>
            <p className={`mt-4 max-w-3xl leading-7 ${dark ? "text-[#d8c9b0]" : "text-[#776d5f]"}`}>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer({ dark = false }: { dark?: boolean }) {
  return (
    <footer className={`border-t px-4 py-10 md:px-8 ${dark ? "border-white/10" : "border-[#27231d]/10"}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
        <p>SmetaFix — техническая проверка смет, не официальная экспертиза.</p>
        <a href="#calculator" className="focus:outline-none focus:ring-2 focus:ring-[#b98142]">Проверить смету</a>
      </div>
    </footer>
  );
}

export function SmetaAwwwards() {
  const [importedEstimate, setImportedEstimate] = useState<ImportedEstimate | null>(null);

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-[#1f211d] text-[#f7eddc]">
      <div className="grain" />
      <Header variant="awwwards" />
      <section className="paper-grid relative px-4 pb-14 pt-32 md:px-8 md:pb-20 md:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_26%,rgba(185,129,66,0.28),transparent_34%),linear-gradient(180deg,rgba(31,33,29,0.34),#1f211d_82%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="max-w-6xl text-[clamp(3rem,6vw,6.4rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
              Excel-смета без ручной боли и некрасивых PDF
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#d8c9b0]">
              Загрузите смету в Excel — SmetaFix проверит формулы, итоги, НДС и подготовит понятную клиентскую версию в PDF.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#calculator" className="grid min-h-12 place-items-center rounded-full bg-[#fbf7ec] px-6 py-3 text-sm font-semibold text-[#27231d] transition hover:bg-white active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#b98142]">
                Проверить смету
              </a>
              <a href="#example" className="grid min-h-12 place-items-center rounded-full border border-white/14 px-6 py-3 text-sm font-semibold transition hover:bg-white/8 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#b98142]">
                Посмотреть пример отчёта
              </a>
            </div>
          </div>
          <div className="animate-soft-float">
            <FileUploadChecker
              variant="awwwards"
              importedEstimate={importedEstimate}
              onImported={setImportedEstimate}
            />
          </div>
        </div>
      </section>

      <EstimateCalculatorPanel importedEstimate={importedEstimate} />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid-flow-dense grid gap-4 md:grid-cols-6">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:col-span-4">
            <h2 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">Сервис ловит ошибки, которые обычно замечают уже после отправки клиенту</h2>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {problems.map((item) => (
                <p key={item} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-[#d8c9b0]">{item}</p>
              ))}
            </div>
          </article>
          <article className="rounded-[2rem] border border-white/10 bg-[#b98142] p-8 text-[#1f211d] md:col-span-2">
            <p className="font-mono text-sm">итог проверки</p>
            <p className="mt-10 text-5xl font-semibold tracking-tight">4 замечания</p>
            <p className="mt-4 text-sm leading-6">арифметика, НДС, итог раздела и новые позиции во второй версии</p>
          </article>
          {features.slice(0, 3).map((item) => (
            <article key={item} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:col-span-2">
              <Mark className="h-5 w-5 text-[#b98142]" />
              <h3 className="mt-8 text-xl font-semibold">{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-40" id="example">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">До отправки клиенту видно, где смета расходится</h2>
            <p className="mt-5 text-[#d8c9b0]">Рабочая таблица остаётся для команды, а клиент получает аккуратный PDF с понятными разделами.</p>
          </div>
          <div className="space-y-6">
            <EstimateTablePreview />
            <div className="rounded-[2rem] border border-white/10 bg-[#f7eddc] p-6 text-[#27231d]">
              <h3 className="text-2xl font-semibold tracking-tight">Клиентская версия PDF</h3>
              <div className="mt-6 space-y-3">
                {["Работы по подготовке", "Черновая отделка", "Чистовая отделка", "Электрика"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between border-b border-[#27231d]/10 pb-3">
                    <span>{item}</span>
                    <span className="font-mono text-sm">{[25020, 54400, 34200, 20800][index].toLocaleString("ru-RU")} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        <WorkflowSteps dark />
      </section>
      <Pricing dark />
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <div className="rounded-[2.5rem] bg-[#f7eddc] p-8 text-[#27231d] md:p-14">
          <h2 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">Проверьте смету до того, как она станет спором</h2>
          <p className="mt-6 max-w-2xl text-[#776d5f]">Файлы передаются по HTTPS, могут быть удалены вручную и автоматически очищаются через 1–24 часа.</p>
          <div className="mt-8"><CTAButton>Проверить смету</CTAButton></div>
        </div>
      </section>
      <FAQ dark />
      <Footer dark />
    </main>
  );
}

export function SmetaMinimal() {
  const [importedEstimate, setImportedEstimate] = useState<ImportedEstimate | null>(null);

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-[#f4efe4] text-[#27231d]">
      <Header variant="minimal" />
      <section className="min-h-[100dvh] px-4 pb-16 pt-32 md:px-8 md:pt-36">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h1 className="max-w-5xl text-[clamp(2.8rem,5vw,5.6rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
              Проверьте смету перед отправкой заказчику
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#776d5f]">
              Проверка формул, итогов по разделам, НДС, генподрядного процента и гарантийного удержания в спокойном рабочем интерфейсе.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton>Проверить смету</CTAButton>
              <a href="#minimal-preview" className="grid min-h-12 place-items-center rounded-full border border-[#27231d]/14 px-6 py-3 text-sm font-semibold transition hover:bg-[#fbf7ec] active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#b98142]">
                Посмотреть пример отчёта
              </a>
            </div>
          </div>
          <FileUploadChecker
            variant="minimal"
            importedEstimate={importedEstimate}
            onImported={setImportedEstimate}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8" id="minimal-preview">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <EstimateTablePreview compact />
          </div>
          <aside className="rounded-[1.75rem] border border-[#27231d]/10 bg-[#fbf7ec] p-6 lg:col-span-5">
            <h2 className="text-2xl font-semibold tracking-tight">Отчёт об ошибках</h2>
            <div className="mt-6 space-y-3">
              {errorExamples.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[#27231d]/10 bg-white p-3 text-sm">
                  <Mark className="mt-0.5 h-4 w-4 shrink-0 text-[#b98142]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Всё, что обычно проверяют вручную</h2>
          <p className="mt-4 text-[#776d5f]">Функции сгруппированы вокруг реальной работы подрядчика, сметчика и малого строительного бизнеса.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#27231d]/10 bg-[#fbf7ec] p-4">
              <Mark className="h-4 w-4 text-[#b98142]" />
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <WorkflowSteps />
      </section>
      <Pricing />
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-[#27231d]/10 bg-[#fbf7ec] p-6 md:grid-cols-4 md:p-8">
          {["HTTPS", "удаление через 1–24 часа", "ручное удаление файла", "техническая проверка, не экспертиза"].map((item) => (
            <p key={item} className="border-t border-[#27231d]/10 pt-4 text-sm font-medium">{item}</p>
          ))}
        </div>
      </section>
      <FAQ />
      <Footer />
    </main>
  );
}
