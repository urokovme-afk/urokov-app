import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { LiveTracker } from "../components/live-tracker";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Urokov",
  description: "IT, Кибербезопасность и личные заметки",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Urokov",
    description: "IT, Кибербезопасность и личные заметки",
    url: "https://urokov.uz",
    siteName: "Urokov",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Urokov Logo Preview",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urokov",
    description: "IT, Кибербезопасность и личные заметки",
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
      {/* Kompyuterda orqa fonni (body) biroz farqli qilib ajratamiz */}
      <body
        className={`${inter.className} font-sans bg-gray-50 dark:bg-[#0a0a0a] text-black dark:text-white antialiased`}
      >
        <LiveTracker />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* O'rtadagi asosiy lenta (Mobil ilova formati: 600px) */}
          <div className="w-full max-w-[600px] mx-auto min-h-screen bg-white dark:bg-black border-x border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
