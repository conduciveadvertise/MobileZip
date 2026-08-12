import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/pz/app-shell";
import { FileTile } from "@/components/pz/icons";
import { getLastCreatedZip, shareOrDownloadZip } from "@/lib/zip-store";

export const Route = createFileRoute("/create/done")({
  head: () => ({
    meta: [
      { title: "ZIP created — PhoneZip" },
      { name: "description", content: "Your archive is ready. Transfer it to your PC, share it, or open My ZIPs." },
      { property: "og:title", content: "ZIP created — PhoneZip" },
      { property: "og:description", content: "Your archive is ready to transfer or share." },
    ],
  }),
  component: Done,
});

function Done() {
  const zip = getLastCreatedZip();

  const handleShare = async () => {
    if (!zip) return;
    try {
      await shareOrDownloadZip(zip);
      toast.success("Shared / Downloaded " + zip.name);
    } catch (e: any) {
      toast.error(e?.message || "Failed to share ZIP");
    }
  };

  return (
    <AppShell title="ZIP complete" back="/" showNav={false}>
      <div className="mt-10 flex flex-col items-center">
        <div className="relative grid h-24 w-24 place-items-center">
          <span className="bg-success/20 animate-ring absolute inset-0 rounded-full" />
          <span className="gradient-success glow-success animate-pop text-success-foreground relative grid h-24 w-24 place-items-center rounded-full ring-1 ring-white/25">
            <Check size={44} strokeWidth={2.6} className="drop-shadow-[0_1px_4px_oklch(0.25_0.08_160/0.5)]" />
          </span>
        </div>
        <h2 className="animate-rise mt-6 text-[20px] font-extrabold">ZIP created successfully</h2>
        <p className="text-muted-foreground animate-rise mt-1.5 text-[13.5px] font-medium">
          Saved to Internal storage / Documents / PhoneZip
        </p>
      </div>

      <Card className="animate-rise mt-7">
        <div className="flex items-center gap-3.5 px-4 py-4">
          <FileTile kind="zip" size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15.5px] font-extrabold">{zip?.name || "Archive.zip"}</div>
            <div className="text-muted-foreground mt-0.5 text-[12.5px] font-medium">
              {zip?.size || "0 B"} · {zip?.filesCount || 0} file{zip?.filesCount !== 1 ? "s" : ""} · {zip?.date || "Just now"}
            </div>
          </div>
        </div>
      </Card>

      <Link
        to="/transfer"
        className="gradient-brand glow-brand pressable mt-5 flex h-14 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white ring-1 ring-white/20 ring-inset"
      >
        Transfer to PC
      </Link>

      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <button
          onClick={handleShare}
          className="bg-surface border-border/70 elevation-1 pressable flex h-13 min-h-[52px] items-center justify-center gap-2 rounded-2xl border text-[14px] font-bold"
        >
          <Share2 size={17} strokeWidth={1.9} /> Share / Save
        </button>
        <Link
          to="/zips"
          className="bg-surface border-border/70 elevation-1 pressable flex h-13 min-h-[52px] items-center justify-center rounded-2xl border text-[14px] font-bold"
        >
          Open My ZIPs
        </Link>
      </div>
    </AppShell>
  );
}

