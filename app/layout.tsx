import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "FluxConvert | File Converter Web Application",
  description: "Website converter file berbasis web yang memungkinkan pengguna untuk mengubah berbagai format file seperti Word ke PDF, JPG ke PDF, PDF ke JPG, serta menggabungkan dan memisahkan file PDF dengan mudah dan cepat.",
  keywords: ["flux convert", "flucvonvert", "file converter", "pdf converter", "word to pdf", "jpg to pdf", "pdf to word", "pdf to jpg", "merge pdf", "split pdf", "converter online"],
  verification: {
    google: "_-vEABRQqyByT-NkAOFvtri63dCyf3QYIWcpvpJTYTE",
  },
  openGraph: {
    title: "FluxConvert | File Converter Web Application",
    description: "Website converter file berbasis web yang memungkinkan pengguna untuk mengubah berbagai format file seperti Word ke PDF, JPG ke PDF, PDF ke JPG, serta menggabungkan dan memisahkan file PDF dengan mudah dan cepat.",
    type: "website",
    locale: "id_ID",
  },
  icons: {
    icon: "/images/icon.png",
    shortcut: "/images/icon.png",
    apple: "/images/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="google-site-verification" content="_-vEABRQqyByT-NkAOFvtri63dCyf3QYIWcpvpJTYTE" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
