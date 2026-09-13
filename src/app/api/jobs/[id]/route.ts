import { NextResponse } from "next/server";
import { getJobById, incrementViews } from "@/lib/db";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Increment views asynchronously
    incrementViews(id);

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Error fetching job by ID:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch job" }, { status: 500 });
  }
}
