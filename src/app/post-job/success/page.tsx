import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck, ArrowRight, PlusCircle } from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{
    id?: string;
    title?: string;
    company?: string;
  }>;
}

export default async function PostJobSuccessPage(props: SuccessPageProps) {
  const searchParams = await props.searchParams;
  const id = searchParams.id || "N/A";
  const title = searchParams.title || "Your Job Opening";
  const company = searchParams.company || "Your Company";

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 py-16 flex items-center justify-center">
      <div className="mx-auto max-w-xl px-4 text-center">
        {/* Animated Check icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-500/10 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
          Job Opening Submitted!
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Thank you for posting on <strong>SelectedJobs.in</strong>. Your job opening has been safely received and queued for administrative verification.
        </p>

        {/* Submission Details Card */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-left text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 space-y-2">
          <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="font-medium text-zinc-500">Posting Reference:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-white">{id}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="font-medium text-zinc-500">Position:</span>
            <span className="font-semibold text-zinc-900 dark:text-white">{title}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="font-medium text-zinc-500">Company:</span>
            <span className="font-semibold text-zinc-900 dark:text-white">{company}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="font-medium text-zinc-500">Current Status:</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-950/40">
              <Clock className="h-3 w-3" />
              Pending Admin Review
            </span>
          </div>
        </div>

        {/* What Happens Next Card */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-left dark:border-blue-900/40 dark:bg-blue-950/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>What Happens Next?</span>
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold mt-0.5">
                1
              </span>
              <span>Our admin review team verifies the job role and recruiter legitimacy.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold mt-0.5">
                2
              </span>
              <span>Upon 1-click admin approval, the post immediately goes live on the public feed.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold mt-0.5">
                3
              </span>
              <span>The job is formatted with Google Jobs schema for maximum organic discoverability.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/post-job"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Post Another Role</span>
          </Link>
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <span>View Public Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
