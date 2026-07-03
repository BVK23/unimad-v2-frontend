import Image from "next/image";
import { ProductUIMock } from "./ProductUIMock";
import { ShowcaseUnibot } from "./ShowcaseUnibot";

const SCREENSHOTS: Partial<Record<string, string>> = {
  resume: "/images/landing/showcase/resume-builder.png",
  portfolio: "/images/landing/showcase/portfolio.png",
};

type ShowcaseScreenProps = {
  productId: string;
  productTitle: string;
  prompts: string[];
  hideUnibot?: boolean;
};

export function ShowcaseScreen({ productId, productTitle, prompts, hideUnibot = false }: ShowcaseScreenProps) {
  const src = SCREENSHOTS[productId];

  return (
    <div className="showcase-screen">
      <div className="showcase-screen-frame">
        <div className="showcase-screen-viewport">
          {src ? (
            <Image
              src={src}
              alt={`${productTitle} product preview`}
              fill
              className="showcase-screen-img"
              sizes="(min-width: 1400px) 1020px, (min-width: 1024px) 920px, 100vw"
              quality={100}
              unoptimized
              priority={productId === "resume"}
            />
          ) : (
            <div className="showcase-screen-mock">
              <ProductUIMock productId={productId} />
            </div>
          )}
          <div className="showcase-screen-blur" aria-hidden>
            <div className="showcase-screen-blur__layer" />
            <div className="showcase-screen-blur__layer" />
            <div className="showcase-screen-blur__layer" />
            <div className="showcase-screen-blur__layer" />
          </div>
        </div>
        {!hideUnibot ? (
          <div className="showcase-screen-foot">
            <ShowcaseUnibot key={productId} prompts={prompts} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
