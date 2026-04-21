"use client";

import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  allowMultiple?: boolean;
  className?: string;
}

const FilterChips = ({ options, selected, onChange, allowMultiple = false, className }: FilterChipsProps) => {
  const toggleValue = (value: string) => {
    const isSelected = selected.includes(value);
    if (allowMultiple) {
      onChange(isSelected ? selected.filter((item) => item !== value) : [...selected, value]);
    } else {
      onChange(isSelected ? [] : [value]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isActive = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            className={cn(
              "rounded-[8px] border px-4 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black",
              isActive
                ? "border-brand-300 bg-brand-300 text-black shadow-glow"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-black/40 dark:text-zinc-300",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterChips;
