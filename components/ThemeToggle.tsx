"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Changer de thème"
        className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <span className="sr-only">Changer de thème</span>
      </button>
    );
  }

  const current = resolvedTheme ?? theme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-400 hover:text-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300 dark:focus-visible:ring-offset-slate-900"
    >
      {isDark ? (
        <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a1 1 0 0 1 1 1v1.05a7 7 0 0 1 6.95 6.95H21a1 1 0 1 1 0 2h-1.05A7 7 0 0 1 13 20.95V22a1 1 0 1 1-2 0v-1.05A7 7 0 0 1 4.05 14H3a1 1 0 1 1 0-2h1.05A7 7 0 0 1 11 5.05V4a1 1 0 0 1 1-1Z" />
        </svg>
      ) : (
        <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.75 15a6.75 6.75 0 0 1-8.5-8.5 1 1 0 0 0-1.5-1.12A8.75 8.75 0 1 0 18.62 18.75a1 1 0 0 0-1.12-1.5c-.58.22-1.2.34-1.83.34-.64 0-1.26-.12-1.82-.35Z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
