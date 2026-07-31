import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth/new-password-form";

export const metadata: Metadata = { title: "Nova senha" };

export default function NewPasswordPage() {
  return <NewPasswordForm />;
}
