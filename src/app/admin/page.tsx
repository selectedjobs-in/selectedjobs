"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Star,
  Trash2,
  ExternalLink,
  Eye,
  LogOut,
  Sparkles,
  User,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Filter,
  PlusCircle,
} from "lucide-react";
import { Job, JobStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [currentTab, setCurrentTab] = useState<JobStatus | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/jobs?status=${currentTab}&search=${encodeURIComponent(searchTerm)}`);

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Error loading admin jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [currentTab, searchTerm, router]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT" | "TOGGLE_FEATURED", reason?: string) => {
    try {
      setActionLoading(id);
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          action === "APPROVE"
            ? "Job approved and published live on SelectedJobs.in!"
            : action === "REJECT"
            ? "Job marked as rejected."
            : "Featured status updated."
        );
        fetchJobs();
        if (selectedJob && selectedJob.id === id) {
          setSelectedJob(data.job);
        }
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this job posting?")) return;

    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/jobs?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        showToast("Job posting deleted.");
        fetchJobs();
        if (selectedJob?.id === id) setSelectedJob(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 rounded-2xl bg-zinc-900 text-white px-5 py-3 shadow-2xl text-xs font-semibold flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                SelectedJobs Admin Moderation
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Review and approve recruiter submissions before they appear live on selectedjobs.in
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/post-job"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Post New Job</span>
            </Link>
            <button
              onClick={() => fetchJobs()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setCurrentTab("PENDING")}
            className={`text-left rounded-2xl border p-5 transition-all ${
              currentTab === "PENDING"
                ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Pending Review</span>
              <span className="relative flex h-3 w-3">
                {stats.pending > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.pending}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">Awaiting your approval</span>
          </button>

          <button
            onClick={() => setCurrentTab("APPROVED")}
            className={`text-left rounded-2xl border p-5 transition-all ${
              currentTab === "APPROVED"
                ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Live & Published</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.approved}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">Active on public board</span>
          </button>

          <button
            onClick={() => setCurrentTab("REJECTED")}
            className={`text-left rounded-2xl border p-5 transition-all ${
              currentTab === "REJECTED"
                ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Rejected Postings</span>
              <XCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {stats.rejected}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">Declined or duplicate</span>
          </button>

          <button
            onClick={() => setCurrentTab("ALL")}
            className={`text-left rounded-2xl border p-5 transition-all ${
              currentTab === "ALL"
                ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Total Openings</span>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-white">
              {stats.total}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">All-time submissions</span>
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setCurrentTab("PENDING")}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                currentTab === "PENDING"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Pending Approval ({stats.pending})
            </button>
            <button
              onClick={() => setCurrentTab("APPROVED")}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                currentTab === "APPROVED"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Live ({stats.approved})
            </button>
            <button
              onClick={() => setCurrentTab("REJECTED")}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                currentTab === "REJECTED"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Rejected ({stats.rejected})
            </button>
            <button
              onClick={() => setCurrentTab("ALL")}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                currentTab === "ALL"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              All ({stats.total})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, company, recruiter..."
              className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>

        {/* Jobs List */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              Loading openings...
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                Queue is clear!
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                No job postings found in this category.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:border-zinc-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Job Details */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-base border border-blue-200/50 dark:bg-zinc-800 dark:text-blue-400">
                      {job.company.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          {job.company}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            job.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : job.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {job.status === "PENDING"
                            ? "Pending Review"
                            : job.status === "APPROVED"
                            ? "Published Live"
                            : "Rejected"}
                        </span>

                        {job.featured && (
                          <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-blue-600" />
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                        {job.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span>{job.location}</span> &bull;
                        <span>{job.workplaceType}</span> &bull;
                        <span>{job.experience}</span> &bull;
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{job.salary}</span> &bull;
                        <span>Submitted {formatDate(job.createdAt)}</span>
                      </div>

                      {/* Recruiter info box */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800">
                        <span className="flex items-center gap-1 font-medium text-zinc-900 dark:text-white">
                          <User className="h-3.5 w-3.5 text-zinc-500" />
                          Recruiter: {job.recruiterName}
                        </span>
                        <a
                          href={`mailto:${job.recruiterEmail}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {job.recruiterEmail}
                        </a>
                        {job.recruiterPhone && (
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Phone className="h-3.5 w-3.5" />
                            {job.recruiterPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap lg:flex-col items-end gap-2 pt-3 lg:pt-0">
                    {/* Approve Button (Only if not already approved) */}
                    {job.status !== "APPROVED" && (
                      <button
                        onClick={() => handleAction(job.id, "APPROVE")}
                        disabled={actionLoading === job.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Approve & Publish</span>
                      </button>
                    )}

                    {/* Reject Button (Only if not already rejected) */}
                    {job.status !== "REJECTED" && (
                      <button
                        onClick={() => {
                          const reason = prompt("Enter optional rejection note for recruiter:", "Listing does not meet publication criteria");
                          if (reason !== null) {
                            handleAction(job.id, "REJECT", reason);
                          }
                        }}
                        disabled={actionLoading === job.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Feature Toggle */}
                    <button
                      onClick={() => handleAction(job.id, "TOGGLE_FEATURED")}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                        job.featured
                          ? "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/50"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      <Star className={`h-3 w-3 ${job.featured ? "fill-blue-600 text-blue-600" : ""}`} />
                      <span>{job.featured ? "Featured" : "Mark Featured"}</span>
                    </button>

                    {/* View Details / Live Page */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-blue-600 dark:text-zinc-400 py-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Full Post</span>
                      </button>

                      {job.status === "APPROVED" && (
                        <Link
                          href={`/jobs/${job.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline py-1"
                        >
                          <span>Live Link</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}

                      <button
                        onClick={() => handleDelete(job.id)}
                        className="text-zinc-400 hover:text-rose-600 p-1"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inspect Modal Drawer */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-zinc-900 dark:text-white">
                    {selectedJob.title}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                >
                  &times; Close
                </button>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-3">
                <div>
                  <strong>Company:</strong> {selectedJob.company} {selectedJob.companyWebsite && `(${selectedJob.companyWebsite})`}
                </div>
                <div>
                  <strong>Location:</strong> {selectedJob.location} ({selectedJob.workplaceType})
                </div>
                <div>
                  <strong>Salary:</strong> {selectedJob.salary}
                </div>
                <div>
                  <strong>Application Target:</strong> {selectedJob.applyMethod.toUpperCase()}: {selectedJob.applyValue}
                </div>
                <div>
                  <strong>Recruiter:</strong> {selectedJob.recruiterName} &bull; {selectedJob.recruiterEmail} {selectedJob.recruiterPhone && `&bull; ${selectedJob.recruiterPhone}`}
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <strong className="block mb-1 text-zinc-800 dark:text-zinc-200">Full Description:</strong>
                  <div className="whitespace-pre-line p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-mono">
                    {selectedJob.description}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                {selectedJob.status !== "APPROVED" && (
                  <button
                    onClick={() => handleAction(selectedJob.id, "APPROVE")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Approve & Publish Now
                  </button>
                )}
                <button
                  onClick={() => setSelectedJob(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
