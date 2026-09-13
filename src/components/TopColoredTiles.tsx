import Link from "next/link";
import { Job } from "@/lib/types";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TopColoredTilesProps {
  jobs: Job[];
}

const TILE_STYLES = [
  { bg: "bg-[#fde047]", text: "text-zinc-900", border: "border-[#eab308]", dateText: "text-zinc-700" }, // 1. Yellow/Gold
  { bg: "bg-[#0284c7]", text: "text-white", border: "border-[#0369a1]", dateText: "text-sky-100" },       // 2. Sky Blue
  { bg: "bg-[#fef08a]", text: "text-zinc-900", border: "border-[#facc15]", dateText: "text-zinc-700" }, // 3. Pale Yellow
  { bg: "bg-[#7e22ce]", text: "text-white", border: "border-[#6b21a8]", dateText: "text-purple-100" },    // 4. Purple/Plum
  { bg: "bg-[#fde047]", text: "text-zinc-900", border: "border-[#eab308]", dateText: "text-zinc-700" }, // 5. Yellow
  { bg: "bg-[#0284c7]", text: "text-white", border: "border-[#0369a1]", dateText: "text-sky-100" },       // 6. Sky Blue
  { bg: "bg-[#fef08a]", text: "text-zinc-900", border: "border-[#facc15]", dateText: "text-zinc-700" }, // 7. Pale Yellow
  { bg: "bg-[#7e22ce]", text: "text-white", border: "border-[#6b21a8]", dateText: "text-purple-100" },    // 8. Purple
];

export default function TopColoredTiles({ jobs }: TopColoredTilesProps) {
  // Take up to 8 jobs for the top grid
  const displayJobs = jobs.slice(0, 8);

  if (displayJobs.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 pt-4 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
        {displayJobs.map((job, idx) => {
          const style = TILE_STYLES[idx % TILE_STYLES.length];
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className={`block p-2.5 sm:p-3 rounded border ${style.bg} ${style.border} ${style.text} shadow-sm hover:brightness-95 transition-all group`}
            >
              <h3 className="text-xs font-bold leading-snug line-clamp-2 group-hover:underline">
                {job.title}
              </h3>
              <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${style.dateText}`}>
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{formatDate(job.createdAt)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
