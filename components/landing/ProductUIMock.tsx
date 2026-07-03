type ProductUIMockProps = {
  productId: string;
};

function ResumeMock() {
  return (
    <div className="pui-app">
      <div className="pui-subhead">
        <div className="pui-subhead-l">
          <span className="pui-back" aria-hidden />
          <span>Product Design Resume</span>
        </div>
        <div className="pui-subhead-r">
          <span className="pui-pill pui-pill--green">All changes saved</span>
          <span className="pui-pill">
            ATS Score: <strong>87</strong>
          </span>
        </div>
      </div>
      <div className="pui-main">
        <div className="pui-rail" aria-hidden>
          <span className="pui-rail-i" />
          <span className="pui-rail-i on" />
          <span className="pui-rail-i" />
        </div>
        <div className="pui-side">
          <p className="pui-panel-h">Experience</p>
          <div className="pui-card">
            <p className="pui-card-title">
              Creative Lead <em>at</em> <b>Unimad</b>
            </p>
            <div className="pui-row2">
              <span className="pui-field">Creative Lead</span>
              <span className="pui-field">Unimad</span>
            </div>
            <div className="pui-row2">
              <span className="pui-field">Oct 2023</span>
              <span className="pui-field ph">Present</span>
            </div>
            <span className="pui-field">Chennai</span>
            <ul className="pui-bullets">
              <li>Led design solutions to improve user experience and business growth.</li>
              <li>Used UX/UI skills to make AI-driven products easier to use.</li>
            </ul>
          </div>
        </div>
        <div className="pui-preview">
          <div className="pui-paper">
            <p className="pui-name">Abhijit Suresh</p>
            <p className="pui-contact">workwithabhijitsuresh@gmail.com · +918667075249 · Chennai, India</p>
            <p className="pui-sec-h">Work Experience</p>
            <div className="pui-role">
              <div className="pui-role-top">
                <strong>Creative Lead</strong>
                <span>Oct 2023 – Present</span>
              </div>
              <div className="pui-role-sub">
                <span>Unimad</span>
                <span>Chennai</span>
              </div>
              <ul>
                <li>Led design solutions to improve user experience and business growth.</li>
                <li>Used UX/UI skills to make AI-driven products easier to use.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobsMock() {
  return (
    <div className="pui-app">
      <div className="pui-subhead">
        <div className="pui-subhead-l">
          <span>Job applications</span>
        </div>
        <div className="pui-subhead-r">
          <span className="pui-pill">12 active</span>
        </div>
      </div>
      <div className="pui-list">
        {["Product Designer · Coursera", "UX Designer · Globant", "Design Lead · Unimad"].map(row => (
          <div key={row} className="pui-list-row">
            <span>{row}</span>
            <span className="pui-tag">Applied</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkedInMock() {
  return (
    <div className="pui-app">
      <div className="pui-subhead">
        <div className="pui-subhead-l">
          <span>LinkedIn audit</span>
        </div>
        <div className="pui-subhead-r">
          <span className="pui-pill pui-pill--green">Score: 82</span>
        </div>
      </div>
      <div className="pui-audit">
        <div className="pui-audit-row">
          <span>Headline</span>
          <span className="pui-tag ok">Strong</span>
        </div>
        <div className="pui-audit-row">
          <span>About section</span>
          <span className="pui-tag">Needs work</span>
        </div>
        <div className="pui-audit-row">
          <span>Experience</span>
          <span className="pui-tag ok">Good</span>
        </div>
        <div className="pui-audit-row">
          <span>Featured</span>
          <span className="pui-tag">Missing</span>
        </div>
      </div>
    </div>
  );
}

function PortfolioMock() {
  return (
    <div className="pui-app pui-app--center">
      <div className="pui-browser">
        <div className="pui-browser-bar" aria-hidden />
        <div className="pui-browser-body">
          <p className="pui-name">Abhijit Suresh</p>
          <p className="pui-contact">Product Designer · Portfolio</p>
          <div className="pui-grid">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewsMock() {
  return (
    <div className="pui-app">
      <div className="pui-subhead">
        <div className="pui-subhead-l">
          <span>Interview prep</span>
        </div>
        <div className="pui-subhead-r">
          <span className="pui-pill">Product Designer</span>
        </div>
      </div>
      <div className="pui-chat">
        <p className="pui-q">Tell me about a time you made a product decision with incomplete data.</p>
        <span className="pui-field ph">Type your answer or speak…</span>
        <p className="pui-feedback">Strong opening. Add a specific metric for more impact.</p>
      </div>
    </div>
  );
}

function ContentLabMock() {
  return (
    <div className="pui-app">
      <div className="pui-subhead">
        <div className="pui-subhead-l">
          <span>Content Lab</span>
        </div>
        <div className="pui-subhead-r">
          <span className="pui-pill">2 scheduled</span>
        </div>
      </div>
      <div className="pui-posts">
        <div className="pui-post">
          <p>After 200+ applications, I figured out what was missing. It wasn&apos;t my skills. It was my story…</p>
          <span className="pui-tag">Today · 9:00 AM</span>
        </div>
        <div className="pui-post muted">
          <p>The one thing nobody tells you about LinkedIn profiles…</p>
          <span className="pui-tag">Tomorrow · 8:30 AM</span>
        </div>
      </div>
    </div>
  );
}

export function ProductUIMock({ productId }: ProductUIMockProps) {
  switch (productId) {
    case "resume":
      return <ResumeMock />;
    case "jobs":
      return <JobsMock />;
    case "linkedin":
      return <LinkedInMock />;
    case "portfolio":
      return <PortfolioMock />;
    case "interviews":
      return <InterviewsMock />;
    case "content-lab":
      return <ContentLabMock />;
    default:
      return <ResumeMock />;
  }
}
