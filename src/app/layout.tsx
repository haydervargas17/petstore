import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
