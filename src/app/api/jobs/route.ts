import { NextResponse } from "next/server";
import { getAllJobs, createJob } from "@/lib/db";
import { JobInput } from "@/lib/types";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const workplaceType = searchParams.get("workplaceType") || undefined;
    const experience = searchParams.get("experience") || undefined;
    const employmentType = searchParams.get("employmentType") || undefined;
    const location = searchParams.get("location") || undefined;

    const jobs = await getAllJobs({
      status: "APPROVED",
      search,
      category,
      workplaceType,
      experience,
      employmentType,
      location,
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Enforce Admin-Only Job Posting
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only administrators can post job openings." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate essential role fields
    const requiredFields: (keyof JobInput)[] = [
      "title",
      "company",
      "category",
      "workplaceType",
      "location",
      "employmentType",
      "experience",
      "description",
      "applyMethod",
      "applyValue",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format if applyMethod is email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.applyMethod === "email" && !emailRegex.test(body.applyValue)) {
      return NextResponse.json(
        { success: false, error: "Invalid application email address" },
        { status: 400 }
      );
    }

    const jobData: JobInput = {
      title: body.title.trim(),
      company: body.company.trim(),
      companyWebsite: body.companyWebsite?.trim() || "",
      companyLogo: body.companyLogo?.trim() || "",
      category: body.category,
      workplaceType: body.workplaceType,
      location: body.location.trim(),
      employmentType: body.employmentType,
      experience: body.experience,
      salary: body.salary?.trim() || "Competitive / Not Disclosed",
      skills: Array.isArray(body.skills)
        ? body.skills.map((s: string) => s.trim()).filter(Boolean)
        : [],
      description: body.description.trim(),
      applyMethod: body.applyMethod,
      applyValue: body.applyValue.trim(),
      recruiterName: body.recruiterName?.trim() || "SelectedJobs Admin",
      recruiterEmail: body.recruiterEmail?.trim() || "admin@selectedjobs.in",
      recruiterPhone: body.recruiterPhone?.trim() || "",
      status: body.status === "PENDING" ? "PENDING" : "APPROVED",
      featured: Boolean(body.featured),
      featuredInTopGrid: Boolean(body.featuredInTopGrid),
      isNew: body.isNew !== undefined ? Boolean(body.isNew) : true,
    };

    const newJob = await createJob(jobData);

    return NextResponse.json({
      success: true,
      message: newJob.status === "APPROVED"
        ? "Job published live successfully on SelectedJobs.in."
        : "Job saved as draft in the Pending Review queue.",
      job: newJob,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit job posting" },
      { status: 500 }
    );
  }
}
