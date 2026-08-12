import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, ChevronRight, Plus, Settings } from "lucide-react";
import { AppShell, Card, SectionLabel } from "@/components/pz/app-shell";
import { PhoneZipWordmark } from "@/components/pz/logo";
import { FileTile, PzGlyph } from "@/components/pz/icons";
import { getStoredZips, StoredZip } from "@/lib/zip-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhoneZip — Zip. Transfer. Done." },
      {
        name: "description",
        content:
          "Compress phone files into ZIP archives and send them to your PC over local Wi-Fi. Fast, private, offline.",
      },
      { property: "og:title", content: "PhoneZip — Zip. Transfer. Done." },
      {
        property: "og:description",
        content: "Compress phone files into ZIP archives and send them to your PC over local Wi-Fi.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [recentZips, setRecentZips] = useState<StoredZip[]>([]);

  useEffect(() => {
    setRecentZips(getStoredZips());
  }, []);

  return (
    <AppShell
      hero={
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <PhoneZipWordmark />
          <Link
            to="/settings"
            aria-label="Settings"
            className="border-border/60 bg-surface pressable inner-line text-muted-foreground grid h-10 w-10 shrink-0 place-items-center rounded-full border shadow-sm"
          >
            <Settings size={19} strokeWidth={1.8} />
          </Link>
        </div>
      }
    >
      <p className="text-muted-foreground animate-rise mt-2 px-1 text-[15px] leading-snug font-medium">
        Your files. Compressed. Ready to go.
      </p>

      {/* Primary action */}
      <div className="relative mt-4">
        <span
          aria-hidden
          className="bg-brand/25 pointer-events-none absolute -inset-3 rounded-[36px] blur-2xl"
        />
        <span
          aria-hidden
          className="bg-cyan/20 pointer-events-none absolute -inset-x-1 -bottom-4 h-16 rounded-full blur-2xl"
        />
        <Link
          to="/create"
          className="gradient-brand-alive glow-brand pressable animate-rise relative block overflow-hidden rounded-[28px] p-5 ring-1 ring-white/20 ring-inset"
        >
          <span
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "var(--gradient-sheen)" }}
          />
          <span className="absolute -right-8 -bottom-10 opacity-[0.13]">
            <PzGlyph kind="zip" size={150} className="text-white" />
          </span>
          <span className="relative flex items-start gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/18 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.35),0_4px_14px_-6px_oklch(0.2_0.1_264/0.6)] ring-1 ring-white/30">
              <PzGlyph kind="zip" size={24} className="text-white drop-shadow-[0_1px_4px_oklch(0.25_0.12_264/0.55)]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[19px] leading-tight font-extrabold text-white drop-shadow-[0_1px_6px_oklch(0.25_0.12_264/0.4)]">
                Create ZIP
              </span>
              <span className="mt-1 block text-[13px] leading-snug font-medium text-white/85">
                Select real files or folders and compress them
              </span>
            </span>
          </span>
          <span className="relative mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/16 text-[14px] font-bold text-white shadow-[inset_0_1px_0_0_oklch(1_0_0/0.3)] ring-1 ring-white/30 backdrop-blur-sm transition-colors duration-200 hover:bg-white/22">
            <Plus size={17} strokeWidth={2.4} /> Start compressing
          </span>
        </Link>
      </div>

      {/* Secondary actions */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SecondaryTile
          to="/transfer"
          kind="pc"
          title="PC Transfer"
          meta="Local Wi-Fi"
        />
        <SecondaryTile
          to="/zips"
          kind="folder"
          title="My ZIPs"
          meta={`${recentZips.length} archive${recentZips.length !== 1 ? "s" : ""}`}
        />
      </div>

      <div className="mt-7 mb-2.5 flex items-baseline justify-between px-1">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-[0.09em] uppercase">
          Recent ZIPs
        </h2>
        <Link to="/zips" className="text-brand flex items-center gap-0.5 text-[12.5px] font-bold">
          See all <ArrowRight size={13} strokeWidth={2.4} />
        </Link>
      </div>

      <Card>
        {recentZips.length === 0 ? (
          <div className="px-4 py-5 text-center text-[13.5px] font-medium text-muted-foreground">
            No ZIPs created yet. Tap "Create ZIP" above to get started.
          </div>
        ) : (
          recentZips.slice(0, 3).map((z) => (
            <Link
              key={z.id}
              to="/zips"
              className="group border-border/60 pressable active:bg-muted/60 flex min-h-[64px] items-center gap-3 border-b px-4 py-3 last:border-b-0"
            >
              <FileTile kind="zip" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-bold">{z.name}</div>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[12px] font-medium">
                  <span>{z.size}</span>
                  <span className="bg-muted-foreground/40 h-1 w-1 rounded-full" />
                  <span>{z.filesCount} file{z.filesCount !== 1 ? "s" : ""}</span>
                  <span className="bg-muted-foreground/40 h-1 w-1 rounded-full" />
                  <span className="truncate">{z.date}</span>
                </div>
              </div>
              <ChevronRight
                size={17}
                className="text-muted-foreground shrink-0 transition-transform duration-200 group-active:translate-x-0.5"
              />
            </Link>
          ))
        )}
      </Card>

      <SectionLabel>Tip</SectionLabel>
      <Card className="px-4 py-3.5">
        <p className="text-muted-foreground text-[13px] leading-relaxed font-medium">
          PhoneZip works 100% offline. Transfers run entirely over your local Wi-Fi network.
        </p>
      </Card>
    </AppShell>
  );
}

function SecondaryTile({
  to,
  kind,
  title,
  meta,
}: {
  to: "/transfer" | "/zips";
  kind: "pc" | "folder";
  title: string;
  meta: string;
}) {
  return (
    <Link
      to={to}
      className="card-surface pressable active:bg-muted/50 flex flex-col gap-3 rounded-3xl p-4"
    >
      <FileTile kind={kind} />
      <span className="min-w-0">
        <span className="block truncate text-[14.5px] font-bold">{title}</span>
        <span className="text-muted-foreground block truncate text-[12px] font-medium">{meta}</span>
      </span>
    </Link>
  );
}

