import "server-only";
import { cookies } from "next/headers";

const COOKIE = "company_session";

export async function setCompanySession(companyId: string) {
  const c = await cookies();
  c.set(COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearCompanySession() {
  const c = await cookies();
  c.set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getCompanySessionId() {
  const c = await cookies();
  return c.get(COOKIE)?.value || null;
}
