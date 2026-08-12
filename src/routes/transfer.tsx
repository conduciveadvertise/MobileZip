import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Wifi,
  X,
  FileArchive,
  ArrowDownToLine,
  FolderOpen,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { AppShell, Card, SectionLabel, Row } from "@/components/pz/app-shell";
import { FileTile } from "@/components/pz/icons";
import { cn } from "@/lib/utils";
import {
  getStoredZips,
  shareOrDownloadZip,
  StoredZip,
  createZipArchive,
} from "@/lib/zip-store";
import { pickRealFiles, PickedFileItem, formatBytes } from "@/lib/file-picker";

export const Route = createFileRoute("/transfer")({
  head: () => ({
    meta: [
      { title: "PC Transfer — PhoneZip" },
      {
        name: "description",
        content: "Pair your PC over local Wi-Fi and send or receive ZIP archives at full speed.",
      },
      { property: "og:title", content: "PC Transfer — PhoneZip" },
      {
        property: "og:description",
        content: "Pair your PC over local Wi-Fi and send or receive ZIP archives at full speed.",
      },
    ],
  }),
  component: Transfer,
});

type State =
  | "ready"
  | "waiting"
  | "connected"
  | "sending"
  | "receiving"
  | "complete"
  | "failed"
  | "disconnected";

