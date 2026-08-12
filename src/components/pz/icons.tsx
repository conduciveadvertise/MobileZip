import {
  Archive,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  File as FileIconGeneric,
  Folder,
  Monitor,
  Wifi,
  Upload,
  Download,
  QrCode,
  Lock,
  Settings2,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PzIconKind =
  | "zip"
  | "apk"
  | "folder"
  | "image"
  | "video"
  | "pdf"
  | "document"
  | "audio"
  | "file"
  | "pc"
  | "phone"
  | "wifi"
  | "upload"
  | "download"
  | "qr"
  | "lock"
  | "settings";

const ICONS: Record<PzIconKind, LucideIcon> = {
  zip: FileArchive,
  apk: FileCode2,
  folder: Folder,
  image: FileImage,
  video: FileVideo,
  pdf: FileText,
  document: FileText,
  audio: FileAudio,
  file: FileIconGeneric,
  pc: Monitor,
  phone: Smartphone,
  wifi: Wifi,
  upload: Upload,
  download: Download,
  qr: QrCode,
  lock: Lock,
  settings: Settings2,
};

/** Tone classes keep every icon in the same visual family. */
const TONES: Record<PzIconKind, string> = {
  zip: "text-amber-deep bg-amber/15",
  apk: "text-success bg-success/10",
  folder: "text-amber-deep bg-amber/12",
  image: "text-cyan bg-cyan/12",
  video: "text-destructive bg-destructive/10",
  pdf: "text-destructive bg-destructive/10",
  document: "text-brand bg-brand/10",
  audio: "text-success bg-success/10",
  file: "text-muted-foreground bg-muted",
  pc: "text-brand bg-brand/10",
  phone: "text-brand bg-brand/10",
  wifi: "text-cyan bg-cyan/12",
  upload: "text-brand bg-brand/10",
  download: "text-cyan bg-cyan/12",
  qr: "text-foreground bg-muted",
  lock: "text-brand bg-brand/10",
  settings: "text-muted-foreground bg-muted",
};

export function PzGlyph({
  kind,
  className,
  size = 20,
}: {
  kind: PzIconKind;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[kind] ?? ICONS.file;
  return <Icon size={size} strokeWidth={1.75} className={className} />;
}

export function FileTile({
  kind,
  size = "md",
  className,
}: {
  kind: PzIconKind;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims =
    size === "lg" ? "h-14 w-14 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl";
  const glyph = size === "lg" ? 26 : size === "sm" ? 17 : 21;
  return (
    <span
      className={cn(
        "inner-line grid shrink-0 place-items-center ring-1 ring-inset ring-border/50",
        dims,
        TONES[kind],
        className,
      )}
    >
      <PzGlyph kind={kind} size={glyph} />
    </span>
  );
}

export function extToKind(name: string): PzIconKind {
  if (!name.includes(".")) return "folder";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "zip";
  if (ext === "apk") return "apk";
  if (["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext)) return "image";
  if (["mp4", "mov", "mkv", "avi"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (["mp3", "wav", "flac", "m4a"].includes(ext)) return "audio";
  if (["doc", "docx", "txt", "md", "xls", "xlsx"].includes(ext)) return "document";
  if (!ext) return "folder";
  return "file";
}

export { Archive };
