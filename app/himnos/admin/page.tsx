import { redirect } from "next/navigation";
import { hasHymnsAdminFromCookies } from "@/lib/hymns-gate";
import { HimnosAdminClient } from "../HimnosAdminClient";

export default async function HimnosAdminPage() {
  if (!(await hasHymnsAdminFromCookies())) {
    redirect("/himnos/acceso");
  }
  return <HimnosAdminClient />;
}
