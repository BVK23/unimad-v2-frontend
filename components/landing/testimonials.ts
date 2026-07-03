export type Testimonial = {
  quote: string;
  name: string;
  uni: string | null;
};

export type HeroPopTestimonial = Testimonial & {
  image: string;
};

/** Real alumni photos from public/images — used by hero pop quotes */
export const HERO_POP_TESTIMONIALS: HeroPopTestimonial[] = [
  {
    quote: "From chasing roles to attracting them.",
    name: "Kushal",
    uni: "TopDog Law",
    image: "/images/unicoach/landing/testimonials/kushal.webp",
  },
  {
    quote: "I finally felt seen. And then I got hired.",
    name: "Vanshika",
    uni: null,
    image: "/images/unicoach/landing/testimonials/vanshika.webp",
  },
  {
    quote: "Didn't just get hired, found my direction.",
    name: "Anwesha",
    uni: null,
    image: "/images/unicoach/landing/testimonials/anwesha.webp",
  },
  {
    quote: "I wasn't the most qualified candidate. I was the most visible.",
    name: "Aarthi",
    uni: "Coursera",
    image: "/images/unicoach/landing/testimonials/aarthi.webp",
  },
  {
    quote: "Got a 30% salary hike and visa sponsorship.",
    name: "Abhishek",
    uni: null,
    image: "/images/unicoach/landing/testimonials/abhishek.webp",
  },
  {
    quote: "UX role at Globant after 750 rejections.",
    name: "Sarada Priya",
    uni: "Globant",
    image: "/images/unicoach/landing/testimonials/sarada-priya.webp",
  },
  {
    quote: "The portfolio made all the difference.",
    name: "Sripathi",
    uni: null,
    image: "/images/unicoach/landing/testimonials/sripathi.webp",
  },
  {
    quote: "Optimised my LinkedIn and got noticed.",
    name: "Madhumitha",
    uni: null,
    image: "/images/home/madstories/madhumitha.webp",
  },
  {
    quote: "Very satisfied with the expertise in optimizing my resume and LinkedIn.",
    name: "Ravindu Weerasekara",
    uni: null,
    image: "/images/masterclass/testimonials/ravindu-weerasekara.jpg",
  },
  {
    quote: "Sharath answered all my queries, helpful and informative throughout.",
    name: "Srimayi Desai",
    uni: null,
    image: "/images/masterclass/testimonials/srimayi-desai.jpg",
  },
  {
    quote: "Sujan has been really helpful in my job hunt journey.",
    name: "Jayesh Gupta",
    uni: null,
    image: "/images/masterclass/testimonials/jayesh-gupta.jpg",
  },
  {
    quote: "I feel more confident that I can stand out from others.",
    name: "Jagdish Singh Mehra",
    uni: null,
    image: "/images/masterclass/testimonials/jagdish-singh-mehra.jpg",
  },
  {
    quote: "Neha showed clearly how to position myself using the VPD.",
    name: "Akyilesh Sivaguru",
    uni: null,
    image: "/images/masterclass/testimonials/akyilesh-sivaguru.jpg",
  },
  {
    quote: "Well above and beyond my expectation.",
    name: "Ketki Deshpande",
    uni: null,
    image: "/images/masterclass/testimonials/ketki-deshpande.jpg",
  },
  {
    quote: "You are doing great! I love the resume.",
    name: "Glory Nnaemeka",
    uni: null,
    image: "/images/masterclass/testimonials/glory-nnaemeka.jpg",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  { quote: "I finally had a system that actually worked.", name: "Sanjana", uni: "University of Aberdeen" },
  { quote: "It's job hunting, but smarter.", name: "Shobith", uni: "University of Birmingham" },
  { quote: "From chasing roles to attracting them.", name: "Kushal", uni: null },
  { quote: "I finally felt seen. And then I got hired.", name: "Vanshika", uni: null },
  { quote: "Built confidence in my own voice.", name: "Dhananjeyan", uni: "University of Sheffield" },
  { quote: "Didn't just get hired, found my direction.", name: "Anwesha", uni: null },
  { quote: "Rethought how I present myself completely.", name: "Sapna", uni: "University of Edinburgh" },
  { quote: "Replaced random applications with real clarity.", name: "Tejus", uni: null },
  { quote: "Three months to my first UK offer.", name: "Priya", uni: "University of Manchester" },
  { quote: "Recruiters started coming to me.", name: "Arjun", uni: "University of Leeds" },
  { quote: "My LinkedIn went from invisible to inbound.", name: "Meera", uni: null },
  { quote: "The portfolio made all the difference.", name: "Rahul", uni: "University of Glasgow" },
  { quote: "First interview in two weeks of joining.", name: "Divya", uni: "University of Exeter" },
  { quote: "Stopped applying blindly. Started getting calls.", name: "Vikram", uni: null },
  { quote: "The coaching calls changed everything for me.", name: "Pooja", uni: "University of Southampton" },
  { quote: "Built a brand I'm actually proud of.", name: "Karthik", uni: "University of Bristol" },
  { quote: "From 400 rejections to three final rounds.", name: "Ishaan", uni: null },
  { quote: "My profile strength went from 40% to 92%.", name: "Nandini", uni: "University of Warwick" },
  { quote: "The résumé builder is genuinely incredible.", name: "Aditya", uni: null },
  { quote: "I went from invisible to interview in 19 days.", name: "Shreya", uni: "University of Nottingham" },
  { quote: "Got my first offer before my visa ran out.", name: "Mihir", uni: null },
  { quote: "Job tracker alone saved me hours every week.", name: "Lavanya", uni: "University of York" },
  { quote: "Cold outreach that actually got replies.", name: "Suresh", uni: null },
  { quote: "My portfolio finally felt professional.", name: "Riya", uni: "University of Bath" },
  { quote: "The system just works. Full stop.", name: "Nikhil", uni: "University of Leicester" },
  { quote: "First offer in a new country, new industry.", name: "Zara", uni: null },
  { quote: "Personal brand, I never thought I needed one.", name: "Rohan", uni: "King's College London" },
  { quote: "The call alone was worth it.", name: "Aditi", uni: null },
  { quote: "Went from 0 to 5 interviews in a month.", name: "Praveen", uni: "University of Reading" },
  { quote: "A recruiter messaged me for the first time.", name: "Keerthana", uni: null },
  { quote: "The LinkedIn audit was brutally useful.", name: "Harish", uni: "University of Newcastle" },
  { quote: "I stopped feeling invisible.", name: "Tanvi", uni: "Brunel University London" },
  { quote: "Built my whole job search strategy in a weekend.", name: "Siddharth", uni: null },
  { quote: "Got a referral through LinkedIn, not an application.", name: "Aishwarya", uni: "University of Dundee" },
  { quote: "Free tools that punch well above their weight.", name: "Mohit", uni: null },
  { quote: "The portfolio template saved me weeks.", name: "Geeta", uni: "University of Coventry" },
  { quote: "Stopped spray-and-pray. Started targeting.", name: "Vishal", uni: null },
  { quote: "Three offers. I turned two down.", name: "Sneha", uni: "UCL" },
  { quote: "My coach knew exactly what recruiters wanted.", name: "Pranav", uni: "Imperial College London" },
  { quote: "Clarity. Finally.", name: "Deepika", uni: null },
];

export const CYCLING_QUOTES = [
  { quote: '"I finally had a system that actually worked."', name: "Sanjana", uni: "University of Aberdeen" },
  { quote: '"I finally felt seen. And then I got hired."', name: "Vanshika", uni: null },
  { quote: '"It helped me build confidence in my own voice."', name: "Dhananjeyan", uni: "University of Sheffield" },
  { quote: '"From chasing roles to attracting the right ones."', name: "Kushal", uni: null },
  { quote: '"Rethought how I present myself completely."', name: "Sapna", uni: "University of Edinburgh" },
  { quote: '"It\'s job hunting, but smarter."', name: "Shobith", uni: "University of Birmingham" },
];

export type PlacementCompany = {
  name: string;
  logo: string;
  scale?: number;
};

/** Company logos — shared with masterclass placements */
export const PLACEMENT_COMPANIES: PlacementCompany[] = [
  { name: "NHS", logo: "/images/masterclass/placements/nhs.svg", scale: 0.68 },
  { name: "Uber", logo: "/images/masterclass/placements/uber.svg", scale: 1.35 },
  { name: "JLR", logo: "/images/masterclass/placements/jlr.svg", scale: 0.92 },
  { name: "Coursera", logo: "/images/masterclass/placements/coursera.svg", scale: 1.4 },
  { name: "Amazon", logo: "/images/masterclass/placements/amazon.svg", scale: 0.58 },
  { name: "Infosys", logo: "/images/masterclass/placements/infosys.svg", scale: 1.35 },
  { name: "Lloyds Bank", logo: "/images/masterclass/placements/lloyds-bank.svg", scale: 0.72 },
  { name: "HashiCorp", logo: "/images/masterclass/placements/hashicorp.svg", scale: 1.3 },
  { name: "Adobe", logo: "/images/masterclass/placements/adobe.svg", scale: 0.78 },
  { name: "Accenture", logo: "/images/masterclass/placements/accenture.svg", scale: 1.4 },
  { name: "JP Morgan", logo: "/images/masterclass/placements/jp-morgan.svg", scale: 0.74 },
  { name: "Rolls Royce", logo: "/images/masterclass/placements/rolls-royce.svg", scale: 1.25 },
];

export type StoryCard = {
  avatar: string;
  name: string;
  uni: string;
  quote: string;
  delay?: string;
};

export const STORY_CARDS: StoryCard[] = [
  {
    avatar: "A",
    name: "Aarthi",
    uni: "£500 in her account · UK offer in 3 weeks",
    quote: "I wasn't the most qualified candidate. I was the most visible.",
  },
  {
    avatar: "R",
    name: "Ramanathan Kathiresan",
    uni: "985 rejections · 18 months · 1 offer",
    quote: "He didn't get lucky. He didn't stop.",
    delay: ".07s",
  },
  {
    avatar: "J",
    name: "Janvi Jadeja",
    uni: "492 rejections · 3 months left on visa",
    quote: "3 months left on her visa. Then THE call.",
    delay: ".14s",
  },
  { avatar: "S", name: "Sanjana", uni: "University of Aberdeen", quote: "I finally had a system that actually worked.", delay: ".21s" },
  { avatar: "Sh", name: "Shobith", uni: "University of Birmingham", quote: "It's job hunting, but smarter.", delay: ".28s" },
  {
    avatar: "D",
    name: "Dhananjeyan",
    uni: "University of Sheffield",
    quote: "It helped me build confidence in my own voice.",
    delay: ".35s",
  },
  { avatar: "V", name: "Vanshika", uni: "", quote: "I finally felt seen. And then I got hired.", delay: ".42s" },
  {
    avatar: "Sa",
    name: "Sapna",
    uni: "University of Edinburgh",
    quote: "The session helped me rethink how I present myself completely.",
    delay: ".49s",
  },
  { avatar: "T", name: "Tejus", uni: "", quote: "Their system replaced my random approach with real clarity.", delay: ".56s" },
];

export type VideoTestimonial = {
  name: string;
  major: string;
  thumbnail: string;
  video: string;
};

export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    name: "Anwesha",
    major: "Data Analytics",
    thumbnail: "/images/unicoach/webinar/anwesha_thumbnail.webp",
    video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/anwesha_testimonial.mp4",
  },
  {
    name: "Sri",
    major: "Computer Science",
    thumbnail: "/images/unicoach/webinar/sri_thumbnail.webp",
    video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/sri_testimonial.mp4",
  },
  {
    name: "Vanshika",
    major: "MBA",
    thumbnail: "/images/unicoach/webinar/vanshika_thumbnail.webp",
    video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/vanshika_testimonial.mp4",
  },
  {
    name: "Varsha",
    major: "Supply Chain",
    thumbnail: "/images/unicoach/webinar/varsha_thumbnail.webp",
    video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/varsha_testimonial.mp4",
  },
  {
    name: "Aniket",
    major: "Media Analyst",
    thumbnail: "/images/unicoach/webinar/aniket_thumbnail.webp",
    video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/aniket_testimonial.mp4",
  },
  {
    name: "Sreenu",
    major: "DevOps Engineer",
    thumbnail: "/images/unicoach/webinar/sreenu_thumbnail.webp",
    video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/sreenu_testimonial.mp4",
  },
];

