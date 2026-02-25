import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { OptiSysSidebar } from "@/components/layout/OptiSysSidebar";
import { TourProvider } from "@/components/tour";

export const metadata: Metadata = {
  title: "OptiSys - Management System Performance Intelligence",
  description: "Advanced analytics dashboard for operational excellence",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1c2b40' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="transition-colors duration-300">
        <ThemeProvider>
          <TourProvider>
            <OptiSysSidebar>{children}</OptiSysSidebar>
          </TourProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
