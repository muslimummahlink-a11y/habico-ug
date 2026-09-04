import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/use-auth";
import { AppModeProvider } from "@/hooks/app-mode";
import { WorkspaceModeProvider } from "@/hooks/use-workspace-mode";
import { Toaster } from "@/components/ui/sonner";
import { RegisterPage } from "@/routes/register";
import { setExeDownloadUrl } from "@/components/app-store-badges";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try again</button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0f0f11" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Habico Property Managers — Elevate the Value of Your Residences" },
      { name: "description", content: "Habico Property Managers in Kampala helps landlords maximize ROI through tenant management, rent collection, maintenance, and transparent reporting." },
      { property: "og:title", content: "Habico Property Managers — Elevate the Value of Your Residences" },
      { property: "og:description", content: "Habico Property Managers in Kampala helps landlords maximize ROI through tenant management, rent collection, maintenance, and transparent reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Habico Property Managers — Elevate the Value of Your Residences" },
      { name: "twitter:description", content: "Habico Property Managers in Kampala helps landlords maximize ROI through tenant management, rent collection, maintenance, and transparent reporting." },
      { property: "og:image", content: "https://www.habico.ug/og-image.jpg" },
      { name: "twitter:image", content: "https://www.habico.ug/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.habico.ug" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function AppGate({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();

  const isNative = typeof window !== "undefined" && "Capacitor" in window;
  const onRegisterSubdomain = typeof window !== "undefined" && window.location.hostname === "register.habico.ug";

  useEffect(() => {
    if (isNative && loc.pathname === "/") {
      nav({ to: "/auth" });
    }
  }, []);

  if (onRegisterSubdomain) return <RegisterPage />;

  if (isNative && loc.pathname === "/") return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    setExeDownloadUrl("/Habico%20Portal-Setup-1.1.0.exe");
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AppModeProvider>
        <WorkspaceModeProvider>
        <AuthProvider>
          <AppGate>
            <Outlet />
          </AppGate>
          <Toaster />
        </AuthProvider>
        </WorkspaceModeProvider>
        </AppModeProvider>
    </QueryClientProvider>
  );
}
