import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Job, JobFilters, JobInput, JobStatus } from "./types";

const DATA_FILE = path.join(process.cwd(), "src", "data", "jobs.json");

// Read all jobs from file
export async function getAllJobs(filters?: JobFilters & { status?: JobStatus | "ALL" }): Promise<Job[]> {
  try {
    const rawData = await fs.readFile(DATA_FILE, "utf-8");
    let jobs: Job[] = JSON.parse(rawData);

    // Filter by status (default is APPROVED for public board)
    if (filters?.status) {
      if (filters.status !== "ALL") {
        jobs = jobs.filter((j) => j.status === filters.status);
      }
    } else {
      // Default to APPROVED for public view
      jobs = jobs.filter((j) => j.status === "APPROVED");
    }

    // Filter by search term
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q)) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (filters?.category && filters.category !== "All Categories") {
      jobs = jobs.filter((j) => j.category === filters.category);
    }

    // Filter by workplace type
    if (filters?.workplaceType && filters.workplaceType !== "All") {
      jobs = jobs.filter((j) => j.workplaceType === filters.workplaceType);
    }

    // Filter by experience level
    if (filters?.experience && filters.experience !== "All") {
      jobs = jobs.filter((j) => j.experience === filters.experience);
    }

    // Filter by employment type
    if (filters?.employmentType && filters.employmentType !== "All") {
      jobs = jobs.filter((j) => j.employmentType === filters.employmentType);
    }

    // Filter by location
    if (filters?.location) {
      const loc = filters.location.toLowerCase().trim();
      jobs = jobs.filter((j) => j.location.toLowerCase().includes(loc));
    }

    // Filter by top grid
    if (filters?.featuredInTopGrid !== undefined) {
      jobs = jobs.filter((j) => Boolean(j.featuredInTopGrid) === filters.featuredInTopGrid);
    }

    // Sort: Featured first, then newest first
    return jobs.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error("Error reading jobs:", error);
    return [];
  }
}

// Get single job by ID
export async function getJobById(id: string): Promise<Job | null> {
  const jobs = await getAllJobs({ status: "ALL" });
  return jobs.find((j) => j.id === id) || null;
}

// Save all jobs to file
async function saveJobs(jobs: Job[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

// Create new job posting (Default status: APPROVED when created by admin)
export async function createJob(input: JobInput): Promise<Job> {
  const jobs = await getAllJobs({ status: "ALL" });
  const newJob: Job = {
    ...input,
    recruiterName: input.recruiterName?.trim() || "SelectedJobs Admin",
    recruiterEmail: input.recruiterEmail?.trim() || "admin@selectedjobs.in",
    id: `job_${crypto.randomBytes(6).toString("hex")}`,
    status: input.status || "APPROVED",
    featured: input.featured ?? false,
    featuredInTopGrid: input.featuredInTopGrid ?? false,
    isNew: input.isNew ?? true,
    viewsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jobs.unshift(newJob);
  await saveJobs(jobs);
  return newJob;
}

// Approve job
export async function approveJob(id: string): Promise<Job | null> {
  const jobs = await getAllJobs({ status: "ALL" });
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  jobs[index].status = "APPROVED";
  jobs[index].updatedAt = new Date().toISOString();
  await saveJobs(jobs);
  return jobs[index];
}

// Reject job
export async function rejectJob(id: string, reason?: string): Promise<Job | null> {
  const jobs = await getAllJobs({ status: "ALL" });
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  jobs[index].status = "REJECTED";
  jobs[index].rejectionReason = reason || "Does not meet listing standards";
  jobs[index].updatedAt = new Date().toISOString();
  await saveJobs(jobs);
  return jobs[index];
}

// Toggle featured status
export async function toggleFeatured(id: string): Promise<Job | null> {
  const jobs = await getAllJobs({ status: "ALL" });
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  jobs[index].featured = !jobs[index].featured;
  jobs[index].updatedAt = new Date().toISOString();
  await saveJobs(jobs);
  return jobs[index];
}

// Delete job
export async function deleteJob(id: string): Promise<boolean> {
  const jobs = await getAllJobs({ status: "ALL" });
  const filtered = jobs.filter((j) => j.id !== id);
  if (filtered.length === jobs.length) return false;

  await saveJobs(filtered);
  return true;
}

// Increment view count
export async function incrementViews(id: string): Promise<void> {
  try {
    const jobs = await getAllJobs({ status: "ALL" });
    const index = jobs.findIndex((j) => j.id === id);
    if (index !== -1) {
      jobs[index].viewsCount = (jobs[index].viewsCount || 0) + 1;
      await saveJobs(jobs);
    }
  } catch {
    // Ignore view increment errors
  }
}

// Get admin counts
export async function getJobStats() {
  const jobs = await getAllJobs({ status: "ALL" });
  return {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "PENDING").length,
    approved: jobs.filter((j) => j.status === "APPROVED").length,
    rejected: jobs.filter((j) => j.status === "REJECTED").length,
  };
}
