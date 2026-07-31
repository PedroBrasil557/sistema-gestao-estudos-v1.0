import type { Metadata } from "next";
import { RecoveryForm } from "@/components/auth/recovery-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return <RecoveryForm />;
}
