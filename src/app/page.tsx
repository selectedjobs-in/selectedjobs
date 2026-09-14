import { getAllJobs } from "@/lib/db";
import TopColoredTiles from "@/components/TopColoredTiles";
import CategoryJobBox from "@/components/CategoryJobBox";
import InfoCard from "@/components/InfoCard";
import Link from "next/link";
import { Search, Calendar, ChevronRight, CheckCircle2, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

export default async function HomePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const allApprovedJobs = await getAllJobs({ status: "APPROVED" });

  const searchQuery = searchParams.search?.trim();
  const categoryQuery = searchParams.category?.trim();

  // If search or specific category filter is active, filter accordingly
  let filteredJobs = allApprovedJobs;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredJobs = allApprovedJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q))
    );
  } else if (categoryQuery && categoryQuery !== "All Categories") {
    filteredJobs = allApprovedJobs.filter((j) =>
      j.category.toLowerCase().includes(categoryQuery.toLowerCase())
    );
  }

  // Jobs for the top colored 8-tile grid
  const topGridJobs = allApprovedJobs.filter((j) => j.featuredInTopGrid);
  // Fallback if less than 8
  const displayTopGrid =
    topGridJobs.length >= 8
      ? topGridJobs.slice(0, 8)
      : allApprovedJobs.slice(0, 8);

  // Group jobs for each of the category boxes
  const stateJobs = allApprovedJobs.filter(
    (j) => j.category === "ALL STATE JOBS" || j.location.includes("State")
  );
  const govtJobs = allApprovedJobs.filter(
    (j) => j.category === "GOVT & PSU JOBS"
  );
  const defenceJobs = allApprovedJobs.filter(
    (j) => j.category === "DEFENCE & POLICE JOBS"
  );
  const bankJobs = allApprovedJobs.filter(
    (j) => j.category === "BANK & FINANCIAL JOBS"
  );
  const techJobs = allApprovedJobs.filter(
    (j) => j.category === "TECH & SOFTWARE JOBS"
  );
  const railwayJobs = allApprovedJobs.filter(
    (j) => j.category === "POST OFFICE & RAILWAYS"
  );
  const engineeringJobs = allApprovedJobs.filter(
    (j) => j.category === "ENGINEERING & DIPLOMA"
  );
  const teachingJobs = allApprovedJobs.filter(
    (j) => j.category === "TEACHING & EDUCATION"
  );
  const notificationJobs = allApprovedJobs.filter(
    (j) => j.category === "IMPORTANT NOTIFICATIONS & PDFS"
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16">
      {/* 1. Top Colored Grid (8 Tiles in 2 Rows x 4 Cols matching Screenshot 1) */}
      {!searchQuery && !categoryQuery && (
        <TopColoredTiles jobs={displayTopGrid} />
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-2 sm:px-4 py-4 space-y-6">
        {/* Search Results Banner if active */}
        {(searchQuery || categoryQuery) && (
          <div className="rounded border border-blue-300 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#1c64f2]" />
                <h2 className="text-sm font-bold text-zinc-900">
                  Search Results for:{" "}
                  <span className="text-[#1c64f2]">
                    &quot;{searchQuery || categoryQuery}&quot;
                  </span>{" "}
                  ({filteredJobs.length} openings found)
                </h2>
              </div>
              <Link
                href="/"
                className="text-xs font-bold text-red-600 hover:underline"
              >
                &larr; Return to All Categories
              </Link>
            </div>

            <div className="mt-4 divide-y divide-zinc-100">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div key={job.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/jobs/${job.id}`} className="group block">
                      <div className="text-sm font-bold text-zinc-900 group-hover:text-blue-700 leading-snug flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">&bull;</span>
                        <span>
                          {job.title}
                          {job.isNew && (
                            <span className="inline-block ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-black text-rose-600 bg-amber-100 border border-amber-300">
                              NEW
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 pl-3">
                        <span>{job.company}</span> &bull;
                        <span>{job.location}</span> &bull;
                        <span>{job.salary}</span> &bull;
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No matching jobs found for this query. Try a different keyword or view the categories below.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Main 3-Column Category Box Grid (Row 1: All State, Govt, Defence) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CategoryJobBox
            id="all-state"
            title="ALL STATE JOBS"
            jobs={stateJobs.length > 0 ? stateJobs : allApprovedJobs.slice(0, 6)}
            categoryFilter="ALL STATE JOBS"
          />
          <CategoryJobBox
            id="govt-jobs"
            title="GOVT JOBS"
            jobs={govtJobs.length > 0 ? govtJobs : allApprovedJobs.slice(2, 8)}
            categoryFilter="GOVT & PSU JOBS"
          />
          <CategoryJobBox
            id="defence-jobs"
            title="DEFENCE & POLICE JOBS"
            jobs={defenceJobs.length > 0 ? defenceJobs : allApprovedJobs.slice(4, 10)}
            categoryFilter="DEFENCE & POLICE JOBS"
          />
        </div>

        {/* 3. Main 3-Column Category Box Grid (Row 2: Bank, Tech, Railways) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CategoryJobBox
            id="bank-jobs"
            title="BANK & FINANCIAL JOBS"
            jobs={bankJobs.length > 0 ? bankJobs : allApprovedJobs.slice(0, 6)}
            categoryFilter="BANK & FINANCIAL JOBS"
          />
          <CategoryJobBox
            id="tech-jobs"
            title="TECH & SOFTWARE JOBS"
            jobs={techJobs.length > 0 ? techJobs : allApprovedJobs.slice(3, 9)}
            categoryFilter="TECH & SOFTWARE JOBS"
          />
          <CategoryJobBox
            id="railway-jobs"
            title="POST OFFICE & RAILWAYS"
            jobs={railwayJobs.length > 0 ? railwayJobs : allApprovedJobs.slice(1, 7)}
            categoryFilter="POST OFFICE & RAILWAYS"
          />
        </div>

        {/* 4. Main 3-Column Category Box Grid (Row 3: Engineering, Teaching, Important PDFs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CategoryJobBox
            id="engineering-jobs"
            title="ENGINEERING & DIPLOMA"
            jobs={engineeringJobs.length > 0 ? engineeringJobs : allApprovedJobs.slice(5, 11)}
            categoryFilter="ENGINEERING & DIPLOMA"
          />
          <CategoryJobBox
            id="teaching-jobs"
            title="TEACHING & EDUCATION"
            jobs={teachingJobs.length > 0 ? teachingJobs : allApprovedJobs.slice(2, 8)}
            categoryFilter="TEACHING & EDUCATION"
          />
          <CategoryJobBox
            id="notifications"
            title="IMPORTANT PDF FILES"
            jobs={notificationJobs.length > 0 ? notificationJobs : allApprovedJobs.slice(0, 6)}
            categoryFilter="IMPORTANT NOTIFICATIONS & PDFS"
          />
        </div>

        {/* 5. Full-Width "READ MORE / RECENT UPDATES" Panel (Matching Screenshot 2) */}
        <div className="rounded border border-blue-300 bg-white shadow-sm overflow-hidden mt-6">
          <div className="bg-[#1d4ed8] text-white px-4 py-2 font-bold text-xs sm:text-sm tracking-wide uppercase">
            READ MORE / LATEST POSTINGS
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
            {/* Column 1 */}
            <div className="space-y-3 pt-2 md:pt-0">
              {allApprovedJobs.slice(0, 4).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="group block text-xs">
                  <div className="font-semibold text-zinc-900 group-hover:text-blue-700 leading-snug flex items-start gap-1">
                    <span className="text-blue-600 font-bold">&bull;</span>
                    <span>{job.title}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-400 pl-2.5">
                    {formatDate(job.createdAt)}
                  </div>
                </Link>
              ))}
            </div>

            {/* Column 2 */}
            <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
              {allApprovedJobs.slice(4, 8).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="group block text-xs">
                  <div className="font-semibold text-zinc-900 group-hover:text-blue-700 leading-snug flex items-start gap-1">
                    <span className="text-blue-600 font-bold">&bull;</span>
                    <span>{job.title}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-400 pl-2.5">
                    {formatDate(job.createdAt)}
                  </div>
                </Link>
              ))}
            </div>

            {/* Column 3 */}
            <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
              {allApprovedJobs.slice(8, 12).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="group block text-xs">
                  <div className="font-semibold text-zinc-900 group-hover:text-blue-700 leading-snug flex items-start gap-1">
                    <span className="text-blue-600 font-bold">&bull;</span>
                    <span>{job.title}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-400 pl-2.5">
                    {formatDate(job.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Load More Button */}
          <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded bg-[#1d4ed8] px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition-colors"
            >
              <span>Load More Openings</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* 6. Informational Sections Matching Screenshots 3 & 4 */}
        <div className="space-y-4 pt-2">
          {/* Info Card 1 */}
          <InfoCard title="About SelectedJobs.in – A True Job Portal for Career Aspirants">
            <p>
              <strong>SelectedJobs.in</strong> is dedicated to empowering millions of career seekers and job aspirants across India by providing timely, verified, and transparent recruitment notifications. We cut through misleading advertisements, fake circulars, and cluttered redirect links to bring you direct, authoritative job alerts.
            </p>
            <p>
              Our editorial desk monitors official government gazettes, the Press Information Bureau (PIB), Union & State Public Service Commissions, and corporate recruitment desks daily. Every opening listed on this platform is verified to ensure authentic application guidelines, eligible educational criteria, and accurate cutoff dates.
            </p>
          </InfoCard>

          {/* Info Card 2 */}
          <InfoCard title="Comprehensive Career & Recruitment Coverage Across India">
            <p>We organize employment notices into structured, easy-to-navigate category segments:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Central & State Public Services:</strong> Real-time alerts for UPSC (Civil Services, CDS, NDA), Staff Selection Commission (SSC CGL, CHSL, GD, MTS), Railway Recruitment Boards (RRB NTPC, Group D, ALP), and State PSC examinations across all Indian states.
              </li>
              <li>
                <strong>Banking & Financial Sector:</strong> Exhaustive alerts for SBI (Probationary Officers & Clerks), IBPS PO/Clerk/RRB/SO, Reserve Bank of India (RBI Grade B & Assistant), NABARD, SEBI, and public insurance corporations (LIC, NIACL, GIC).
              </li>
              <li>
                <strong>Defence & Uniformed Services:</strong> Immediate circulars for Indian Army, Navy, Air Force (Agniveer, AFCAT, Technical Entry), Central Armed Police Forces (BSF, CISF, CRPF, ITBP, SSB), and State Police Sub-Inspectors & Constables.
              </li>
              <li>
                <strong>Engineering & Technical PSUs:</strong> Opportunities for Diploma and B.Tech / B.E. graduates across top Maharatna & Navratna PSUs (GATE-based recruitments in ONGC, NTPC, BHEL, IOCL, HPCL) and technical apprenticeships.
              </li>
              <li>
                <strong>Teaching & IT/Software:</strong> Central & State Teacher Eligibility Tests (CTET, State TETs, KVS, NVS, DSSSB, UGC NET), alongside vetted tech openings, software developer drives, and graduate trainee walk-ins.
              </li>
            </ul>
          </InfoCard>

          {/* Info Card 3 */}
          <InfoCard title="Aspirants' Verification Guide & Safe Application Practices">
            <p>
              To ensure a seamless and safe application experience, candidates are advised to follow these standard practices:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Direct Official Portals:</strong> Always access the recruitment notification PDF and online application module via the verified official link provided on each job page.</li>
              <li><strong>Check Eligibility Carefully:</strong> Thoroughly read the official advertisement PDF for specific age cutoff dates, educational relaxations, category certificates (SC/ST/OBC/EWS/PwD), and physical standard tests.</li>
              <li><strong>Never Pay Third-Party Intermediaries:</strong> SelectedJobs.in provides information 100% free of charge and never asks for donations or payment. All exam and application fees must only be paid through the official gateway of the recruiting commission.</li>
              <li><strong>Keep Copies of Forms:</strong> Always preserve a PDF copy of your submitted application form, fee receipt, and registration registration/roll number for future admit card downloads.</li>
            </ul>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
