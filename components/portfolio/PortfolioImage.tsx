"use client";

import { resolveMediaDisplayUrl, shouldUseUnoptimizedMedia } from "@/utils/resolve-media-url";
import Image from "next/image";

type PortfolioImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

const PortfolioImage = ({ src, alt, className, fill = false, width = 400, height = 300, sizes, priority = false }: PortfolioImageProps) => {
  const displaySrc = resolveMediaDisplayUrl(src);
  if (!displaySrc) return null;

  const unoptimized = shouldUseUnoptimizedMedia(displaySrc);

  if (fill) {
    return (
      <Image src={displaySrc} alt={alt} fill className={className} sizes={sizes ?? "100vw"} unoptimized={unoptimized} priority={priority} />
    );
  }

  return (
    <Image src={displaySrc} alt={alt} width={width} height={height} className={className} unoptimized={unoptimized} priority={priority} />
  );
};

export default PortfolioImage;
