import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdminLoggedIn();
  if (!ok) redirect("/admin/login");
  return <>{children}</>;
}
