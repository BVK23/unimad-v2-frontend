"use client";

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
  const unoptimized = src.startsWith("data:");

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} sizes={sizes ?? "100vw"} unoptimized={unoptimized} priority={priority} />;
  }

  return <Image src={src} alt={alt} width={width} height={height} className={className} unoptimized={unoptimized} priority={priority} />;
};

export default PortfolioImage;
