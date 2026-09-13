"use client";

import Link from "next/link";
import { Job } from "@/lib/types";
import { formatDate, getWorkplaceBadgeColor } from "@/lib/utils";
import { MapPin, Briefcase, Banknote, Clock, Sparkles, Building2, ArrowUpRight } from "lucide-react";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  // Fallback monogram for company logo
  const companyInitials = job.company
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 bg-white dark:bg-zinc-900 ${
        job.featured
          ? "border-blue-400/60 shadow-md shadow-blue-500/5 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 dark:border-blue-700/60"
          : "border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      {/* Featured Header Pill if applicable */}
      {job.featured && (
        <div className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
          <Sparkles className="h-3 w-3" />
          <span>Featured Selection</span>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Company Logo & Details */}
          <div className="flex items-start gap-4">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="h-12 w-12 rounded-xl object-cover border border-zinc-200 bg-zinc-50 dark:border-zinc-700 flex-shrink-0"
                onError={(e) => {
                  // Fallback on image load error
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 font-bold text-base border border-blue-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:text-blue-400">
                {companyInitials || <Building2 className="h-6 w-6" />}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {job.company}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300">
                  {job.category}
                </span>
              </div>

              <Link href={`/jobs/${job.id}`} className="group-hover:text-blue-600">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-1 leading-snug">
                  {job.title}
                </h3>
              </Link>

              {/* Meta details */}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {job.location}
                </span>

                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 font-medium ${getWorkplaceBadgeColor(
                    job.workplaceType
                  )}`}
                >
                  {job.workplaceType}
                </span>

                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                  {job.experience}
                </span>

                {job.salary && (
                  <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                    <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                    {job.salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0">
            <Link
              href={`/jobs/${job.id}`}
              className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-blue-500 dark:hover:text-white"
            >
              <span>View & Apply</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Clock className="h-3 w-3" />
              {formatDate(job.createdAt)}
            </span>
          </div>
        </div>

        {/* Skills Tag Pills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-zinc-400 mr-1">Skills:</span>
            {job.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
