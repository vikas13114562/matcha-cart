import { isAdminAuthenticated } from "@/lib/auth";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <main className="page-shell"><AdminPanel initiallyAuthenticated={await isAdminAuthenticated()} /></main>;
}
