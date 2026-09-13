import Link from "next/link";
import { Briefcase, ShieldCheck, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                SelectedJobs<span className="text-blue-600">.in</span>
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed">
              SelectedJobs.in is a curated job portal connecting ambitious professionals with verified, high-impact opportunities across top technology startups and enterprise leaders in India.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-blue-500" /> selectedjobs.in
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Admin-curated & verified listings
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">For Candidates</h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Browse All Jobs
                </Link>
              </li>
              <li>
                <Link href="/?workplaceType=Remote" className="hover:text-blue-600 transition-colors">
                  Remote Jobs
                </Link>
              </li>
              <li>
                <Link href="/?experience=Fresher+(0-1+yrs)" className="hover:text-blue-600 transition-colors">
                  Fresher Openings
                </Link>
              </li>
              <li>
                <Link href="/?category=Software+%26+Engineering" className="hover:text-blue-600 transition-colors">
                  Tech & Engineering
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin Links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Administration</h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/post-job" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                  + Post New Job (Admin) &rarr;
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
                  Admin Moderation Panel
                </Link>
              </li>
              <li className="pt-2">
                <span className="text-xs text-zinc-500 block">Editorial Desk:</span>
                <a href="mailto:editorial@selectedjobs.in" className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" /> editorial@selectedjobs.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} SelectedJobs.in. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Every job opening is screened and verified prior to being published.</p>
        </div>
      </div>
    </footer>
  );
}
