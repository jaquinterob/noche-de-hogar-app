import { redirect } from "next/navigation";
import { hasHymnsAdminFromCookies } from "@/lib/hymns-gate";
import { HimnosAccesoForm } from "./HimnosAccesoForm";

export default async function HimnosAccesoPage() {
  if (await hasHymnsAdminFromCookies()) {
    redirect("/himnos/admin");
  }
  return <HimnosAccesoForm />;
}
