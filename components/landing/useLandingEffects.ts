"use client";

import { useEffect, useState, type RefObject } from "react";
import { HERO_POP_TESTIMONIALS } from "./testimonials";

export function useLandingBodyClass() {
  useEffect(() => {
    document.documentElement.classList.add("landing-active");
    return () => document.documentElement.classList.remove("landing-active");
  }, []);
}

/**
 * Returns true once the page has scrolled past the given (dark) hero. Used to
 * flip a transparent, white-on-dark nav into a solid, blurred light-mode header
 * as the reader leaves the hero section.
 */
export function useNavSolid(heroSelector: string) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(heroSelector);
    if (!hero) return;

    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 64;

    const obs = new IntersectionObserver(([entry]) => setSolid(!entry.isIntersecting), {
      rootMargin: `-${navH}px 0px 0px 0px`,
      threshold: 0,
    });
    obs.observe(hero);
    return () => obs.disconnect();
  }, [heroSelector]);

  return solid;
}

/**
 * Writes a 0→1 scroll-progress value to a CSS variable on the target element,
 * based on how far the element has travelled through the viewport. Used to
 * fill the vertical progress bar in the "How Unicoach works" timeline.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, varName = "--uc-progress") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const activeLine = window.innerHeight * 0.55;
      const progress = (activeLine - rect.top) / Math.max(rect.height, 1);
      const clamped = Math.min(1, Math.max(0, progress));
      el.style.setProperty(varName, clamped.toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, varName]);
}

/**
 * Word-by-word "reading" reveal: each word sits at 10% opacity and brightens to
 * 100% as it rises past a reading line in the viewport, so the sentence lights
 * up line-by-line exactly as far as the reader has scrolled.
 */
