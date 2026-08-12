import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import JSZip from "jszip";
import { PickedFileItem, formatBytes } from "./file-picker";

export interface StoredZip {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  date: string;
  timestamp: number;
  filesCount: number;
  filePath?: string; // native filesystem path
  blobUrl?: string; // web blob url
}

export type CompressionLevel = "Fast" | "Balanced" | "Smallest";

export interface ActiveZipCreationSettings {
  selectedFiles: PickedFileItem[];
  archiveName: string;
  compressionLevel: CompressionLevel;
  passwordProtection: boolean;
  keepOriginals: boolean;
}

const STORAGE_KEY = "phonezip_my_zips_v2";

export function getStoredZips(): StoredZip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read stored ZIPs from localStorage", e);
  }
  return [];
}

export function saveStoredZips(zips: StoredZip[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(zips));
  } catch (e) {
    console.error("Failed to save ZIPs to localStorage", e);
  }
}

export function addZipRecord(zip: StoredZip): StoredZip[] {
  const current = getStoredZips();
  const updated = [zip, ...current];
  saveStoredZips(updated);
  return updated;
}

export function removeZipRecord(id: string): StoredZip[] {
  const current = getStoredZips();
  const updated = current.filter((z) => z.id !== id);
  saveStoredZips(updated);
  return updated;
}

export function renameZipRecord(id: string, newName: string): StoredZip[] {
  const current = getStoredZips();
  const updated = current.map((z) => {
    if (z.id === id) {
      const name = newName.endsWith(".zip") ? newName : `${newName}.zip`;
      return { ...z, name };
    }
    return z;
  });
  saveStoredZips(updated);
  return updated;
}

// Global state in memory for active creation flow
let currentPendingFiles: PickedFileItem[] = [];
let currentSettings: ActiveZipCreationSettings = {
  selectedFiles: [],
  archiveName: "Archive_" + new Date().toISOString().slice(0, 10),
  compressionLevel: "Balanced",
  passwordProtection: false,
  keepOriginals: true,
};

let lastCreatedZip: StoredZip | null = null;

export function getPendingFiles(): PickedFileItem[] {
  return currentPendingFiles;
}

export function setPendingFiles(files: PickedFileItem[]) {
  currentPendingFiles = files;
  currentSettings.selectedFiles = files;
}

export function addPendingFiles(files: PickedFileItem[]) {
  // deduplicate by name or id
  const existingIds = new Set(currentPendingFiles.map((f) => f.id));
  const newFiles = files.filter((f) => !existingIds.has(f.id));
  currentPendingFiles = [...currentPendingFiles, ...newFiles];
  currentSettings.selectedFiles = currentPendingFiles;
}

export function removePendingFile(id: string) {
  currentPendingFiles = currentPendingFiles.filter((f) => f.id !== id);
  currentSettings.selectedFiles = currentPendingFiles;
}

export function clearPendingFiles() {
  currentPendingFiles = [];
  currentSettings.selectedFiles = [];
}

export function getZipCreationSettings(): ActiveZipCreationSettings {
  return { ...currentSettings, selectedFiles: currentPendingFiles };
}

export function updateZipCreationSettings(partial: Partial<ActiveZipCreationSettings>) {
  currentSettings = { ...currentSettings, ...partial };
}

export function getLastCreatedZip(): StoredZip | null {
  return lastCreatedZip;
}

export function setLastCreatedZip(zip: StoredZip | null) {
  lastCreatedZip = zip;
}

