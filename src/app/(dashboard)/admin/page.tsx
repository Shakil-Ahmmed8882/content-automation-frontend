import { redirect } from "next/navigation";
import { routes } from "@/routes";

export default function AdminIndexPage() {
  redirect(routes.adminPlatforms);
}
