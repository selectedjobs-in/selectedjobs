import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminKey } from "@/lib/auth";
import { ADMIN_COOKIE_NAME, DEFAULT_ADMIN_KEY } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key || !isValidAdminKey(key)) {
      return NextResponse.json(
        { success: false, error: "Invalid Admin Passkey" },
        { status: 401 }
      );
    }

    const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ?? false;
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, DEFAULT_ADMIN_KEY, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Authenticated successfully" });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = token === DEFAULT_ADMIN_KEY;

  return NextResponse.json({ success: true, isAuthenticated });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
