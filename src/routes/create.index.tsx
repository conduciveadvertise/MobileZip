import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, FolderPlus, Trash2, Check, FileUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card, StickyActionBar } from "@/components/pz/app-shell";
import { FileTile, extToKind } from "@/components/pz/icons";
import { cn } from "@/lib/utils";
import { pickRealFiles, pickRealFolder, PickedFileItem, formatBytes } from "@/lib/file-picker";
import {
  getPendingFiles,
  addPendingFiles,
  removePendingFile,
  clearPendingFiles,
  setPendingFiles,
} from "@/lib/zip-store";

export const Route = createFileRoute("/create/")({
  head: () => ({
    meta: [
      { title: "Select files — Create ZIP | PhoneZip" },
      { name: "description", content: "Pick real files and folders to compress into a ZIP archive." },
      { property: "og:title", content: "Select files — Create ZIP | PhoneZip" },
      { property: "og:description", content: "Pick real files and folders to compress into a ZIP archive." },
    ],
  }),
  component: SelectFiles,
});

function SelectFiles() {
  const navigate = useNavigate();
  const [files, setFilesState] = useState<PickedFileItem[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    // Load initial pending files from store
    const existing = getPendingFiles();
    setFilesState(existing);
  }, []);

  const handlePickFiles = async () => {
    try {
      const newFiles = await pickRealFiles(true);
      if (newFiles.length > 0) {
        addPendingFiles(newFiles);
        setFilesState(getPendingFiles());
        toast.success(`Added ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}`);
      }
    } catch (e: any) {
      toast.error("File selection failed: " + (e?.message || e));
    }
  };

  const handlePickFolder = async () => {
    try {
      const res = await pickRealFolder();
      if (res.files.length > 0) {
        addPendingFiles(res.files);
        setFilesState(getPendingFiles());
        toast.success(`Added folder "${res.folderName}" (${res.files.length} files)`);
      }
    } catch (e: any) {
      toast.error("Folder selection failed: " + (e?.message || e));
    }
  };

  const handleRemove = (id: string) => {
    removePendingFile(id);
    setFilesState(getPendingFiles());
  };

  const handleClearAll = () => {
    clearPendingFiles();
    setFilesState([]);
    toast("Cleared file selection");
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedTotal = formatBytes(totalBytes);

  const filteredFiles = files.filter((f) => {
    if (filter === "All") return true;
    const kind = extToKind(f.name);
    if (filter === "Photos") return kind === "image";
    if (filter === "Videos") return kind === "video";
    if (filter === "Documents") return kind === "document" || kind === "pdf";
    if (filter === "Audio") return kind === "audio";
    if (filter === "APKs") return kind === "apk";
    return true;
  });

  return (
    <AppShell
      title="Select files"
      subtitle={`${files.length} file${files.length !== 1 ? "s" : ""} selected · ${formattedTotal}`}
      back="/"
      hasActionBar
      showNav={false}
    >
      {/* Picker Action Buttons */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <button
          onClick={handlePickFiles}
          className="gradient-brand glow-brand pressable flex h-13 min-h-[52px] items-center justify-center gap-2 rounded-2xl text-[14px] font-bold text-white shadow-sm ring-1 ring-white/20 ring-inset"
        >
          <Plus size={18} strokeWidth={2.4} /> Select Files
        </button>
        <button
          onClick={handlePickFolder}
          className="bg-surface border-border/70 elevation-1 pressable flex h-13 min-h-[52px] items-center justify-center gap-2 rounded-2xl border text-[14px] font-bold"
        >
          <FolderPlus size={18} strokeWidth={2} className="text-brand" /> Select Folder
        </button>
      </div>

      {files.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between px-1">
            <span className="text-muted-foreground text-[12px] font-bold tracking-wider uppercase">
              Filter Selected ({filteredFiles.length})
            </span>
            <button
              onClick={handleClearAll}
              className="text-destructive hover:bg-destructive/10 pressable flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-bold"
            >
              <Trash2 size={13} /> Clear all
            </button>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["All", "Photos", "Videos", "Documents", "Audio", "APKs"].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "flex h-8 shrink-0 items-center rounded-full border px-3 text-[12px] font-bold transition-all duration-200",
                  filter === c
                    ? "segment-active"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <Card className="mt-3">
            {filteredFiles.map((f) => (
              <div
                key={f.id}
                className="border-border/60 flex min-h-[60px] items-center gap-3 border-b px-4 py-2.5 transition-colors last:border-b-0"
              >
                <FileTile kind={extToKind(f.name)} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">{f.name}</span>
                  <span className="text-muted-foreground mt-0.5 block truncate text-[11.5px] font-medium">
                    {f.formattedSize} {f.mimeType ? `· ${f.mimeType}` : ""}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(f.id)}
                  aria-label={`Remove ${f.name}`}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 pressable grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Card>
        </>
      )}

      {files.length === 0 && (
        <div className="animate-rise mt-10 flex flex-col items-center px-6 text-center">
          <span className="bg-brand/10 text-brand grid h-20 w-20 place-items-center rounded-[28px]">
            <FileUp size={36} strokeWidth={1.8} />
          </span>
          <h3 className="mt-5 text-[17px] font-extrabold">No files selected</h3>
          <p className="text-muted-foreground mt-1.5 max-w-[17rem] text-[13.5px] leading-relaxed font-medium">
            Tap "Select Files" or "Select Folder" above to choose real files from your Android phone storage.
          </p>
        </div>
      )}

      <StickyActionBar withNav={false}>
        <button
          disabled={files.length === 0}
          onClick={() => navigate({ to: "/create/settings" })}
          className={cn(
            "gradient-brand glow-brand pressable flex h-14 w-full items-center justify-center rounded-2xl text-[15px] font-extrabold text-white ring-1 ring-white/20 ring-inset transition-opacity",
            files.length === 0 ? "pointer-events-none opacity-50" : "opacity-100",
          )}
        >
          Continue · {files.length} file{files.length !== 1 ? "s" : ""} ({formattedTotal})
        </button>
      </StickyActionBar>
    </AppShell>
  );
}

