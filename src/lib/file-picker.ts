import { FilePicker } from "@capawesome/capacitor-file-picker";
import { Capacitor } from "@capacitor/core";

export interface PickedFileItem {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  mimeType: string;
  path?: string | undefined;
  webFile?: File | undefined;
  data?: string | undefined;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export async function pickRealFiles(multiple = true): Promise<PickedFileItem[]> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await FilePicker.pickFiles({
        readData: false,
        limit: multiple ? 0 : 1,
      });

      return res.files.map((f, idx) => ({
        id: `file_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name || "Selected_file",
        size: f.size || 0,
        formattedSize: formatBytes(f.size || 0),
        mimeType: f.mimeType || "application/octet-stream",
        path: f.path || undefined,
        data: f.data || undefined,
      }));
    } catch (e: any) {
      if (
        e?.message?.toLowerCase().includes("canceled") ||
        e?.message?.toLowerCase().includes("cancelled")
      ) {
        return [];
      }
      console.warn("Native file picker error, falling back to Web picker:", e);
    }
  }

  // Web / Preview Fallback
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.onchange = () => {
      if (!input.files || input.files.length === 0) {
        resolve([]);
        return;
      }
      const files: PickedFileItem[] = Array.from(input.files).map((f, idx) => ({
        id: `file_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name,
        size: f.size,
        formattedSize: formatBytes(f.size),
        mimeType: f.type || "application/octet-stream",
        webFile: f,
      }));
      resolve(files);
    };
    input.click();
  });
}

export async function pickRealFolder(): Promise<{ files: PickedFileItem[]; folderName: string }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await FilePicker.pickFiles({
        readData: false,
        limit: 0,
      });
      if (res.files.length > 0) {
        const files: PickedFileItem[] = res.files.map((f, idx) => ({
          id: `file_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          name: f.name || "Selected_file",
          size: f.size || 0,
          formattedSize: formatBytes(f.size || 0),
          mimeType: f.mimeType || "application/octet-stream",
          path: f.path || undefined,
          data: f.data || undefined,
        }));
        return { files, folderName: "Picked Files" };
      }
    } catch (e: any) {
      if (
        e?.message?.toLowerCase().includes("canceled") ||
        e?.message?.toLowerCase().includes("cancelled")
      ) {
        return { files: [], folderName: "" };
      }
    }
  }

  // Web Directory Picker Fallback
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    // @ts-ignore
    input.webkitdirectory = true;
    // @ts-ignore
    input.directory = true;
    input.multiple = true;
    input.onchange = () => {
      if (!input.files || input.files.length === 0) {
        resolve({ files: [], folderName: "" });
        return;
      }
      const fileList = Array.from(input.files);
      const firstRelativePath = fileList[0]?.webkitRelativePath || "";
      const folderName = firstRelativePath.split("/")[0] || "Selected Folder";

      const files: PickedFileItem[] = fileList.map((f, idx) => ({
        id: `file_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.webkitRelativePath || f.name,
        size: f.size,
        formattedSize: formatBytes(f.size),
        mimeType: f.type || "application/octet-stream",
        webFile: f,
      }));
      resolve({ files, folderName });
    };
    input.click();
  });
}
