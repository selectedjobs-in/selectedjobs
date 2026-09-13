import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE_NAME, DEFAULT_ADMIN_KEY } from "./constants";

export async function verifyAdminAuth(): Promise<boolean> {
  const headerStore = await headers();
  const headerKey = headerStore.get("x-admin-key");
  if (headerKey === DEFAULT_ADMIN_KEY) return true;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token === DEFAULT_ADMIN_KEY;
}

export function isValidAdminKey(key: string): boolean {
  return key === DEFAULT_ADMIN_KEY;
}