export function useReadReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const words = Array.from(el.querySelectorAll<HTMLElement>(".uc-why__word"));
    if (!words.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      words.forEach(w => (w.style.opacity = "1"));
      return;
    }

    const MIN = 0.1;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const readLine = vh * 0.62; // words above this line are "read"
      const blend = vh * 0.14; // how gradually each line brightens
      words.forEach(w => {
        const rect = w.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const t = Math.min(1, Math.max(0, (readLine - center) / blend + 0.5));
        w.style.opacity = (MIN + (1 - MIN) * t).toFixed(3);
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}

const randArr = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randBetween = (a: number, b: number) => a + Math.random() * (b - a);

export function usePopQuotes(containerId = "hero-cards") {
  useEffect(() => {
    if (window.innerWidth <= 1024) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const activeRects: { x: number; y: number }[] = [];
    const BUBBLE_W = 240;
    const BUBBLE_H = 80;
    const OVERLAP_PAD = 24;

    const overlaps = (pos: { x: number; y: number }) => {
      for (const r of activeRects) {
        const dx = Math.abs(pos.x - r.x);
        const dy = Math.abs(pos.y - r.y);
        if (dx < BUBBLE_W + OVERLAP_PAD && dy < BUBBLE_H + OVERLAP_PAD) return true;
      }
      return false;
    };

    const safePosition = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const hlW = Math.min(820, vw * 0.58);
      const hlL = (vw - hlW) / 2;
      const hlR = vw - hlL;
      const yMin = 90;
      const yMax = vh * 0.45;
      const zones = [
        () => ({ x: randBetween(hlL - BUBBLE_W - 32, hlL - 16), y: randBetween(yMin, yMax * 0.5), rot: randBetween(-3, 2) }),
        () => ({ x: randBetween(hlL - BUBBLE_W - 28, hlL - 12), y: randBetween(yMax * 0.4, yMax), rot: randBetween(-4, 1) }),
        () => ({ x: randBetween(hlR + 12, hlR + 48), y: randBetween(yMin, yMax * 0.5), rot: randBetween(-1, 4) }),
        () => ({ x: randBetween(hlR + 8, hlR + 44), y: randBetween(yMax * 0.4, yMax), rot: randBetween(-2, 5) }),
      ];
      const pos = randArr(zones)();
      pos.x = Math.max(8, Math.min(pos.x, vw - BUBBLE_W - 8));
      pos.y = Math.max(yMin, Math.min(pos.y, yMax));
      return pos;
    };

    const findPosition = (maxAttempts = 6) => {
      for (let i = 0; i < maxAttempts; i++) {
        const pos = safePosition();
        if (!overlaps(pos)) return pos;
      }
      return null;
    };

    const spawnPopQuote = () => {
      const pos = findPosition();
      if (!pos) return;

      const t = randArr(HERO_POP_TESTIMONIALS);
      const el = document.createElement("div");
      el.className = "hcard";
      el.style.cssText = `position:absolute;left:${pos.x}px;top:${pos.y}px;transform:rotate(${pos.rot}deg);z-index:3;`;
      const meta = t.uni || "";
      el.innerHTML = `
        <div class="hcard-avatar" style="opacity:0;">
          <img src="${t.image}" alt="${t.name}" width="32" height="32" loading="lazy" decoding="async" />
        </div>
        <div class="hcard-bubble" style="opacity:0;transform:translateX(-10px);will-change:opacity,transform;">
          <p class="hcard-quote">${t.quote}</p>
          <div class="hcard-identity">
            <p class="hcard-name">${t.name}</p>
            ${meta ? `<p class="hcard-uni">${meta}</p>` : ""}
            <span class="hcard-cta">Read their full story →</span>
          </div>
        </div>`;
      container.appendChild(el);

      const rect = { x: pos.x, y: pos.y };
      activeRects.push(rect);

      const av = el.querySelector(".hcard-avatar") as HTMLElement | null;
      const bub = el.querySelector(".hcard-bubble") as HTMLElement | null;

      requestAnimationFrame(() => {
        if (!av) return;
        av.style.opacity = "";
        av.style.transform = "";
        av.style.animation = "avatarBounce .7s cubic-bezier(.34,1.4,.64,1) forwards";
      });

      setTimeout(() => {
        if (!bub) return;
        bub.style.transition = "opacity .3s ease, transform .38s cubic-bezier(.25,.8,.25,1)";
        bub.style.opacity = "1";
        bub.style.transform = "translateX(0)";
      }, 380);

      setTimeout(() => {
        if (!bub) return;
        bub.style.transition = "none";
        bub.style.transform = "none";
      }, 800);

      const fallDur = randBetween(7000, 10500);
      setTimeout(() => {
        el.style.setProperty("--card-rot", `${pos.rot}deg`);
        el.style.animation = `heroCardFall ${fallDur}ms cubic-bezier(0.42,0,0.9,0.6) forwards`;
        const idx = activeRects.indexOf(rect);
        if (idx > -1) activeRects.splice(idx, 1);
        setTimeout(() => el.remove(), fallDur + 100);
      }, 750);

      el.addEventListener("mouseenter", () => {
        el.style.animationPlayState = "paused";
        el.style.zIndex = "100";
      });
      el.addEventListener("mouseleave", () => {
        el.style.animationPlayState = "running";
        el.style.zIndex = "3";
      });
    };

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const scheduleNext = (delay: number) => {
      const id = setTimeout(() => {
        spawnPopQuote();
        scheduleNext(randBetween(2200, 3800));
      }, delay);
      timeouts.push(id);
    };

    timeouts.push(setTimeout(() => spawnPopQuote(), 800));
    timeouts.push(setTimeout(() => spawnPopQuote(), 2200));
    timeouts.push(setTimeout(() => spawnPopQuote(), 3800));
    scheduleNext(5200);

    return () => {
      timeouts.forEach(clearTimeout);
      container.innerHTML = "";
    };
  }, [containerId]);
}

