"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatMoney, type HistoryItem } from "@/lib/estimate-core";
import { Clock, ArrowRight, Trash, File, Selection } from "@phosphor-icons/react";

const statusClasses: Record<HistoryItem["readinessStatus"], string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  needsReview: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels: Record<HistoryItem["readinessStatus"], string> = {
  ready: "Готово",
  needsReview: "Ворнинги",
  blocked: "Критично",
};

export function HistoryPanel({
  history,
  onLoad,
  onDelete,
}: {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 350, damping: 26 },
    },
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <motion.section
      layout
      className="rounded-[2.5rem] border border-slate-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] md:p-8 mt-12 w-full max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-3">
        <Clock size={22} className="text-zinc-600 shrink-0" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">История недавних проверок</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Восстановите расчет или сравнение в один клик без повторного поиска файлов.</p>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {history.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <motion.div
                key={item.id}
                variants={cardVariants}
                layout
                whileHover={{ y: -2, scale: 1.01 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/60 bg-zinc-50/30 p-5 transition-all hover:border-emerald-500/20 hover:bg-emerald-50/5 hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 text-[10px] font-semibold text-zinc-400">
                    <span className="flex items-center gap-1.5 uppercase tracking-wide">
                      {item.isComparison ? (
                        <>
                          <Selection size={14} className="text-zinc-500" />
                          Сравнение
                        </>
                      ) : (
                        <>
                          <File size={14} className="text-zinc-500" />
                          Аудит
                        </>
                      )}
                    </span>
                    <span>{dateStr}</span>
                  </div>

                  {/* Smetas Info */}
                  <div className="mt-3">
                    {item.isComparison ? (
                      <div className="flex items-center gap-2 font-semibold text-zinc-950 text-sm">
                        <span className="truncate max-w-[100px]">{item.fileName}</span>
                        <ArrowRight size={12} className="text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[100px]">{item.revisedFileName}</span>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-zinc-950 text-sm truncate max-w-full">
                        {item.fileName}
                      </h3>
                    )}
                    <p className="text-xs text-zinc-500 mt-0.5">{item.lineCount} строк в смете</p>
                  </div>

                  {/* Summary & Price */}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Итого расчет</span>
                      <span className="font-mono text-sm font-bold text-zinc-950">
                        {formatMoney(item.grandTotalKopecks)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusClasses[item.readinessStatus]}`}>
                      {statusLabels[item.readinessStatus]}
                    </span>
                  </div>
                </div>

                {/* Hover Action Buttons */}
                <div className="mt-5 flex gap-2 w-full">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => onLoad(item)}
                    className="flex-1 min-h-[2.5rem] rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none"
                  >
                    Восстановить
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none"
                    aria-label="Удалить"
                  >
                    <Trash size={16} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
}
