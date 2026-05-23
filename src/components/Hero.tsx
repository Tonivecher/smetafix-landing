"use client";

import { motion } from "framer-motion";
import { FileUploadChecker } from "./FileUploadChecker";
import type { ImportedEstimate } from "./FileUploadChecker";

export function Hero({
  importedEstimate,
  onImported,
}: {
  importedEstimate: ImportedEstimate | null;
  onImported: (estimate: ImportedEstimate | null) => void;
}) {
  return (
    <section className="relative px-4 pb-14 pt-32 md:px-8 md:pb-24 md:pt-40">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] right-[10%] h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] h-[400px] w-[400px] rounded-full bg-blue-100/30 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="flex flex-col justify-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Умная обработка смет
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-6xl lg:text-[4.5rem]">
            Проверка Excel-смет без ручного пересчёта
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-600">
            Загрузите смету — сервис моментально прочитает строки, сверит суммы, НДС и покажет, где расчёт расходится с вашей таблицей. 
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#calculator"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-8 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-colors hover:bg-zinc-800"
            >
              Начать проверку
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#example"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-50"
            >
              Смотреть пример отчёта
            </motion.a>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
        >
          <FileUploadChecker
            importedEstimate={importedEstimate}
            onImported={onImported}
          />
        </motion.div>
      </div>
    </section>
  );
}
