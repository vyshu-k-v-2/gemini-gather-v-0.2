import type { Metadata, Viewport } from "next";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "material-symbols/rounded.css";
import "./globals.css";
import { PlanProvider } from "@/lib/plan-store";
import { SnackbarHost } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Gemini Gather — Living Event Planning with Gemini & Imagen",
  description:
    "Living plan with instant replanning (80 to 120 guests), Plan Health Score with Risk Radar, Voice & Photo in Indian languages, Google tools export, and Family Mode with Imagen e-invites.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#202124" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem('geminigather.theme.v1') || localStorage.getItem('eventcraft.theme.v1');
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {/* WCAG 2.2 Skip Navigation Link */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ErrorBoundary>
          <PlanProvider>
            {children}
            <SnackbarHost />
          </PlanProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
