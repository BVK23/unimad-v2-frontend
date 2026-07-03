export type StoryBlock = { type: "p"; text: string } | { type: "h"; text: string } | { type: "list"; items: string[] };

export type MadStory = {
  name: string;
  quote: string;
  image: string;
  /** Full testimonial, sourced from https://www.unimad.ai/mad-stories */
  story: StoryBlock[];
};

/** Sourced from https://www.unimad.ai/mad-stories */
export const MAD_STORIES_IMAGE_ORIGIN = "https://www.unimad.ai";

export function madStoryImageUrl(image: string): string {
  if (image.startsWith("http")) return image;
  return `${MAD_STORIES_IMAGE_ORIGIN}${image}`;
}

/** Serialises structured story blocks to markdown for react-markdown rendering. */
export function storyBlocksToMarkdown(blocks: StoryBlock[]): string {
  return blocks
    .map(block => {
      if (block.type === "p") return block.text;
      if (block.type === "h") return `## ${block.text}`;
      if (block.type === "list") return block.items.map(item => `- ${item}`).join("\n");
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export const MAD_STORIES: MadStory[] = [
  {
    name: "Pooja More",
    quote: "I was told to finish my degree before applying for jobs. That advice cost me two years of rejections.",
    image: "/mdx/mad-stories/mad-story-pooja-more.jpeg",
    story: [
      { type: "p", text: "The UK wasn't my dream destination, but it made the most sense financially." },
      {
        type: "p",
        text: "My family wanted me to get a master's degree, and the UK checked all the boxes. The program was just one year, which meant lower overall costs.",
      },
      {
        type: "p",
        text: "I didn't need to take the GRE, and by the time I was deciding, US applications had already closed. The counselor painted a convincing picture of opportunities with the Post-Study Work visa, so I committed.",
      },
      {
        type: "p",
        text: 'When I started applying for jobs during my program, someone advised me to wait. "Finish your studies first, then focus on the job search." It sounded reasonable at the time, so I stopped applying and focused on my degree.',
      },
      { type: "p", text: "Looking back, that might've been the worst advice I followed." },
      {
        type: "p",
        text: "After graduation, I threw myself into the job search. I sent out hundreds of applications, over 800 at least. I stopped counting after a while because it became too depressing. Out of all those applications, only seven companies called me back.",
      },
      {
        type: "p",
        text: "The rejections were relentless. Some said they couldn't sponsor visas. Others had closed positions due to budget cuts. A few just ghosted me entirely.",
      },
      {
        type: "p",
        text: "One of my earliest interviews came through a referral in early 2023. I thought having an inside connection would give me an edge, but I was rejected at the first screening because they couldn't sponsor my visa. That crushed me because I'd believed referrals were supposed to be the golden ticket.",
      },
      {
        type: "p",
        text: "By mid-2023, I was exhausted and running out of ideas. That's when I connected with Shaki from Unimad. He looked at my portfolio and offered me a chance to volunteer as a UX Designer with them. It wasn't paid, but it kept me engaged and visible.",
      },
      {
        type: "p",
        text: "More importantly, he helped me rebuild my CV and fix my LinkedIn. After optimising it properly, recruiters started finding me in their searches. That one shift opened doors I didn't even know existed.",
      },
      {
        type: "p",
        text: "In 2025, I finally landed an interview based purely on my updated CV. I cleared the first round, and they were exploring visa sponsorship options. But after the technical interview, they went with someone who had experience with a specific tool they used internally. I was sad, just too sad.",
      },
      {
        type: "p",
        text: "But a few months later, a friend connected me with the founder of an AdTech startup. The founder had seen some work I'd done and liked it enough to bring me in for an interview. I got the job and joined on probation.",
      },
      {
        type: "p",
        text: "While I was there, I decided to participate in a design hackathon. I made it to the offline round, and that's where everything shifted. I met the co-founder of another company at the event. He saw my work, liked my approach, and asked his HR team to reach out.",
      },
      { type: "p", text: "I cracked the interview and finally landed my perfect role which I'm still in till date." },
      { type: "p", text: "My advice? Never wait till after graduation to begin your search. Start as early as possible!" },
    ],
  },
  {
    name: "Pooja Balasubramaniam",
    quote: "After 1,000 applications and rejections, I finally landed a £52,000 role I wasn't qualified for.",
    image: "/mdx/mad-stories/mad-story-pooja-balasubramaniam.jpeg",
    story: [
      { type: "p", text: "I chose the UK because it felt safe and offered the kind of exposure I wanted for my career." },
      {
        type: "p",
        text: "I'd been working as a Tax Senior at Deloitte India before deciding to pursue my master's. The move felt right. I took a loan, packed my life into suitcases, and landed in the UK ready to build something new.",
      },
      {
        type: "p",
        text: "Six months into my program, I started applying for jobs. I thought my experience at Deloitte would help me stand out.",
      },
      {
        type: "p",
        text: "I applied to over 1,000 jobs. More than 800 rejections came back. I made it to six interviews. Four of those went to final rounds. But nothing was converting.",
      },
      {
        type: "p",
        text: "The rejections were hard, but what really shook my confidence was how the goalposts kept moving. When I first arrived in 2023, the salary threshold for a sponsored job was £24,000. That felt achievable. Then the UK government changed the rules. The threshold jumped to £42,000 – double what it had been.",
      },
      { type: "p", text: "I felt stuck. The system kept shifting, and I kept falling short." },
      {
        type: "p",
        text: "Then I found Unimad. Shaki helped me completely rethink my approach. Before that, I was applying to random jobs with no real direction. My CV wasn't focused, and my LinkedIn wasn't optimised.",
      },
      {
        type: "p",
        text: "We rebuilt everything. My CV became sharper. My LinkedIn started showing up in searches. I learnt how to position myself with a Value Proposition Document that clearly showed what I brought to the table.",
      },
      {
        type: "p",
        text: 'Suddenly, things started working out. I got called for an interview and told them upfront, "I need sponsorship and expect £38,000" but the hiring manager told they would hire a Tax Manager with 10 years of UK experience for that salary. It stung. He offered me the role at £27,000 and I turned it down.',
      },
      {
        type: "p",
        text: "Later on, I saw another role listed at £52,000. I knew I didn't have the UK experience they wanted, but I applied anyway. I walked into that interview and was completely honest about what I could bring. No exaggeration, no false promises. Just clarity and confidence in what I'd done.",
      },
      { type: "p", text: "To my biggest surprise, I was offered the job!" },
      {
        type: "p",
        text: "Here's my 2 cent if you're still in the hunt: be brave enough to apply even when you don't fit perfectly, and believe you can achieve what feels impossible.",
      },
    ],
  },
  {
    name: "Shivani Murali",
    quote: "I survived 17-hour shifts in freezing weather only to realise the real challenge was getting my first interview.",
    image: "/mdx/mad-stories/mad-story-shivani-murali.jpeg",
    story: [
      { type: "p", text: "Dublin was supposed to be my fresh start, but a week in, the rejections had already begun." },
      {
        type: "p",
        text: "I'd chosen Ireland deliberately because it had a top university, a strong finance program, and better job prospects than most places I'd considered. Everything pointed to it being the right move.",
      },
      {
        type: "p",
        text: "But the reality hit me hard. For months, it was just rejections. My coursework was intense, and finding even a part-time job took almost two months. When I finally got hired as an event steward at concerts, the work was draining. I stood for hours in the cold, and my longest shift was seventeen hours straight. Later, I worked in a restaurant doing 8 to 10-hour shifts regularly.",
      },
      {
        type: "p",
        text: "Between the exhausting shifts, my master's assignments, and sending out applications every spare moment I had, I was completely drained.",
      },
      {
        type: "p",
        text: "As the end of my program got nearer, I made a decision. I quit my part-time job, flew home for a month, and gave my complete focus to the job search. That became the turning point.",
      },
      {
        type: "p",
        text: "I sent out over 200 applications, 100+ cold emails, and 100+ cold messages on LinkedIn. It was around that time I found Unimad. Sharath and his team reminded me what I'd forgotten: that I'd already landed a job in India through LinkedIn before. I just needed to remember the formula.",
      },
      {
        type: "p",
        text: "They helped me optimise my LinkedIn, build a strong portfolio, and create a Value Proposition Document that made me stand out in interviews. More than the tools, they believed in me when I didn't believe in myself. They kept me going through the hard days.",
      },
      {
        type: "p",
        text: "After months of persistence, burnout, and showing up even when nothing seemed to work, I finally got my first full-time finance role in Ireland. It's a one-year contract, but it's a start, and I'm using this experience to aim even higher!",
      },
      {
        type: "p",
        text: "Here's what I'd tell anyone searching right now: optimise your LinkedIn and build real relationships, not just applications.",
      },
    ],
  },
  {
    name: "Kalidas",
    quote: "500 applications, 400 rejections, and a CV full of 13 years of experience that wasn't working, until I stripped it all down.",
    image: "/mdx/mad-stories/mad-story-kalidas.jpeg",
    story: [
      { type: "p", text: "I'd been working in tech for over a decade before I decided to pursue my master's in the UK." },
      {
        type: "p",
        text: "By the time I started the program, I had 13 years of solid experience, so I thought that would make the job search easier. I was wrong.",
      },
      {
        type: "p",
        text: "In July 2025, I officially started applying. I had a CV packed with every project I'd ever touched, every technology I'd worked with, every detail I thought mattered. It was complete but apparently, it wasn't working.",
      },
      {
        type: "p",
        text: "Out of 500 applications, I got rejected by 400 companies. About 100 moved forward to some stage of screening. Twenty led to actual interviews. Only five made it to the final rounds. For someone with my experience, those numbers didn't make sense. I kept wondering what I was doing wrong.",
      },
      {
        type: "p",
        text: "The frustrating part was that I knew I had the skills. I'd worked across multiple tech stacks, led projects, and solved real problems. But none of that seemed to translate on paper.",
      },
      {
        type: "p",
        text: "I was spending hours manually applying to jobs, tweaking my CV slightly each time, but nothing was really changing. It felt like I was throwing applications into a void.",
      },
      {
        type: "p",
        text: "That's when I joined Unimad. The first thing they did was tear apart my CV. All those years of experience I'd crammed into multiple pages? They helped me condense it into two clean, focused pages with only the most relevant information.",
      },
      {
        type: "p",
        text: "They also helped me build a portfolio that showcased my work visually and optimised my LinkedIn so recruiters could actually find me. Suddenly, my profile wasn't just a list of jobs. It was a clear picture of what I brought to the table.",
      },
      {
        type: "p",
        text: "The preparation I put into interviews changed, too. I stopped trying to mention everything I'd done and started focusing on what the company actually needed. Presentation mattered just as much as experience.",
      },
      {
        type: "p",
        text: "I entered the job market in the first week of July 2025. By November 17th, I had an offer. Looking back, I wish I'd automated more of the application process earlier. The manual effort was draining, and I could've saved time by being smarter about where and how I applied.",
      },
      {
        type: "p",
        text: "My advice to anyone still searching? Have solid technical skills, but don't be rigid. The ability to adapt and learn what the market needs is just as important as your experience.",
      },
    ],
  },
  {
    name: "Subitcha Mohanakrishnan",
    quote: "I was running out of time, money, and hope before one offer changed everything!",
    image: "/mdx/mad-stories/mad-story-subitcha-mohanakrishnan.jpeg",
    story: [
      {
        type: "p",
        text: "I took a loan to fund my one-year master's in the UK, and with every passing month without a job, the weight of that debt felt heavier.",
      },
      {
        type: "p",
        text: "Choosing the one-year program made sense: finish quickly, apply while writing my dissertation, and land something before my PSW visa ends. August 2024 rolled around, and I began applying with full confidence that it wouldn't take long, but I was wrong.",
      },
      {
        type: "p",
        text: "I sent out 2,806 applications on LinkedIn alone. Another 500+ went through company websites that I didn't even track. That's over 3,000 applications in total. Out of all those, I got 10 interviews. Just one final round, and for months, zero offers.",
      },
      {
        type: "p",
        text: "The rejections were painful, but what hurt more was not even getting past the first stage. Most of my applications just vanished into silence. It felt like my resume wasn't even being seen, let alone read.",
      },
      {
        type: "p",
        text: "That's when I found Unimad. The Cover Letter Builder saved me so much time and helped me write sharply instead of rambling. The Value Proposition Document gave me the confidence to apply for roles even when I didn't tick every single box. And the portfolio feature helped me get mine up and running fast instead of overthinking the design.",
      },
      {
        type: "p",
        text: "Finally, one application broke through. One interview turned into a final round, and in October 2025, I got the offer.",
      },
      { type: "p", text: "Fourteen months with over 2,000 rejections. But it only took one yes." },
      {
        type: "p",
        text: "If you're struggling right now, never be afraid to ask for help. Don't sit there hoping things will magically improve. Track your efforts, use the tools that exist, and keep going.",
      },
      { type: "p", text: "Sometimes all it takes is one application landing on the right desk." },
    ],
  },
  {
    name: "Rakesh Babu",
    quote: "After 600 applications led nowhere, I made a decision that terrified me, and it completely turned things around.",
    image: "/mdx/mad-stories/mad-story-rakesh-babu.jpeg",
    story: [
      { type: "p", text: "Germany wasn't a random choice for me. It was strategic right from the beginning." },
      {
        type: "p",
        text: "I'd worked at Amazon before starting my master's, and during that time, I collaborated with a German operations team. The way they approached supply chain management was different, structured, and incredibly efficient. So it stuck with me.",
      },
      {
        type: "p",
        text: "When I decided to pursue a master's in supply chain and logistics, Germany made the most sense. The country is known for manufacturing excellence, and universities here let you gain industry experience while studying. I wasn't interested in just theory. I wanted real exposure.",
      },
      {
        type: "p",
        text: "So I took the loan and went for it. By my third semester, I started applying for internships. I was eager to get my foot in the door and start building my career.",
      },
      {
        type: "p",
        text: "Then everything fell apart. A few months into my search, I had to stop completely because of a medical emergency. Being an international student dealing with health issues far from home was frustrating. It drained me physically and mentally. My confidence took a hit, and honestly, I wasn't sure if I'd even recover in time to continue.",
      },
      {
        type: "p",
        text: "But I did, slowly, and by early 2025, I was back to applying again. I sent out 600 applications everywhere. Most went unanswered, a few led to interviews, but none turned into a real offer.",
      },
      {
        type: "p",
        text: "The worst part was when I made it to the fourth round with one company. On the day of the final interview, they told me the role had changed, and they weren't hiring anymore. Just like that, it was over!",
      },
      {
        type: "p",
        text: "I felt stuck and frustrated. Like I was doing everything right but getting nowhere. That's when I made a call that scared me. I quit my part-time job in May so I could focus entirely on finding a working student position. It was a risk I wasn't sure would pay off.",
      },
      {
        type: "p",
        text: "In June, I joined Unimad. I had one session with Sharath, and we completely rebuilt my resume. He helped me stop trying to appeal to everyone and instead focus on my strengths in supply chain and logistics. We also cleaned up my LinkedIn so recruiters could actually find me.",
      },
      {
        type: "p",
        text: "The shift was instant. I stopped applying to everything and started applying only to roles where I knew I was a strong match. Within a week, I got an interview call. By mid-July, I had an offer. On September 1st, I started my working student role.",
      },
      {
        type: "p",
        text: "What changed wasn't my qualifications. It was how I presented them. So, if you're grinding through applications right now and feeling stuck, here's what I'd say: stop chasing volume and focus on getting clarity.",
      },
    ],
  },
  {
    name: "Athul Krishnan",
    quote: "I was promised a job offer, then a week later, they told me they couldn't proceed, but I didn't stop pushing.",
    image: "/mdx/mad-stories/mad-story-athul-krishnan.jpeg",
    story: [
      {
        type: "p",
        text: "Taking a loan to study in the UK felt like the best investment I could make in my future. I wasn't chasing prestige or a fancy degree. I just believed the UK would give me the opportunities I needed to build the career I wanted. So I borrowed the money and went for it.",
      },
      {
        type: "p",
        text: "I started looking for jobs the moment I landed. I didn't want to wait until graduation to figure things out. I wanted to be ready.",
      },
      {
        type: "p",
        text: "Over the next few months, I sent out more than a thousand applications. Most never got a response. About twenty companies called me for interviews. A handful moved to the final rounds. But nothing was converting.",
      },
      {
        type: "p",
        text: "Then something happened that almost crushed me completely. I'd gone through multiple interview rounds with a company, and they verbally confirmed they wanted to hire me. They said the official offer letter would come by the end of the week. I was relieved. Finally, it felt like things were working out.",
      },
      {
        type: "p",
        text: "When the week passed, I reached out to follow up. They told me they couldn't move forward anymore with NO real explanation!",
      },
      {
        type: "p",
        text: "That hurt was worse than any rejection I'd received. But I kept going, I didn't have another option, actually. I'd already put too much on the line to quit now.",
      },
      {
        type: "p",
        text: "Looking back, I realise I wasted time applying to jobs that had nothing to do with what I'd done before. I was all over the place, hoping something would stick. If I'd focused earlier on roles where I already had experience, things might have moved faster.",
      },
      {
        type: "p",
        text: "Along the line, I found Unimad. They helped me build a portfolio that actually stood out and taught me how to tailor my resume to match what companies were looking for. Suddenly, I wasn't just another name in the pile anymore.",
      },
      {
        type: "p",
        text: "From start to finish, it was all about showing up every day. Even when it felt pointless. Even when nothing was working. I just kept pushing, and eventually, I got two offers. After a thousand applications and months of rejection, something finally broke through.",
      },
      {
        type: "p",
        text: "If you're stuck in your search right now, remember this: consistency beats motivation. Stay disciplined, keep going, and your breakthrough will come.",
      },
    ],
  },
  {
    name: "Shruthi Gowri Shankar",
    quote: "After 200+ applications and 9 months of nothing, one focused strategy got me hired.",
    image: "/mdx/mad-stories/mad-story-shruthi-gowri-shankar.jpg",
    story: [
      { type: "p", text: "200+ applications. 9 months of silence. Then one email changed everything." },
      {
        type: "p",
        text: "I took a loan to study in the UK, so when I finished my course in September 2024, I jumped straight into job hunting. Or at least, I thought I did. The truth is, I was aiming my arrows in the air without any real strategy.",
      },
      {
        type: "p",
        text: "November 2024 brought my first interview with Mondelez, and I was hopeful. I made it through round one, then round two, round three, and even round four, only to get rejected at the very end. It was crushing, but I kept going.",
      },
      {
        type: "p",
        text: "I kept applying to 100+ applications that turned into 100+ rejections. Then another 100+ applications with the same result. The silence was deafening, and by this point, I was working as a retail bakery assistant at Co-op just to get by. The shifts were physically exhausting, and I'd come home too tired to even think about job applications.",
      },
      {
        type: "p",
        text: "Honestly, I'd lost confidence. The job hunt felt heavier with every rejection, and I didn't know how to search properly or apply strategically. I was just throwing applications out there and hoping something would stick, but nothing did.",
      },
      {
        type: "p",
        text: "Nine months in, I was ready to give up. I even thought about going back to India and leaving this dream behind. Then, in June 2025, I found Unimad.",
      },
      {
        type: "p",
        text: "I had calls with the team and learnt how to cold email properly. I rebuilt my resume from scratch and created a proper portfolio that actually showcased my skills. And then I sent one cold email to an employee at a company I wanted to work for.",
      },
      {
        type: "p",
        text: "They noticed it, reviewed my resume, and looked at my portfolio. I got the interview, which was only my second interview in nine months. The process moved fast, and then came the silence again. I thought it was over and that it was time to start searching again.",
      },
      {
        type: "p",
        text: "Then my phone rang with the words I'd been waiting to hear: \"Congratulations, Shruthi!\" I got the job in September 2025, and it was my first and last application after joining Unimad. I still can't believe it!",
      },
      {
        type: "p",
        text: "After 200+ applications and nine months of nothing, one focused strategy got me hired. Your skills matter, but your personality matters more. Let it speak through your profile, be authentically you, and remember that one right application can change your fate.",
      },
    ],
  },
  {
    name: "Gauri Kulkarni",
    quote: "From food delivery partner to Marketing & Sales Account Manager at Desjardins, clarity won",
    image: "/mdx/mad-stories/mad-story-gauri-kulkarni.jpg",
    story: [
      { type: "p", text: "When I first landed in Toronto on May 26, 2019, I thought I had it all figured out." },
      {
        type: "p",
        text: "I have eight years of experience in SEO, content marketing, paid ads, video creation, blogging, and website building. I could do it all. I genuinely believed I'd never struggle to find work, but then Covid hit, and I got fired from my very first job in Canada.",
      },
      {
        type: "p",
        text: "Suddenly, I was doing food delivery, working at a dog daycare, and taking any job that came my way. I wasn't building a career; I was just surviving. Eventually, I landed roles here and there, but my resume was all over the place. I was a generalist who knew a bit of everything, and that became my biggest problem.",
      },
      {
        type: "p",
        text: "I applied to over 1,000 jobs and got rejections everywhere. For over a year, I was jobless, picking up random freelance gigs and working with shady firms I couldn't even put on LinkedIn. I started losing hope, and by May 2025, I knew something had to change.",
      },
      {
        type: "p",
        text: "That's when I came across Sharath's LinkedIn post and signed up for his webinar. In one hour, everything clicked. He made me realise that my resume wasn't showing expertise, but it was showing confusion. I was a generalist in a world that rewards specialists, and I needed to make a decision.",
      },
      {
        type: "p",
        text: "I picked two core skills: social media marketing and sales. I chose one industry: fintech. Everything else was gone from my resume. I used Unimad to rebuild my CV from scratch, optimised my LinkedIn, and applied only to roles I actually had a shot at.",
      },
      {
        type: "p",
        text: "Within two weeks, Desjardins reached out. I went through the interview, got the offer, and started as a Marketing and Sales Account Manager in July 2025. After years of struggling and 1,000+ rejections, clarity got me hired in two weeks.",
      },
      {
        type: "p",
        text: "Honestly, you're always just one decision away from a totally different life. My advice is to pick 2-3 core skills and one industry, then build your resume around that. Stop easy-applying to everything and focus on roles that actually fit. You're one decision away from everything changing.",
      },
    ],
  },
  {
    name: "Janhavi Jathar",
    quote: "1800 applications. 1 final round. 1 yes from Octopus Energy Services.",
    image: "/mdx/mad-stories/mad-story-janhavi-jathar.jpg",
    story: [
      { type: "p", text: "I started applying three months into my course." },
      { type: "p", text: "It felt early back then. Now I wish I had started even earlier." },
      { type: "p", text: "Over time, I sent out around 1800 applications." },
      { type: "p", text: "Heard back from barely a handful." },
      { type: "p", text: "Only one reached the final round." },
      { type: "p", text: "And that one became the one*.*" },
      { type: "p", text: "In the middle of it all, I worked part-time in warehouses, at football matches, in sales wherever I could." },
      { type: "p", text: "My days were long. My motivation? Fading." },
      { type: "p", text: "The worst part? Some companies rejected me saying I didn’t “match their values.”" },
      { type: "p", text: "How do you even respond to that?" },
      { type: "p", text: "Then I found Unimad." },
      { type: "p", text: "And suddenly, everything made more sense." },
      { type: "p", text: "I wasn’t just “unlucky.”" },
      { type: "p", text: "My application wasn’t standing out, and I didn’t know how to fix it." },
      { type: "p", text: "With Unibot Drafts, I built a value proposition doc and a proper portfolio." },
      { type: "p", text: "I learnt to present myself better*.*" },
      { type: "p", text: "I'm naturally introverted, so networking felt terrifying." },
      { type: "p", text: "But I took it step by step." },
      { type: "p", text: "First friends. Then acquaintances. Then strangers." },
      { type: "p", text: "Eventually, one referral led me to an interview." },
      { type: "p", text: "And this one felt different." },
      { type: "p", text: "Octopus didn’t ask for a boring interview." },
      { type: "p", text: "They gave me team activities, real-world tasks, things that brought out the best in me." },
      { type: "p", text: "It wasn’t about perfect answers. It was about showing up as I am. And I thrived." },
      { type: "p", text: "And for the first time, I felt seen*.*" },
      { type: "p", text: "To anyone in this journey," },
      { type: "p", text: "It will get worse before it gets better." },
      { type: "p", text: "You’ll want to quit." },
      { type: "p", text: "But please, keep going." },
      { type: "p", text: "All it takes is one yes to change everything." },
    ],
  },
  {
    name: "Janvi Jadeja",
    quote: "With just 3 months left on my visa, MIDFIX said yes.",
    image: "/mdx/mad-stories/mad-story-janvi-jadeja.jpeg",
    story: [
      { type: "p", text: "Coming to the UK had been my dream since I was a teenager." },
      {
        type: "p",
        text: "I even planned to come for my bachelor's, but due to financial issues, I had to wait. So when I finally arrived in February 2021 for my master’s, I thought: “This is it.”",
      },
      { type: "p", text: "But I was wrong." },
      { type: "p", text: "Covid changed everything." },
      {
        type: "p",
        text: "My first term was online. I missed out on campus life, classmates, and even proper teaching. I tested positive during my dissertation and couldn’t access the labs I needed.",
      },
      { type: "p", text: "And while I’ve always been academically strong, that year broke me." },
      { type: "p", text: "After graduating, I started working full-time in a warehouse to repay my student loan." },
      { type: "p", text: "And I’ll admit I waited too long to start job hunting." },
      { type: "p", text: "It’s the one mistake I wish I could undo." },
      { type: "p", text: "At one point, I thought: “This isn’t what I came here for.”" },
      { type: "p", text: "So I quit my warehouse job and focused full-time on applying." },
      { type: "p", text: "I must have applied to 500 jobs. 492 rejections. Only 4 interviews." },
      { type: "p", text: "My confidence hit rock bottom." },
      { type: "p", text: "My health took a toll." },
      { type: "p", text: "I started comparing myself with friends who had already landed jobs." },
      { type: "p", text: "I stopped talking to people. I shut down." },
      { type: "p", text: "When I finally picked myself back up, I found Unimad." },
      { type: "p", text: "And Unibot Drafts changed everything." },
      { type: "p", text: "For the first time, I had structure. I built my LinkedIn properly. I applied smartly. I followed up." },
      { type: "p", text: "And then, with just 3 months left on my PSW visa, I got an email." },
      { type: "p", text: "A company had seen my CV on a job site and reached out." },
      { type: "p", text: "I hadn’t even applied!" },
      { type: "p", text: "They were in mechanical engineering, and I’m a structural engineer." },
      { type: "p", text: "But they liked me." },
      { type: "p", text: "I went through two rounds, including a 1.5-hour face-to-face interview." },
      { type: "p", text: "I was honest, curious, and confident." },
      { type: "p", text: "And then came the offer." },
      { type: "p", text: "I was shaking when I asked them the big question:" },
      { type: "p", text: "“Can you sponsor me?”" },
      { type: "p", text: "They said YES." },
      { type: "p", text: "I broke down in tears. Called my family. I couldn’t believe it." },
      { type: "p", text: "After everything, the timing, the rejections, the depression, the delays, I had a job. A sponsored job." },
      { type: "p", text: "It was finally happening." },
      { type: "p", text: "My 2 cents?" },
      {
        type: "p",
        text: "Never give up. Every rejection means you're one step closer. And please, never, ever doubt yourself. You’ve got this.",
      },
    ],
  },
  {
    name: "Nibha Jadhav",
    quote: "From chaos to clarity: This is how focus got me hired at Get Staffed.",
    image: "/mdx/mad-stories/mad-story-nibha-jadhav.webp",
    story: [
      {
        type: "p",
        text: "When I moved to the UK in September 2022, I didn’t know the weather, the people, or even how to cross the road properly. Everything was new. And honestly? I was loving it.",
      },
      {
        type: "p",
        text: "The first few months of my Master’s in Management flew by. I was soaking it all in: new friendships, coursework, city life. But then came the internship phase in our course, a mandatory four-month internship.",
      },
      { type: "p", text: "And that’s when reality struck." },
      { type: "p", text: "Getting an internship itself took three intense rounds of interviews." },
      { type: "p", text: "That’s when the thought hit me: “If this is how hard internships are, how wild will it be for full-time jobs?”" },
      { type: "p", text: "I started applying, but it was chaos." },
      { type: "p", text: "There was no plan. No clarity. Just panic." },
      {
        type: "p",
        text: "Marketing roles. Copywriting. Finance. Project management. I applied to everything and anything that popped up on my screen.",
      },
      { type: "p", text: "Nothing was clicking." },
      {
        type: "p",
        text: "I wasn’t hearing back. I couldn’t even remember what I’d applied to because I hadn’t tracked anything. And the stress kept piling up.",
      },
      { type: "p", text: "That’s when I reached out to Sharath." },
      { type: "p", text: "We had one conversation, and that changed everything." },
      { type: "p", text: "He asked me to choose a niche." },
      { type: "p", text: "That moment of reflection led me back to something I’d never considered:" },
      { type: "p", text: "Marketing." },
      {
        type: "p",
        text: "I’d been unknowingly doing it for years, helping promote my dad’s business, running campaigns on the side. I just hadn’t named it.",
      },
      { type: "p", text: "Once I did, things started changing." },
      { type: "p", text: "I built a system." },
      {
        type: "p",
        text: "→ Created an Excel tracker → Identified roles aligned with marketing → Used Unimad’s Value Proposition Document → Applied → then followed up with cold emails + calls → Personalised every CV and wrote human cover letters",
      },
      { type: "p", text: 'I went beyond "just applying."' },
      { type: "p", text: "I started showing up with clarity and confidence." },
      { type: "p", text: "And suddenly, interviews were happening." },
      { type: "p", text: "Conversations were starting." },
      {
        type: "p",
        text: "In January 2024, three months after finishing my course, I finally heard the word I had been waiting for: You’re hired.",
      },
      { type: "p", text: "To those looking for jobs, remember, Spray and pray doesn’t work. Focus is what gets you hired." },
    ],
  },
  {
    name: "Abhaya",
    quote: "My job search didn’t start on time but it ended right at Changing Social.",
    image: "/mdx/mad-stories/mad-story-abhaya.jpg",
    story: [
      { type: "p", text: "I didn’t plan this journey the way most people do." },
      {
        type: "p",
        text: "While my brother was applying for his Master’s abroad, I casually asked him to submit my forms too. I wrote an essay, gave him the documents, and honestly… forgot all about it.",
      },
      { type: "p", text: "A few months later, I opened my inbox and saw emails from universities. Offers. Real ones." },
      { type: "p", text: "That’s when it hit me this was actually happening." },
      { type: "p", text: "I told my parents, and they backed me with no hesitation. I packed up and flew to the UK in December 2023." },
      { type: "p", text: "But getting here was only half the climb." },
      { type: "p", text: "I started applying two months before graduation." },
      { type: "p", text: "In hindsight, I wish I’d started earlier. But once I did, I had a plan:" },
      {
        type: "p",
        text: "Job applications in the morning, classes and coursework in the afternoon, and restaurant shifts in the evening.",
      },
      { type: "p", text: "Even when I had no responses, I stuck to the routine. It gave me momentum." },
      { type: "p", text: "I applied to so many jobs, I lost count." },
      { type: "p", text: "But here’s what I do remember:" },
      { type: "p", text: "7 interviews 3 final rounds 3 offers" },
      { type: "p", text: "One of them came from Changing Social." },
      { type: "p", text: "Funny story - the CV I sent them had two different fonts. Not intentional. Just a formatting slip I missed." },
      { type: "p", text: "After I got the offer, I joked about it with my hiring manager." },
      { type: "p", text: "He said he noticed." },
      { type: "p", text: "But also that it felt human. Not AI. Not templated." },
      { type: "p", text: "Just someone trying, honestly." },
      { type: "p", text: "And that effort mattered." },
      { type: "p", text: "The turning point in my job search was Unimad. The platform helped me take that effort further." },
      { type: "p", text: "I used the CV and Cover Letter builders." },
      { type: "p", text: "Optimised my LinkedIn with clear, simple steps." },
      { type: "p", text: "Leaned on Unibot for writing drafts." },
      { type: "p", text: "If you’re in the middle of job hunt right now, I get it." },
      { type: "p", text: "It feels endless. Overwhelming. Like nothing is working." },
      { type: "p", text: "But one step, one routine, one real application at a time, it builds." },
      {
        type: "p",
        text: "It would seem like a massive mountain to climb. But when you reach the summit, every bit of effort feels worth it.",
      },
    ],
  },
  {
    name: "Divya Kumaraswamy",
    quote: "This is how I restarted my career and landed a role at Concentrix.",
    image: "/mdx/mad-stories/mad-story-divya-kumaraswamy.jpeg",
    story: [
      {
        type: "p",
        text: "When I moved to the UK for my Master’s in Business Analytics, I wasn’t just going back to university, I was starting over.",
      },
      { type: "p", text: "After working in aviation for six years, shifting into a completely new industry was a big leap." },
      {
        type: "p",
        text: "The lectures felt fast-paced, the coursework was intense, and I was clocking nearly 35 hours a week in part-time jobs.",
      },
      { type: "p", text: "I’d come home late, completely drained… only to face another deadline." },
      { type: "p", text: "And then came the job hunt." },
      { type: "p", text: "I started applying after graduation." },
      { type: "p", text: "But I had no corporate experience, no clarity, and no real understanding of what job titles even meant." },
      { type: "p", text: "I sent out applications to anything that sounded remotely relevant." },
      { type: "p", text: "800 applications. 4 interviews. 1 final round." },
      { type: "p", text: "Most of the time, I didn’t even know if I was aiming at the right roles." },
      { type: "p", text: "But that changed the day I found Unimad." },
      { type: "p", text: "I had a call with Shaki." },
      { type: "p", text: "He helped me realise: the problem wasn’t my experience, it was how I was presenting it." },
      {
        type: "p",
        text: "With Unimad, I rebuilt my CV, created a Value Proposition Document, and finally saw what a clear, confident application looked like.",
      },
      { type: "p", text: "More importantly, I started to feel confident myself." },
      { type: "p", text: "I stopped applying blindly." },
      {
        type: "p",
        text: "I started reaching out to people on LinkedIn, understood the skills I actually needed, and showed up with purpose.",
      },
      { type: "p", text: "Eventually, I landed a permanent job in a field I once felt unqualified for." },
      { type: "p", text: "I’m still learning. Still growing." },
      { type: "p", text: "But now, I’m no longer guessing. I’m building." },
      { type: "p", text: "So, don’t wait to feel ‘ready.’ Just start." },
      { type: "p", text: "Most people are figuring it out as they go." },
      { type: "p", text: "Ask for help. Pivot smart. Keep showing up." },
      { type: "p", text: "One yes can change everything, but only if you give yourself the chance to get it." },
    ],
  },
  {
    name: "Sanay Chheda",
    quote: "After 950 rejections, Global Payments Inc. chose me.",
    image: "/mdx/mad-stories/mad-story-sanay-chheda.jpg",
    story: [
      { type: "p", text: "I came to the UK because I wanted to study finance where it mattered most, with the best in the world." },
      { type: "p", text: "But nothing prepares you for the job market, especially when you enter it late." },
      {
        type: "p",
        text: "After my master’s, I started applying. At first casually. Then frantically. By the end of the year, I had applied for 1000 roles.",
      },
      {
        type: "p",
        text: "Almost all of them led nowhere. 950 rejections. 50 screening calls that went quiet. 10 interviews. One final round.",
      },
      {
        type: "p",
        text: "I remember waking up and just refreshing my inbox like it was a reflex. The toughest part wasn’t the rejections. It was the silence.",
      },
      {
        type: "p",
        text: "I don’t know how I juggled everything. Part-time work, figuring out my visa, applying every day, I just kept going. Most of the time, I was running on willpower. And ramen.",
      },
      { type: "p", text: "Then something shifted." },
      { type: "p", text: "I joined Unimad. And that was the first time I actually felt like I wasn’t alone in this." },
      {
        type: "p",
        text: "The resume builder removed the stress of ATS. LinkedIn finally started looking like it belonged to someone who knew what they were doing.",
      },
      { type: "p", text: "The portfolio? That was a game changer. For the first time, I had something to show, not just tell." },
      {
        type: "p",
        text: "And then came the Value Proposition Document. I didn’t even know what it was until Sharath explained it. But once I created mine, it gave me something I hadn’t felt in months: an edge.",
      },
      {
        type: "p",
        text: "My journey from “I have no idea what I’m doing” to “Here’s what I bring to the table” didn’t happen overnight. But it happened.",
      },
      { type: "p", text: "On January 30th, I applied for my post-study work visa. On February 1st, I accepted a full-time offer." },
      { type: "p", text: "That was the jump, from fear to finally, relief." },
      { type: "p", text: "If you’re in the same place I was in, exhausted, ghosted, unsure what else to try, don’t give up**.**" },
      { type: "p", text: "And also, don’t wait too long to ask for help." },
      { type: "p", text: "Treat your job search like your job. Show up. Learn from every mistake. And eventually, something will click." },
      { type: "p", text: "It did for me." },
      { type: "p", text: "And it can for you." },
    ],
  },
  {
    name: "Naman Sharma",
    quote: "A mindset shift. One roadmap. That’s how I built my own path.",
    image: "/mdx/mad-stories/mad-story-naman-sharma.png",
    story: [
      { type: "p", text: "When I came to the UK, I wasn’t just chasing a degree. I was chasing alignment." },
      {
        type: "p",
        text: "I’ve always been someone with a business mindset, but I’m also an athlete at heart. I wanted to be in a space where I didn’t have to choose between the two, where both could thrive.",
      },
      { type: "p", text: "The UK offered that blend. It gave me the global platform I needed to pursue both purpose and passion." },
      { type: "p", text: "But I’ll be honest, my job search didn’t begin the way most stories do." },
      {
        type: "p",
        text: "I didn’t start applying during my course or even immediately after graduating. I started a full year after finishing my degree.",
      },
      { type: "p", text: "And once I began, I realised quickly: this wasn’t going to be easy." },
      {
        type: "p",
        text: "The job market was crowded, confusing, and painfully slow at times. But I also knew I didn’t want to do it the way everyone else did: randomly applying and hoping for the best.",
      },
      { type: "p", text: "I wanted structure. Strategy." },
      { type: "p", text: "That’s when I found Unimad." },
      { type: "p", text: "After one call with Shaki, I finally had clarity. A roadmap. And that changed everything." },
      { type: "p", text: "I built my day around it: set out a specific time slot every day that was just for job applications." },
      { type: "p", text: "No distractions. No “I’ll do it later.” Just quiet, focused, consistent work." },
      { type: "p", text: "Over time, it paid off:" },
      { type: "p", text: "300 applications → 9 interviews → 4 final rounds → 2 job offers." },
      { type: "p", text: "One tool, in particular, helped me stand out: the Value Proposition Document." },
      {
        type: "p",
        text: "For some, it’s just a branding doc. For me, it became something else entirely: a confidence memo. A way to see myself as already capable, already in the room, even before the interviews happened.",
      },
      { type: "p", text: "And guess what? Recruiters felt that too." },
      { type: "p", text: "They noticed the clarity, the thought behind it, the intent." },
      {
        type: "p",
        text: "If there’s one thing I’d go back and do differently, I would’ve started building relationships sooner. More cold emails. More coffee chats. More conversations with the people already in places I aspired to be.",
      },
      { type: "p", text: "That human connection matters." },
      { type: "p", text: "But if you’re out there right now, feeling stuck or unsure, my advice is simple: Don’t do it alone." },
      { type: "p", text: "There’s no glory in struggling silently. Ask for help. Learn from those ahead of you." },
      { type: "p", text: "And once you know your path, trust the process." },
      {
        type: "p",
        text: "The journey will be boring some days. It’ll test your patience. But when you walk it with discipline, and with people like the Unimad crew backing you, you won’t just survive it.",
      },
      { type: "p", text: "You’ll own it!" },
      {
        type: "p",
        text: "In fact, the clarity I gained through this process gave me something more: the confidence to build something of my own.",
      },
      { type: "p", text: "This wasn’t just about landing a job. It was about finding my direction." },
    ],
  },
  {
    name: "Sarada Priya Sirani",
    quote: "From silence to Globant: My job hunt didn’t start strong, but it ended right.",
    image: "/mdx/mad-stories/mad-story-sarada-priya-sirani.jpg",
    story: [
      {
        type: "p",
        text: "When I moved to the UK in September 2023, I was excited. I had finally found the exact course I was looking for, a Master’s in User Experience Design.",
      },
      { type: "p", text: "The structure made sense: one year, less expensive, and aligned with where I wanted my career to go." },
      { type: "p", text: "But what I didn’t realise back then was that the real journey would begin after my course ended." },
      {
        type: "p",
        text: "I thought I was being smart by focusing entirely on job applications after graduation. I didn’t take up a part-time role. I didn’t distract myself with anything else. I was fully committed to landing a job.",
      },
      { type: "p", text: "But, I wasn’t doing it the right way. And I realised it only later." },
      { type: "p", text: "I applied to over 750 roles. And I was either rejected faster, or ghosted." },
      { type: "p", text: "It was a lonely stretch. And for a while, I kept thinking I just needed to try harder." },
      { type: "p", text: "What I actually needed was to try smarter." },
      { type: "p", text: "That shift came when I joined Unimad." },
      {
        type: "p",
        text: "The 1:1 coaching helped me rethink my strategy from scratch. I wasn’t just writing better applications, I was finally learning to communicate my value.",
      },
      {
        type: "p",
        text: "One of the biggest game changers was sending out cold emails with my Value Proposition Document attached. That’s how I got interview calls. Including the one that led me to Globant.",
      },
      { type: "p", text: "It wasn’t a massive change. It was a clearer one." },
      {
        type: "p",
        text: "I realised I had been waiting to feel ‘ready’ before showing up on LinkedIn. But it was only when I began posting, connecting, and owning my story that recruiters started noticing me.",
      },
      {
        type: "p",
        text: "The resume builder, the message templates, the confidence to reach out, every part of Unimad helped me rebuild.",
      },
      { type: "p", text: "In March 2024, I landed a full-time role as a UX Designer at Globant." },
      { type: "p", text: "From 750+ applications to that one “yes,” it felt surreal." },
      {
        type: "p",
        text: "If I could do anything differently, I would’ve started sooner. I would’ve built visibility alongside my degree, and not after it.",
      },
      { type: "p", text: "If you’re in the middle of the search, not knowing what’s working and what’s not, keep going." },
      { type: "p", text: "Consistency > perfection. Always." },
      { type: "p", text: "And don’t wait until you feel ready. Start showing up anyway. That’s where the shift begins." },
    ],
  },
  {
    name: "Chaitra Pillai",
    quote: "I lost my way, then found my win at Saint Visage Dental Group.",
    image: "/mdx/mad-stories/mad-story-chaitra-pillai.jpeg",
    story: [
      { type: "p", text: "When I landed in Aberdeen in May 2021, I had no idea what I was walking into." },
      {
        type: "p",
        text: "I came here like most international students, with a loan on my head, hope in my heart, and the belief that a one-year master’s in the UK would set me up for a better future.",
      },
      { type: "p", text: "But life had other plans." },
      {
        type: "p",
        text: "Shortly after I arrived, I lost my brother. The grief pulled me into depression, and it took me months to even feel like myself again.",
      },
      {
        type: "p",
        text: "For the next three years, I kept pushing physically, mentally, and emotionally. Every day was a battle between recovery and responsibility. I wasn’t just juggling a degree, part-time work, and a job search. I was carrying personal loss, visa pressure, and the unspoken fear that I was running out of time.",
      },
      {
        type: "p",
        text: "In May 2024, I decided to go all in on the job hunt. Reduced my part-time hours. Focused entirely on applications.",
      },
      { type: "p", text: "I applied to over 500 jobs. Got five interviews. One offer." },
      {
        type: "p",
        text: "But those numbers don’t show the emotional toll. The deafening silence after hitting ‘submit,’ the days you wake up questioning your decision to move abroad, the nights you scroll through job boards with a lump in your throat.",
      },
      {
        type: "p",
        text: "Ironically, the best leads came during the times I wasn’t actively job hunting. And when I needed it most? It was complete silence.",
      },
      {
        type: "p",
        text: "What helped me was Unibot. The clarity and confidence I got from using Unibot’s drafts and strategies gave me direction when everything felt messy.",
      },
      {
        type: "p",
        text: "The real game-changer though was networking. It sounds cliché, but talking to people, reaching out, building connections made all the difference.",
      },
      { type: "p", text: "If you’re in this journey, don’t wait till the last minute." },
      { type: "p", text: "Start early. Do your research. Find your people. And once you figure things out, give back." },
      { type: "p", text: "I’ve made it a point to help anyone who reaches out, be it a referral, CV feedback, or just a conversation." },
    ],
  },
  {
    name: "Neeraj Nair",
    quote: "Breaking into the UK sports wasn’t easy, but I landed a role at BUCS.",
    image: "/mdx/mad-stories/mad-story-neeraj-nair.jpeg",
    story: [
      { type: "p", text: "When I moved to the UK to study Sports Management, I wasn’t chasing a degree." },
      { type: "p", text: "I was chasing exposure to a global sporting ecosystem that I hoped would shape my career." },
      { type: "p", text: "The UK felt like the right call. Top clubs. Rich sporting culture. Massive industry." },
      { type: "p", text: "And I told myself I’d start applying early." },
      { type: "p", text: "But like many international students, I underestimated how hard it would be." },
      {
        type: "p",
        text: "It was March 2023 when I sent my first application. I made it to the second-last round of a grad programme and thought, “This won’t be too bad.”",
      },
      { type: "p", text: "Turns out, that was the closest I got to an offer for the next 18 months." },
      {
        type: "p",
        text: "Between balancing coursework and a part-time job, I kept applying, and kept hearing nothing back. No feedback. No callbacks. No clarity.",
      },
      {
        type: "p",
        text: "In total, I sent out 326 applications. Got 318 rejections. 8 interviews. 2 final rounds. 1 contract offer. That’s the math of my job hunt.",
      },
      { type: "p", text: "It was around the 200-application mark when I came across Unimad." },
      {
        type: "p",
        text: "I had a quick chat with Shaki, who walked me through how most international students don’t have bad profiles, just misaligned ones. That clicked.",
      },
      {
        type: "p",
        text: "I used Unimad to rebuild my CV, create a solid cover letter, and for the first time ever, a portfolio. I always thought portfolios were for creative folks, but in a competitive field like sport, it helped me stand out.",
      },
      { type: "p", text: "With a better story and stronger visibility, I finally got that break. A contract role in the sports industry." },
      { type: "p", text: "It’s not the end of the journey. I’m still looking for something long-term." },
      { type: "p", text: "But I’m in the room now. I’ve got my foot in the door. And that changes everything." },
      {
        type: "p",
        text: "Here’s my advice: You might be doing all the right things, but not in the right way. Fix your positioning. Show, don’t just tell. And don’t underestimate what the right guidance can do. Because sometimes, just one offer is all it takes to change the game.",
      },
    ],
  },
  {
    name: "Sanjay Janakiraman",
    quote: "From 700 applications to 2 offers: Here’s how I made it to Gordons LLP.",
    image: "/mdx/mad-stories/mad-story-sanjay-janakiraman.jpeg",
    story: [
      { type: "p", text: "I didn’t come to the UK with a backup plan. Just a dream. And a loan." },
      { type: "p", text: "When I arrived, I thought I was mentally prepared for the job hunt. But, I wasn’t even close." },
      { type: "p", text: "I waited until my final results to start applying." },
      { type: "p", text: "No part-time job. No early head-start. Just full focus on the job search. But the results were definitely bad." },
      { type: "p", text: "Over 700 applications. 15 interviews. 2 final offers." },
      { type: "p", text: "Like many, my inbox was filled with more “unfortunately” emails than I’d care to count too." },
      { type: "p", text: "The hardest part? Staying calm when everything felt stuck." },
      { type: "p", text: "I kept applying, rewriting, adjusting. But something still wasn’t clicking." },
      { type: "p", text: "That’s when I found Unimad. And more specifically, the Cover Letter Builder." },
      { type: "p", text: "Until then, I didn’t actually know what a strong UK-style cover letter looked like." },
      { type: "p", text: "Once I saw the format, the structure, the way it helped me speak directly to the role, everything changed." },
      { type: "p", text: "It wasn’t magic. But it made my effort finally feel like it had a direction." },
      { type: "p", text: "I also started reaching out to people I didn’t know. Just to learn, to connect, to get seen." },
      { type: "p", text: "That part scared me. But it’s what landed me the job." },
      { type: "p", text: "Networking works. Especially in the UK." },
      { type: "p", text: "It’s uncomfortable, yes. But it’s what turns a stranger into a referral." },
      { type: "p", text: "Remember not lose yourself to the silence. The job will come. Just don’t let the search take away your spirit." },
    ],
  },
  {
    name: "Smirutha",
    quote: "From weekend retail to weekday wins at SurveySparrow.",
    image: "/mdx/mad-stories/mad-story-smirutha.jpeg",
    story: [
      {
        type: "p",
        text: "I didn’t prioritise job hunting when I should have. But I didn’t stop showing up either. And that made all the difference.",
      },
      {
        type: "p",
        text: "I moved to the UK in September 2023. It sounded like a dream on paper: one-year course, English-speaking country, and they accepted my three-year degree.",
      },
      {
        type: "p",
        text: "I imagined I’d figure it out along the way. But once I landed, my focus shifted. I was searching for accommodation, managing my coursework, and thankfully, I secured a part-time retail job in the first few months.",
      },
      {
        type: "p",
        text: "Job hunting became an on-and-off thing. I didn’t know how to approach it. I didn’t even realise how competitive it really was.",
      },
      { type: "p", text: "600+ job applications 8 interviews 2 offers 1 final job" },
      { type: "p", text: "My job search wasn’t structured. I applied to whatever looked possible. And most of the time, I got ghosted." },
      {
        type: "p",
        text: 'There were “scam” interview calls, too. I once sat through a "first round" that turned out to be a sales pyramid pitch disguised as a webinar.',
      },
      {
        type: "p",
        text: "Well, every rejection stung. But what hit harder was the confusion. I didn’t know what was working and what wasn’t.",
      },
      {
        type: "p",
        text: "Looking back now, I should’ve started earlier. I should’ve asked more questions. I should’ve treated the job hunt like a skill, not a side task.",
      },
      { type: "p", text: "But eventually, things began to shift." },
      { type: "p", text: "It started when I met Shaki. He helped me realise that I wasn’t lacking talent. I was just missing structure." },
      {
        type: "p",
        text: "He talked about having a niche, and that thought stayed with me. I began tweaking my CV using Unimad’s resume builder.",
      },
      {
        type: "p",
        text: "Each version taught me something. I kept refining and applying. The LinkedIn optimisation process was a game changer.",
      },
      {
        type: "p",
        text: "I started showing up with more intention, putting out content, and reaching out to recruiters without feeling like I was just shouting into the void.",
      },
      {
        type: "p",
        text: "I didn’t use a Value Proposition Document in the traditional sense, but the mindset of being one step ahead really helped me prepare. It gave me the edge in interviews.",
      },
      {
        type: "p",
        text: "In between all this, I joined Unimad as a content marketer. It wasn’t full-time, but it was the first time I felt like I belonged somewhere. Still, I knew I needed something more stable.",
      },
      { type: "p", text: "After a lot of thought, I made the tough call to return to India and continue the job search from home." },
      { type: "p", text: "It wasn’t part of the original plan, but it turned out to be exactly what I needed." },
      { type: "p", text: "Because soon after, I landed a full-time role." },
      { type: "p", text: "That journey taught me that it’s not about where you land first. It’s about whether you keep moving forward." },
      { type: "p", text: "Trust yourself, even when things get hard, because things will fall in place, and it will be worth the wait." },
    ],
  },
  {
    name: "Kushal",
    quote: "2 interviews. 2 offers. One life-changing yes at TopDog Law",
    image: "/mdx/mad-stories/mad-story-kushal.jpeg",
    story: [
      { type: "p", text: "Most people stop after they land their first job. I stayed in the market." },
      { type: "p", text: "That mindset made all the difference." },
      {
        type: "p",
        text: "I came to the UK looking for better opportunities in my field. No loan. No backup plan. Just the decision to go all in.",
      },
      {
        type: "p",
        text: "I started applying three months before graduation. I thought I was ahead of the curve. But I learnt quickly the curve doesn’t care unless you know how to play the game.",
      },
      { type: "p", text: "1,500 applications. 1,498 rejections. 2 interviews. 2 final rounds. 2 offers." },
      { type: "p", text: "I didn’t have part-time shifts or coursework weighing me down." },
      { type: "p", text: "What I did have was the mental weight of being ignored nearly 1,498 times." },
      { type: "p", text: "Silence became normal. Rejections became routine. But quitting was never an option." },
      { type: "p", text: "Everything changed when I shifted my approach from pushing to pulling." },
      { type: "p", text: "I stopped blindly applying and started focusing on positioning myself the right way." },
      { type: "p", text: "That’s when Unimad came in." },
      {
        type: "p",
        text: "Their LinkedIn Optimisation helped turn my profile from a resume dump to a personal marketing page showing who I was and what I could bring.",
      },
      { type: "p", text: "Opportunities started coming to me, and the ones that did actually made sense for who I was." },
      { type: "p", text: "You don’t need 50 interviews. You just need the right two." },
      { type: "p", text: "The first offer gave me a start." },
      { type: "p", text: "The second gave me alignment with my goals, my values, and my worth." },
      { type: "p", text: "And that only happened because I kept myself in the game." },
      { type: "p", text: "Even after winning the first round, I didn’t stop showing up." },
      {
        type: "list",
        items: ["Take control of your life.", "Don’t settle just because something finally worked.", "And always play the long game."],
      },
      { type: "p", text: "This wasn’t just a job hunt. It was a perspective shift." },
      { type: "p", text: "I’m not just building a career. I’m building a life that chooses me back." },
    ],
  },
  {
    name: "Madhumitha Dev",
    quote: "After 2,000 no’s, Solo was the one yes that mattered.",
    image: "/mdx/mad-stories/mad-story-madhumitha-dev.jpeg",
    story: [
      { type: "p", text: "I landed in the US with big dreams, a student loan, and the weight of making it all count in June 2024." },
      { type: "p", text: "I told myself I’d stay ahead. Apply early. Be consistent. Make every hour work in my favour." },
      { type: "p", text: "Six months into the programme, I started applying." },
      { type: "p", text: "First for part-time roles, then internships, and then full-time jobs. It felt like a race with no finish line." },
      { type: "p", text: "2,000+ applications 20 interviews 5 final rounds 3 offers" },
      {
        type: "p",
        text: "I managed it all using time boxing technique. Every hour was scheduled. Classes, job search, part-time shifts. But that didn’t make the silence easier.",
      },
      { type: "p", text: "Some days, not hearing anything hurt more than a rejection." },
      { type: "p", text: "Other days, I wondered if anyone out there was even reading my CV." },
      { type: "p", text: "Then came the lowest point." },
      {
        type: "p",
        text: "I finally got an offer. It felt like everything was finally falling into place. But before I could start, the offer was pulled.",
      },
      { type: "p", text: "Just like that, the relief I had waited months for disappeared." },
      { type: "p", text: "It was hard. It felt personal, even though it wasn’t." },
      { type: "p", text: "And for a moment, I wanted to stop trying altogether." },
      { type: "p", text: "But I didn’t." },
      { type: "p", text: "In January 2025, I joined Unimad. I didn’t expect a miracle. I just needed help moving forward." },
      { type: "p", text: "The Portfolio Builder helped me tell my story with clarity." },
      { type: "p", text: "Interviewers noticed. They mentioned it in interviews." },
      { type: "p", text: "The Value Proposition Document gave me confidence. It helped me stand out in final rounds." },
      { type: "p", text: "The Cover Letter Builder and LinkedIn Optimisation made me feel seen by the right people." },
      { type: "p", text: "And most importantly, there was Shaki. The one who reminded me of my worth when I had forgotten it myself." },
      { type: "p", text: "That’s when everything started to shift." },
      { type: "p", text: "I stopped trying to be perfect." },
      { type: "p", text: "I focused on being clear." },
      { type: "p", text: "Clear about what I bring to the table, who I am, and why I belong in the room." },
      {
        type: "p",
        text: "In March 2025, I started working. Not just any job, but one that came after everything had fallen apart. And that made it mean even more.",
      },
      { type: "p", text: "This journey taught me that rejection isn’t a verdict." },
      { type: "p", text: "It’s part of the process, which isn’t always visible." },
      { type: "p", text: "But if you keep showing up, it builds." },
      {
        type: "p",
        text: "Getting a job isn’t just about results. It’s about becoming the kind of person who is ready for what comes next.",
      },
      { type: "p", text: "So keep showing up, and keep improving." },
      { type: "p", text: "And when the door opens, walk through it knowing you earned every step that brought you there." },
      { type: "p", text: "Your story is just getting started." },
    ],
  },
  {
    name: "Janvi",
    quote: "I lost my job and visa, but found a new beginning with WORKHOME.",
    image: "/mdx/mad-stories/mad-story-janvi.jpeg",
    story: [
      {
        type: "p",
        text: "When I moved to the UK for my Master’s, I knew it wouldn’t be easy. But I came for growth, and I was ready to put in the work.",
      },
      {
        type: "p",
        text: "I took a loan, made a plan, and by the time I was halfway through my degree, I had already started job hunting.",
      },
      {
        type: "p",
        text: "With hope in one hand and a Google Sheet in the other, I tracked every hour of my day. I scheduled time for applications, research, and follow-ups like my future depended on it because it did.",
      },
      { type: "p", text: "I submitted over 1,000 applications. Landed 10 interviews. Reached the final round 3 times. Got 2 offers." },
      {
        type: "p",
        text: "By early 2024, things seemed to be working out. I had both a part-time and a full-time role, and I finally felt like all that effort had paid off.",
      },
      { type: "p", text: "But it didn’t last." },
      {
        type: "p",
        text: "The redundancy came without warning. Suddenly, the pressure of my visa returned overnight. I tried everything I could, but I couldn’t secure a new sponsor in time. And just like that, I had to leave the UK. No job. No backup plan. Just a return flight to India and a quiet sense of “what now?”",
      },
      {
        type: "p",
        text: "Back home, I gave myself one rule: I might need to settle financially, but I wouldn’t settle emotionally. I still wanted to grow. I still wanted to get better. That’s when I joined Unimad.",
      },
      {
        type: "p",
        text: "Unimad became my strategy lab. I used the CV builder to restructure my profile and the LinkedIn optimiser to present myself more clearly.",
      },
      {
        type: "p",
        text: "Unibot’s smart drafts made each application feel personal and intentional like I was finally telling the right story. More than anything, the platform helped me reflect. It pushed me to show not just what I had done, but where I wanted to go next.",
      },
      {
        type: "p",
        text: "Three months later, I landed a job. It wasn’t my dream role, but it was the first solid step in the right direction. And that was enough.",
      },
      {
        type: "p",
        text: "Because if there’s one thing this journey taught me, it’s this: sometimes you do everything right and still lose. But that doesn’t mean you’re lost. You just need to keep moving.",
      },
      {
        type: "p",
        text: "This journey wasn’t linear. I crossed countries, changed plans, and rebuilt from scratch. But I’ve learned to adapt. I’ve learned to lead with intention. And now, I’m back on track, not just with a job, but with clarity, structure, and a renewed sense of self.",
      },
      { type: "p", text: "Unimad helped me find that version of me. And from here, I’m only going forward." },
    ],
  },
  {
    name: "Vanshika",
    quote: "Two years of searching led me to Code Institute and back to myself.",
    image: "/mdx/mad-stories/mad-story-vanshika.png",
    story: [
      { type: "p", text: "There were nights I cried after interviews. Days when I didn’t recognise the person I was pretending to be." },
      { type: "p", text: "But I still showed up." },
      {
        type: "p",
        text: "I chose Ireland because it was affordable and the tech industry was growing. I took a loan, left home, and placed everything I had on one decision.",
      },
      {
        type: "p",
        text: "I graduated in 2023 and started job hunting right after. I didn’t know the right way to begin. I just knew I had to make it work.",
      },
      { type: "p", text: "2,000 applications. 1,984 rejections. 16 interviews. 8 final rounds. 1 offer." },
      { type: "p", text: "Balancing part-time work, university coursework, and job applications was exhausting." },
      { type: "p", text: "Some days, I had to choose between eating, sleeping, or applying to one more role." },
      { type: "p", text: "But the hardest part wasn’t the workload. It was what was happening inside." },
      { type: "p", text: "I started to lose confidence." },
      { type: "p", text: "I began acting like someone I wasn’t, hoping it would impress hiring managers. It didn’t." },
      { type: "p", text: "Each interview left me feeling more unsure of myself. Each rejection cut a little deeper." },
      { type: "p", text: "But I didn’t stop." },
      { type: "p", text: "I would cry at night, then wake up the next day and try again." },
      { type: "p", text: "The change came when I decided to stop pretending." },
      { type: "p", text: "I began showing up as myself. And I got intentional about my strategy." },
      { type: "p", text: "Unimad helped me turn it around." },
      {
        type: "p",
        text: "Their LinkedIn Optimisation helped recruiters find me. The Value Proposition Document gave me the edge to get interviews. Unibot made cold emails and CV customisation feel easier and smarter. Creating a portfolio helped me finally take ownership of my story.",
      },
      { type: "p", text: "I went from chasing companies to having companies notice me." },
      {
        type: "p",
        text: "This journey was never just about finding a job. It was about becoming someone who was ready to do the job well.",
      },
      {
        type: "p",
        text: "I learnt how to handle rejection without letting it define me, how to express my strengths without pretending to be someone else. And most importantly, how to keep going, even when it felt like no one was watching.",
      },
      {
        type: "p",
        text: "Be patient. Two years is not too long if it changes your life. Keep showing up. Even on the days you don’t feel like it. Never lose yourself. The right opportunity is for you, not for the version you think you need to become.",
      },
      { type: "p", text: "From feeling lost in May 2023 to landing the offer in April 2025, this journey gave me more than a job." },
      { type: "p", text: "It gave me myself back." },
      { type: "p", text: "And now, every rejection feels like it was guiding me to exactly where I was meant to be." },
    ],
  },
  {
    name: "Tejus",
    quote: "800 Applications. No plan B. This is what got me hired at Ultramed.",
    image: "/mdx/mad-stories/mad-story-tejus.jpg",
    story: [
      { type: "p", text: "No loan. No backup. No safety net." },
      { type: "p", text: "Just me, a one-year clock, and a spreadsheet full of rejections." },
      {
        type: "p",
        text: "Coming from India, I chose the UK because it was closer to home and the course would be over in a year. It felt fast, efficient, and full of promise.",
      },
      { type: "p", text: "I decided to go all in. No part-time jobs. No distractions. Just academics and job search." },
      { type: "p", text: "But I quickly learnt that giving everything doesn’t always mean getting something in return." },
      { type: "p", text: "800 applications. 790 rejections. 5 interviews. 1 final round. 1 offer." },
      { type: "p", text: "By the ninth month, I had barely heard back from anyone. I started questioning everything." },
      { type: "p", text: "Did I choose the wrong country?" },
      { type: "p", text: "Was I simply not good enough?" },
      {
        type: "p",
        text: "There were days when I refreshed my inbox 30 times, hoping for one reply. Days when I didn’t speak to anyone because I couldn’t handle another rejection.",
      },
      {
        type: "p",
        text: "Around me, everyone seemed to be busy with something - taking up part-time jobs, gigs, going to clubs, attending hackathons. I felt like I was standing still while others moved forward.",
      },
      { type: "p", text: "Things only began to change when I stopped doing more and started doing better." },
      { type: "p", text: "That shift came with Sharath and Unimad." },
      { type: "p", text: "With their help, I rebuilt everything: my CV, my LinkedIn, my strategy." },
      {
        type: "p",
        text: "The Resume Builder made my experience easier to understand. The LinkedIn framework helped me become visible to the right people. The cover letter tool helped me write with clarity and intent.",
      },
      { type: "p", text: "More importantly, I stopped applying to every job I saw. I started being intentional." },
      {
        type: "p",
        text: "I attended small community events. I reached out to people who inspired me. I focused on quality, not quantity.",
      },
      { type: "p", text: "I learnt that the job market doesn’t reward hard work, it rewards the right approach." },
      {
        type: "p",
        text: "You can apply to 1000 roles and still lose out to someone who applied to 10 with the right CV, the right outreach, and the right mindset.",
      },
      { type: "p", text: "I also realised that silence doesn’t mean you’ve failed. It just means your moment hasn’t arrived yet." },
      {
        type: "list",
        items: [
          "Network like your job depends on it. Because it does.",
          "Show your work. Don’t just talk about it.",
          "Ask for help. I couldn’t have done this without Sharath and Unimad.",
        ],
      },
      {
        type: "p",
        text: "From 800 applications to one offer, my story isn’t perfect. But it’s real. And it’s proof that focused effort is always better than blind hustle.",
      },
      {
        type: "p",
        text: "No shortcuts. No plan B. Just the right tools, the right people, and the belief that it’s still possible even when it feels like everything is going wrong.",
      },
    ],
  },
  {
    name: "Neha",
    quote: "I got my full-time role at Fumb Games after 2000+ rejections.",
    image: "/mdx/mad-stories/mad-story-neha.jpeg",
    story: [
      { type: "p", text: "I landed in the UK with big dreams, a student loan, and the weight of making it all count in June 2024." },
      { type: "p", text: "I told myself I’d stay ahead. Apply early. Be consistent. Make every hour work in my favour." },
      { type: "p", text: "Six months into the programme, I started applying." },
      { type: "p", text: "First for part-time roles, then internships, and then full-time jobs. It felt like a race with no finish line." },
      { type: "p", text: "2,000+ applications 20 interviews 5 final rounds 3 offers" },
      {
        type: "p",
        text: "I managed it all using time boxing technique. Every hour was scheduled. My classes, job search, part-time shifts. But that didn’t make the silence easier.",
      },
      {
        type: "p",
        text: "Some days, not hearing anything hurt more than a rejection. Other days, I wondered if anyone out there was even reading my CV.",
      },
      { type: "p", text: "Then came the lowest point." },
      {
        type: "p",
        text: "I finally got an offer. It felt like everything was finally falling into place. But before I could start, the offer was pulled.",
      },
      { type: "p", text: "Just like that, the relief I had waited months for disappeared." },
      { type: "p", text: "It was hard. It felt personal, even though it wasn’t. And for a moment, I wanted to stop trying altogether." },
      { type: "p", text: "But I didn’t." },
      { type: "p", text: "In January 2025, I joined Unimad. I didn’t expect a miracle. I just needed help moving forward." },
      { type: "p", text: "The Portfolio Builder helped me tell my story with clarity." },
      { type: "p", text: "Interviewers noticed. They mentioned it in interviews." },
      { type: "p", text: "The Value Proposition Document gave me confidence. It helped me stand out in final rounds." },
      { type: "p", text: "The Cover Letter Builder and LinkedIn Optimisation made me feel seen by the right people." },
      { type: "p", text: "And most importantly, there was Shaki. The one who reminded me of my worth when I had forgotten it myself." },
      { type: "p", text: "That’s when everything started to shift, I stopped trying to be perfect." },
      { type: "p", text: "I focused on being clear. Clear about what I bring to the table, who I am, and why I belong in the room." },
      { type: "p", text: "In March 2025, I started working." },
      { type: "p", text: "Not just any job, but one that came after everything had fallen apart. And that made it mean even more." },
      { type: "p", text: "This journey taught me that rejection isn’t a verdict." },
      { type: "p", text: "It’s part of the process, and it isn’t always visible." },
      { type: "p", text: "But if you keep showing up, it builds." },
      { type: "p", text: "Getting a job isn’t just about results." },
      { type: "p", text: "It’s about becoming the kind of person who is ready for what comes next." },
      { type: "p", text: "Keep showing up, and keep improving." },
      { type: "p", text: "Your story is just getting started." },
    ],
  },
  {
    name: "Manobharathi",
    quote: "I didn’t apply twice. I negotiated my way into HashiCorp.",
    image: "/mdx/mad-stories/mad-story-manobharathi.jpg",
    story: [
      { type: "p", text: "Most international student stories talk about ambition and career goals. Mine was about something more." },
      {
        type: "p",
        text: "Yes, I wanted to grow professionally. But choosing the UK for my master's was also about finding the right school for my daughter, creating a stable English-speaking environment for my family, and building a future we could all share.",
      },
      { type: "p", text: "The stakes were higher. The priorities were different." },
      {
        type: "p",
        text: "When I started my job search near the end of my course, I didn’t approach it with panic. I approached it strategically.",
      },
      { type: "p", text: "Over 50 job applications 10 interview calls 5 final rounds 3 job offers" },
      { type: "p", text: "That’s not something you hear often from international students. But then again, my journey wasn't like most." },
      {
        type: "p",
        text: "One of the biggest turning points came from an unexpected place. My previous employer, the one I had left to pursue this degree, reached out to me. They offered me my old role back. Same position, much better pay.",
      },
      { type: "p", text: "It felt good to be wanted. But that wasn’t the goal I had worked so hard for." },
      { type: "p", text: "Still, it gave me something I didn’t have before: leverage." },
      {
        type: "p",
        text: "I let the company I was truly interested in know about the offer. Things moved fast after that. Their timeline shortened. Their offer improved. Suddenly, I was in a position to choose what worked best for me and my family.",
      },
      { type: "p", text: "That’s the power of having options. Instead of waiting for luck, I was finally in control." },
      {
        type: "p",
        text: "Ofcourse, I made mistakes too. I spent more time applying and less time building real connections. If I could go back, I would start networking from the very first day.",
      },
      {
        type: "p",
        text: "The message templates from Unibot by Unimad helped me break the silence. They gave me the right words to reach out, to connect, and to stand out in a crowded job market.",
      },
      {
        type: "p",
        text: "Between July and October 2024, I made the shift from uncertain student to confident professional. From chasing roles to choosing one that truly aligned.",
      },
      {
        type: "p",
        text: "If you’re on this path, especially with family responsibilities, Stay patient. Learn from every rejection. And never forget what value you will add.",
      },
      { type: "p", text: "You don’t need dozens of offers. You just need the right one." },
      {
        type: "p",
        text: "Sometimes, the right offer comes when you know your worth, stay confident, and aren’t afraid to ask for what you deserve.",
      },
    ],
  },
  {
    name: "Shobhith",
    quote: "This is how I got hired at JLR without ever uploading a CV.",
    image: "/mdx/mad-stories/mad-story-shobhith.jpeg",
    story: [
      { type: "p", text: "I never uploaded my CV." },
      {
        type: "p",
        text: "While most international students send out hundreds, sometimes thousands of job applications, I sent around 100. But that’s not what got me the job.",
      },
      { type: "p", text: "What worked was the content I created. It brought the job to me." },
      {
        type: "p",
        text: "Like many others, I came to the UK on an education loan, ready to chase big dreams through a Master’s degree. I started applying for jobs as soon as the course began, thinking I was being smart by starting early.",
      },
      { type: "p", text: "But the responses I got were confusing." },
      {
        type: "p",
        text: "Some companies said I didn’t have enough experience. Others said I had too much, counting my freelance work against me. It felt like I was stuck in the middle, never quite the right fit.",
      },
      {
        type: "p",
        text: "Time wasn’t on my side either. Between classes and part-time work, I had to manage everything tightly. I followed a schedule and used the Pomodoro technique - working in focused 25-minute bursts to juggle applications, studying, and shifts.",
      },
      { type: "p", text: "Things finally changed when I changed my approach." },
      {
        type: "p",
        text: "Instead of sending endless applications, I started sharing what I knew. I posted regularly on LinkedIn: small insights, industry thoughts, things I was genuinely interested in.",
      },
      {
        type: "p",
        text: "That’s when Unimad stepped in. Their LinkedIn optimisation framework showed me what actually matters to recruiters. Their portfolio method helped me showcase my work clearly and confidently.",
      },
      { type: "p", text: "I didn’t know it then, but I was building a magnet." },
      {
        type: "p",
        text: "While I was busy studying or sleeping, my content was working for me, getting seen by people I’d never even reached out to.",
      },
      { type: "p", text: "Then it happened. A headhunter messaged me." },
      { type: "p", text: "They’d seen my posts, checked my profile, and wanted to talk." },
      { type: "p", text: "No CV. No application. Just a conversation and an offer for a contract role." },
      {
        type: "p",
        text: "Looking back, I do wish I’d reached out to more people directly. Because networking isn’t about collecting contacts; it’s about building real connections with people who care about the same things you do.",
      },
      { type: "p", text: "This is the one thing I will tell to those looking for a job:" },
      { type: "p", text: "Network. Talk to people. Share what you know." },
      { type: "p", text: "Don’t just apply for jobs. Show people what you bring to the table." },
      { type: "p", text: "Let your knowledge do the talking, even when you’re not in the room." },
      {
        type: "p",
        text: "Sometimes, the best way to get hired isn’t by knocking on doors, it’s by becoming the door people want to walk through.",
      },
    ],
  },
  {
    name: "Santhosh",
    quote: "From KFC shifts to Sophra Steria: My six-month survival story.",
    image: "/mdx/mad-stories/mad-story-santhosh.jpg",
    story: [
      { type: "p", text: "The smell of fried chicken isn't as appetising when it's soaked into your clothes after an eight-hour shift." },
      {
        type: "p",
        text: "I was an international student in the UK, juggling coursework by day and doing late-night shifts at KFC just to manage rent, bills, and endless number of job rejections. By the time I hit submit on application number 342 at 2 AM, I was emotionally drained and physically exhausted.",
      },
      { type: "p", text: "This was never part of the plan." },
      {
        type: "p",
        text: "When I moved to the UK in September 2022, I came with dreams: a shorter degree, global exposure, and a better future. But no one tells you how isolating, overwhelming, and frustrating the journey can be.",
      },
      { type: "p", text: "In six months:" },
      {
        type: "list",
        items: ["I submitted over 700 applications", "Landed just 5 interviews", "Reached 1 final round", "Received 1 offer"],
      },
      { type: "p", text: "On paper, that might sound like a win. But those numbers don't tell the full story." },
      {
        type: "p",
        text: "They don't show the exhaustion of waking up early to submit more applications before class, working late nights at KFC, and returning home past midnight. They don't show the silence after rejections, no feedback, no clarity, just constant self-doubt. They don't show the anxiety of an education loan weighing heavily on your future.",
      },
      {
        type: "p",
        text: "I actually started my job search from India, thinking I was ahead of the game. In reality, I was just getting a head start on rejection emails.",
      },
      { type: "p", text: "Everything changed when I met Shaki and Varun from Unimad." },
      {
        type: "p",
        text: "I didn't even know I was doing it all wrong until they broke it down for me, including how the UK job market works, and how different it is from India's.",
      },
      { type: "p", text: "My CV wasn't aligned. My LinkedIn was practically invisible. I had no clear strategy." },
      { type: "p", text: "Unimad gave me direction." },
      {
        type: "list",
        items: [
          "Their resume builder helped me restructure my story.",
          "The Value Proposition Doc helped me showcase my strengths.",
          "The LinkedIn optimisation made me discoverable by the right people.",
        ],
      },
      { type: "p", text: "For the first time, I wasn't just applying, but I was being seen." },
      { type: "p", text: "In January 2024, it finally happened." },
      { type: "p", text: "I got an offer: Payroll Processing Officer at Sopra Steria." },
      { type: "p", text: "From smelling like fried chicken to handling payrolls: that's my story." },
      {
        type: "p",
        text: "Looking back, I just wish I had found the right guidance sooner. I spent six months trying to figure it all out on my own.",
      },
      { type: "p", text: "Here's my advice:" },
      {
        type: "list",
        items: [
          "You don't have to do this alone.",
          "The UK job market is a different game, so know the rules.",
          "Seek help if you need. Stay consistent. And most importantly, believe in yourself.",
        ],
      },
      { type: "p", text: "Sometimes, all it takes is the right connection to change your story." },
    ],
  },
  {
    name: "Puneeth Bhuvan Shekar",
    quote: "From mixing drinks to campaign strategies, my life changed. ",
    image: "/mdx/mad-stories/mad-story-puneeth-bhuvan.jpeg",
    story: [
      { type: "p", text: "I came to the UK in September 2022." },
      {
        type: "p",
        text: "Soon enough, my classmates were busy planning their corporate takeovers, while I was learning the art of mixing the perfect cocktail. Bartending. The source of my valuable lessons.",
      },
      { type: "p", text: "The late shifts taught me more than I expected:" },
      {
        type: "list",
        items: ["How to read people in seconds", "The art of multitasking under pressure", "Working with a smile even at 2 AM"],
      },
      { type: "p", text: "By day, freelancing. By night, bartending. Somewhere in between, classes and sleep." },
      { type: "p", text: "Six months in, I started the real hunt. 1150 job applications. 1100 rejections. 45 interviews." },
      {
        type: "p",
        text: "There were calendar alerts for interviews between classes. The cover letters written during bar breaks. The LinkedIn profile updates at 3 AM after closing. It was rough.",
      },
      {
        type: "p",
        text: "I remember when I got an offer from Domino's – commission-only doorstep marketing. No fixed salary. So I said no. Some opportunities aren't opportunities at all.",
      },
      { type: "p", text: "What made the difference? Focus." },
      {
        type: "p",
        text: "When Unimad helped me reshape my CV and LinkedIn profile, I stopped trying to be everything to everyone. Instead, I highlighted what I was genuinely good at and made it public.",
      },
      {
        type: "p",
        text: "My bartending stories became interview gold. Managing difficult customers? Conflict resolution skills. Remembering complex orders during rush hour? Attention to detail under pressure. Upselling premium spirits? Sales skills.",
      },
      { type: "p", text: "June 2024. The email arrived: internship offer accepted." },
      {
        type: "p",
        text: "Looking back, I wish I'd explored opportunities beyond the UK earlier. The world is bigger than one country's job market.",
      },
      {
        type: "p",
        text: "But here's what I know for sure: Embrace every role, no matter how small. The skills from unexpected places– like measuring the perfect pour or dealing with a rude customer. They often become the unique edge that sets you apart.",
      },
      { type: "p", text: "That's my story. From late nights at the bar to late nights preparing presentations." },
      { type: "p", text: "Different path. Same destination." },
    ],
  },
  {
    name: "Abhishek Jayant",
    quote: "An Easy Apply strategy that actually worked.",
    image: "/mdx/mad-stories/mad-story-abhishek-jayant.png",
    story: [
      { type: "p", text: "My numbers tell a story of precision." },
      { type: "p", text: "2500 Applications with 2360 Rejections. 40 First rounds from which 4 final rounds. 1 OFFER." },
      { type: "p", text: "Mistake #1: Starting my job hunt after my thesis ended. Late." },
      { type: "p", text: "But when I started, I went ALL IN." },
      { type: "p", text: "Sheffield, England. Minimum wage admin job. 40 hours weekly. Comfortable, but super unfulfilling." },
      { type: "p", text: "I made the decision many would call crazy. I quit. No safety net. Just wanted to get a job in my field." },
      { type: "p", text: "Mid-October. The hunt began." },
      { type: "p", text: "My strategy was straight-forward:" },
      {
        type: "list",
        items: [
          "2 hours daily for applications",
          "30 minutes for Easy Apply (low effort, HIGH RETURN)",
          "3 hours daily for study and interview prep",
          "Focus on ONE job role, not five",
          "Practice my accent and English (so British recruiters could understand me)",
        ],
      },
      { type: "p", text: "Then it happened. On my graduation day. One day before my birthday. An offer. The BEST DAY OF MY LIFE." },
      { type: "p", text: 'Then comes the plot twist I never saw coming… Fast forward 10 months. London. That "dream job"? TOXIC.' },
      { type: "p", text: "Now the real challenge began. Finding a new role while surviving a high-pressure job." },
      { type: "p", text: "I balanced:" },
      {
        type: "list",
        items: [
          "Super stressful deadlines",
          "140G protein meals daily (if you know, you know..)",
          "Gym for weight training (my mental sanctuary)",
          "2 hours daily for interview prep",
          "4 days a week in the office",
          "Interviews from the balcony of my old office building",
        ],
      },
      { type: "p", text: "No parties. No distractions. Just learning, applying and self-improvement." },
      {
        type: "p",
        text: "One thing I’d tell you if you’re on a similar journey is: Don't customise your CV for every job. It's inefficient. Do it only for 2-3 jobs daily that seem made for you.",
      },
      { type: "p", text: "It's a numbers game once you've tackled the essentials." },
      { type: "p", text: "After 5 rounds of interviews with my new company, the result: Amazing offer. 30% HIKE. Sponsorship." },
      { type: "p", text: "I knew what I wanted and I was precise with my strategy." },
      {
        type: "p",
        text: "A LinkedIn profile I took SERIOUSLY. A resume that STOOD OUT (thanks to Unimad's guidance). An Easy Apply strategy that ACTUALLY WORKED.",
      },
      { type: "p", text: "Make a plan. Stick to it. Trust the process." },
    ],
  },
  {
    name: "Kajal Shrivastava",
    quote: "From parking services part time to software engineering full time.",
    image: "/mdx/mad-stories/mad-story-kajal-shrivastava.jpg",
    story: [
      { type: "p", text: "The winter in Cleveland is brutal." },
      {
        type: "p",
        text: "I discovered this firsthand while working parking services at Cleveland State University to sustain as a student, my very first job in America.",
      },
      { type: "p", text: "Not exactly what I had envisioned when I came to the US to pursue my Master's in Computer Science." },
      { type: "p", text: "But life happens…" },
      { type: "p", text: "The job wasn't glamorous. It wasn't tech like I wanted. But it was something." },
      {
        type: "p",
        text: "Then came the promotion to Desk Assistant. Later, Teaching Assistant for Analysis of Algorithms and Introduction to Database Systems. Small steps forward.",
      },
      { type: "p", text: "This was just a part of the bigger picture." },
      { type: "p", text: "1,000+ applications. Career fairs. Handshake. LinkedIn. Monster. Indeed. Dice. You name it, I tried it." },
      { type: "p", text: "The responses were all just silence Quite deafening to be real." },
      {
        type: "p",
        text: "Days turned to weeks, then months. With each rejection, my hope of landing a tech job slowly slipped away. My confidence took a dive. Even friendships that were once my support system slipped under this growing anxiety.",
      },
      { type: "p", text: "The 90-day OPT countdown to find a job breathed down my neck like a ticking time bomb." },
      { type: "p", text: "The pressure was ON. Find a job or leave the country." },
      { type: "p", text: "Then August 2024, a friend's referral. A small ray of hope." },
      { type: "p", text: "September 2, 2024, an offer." },
      { type: "p", text: "Relief, a bit. Excitement, sure. Victory, not quite?" },
      { type: "p", text: "West Virginia. Far from where I'd imagined. Salary? Well below average for software engineering." },
      { type: "p", text: "But it was a job. It was “experience”. It meant staying in America." },
      {
        type: "p",
        text: "The journey taught me something profound: sometimes the job you get isn't the job you wanted. But it might be the job you need.",
      },
      {
        type: "p",
        text: "Every day in parking services taught me customer service. Every hour as a TA built up my technical knowledge. Every rejection built resilience.",
      },
      {
        type: "p",
        text: "The professional-looking resume I created with Unimad's builder might have helped me stand out in that final referral. But the journey itself was all perseverance.",
      },
      {
        type: "p",
        text: "Today, I'm still working. Still learning. Still searching for that ideal opportunity that aligns with my long-term goals.",
      },
      { type: "p", text: "But I'm here. I'm employed. I'm adapting." },
      { type: "p", text: "And perhaps that's the real victory, learning to thrive in the imperfect one while keeping your dreams alive." },
      { type: "p", text: "Perseverance and adaptability. That's the real learning of an international student." },
    ],
  },
  {
    name: "Hitesh",
    quote: "Value Proposition Document was the real game changer",
    image: "/mdx/mad-stories/mad-story-hitesh.jpeg",
    story: [
      { type: "p", text: '"I haven\'t come this far to only come this far."' },
      { type: "p", text: "Something that I held onto so tight." },
      {
        type: "p",
        text: "The words that changed my perspective on those nights when packing my bags for India seemed like the only way out.",
      },
      { type: "p", text: "I perfectly planned for UK. MSc Management. No one plans for 1,580 rejections." },
      { type: "p", text: "I started with my applications, typically, a spreadsheet filled with all the companies I applied to." },
      { type: "p", text: "The spreadsheet grew. 100 applications. 500. 1,000. 1,500." },
      { type: "p", text: 'Each "unfortunately" email broke me down little by little.' },
      {
        type: "p",
        text: "There were days where I felt like I was on the right path. Writing the perfect cold emails, sending thoughtful LinkedIn messages, feeling like I was making real connections.",
      },
      { type: "p", text: "Then came the dry spells. The silence and the ghosting." },
      { type: "p", text: 'The number of times I have felt like "What am I doing wrong?" or "Should I just go home?" is innumerable.' },
      {
        type: "p",
        text: 'The roller coaster never stopped. Up with hope. Down with rejections. Up with an interview invitation. Down with "we\'ve decided to proceed with other candidates."',
      },
      { type: "p", text: "Throughout it all, two things made the difference." },
      {
        type: "p",
        text: "First, that document that made recruiters notice me. The Value Proposition Document, something most candidates don't bother with. It showed not just skills on paper, but initiative in action. In a job market like in the UK, where standing out is everything, this extra bit of effort spoke volumes.",
      },
      {
        type: "p",
        text: "Second, the mindset shift. I realised something profound; it wasn't just my CV that needed to be improved. It was me.",
      },
      { type: "p", text: "Every rejection taught me something about myself, about the job market, about what employers truly value." },
      {
        type: "p",
        text: "Had I started applying from day one of my MSc, perhaps the journey would have been shorter. But then again, perhaps I needed every one of those 1,580 rejections to become the person who deserved that one acceptance.",
      },
      { type: "p", text: "Twelve months. Twenty interviews. Five final rounds." },
      { type: "p", text: 'Then one day: "Hi Hitesh, we would like to offer you..."' },
      { type: "p", text: "I read those words and thought of all the times I nearly quit. It was a victory!" },
      {
        type: "p",
        text: "So to you reading this right now: Easy never changed anything. The path isn't meant to be smooth. Make those changes – in your documents, in your approach, in yourself.",
      },
      { type: "p", text: "And remember," },
      { type: "p", text: "you haven't come this far to only come this far." },
    ],
  },
  {
    name: "Ramanathan Kathiresan",
    quote: "Persistence pays off. Just hang in there and you’ll be fine.",
    image: "/mdx/mad-stories/mad-story-ramanathan-kathiresan.jpeg",
    story: [
      { type: "p", text: "Don't lose hope." },
      { type: "p", text: "That's it. That's the story." },
      { type: "p", text: "But if you want the details, here we go…" },
      { type: "p", text: "September 12, 2022 to March 26, 2024." },
      { type: "p", text: "18 months. 1000 job applications. 985 rejections. 15 interviews. 8 final rounds. 1 offer." },
      { type: "p", text: "I chose the UK for my masters because of the one-year duration. Seemed efficient to me." },
      { type: "p", text: "Six months in, I started applying. The patterns were pretty clear." },
      { type: "p", text: "Generic CVs led to automatic rejection." },
      {
        type: "p",
        text: "What I did to cut through the ATS was modifying my CV for each application. Not just tweaking a few words, but customising it to make sure it aligned with each role.",
      },
      { type: "p", text: "Unimad's CV builder made the constant modifications manageable. Simple to understand. Practical to apply." },
      {
        type: "p",
        text: "I wish I'd focused on CV customisation earlier. Each rejection taught me to sharpen this strategy until it finally broke through.",
      },
      { type: "p", text: "18 months is a long time to maintain hope. There were dark days." },
      { type: "p", text: "But I understood that the difference between success and failure in this journey isn't talent or luck." },
      { type: "p", text: "It's persistence." },
      { type: "p", text: "So again, don't lose hope." },
    ],
  },
  {
    name: "Sarita",
    quote: "Time waits for no one, so your job search shouldn't either.",
    image: "/mdx/mad-stories/mad-story-sarita.jpeg",
    story: [
      { type: "p", text: "Start early. Start early. START EARLY." },
      {
        type: "p",
        text: "If I could go back and shake myself to belief to do something when I landed in the UK would be those two words.",
      },
      {
        type: "p",
        text: "I chose the UK for my masters for practical reasons. It was cheaper than the US and just a one-year course. Seemed efficient.",
      },
      { type: "p", text: "Six months into my MSc journey, I finally began my job search. That's when reality hit." },
      { type: "p", text: "800 job applications. 792 rejections. 8 interviews. 5 final rounds. 2 offers. 9 months of my life." },
      {
        type: "p",
        text: "The numbers tell a story of perseverance, but they don't show how difficult it really was. Working part-time, with all the coursework, and the relentless job hunt pushed me to my limits daily.",
      },
      {
        type: "p",
        text: "I hadn't expected it to be this tough. Nobody tells you that landing a job as an international student feels impossible.",
      },
      { type: "p", text: "My turning point?" },
      { type: "p", text: "Finding the right tools and approach." },
      {
        type: "p",
        text: "I discovered Unimad's cover letter builder halfway through my job hunt, and it transformed how I presented myself to employers. Before this, my applications were generic and forgettable. With Unimad, each application became more targeted, more compelling, more authentically me. I started receiving responses where before there was silence.",
      },
      { type: "p", text: "March 2023 to December 2023. Nine months of constant effort, rejection, and learning." },
      { type: "p", text: "What I wish I'd known from day one:" },
      {
        type: "p",
        text: "The day I received my first offer, I almost couldn't believe it. After months of rejection, the validation was overwhelming. When the second offer came, giving me something I hadn't had in months: a choice.",
      },
      { type: "p", text: "The journey is difficult. But with the right approach, tools, and mindset, it's not impossible." },
      {
        type: "p",
        text: "Start early, from your very first week. Stay focused, even when rejection feels endless. Succeed, because with enough persistence and strategy, you will.",
      },
    ],
  },
  {
    name: "Keerthana",
    quote: "1-month job search worked when others failed.",
    image: "/mdx/mad-stories/mad-story-keerthana.jpeg",
    story: [
      { type: "p", text: "Here’s my shortest journey to a job. Strategy was everything." },
      { type: "p", text: "12 applications. 11 rejections. 1 interview. 1 offer. 1 month." },
      { type: "p", text: "That's my entire job search story." },
      {
        type: "p",
        text: "While others talk about hundreds of applications and months of struggle, I took a different approach after completing my Master of Social Work.",
      },
      { type: "p", text: "Quality over quantity." },
      { type: "p", text: "Deep preparation over mass applications." },
      { type: "p", text: "Standing out instead of blending in." },
      { type: "p", text: "It started with a simple realisation: being just another resume in the pile wasn't going to cut it." },
      { type: "p", text: "I needed something that would make recruiters pause." },
      { type: "p", text: "Something most candidates don't bother with." },
      { type: "p", text: "Something that would showcase not just what I've done, but who I am and the value I bring." },
      {
        type: "p",
        text: "That's when I discovered the power of a comprehensive portfolio (Thanks Unimad) and the Value proposition document",
      },
      { type: "p", text: "Think about it, how many social work graduates actually create a portfolio?" },
      { type: "p", text: "How many take the time to visually map out their skills, experiences, and unique value proposition?" },
      { type: "p", text: "Almost none." },
      { type: "p", text: "I became that one-in-a-thousand candidate who took the extra step." },
      { type: "p", text: "Each rejection taught me something." },
      { type: "p", text: 'Each "no" refined my approach.' },
      { type: "p", text: "I wasn't just applying to jobs; I was learning, adapting, and improving with every submission." },
      {
        type: "p",
        text: "My portfolio wasn't just a collection of past work, it told them my unique story and showcased my approach to social work, my philosophy, my case studies (anonymised, of course), and the significant impact of my interventions.",
      },
      { type: "p", text: "The Visual Profile Document crystallised my value proposition in a way no resume could." },
      { type: "p", text: 'It answered the question every employer is really asking: "Why you over everyone else?"' },
      { type: "p", text: "From June to July. That's all it took." },
      { type: "p", text: "One month from start to finish." },
      {
        type: "p",
        text: "Not because I was lucky. Not because the job market was easy. But because I approached the process strategically, focusing on standing out rather than standing in line.",
      },
      { type: "p", text: "Looking back, would I change anything about my journey?" },
      { type: "p", text: "Not a thing." },
      { type: "p", text: "To those still on their journey:" },
      {
        type: "p",
        text: "Remember that it's not always about how many applications you send. Sometimes, it's about making those few applications count.",
      },
      { type: "p", text: "Network strategically because meaningful connections often open doors that job applications alone can't." },
      { type: "p", text: "And remember, every setback is a step toward success if you're willing to learn from it." },
      { type: "p", text: "The mad story isn't always about endurance. Sometimes, it's about precision." },
    ],
  },
  {
    name: "Neha Nadiger",
    quote: "Part-time at H&M to a Product Manager at Milestone.",
    image: "/mdx/mad-stories/mad-story-neha-nadiger.jpeg",
    story: [
      { type: "p", text: "Libraries became my second home. Studying was secondary, but building my network was my focus." },
      {
        type: "p",
        text: "Every conversation with seniors, students from other countries, and industry professionals was a small investment that I was making to learn everything I could about life, career and my industry.",
      },
      {
        type: "p",
        text: "How does a Product Management aspirant from India navigate the competitive job market in the UK while juggling coursework, part-time jobs, and a focused job search strategy?",
      },
      {
        type: "p",
        text: "September 2022 was the beginning of my journey at Bayes Business School. Filled with ambition but facing the reality of being an international student in a competitive market.",
      },
      {
        type: "p",
        text: "What followed was a testament to strategic planning, resilience, and the delicate art of balancing immediate needs with long-term goals.",
      },
      { type: "p", text: "These are my key learnings:" },
      {
        type: "p",
        text: "The 24 hours we all have can be your greatest asset or your worst limitation. Working 20-hour weeks during term and 40-hour weeks during breaks at McDonald's and H&M taught me to protect my prime hours.",
      },
      {
        type: "p",
        text: "Those precious morning hours when fresh job listings appeared, when my brain worked best, and when LinkedIn connections were most responsive, I jumped and guarded them fiercely, even if it meant serving fries until midnight.",
      },
      {
        type: "p",
        text: "My strategy translated to results: 500 applications, 10 first rounds, 4 final rounds, and eventually that one crucial offer – all because I prioritised my most valuable hours.",
      },
      {
        type: "p",
        text: "My dissertation wasn't just another academic requirement – it was a portfolio piece. Each project was deliberately chosen to align with the Product Management roles I was targeting.",
      },
      {
        type: "p",
        text: "When professors assigned open-ended projects, I strategically selected topics that would enhance my portfolio and provide talking points in interviews.",
      },
      { type: "p", text: "This changed my academic journey into building credentials that would eventually matter in the job market." },
      {
        type: "p",
        text: "Tesla was my almost-story, but what a chapter it was. I networked with an employee in the exact role I was interviewing for, prepped until I could answer questions in my sleep, and crafted my story so compellingly that I knew I'd performed exceptionally well.",
      },
      {
        type: "p",
        text: "Though I didn't get the job, standing toe-to-toe with one of the world's most competitive companies confirmed I wasn't just dreaming anymore. These experiences, reaching the final rounds with Tesla, networking my way into Women In Product UK, securing an internship in Product Management at an AI startup, became powerful narrative elements in subsequent interviews.",
      },
      {
        type: "p",
        text: "When Unimad entered my journey, my approach gained precision. Their modules didn't just help me build a CV but forced me to articulate who I am, what I've achieved, and what makes me unique.",
      },
      {
        type: "p",
        text: "The Value Proposition Document was something enormously helpful, allowing me to clearly communicate my strengths and relevance to recruiters and professionals.",
      },
      {
        type: "p",
        text: "The focus on specific titles and industries transformed my job search from broad shots in the dark to targeted, strategic applications.",
      },
      { type: "p", text: "Looking back, I'd change three things:" },
      { type: "list", items: ["Be clear about my niche from Day 1", "Start the job search from Day 1", "Be consistent as hell"] },
      {
        type: "p",
        text: "But would I change those late McDonald's shifts? The exhausting H&M weekends? The library networking marathons?",
      },
      { type: "p", text: "Not a chance." },
      {
        type: "p",
        text: "Because two years of sweat, and tears shaped me into someone who could land an Associate Product Manager role at Milestone Inc., a US-based company.",
      },
      {
        type: "p",
        text: "This journey offered more than just a job but built foundations that make you a winner in life. The international student experience isn't just about securing employment; it's about transformation. It redefines your perspective, capabilities, and understanding of what you can achieve under pressure.",
      },
      { type: "p", text: "Just believe you can do it, and you will." },
    ],
  },
  {
    name: "Sripathi Venkat",
    quote: "Master’s is just a gate-pass. It doesn’t guarantee a job.",
    image: "/mdx/mad-stories/mad-story-sripathi-venkat.jpeg",
    story: [
      { type: "p", text: "60% with a job beats 85% without one." },
      { type: "p", text: "That's the cold, hard truth I wish someone had told me before I boarded that flight to the UK." },
      {
        type: "p",
        text: "Football brought me here. Ironic, really. My passion for the beautiful game became the tiebreaker between UK and US universities. The home of football won, ofcourse. But I quickly learned that in the job market was a whole different play all together.",
      },
      { type: "p", text: "My timeline looks neat on paper:" },
      { type: "list", items: ["September 26, 2022: Landed in the UK", "December 2023: Graduated", "July 2024: Landed the job"] },
      {
        type: "p",
        text: "What that timeline doesn't show? The 700-800 applications. The 10 interviews. The 2 final rounds. The number of days I had wondered if I'd made a massive mistake.",
      },
      {
        type: "p",
        text: "I realised late that Master's degree is just a gatepass. A ticket into the country. Not the golden ticket everyone thinks it is.",
      },
      {
        type: "p",
        text: "Don't get me wrong – I'm not saying not to study. But that distinction you're killing yourself for, is not worth it",
      },
      { type: "p", text: "It won't matter when your PSW is halfway gone and you're still unemployed." },
      {
        type: "p",
        text: "My first mistake was waiting until 2 months after my course ended to get serious about job hunting. By then, my classmates who started on day one already had their foot in doors.",
      },
      {
        type: "p",
        text: "The juggle was real. Part-time work for rent and bills, coursework for the degree, and job hunting for the future. One thing I stuck to was to never lose sight of the true goal. A job. Not grades.",
      },
      { type: "p", text: "What changed the game were two things (thanks to Unimad):" },
      {
        type: "p",
        text: "The truth is, I was lucky. I had some freelance/contract work from January 2023 that kept me afloat. But luck isn't a strategy.",
      },
      {
        type: "p",
        text: 'If I could teleport back to September 2022 and tell myself one thing, I\'d say: "Start now. Not tomorrow. Not after midterms. NOW."',
      },
      { type: "p", text: "A decent 60-65% and working your socks off from Day 1 to land a job > Getting 85% but ending up jobless." },
      { type: "p", text: "That's not being pessimistic. That's being a realist." },
    ],
  },
  {
    name: "Meghana Navin",
    quote: "Final round rejections to a UX Specialist.",
    image: "/mdx/mad-stories/mad-story-meghana-navin.jpg",
    story: [
      { type: "p", text: '"We regret to inform you...”' },
      { type: "p", text: "Email #2,142." },
      { type: "p", text: "You'd think it gets easier." },
      { type: "p", text: "It doesn't." },
      { type: "p", text: "But let me back up." },
      {
        type: "p",
        text: "September 2022, I moved to Birmingham with 3 suitcases to a bunker-sized student accommodation with all ambitions.",
      },
      {
        type: "p",
        text: "I had a polished portfolio. I had earned a distinction in Design Management I quite literally thought it would be fairly easy to get a job.",
      },
      { type: "p", text: "It wasn’t." },
      { type: "p", text: "So at that time, you take what you get, right?" },
      {
        type: "p",
        text: 'I took a role as a teaching assistant while hunting for design jobs. I went about creating freelance projects that paid in "exposure." And I even got a UI/UX role with “promised” payments which am still waiting on.',
      },
      { type: "p", text: "All I could do at that time was to keep going." },
      { type: "p", text: "As time went by, my application numbers kept climbing. 20 applications became 200 200 became 2000" },
      { type: "p", text: "Rejections got more creative than the last" },
      { type: "p", text: '"Great portfolio, but..." "Impressive background, however..." "We\'ll keep your profile on file..."' },
      { type: "p", text: "I almost switched to Customer Success. (Because dreams are nice, but student loans are real)" },
      { type: "p", text: "Then Unimad happened. I never thought something as simple as 3Cs on LinkedIn could change my life." },
      { type: "p", text: "Connect. Comment. Create." },
      { type: "p", text: "Suddenly my design journey had a new interface: Less perfect More authentic Better results" },
      { type: "p", text: "July 2024: Application #2,160 goes out Radio silence Life moves on Until it doesn't" },
      { type: "p", text: "I got a call from Astellas Pharma. 5 rounds of interviews 5 months of waiting 1 perfect match" },
      { type: "p", text: "November 28, 2024: Not just any design role Omnichannel UX Design and Channel Specialist" },
      { type: "p", text: "Remember those 3 suitcases? They're still here But now they hold more than dreams They carry proof" },
      { type: "p", text: "That sometimes The best designs Come from the messiest journeys" },
    ],
  },
  {
    name: "Pranathi",
    quote: "Key skills > Perfect applications any day.",
    image: "/mdx/mad-stories/mad-story-pranathi.jpeg",
    story: [
      { type: "p", text: '"Just keep going" sounds like generic advice.' },
      { type: "p", text: "Until it's 3 AM and you're juggling freelance work, part-time jobs, and another rejection email." },
      { type: "p", text: "I'm Pranathi, and this is my story of stubborn determination." },
      { type: "p", text: "In July 2024, I chose to do my Management Masters in the UK." },
      { type: "p", text: "Had my share of dreams, determination, and yes, student loans." },
      { type: "p", text: "Ready to set sail into this chaotic world, or at least land a job." },
      {
        type: "p",
        text: "1000+ applications later, I learned something: Everyone tells you to customise yourself for each company. I chose to focus on my key skills instead.",
      },
      { type: "p", text: "Because authenticity beats desperation every single time." },
      { type: "p", text: "Sure, it was tough." },
      {
        type: "p",
        text: 'The moment companies saw "international student" or "visa sponsorship," conversations ended. But here\'s the thing about being stubborn–you keep going anyway.',
      },
      {
        type: "p",
        text: "I tried everything. Remote work. Digital nomad roles. Freelancing. Whatever it took to build my skills while making ends meet.",
      },
      { type: "p", text: "Then thankfully Unimad happened. Not just another CV builder." },
      {
        type: "p",
        text: "More like that friend who stops your overthinking and shows you the way forward. I used so much of Unibot’s help for my CVs and cover letters.",
      },
      { type: "p", text: "Their tools didn't ask me to reinvent myself. Instead, they helped me showcase what was already there." },
      { type: "p", text: "No more desperate customisation. Just myself, presented better." },
      { type: "p", text: "12 interviews. 1 offer. That's all it took." },
      { type: "p", text: "Know your key skills. Work on them relentlessly. Trust yourself." },
      { type: "p", text: "The door will open when the time comes." },
      { type: "p", text: "Mad Story? Maybe. But it's authentically mine. 🤟" },
    ],
  },
  {
    name: "Sakshi",
    quote: "McD part time to an Account Manager full time.",
    image: "/mdx/mad-stories/mad-story-sakshi.jpeg",
    story: [
      { type: "p", text: "Success isn't about perfect plans." },
      { type: "p", text: "For me it was about crying after McDonald's shifts and still showing up the next day." },
      {
        type: "p",
        text: "Back to July 2023, what started as my dad’s dream of seeing his daughter at a prestigious UK university led me here today.",
      },
      { type: "p", text: 'I got into University of Leeds. All set to have my "perfect" life.' },
      { type: "p", text: "Reality hit fast." },
      {
        type: "p",
        text: 'I wish someone had told me about the physical toll of working 25 hours at McDonald\'s while your mind refuses to believe that "this" was the life you chose. Those lonely walks home, questioning every life decision.',
      },
      { type: "p", text: "August 2024, something had to give. Did something either brave or completely mad." },
      { type: "p", text: "I quit McDonald's, moved back to India." },
      { type: "p", text: "No safety net. No plan B." },
      { type: "p", text: "Just pure determination and student loans breathing down my neck." },
      {
        type: "p",
        text: "Then came that onboarding call with Shaki. You know those moments when everything suddenly clicks? That was Unimad for me.",
      },
      {
        type: "p",
        text: "It wasn't about throwing out hundreds of applications anymore. It became about strategy. About turning those McDonald's experiences into stories of resilience. About being genuine in a world of perfect LinkedIn profiles.",
      },
      { type: "p", text: "Funny thing about authenticity is that it works." },
      {
        type: "p",
        text: "When I stopped hiding my McDonald's experience and started owning it, something shifted. Employers didn't see desperation anymore. They saw determination.",
      },
      {
        type: "p",
        text: "The breakthrough didn't come instantly. It came through rebuilding. Through learning that each rejection was teaching me something.",
      },
      { type: "p", text: "Looking back, starting 8 months into my MSc was too late. This madness needed more time than I thought." },
      {
        type: "p",
        text: "If you’re relating to what you’re reading now, remember to keep pushing, keep growing, and most importantly, keep believing in yourself.",
      },
      { type: "p", text: "Sometimes, the maddest stories have the happiest endings." },
    ],
  },
  {
    name: "Sanjanaa",
    quote: "Got a Plan B? Mine needed to have Plan F.",
    image: "/mdx/mad-stories/mad-story-sanjanaa.jpeg",
    story: [
      { type: "p", text: "Life has a funny way of teaching us that the best stories rarely follow a straight line." },
      {
        type: "p",
        text: "Hi, I am Sanjanaa Thiruvadi, and my mad story begins with rejections. I was all set for my Masters in the US - great university, and had the perfect plan. Then boom, my visa got rejected. GOSH, right?",
      },
      {
        type: "p",
        text: 'What followed next was a lot of chaos and what I remember was me being on my way to the University of Bath in the UK for a 1 year course. I didn’t know this "Plan B" would turn into one of the maddest, most growth-intensive chapters of my life.',
      },
      {
        type: "p",
        text: "Just when I thought I had it figured out, landing a dream job with a Big Four firm before I graduated - life threw another curveball. The offer letter had a start date a year away, and six months in, visa rules changed. Offer revoked.",
      },
      {
        type: "p",
        text: "It was painful, to put it decently. If there's one thing I learned (the hard way), it's that silver today is worth more than diamonds tomorrow. Time truly is King in this mad journey!",
      },
      {
        type: "p",
        text: "Being from a middle-class family with student loans, I couldn't just focus on studies and job hunting. I did some questionable part-time jobs before finally landing a stable retail position.",
      },
      {
        type: "p",
        text: "The academic part was manageable, but cracking the job market was the challenge. The gap between my understanding and reality was massive, and every rejection email (there were many!) made me question everything.",
      },
      {
        type: "p",
        text: "Then came Unimad. Their CV builder saved me from Word formatting nightmares, and I used their Value Proposition Document for cold emailing recruiters. Getting candid feedback from Shaki was exactly what I needed. I soon realised everyone's job search journey is unique - copying others' strategies just didn't work for me.",
      },
      {
        type: "p",
        text: "From September 2022 to September 2024, my journey has been more about rejections than success, more about falling down than standing tall. But that ONE job offer made it all worth it. Now I'm here in London, with a 9-5 I can proudly call my own (though I still gotta get that visa sponsored, boys!).",
      },
      {
        type: "p",
        text: "To everyone out there on their own mad journey: start early, stay consistent through the rejections, and expect volatility. And please, take care of yourself - physically and mentally. Stay hydrated, hit the gym, and never underestimate the power of a self-care Sunday with friends.",
      },
      {
        type: "p",
        text: "If I had to start it all over, I’d jump on those part-time applications the moment you land in the UK, first dibs on initial vacancies can be a super helpful.",
      },
    ],
  },
  {
    name: "Anwesha",
    quote: "Building a personality that just couldn’t be ignored.",
    image: "/mdx/mad-stories/mad-story-anwesha.jpeg",
    story: [
      { type: "p", text: '"What if I fail?" became "What can I learn?”' },
      { type: "p", text: "That's how my journey started 11 months ago." },
      {
        type: "p",
        text: "I really wanted to try something different. That's how I decided on Ireland for my Masters. It was the 'right' country for me for a fresh start.",
      },
      { type: "p", text: "Ofcourse, it came with a whole lot of 'what ifs'." },
      {
        type: "p",
        text: "The numbers obviously say one part of my story. I applied to 329 jobs in which I was 313 times rejected and ended up with 4 offers.",
      },
      { type: "p", text: "But my story is all in my mindset change." },
      {
        type: "p",
        text: "When rejections started coming in, I soon realised that if I have to survive this, I needed to keep me grounded.",
      },
      { type: "p", text: "So, I created a routine. And I followed it like my life depended on it." },
      { type: "p", text: "It was hard. Really hard, to be honest. But it became my anchor." },
      { type: "p", text: "My biggest lesson wasn't about job hunting at all. It was about building something bigger than a resume." },
      { type: "p", text: "About becoming someone I was proud of." },
      {
        type: "p",
        text: "I wanted to stand out of the crowd. And I understood that the only way for me to do it was to built a personality for myself that can’t be ignored. I wanted a presence that could not be ignored.",
      },
      { type: "p", text: "And with Unimad, I found the way to do it." },
      { type: "p", text: "I found my way of standing out." },
      { type: "p", text: "Today, I am more than happy to have a clarity, and know my direction." },
      {
        type: "p",
        text: "To everyone starting this journey, take this as a reminder to put yourself out. That could be what gets you hired.",
      },
      { type: "p", text: "Build that first and the rest will follow." },
    ],
  },
  {
    name: "Dhana",
    quote: "From £6.5/hour to a remote US job from India.",
    image: "/mdx/mad-stories/mad-story-dhana.jpg",
    story: [
      { type: "p", text: "Success rarely looks like what you imagined." },
      { type: "p", text: "Sometimes it means working at an off-license store to build character." },
      { type: "p", text: "Sometimes it means going back home to move forward." },
      { type: "p", text: "My story begins like most international students'. I thought I had it figured out. I didn't." },
      {
        type: "p",
        text: "Getting a part-time job was probably the first challenge that came my way. From afar, it looked so simple. While others seemed to land jobs easily, I struggled. Like really struggled.",
      },
      {
        type: "p",
        text: "And most people don't talk about the loneliness. Living far from home meant dealing with relationship misunderstandings and personal battles. Many nights, I felt completely alone in this massive challenge I was facing.",
      },
      {
        type: "p",
        text: "I worked wherever I could. A warehouse. A restaurant. An off-license shop for £6.50 an hour. No one tells you about those sleepless Saturday nights dealing with hostile crowds when you're dreaming about studying abroad.",
      },
      { type: "p", text: "Then came my 'bulb' moment. I realised why I was here." },
      { type: "p", text: "I wasn't here to jump from one survival job to another. I had come to build a career." },
      {
        type: "p",
        text: "So I made the hardest decision that I had to take. I quit my restaurant job, saved enough for three months, and threw myself completely into the full-time job hunt.",
      },
      { type: "p", text: "I didn't chase the big names like others. Instead, I focused on roles that fit my niche." },
      { type: "p", text: "Personalised every cover letter. Tailored every CV. Made countless cold calls." },
      { type: "p", text: "But nothing worked. Not one thing." },
      {
        type: "p",
        text: "Eventually, I returned to India, torn between staying or finding a way back to the UK. Life felt so uncertain, and I was sinking.",
      },
      { type: "p", text: "But I held onto one thing. My goal. My goal of securing a full-time role." },
      { type: "p", text: "That's when Unimad came into the picture. After talking with Shaki, I began rebuilding." },
      { type: "p", text: "Fixed my LinkedIn presence. Built a proper portfolio. Connected with professionals." },
      { type: "p", text: "Actually started showcasing my work." },
      { type: "p", text: "Then something shifted." },
      { type: "p", text: "Instead of me chasing opportunities, they started finding me." },
      { type: "p", text: "Recruiters began reaching out." },
      { type: "p", text: "Finally landed a remote role with a dollar salary and the freedom to work from anywhere." },
      { type: "p", text: "It was THE breakthrough that made every struggle worth it." },
      { type: "p", text: "Looking back, I wish I'd started earlier." },
      { type: "p", text: "Everything - the part-time hunt, the networking, the profile building." },
      {
        type: "p",
        text: "An early on part-time job could have given me the breathing room to focus on what really mattered which is my career goals.",
      },
      {
        type: "p",
        text: "So here's my advice: Start early. Don't wait. The earlier you begin, the more time you have to build something meaningful.",
      },
      { type: "p", text: "Because sometimes, success means taking the long way home." },
    ],
  },
  {
    name: "Divya",
    quote: "How I landed a job as an international student with no work experience.",
    image: "/mdx/mad-stories/mad-story-divya.jpg",
    story: [
      { type: "p", text: "When I landed in the UK on September 17, 2022, I had my share of dreams, determination, and a student loan." },
      {
        type: "p",
        text: "I was ready and prepared with all my research about my course, about the universities and what they had to offer.",
      },
      {
        type: "p",
        text: "I chose the UK for its solid management programs. But no course could have prepared me for the rollercoaster of job hunting as an international student.",
      },
      { type: "p", text: "2 months into my MSc, I started my journey to secure a job." },
      { type: "p", text: "1500+ applications → 1491 rejections (or ghostings) → 9 interviews → 2 final rounds → 1 precious offer." },
      { type: "p", text: "Each silent response and rejection tested my patience. There were days when I questioned everything." },
      {
        type: "p",
        text: "It was a learning journey in itself to juggle between a part-time desk job, my coursework and being consistent with job application.",
      },
      { type: "p", text: "Nothing has taught me about time management and prioritisation than my time as an international student." },
      { type: "p", text: "In my job search journey, I made sure I did everything in my power to stand out." },
      {
        type: "p",
        text: "I got creative with having presentations ready whenever I had an interview to showcase my skills and my personality.",
      },
      { type: "p", text: "This often led me to land the next round of interview." },
      { type: "p", text: "The turning point was when I discovered Unimad." },
      { type: "p", text: "Two things that made a difference:" },
      {
        type: "p",
        text: "– LinkedIn Optimisation: After interviews, I'd see company views on my profile. It was proof that a strong LinkedIn presence mattered.",
      },
      {
        type: "p",
        text: "– Value Proposition Document (VPD): The VPD, especially its 30-60-90 day plan, fit perfectly with my eventual employer's onboarding process.",
      },
      {
        type: "p",
        text: "There was a point when I stopped applying altogether. The rejections were overwhelming. But with support from the Unimad community and my determination, I pushed through.",
      },
      { type: "p", text: "On August 16, 2024, nearly 20 months into my job search, I landed my full-time job." },
      { type: "p", text: "My 2 cents for anyone on this journey would be to keep pushing." },
      { type: "p", text: "It's okay to not be okay. Whatever you're feeling - happy, sad, or frustrated - keep going." },
      { type: "p", text: "Don't be afraid to ask for help or try new approaches. Remember, you're one day closer to your goal." },
      {
        type: "p",
        text: "Every rejection brought me closer to the right opportunity. And Unimad gave me the tools to seize it when it came.",
      },
    ],
  },
  {
    name: "Sri Ramya",
    quote: "Wires to Wins, here’s how I engineered my American Dream.",
    image: "/mdx/mad-stories/mad-story-sri-ramya.jpg",
    story: [
      { type: "p", text: "August 2022 marked the beginning of my big American dream, but my journey started long before that." },
      { type: "p", text: "For 3 years, I chased a job in Electrical Engineering, facing my share of struggles. But persistence paid off." },
      {
        type: "p",
        text: "I chose the US for a solid course structure in my field. With a student loan and a full tuition waiver, I was set to make the most of this opportunity.",
      },
      { type: "p", text: "Four months before graduation, I fully got into my job search journey." },
      {
        type: "p",
        text: "I was able to manage coursework, part-time work, and job hunting all through systemic planning and time management.",
      },
      { type: "p", text: "300 applications, 30 rejections, 6 interviews, 3 final rounds, and finally, 1 job offer." },
      { type: "p", text: "All in just one month!" },
      { type: "p", text: "I can't emphasise how crucial Unimad's Value Proposition Document (VPD) was in my job search." },
      {
        type: "p",
        text: "Before, I focused solely on showcasing my skills and projects. The VPD made me realise something valuable that companies need to know how I'll add value to them.",
      },
      { type: "p", text: "It wasn't just about what I could do, but how I could make a difference." },
      { type: "p", text: "Looking back, would I change anything? Surprisingly, no. Every step led me to where I am today." },
      { type: "p", text: "From landing in the USA to securing a job in my dream field, it's been a ride." },
      {
        type: "p",
        text: "The pay might not be the best, but I'm building my career in a field I've poured my heart, time, and resources into.",
      },
      { type: "p", text: "To anyone out there still in this journey: Never give up! Your persistence will pay off." },
      { type: "p", text: "Remember, it's not just about the destination, but the growth you experience along the way." },
      { type: "p", text: "Keep pushing, keep learning, and your time will come." },
    ],
  },
  {
    name: "Varsha",
    quote: "996 No’s and 1 Yes. The one offer letter that changed everything. ",
    image: "/mdx/mad-stories/mad-story-varsha.jpg",
    story: [
      {
        type: "p",
        text: "Right after my Bachelors, I decided to do my Masters in Finance in the UK because it was the known financial hub.",
      },
      { type: "p", text: "Starting my MSc, I knew the real challenge wasn't the degree. It was landing a job after." },
      {
        type: "p",
        text: "Four months in, I started applying for Graduate Scheme programs in the UK. But little did I know what was about to come.",
      },
      { type: "p", text: "It wasn't until January 2024 that I truly dove in, customising my CV, and intensely applying for jobs." },
      { type: "p", text: "This was the start of an intense job search that reshaped my entire approach to job hunting." },
      { type: "p", text: "1000+ applications → 996 rejections → 4 interviews → 2 final round rejections → 1 offer." },
      {
        type: "p",
        text: "Each rejection was a lesson which made me question everything, but every interview that I had was a ray of hope.",
      },
      { type: "p", text: "A huge moment of realisation that you only need one ‘YES’ that could change your life." },
      {
        type: "p",
        text: "If there's one thing I could change about this entire journey, it would be starting earlier with a more strategic approach.",
      },
      { type: "p", text: "But hindsight is 20/20, and every step led me to where I am today." },
      {
        type: "p",
        text: "Unimad played a huge role in my job search, specifically, the LinkedIn Optimisation and Value Proposition Document.",
      },
      { type: "p", text: "It was after the onboarding call with Shaki, that I started using LinkedIn to my benefit." },
      {
        type: "p",
        text: "The Value Proposition document was something that I hadn’t come across before which played a huge role in my job offer.",
      },
      { type: "p", text: "It allowed me to stand out as an applicant, clearly articulating my unique value to potential employer." },
      {
        type: "p",
        text: "In a job market where everyone looks good on paper, this VPD helped me show why I wasn't just a good fit, but the best fit.",
      },
      { type: "p", text: "To those still on this journey, here's my two cents:" },
      { type: "p", text: "There are countless strategies and success stories out there." },
      { type: "p", text: "Understand them, but don't just copy them. Create your own version." },
    ],
  },
  {
    name: "Ilan",
    quote: "From picking orders, brewing coffees to becoming a Design Lecturer.",
    image: "/mdx/mad-stories/mad-story-ilan.jpg",
    story: [
      {
        type: "p",
        text: "UK was my third option to do my Masters. I never thought I'd end up here, but when my first 2 choices didn't work out, UK became my destination.",
      },
      { type: "p", text: "I knew that real challenge was landing a job after. Seven months into my Masters, I started my job search." },
      {
        type: "p",
        text: "Juggling wasn't easy. Coursework on weekdays, job search in the evenings, and part-time work on weekends. But I kept going.",
      },
      { type: "p", text: "I applied to over 100 jobs, faced 95 rejections, got 4 interviews, 2 final rounds, and finally 1 offer." },
      { type: "p", text: "The Value Proposition Document by Unimad played an important role in my job search." },
      {
        type: "p",
        text: "It made me feel more accountable about the advertised job role and genuinely made me think how I would add value to the company.",
      },
      { type: "p", text: "It resonated with my belief in going the extra mile." },
      {
        type: "p",
        text: "If there's one thing I could change about this entire journey, it would be focusing more on upskilling and staying active on LinkedIn from the start.",
      },
      { type: "p", text: "My journey was a long, challenging one, but worth it." },
      { type: "p", text: "To those still on this journey, here's my two cents:" },
      { type: "p", text: "Keep going! Never give up! There's always light at the end!" },
      { type: "p", text: "P.S. The other thing I learned – some job ads are fake. Stay patient, stay persistent." },
    ],
  },
  {
    name: "Aarthi",
    quote: "From a broke student to remote full-time offer in 365 days.",
    image: "/mdx/mad-stories/mad-story-aarthi.JPEG",
    story: [
      { type: "p", text: "My journey to find a job in the UK was like a wild rollercoaster ride, full of surprises and challenges." },
      { type: "p", text: "But, I was determined to make it work." },
      {
        type: "p",
        text: "I didn't expect that this decision would lead me on a tough adventure, trying to survive and discover more about myself.",
      },
      { type: "p", text: "I only had £500 in my account for my October rent." },
      { type: "p", text: "I had to find a part-time job immediately without relying on my parents for money." },
      {
        type: "p",
        text: "So, my goal was clear – get a part-time job related to my writing and editing skills, not just to pay bills, but to make a place for myself in a new country.",
      },
      {
        type: "p",
        text: "After many rejected job applications, I finally got relief when I landed a part-time position related to content. Phew! First success!",
      },
      { type: "p", text: "But the real challenge came in only later, UK’s competitive job market." },
      { type: "p", text: "Initially, I thought doing well in my studies would automatically get me a job in the UK." },
      { type: "p", text: "Only later I realised it was a joke. I was completely wrong!" },
      { type: "p", text: "I began my full-time job hunt in my second semester." },
      {
        type: "p",
        text: "This became the routine, applying to many jobs on LinkedIn, Indeed, and other job portals, waking up to rejection emails, and ignored applications and messages.",
      },
      { type: "p", text: "It was tough, and I felt unsure and scared, but I didn't give up." },
      {
        type: "p",
        text: "Things slightly took a turn when I improved my LinkedIn profile, posted content regularly, and connected with people in my field.",
      },
      {
        type: "p",
        text: "A few weeks later, I received an email mentioning that I made it to the next round for a job I had applied to. This was the opportunity I had been waiting for!",
      },
      {
        type: "p",
        text: "I considered it to be my only chance (literally), and if I didn't succeed, I didn't know when I would get another.",
      },
      {
        type: "p",
        text: "The tables didn’t turn in one night. It took months of finding the right direction, being persistent, and determined.",
      },
      { type: "p", text: "The journey wasn't easy." },
      { type: "p", text: "It had doubts and tough moments, but each time things didn't work out, I learnt to give it another try." },
      { type: "p", text: "Getting the job offer is still a big win for me, not just in my career but personally too." },
      { type: "p", text: "What did I learn? When you mix passion with not giving up, you can get through tough times." },
      { type: "p", text: "Things may change, but it's crucial to believe in yourself, work hard, and do your best." },
      { type: "p", text: "And remember, this is just the beginning!" },
    ],
  },
  {
    name: "Shaki",
    quote: "Flipping burgers at KFC to a Growth hacker at Polybase.",
    image: "/mdx/mad-stories/mad-story-shaki.jpg",
    story: [
      {
        type: "p",
        text: "Landing a full-time job in the UK is a pure perseverance play. It’s okay if you are rejected a 1000 times, but you need to get selected only once.",
      },
      {
        type: "p",
        text: "Sharath Leelakrishnan here, obviously that’s a long Indian name and didn’t really go well in the UK. So it became Shaki.",
      },
      {
        type: "p",
        text: "On September 9th 2021, I entered the UK with 2 suitcases, 400 pounds and a lot of dreams and hopes but with a very specific mission of making it out.",
      },
      {
        type: "p",
        text: "Unlike most of you I didn’t come here to study, I came here to crack a job here that would help earn in pounds. Didn’t really care which domain I am cracking in.",
      },
      {
        type: "p",
        text: "I tried multiple domains like Software Engineering, Cybersecurity, also tried Quant Financing for a bit just to later realise that none of them would work for me.",
      },
      {
        type: "p",
        text: "6 months passed in this mess and this is the time I started freaking out. So I decided I’ll fix one role and channel all my time and focus mastering a specific role.",
      },
      { type: "p", text: "That was exactly the time when Cryptocurrencies, NFTs were on the rise. I started reading more on it." },
      {
        type: "p",
        text: "I felt it was super interesting and from that point on I lived my life with one motive which is to crack a full-time job in web3.",
      },
      { type: "p", text: "I was able to understand the tech and a lot of people were struggling to uncover the same." },
      { type: "p", text: "So I decided to start a campaign called, #Learnweb3in60days breaking down crucial web3 concepts each day." },
      { type: "p", text: "After 1 week of posting content, I got a 1-month freelance contract for 1000 pounds." },
      {
        type: "p",
        text: "This is the time when it became addiction. I started posting more content, connecting with more people and tried to build an authentic profile.",
      },
      { type: "p", text: "In 60 days, I started receiving interviews. I obviously didn’t crack it in the 1st interview." },
      { type: "p", text: "It took sometime, eventually I was able to crack a remote-full time job in the UK." },
      {
        type: "p",
        text: "Trust me, that was one of the biggest wins in my life so far. I got that offer exactly on the last day of my Uni and it gave me a mad story to tell.",
      },
      { type: "p", text: "I then decided why not help my close friends have a mad story as well. I was quite successful at that." },
      { type: "p", text: "We came together and decided why not help every student pursuing masters abroad have their own Mad Story." },
      {
        type: "p",
        text: "Unimad was born. You having a mad story is our mad story. I am not saying it’s easy, all I am saying is it’s fucking worth it.",
      },
      { type: "p", text: "We are on a mission to create a million mad stories." },
      { type: "p", text: "You getting a job here is GREATNESS. You helping 1000s of other students get a job, that’s MADNESS." },
      { type: "p", text: "In our opinion MADNESS >>>> GREATNESS" },
      { type: "p", text: "Mad Life Mad Vibes 🤟" },
    ],
  },
];

export function madStorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findMadStoryBySlug(slug: string): MadStory | undefined {
  return MAD_STORIES.find(story => madStorySlug(story.name) === slug);
}

export const MAD_STORY_SLUGS = MAD_STORIES.map(story => madStorySlug(story.name));
