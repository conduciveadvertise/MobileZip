import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MoreVertical, Search, Share2, Pencil, Trash2, MonitorSmartphone, Archive, Download } from "lucide-react";
import { toast } from "sonner";
import { Filesystem } from "@capacitor/filesystem";
import { AppShell, Card } from "@/components/pz/app-shell";
import { FileTile } from "@/components/pz/icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getStoredZips,
  removeZipRecord,
  renameZipRecord,
  shareOrDownloadZip,
  StoredZip,
} from "@/lib/zip-store";
import { formatBytes } from "@/lib/file-picker";

export const Route = createFileRoute("/zips")({
  head: () => ({
    meta: [
      { title: "My ZIPs — PhoneZip" },
      { name: "description", content: "Browse, share, rename and transfer every ZIP archive you created with PhoneZip." },
      { property: "og:title", content: "My ZIPs — PhoneZip" },
      { property: "og:description", content: "Browse, share, rename and transfer your PhoneZip archives." },
    ],
  }),
  component: MyZips,
});

function MyZips() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [zips, setZips] = useState<StoredZip[]>([]);
  const [sheetFor, setSheetFor] = useState<StoredZip | null>(null);
  const [deleteFor, setDeleteFor] = useState<StoredZip | null>(null);
  const [renameFor, setRenameFor] = useState<StoredZip | null>(null);
  const [newNameInput, setNewNameInput] = useState("");

  useEffect(() => {
    setZips(getStoredZips());
  }, []);

  const totalSizeBytes = zips.reduce((acc, z) => acc + (z.sizeBytes || 0), 0);
  const formattedTotal = formatBytes(totalSizeBytes);

  const list = zips.filter((z) => z.name.toLowerCase().includes(query.toLowerCase()));

  const handleShare = async (zip: StoredZip) => {
    setSheetFor(null);
    try {
      await shareOrDownloadZip(zip);
      toast.success("Shared / Downloaded " + zip.name);
    } catch (e: any) {
      toast.error(e?.message || "Failed to share ZIP");
    }
  };

  const handleOpenRename = (zip: StoredZip) => {
    setSheetFor(null);
    setRenameFor(zip);
    setNewNameInput(zip.name.replace(/\.zip$/i, ""));
  };

  const handleSaveRename = () => {
    if (!renameFor || !newNameInput.trim()) return;
    const updated = renameZipRecord(renameFor.id, newNameInput.trim());
    setZips(updated);
    toast.success("Archive renamed");
    setRenameFor(null);
  };

  const handleDelete = async () => {
    if (!deleteFor) return;

    if (deleteFor.filePath) {
      try {
        await Filesystem.deleteFile({ path: deleteFor.filePath });
      } catch (e) {
        console.warn("Could not delete physical file:", e);
      }
    }

    const updated = removeZipRecord(deleteFor.id);
    setZips(updated);
    toast.success("ZIP archive deleted");
    setDeleteFor(null);
  };

  return (
    <AppShell title="My ZIPs" subtitle={`${zips.length} archive${zips.length !== 1 ? "s" : ""} · ${formattedTotal}`}>
      <div className="relative mt-2">
        <Search
          size={17}
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search archives"
          className="bg-surface border-border/70 placeholder:text-muted-foreground focus:border-brand/60 h-12 w-full rounded-2xl border pr-4 pl-11 text-[14.5px] font-medium outline-none"
        />
      </div>

      {list.length === 0 ? (
        <EmptyState hasQuery={query.length > 0} />
      ) : (
        <Card className="mt-3">
          {list.map((z) => (
            <div
              key={z.id}
              onClick={() => setSheetFor(z)}
              className="group border-border/60 pressable flex cursor-pointer min-h-[68px] items-center gap-3 border-b px-4 py-3 transition-colors duration-150 last:border-b-0 active:bg-muted/50"
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetFor(z);
                }}
                aria-label={`More options for ${z.name}`}
                className="pressable text-muted-foreground active:bg-muted grid h-11 w-11 shrink-0 place-items-center rounded-full"
              >
                <MoreVertical
                  size={19}
                  className="transition-transform duration-200 group-active:translate-x-0.5"
                />
              </button>
            </div>
          ))}
        </Card>
      )}

      {/* Action Sheet */}
      <Sheet open={!!sheetFor} onOpenChange={(o) => !o && setSheetFor(null)}>
        <SheetContent
          side="bottom"
          className="bg-surface rounded-t-[28px] border-none px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_-16px_oklch(0.2_0.05_258/0.4),inset_0_1px_0_0_var(--inner-highlight)]"
        >
          <div className="bg-muted-foreground/30 mx-auto mt-2 mb-1 h-1.5 w-10 rounded-full" />
          <SheetHeader className="px-1 pb-1">
            <SheetTitle className="truncate text-[15px] font-bold">{sheetFor?.name}</SheetTitle>
          </SheetHeader>
          <div className="pb-2">
            <SheetAction
              icon={<Download size={19} strokeWidth={1.8} />}
              label="Open / Download File"
              onClick={() => sheetFor && handleShare(sheetFor)}
            />
            <SheetAction
              icon={<MonitorSmartphone size={19} strokeWidth={1.8} />}
              label="Transfer to PC"
              onClick={() => {
                setSheetFor(null);
                navigate({ to: "/transfer" });
              }}
            />
            <SheetAction
              icon={<Share2 size={19} strokeWidth={1.8} />}
              label="Share File"
              onClick={() => sheetFor && handleShare(sheetFor)}
            />
            <SheetAction
              icon={<Pencil size={19} strokeWidth={1.8} />}
              label="Rename"
              onClick={() => sheetFor && handleOpenRename(sheetFor)}
            />
            <SheetAction
              icon={<Trash2 size={19} strokeWidth={1.8} />}
              label="Delete"
              destructive
              onClick={() => {
                setDeleteFor(sheetFor);
                setSheetFor(null);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteFor} onOpenChange={(o) => !o && setDeleteFor(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ZIP?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFor?.name} will be permanently removed from your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 rounded-2xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground h-12 rounded-2xl font-bold"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <AlertDialog open={!!renameFor} onOpenChange={(o) => !o && setRenameFor(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Archive</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for this archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2 px-1">
            <div className="bg-surface border-border/80 flex items-center rounded-2xl border px-3.5 py-2.5">
              <input
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[14.5px] font-bold outline-none"
                placeholder="Archive name"
              />
              <span className="text-muted-foreground text-[13px] font-semibold">.zip</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 rounded-2xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="gradient-brand h-12 rounded-2xl font-bold text-white"
              onClick={handleSaveRename}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function SheetAction({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`pressable active:bg-muted flex min-h-[52px] w-full items-center gap-3.5 rounded-2xl px-3 text-[15px] font-semibold ${
        destructive ? "text-destructive" : "text-foreground"
      }`}
    >
      <span className="text-current">{icon}</span>
      {label}
    </button>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="animate-rise mt-12 flex flex-col items-center px-6 text-center">
      <span className="bg-brand/10 text-brand grid h-20 w-20 place-items-center rounded-[28px]">
        <Archive size={34} strokeWidth={1.6} />
      </span>
      <h3 className="mt-5 text-[17px] font-extrabold">
        {hasQuery ? "No matching archives" : "No ZIPs created yet"}
      </h3>
      <p className="text-muted-foreground mt-1.5 max-w-[16rem] text-[13.5px] leading-relaxed font-medium">
        {hasQuery
          ? "Try a different filename or clear the search."
          : "Create your first ZIP archive using the 'Create ZIP' button below."}
      </p>
      {!hasQuery && (
        <button
          onClick={() => navigate({ to: "/create" })}
          className="gradient-brand glow-brand pressable mt-5 h-12 px-6 rounded-2xl text-[14px] font-bold text-white"
        >
          Create ZIP Archive
        </button>
      )}
    </div>
  );
}

