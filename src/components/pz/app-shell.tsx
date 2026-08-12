import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Home, Archive, MonitorSmartphone, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/zips", label: "My ZIPs", icon: Archive },
  { to: "/transfer", label: "Transfer", icon: MonitorSmartphone },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="border-border/60 bg-surface/80 fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-8px_32px_-16px_var(--border)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="pressable group relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl"
            >
              <span
                className={cn(
                  "grid h-8 w-14 place-items-center rounded-full transition-all duration-200",
                  active
                    ? "bg-brand/12 text-brand inner-line shadow-[0_2px_12px_-4px_var(--brand)]"
                    : "text-muted-foreground",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
              </span>
              <span
                className={cn(
                  "text-[10.5px] font-semibold tracking-tight transition-colors",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function StickyActionBar({
  children,
  withNav = true,
}: {
  children: ReactNode;
  withNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "from-background via-background/95 fixed inset-x-0 z-30 bg-gradient-to-t to-transparent px-5 pt-6",
        withNav ? "bottom-[72px] pb-3" : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  back,
  headerRight,
  children,
  showNav = true,
  hasActionBar = false,
  hero,
}: {
  title?: string;
  subtitle?: string;
  back?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  showNav?: boolean;
  hasActionBar?: boolean;
  hero?: ReactNode;
}) {
  const bottomPad =
    (showNav ? 84 : 16) + (hasActionBar ? 84 : 0) + 16; // nav + sticky CTA + breathing room

  return (
    <div className="bg-background relative min-h-[100dvh]">
      {/* Subtle blue ambient light behind the top of every screen */}
      <div
        aria-hidden
        className="ambient-hero pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      />
      <header className="bg-background/80 border-border/40 sticky top-0 z-30 border-b backdrop-blur-2xl">
        <div className="mx-auto max-w-md px-5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3">
          {hero ?? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {back && (
                  <Link
                    to={back}
                    className="border-border/70 bg-surface pressable text-foreground grid h-10 w-10 shrink-0 place-items-center rounded-full border"
                    aria-label="Back"
                  >
                    <ChevronLeft size={20} strokeWidth={2} />
                  </Link>
                )}
                <div className="min-w-0">
                  <h1 className="truncate text-[22px] leading-tight font-extrabold">{title}</h1>
                  {subtitle && (
                    <p className="text-muted-foreground truncate text-[12.5px] font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {headerRight}
            </div>
          )}
        </div>
      </header>

      <main
        className="pz-scroll relative mx-auto max-w-md px-5"
        style={{ paddingBottom: `calc(${bottomPad}px + env(safe-area-inset-bottom))` }}
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-muted-foreground mt-7 mb-2.5 px-1 text-[11px] font-bold tracking-[0.09em] uppercase">
      {children}
    </h2>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("card-surface overflow-hidden rounded-3xl", className)}>{children}</div>
  );
}

export function Row({
  icon,
  title,
  description,
  right,
  onClick,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "border-border/60 flex min-h-[56px] w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0",
        onClick && "pressable active:bg-muted/60",
        className,
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold">{title}</div>
        {description && (
          <div className="text-muted-foreground truncate text-[12.5px] font-medium">
            {description}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </Comp>
  );
}
