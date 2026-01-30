import "server-only";
import { cookies } from "next/headers";

export const COOKIE_NAME = "admin_session";

export async function isAdminLoggedIn() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "true";
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
