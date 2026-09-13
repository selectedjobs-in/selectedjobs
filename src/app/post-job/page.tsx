"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  FileText,
  ShieldCheck,
  Star,
  Globe,
  ArrowRight,
} from "lucide-react";
import {
  JOB_CATEGORIES,
  EXPERIENCE_LEVELS,
  WORKPLACE_TYPES,
  EMPLOYMENT_TYPES,
  POPULAR_LOCATIONS,
} from "@/lib/constants";
import { WorkplaceType, EmploymentType, ExperienceLevel, JobStatus } from "@/lib/types";

export default function AdminPostJobPage() {
  const router = useRouter();

  // Admin Auth verification state
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>("Remote");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("Full-time");
  const [experience, setExperience] = useState<ExperienceLevel>("1-3 years");
  const [salary, setSalary] = useState("");

  const [company, setCompany] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript"]);
  const [description, setDescription] = useState("");

  const [applyMethod, setApplyMethod] = useState<"url" | "email">("url");
  const [applyValue, setApplyValue] = useState("");

  // Admin Specific Controls
  const [publishStatus, setPublishStatus] = useState<JobStatus>("APPROVED");
  const [featured, setFeatured] = useState(false);
  const [featuredInTopGrid, setFeaturedInTopGrid] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [recruiterName, setRecruiterName] = useState("SelectedJobs Editorial");
  const [recruiterEmail, setRecruiterEmail] = useState("admin@selectedjobs.in");
  const [recruiterPhone, setRecruiterPhone] = useState("");

  // UI state
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Check admin session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (!data.isAuthenticated) {
          router.replace("/admin/login?redirect=/post-job");
          return;
        }
        setIsAdmin(true);
      } catch {
        router.replace("/admin/login?redirect=/post-job");
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  // Add skill tag
  const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  // Insert template into description
  const insertTemplate = () => {
    const template = `### About the Role\nWe are looking for a high-performing professional to join our core team.\n\n### Key Responsibilities\n- Own and execute key product deliverables.\n- Partner with cross-functional team members to drive business impact.\n- Ensure high quality, scalability, and adherence to industry best practices.\n\n### Qualifications & Requirements\n- Proven experience in a similar role within a fast-moving company.\n- Strong analytical mindset and collaborative work ethics.\n- Hands-on mastery of relevant tools and technologies.\n\n### Compensation & Perks\n- Competitive salary package.\n- Flexible remote/hybrid working setup.`;
    setDescription(template);
  };

  // Submit Job
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !company.trim() || !location.trim() || !description.trim() || !applyValue.trim()) {
      setErrorMsg("Please fill in all required fields indicated with *");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          workplaceType,
          location,
          employmentType,
          experience,
          salary,
          company,
          companyWebsite,
          companyLogo,
          skills,
          description,
          applyMethod,
          applyValue,
          recruiterName,
          recruiterEmail,
          recruiterPhone,
          status: publishStatus,
          featured,
          featuredInTopGrid,
          isNew,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit job posting.");
      }

      if (publishStatus === "APPROVED") {
        router.push(`/jobs/${data.job.id}`);
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center text-xs text-zinc-500">
          Verifying administrator permissions...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Admin Job Publisher &bull; SelectedJobs.in</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">
            Create & Publish Job Opening
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Post curated openings directly to the live feed or save drafts for later review.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Toggle */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            &larr; Back to Admin Moderation Dashboard
          </Link>

          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-blue-600" />
            <span>{previewMode ? "Return to Edit Form" : "Preview How It Looks"}</span>
          </button>
        </div>

        {/* Preview Container */}
        {previewMode ? (
          <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Live Listing Preview
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  publishStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                Will be: {publishStatus === "APPROVED" ? "Published Live Immediately" : "Saved as Draft"}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-bold text-xl border border-blue-200/50">
                {company.substring(0, 2).toUpperCase() || "CO"}
              </div>
              <div>
                <span className="text-sm font-semibold text-zinc-600">{company || "Your Company Name"}</span>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                  {title || "Job Title (e.g. Senior Frontend Engineer)"}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span>{location || "Location"}</span> &bull;
                  <span>{workplaceType}</span> &bull;
                  <span>{experience}</span> &bull;
                  <span className="font-semibold text-emerald-600">{salary || "Competitive Salary"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Job Description:</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {description || "Job description will appear here..."}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-500 mb-2">Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, idx) => (
                  <span key={idx} className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="mt-4 space-y-8">
            {/* Section 0: Admin Publishing Controls */}
            <div className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-50/30 p-6 sm:p-8 shadow-sm dark:bg-emerald-950/20 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 dark:border-emerald-900/60">
                <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span>Admin Publishing Configuration</span>
                </h2>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Admin Exclusive
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                    Publishing Target Status
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                      <input
                        type="radio"
                        name="publishStatus"
                        value="APPROVED"
                        checked={publishStatus === "APPROVED"}
                        onChange={() => setPublishStatus("APPROVED")}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>🚀 Publish Live Immediately (Recommended)</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="radio"
                        name="publishStatus"
                        value="PENDING"
                        checked={publishStatus === "PENDING"}
                        onChange={() => setPublishStatus("PENDING")}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>📝 Save as Draft (Pending Approval Queue)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                    Homepage Visibility & Highlights
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <input
                        type="checkbox"
                        checked={featuredInTopGrid}
                        onChange={(e) => setFeaturedInTopGrid(e.target.checked)}
                        className="text-amber-500 focus:ring-amber-400 h-4 w-4 rounded"
                      />
                      <span className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        Pin to Top 8 Colored Highlight Tiles (Homepage Grid)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <input
                        type="checkbox"
                        checked={isNew}
                        onChange={(e) => setIsNew(e.target.checked)}
                        className="text-red-600 focus:ring-red-500 h-4 w-4 rounded"
                      />
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black text-rose-600 bg-amber-100 border border-amber-300">NEW</span>
                        Show Animated &quot;NEW&quot; Badge on Listing
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Role Overview */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <span>1. Role Information</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Primary details displayed on cards and search filters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Job Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer, Product Designer, DevOps Lead"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Role Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {JOB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Employment Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Workplace Mode */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Workplace Mode <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORKPLACE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setWorkplaceType(type)}
                        className={`rounded-xl py-2 text-xs font-medium border transition-all ${
                          workplaceType === type
                            ? "border-blue-600 bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/60 dark:text-blue-300"
                            : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    City / Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, Karnataka or Pan-India Remote"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {POPULAR_LOCATIONS.slice(0, 4).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className="text-[10px] text-zinc-500 hover:text-blue-600 underline"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Experience Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {EXPERIENCE_LEVELS.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salary / CTC */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Salary / Compensation Range
                  </label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ₹12 - ₹18 LPA, or Competitive"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Company Information */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span>2. Company Profile</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Company name and branding for this opening.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Company / Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Zerodha, Swiggy, or TechCorp"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                {/* Company Website */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Company Website / LinkedIn
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                {/* Company Logo */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Company Logo URL
                  </label>
                  <input
                    type="url"
                    value={companyLogo}
                    onChange={(e) => setCompanyLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Job Description & Skills */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>3. Role Description & Desired Skills</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Detailed job overview and requirements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={insertTemplate}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                >
                  Insert Template
                </button>
              </div>

              {/* Skills Tags */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  Key Skills & Technologies (Press Enter or click + to add)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="e.g. React, Go, AWS, Python"
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(idx)}
                        className="text-blue-400 hover:text-blue-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Description Body */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  Full Job Description & Eligibility <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include responsibilities, required experience, candidate qualifications, and benefits..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Section 4: Application Channel */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  <span>4. Application Method</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Where should candidates be directed to apply?
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="applyMethod"
                      value="url"
                      checked={applyMethod === "url"}
                      onChange={() => setApplyMethod("url")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>External Application Link (Careers Page / ATS)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="applyMethod"
                      value="email"
                      checked={applyMethod === "email"}
                      onChange={() => setApplyMethod("email")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Direct Email for Resumes</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    {applyMethod === "url" ? "Application URL" : "Application Email Address"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={applyMethod === "url" ? "url" : "email"}
                    required
                    value={applyValue}
                    onChange={(e) => setApplyValue(e.target.value)}
                    placeholder={
                      applyMethod === "url"
                        ? "https://careers.company.com/job/123"
                        : "careers@company.com"
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Submission Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <span className="text-xs text-zinc-500 text-center sm:text-left">
                Posting as administrator on <strong>SelectedJobs.in</strong>.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span>Publishing Job...</span>
                ) : (
                  <>
                    <span>
                      {publishStatus === "APPROVED" ? "Publish Job Live Now" : "Save as Draft"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
