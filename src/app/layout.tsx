import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import BackgroundFX from "@/components/BackgroundFX";
import Footer from "@/components/Footer";

const bn = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "রক্তবন্ধু: জরুরি রক্তের জন্য দাতা ও ব্যাগ খুঁজুন",
  description: "রক্তদাতা, হাসপাতাল ও ব্লাড ব্যাংককে এক জায়গায় যুক্ত করার ব্যবস্থাপনা সিস্টেম",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#131A2B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={bn.variable}>
      <body className="flex min-h-screen flex-col">
        <BackgroundFX />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-surface focus:p-2">
          মূল অংশে যান
        </a>
        {children}
        <Footer />
      </body>
    </html>
  );
}