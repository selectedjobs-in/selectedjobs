import { getJobById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import {
  MapPin,
  Briefcase,
  Banknote,
  Clock,
  Building2,
  ExternalLink,
  Mail,
  Share2,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { formatDate, getWorkplaceBadgeColor } from "@/lib/utils";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: JobDetailPageProps): Promise<Metadata> {
  const { id } = await props.params;
  const job = await getJobById(id);

  if (!job) {
    return {
      title: "Job Not Found | SelectedJobs.in",
    };
  }

  return {
    title: `${job.title} at ${job.company} | SelectedJobs.in`,
    description: `Apply for ${job.title} at ${job.company} in ${job.location}. ${job.experience} experience. Verified on SelectedJobs.in.`,
    openGraph: {
      title: `${job.title} at ${job.company}`,
      description: `Explore this verified opening on SelectedJobs.in: ${job.title} in ${job.location}.`,
    },
  };
}

export default async function JobDetailPage(props: JobDetailPageProps) {
  const { id } = await props.params;
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }

  // Google Jobs Schema (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: "SelectedJobs.in",
      value: job.id,
    },
    datePosted: job.createdAt,
    employmentType: job.employmentType.toUpperCase().replace("-", "_"),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: job.companyWebsite || undefined,
      logo: job.companyLogo || undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "IN",
      },
    },
    baseSalary: job.salary
      ? {
          "@type": "MonetaryAmount",
          currency: "INR",
          value: {
            "@type": "QuantitativeValue",
            value: job.salary,
            unitText: "YEAR",
          },
        }
      : undefined,
  };

  const applyHref =
    job.applyMethod === "email"
      ? `mailto:${job.applyValue}?subject=Application for ${encodeURIComponent(
          job.title
        )} via SelectedJobs.in`
      : job.applyValue.startsWith("http")
      ? job.applyValue
      : `https://${job.applyValue}`;

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 py-8">
      {/* Inject Google Jobs Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to All Openings</span>
          </Link>
        </div>

        {/* Job Header Card */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="h-16 w-16 rounded-2xl object-cover border border-zinc-200 bg-zinc-50 dark:border-zinc-700 flex-shrink-0"
                />
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-bold text-xl border border-blue-200/50 dark:bg-zinc-800 dark:text-blue-400">
                  {job.company.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                    {job.company}
                  </span>
                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Verified by SelectedJobs
                  </span>
                </div>

                <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  {job.title}
                </h1>

                {/* Key metadata pills */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    {job.location}
                  </span>

                  <span
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium ${getWorkplaceBadgeColor(
                      job.workplaceType
                    )}`}
                  >
                    {job.workplaceType}
                  </span>

                  <span className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
                    <Briefcase className="h-4 w-4 text-zinc-500" />
                    {job.experience} &bull; {job.employmentType}
                  </span>

                  {job.salary && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                      {job.salary}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Desktop */}
            <div className="w-full sm:w-auto flex flex-col sm:items-end gap-3 pt-2 sm:pt-0">
              <a
                href={applyHref}
                target={job.applyMethod === "url" ? "_blank" : undefined}
                rel={job.applyMethod === "url" ? "noopener noreferrer" : undefined}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/35"
              >
                {job.applyMethod === "email" ? (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Apply via Email</span>
                  </>
                ) : (
                  <>
                    <span>Apply on Company Site</span>
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </a>

              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Posted {formatDate(job.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                Job Description & Requirements
              </h2>

              {/* Description Body */}
              <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-4 whitespace-pre-line">
                {job.description}
              </div>

              {/* Skills required */}
              {job.skills && job.skills.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Desired Technical Skills & Tooling
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Direct Application Summary Card */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">
                How to Apply
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                {job.applyMethod === "email" ? (
                  <>
                    Send your updated resume and portfolio directly to the recruiter at:
                    <span className="block mt-1 font-semibold text-blue-600 break-all">
                      {job.applyValue}
                    </span>
                  </>
                ) : (
                  <>
                    This opening redirects directly to the official careers page or application portal of <strong>{job.company}</strong>.
                  </>
                )}
              </p>

              <a
                href={applyHref}
                target={job.applyMethod === "url" ? "_blank" : undefined}
                rel={job.applyMethod === "url" ? "noopener noreferrer" : undefined}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
              >
                {job.applyMethod === "email" ? <Mail className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                <span>{job.applyMethod === "email" ? "Send Application Email" : "Proceed to Application"}</span>
              </a>
            </div>

            {/* Recruiter & Verification Badge */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified by SelectedJobs.in</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Submitted by HR/Recruiter: <strong className="text-zinc-700 dark:text-zinc-300">{job.recruiterName}</strong>. This job was manually reviewed by the SelectedJobs editorial admin team before publishing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
