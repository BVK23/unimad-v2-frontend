export const ppl = [
  { name: "Anwesha", out: "329 apps → 3 offers, landed one she loves" },
  { name: "Tejus", out: "800 rejections → life-changing offer" },
  { name: "Kushal", out: "Chasing roles → remote US job from India" },
] as const;

export const revLines = ["Recruiters decide in 7 seconds.", "Your personal brand", "decides for them."] as const;

export const feats = [
  {
    cat: "Resume",
    title: "ATS-Friendly Resume Builder",
    desc: "Craft resumes that pass applicant tracking systems and impress real humans. Outcome-driven templates for every field — with 1-click tailored variations per job.",
    mock: "resume",
  },
  {
    cat: "LinkedIn",
    title: "LinkedIn Optimisation & AI Audit",
    desc: "AI audits your entire LinkedIn profile and generates improved headlines, summaries, and experience copy — so recruiters find you first.",
    mock: "linkedin",
  },
  {
    cat: "LinkedIn",
    title: "Content Generator & Scheduler",
    desc: "Generate and schedule LinkedIn posts that build your professional presence consistently. Plus a browser extension to instantly draft comments and DMs.",
    mock: "content",
  },
  {
    cat: "Outreach",
    title: "LinkedIn Messages & Cover Letters",
    desc: "Personalised cold outreach messages and tailored cover letters in seconds — matched to the specific role and company every single time.",
    mock: "outreach",
  },
  {
    cat: "Portfolio",
    title: "Portfolio Maker for All Fields",
    desc: "No tech skills needed. Build a professional portfolio for any field — Tech, Design, Finance, Healthcare, Business, Creative, and more.",
    mock: "portfolio",
  },
  {
    cat: "Jobs",
    title: "Personalised Job Portal",
    desc: "Discover jobs tailored to your exact profile. No irrelevant scrolling — only roles that genuinely match your background and goals.",
    mock: "jobs",
  },
  {
    cat: "Tracking",
    title: "Application Tracker",
    desc: "Track every application in one clean board. Know exactly where you stand, what needs a follow-up, and what is next — without the chaos.",
    mock: "tracker",
  },
  {
    cat: "Content Lab",
    title: "One-click Application Prep",
    desc: "Tailored resume, cover letter, and cold email for each job — all generated in a single click. Apply smarter and faster without starting from scratch.",
    mock: "oneclick",
  },
  {
    cat: "Interview",
    title: "Mock Interviews",
    desc: "Practice interviews tailored to your target role and industry. Walk into the real thing confident and prepared, not hoping for the best.",
    mock: "interview",
  },
] as const;