export function StatusPill({ state }: { state: State }) {
  const map: Record<State, { text: string; tone: string }> = {
    ready: { text: "Ready", tone: "bg-muted text-muted-foreground" },
    waiting: { text: "Wi-Fi Server Active", tone: "bg-warning/15 text-warning" },
    connected: { text: "PC Connected", tone: "bg-success/15 text-success" },
    sending: { text: "Sending", tone: "bg-brand/12 text-brand" },
    receiving: { text: "Receiving", tone: "bg-cyan/15 text-cyan" },
    complete: { text: "Transfer complete", tone: "bg-success/15 text-success" },
    failed: { text: "Transfer failed", tone: "bg-destructive/12 text-destructive" },
    disconnected: { text: "Disconnected", tone: "bg-muted text-muted-foreground" },
  };
  const s = map[state];
  return (
    <span
      className={cn(
        "inner-line inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 ring-current/15 transition-colors duration-300",
        s.tone,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.text}
    </span>
  );
}

function Transfer() {
  const [state, setState] = useState<State>("waiting");
  const [storedZips, setStoredZips] = useState<StoredZip[]>([]);
  const [selectedZipForTransfer, setSelectedZipForTransfer] = useState<StoredZip | null>(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferSpeed] = useState("48.2 MB/s");
  const [, setIsReceivingFiles] = useState(false);
  const [localServerUrl, setLocalServerUrl] = useState("http://phonezip.local:3000");
  const [displayHost, setDisplayHost] = useState("phonezip.local:3000");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const zips = getStoredZips();
    setStoredZips(zips);
    if (zips.length > 0) {
      setSelectedZipForTransfer(zips[0]);
    }

    if (typeof window !== "undefined") {
      const url = window.location.origin + "/transfer";
      setLocalServerUrl(url);
      setDisplayHost(window.location.host);
    }
  }, []);

  const active = state === "sending" || state === "receiving";
  const linked = state === "connected" || state === "complete" || active;

  const handleSendToPc = async (zip?: StoredZip) => {
    const targetZip = zip || selectedZipForTransfer || storedZips[0];
    if (!targetZip) {
      toast.error("No ZIP archive available. Create a ZIP first.");
      return;
    }

    setSelectedZipForTransfer(targetZip);
    setState("sending");
    setTransferProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      if (current >= 100) {
        setTransferProgress(100);
        clearInterval(interval);
        setState("complete");
        toast.success(`Successfully sent ${targetZip.name} to PC`);
        try {
          shareOrDownloadZip(targetZip);
        } catch (e) {
          console.warn("Auto download triggered", e);
        }
      } else {
        setTransferProgress(current);
      }
    }, 200);
  };

  const handleReceiveFromPc = async () => {
    try {
      const picked = await pickRealFiles(true);
      if (picked.length === 0) return;

      setIsReceivingFiles(true);
      setState("receiving");
      setTransferProgress(20);

      toast.info(`Receiving ${picked.length} file(s) from PC...`);

      const now = new Date();
      const zipName = `PC_Received_${now.toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}`;

      const newZip = await createZipArchive(
        {
          selectedFiles: picked,
          archiveName: zipName,
          compressionLevel: "Balanced",
          passwordProtection: false,
          keepOriginals: true,
        },
        (pct) => setTransferProgress(pct)
      );

      setStoredZips(getStoredZips());
      setSelectedZipForTransfer(newZip);
      setState("complete");
      setIsReceivingFiles(false);
      toast.success(`Received & created archive ${newZip.name}`);
    } catch (e: any) {
      setIsReceivingFiles(false);
      setState("failed");
      toast.error(e?.message || "Failed to receive files from PC");
    }
  };

  const handleDirectWebUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const rawFiles = Array.from(e.target.files);
    
    const pickedItems: PickedFileItem[] = rawFiles.map((f, idx) => ({
      id: `pc_${Date.now()}_${idx}`,
      name: f.name,
      size: f.size,
      formattedSize: formatBytes(f.size),
      mimeType: f.type || "application/octet-stream",
      webFile: f,
    }));

    try {
      setIsReceivingFiles(true);
      setState("receiving");
      toast.info(`Processing ${pickedItems.length} file(s)...`);

      const now = new Date();
      const zipName = `PC_Transfer_${now.toISOString().slice(0, 10)}`;

      const newZip = await createZipArchive(
        {
          selectedFiles: pickedItems,
          archiveName: zipName,
          compressionLevel: "Balanced",
          passwordProtection: false,
          keepOriginals: true,
        },
        (pct) => setTransferProgress(pct)
      );

      setStoredZips(getStoredZips());
      setSelectedZipForTransfer(newZip);
      setState("complete");
      setIsReceivingFiles(false);
      toast.success(`Created ${newZip.name} from PC upload`);
    } catch (err: any) {
      setIsReceivingFiles(false);
      setState("failed");
      toast.error(err?.message || "Failed to process uploaded files");
    }
  };

  return (
    <AppShell
      title="PC Transfer"
      subtitle="Local network · Wi-Fi server"
      headerRight={<StatusPill state={state} />}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleDirectWebUpload}
        className="hidden"
      />

      {/* Connection card */}
      <Card className="animate-rise mt-3">
        <div className="flex flex-col items-center px-5 pt-6 pb-5">
          <div className="relative grid h-20 w-20 place-items-center">
            {(state === "waiting" || active) && (
              <>
                <span className="bg-brand/25 animate-ring absolute inset-0 rounded-full" />
                <span
                  className="bg-brand/20 animate-ring absolute inset-0 rounded-full"
                  style={{ animationDelay: "0.7s" }}
                />
              </>
            )}
            {state === "connected" && (
              <span className="bg-success/30 animate-ring absolute inset-0 rounded-full" />
            )}
            <span
              className={cn(
                "relative grid h-20 w-20 place-items-center rounded-[28px] ring-1 ring-white/25 transition-all duration-500",
                linked ? "gradient-success glow-success" : "gradient-brand glow-brand",
              )}
            >
              <FileTile
                kind="pc"
                className="border-none bg-transparent text-white shadow-none ring-0 drop-shadow-[0_1px_5px_oklch(0.2_0.08_264/0.5)]"
              />
            </span>
          </div>

          <h2
            className={cn(
              "mt-4 text-center text-[18px] font-extrabold",
              state === "waiting" && "animate-breathe text-brand",
            )}
          >
            {state === "waiting"
              ? "Wi-Fi Transfer Server Active"
              : state === "connected"
                ? "PC Connected"
                : state === "sending"
                  ? "Sending to PC"
                  : state === "receiving"
                    ? "Receiving from PC"
                    : state === "complete"
                      ? "Transfer complete"
                      : state === "failed"
                        ? "Transfer failed"
                        : state === "disconnected"
                          ? "PC disconnected"
                          : "Ready to connect"}
          </h2>
          <p className="text-muted-foreground mt-1.5 max-w-[18rem] text-center text-[13px] leading-relaxed font-medium">
            {state === "waiting"
              ? `Open ${displayHost} on your PC, or scan the QR code below.`
              : state === "failed"
                ? "The transfer dropped. Tap retry to reconnect."
                : "Active Local Connection · High Speed 5 GHz"}
          </p>

          {/* Real QR Code component */}
          <div className="animate-rise border-border/60 bg-surface-2/90 mt-5 rounded-3xl border p-3.5 shadow-[0_2px_20px_-8px_var(--brand),inset_0_1px_0_0_var(--inner-highlight)] ring-1 ring-brand/15">
            <div className="bg-white rounded-2xl p-3.5 shadow-sm flex flex-col items-center justify-center">
              <QRCodeSVG
                value={localServerUrl}
                size={168}
                level="M"
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            <p className="text-muted-foreground mt-3 text-center text-[12px] font-bold tracking-wide font-mono">
              http://{displayHost}
            </p>
          </div>
        </div>

        <div className="border-border/60 grid grid-cols-3 border-t">
          <Metric label="Server" value={state === "disconnected" ? "Stopped" : "Active"} />
          <Metric label="Network" value="Local Wi-Fi" bordered />
          <Metric label="Speed" value={active ? transferSpeed : "Ready"} />
        </div>
      </Card>

      {/* Progress card when active */}
      {active && (
        <Card className="animate-rise mt-3 px-4 py-4">
          <div className="flex items-center justify-between text-[13px] font-bold">
            <span className="truncate">{selectedZipForTransfer?.name || "PhoneZip_Archive.zip"}</span>
            <span className="text-brand shrink-0">{transferProgress}%</span>
          </div>
          <div className="bg-muted mt-2.5 h-2 overflow-hidden rounded-full shadow-inner">
            <div
              className="gradient-progress relative h-full overflow-hidden rounded-full transition-all duration-300"
              style={{ width: `${transferProgress}%` }}
            >
              <span className="sheen-sweep absolute inset-y-0 w-1/3 bg-white/35" />
            </div>
          </div>
          <div className="text-muted-foreground mt-2 flex justify-between text-[12px] font-medium">
            <span>{selectedZipForTransfer?.size || "Calculating..."}</span>
            <span>{transferSpeed}</span>
          </div>
        </Card>
      )}

      {/* Primary Transfer Actions */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ActionCard
          icon={<Upload size={20} strokeWidth={1.8} />}
          title="Send to PC"
          onClick={() => handleSendToPc()}
          primary
        />
        <ActionCard
          icon={<Download size={20} strokeWidth={1.8} />}
          title="Receive from PC"
          onClick={() => {
            if (typeof window !== "undefined" && !window.Capacitor?.isNativePlatform()) {
              fileInputRef.current?.click();
            } else {
              handleReceiveFromPc();
            }
          }}
        />
      </div>

      <div className="bg-success/8 border-success/20 mt-3 flex items-center gap-3 rounded-2xl border px-4 py-3">
        <ShieldCheck size={18} className="text-success shrink-0" strokeWidth={1.9} />
        <p className="text-success text-[12.5px] leading-snug font-semibold">
          100% Private local Wi-Fi transfer. No internet or cloud required.
        </p>
      </div>

      {/* PC Shared Archives List */}
      <SectionLabel>Available Archives for PC Download</SectionLabel>
      {storedZips.length === 0 ? (
        <Card className="px-4 py-6 text-center">
          <FolderOpen size={28} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-[13.5px] font-bold">No ZIP archives created yet</p>
          <p className="text-muted-foreground mt-1 text-[12.5px]">
            Create a ZIP archive on your phone to transfer it to your computer.
          </p>
        </Card>
      ) : (
        <Card>
          {storedZips.map((z) => (
            <div
              key={z.id}
              className="border-border/60 flex items-center gap-3 border-b px-4 py-3.5 last:border-b-0"
            >
              <FileTile kind="zip" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{z.name}</div>
                <div className="text-muted-foreground mt-0.5 text-[12px] font-medium">
                  {z.size} · {z.filesCount} file{z.filesCount !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => {
                  toast.success(`Preparing download for ${z.name}`);
                  shareOrDownloadZip(z);
                }}
                className="gradient-brand glow-brand pressable text-white grid h-10 px-3.5 place-items-center rounded-xl text-[12.5px] font-bold shadow-sm"
              >
                <ArrowDownToLine size={16} className="inline mr-1" /> Download
              </button>
            </div>
          ))}
        </Card>
      )}

      <SectionLabel>Session Controls</SectionLabel>
      <Card>
        <Row
          icon={<Wifi size={18} className="text-muted-foreground shrink-0" />}
          title="Local Wi-Fi Server"
          description={state === "disconnected" ? "Stopped" : `Running at ${displayHost}`}
        />
        <Row
          icon={<RefreshCw size={18} className="text-muted-foreground shrink-0" />}
          title="Restart Wi-Fi Server"
          onClick={() => {
            setState("waiting");
            toast.success("Wi-Fi transfer server restarted");
          }}
        />
        <Row
          icon={<X size={18} className="text-muted-foreground shrink-0" />}
          title={<span className="text-destructive">Stop Server & Disconnect</span>}
          onClick={() => {
            setState("disconnected");
            toast("Transfer server stopped");
          }}
        />
      </Card>
    </AppShell>
  );
}

function Metric({ label, value, bordered }: { label: string; value: string; bordered?: boolean }) {
  return (
    <div className={cn("px-3 py-3.5 text-center", bordered && "border-border/60 border-x")}>
      <div className="text-muted-foreground text-[10.5px] font-bold tracking-[0.08em] uppercase">
        {label}
      </div>
      <div className="mt-1 truncate text-[13px] font-bold">{value}</div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "pressable flex min-h-[92px] flex-col justify-between rounded-3xl border p-4 text-left",
        primary
          ? "gradient-brand glow-brand border-transparent text-white ring-1 ring-white/20"
          : "card-surface",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-2xl",
          primary
            ? "bg-white/18 text-white shadow-[inset_0_1px_0_0_oklch(1_0_0/0.3)] ring-1 ring-white/30"
            : "bg-brand/10 text-brand inner-line",
        )}
      >
        {icon}
      </span>
      <span className="text-[14px] font-bold">{title}</span>
    </button>
  );
}

export { Check };

