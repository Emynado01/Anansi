"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
}

const Tabs = ({ tabs, defaultTabId, className }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTabId ?? tabs[0]?.id);

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-wrap gap-2 rounded-[8px] bg-slate-100/70 p-1 dark:bg-slate-800/60">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab?.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-[8px] px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                isActive
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-200"
                  : "text-slate-600 hover:text-brand-500 dark:text-slate-300",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[8px] border border-slate-200 bg-white/90 p-6 shadow-inner dark:border-slate-700 dark:bg-slate-900/90">
        {currentTab?.content}
      </div>
    </div>
  );
};

export default Tabs;
