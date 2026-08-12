import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  SmartphoneNfc,
  ChevronRight,
  Info,
  FileText,
  ShieldCheck,
  LifeBuoy,
  Star,
} from "lucide-react";
import { AppShell, Card, SectionLabel, Row } from "@/components/pz/app-shell";
import { Switch } from "@/components/ui/switch";
import { useTheme, type Appearance } from "@/lib/theme";
import { PhoneZipLogo } from "@/components/pz/logo";
import { cn } from "@/lib/utils";
import { getStoredZips } from "@/lib/zip-store";
import { formatBytes } from "@/lib/file-picker";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PhoneZip" },
      {
        name: "description",
        content:
          "Control PhoneZip appearance, compression defaults, security, PC transfer, storage and behavior.",
      },
      { property: "og:title", content: "Settings — PhoneZip" },
      {
        property: "og:description",
        content: "Control appearance, compression, security, transfer and storage preferences.",
      },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const { appearance, setAppearance } = useTheme();
  const [toggles, setToggles] = useState({
    askDelete: true,
    password: false,
    autoLock: true,
    requirePin: true,
    autoStop: true,
    confirmDelete: true,
    keepOriginals: true,
    rememberLocation: false,
  });
  type ToggleKey = keyof typeof toggles;
  const set = (k: ToggleKey) => (v: boolean) => setToggles((p) => ({ ...p, [k]: v }));

  return (
    <AppShell title="Settings" subtitle="PhoneZip preferences">
      <SectionLabel>Appearance</SectionLabel>
      <Card className="p-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { key: "light", label: "Light", icon: Sun },
              { key: "dark", label: "Dark", icon: Moon },
              { key: "system", label: "System", icon: SmartphoneNfc },
            ] as { key: Appearance; label: string; icon: typeof Sun }[]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setAppearance(key)}
              className={cn(
                "pressable flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-[12.5px] font-bold transition-all duration-200",
                appearance === key
                  ? "segment-active"
                  : "text-muted-foreground border-transparent",
              )}
            >
              <Icon size={18} strokeWidth={1.9} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <SectionLabel>ZIP</SectionLabel>
      <Card>
        <Row title="Default compression" description="Balanced" right={<Chevron />} onClick={() => {}} />
        <Row
          title="Default ZIP location"
          description="Internal storage / PhoneZip"
          right={<Chevron />}
          onClick={() => {}}
        />
        <Row
          title="Ask before deleting files"
          description="Confirm every removal"
          right={<Switch checked={toggles.askDelete} onCheckedChange={set("askDelete")} />}
        />
      </Card>

      <SectionLabel>Security</SectionLabel>
      <Card>
        <Row
          title="Password protection"
          description="Encrypt new archives with AES-256"
          right={<Switch checked={toggles.password} onCheckedChange={set("password")} />}
        />
        <Row
          title="Auto-lock transfer session"
          description="Lock after 5 minutes idle"
          right={<Switch checked={toggles.autoLock} onCheckedChange={set("autoLock")} />}
        />
      </Card>

      <SectionLabel>PC Transfer</SectionLabel>
      <Card>
        <Row title="Transfer timeout" description="10 minutes" right={<Chevron />} onClick={() => {}} />
        <Row
          title="Require PIN"
          description="Ask for a PIN before pairing"
          right={<Switch checked={toggles.requirePin} onCheckedChange={set("requirePin")} />}
        />
        <Row title="Transfer history" description="Last 30 days" right={<Chevron />} onClick={() => {}} />
        <Row
          title="Auto-stop transfer session"
          description="Close the session when idle"
          right={<Switch checked={toggles.autoStop} onCheckedChange={set("autoStop")} />}
        />
      </Card>

      <SectionLabel>Storage</SectionLabel>
      <Card>
        <Row
          title="Default ZIP folder"
          description="Internal storage / Documents / PhoneZip"
          right={<Chevron />}
          onClick={() => {}}
        />
        <StorageInfoRow />
      </Card>

      <SectionLabel>Behavior</SectionLabel>
      <Card>
        <Row
          title="Confirm before deleting ZIP"
          right={<Switch checked={toggles.confirmDelete} onCheckedChange={set("confirmDelete")} />}
        />
        <Row
          title="Keep original files after ZIP"
          right={<Switch checked={toggles.keepOriginals} onCheckedChange={set("keepOriginals")} />}
        />
        <Row
          title="Remember last selected location"
          right={
            <Switch checked={toggles.rememberLocation} onCheckedChange={set("rememberLocation")} />
          }
        />
      </Card>

      <SectionLabel>About</SectionLabel>
      <Card>
        <Row
          icon={<PhoneZipLogo size={38} />}
          title="PhoneZip"
          description="Version 1.0.0"
          right={<Info size={17} className="text-muted-foreground" />}
        />
        <Row
          icon={<ShieldCheck size={18} className="text-muted-foreground shrink-0" />}
          title="Privacy Policy"
          right={<Chevron />}
          onClick={() => {}}
        />
        <Row
          icon={<FileText size={18} className="text-muted-foreground shrink-0" />}
          title="Terms of Service"
          right={<Chevron />}
          onClick={() => {}}
        />
        <Row
          icon={<LifeBuoy size={18} className="text-muted-foreground shrink-0" />}
          title="Help & Support"
          right={<Chevron />}
          onClick={() => {}}
        />
        <Row
          icon={<Star size={18} className="text-muted-foreground shrink-0" />}
          title="Rate PhoneZip"
          right={<Chevron />}
          onClick={() => {}}
        />
      </Card>

      <div className="mt-10 mb-2 flex flex-col items-center gap-2">
        <PhoneZipLogo size={44} />
        <p className="text-[15px] font-extrabold">PhoneZip</p>
        <p className="text-muted-foreground text-[12.5px] font-medium">Zip. Transfer. Done.</p>
      </div>
    </AppShell>
  );
}

function Chevron() {
  return <ChevronRight size={17} className="text-muted-foreground" />;
}

function StorageInfoRow() {
  const [zipStorageBytes, setZipStorageBytes] = useState(0);
  const [quotaQuotaBytes, setQuotaQuotaBytes] = useState<number | null>(null);
  const [quotaUsageBytes, setQuotaUsageBytes] = useState<number | null>(null);

  useEffect(() => {
    const zips = getStoredZips();
    const totalZipBytes = zips.reduce((acc, z) => acc + (z.sizeBytes || 0), 0);
    setZipStorageBytes(totalZipBytes);

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.quota) setQuotaQuotaBytes(est.quota);
        if (est.usage) setQuotaUsageBytes(est.usage);
      }).catch(() => {});
    }
  }, []);

  const zipStorageFormatted = formatBytes(zipStorageBytes);
  const freeFormatted = quotaQuotaBytes && quotaUsageBytes
    ? formatBytes(quotaQuotaBytes - quotaUsageBytes)
    : "Sufficient free storage";

  return (
    <>
      <div className="border-border/60 border-b px-4 py-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[14.5px] font-semibold">PhoneZip Archives Storage</span>
          <span className="text-muted-foreground text-[12.5px] font-semibold">{zipStorageFormatted} used</span>
        </div>
        <div className="bg-muted mt-2.5 h-2 overflow-hidden rounded-full shadow-inner">
          <div
            className="gradient-progress relative h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(8, (zipStorageBytes / (100 * 1024 * 1024)) * 100))}%` }}
          >
            <span className="sheen-sweep absolute inset-y-0 w-1/3 bg-white/35" />
          </div>
        </div>
      </div>
      <Row title="Available storage" description={freeFormatted} />
    </>
  );
}
