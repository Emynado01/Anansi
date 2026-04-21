"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import FilterChips from "@/components/FilterChips";

const durationOptions = [
  { label: "< 30 min", value: "short" },
  { label: "30-60 min", value: "medium" },
  { label: "> 60 min", value: "long" },
];

interface CatalogFiltersProps {
  languages: string[];
  moods: string[];
}

const CatalogFilters = ({ languages, moods }: CatalogFiltersProps) => {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");

  const selectedDuration = params.get("duration") ?? "";
  const selectedLanguage = params.get("language") ?? "";
  const selectedMood = params.get("mood") ?? "";

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(params.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete("offset");
    startTransition(() => {
      router.replace(`/catalog${newParams.toString() ? `?${newParams.toString()}` : ""}`);
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParam("q", search.trim() ? search.trim() : null);
  };

  return (
    <div className="neo-panel flex flex-col gap-6 rounded-[8px] p-5">
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            Rechercher un livre audio
          </label>
          <input
            id="catalog-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un titre, un auteur..."
            className="w-full rounded-[8px] border border-zinc-200 bg-white px-5 py-3 text-sm text-zinc-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-black/50 dark:text-zinc-100 dark:focus:ring-brand-500/40"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-[8px] bg-brand-300 px-5 py-3 text-sm font-black text-black shadow-glow transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Rechercher
        </button>
      </form>
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Durée</p>
          <FilterChips
            options={durationOptions}
            selected={selectedDuration ? [selectedDuration] : []}
            onChange={(values) => updateParam("duration", values[0] ?? null)}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Langue</p>
          <FilterChips
            options={languages.map((lang) => ({ label: lang, value: lang }))}
            selected={selectedLanguage ? [selectedLanguage] : []}
            onChange={(values) => updateParam("language", values[0] ?? null)}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Ambiance</p>
          <FilterChips
            options={moods.map((mood) => ({ label: mood, value: mood }))}
            selected={selectedMood ? [selectedMood] : []}
            onChange={(values) => updateParam("mood", values[0] ?? null)}
          />
        </div>
      </div>
    </div>
  );
};

export default CatalogFilters;
