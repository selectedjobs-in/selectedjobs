"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ChevronDown, ShieldCheck, PlusCircle, X } from "lucide-react";
import { PORTAL_BOX_CATEGORIES } from "@/lib/constants";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
    }
  };

  return (
    <>
      <nav className="w-full bg-[#b91c1c] text-white shadow-md sticky top-0 z-40 border-b border-red-800">
        <div className="mx-auto max-w-7xl px-2 sm:px-4 flex items-center justify-between h-11">
          {/* Nav Items */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-bold overflow-x-auto scrollbar-none py-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                pathname === "/" ? "bg-[#991b1b] text-white" : "hover:bg-[#991b1b]/80"
              }`}
            >
              Home
            </Link>

            {/* All Categories dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMegaMenu(!showMegaMenu)}
                className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-[#991b1b]/80 transition-colors whitespace-nowrap"
              >
                <span>All Categories</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showMegaMenu && (
                <div
                  onMouseLeave={() => setShowMegaMenu(false)}
                  className="absolute left-0 top-full mt-1 w-64 rounded-lg bg-white p-2 text-zinc-800 shadow-2xl border border-zinc-200 z-50 animate-in fade-in slide-in-from-top-1"
                >
                  <div className="text-[11px] font-bold text-zinc-400 px-3 py-1 uppercase tracking-wider">
                    Quick Categories
                  </div>
                  {PORTAL_BOX_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/#${cat.id}`}
                      onClick={() => setShowMegaMenu(false)}
                      className="block px-3 py-1.5 text-xs font-semibold rounded hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {cat.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/#all-state"
              className="px-3 py-1.5 rounded hover:bg-[#991b1b]/80 transition-colors whitespace-nowrap"
            >
              State Jobs
            </Link>

            <Link
              href="/#govt-jobs"
              className="px-3 py-1.5 rounded hover:bg-[#991b1b]/80 transition-colors whitespace-nowrap"
            >
              Govt Jobs
            </Link>

            <Link
              href="/#bank-jobs"
              className="px-3 py-1.5 rounded hover:bg-[#991b1b]/80 transition-colors whitespace-nowrap"
            >
              Bank Jobs
            </Link>

            <Link
              href="/#tech-jobs"
              className="px-3 py-1.5 rounded hover:bg-[#991b1b]/80 transition-colors whitespace-nowrap"
            >
              Tech Jobs
            </Link>

            <Link
              href="/#notifications"
              className="px-3 py-1.5 rounded hover:bg-[#991b1b]/80 transition-colors whitespace-nowrap"
            >
              Admit Cards & PDFs
            </Link>

            {/* Post Job Button */}
            <Link
              href="/post-job"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-yellow-400 text-zinc-950 font-bold hover:bg-yellow-300 transition-colors whitespace-nowrap"
            >
              <PlusCircle className="h-3 w-3 text-zinc-900" />
              <span>Post Job</span>
            </Link>
          </div>

          {/* Search Trigger Button (Right Side) */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            aria-label="Search job openings"
            className="flex h-11 w-11 items-center justify-center bg-[#991b1b] hover:bg-[#7f1d1d] transition-colors border-l border-red-800"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Search Modal Overlay */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Search className="h-4 w-4 text-[#1c64f2]" />
                <span>Search SelectedJobs.in Openings</span>
              </span>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, department, exam or location..."
                className="flex-1 rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#1c64f2] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#1c64f2] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
