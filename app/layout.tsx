import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "מערכת ניהול כ״א ולו״ז מחלקתי",
  description: "מערכת ניהול כוח אדם, לו״ז, בקשות יציאה ותורנויות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
