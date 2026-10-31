import Image from "next/image";

// Responsive media for approved photography and artwork (MASTER_PLAN §15):
// intrinsic dimensions, modern formats, srcset/sizes, lazy by default and
// priority only when explicitly marked as critical. Raw <img> is not used.

export interface MediaAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Public delivery only after the artist approves the asset. */
  approvedForPublic: boolean;
}

export function Media({
  asset,
  sizes,
  priority = false,
  className,
}: {
  asset: MediaAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!asset.approvedForPublic) return null;
  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={asset.alt}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={className}
    />
  );
}