export const mocks: Record<(typeof feats)[number]["mock"], string> = {
  resume: `<div class="mc"><div class="mh"><div class="mht">Resume Score</div><div class="mbadge">ATS Ready</div></div><div class="mrow"><span class="mlbl">ATS Match</span><div class="mbar"><div class="mbar-fill" style="width:92%"></div></div><span class="mscore">92%</span></div><div class="mrow"><span class="mlbl">Keywords</span><div class="mbar"><div class="mbar-fill" style="width:88%"></div></div><span class="mscore">88%</span></div><div class="mrow"><span class="mlbl">Formatting</span><div class="mbar"><div class="mbar-fill" style="width:96%"></div></div><span class="mscore">96%</span></div><div class="mdiv"></div><div class="mfield"><div class="mflbl">Experience bullet</div><div class="mfval">Increased revenue by 34% through data-driven campaigns</div></div><div class="mfield"><div class="mflbl">Skills</div><div class="mfval">Python · SQL · Tableau · Power BI</div></div><div class="mbtn">Generate 1-click variation →</div></div>`,
  linkedin: `<div class="mc"><div class="mh"><div class="mht">LinkedIn Audit</div><div class="mbadge">Score: 84</div></div><div class="mrow"><span class="mlbl">Headline</span><div class="mbar"><div class="mbar-fill" style="width:60%;background:#E67E22"></div></div><span class="mscore" style="color:#E67E22">60%</span></div><div class="mrow"><span class="mlbl">Summary</span><div class="mbar"><div class="mbar-fill" style="width:45%;background:#E67E22"></div></div><span class="mscore" style="color:#E67E22">45%</span></div><div class="mrow"><span class="mlbl">Experience</span><div class="mbar"><div class="mbar-fill" style="width:80%"></div></div><span class="mscore">80%</span></div><div class="mdiv"></div><div class="mfield" style="background:var(--blue-dim);border:0.5px solid var(--blue-bd)"><div class="mflbl">AI suggested headline</div><div class="mfval">Data Analyst | Turning Complex Data Into Business Growth | Open to Opportunities</div></div><div class="mbtn">Apply AI suggestions →</div></div>`,
  content: `<div class="mc"><div class="mh"><div class="mht">Content Lab</div><div class="mbadge">2 Scheduled</div></div><div class="mpost"><div class="mptop"><div class="mpav">YO</div><div><div class="mpname">Your Name</div></div></div><div class="mptext">After 200+ applications, I finally understood what was missing. It wasn't my skills. It was my story...</div><div class="msched"><div class="mschedt">Today · 9:00 AM</div><div class="mschedd"></div></div></div><div class="mpost" style="opacity:0.55"><div class="mptop"><div class="mpav">YO</div><div><div class="mpname">Your Name</div></div></div><div class="mptext">The one thing no one tells you about LinkedIn profiles...</div><div class="msched"><div class="mschedt">Tomorrow · 8:30 AM</div><div class="mschedd" style="background:var(--ink3)"></div></div></div><div class="mbtn">Generate next post →</div></div>`,
  outreach: `<div class="mc"><div class="mh"><div class="mht">Cold Outreach</div><div class="mbadge">Personalised</div></div><div class="mfield"><div class="mflbl">Target role</div><div class="mfval">Product Manager · Spotify</div></div><div class="mfield"><div class="mflbl">Your background</div><div class="mfval">3 yrs PM · fintech · grew transactions 40%</div></div><div class="mdiv"></div><div class="mfield" style="background:var(--blue-dim);border:0.5px solid var(--blue-bd)"><div class="mflbl">Generated message</div><div class="mfval" style="line-height:1.6">Hi Sarah, I noticed Spotify is scaling payments — my work at Monzo growing transaction volume by 40% directly aligns. Would love 15 mins.</div></div><div class="mbtn">Generate cover letter too →</div></div>`,
  portfolio: `<div class="mc"><div class="mh"><div class="mht">Portfolio Builder</div><div class="mbadge">Live</div></div><div class="mpi"><div class="mpt"></div><div><div class="mpti">Case Study: Revenue Growth</div><div class="mpts">Finance · Q3 2024</div></div></div><div class="mpi"><div class="mpt" style="background:#E1F0FB;border-color:#B5D4F4"></div><div><div class="mpti">UX Redesign: Checkout Flow</div><div class="mpts">Product Design · 2024</div></div></div><div class="mpi"><div class="mpt" style="background:#EAF3DE;border-color:#C0DD97"></div><div><div class="mpti">Market Expansion Strategy</div><div class="mpts">Business · APAC Region</div></div></div><div class="mbtn">Publish your portfolio →</div></div>`,
  jobs: `<div class="mc"><div class="mh"><div class="mht">Job Matches</div><div class="mbadge">Tailored for you</div></div><div class="mjob"><div class="mjlogo">SP</div><div><div class="mjtitle">Product Manager</div><div class="mjco">Spotify · London</div></div><div class="mjmatch">94% match</div></div><div class="mjob"><div class="mjlogo">GG</div><div><div class="mjtitle">Data Analyst</div><div class="mjco">Google · Remote</div></div><div class="mjmatch">91% match</div></div><div class="mjob"><div class="mjlogo">AM</div><div><div class="mjtitle">Business Analyst</div><div class="mjco">Amazon · Manchester</div></div><div class="mjmatch">88% match</div></div><div class="mbtn">Apply with 1-click prep →</div></div>`,
  tracker: `<div class="mc"><div class="mh"><div class="mht">Application Tracker</div><div class="mbadge">12 active</div></div><div class="mtr"><div class="mts so">Offer</div><div><div class="mtco">Spotify</div><div class="mtro">Product Manager</div></div></div><div class="mtr"><div class="mts si">Interview</div><div><div class="mtco">Google</div><div class="mtro">Data Analyst</div></div></div><div class="mtr"><div class="mts sa">Applied</div><div><div class="mtco">Amazon</div><div class="mtro">Business Analyst</div></div></div><div class="mtr"><div class="mts sa">Applied</div><div><div class="mtco">Monzo</div><div class="mtro">Senior PM</div></div></div><div class="mbtn">Add new application →</div></div>`,
  oneclick: `<div class="mc"><div class="mh"><div class="mht">1-click Prep</div><div class="mbadge">Ready in 3s</div></div><div class="mfield"><div class="mflbl">Target job</div><div class="mfval">Senior UX Designer · Airbnb</div></div><div class="mdiv"></div><div class="mrow"><span class="mlbl" style="width:110px;font-size:9px">Tailored Resume</span><div class="mbar"><div class="mbar-fill" style="width:100%"></div></div></div><div style="margin-bottom:6px"></div><div class="mrow"><span class="mlbl" style="width:110px;font-size:9px">Cover Letter</span><div class="mbar"><div class="mbar-fill" style="width:100%"></div></div></div><div style="margin-bottom:6px"></div><div class="mrow"><span class="mlbl" style="width:110px;font-size:9px">Cold Email</span><div class="mbar"><div class="mbar-fill" style="width:100%"></div></div></div><div class="mbtn">All 3 ready — Download →</div></div>`,
  interview: `<div class="mc"><div class="mh"><div class="mht">Mock Interview</div><div class="mbadge">Product Manager</div></div><div class="miq"><div class="miqt">Tell me about a time you made a product decision with incomplete data. What was your process?</div><div class="miqi">Type your answer or speak...</div></div><div class="mdiv"></div><div class="mfield"><div class="mflbl">AI Feedback</div><div class="mfval" style="color:var(--green);font-size:10px;line-height:1.6">Strong opening. Consider adding specific metrics. Use STAR method for better clarity.</div></div><div class="mbtn">Next question →</div></div>`,
};

export const ribbonItems = [
  { bg: "#4A7FE8", initials: "AB", story: "30% salary hike + visa sponsorship", name: "Abhishek" },
  { bg: "#7B5EA7", initials: "AN", story: "3 offers, landed one she loves", name: "Anwesha" },
  { bg: "#2D9CDB", initials: "TE", story: "life-changing offer after 800 rejections", name: "Tejus" },
  { bg: "#27AE60", initials: "RA", story: "full-time offer within 1 month", name: "Ramya" },
  { bg: "#E67E22", initials: "KU", story: "remote US job, working from India", name: "Kushal" },
  { bg: "#D63484", initials: "AA", story: "UK job offer with £500 to her name", name: "Aarthi" },
  { bg: "#16A085", initials: "SA", story: "UX role at Globant after 750 rejections", name: "Sarada Priya" },
  { bg: "#8E44AD", initials: "DI", story: "made it after 1,500 applications", name: "Divya" },
] as const;
