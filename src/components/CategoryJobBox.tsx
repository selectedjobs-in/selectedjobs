import Link from "next/link";
import { Job } from "@/lib/types";
import { Calendar, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CategoryJobBoxProps {
  id?: string;
  title: string;
  jobs: Job[];
  categoryFilter?: string;
}

export default function CategoryJobBox({
  id,
  title,
  jobs,
  categoryFilter,
}: CategoryJobBoxProps) {
  return (
    <div id={id} className="rounded border border-blue-300 bg-white shadow-sm flex flex-col h-full scroll-mt-14">
      {/* Category Box Blue Header */}
      <div className="bg-[#1d4ed8] text-white px-3.5 py-2 font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-between">
        <span>{title}</span>
      </div>

      {/* List of Openings */}
      <div className="p-3 flex-1 divide-y divide-zinc-100">
        {jobs.length > 0 ? (
          jobs.slice(0, 6).map((job) => (
            <div key={job.id} className="py-2.5 first:pt-0 last:pb-1">
              <Link
                href={`/jobs/${job.id}`}
                className="group block"
              >
                <div className="text-xs font-semibold text-zinc-900 group-hover:text-blue-700 leading-snug flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold flex-shrink-0">&bull;</span>
                  <span>
                    {job.title}
                    {job.isNew && (
                      <span className="inline-block ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-black text-rose-600 bg-amber-100 border border-amber-300 animate-pulse">
                        NEW
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500 pl-3">
                  <Calendar className="h-3 w-3 text-zinc-400" />
                  <span>{formatDate(job.createdAt)}</span>
                  {job.company && (
                    <span className="text-zinc-400">&bull; {job.company}</span>
                  )}
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-zinc-400">
            No openings currently in this category.
          </div>
        )}
      </div>

      {/* Box Footer with "Show More" Button */}
      <div className="px-3 py-2 bg-zinc-50/70 border-t border-zinc-100 flex justify-end">
        <Link
          href={`/?category=${encodeURIComponent(categoryFilter || title)}`}
          className="inline-flex items-center gap-1 rounded bg-[#1d4ed8] px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-blue-800 transition-colors"
        >
          <span>Show More</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
