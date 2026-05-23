"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseEstimateText, parseEstimateRows } from "@/lib/estimate-core";
import type { ImportResult } from "@/lib/estimate-core";
import { CheckCircle, XCircle, FileArrowUp, ArrowClockwise } from "@phosphor-icons/react";

export type ImportedEstimate = ImportResult & {
  fileName: string;
};

type UploadState = "empty" | "loading" | "success" | "error";

const demoEstimateText = `Работа;Ед.;Кол.;Цена;Сумма
Демонтаж старого покрытия;м2;42;350;14700
Грунтовка стен;м2;86;120;10320
Штукатурка стен по маякам;м2;64;850;52000
Укладка керамогранита;м2;18;1900;34200
Монтаж розеток и выключателей;шт;32;650;20000`;

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

export function FileUploadChecker({
  importedEstimate,
  onImported,
}: {
  importedEstimate: ImportedEstimate | null;
  onImported: (estimate: ImportedEstimate | null) => void;
}) {
  const [state, setState] = useState<UploadState>("empty");
  const [error, setError] = useState("");

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
      setError("Не удалось прочитать файл. Попробуйте XLSX, CSV или TSV.");
    }
  }

  function handleDemoCheck() {
    const result = parseEstimateText(demoEstimateText);
    onImported({
      fileName: "smetafix-demo.csv",
      lines: result.lines,
      issues: result.issues,
    });
    setState("success");
    setError("");
  }

  return (
    <motion.section
      layout
      className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="absolute left-0 right-0 top-0 h-1 bg-emerald-500" />
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Загрузка сметы</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Система автоматически распознает строки и проверит суммы.
            </p>
          </div>
          <AnimatePresence>
            {importedEstimate && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  onImported(null);
                  setState("empty");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Сбросить"
              >
                <ArrowClockwise weight="bold" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <motion.label
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center transition-colors focus-within:border-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50/30"
        >
          <input
            type="file"
            accept=".xlsx,.csv,.tsv,.txt"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <div className="mb-4 rounded-full bg-white p-3 shadow-sm ring-1 ring-zinc-200/50 group-hover:text-emerald-600 transition-colors">
            <FileArrowUp size={24} weight="duotone" />
          </div>
          <p className="font-medium text-zinc-950">
            {state === "empty" && "Перетащите XLSX, CSV или TSV"}
            {state === "loading" && "Анализируем данные..."}
            {state === "success" && `${importedEstimate?.fileName ?? "Смета"} загружена`}
            {state === "error" && "Ошибка при загрузке"}
          </p>
          <p className="mt-2 text-sm text-zinc-500 max-w-[250px]">
            Нажмите или перетащите файл с колонками: работа, количество, цена.
          </p>
        </motion.label>

        <AnimatePresence mode="popLayout">
          {state === "loading" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </motion.div>
          )}

          {state === "success" && importedEstimate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-3"
            >
              <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle size={20} weight="fill" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-950">{importedEstimate.lines.length} строк распознано</p>
                  <p className="text-sm text-zinc-500">Замечаний при импорте: {importedEstimate.issues.length}</p>
                </div>
              </div>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <XCircle size={20} weight="fill" className="shrink-0 text-red-500" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 flex flex-col gap-3">
          <motion.a
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            href="#calculator"
            className="grid min-h-12 place-items-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Смотреть расчёт
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={handleDemoCheck}
            className="min-h-12 rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Проверить пример
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
