import type { Metadata } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const notoSansHebrew = Noto_Sans_Hebrew({
  variable: "--font-noto-sans-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "רס״פנט – ניהול תורנויות חכם",
  description: "רס״פנט – ניהול תורנויות חכם לפי ניקוד אלגוריתמי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${notoSansHebrew.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors dir="rtl" />
        </AuthProvider>
      </body>
    </html>
  );
}
