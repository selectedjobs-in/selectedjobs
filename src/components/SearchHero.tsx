"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Sparkles, ArrowRight } from "lucide-react";

export default function SearchHero() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (keyword.trim()) {
      params.set("search", keyword.trim());
    } else {
      params.delete("search");
    }

    if (location.trim()) {
      params.set("location", location.trim());
    } else {
      params.delete("location");
    }

    router.push(`/?${params.toString()}`);
  };

  const setQuickFilter = (type: string, value: string) => {
    const params = new URLSearchParams();
    params.set(type, value);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-blue-50/50 via-white to-white py-12 md:py-20 dark:border-zinc-800 dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        {/* Domain Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>SelectedJobs.in &bull; 100% Screened & Approved Opportunities</span>
        </div>

        {/* Main Headline */}
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
          Find openings worth your talent at{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SelectedJobs.in
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
          Every job opening is reviewed by our team before going live. Explore top tech, design, marketing, and business positions across India.
        </p>

        {/* Main Search Bar Form */}
        <form
          onSubmit={handleSearch}
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-blue-500/5 dark:border-zinc-800 dark:bg-zinc-900 sm:flex sm:items-center sm:gap-2"
        >
          {/* Keyword Input */}
          <div className="relative flex-1 flex items-center px-3 py-2">
            <Search className="h-5 w-5 text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Job title, skills (e.g. React, Python), or company"
              className="w-full pl-3 pr-2 text-sm bg-transparent text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-white"
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

          {/* Location Input */}
          <div className="relative flex-1 flex items-center px-3 py-2 border-t border-zinc-100 sm:border-t-0 dark:border-zinc-800">
            <MapPin className="h-5 w-5 text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City (Bengaluru, Mumbai...) or Remote"
              className="w-full pl-3 pr-2 text-sm bg-transparent text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/35 focus:outline-none"
          >
            <span>Search Jobs</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Tag Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
          <span className="font-medium">Trending searches:</span>
          <button
            onClick={() => setQuickFilter("workplaceType", "Remote")}
            className="rounded-full bg-zinc-100 px-3 py-1 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Remote Roles
          </button>
          <button
            onClick={() => setQuickFilter("experience", "Fresher (0-1 yrs)")}
            className="rounded-full bg-zinc-100 px-3 py-1 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Freshers (0-1 yrs)
          </button>
          <button
            onClick={() => setQuickFilter("category", "Software & Engineering")}
            className="rounded-full bg-zinc-100 px-3 py-1 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Engineering
          </button>
          <button
            onClick={() => setQuickFilter("category", "Product & Design")}
            className="rounded-full bg-zinc-100 px-3 py-1 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            UI/UX Design
          </button>
        </div>
      </div>
    </div>
  );
}
