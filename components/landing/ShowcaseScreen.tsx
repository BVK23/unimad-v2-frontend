import Image from "next/image";
import { ProductUIMock } from "./ProductUIMock";
import { ShowcaseUnibot } from "./ShowcaseUnibot";
import type { ShowcaseShot } from "./showcaseProducts";

/** Legacy single-screenshot map — used when a product has no per-point
 *  `screenshots` array of its own. */
const SCREENSHOTS: Partial<Record<string, string>> = {
  portfolio: "/images/landing/showcase/portfolio.png",
};

type ShowcaseScreenProps = {
  productId: string;
  productTitle: string;
  prompts: string[];
  hideUnibot?: boolean;
  /** Per-point screenshots (index-aligned with the feature's bullets). */
  screenshots?: ShowcaseShot[];
  /** Which screenshot to show. -1 (title phase) and 0 both show the first. */
  activeShot?: number;
};

export function ShowcaseScreen({ productId, productTitle, prompts, hideUnibot = false, screenshots, activeShot = 0 }: ShowcaseScreenProps) {
  const legacy = SCREENSHOTS[productId];
  const shots: ShowcaseShot[] = screenshots && screenshots.length > 0 ? screenshots : legacy ? [{ src: legacy }] : [];
  const active = shots.length > 0 ? Math.min(Math.max(activeShot, 0), shots.length - 1) : 0;
  const activeIsContain = shots[active]?.fit === "contain";
  const activeBg = shots[active]?.bg;

  return (
    <div className="showcase-screen">
      <div className="showcase-screen-frame">
        <div
          className={`showcase-screen-viewport${activeIsContain ? " showcase-screen-viewport--pad" : ""}`}
          style={activeBg ? { background: activeBg } : undefined}
        >
          {shots.length > 0 ? (
            shots.map((shot, index) => (
              <Image
                key={shot.src}
                src={shot.src}
                alt={`${productTitle} preview ${index + 1}`}
                fill
                className={`showcase-screen-img${shot.fit === "contain" ? " showcase-screen-img--contain" : ""}${shot.bleed ? " showcase-screen-img--bleed" : ""}${index === active ? " is-active" : ""}`}
                style={shot.zoom ? { transform: `scale(${shot.zoom})` } : undefined}
                sizes="(min-width: 1400px) 1020px, (min-width: 1024px) 920px, 100vw"
                quality={100}
                unoptimized
                priority={productId === "resume" && index === 0}
              />
            ))
          ) : (
            <div className="showcase-screen-mock">
              <ProductUIMock productId={productId} />
            </div>
          )}
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
