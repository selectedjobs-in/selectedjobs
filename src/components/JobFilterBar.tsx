"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { JOB_CATEGORIES, EXPERIENCE_LEVELS, WORKPLACE_TYPES } from "@/lib/constants";
import { Filter, X } from "lucide-react";

export default function JobFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentWorkplace = searchParams.get("workplaceType") || "";
  const currentExperience = searchParams.get("experience") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentLocation = searchParams.get("location") || "";

  const hasActiveFilters = Boolean(
    currentCategory || currentWorkplace || currentExperience || currentSearch || currentLocation
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push("/");
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Filter className="h-4 w-4 text-blue-600" />
          <span>Filter Opportunities</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
        {/* Category Select */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Role Category</label>
          <select
            value={currentCategory}
            onChange={(e) => updateParam("category", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="">All Categories</option>
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Workplace Type */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Workplace Mode</label>
          <select
            value={currentWorkplace}
            onChange={(e) => updateParam("workplaceType", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="">All Workplaces (Remote / Hybrid / On-site)</option>
            {WORKPLACE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Experience Required</label>
          <select
            value={currentExperience}
            onChange={(e) => updateParam("experience", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="">Any Experience Level</option>
            {EXPERIENCE_LEVELS.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
