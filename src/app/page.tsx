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
          <InfoCard title="Selected Jobs - Providing Authentic Career & Jobs Portal Features">
            <p>
              This website primarily serves as a dedicated job portal for candidates, offering well-organized job listings in a structured table and category format for easy access by aspirants across India. Beyond job listings, this platform is curated for educational alerts, admit cards, and recruitment study materials.
            </p>
            <p>
              At <strong>SelectedJobs.in</strong>, we dedicate ourselves to crafting an accurate, timely, and functional portal experience. All job notices are screened before being published to protect candidates from misleading information.
            </p>
          </InfoCard>

          {/* Info Card 2 */}
          <InfoCard title="Essential Features of SelectedJobs.in">
            <p>
              A well-designed job portal offers a seamless experience for both candidates and administrators. Key features include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Intuitive Category Box Listings:</strong> Organized sections that make it fast for candidates to find relevant opportunities in State, Govt, Banking, Tech, and Defence sectors.</li>
              <li><strong>Direct Official Links:</strong> Direct links to official careers portals, PDFs, and application forms without third-party redirects.</li>
              <li><strong>Administrator Verified:</strong> Strict editorial curation to ensure only legitimate vacancies are presented.</li>
              <li><strong>Mobile & Desktop Fast Navigation:</strong> Lightweight and responsive design ensuring rapid page loads on all mobile networks.</li>
            </ul>
          </InfoCard>

          {/* Info Card 3 */}
          <InfoCard title="Top Features of Our Job Portal">
            <p>
              <strong>Selected Jobs</strong> is professionally tailored for career seekers and educational boards. Whether you are searching for Central Govt openings, State Public Service exams, Banking vacancies, or IT roles:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Modern & Responsive Design:</strong> Accessible across smartphones, tablets, and desktop computers.</li>
              <li><strong>Fast Job Posting for Administrators:</strong> Instant one-click publication directly to the live feed.</li>
              <li><strong>Google Jobs SEO Schema:</strong> Built-in structured data allowing Google search to rank openings automatically.</li>
            </ul>
          </InfoCard>

          {/* Info Card 4 */}
          <InfoCard title="Seamless Recruitment and Career Growth">
            <p>
              Our platform connects qualified candidates directly with official hiring processes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Job Listings & Multi-Category Sorting:</strong> Fast category-based classification.</li>
              <li><strong>Transparent Eligibility Details:</strong> Plain-text breakdown of age limit, educational qualification, and application fees.</li>
            </ul>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
