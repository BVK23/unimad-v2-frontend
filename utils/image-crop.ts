import type { CSSProperties } from "react";

export type CropAspectRatio = "1:1" | "3:4" | "4:5" | "16:9";

export const CROP_ASPECT_RATIOS: Record<CropAspectRatio, number> = {
  "1:1": 1,
  "3:4": 3 / 4,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type CropGeometry = {
  cropWidth: number;
  cropHeight: number;
  offsetX: number;
  offsetY: number;
};

export function getImageCropGeometry(
  imageWidth: number,
  imageHeight: number,
  ratio: CropAspectRatio,
  zoom: number,
  pan: { x: number; y: number }
): CropGeometry {
  const aspect = CROP_ASPECT_RATIOS[ratio];
  let baseCropWidth = imageWidth;
  let baseCropHeight = baseCropWidth / aspect;

  if (baseCropHeight > imageHeight) {
    baseCropHeight = imageHeight;
    baseCropWidth = baseCropHeight * aspect;
  }

  const cropWidth = baseCropWidth / zoom;
  const cropHeight = baseCropHeight / zoom;
  const maxPanX = Math.max(0, (imageWidth - cropWidth) / 2);
  const maxPanY = Math.max(0, (imageHeight - cropHeight) / 2);
  const offsetX = clamp((imageWidth - cropWidth) / 2 + pan.x * maxPanX, 0, imageWidth - cropWidth);
  const offsetY = clamp((imageHeight - cropHeight) / 2 + pan.y * maxPanY, 0, imageHeight - cropHeight);

  return { cropWidth, cropHeight, offsetX, offsetY };
}

export function applyImageCrop(
  source: string,
  ratio: CropAspectRatio,
  zoom: number,
  pan: { x: number; y: number },
  onResult: (croppedDataUrl: string) => void,
  maxOutputPx?: number
): void {
  const img = new Image();
  if (source.startsWith("http")) {
    img.crossOrigin = "anonymous";
  }
  img.onload = () => {
    const { cropWidth, cropHeight, offsetX, offsetY } = getImageCropGeometry(img.naturalWidth, img.naturalHeight, ratio, zoom, pan);

    let outWidth = Math.round(cropWidth);
    let outHeight = Math.round(cropHeight);
    if (maxOutputPx) {
      const maxDim = Math.max(outWidth, outHeight);
      if (maxDim > maxOutputPx) {
        const scale = maxOutputPx / maxDim;
        outWidth = Math.round(outWidth * scale);
        outHeight = Math.round(outHeight * scale);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, offsetX, offsetY, cropWidth, cropHeight, 0, 0, outWidth, outHeight);
    onResult(canvas.toDataURL("image/jpeg", 0.92));
  };
  img.src = source;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function getCropPreviewBackgroundStyle(
  source: string,
  imageSize: { width: number; height: number },
  geometry: CropGeometry
): CSSProperties {
  return {
    backgroundImage: `url(${source})`,
    backgroundSize: `${(imageSize.width / geometry.cropWidth) * 100}% ${(imageSize.height / geometry.cropHeight) * 100}%`,
    backgroundPosition: `${(geometry.offsetX / Math.max(1, imageSize.width - geometry.cropWidth)) * 100}% ${(geometry.offsetY / Math.max(1, imageSize.height - geometry.cropHeight)) * 100}%`,
  };
}
