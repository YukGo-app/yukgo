import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import YukGoSplash from "@/components/splash/yukgo-splash";
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
  title: {
    default: "YukGo",
    template: "%s · YukGo",
  },
  description:
    "YukGo — O‘zbekiston bo‘ylab yuk yuboruvchilar va yo‘nalishi mos tashuvchilarni bog‘laydigan mobil marketplace platforma.",
  applicationName: "YukGo",
  generator: "YukGo",
  keywords: [
    "YukGo",
    "O‘zbekiston yuk tashish",
    "kuryer",
    "yuk yuborish",
    "tashuvchi",
    "logistika",
  ],
  authors: [{ name: "YukGo" }],
  creator: "YukGo",
  publisher: "YukGo",
  metadataBase: new URL("https://yukgo.uz"),
  openGraph: {
    title: "YukGo",
    description:
      "O‘zbekiston bo‘ylab yuk yuboruvchilar va yo‘nalishi mos tashuvchilarni bog‘laydigan mobil marketplace platforma.",
    siteName: "YukGo",
    locale: "uz_UZ",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "YukGo",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050816",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#050816] text-white antialiased">
        <YukGoSplash />
        {children}
      </body>
    </html>
  );
}