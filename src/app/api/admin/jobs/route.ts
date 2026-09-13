import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import {
  getAllJobs,
  approveJob,
  rejectJob,
  toggleFeatured,
  deleteJob,
  getJobStats,
} from "@/lib/db";
import { JobStatus } from "@/lib/types";

export async function GET(request: Request) {
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get("status") || "ALL") as JobStatus | "ALL";
    const search = searchParams.get("search") || undefined;

    const jobs = await getAllJobs({
      status: statusParam,
      search,
    });
    const stats = await getJobStats();

    return NextResponse.json({ success: true, jobs, stats });
  } catch (error) {
    console.error("Admin jobs fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, action, reason } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: "Missing id or action parameter" },
        { status: 400 }
      );
    }

    let updatedJob = null;

    if (action === "APPROVE") {
      updatedJob = await approveJob(id);
    } else if (action === "REJECT") {
      updatedJob = await rejectJob(id, reason);
    } else if (action === "TOGGLE_FEATURED") {
      updatedJob = await toggleFeatured(id);
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    if (!updatedJob) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const stats = await getJobStats();
    return NextResponse.json({
      success: true,
      message: `Job ${action.toLowerCase()}d successfully`,
      job: updatedJob,
      stats,
    });
  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing job ID" }, { status: 400 });
    }

    const deleted = await deleteJob(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const stats = await getJobStats();
    return NextResponse.json({
      success: true,
      message: "Job deleted permanently",
      stats,
    });
  } catch (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 });
  }
}
