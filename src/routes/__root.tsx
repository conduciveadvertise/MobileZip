import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-foreground text-6xl font-extrabold">404</h1>
        <h2 className="text-foreground mt-3 text-lg font-bold">Screen not found</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          That page doesn't exist in PhoneZip.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="gradient-brand elevation-brand text-primary-foreground inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-bold"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-foreground text-xl font-bold tracking-tight">This screen didn't load</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Something went wrong. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="gradient-brand text-primary-foreground inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-bold"
          >
            Try again
          </button>
          <Link
            to="/"
            className="border-border bg-surface text-foreground inline-flex h-12 items-center justify-center rounded-2xl border px-6 text-sm font-bold"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { title: "PhoneZip — Zip. Transfer. Done." },
      {
        name: "description",
        content:
          "PhoneZip compresses your phone files into ZIPs and transfers them to your PC over your local Wi-Fi network.",
      },
      { name: "theme-color", content: "#0a63f5" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
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
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        {/* Keyed wrapper gives every screen a fast fade + slight rise on navigation. */}
        <div key={pathname} className="animate-page">
          <Outlet />
        </div>
        <Toaster position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
