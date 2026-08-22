import { GoogleAuthProvider } from "@/components/google-auth-provider";
import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "sonner";
import { CelebrationProvider } from "@/components/dashboard-upgrades/celebration-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Career Roadmap Generator | Personal Career Timelines",
  description:
    "Design personalized, AI-generated career roadmaps, structured weekly modules, dynamic MCQ quizzes, ATS resume feedback, and mock interviews.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>

      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased bg-background text-foreground`}
      >
        <GoogleAuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <CelebrationProvider>
                {children}
              </CelebrationProvider>

              <Toaster
                position="top-right"
                theme="dark"
                richColors
                closeButton
              />
            </ThemeProvider>
          </QueryProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}