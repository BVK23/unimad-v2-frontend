"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MAD_STORIES, madStoryImageUrl, type MadStory } from "./madStories";
import { VIDEO_TESTIMONIALS } from "./testimonials";

function getInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function VideoTestimonialCard({ name, major, thumbnail, video }: (typeof VIDEO_TESTIMONIALS)[number]) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      void el.play();
    }
  };

  return (
    <article className="stories-video-card">
      <video
        ref={videoRef}
        src={video}
        poster={thumbnail}
        className="stories-video-card__media"
        controls={isPlaying}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {!isPlaying ? (
        <button type="button" className="stories-video-card__overlay" onClick={togglePlay} aria-label={`Play ${name}'s story`}>
          <span className="stories-video-card__play" aria-hidden>
            ▶
          </span>
          <div className="stories-video-card__meta">
            <p className="stories-video-card__name">{name}</p>
            <p className="stories-video-card__major">{major}</p>
          </div>
        </button>
      ) : null}
    </article>
  );
}

function StoryAvatar({ name, image }: { name: string; image: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="stories-carousel-card__avatar" aria-hidden>
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className="stories-carousel-card__avatar stories-carousel-card__avatar--photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={madStoryImageUrl(image)} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </div>
  );
}

function StoryCarouselCard({ story }: { story: MadStory }) {
  return (
    <article className="stories-carousel-card">
      <div className="stories-carousel-card__head">
        <StoryAvatar name={story.name} image={story.image} />
        <p className="stories-carousel-card__name">{story.name}</p>
      </div>
      <p className="stories-carousel-card__quote">&quot;{story.quote}&quot;</p>
    </article>
  );
}

export function StoriesSection() {
  const [activePage, setActivePage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(1);
  const dragStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const sm = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");

    const updateCardsPerPage = () => {
      if (lg.matches) setCardsPerPage(4);
      else if (sm.matches) setCardsPerPage(2);
      else setCardsPerPage(1);
    };

    updateCardsPerPage();
    sm.addEventListener("change", updateCardsPerPage);
    lg.addEventListener("change", updateCardsPerPage);
    return () => {
      sm.removeEventListener("change", updateCardsPerPage);
      lg.removeEventListener("change", updateCardsPerPage);
    };
  }, []);

  const pageCount = Math.ceil(MAD_STORIES.length / cardsPerPage);

  useEffect(() => {
    if (activePage > pageCount - 1) {
      setActivePage(Math.max(0, pageCount - 1));
    }
  }, [cardsPerPage, activePage, pageCount]);

  const pages = Array.from({ length: pageCount }, (_, pageIndex) =>
    MAD_STORIES.slice(pageIndex * cardsPerPage, pageIndex * cardsPerPage + cardsPerPage)
  );

  const goToPreviousPage = () => setActivePage(current => Math.max(0, current - 1));
  const goToNextPage = () => setActivePage(current => Math.min(pageCount - 1, current + 1));

  const handleDragStart = (clientX: number) => {
    dragStartX.current = clientX;
    isDragging.current = true;
  };

  const handleDragEnd = (clientX: number) => {
    if (dragStartX.current === null || !isDragging.current) return;
    const deltaX = clientX - dragStartX.current;
    dragStartX.current = null;
    isDragging.current = false;
    if (Math.abs(deltaX) < 48) return;
    if (deltaX < 0) goToNextPage();
    else goToPreviousPage();
  };

  return (
    <section className="stories" id="stories">
      <div className="stories-container">
        <div className="sec-head reveal-stagger">
          <h2 className="sec-hl">
            They were exactly
            <br />
            where you are.
          </h2>
          <p className="sec-intro">
            International students with 100s of rejections and 0 shortcuts. Here&apos;s what happened when they stopped applying randomly
            and started building a personal brand.
          </p>
        </div>

        <div className="stories-body reveal">
          <div className="stories-video-row" aria-label="Student video stories">
            {VIDEO_TESTIMONIALS.map(item => (
              <VideoTestimonialCard key={item.name} {...item} />
            ))}
          </div>

          <div className="stories-divider">
            <div className="stories-divider-line" />
            <span className="stories-divider-label">Mad stories</span>
            <div className="stories-divider-line" />
          </div>

          <div className="stories-carousel">
            <div className="stories-carousel__stage">
              {pageCount > 1 ? (
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={activePage === 0}
                  className="stories-carousel__nav stories-carousel__nav--prev"
                  aria-label="Previous testimonials"
                >
                  <ChevronLeft size={24} strokeWidth={1.75} />
                </button>
              ) : null}

              <div
                className="stories-carousel__viewport"
                onTouchStart={e => handleDragStart(e.touches[0]?.clientX ?? 0)}
                onTouchEnd={e => handleDragEnd(e.changedTouches[0]?.clientX ?? dragStartX.current ?? 0)}
                onMouseDown={e => handleDragStart(e.clientX)}
                onMouseUp={e => handleDragEnd(e.clientX)}
                onMouseLeave={() => {
                  dragStartX.current = null;
                  isDragging.current = false;
                }}
              >
                <div className="stories-carousel__track" style={{ transform: `translateX(-${activePage * 100}%)` }}>
                  {pages.map((pageStories, pageIndex) => (
                    <div
                      key={pageIndex}
                      className="stories-carousel__page"
                      style={{ "--cards-per-page": cardsPerPage } as React.CSSProperties}
                    >
                      {pageStories.map(story => (
                        <StoryCarouselCard key={story.name} story={story} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {pageCount > 1 ? (
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={activePage === pageCount - 1}
                  className="stories-carousel__nav stories-carousel__nav--next"
                  aria-label="Next testimonials"
                >
                  <ChevronRight size={24} strokeWidth={1.75} />
                </button>
              ) : null}
            </div>

            {pageCount > 1 ? (
              <div className="stories-carousel__dots">
                {Array.from({ length: pageCount }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActivePage(index)}
                    className={`stories-carousel__dot${index === activePage ? " active" : ""}`}
                    aria-label={`Go to stories page ${index + 1}`}
                    aria-current={index === activePage ? "true" : undefined}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="stories-bottom reveal">
          <Link href="/mad-stories" className="stories-view-all">
            View all mad stories
          </Link>
        </div>
      </div>
    </section>
  );
}
