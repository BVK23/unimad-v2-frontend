"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import Image from "next/image";

type Story = {
  quote: string;
  name: string;
  institution: string;
  avatar: string;
  rating?: number;
};

const STORIES: Story[] = [
  {
    quote:
      "Shaki always believed in me. His encouragement gave me the confidence I needed to land my job at Deloitte. Truly life changing!",
    name: "Vanshika",
    institution: "Trinity College Dublin",
    avatar: "/images/unicoach/webinar/vanshika_thumbnail.webp",
  },
  {
    quote:
      "Unicoach has been a game changer. I was able to optimise my CV and develop an impactful value proposition document that recruiters loved.",
    name: "Bharath Anand",
    institution: "University of Birmingham",
    avatar: "/images/unicoach/landing/testimonials/abhishek.webp",
  },
  {
    quote:
      "Honestly, going through the Unicoach program felt like having a dedicated career mentor by my side. It broke down complex goals into simple steps.",
    name: "Akhila",
    institution: "RGU University",
    avatar: "/images/unicoach/landing/testimonials/sarada-priya.webp",
  },
  {
    quote: "The positioning system helped me stand out in a crowded market. Recruiters finally understood my value from the first message.",
    name: "Anwesha",
    institution: "International Student",
    avatar: "/images/unicoach/webinar/anwesha_thumbnail.webp",
  },
  {
    quote: "My LinkedIn and portfolio finally told one coherent story. That consistency made every application feel stronger.",
    name: "Sri",
    institution: "International Student",
    avatar: "/images/unicoach/webinar/sri_thumbnail.webp",
  },
  {
    quote: "The interview prep and STAR frameworks turned nervous calls into structured conversations I could actually win.",
    name: "Aniket",
    institution: "International Student",
    avatar: "/images/unicoach/webinar/aniket_thumbnail.webp",
  },
];

const STATS = [
  { value: "$2M+", label: "In job offers" },
  { value: "4k+", label: "Happy students" },
  { value: "500+", label: "Interviews booked" },
  { value: "100+", label: "Companies hired" },
] as const;

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="mb-3 flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={13}
          className={index < rating ? "fill-[#ffd277] text-[#ffd277]" : "fill-transparent text-[#eaeaea]/20"}
          aria-hidden
        />
      ))}
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  return (
    <article className="masterclass-frame masterclass-frame--14 h-[248px] w-full shrink-0 overflow-hidden sm:h-[256px] lg:h-[264px] lg:min-w-0 lg:flex-1">
      <div className="masterclass-frame__inner h-full">
        <div className="masterclass-frame__content flex h-full flex-col p-5 sm:p-6">
          <StarRating rating={story.rating ?? 5} />
          <p className="line-clamp-4 flex-1 text-[14px] leading-[1.4] tracking-[-0.28px] text-[#eaeaea]/85 sm:line-clamp-5 sm:text-[15px]">
            &ldquo;{story.quote}&rdquo;
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-white/20">
              <Image src={story.avatar} alt={story.name} fill className="object-cover" sizes="40px" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-tight tracking-[-0.26px] text-[#eaeaea]">{story.name}</p>
              <p className="truncate text-[11px] leading-tight tracking-[-0.22px] text-[#eaeaea]/55">{story.institution}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MasterclassStoriesSection() {
  const [activePage, setActivePage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(1);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");

    const updateCardsPerPage = () => {
      setCardsPerPage(media.matches ? 3 : 1);
    };

    updateCardsPerPage();
    media.addEventListener("change", updateCardsPerPage);
    return () => media.removeEventListener("change", updateCardsPerPage);
  }, []);

  const pageCount = Math.ceil(STORIES.length / cardsPerPage);

  useEffect(() => {
    if (activePage > pageCount - 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clamp page when cards-per-page changes
      setActivePage(Math.max(0, pageCount - 1));
    }
  }, [cardsPerPage, activePage, pageCount]);

  const pages = Array.from({ length: pageCount }, (_, pageIndex) =>
    STORIES.slice(pageIndex * cardsPerPage, pageIndex * cardsPerPage + cardsPerPage)
  );

  return (
    <section className="mb-16 lg:mb-24" aria-labelledby="masterclass-stories-heading">
      <h2
        id="masterclass-stories-heading"
        className="mb-8 text-center text-[24px] font-medium leading-none tracking-[-0.6px] text-[#eaeaea] sm:text-[28px] lg:mb-10 lg:text-[30px]"
      >
        Real outcomes from the system
      </h2>

      <div className="overflow-hidden">
        <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${activePage * 100}%)` }}>
          {pages.map((pageStories, pageIndex) => (
            <div key={pageIndex} className="flex w-full shrink-0 gap-4 lg:gap-5">
              {pageStories.map(story => (
                <StoryCard key={story.name} story={story} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {Array.from({ length: pageCount }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActivePage(index)}
            className={`size-1.5 rounded-full transition-colors ${index === activePage ? "bg-[#eaeaea]" : "bg-[#eaeaea]/25"}`}
            aria-label={`Go to stories page ${index + 1}`}
            aria-current={index === activePage ? "true" : undefined}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:mt-10 lg:grid-cols-4 lg:gap-8">
        {STATS.map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-[28px] font-extralight leading-none tracking-[-0.56px] text-[#eaeaea] sm:text-[32px] lg:text-[36px]">
              {stat.value}
            </p>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#eaeaea]/45">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