export function useCyclingQuote() {
  useEffect(() => {
    if (window.innerWidth > 1024) return;

    const cq = document.getElementById("hero-cq");
    const quoteEl = document.getElementById("hcq-quote");
    const nameEl = document.getElementById("hcq-name");
    const avEl = document.getElementById("hcq-av");
    const dotsEl = document.getElementById("hcq-dots");
    if (!cq || !quoteEl || !nameEl || !avEl || !dotsEl) return;

    const pool = HERO_POP_TESTIMONIALS.map(t => ({
      quote: `"${t.quote}"`,
      name: t.name,
      uni: t.uni,
      image: t.image,
    }));

    let idx = 0;
    pool.forEach((_, i) => {
      const d = document.createElement("div");
      d.className = `hcq-dot${i === 0 ? " on" : ""}`;
      dotsEl.appendChild(d);
    });
    const dots = dotsEl.querySelectorAll(".hcq-dot");

    const show = (i: number) => {
      cq.classList.add("fade");
      setTimeout(() => {
        const t = pool[i];
        quoteEl.textContent = t.quote;
        nameEl.textContent = t.uni ? `${t.name} · ${t.uni}` : t.name;
        avEl.innerHTML = `<img src="${t.image}" alt="${t.name}" width="22" height="22" loading="lazy" decoding="async" />`;
        dots.forEach((d, j) => d.classList.toggle("on", j === i));
        cq.classList.remove("fade");
      }, 500);
    };

    const interval = setInterval(() => {
      idx = (idx + 1) % pool.length;
      show(idx);
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}

export function useVideoDeck(stageId = "deck-stage") {
  useEffect(() => {
    const stage = document.getElementById(stageId);
    if (!stage) return;

    const cards = [...stage.querySelectorAll(".dv-card")];
    const dots = [...document.querySelectorAll(".deck-dot")];
    const total = cards.length;
    let current = 0;

    const render = () => {
      cards.forEach((card, i) => {
        const pos = (i - current + total) % total;
        (card as HTMLElement).dataset.pos = String(Math.min(pos, total));
      });
      dots.forEach((d, i) => d.classList.toggle("active", i === current));
    };

    const advance = () => {
      current = (current + 1) % total;
      render();
    };

    let tx = 0;
    const onClick = () => advance();
    const onTouchStart = (e: TouchEvent) => {
      tx = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches[0].clientX - tx < -40) advance();
    };

    stage.addEventListener("click", onClick);
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchend", onTouchEnd);
    render();

    return () => {
      stage.removeEventListener("click", onClick);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchend", onTouchEnd);
    };
  }, [stageId]);
}

const REVEAL_SELECTOR = ".reveal, .reveal-stagger, .ccard, .vc-card, .tc-card";

function revealInView(el: Element, ro: IntersectionObserver, seen: WeakSet<Element>) {
  if (seen.has(el) || el.classList.contains("vis")) {
    seen.add(el);
    return;
  }

  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    el.classList.add("vis");
    seen.add(el);
    ro.unobserve(el);
  }
}

export function useScrollReveal() {
  useEffect(() => {
    const seen = new WeakSet<Element>();
    const ro = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("vis");
            seen.add(entry.target);
            ro.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );

    const register = (root: ParentNode = document) => {
      root.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
        if (seen.has(el) || el.classList.contains("vis")) {
          seen.add(el);
          return;
        }
        ro.observe(el);
        revealInView(el, ro, seen);
      });
    };

    register();

    let mutationTimer: ReturnType<typeof setTimeout> | undefined;
    const mo = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.matches(REVEAL_SELECTOR)) {
            if (!seen.has(node) && !node.classList.contains("vis")) {
              ro.observe(node);
              revealInView(node, ro, seen);
            }
          }
          register(node);
        });
      }

      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => register(), 50);
    });

    mo.observe(document.body, { childList: true, subtree: true });

    const onScroll = () => register();
    const onLoad = () => register();

    window.addEventListener("load", onLoad);
    window.addEventListener("scroll", onScroll, { passive: true });
    onLoad();

    return () => {
      clearTimeout(mutationTimer);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("load", onLoad);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
}