export type VideoStory = {
  name: string;
  stat: string;
  duration: string;
  progress: string;
  cta: string;
  bg?: string;
};

export const VIDEO_STORIES: VideoStory[] = [
  {
    name: "Madhumitha Dev",
    stat: "2,000 applications → working in the US",
    duration: "1:48",
    progress: "38%",
    cta: "Watch her story",
  },
  {
    name: "Tejus",
    stat: "800 rejections → one life-changing offer",
    duration: "2:14",
    progress: "62%",
    cta: "Watch his story",
    bg: "radial-gradient(ellipse 60% 44% at 50% 30%,rgba(129,170,255,.34) 0%,transparent 62%),radial-gradient(ellipse 78% 60% at 50% 82%,rgba(20,40,80,.5) 0%,transparent 66%),linear-gradient(165deg,#17233c 0%,#0c1626 55%,#060c18 100%)",
  },
  {
    name: "Kajal Shrivastava",
    stat: "1,000+ apps → first tech role",
    duration: "1:32",
    progress: "18%",
    cta: "Watch her story",
    bg: "radial-gradient(ellipse 60% 44% at 50% 30%,rgba(242,106,59,.4) 0%,transparent 62%),radial-gradient(ellipse 78% 60% at 50% 82%,rgba(52,109,224,.26) 0%,transparent 66%),linear-gradient(165deg,#221a24 0%,#12141f 55%,#080a14 100%)",
  },
];
