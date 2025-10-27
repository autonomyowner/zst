import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZST ecom",
  description: "Quality Products, Trusted Suppliers - Find everything you need for your business from verified global suppliers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black min-h-screen`}> 
        <div className="sticky top-0 z-50">
          <Header />
        </div>
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
