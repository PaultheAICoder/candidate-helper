import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider, ToastViewport } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cindy from Cinder - AI Interview Coach",
  description: "Free AI interview and application coach for job seekers",
  keywords: ["interview", "coaching", "AI", "job search", "career"],
  authors: [{ name: "Cinder AI" }],
  openGraph: {
    title: "Cindy from Cinder - AI Interview Coach",
    description: "Free AI interview and application coach for job seekers",
    url: "https://teamcinder.com/coach",
    siteName: "Cindy from Cinder",
    locale: "en_US",
    type: "website",
    images: ["/images/cindy-avatar.svg"],
  },
  twitter: {
    card: "summary",
    title: "Cindy from Cinder - AI Interview Coach",
    description: "Free AI interview and application coach for job seekers",
    images: ["/images/cindy-avatar.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <ErrorBoundary>
          <ToastProvider>
            {children}
            <ToastViewport />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
