"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseEstimateText, parseEstimateRows, type ImportResult } from "@/lib/estimate-core";
import { CheckCircle, XCircle, FileArrowUp, ArrowClockwise } from "@phosphor-icons/react";
import type { ImportedEstimate } from "./FileUploadChecker";

async function parseEstimateFile(file: File): Promise<ImportResult> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv") || fileName.endsWith(".tsv") || fileName.endsWith(".txt")) {
    return parseEstimateText(await file.text());
  }

  if (fileName.endsWith(".xlsx")) {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    let bestResult: ImportResult | null = null;
    let maxLines = -1;
    let selectedSheetName = "";

    workbook.SheetNames.forEach((sheetName) => {
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
      const result = parseEstimateRows(rows);
      if (result.lines.length > maxLines) {
        maxLines = result.lines.length;
        bestResult = result;
        selectedSheetName = sheetName;
      }
    });

    if (bestResult && maxLines > 0) {
      const resultObj = bestResult as ImportResult;
      return {
        ...resultObj,
        issues: [
          {
            code: "sheet-autoselected",
            severity: "info",
            message: `Автоматически выбрана страница "${selectedSheetName}" (${maxLines} строк сметы).`,
          },
          ...resultObj.issues,
        ],
      };
    }

    return bestResult || {
      lines: [],
      issues: [
        {
          code: "no-estimate-sheet",
          severity: "error",
          message: "Не удалось найти таблицу сметы ни на одной из страниц файла.",
        },
      ],
    };
  }

  return {
    lines: [],
    issues: [
      {
        code: "unsupported-file-type",
        severity: "error" as const,
        message: "Поддерживаются XLSX, CSV, TSV и TXT.",
      },
    ],
  };
}

type FileSelectorProps = {
  label: string;
  description: string;
  estimate: ImportedEstimate | null;
  onImported: (estimate: ImportedEstimate | null) => void;
};

function FileSelector({ label, description, estimate, onImported }: FileSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const result = await parseEstimateFile(file);
      if (result.lines.length > 0) {
        onImported({
          fileName: file.name,
          lines: result.lines,
          issues: result.issues,
        });
      } else {
        onImported(null);
        setError(result.issues[0]?.message ?? "Файл не распознан.");
      }
    } catch {
      onImported(null);
      setError("Ошибка чтения файла.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col rounded-3xl border border-zinc-200/60 bg-zinc-50/50 p-5 transition-all hover:border-emerald-500/30 hover:bg-emerald-50/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-950">{label}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
        {estimate && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => onImported(null)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 focus:outline-none"
          >
            <ArrowClockwise size={14} weight="bold" />
          </motion.button>
        )}
      </div>

      <div className="mt-4 flex-1">
        <AnimatePresence mode="wait">
          {estimate ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-emerald-800"
            >
              <CheckCircle size={20} weight="fill" className="text-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs truncate">{estimate.fileName}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">{estimate.lines.length} строк распознано</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50/50 p-4 text-xs text-red-800"
            >
              <XCircle size={18} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          ) : (
            <motion.label
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="group relative flex min-h-[6.5rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-4 text-center transition-colors focus-within:border-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50/10"
            >
              <input
                type="file"
                accept=".xlsx,.csv,.tsv,.txt"
                className="sr-only"
                onChange={(e) => void handleFileChange(e.target.files?.[0])}
              />
              <div className="mb-2 rounded-full bg-zinc-50 p-2 shadow-sm ring-1 ring-zinc-200/20 group-hover:text-emerald-600 transition-colors">
                <FileArrowUp size={18} weight="duotone" />
              </div>
              <p className="text-xs font-semibold text-zinc-950">
                {loading ? "Загрузка..." : "Выберите или перетащите"}
              </p>
            </motion.label>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DualFileUpload({
  origEstimate,
  setOrigEstimate,
  revEstimate,
  setRevEstimate,
}: {
  origEstimate: ImportedEstimate | null;
  setOrigEstimate: (estimate: ImportedEstimate | null) => void;
  revEstimate: ImportedEstimate | null;
  setRevEstimate: (estimate: ImportedEstimate | null) => void;
}) {
  const handleLoadDemo = () => {
    const demoOrig = `Работа;Ед.;Кол.;Цена;Сумма
Демонтаж перегородок;м2;25;400;10000
Грунтовка стен;м2;120;120;14400
Штукатурка стен;м2;120;800;96000
Укладка ламината;м2;45;650;29250
Монтаж плинтуса;м.п.;60;250;15000`;

    const demoRev = `Работа;Ед.;Кол.;Цена;Сумма
Демонтаж перегородок;м2;25;450;11250
Грунтовка стен;м2;120;120;14400
Штукатурка стен;м2;120;800;96000
Укладка паркетной доски;м2;45;1400;63000
Разводка электрики;точек;18;1500;27000`;

    const origResult = parseEstimateText(demoOrig);
    const revResult = parseEstimateText(demoRev);

    setOrigEstimate({
      fileName: "original_draft.csv",
      lines: origResult.lines,
      issues: origResult.issues,
    });

    setRevEstimate({
      fileName: "revised_offer.csv",
      lines: revResult.lines,
      issues: revResult.issues,
    });
  };

  const isReady = origEstimate && revEstimate;

  return (
    <motion.section
      layout
      className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="absolute left-0 right-0 top-0 h-1 bg-emerald-500" />
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Сравнение двух смет</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Загрузите оригинальный черновик и новую редакцию сметы.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FileSelector
            label="Исходная смета"
            description="Оригинал или драфт от подрядчика"
            estimate={origEstimate}
            onImported={setOrigEstimate}
          />
          <FileSelector
            label="Новая редакция"
            description="Измененная смета или предложение"
            estimate={revEstimate}
            onImported={setRevEstimate}
          />
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.a
                key="btn-compare"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                href="#comparison-report"
                className="grid min-h-12 place-items-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none"
              >
                Смотреть сравнение версий
              </motion.a>
            ) : (
              <motion.button
                key="btn-demo"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={handleLoadDemo}
                className="min-h-12 rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus:outline-none"
              >
                Проверить пример сравнения
              </motion.button>
            )}
          </AnimatePresence>
          <div className="text-center text-xs text-zinc-500 mt-1">
            Или скачайте образец для сравнения:{" "}
            <a href="/smetafix-landing/examples/smetafix-demo.xlsx" download className="text-emerald-600 hover:underline font-semibold">Excel (.xlsx)</a>
            {" | "}
            <a href="/smetafix-landing/examples/smetafix-demo.csv" download className="text-emerald-600 hover:underline font-semibold">CSV (.csv)</a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
