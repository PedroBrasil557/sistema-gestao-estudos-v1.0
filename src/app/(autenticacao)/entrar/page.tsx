import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return <Suspense fallback={<p>Carregando...</p>}><LoginForm /></Suspense>;
}
