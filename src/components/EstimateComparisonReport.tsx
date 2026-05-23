"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { formatMoney, type ComparisonReport } from "@/lib/estimate-core";
import { ArrowRight, Trash, FilePdf, CircleNotch } from "@phosphor-icons/react";
import { generatePdfReport } from "@/lib/pdfGenerator";
import { ComparisonPdfTemplate } from "./PdfReportTemplate";

function formatSignedMoney(value: number) {
  if (value === 0) return formatMoney(0);
  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

export function EstimateComparisonReport({
  report,
  origFileName,
  revFileName,
  onReset,
}: {
  report: ComparisonReport;
  origFileName: string;
  revFileName: string;
  onReset: () => void;
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!pdfTemplateRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await generatePdfReport(pdfTemplateRef.current, `сравнение_${origFileName}_и_${revFileName}`);
    } catch (error) {
      console.error("Failed to generate PDF comparison:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  };

  const delta = report.summary.totalDeltaKopecks;
  const isBudgetSaved = delta < 0;

  return (
    <>
      <motion.section
        layout
        className="print-report rounded-[2rem] border border-slate-200/50 bg-white p-6 shadow-sm md:p-8"
      >
      {/* Top Header Section */}
      <div className="flex flex-col gap-5 border-b border-zinc-100 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-tight text-zinc-600">
            сравнение версий смет
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl flex flex-wrap items-center gap-3">
            <span className="max-w-[250px] truncate text-zinc-500">{origFileName}</span>
            <ArrowRight size={18} className="text-zinc-400 shrink-0" />
            <span className="max-w-[250px] truncate text-zinc-950">{revFileName}</span>
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
            Отчёт показывает разницу объемов, расценок и бюджетов между исходной сметой и новой редакцией.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:items-start">
          <motion.button
            whileHover={{ scale: isGeneratingPdf ? 1 : 1.05 }}
            whileTap={{ scale: isGeneratingPdf ? 1 : 0.95 }}
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleExportPdf}
            className={`no-print inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
              isGeneratingPdf ? "bg-zinc-700 cursor-not-allowed" : "bg-zinc-950 hover:bg-zinc-800"
            }`}
          >
            {isGeneratingPdf ? (
              <>
                <CircleNotch size={18} className="animate-spin" />
                Создание PDF...
              </>
            ) : (
              <>
                <FilePdf size={18} weight="bold" />
                Скачать PDF сравнения
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onReset}
            className="no-print inline-flex h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <Trash size={16} />
            Сбросить оба
          </motion.button>
        </div>
      </div>

      {/* Summary Bento Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Бюджет оригинала</p>
          <p className="mt-2 font-mono text-xl font-semibold text-zinc-950">
            {formatMoney(report.summary.originalTotalKopecks)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Новый бюджет</p>
          <p className="mt-2 font-mono text-xl font-semibold text-zinc-950">
            {formatMoney(report.summary.revisedTotalKopecks)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Изменение бюджета</p>
          <p
            className={`mt-2 font-mono text-xl font-semibold ${
              delta === 0 ? "text-zinc-500" : isBudgetSaved ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {formatSignedMoney(delta)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">Статистика изменений</p>
          <p className="mt-2 text-xs font-semibold text-zinc-700 flex flex-wrap gap-x-2 gap-y-1">
            <span className="text-emerald-600">+{report.summary.addedLinesCount} нов.</span>
            <span className="text-red-500">-{report.summary.removedLinesCount} уд.</span>
            <span className="text-amber-500">{report.summary.modifiedLinesCount} изм.</span>
          </p>
        </div>
      </div>

      {/* Main Differences Table */}
      <div className="mt-8 rounded-[1.5rem] border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-700">
            <thead className="bg-zinc-50 border-b border-zinc-100 text-xs font-semibold uppercase tracking-tight text-zinc-500">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">№</th>
                <th className="px-4 py-3.5 min-w-[200px]">Наименование позиций</th>
                <th className="px-3 py-3.5 w-16 text-center">Ед.</th>
                <th className="px-4 py-3.5 text-right w-32">Количество</th>
                <th className="px-4 py-3.5 text-right w-36">Цена за ед. (₽)</th>
                <th className="px-4 py-3.5 text-right w-36">Сумма (₽)</th>
                <th className="px-4 py-3.5 text-right w-32">Разница (₽)</th>
                <th className="px-4 py-3.5 text-center w-32">Статус</th>
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-zinc-100"
            >
              {report.lines.map((line) => {
                const isAdded = line.changeType === "added";
                const isRemoved = line.changeType === "removed";
                const isModified = line.changeType === "modified";

                let trClass = "";
                let statusBadge = "Без изменений";
                let badgeClass = "bg-zinc-100 text-zinc-600";

                if (isAdded) {
                  trClass = "bg-emerald-50/20 hover:bg-emerald-50/30";
                  statusBadge = "Добавлена";
                  badgeClass = "bg-emerald-100 text-emerald-800";
                } else if (isRemoved) {
                  trClass = "bg-red-50/20 hover:bg-red-50/30 line-through text-zinc-400";
                  statusBadge = "Удалена";
                  badgeClass = "bg-red-100 text-red-800";
                } else if (isModified) {
                  trClass = "hover:bg-zinc-50/40";
                  statusBadge = "Изменена";
                  badgeClass = "bg-amber-100 text-amber-800";
                } else {
                  trClass = "hover:bg-zinc-50/20";
                }

                return (
                  <motion.tr key={line.id} variants={item} className={`transition-colors ${trClass}`}>
                    <td className="px-4 py-4 font-mono text-center text-xs text-zinc-400">
                      {line.sourceRowNumber || "-"}
                    </td>
                    <td className="px-4 py-4 font-medium text-zinc-950">
                      {line.name}
                    </td>
                    <td className="px-3 py-4 text-center text-zinc-500">
                      {line.unit}
                    </td>
                    
                    {/* Quantity Cell with visual diff */}
                    <td className="px-4 py-4 text-right">
                      {isModified && line.originalQuantity !== line.revisedQuantity ? (
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-zinc-400 line-through">{line.originalQuantity}</span>
                          <span className="font-semibold text-zinc-950">{line.revisedQuantity}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-zinc-950">
                          {isRemoved ? line.originalQuantity : line.revisedQuantity}
                        </span>
                      )}
                    </td>

                    {/* Unit Price Cell with visual diff */}
                    <td className="px-4 py-4 text-right">
                      {isModified && line.originalUnitPriceKopecks !== line.revisedUnitPriceKopecks ? (
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-zinc-400 line-through">
                            {formatMoney(line.originalUnitPriceKopecks || 0)}
                          </span>
                          <span className="font-semibold text-zinc-950">
                            {formatMoney(line.revisedUnitPriceKopecks || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-zinc-950">
                          {formatMoney(isRemoved ? (line.originalUnitPriceKopecks || 0) : (line.revisedUnitPriceKopecks || 0))}
                        </span>
                      )}
                    </td>

                    {/* Total Cell */}
                    <td className="px-4 py-4 text-right font-mono font-medium text-zinc-950">
                      {isRemoved ? (
                        formatMoney(line.originalTotalKopecks || 0)
                      ) : (
                        formatMoney(line.revisedTotalKopecks || 0)
                      )}
                    </td>

                    {/* Delta Cell */}
                    <td className={`px-4 py-4 text-right font-mono font-semibold ${
                      line.totalDeltaKopecks === 0 ? "text-zinc-400" : (line.totalDeltaKopecks || 0) > 0 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {line.totalDeltaKopecks !== 0 ? formatSignedMoney(line.totalDeltaKopecks || 0) : "—"}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                        {statusBadge}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>
    </motion.section>

    {/* Hidden offscreen A4 container for html2canvas capturing */}
    <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
      <div ref={pdfTemplateRef}>
        <ComparisonPdfTemplate report={report} origFileName={origFileName} revFileName={revFileName} />
      </div>
    </div>
  </>
  );
}
