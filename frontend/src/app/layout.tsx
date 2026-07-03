import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Metadata } from "next";
import { DM_Sans, Roboto } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "sonner";
import { CelebrationProvider } from "@/components/dashboard-upgrades/celebration-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"],
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
        className={`${dmSans.variable} ${roboto.variable} antialiased bg-background text-foreground`}
      >
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
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
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}