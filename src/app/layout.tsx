import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gestão de Estudos — Roberta",
    template: "%s | Gestão de Estudos",
  },
  description: "Sistema pessoal para gestão de cursos, estudos, anotações e certificados.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