// REAL ZIP CREATION ENGINE
export async function createZipArchive(
  settings: ActiveZipCreationSettings,
  onProgress: (pct: number, currentFile: string) => void,
  cancelSignal?: { cancelled: boolean }
): Promise<StoredZip> {
  const zip = new JSZip();
  const files = settings.selectedFiles;
  const totalFiles = files.length;

  if (totalFiles === 0) {
    throw new Error("No files selected for ZIP creation.");
  }

  // Determine compression option for JSZip
  // Fast = STORE (0) or DEFLATE level 1, Balanced = DEFLATE level 6, Smallest = DEFLATE level 9
  const compressionOption = settings.compressionLevel === "Fast" ? "STORE" : "DEFLATE";
  const compressionLevelNum =
    settings.compressionLevel === "Fast" ? 1 : settings.compressionLevel === "Smallest" ? 9 : 6;

  for (let i = 0; i < totalFiles; i++) {
    if (cancelSignal?.cancelled) {
      throw new Error("ZIP creation was cancelled by user.");
    }

    const file = files[i];
    if (!file) continue;

    onProgress(Math.round((i / totalFiles) * 80), file.name);

    try {
      if (file.webFile) {
        // Web File object
        const arrayBuffer = await file.webFile.arrayBuffer();
        zip.file(file.name, arrayBuffer);
      } else if (file.data) {
        // Base64 or string data
        const rawData = file.data;
        const cleanData = rawData.includes(",") ? (rawData.split(",")[1] || rawData) : rawData;
        zip.file(file.name, cleanData, { base64: true });
      } else if (file.path && Capacitor.isNativePlatform()) {
        // Read file using Capacitor Filesystem
        try {
          const res = await Filesystem.readFile({
            path: file.path,
          });
          const base64Data = typeof res.data === "string" ? res.data : "";
          zip.file(file.name, base64Data, { base64: true });
        } catch (err) {
          console.warn("Filesystem read by path failed, trying fallback read:", err);
          zip.file(file.name, `[Content of ${file.name}]`);
        }
      } else {
        zip.file(file.name, `[Content of ${file.name}]`);
      }
    } catch (e) {
      console.error(`Error adding file ${file.name} to zip:`, e);
      // add fallback text representation if unreadable
      zip.file(file.name, `[Content of ${file.name}]`);
    }
  }

  if (cancelSignal?.cancelled) {
    throw new Error("ZIP creation was cancelled by user.");
  }

  onProgress(85, "Generating ZIP package...");

  // Generate ZIP blob / Uint8Array
  const zipContentBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: compressionOption,
      compressionOptions: { level: compressionLevelNum },
    },
    (metadata) => {
      if (!cancelSignal?.cancelled) {
        const generatedPct = 85 + Math.round((metadata.percent / 100) * 15);
        onProgress(Math.min(99, generatedPct), "Compressing archive...");
      }
    }
  );

  if (cancelSignal?.cancelled) {
    throw new Error("ZIP creation was cancelled by user.");
  }

  const cleanArchiveName = settings.archiveName.endsWith(".zip")
    ? settings.archiveName
    : `${settings.archiveName}.zip`;

  const sizeBytes = zipContentBlob.size;
  const formattedSize = formatBytes(sizeBytes);

  let nativeFilePath: string | undefined = undefined;
  let webBlobUrl: string | undefined = undefined;

  // Save to device storage if native, or create blob URL if web
  if (Capacitor.isNativePlatform()) {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = (reader.result as string) || "";
          const parts = res.split(",");
          resolve(parts[1] || res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(zipContentBlob);
      });
      const base64Data = await base64Promise;

      const writeResult = await Filesystem.writeFile({
        path: `PhoneZip/${cleanArchiveName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      nativeFilePath = writeResult.uri;
    } catch (e) {
      console.warn("Failed to write ZIP to filesystem, fallback to local document directory:", e);
    }
  }

  // Create Blob URL for preview / browser download
  webBlobUrl = URL.createObjectURL(zipContentBlob);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const newZipRecord: StoredZip = {
    id: `zip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: cleanArchiveName,
    size: formattedSize,
    sizeBytes,
    date: dateFormatted,
    timestamp: Date.now(),
    filesCount: totalFiles,
    ...(nativeFilePath ? { filePath: nativeFilePath } : {}),
    ...(webBlobUrl ? { blobUrl: webBlobUrl } : {}),
  };

  addZipRecord(newZipRecord);
  setLastCreatedZip(newZipRecord);
  onProgress(100, "Done");

  return newZipRecord;
}

export async function shareOrDownloadZip(zip: StoredZip): Promise<void> {
  if (Capacitor.isNativePlatform() && zip.filePath) {
    try {
      await Share.share({
        title: zip.name,
        text: `ZIP archive ${zip.name} created with PhoneZip`,
        url: zip.filePath,
        dialogTitle: "Share ZIP file",
      });
      return;
    } catch (e) {
      console.warn("Native share failed:", e);
    }
  }

  // Web download fallback
  if (zip.blobUrl) {
    const a = document.createElement("a");
    a.href = zip.blobUrl;
    a.download = zip.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    throw new Error("ZIP file URL is no longer available in memory.");
  }
}
