"use client";

import type { CSSProperties, ComponentProps } from "react";
import { resolveMediaDisplayUrl, shouldUseUnoptimizedMedia } from "@/utils/resolve-media-url";
import Image from "next/image";

type ImageEventProps = Pick<
  ComponentProps<typeof Image>,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel" | "draggable"
>;

type PortfolioImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
} & ImageEventProps;

const logPortfolioImageFailure = (rawSrc: string, displaySrc: string) => {
  const absoluteUrl = typeof window !== "undefined" && displaySrc.startsWith("/") ? `${window.location.origin}${displaySrc}` : displaySrc;

  console.warn("[portfolio-image] failed to load", {
    rawSrc,
    displaySrc,
    absoluteUrl,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  });
};

const PortfolioImage = ({
  src,
  alt,
  className,
  style,
  fill = false,
  width = 400,
  height = 300,
  sizes,
  priority = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  draggable,
}: PortfolioImageProps) => {
  const displaySrc = resolveMediaDisplayUrl(src);
  if (!displaySrc) return null;

  const unoptimized = shouldUseUnoptimizedMedia(displaySrc);
  const onError = () => logPortfolioImageFailure(src, displaySrc);

  if (fill) {
    return (
      <Image
        src={displaySrc}
        alt={alt}
        fill
        className={className}
        style={style}
        sizes={sizes ?? "100vw"}
        unoptimized={unoptimized}
        priority={priority}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        draggable={draggable}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      unoptimized={unoptimized}
      priority={priority}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      draggable={draggable}
      onError={onError}
    />
  );
};

export default PortfolioImage;
