import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://urokov.uz"),
  title: "Urokov — 3D & Creative Coding Lab",
  description: "Интерактивные 3D визуализации, генеративная графика и анимации.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Urokov — 3D & Creative Coding Lab",
    description: "Интерактивные 3D визуализации, генеративная графика и анимации.",
    url: "https://urokov.uz",
    siteName: "Urokov",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Urokov 3D Lab Preview",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urokov — 3D & Creative Coding Lab",
    description: "Интерактивные 3D визуализации, генеративная графика и анимации.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.className} font-sans bg-[#f7f8fa] text-zinc-900 antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Центральный фрейм (600px) на мягком светлом фоне */}
          <div className="w-full max-w-[600px] mx-auto min-h-screen bg-white border-x border-zinc-200/90 shadow-[0_0_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
