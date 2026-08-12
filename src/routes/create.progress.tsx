import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/pz/app-shell";
import {
  getZipCreationSettings,
  createZipArchive,
  StoredZip,
} from "@/lib/zip-store";
import { formatBytes } from "@/lib/file-picker";

export const Route = createFileRoute("/create/progress")({
  head: () => ({
    meta: [
      { title: "Creating ZIP — PhoneZip" },
      { name: "description", content: "Live progress while PhoneZip compresses your selected files into a ZIP archive." },
      { property: "og:title", content: "Creating ZIP — PhoneZip" },
      { property: "og:description", content: "Live progress while PhoneZip compresses your files." },
    ],
  }),
  component: Progress,
});

function Progress() {
  const navigate = useNavigate();
  const settings = getZipCreationSettings();
  const [pct, setPct] = useState(0);
  const [currentFilename, setCurrentFilename] = useState("Initializing...");
  const cancelSignalRef = useRef({ cancelled: false });
  const isCreatingRef = useRef(false);

  const filesCount = settings.selectedFiles.length;
  const totalSizeBytes = settings.selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const formattedTotalSize = formatBytes(totalSizeBytes);

  useEffect(() => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;

    if (filesCount === 0) {
      toast.error("No files selected to compress.");
      navigate({ to: "/create" });
      return;
    }

    cancelSignalRef.current.cancelled = false;

    createZipArchive(
      settings,
      (progressPct, filename) => {
        setPct(progressPct);
        setCurrentFilename(filename);
      },
      cancelSignalRef.current
    )
      .then((createdZip: StoredZip) => {
        if (!cancelSignalRef.current.cancelled) {
          setTimeout(() => {
            navigate({ to: "/create/done" });
          }, 400);
        }
      })
      .catch((err) => {
        if (cancelSignalRef.current.cancelled) {
          toast("ZIP creation cancelled");
        } else {
          toast.error("Error creating ZIP: " + (err?.message || err));
        }
        navigate({ to: "/create" });
      });
  }, [navigate]);

  const handleCancel = () => {
    cancelSignalRef.current.cancelled = true;
    toast("Cancelling ZIP creation...");
    navigate({ to: "/create" });
  };

  const R = 78;
  const C = 2 * Math.PI * R;

  return (
    <AppShell title="Creating ZIP" back="/create/settings" showNav={false} hasActionBar>
      <div className="mt-8 flex flex-col items-center">
        <div className="relative grid h-[196px] w-[196px] place-items-center">
          <svg viewBox="0 0 196 196" className="absolute inset-0 -rotate-90">
            <defs>
              <linearGradient id="pzGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--brand-strong)" />
                <stop offset="100%" stopColor="var(--cyan)" />
              </linearGradient>
            </defs>
            <circle cx="98" cy="98" r={R} fill="none" stroke="var(--muted)" strokeWidth="12" />
            <circle
              cx="98"
              cy="98"
              r={R}
              fill="none"
              stroke="url(#pzGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C - (pct / 100) * C}
              style={{ transition: "stroke-dashoffset 200ms linear" }}
            />
          </svg>
          <div className="text-center">
            <div className="text-[42px] leading-none font-extrabold tracking-tight">{pct}%</div>
            <div className="text-muted-foreground mt-1.5 text-[12px] font-bold tracking-wide uppercase">
              Compressing
            </div>
          </div>
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold">Creating your ZIP</h2>
        <p className="text-muted-foreground mt-1 max-w-[16rem] truncate text-[13px] font-medium">
          {settings.archiveName}.zip
        </p>
      </div>

      <Card className="mt-6">
        <Line label="Files" value={`${filesCount} file${filesCount !== 1 ? "s" : ""}`} />
        <Line label="Total size" value={formattedTotalSize} />
        <Line label="Current item" value={currentFilename} />
        <Line label="Level" value={settings.compressionLevel} />
      </Card>

      <div className="mt-4 space-y-2.5">
        <button
          onClick={() => navigate({ to: "/" })}
          className="bg-surface border-border/70 elevation-1 pressable flex h-14 w-full items-center justify-center rounded-2xl border text-[15px] font-bold"
        >
          Run in Background
        </button>
        <button
          onClick={handleCancel}
          className="text-muted-foreground pressable flex h-12 w-full items-center justify-center rounded-2xl text-[14px] font-bold"
        >
          Cancel
        </button>
      </div>
    </AppShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/60 flex min-h-[52px] items-center justify-between border-b px-4 py-3 last:border-b-0">
      <span className="text-muted-foreground shrink-0 text-[13px] font-semibold">{label}</span>
      <span className="ml-2 max-w-[14rem] truncate text-right text-[13.5px] font-bold">{value}</span>
    </div>
  );
}

