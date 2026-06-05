const StudioMediaPreviewImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element -- blob/object URLs and user uploads cannot use next/image
  <img src={src} alt={alt} className={className} />
);

export default StudioMediaPreviewImage;
