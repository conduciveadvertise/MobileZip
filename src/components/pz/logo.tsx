import { cn } from "@/lib/utils";

/**
 * PhoneZip app mark — the official uploaded icon artwork.
 * Everything else in the UI (palette, gradients, accents) derives from it.
 */
export function PhoneZipLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/phonezip-logo.png"
      alt="PhoneZip"
      width={size}
      height={size}
      className={cn("elevation-brand shrink-0 rounded-[26%] object-cover", className)}
      style={{ width: size, height: size }}
      loading="eager"
      decoding="async"
    />
  );
}

export function PhoneZipWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <PhoneZipLogo size={38} />
      <span className="min-w-0">
        <span className="block text-[17px] leading-tight font-extrabold tracking-tight">
          PhoneZip
        </span>
        <span className="text-muted-foreground block text-[11px] leading-tight font-medium">
          Zip. Transfer. Done.
        </span>
      </span>
    </span>
  );
}
