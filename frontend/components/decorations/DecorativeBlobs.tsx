"use client";

import { cn } from "@/lib/cn";

interface BlobProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  noBlur?: boolean;
  scale?: number;
  style?: React.CSSProperties;
}

const blobSizes = {
  sm: "w-48 h-48 blur-2xl",
  md: "w-72 h-72 blur-[100px]",
  lg: "w-96 h-96 blur-[120px]",
};

const blobNoBlurSizes = {
  sm: "w-48 h-48",
  md: "w-72 h-72",
  lg: "w-96 h-96",
};

function BlobBase({ className, size = "md", noBlur, bg, scale = 1, style }: BlobProps & { bg: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full",
        noBlur ? blobNoBlurSizes[size] : blobSizes[size],
        bg,
        "hidden md:block",
        className
      )}
      style={scale !== 1 || style ? { ...(scale !== 1 ? { transform: `scale(${scale})` } : {}), ...style } : undefined}
    />
  );
}

export function OrangeBlob(props: BlobProps) {
  return <BlobBase {...props} bg="bg-primary/11 dark:bg-[#F97316]/[0.09]" />;
}

export function YellowBlob(props: BlobProps) {
  return <BlobBase {...props} bg="bg-yellow-400/11 dark:bg-[#FBBF24]/[0.09]" />;
}

export function PinkBlob(props: BlobProps) {
  return <BlobBase {...props} bg="bg-pink-400/11 dark:bg-[#F472B6]/[0.09]" />;
}

export function GreenBlob(props: BlobProps) {
  return <BlobBase {...props} bg="bg-emerald-400/11 dark:bg-[#34D399]/[0.09]" />;
}

export function BlueBlob(props: BlobProps) {
  return <BlobBase {...props} bg="bg-blue-400/11 dark:bg-blue-400/[0.09]" />;
}

export function BlobShape({ className, size = "md", noBlur, scale = 1, style }: BlobProps) {
  const blobSizes = { sm: "w-32 h-32", md: "w-48 h-48", lg: "w-64 h-64" };
  return (
    <div
      className={cn(
        "pointer-events-none absolute",
        "bg-primary/11 dark:bg-primary/[0.09]",
        blobSizes[size],
        "blob-mask",
        "hidden md:block",
        className
      )}
      style={scale !== 1 || style ? { ...(scale !== 1 ? { transform: `scale(${scale})` } : {}), ...style } : undefined}
    />
  );
}
