import type { Metadata } from "next";
import { ToastProvider } from "@/shared/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pet Store",
  description: "Administración de stock, ventas y domicilios por roles"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
