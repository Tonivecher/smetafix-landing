"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed left-0 right-0 top-0 z-50 px-4 py-4 md:px-8 text-zinc-950"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/50 bg-white/80 px-4 py-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl"
        aria-label="Основная навигация"
      >
        <Link href="/" className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <motion.span 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-sm font-semibold text-white shadow-inner"
          >
            SF
          </motion.span>
          <span className="text-sm font-semibold tracking-tight">SmetaFix</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm md:flex">
          <a href="#process" className="text-zinc-500 transition hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg px-2 py-1">Как работает</a>
          <a href="#pricing" className="text-zinc-500 transition hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg px-2 py-1">Тарифы</a>
          <a href="#faq" className="text-zinc-500 transition hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg px-2 py-1">Вопросы</a>
        </div>
        <motion.a
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          href="#calculator"
          className="rounded-full bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          Проверить
        </motion.a>
      </nav>
    </motion.header>
  );
}
