import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, Card, SectionLabel, Row, StickyActionBar } from "@/components/pz/app-shell";
import { FileTile, extToKind } from "@/components/pz/icons";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/file-picker";
import {
  getZipCreationSettings,
  updateZipCreationSettings,
  CompressionLevel,
} from "@/lib/zip-store";

export const Route = createFileRoute("/create/settings")({
  head: () => ({
    meta: [
      { title: "ZIP settings — Create ZIP | PhoneZip" },
      { name: "description", content: "Name your archive, choose compression level, password protection and destination folder." },
      { property: "og:title", content: "ZIP settings — Create ZIP | PhoneZip" },
      { property: "og:description", content: "Choose compression level, password protection and destination folder." },
    ],
  }),
  component: ZipSettings,
});

function ZipSettings() {
  const navigate = useNavigate();
  const current = getZipCreationSettings();

  const [name, setName] = useState(
    current.archiveName || "Archive_" + new Date().toISOString().slice(0, 10)
  );
  const [level, setLevel] = useState<CompressionLevel>(current.compressionLevel || "Balanced");
  const [password, setPassword] = useState(current.passwordProtection || false);
  const [keepOriginals, setKeepOriginals] = useState(current.keepOriginals !== false);

  const files = current.selectedFiles || [];
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedTotal = formatBytes(totalBytes);

  const handleCreateZip = () => {
    updateZipCreationSettings({
      archiveName: name.trim() || "Archive",
      compressionLevel: level,
      passwordProtection: password,
      keepOriginals: keepOriginals,
    });
    navigate({ to: "/create/progress" });
  };

  return (
    <AppShell
      title="ZIP settings"
      subtitle={`${files.length} file${files.length !== 1 ? "s" : ""} · ${formattedTotal}`}
      back="/create"
      hasActionBar
      showNav={false}
    >
      <SectionLabel>Archive name</SectionLabel>
      <Card className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Archive name"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-bold outline-none"
          />
          <span className="text-muted-foreground shrink-0 text-[14px] font-semibold">.zip</span>
        </div>
      </Card>

      <SectionLabel>Compression</SectionLabel>
      <Card className="p-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {(["Fast", "Balanced", "Smallest"] as CompressionLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                "pressable min-h-[52px] rounded-2xl border text-[13px] font-bold transition-all duration-200",
                level === l
                  ? "segment-active"
                  : "text-muted-foreground border-transparent",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </Card>

      <SectionLabel>Options</SectionLabel>
      <Card>
        <Row title="Destination" description="Internal storage / Documents / PhoneZip" onClick={() => {}} />
        <Row
          title="Password protection"
          description="AES-256 encryption (Standard ZIP)"
          right={<Switch checked={password} onCheckedChange={setPassword} />}
        />
        <Row
          title="Keep original files"
          description="Originals stay on device"
          right={<Switch checked={keepOriginals} onCheckedChange={setKeepOriginals} />}
        />
      </Card>

      <SectionLabel>Selected files ({files.length})</SectionLabel>
      <Card>
        {files.length === 0 ? (
          <div className="px-4 py-4 text-center text-[13.5px] font-medium text-muted-foreground">
            No files selected. Return to previous step to select files.
          </div>
        ) : (
          files.map((f) => (
            <div
              key={f.id}
              className="border-border/60 flex min-h-[56px] items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
            >
              <FileTile kind={extToKind(f.name)} size="sm" />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{f.name}</span>
                <span className="block text-[11.5px] font-medium text-muted-foreground">
                  {f.formattedSize}
                </span>
              </div>
            </div>
          ))
        )}
      </Card>

      <StickyActionBar withNav={false}>
        <button
          disabled={files.length === 0}
          onClick={handleCreateZip}
          className={cn(
            "gradient-brand glow-brand pressable flex h-14 w-full items-center justify-center rounded-2xl text-[15px] font-extrabold text-white ring-1 ring-white/20 ring-inset transition-opacity",
            files.length === 0 ? "pointer-events-none opacity-50" : "opacity-100"
          )}
        >
          Create ZIP
        </button>
      </StickyActionBar>
    </AppShell>
  );
}

