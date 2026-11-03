import "./App.css";
import { experience, profile } from "./profile.js";

const focusAreas = [
  {
    number: "01",
    title: "Teams with direction.",
    description:
      "Thoughtful planning, clear priorities, and space for people to develop. Strong teams need more than a backlog.",
    tags: ["Team development", "Engineering planning"],
  },
  {
    number: "02",
    title: "Platforms you can trust.",
    description:
      "A practical focus on reliability, observability, and the operating habits that help teams understand the systems they own.",
    tags: ["Platform reliability", "Operational clarity"],
  },
  {
    number: "03",
    title: "Ownership that is clear.",
    description:
      "Connecting security and quality work to the people who can act on it. Making responsibility part of how engineering works.",
    tags: ["Security ownership", "Cross-functional alignment"],
  },
  {
    number: "04",
    title: "AI with intention.",
    description:
      "Exploring where AI can help teams build and learn, with human judgment, clear boundaries, and responsible adoption.",
    tags: ["Responsible AI", "Engineering enablement"],
  },
];

const principles = [
  {
    title: "Start with understanding.",
    description:
      "Listen to the people closest to the work. Understand the problem and its constraints before choosing a solution.",
  },
  {
    title: "Make the path clear.",
    description:
      "Connect the purpose to the priorities. Make decisions, ownership, and tradeoffs easier to see.",
  },
  {
    title: "Keep getting better.",
    description:
      "Build room for feedback and learning into the work. Progress is something a team practices together.",
  },
];

function Arrow({ diagonal = false }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App({ page = "home" }) {
  const isExperience = page === "experience";
  const homeHref = isExperience ? import.meta.env.BASE_URL : "";
  const experienceHref = `${import.meta.env.BASE_URL}experience.html`;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="wordmark" href={`${homeHref}#main`} aria-label="Roddy Tomlin, home">
            <span className="monogram" aria-hidden="true">
              rt.
            </span>
            <span>Roddy Tomlin</span>
          </a>
          <nav aria-label="Main navigation">
            <a href={`${homeHref}#about`}>About</a>
            <a href={experienceHref} aria-current={isExperience ? "page" : undefined}>Experience</a>
            <a href={`${homeHref}#focus`}>Focus</a>
            <a href={`${homeHref}#approach`}>Approach</a>
            <a className="nav-contact" href="#connect">
              Let&apos;s connect <Arrow diagonal />
            </a>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {!isExperience && <>
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Former NFL player. Engineering leader.</p>
            <h1 id="hero-title">
              Build with purpose.
              <br />
              <em>Lead with clarity.</em>
            </h1>
            <p className="hero-description">
              I&apos;m {profile.name}, a {profile.title} at {profile.company}.
              My focus is the people, platforms, and practices behind better
              software.
            </p>
            <p className="hero-background">
              Before engineering, I played in the NFL with the Jacksonville
              Jaguars and Atlanta Falcons. A different field, and a story
              I bring with me.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#connect">
                Start a conversation <Arrow />
              </a>
              <a className="text-link" href={experienceHref}>
                Explore my experience <Arrow />
              </a>
            </div>
            <p className="hero-note">
              Engineering leadership. A people-first perspective.
            </p>
          </div>

          <aside className="profile-card" aria-label="Professional snapshot">
            <img
              className="profile-portrait"
              src={`${import.meta.env.BASE_URL}roddy-headshot.jpg`}
              alt="Roddy Tomlin smiling in a navy jacket"
              width="721"
              height="901"
              fetchPriority="high"
              decoding="async"
            />
            <div className="card-heading">
              <span className="eyebrow">At a glance</span>
              <span className="profile-mark" aria-hidden="true">RT</span>
            </div>
            <p className="snapshot-name">{profile.name}</p>
            <p className="snapshot-title">{profile.title}</p>
            <div className="snapshot-row">
              <span>Currently</span>
              <strong>{profile.company}</strong>
            </div>
            <div className="snapshot-row">
              <span>Focus</span>
              <strong>People &amp; platforms</strong>
            </div>
            <div className="snapshot-row">
              <span>Perspective</span>
              <strong>Always learning</strong>
            </div>
            <a className="snapshot-link" href={profile.linkedin}>
              Connect on LinkedIn <Arrow diagonal />
            </a>
          </aside>
        </section>

        <section id="about" className="about-section section" aria-labelledby="about-title">
          <div className="container about-grid">
            <div>
              <p className="eyebrow">A little about me</p>
              <h2 id="about-title">
                A career shaped
                <br />
                by growth.
              </h2>
              <img
                className="about-portrait"
                src={`${import.meta.env.BASE_URL}roddy-seated.jpg`}
                alt="Roddy Tomlin seated on a park bench"
                width="600"
                height="900"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="about-copy">
              <p className="lead">
                From the NFL to software engineering leadership, my path
                hasn&apos;t been a straight line. I value the perspective that
                comes from taking a different route.
              </p>
              <p>
                Today, I&apos;m a {profile.title} at {profile.company}, with a
                focus on team planning and development, platform reliability,
                security ownership, and responsible AI adoption.
              </p>
              <p>
                I care about how people grow alongside the systems they build.
                My approach is to bring clarity to the work, make ownership
                meaningful, and keep learning part of the process.
              </p>
              <a className="text-link" href={profile.linkedin}>
                More on LinkedIn <Arrow diagonal />
              </a>
            </div>
          </div>
        </section>
        </>}

        {isExperience &&
        <section id="experience" className="section container" aria-labelledby="experience-title">
          <a className="text-link experience-back" href={`${homeHref}#main`}>
            <span aria-hidden="true">←</span> Back to profile
          </a>
          <div className="experience-intro">
            <h1 id="experience-title">Experience</h1>
            <p>
              From the NFL to software engineering leadership—a career built on growth.
            </p>
          </div>
          <ol className="experience-list">
            {experience.map(({ company, tenure, roles, contributions }) => (
              <li className="experience-entry" key={company}>
                <div className="experience-company">
                  <h2>{company}</h2>
                  <p>{tenure}</p>
                </div>
                <div>
                  <ul className="experience-roles" aria-label={`${company} roles`}>
                    {roles.map(({ title, dates }) => (
                      <li key={title}>
                        <h3>{title}</h3>
                        {roles.length > 1 && <p className="role-dates">{dates}</p>}
                      </li>
                    ))}
                  </ul>
                  <ul className="experience-contributions" aria-label={`${company} contributions`}>
                    {contributions.map((contribution) => <li key={contribution}>{contribution}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          <div className="education">
            <p className="eyebrow">Education</p>
            <h2>B.S., Mathematics and Computer Science</h2>
            <p>Murray State University <span aria-hidden="true">·</span> 2008-2013</p>
          </div>
        </section>
        }

        {!isExperience && <>
        <section id="focus" className="section container" aria-labelledby="focus-title">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Where I focus</p>
              <h2 id="focus-title">The work behind the work.</h2>
            </div>
            <p>
              Good engineering is more than what ships. It&apos;s also how people
              plan, build, and take care of what comes next.
            </p>
          </div>
          <div className="focus-grid">
            {focusAreas.map(({ number, title, description, tags }) => (
              <article className="focus-card" key={number}>
                <span className="card-number" aria-hidden="true">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <ul className="tags" aria-label={`${title} Topics`}>
                  {tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="approach" className="approach-section section" aria-labelledby="approach-title">
          <div className="container">
            <p className="eyebrow">How I approach leadership</p>
            <h2 id="approach-title">
              Clear priorities.
              <br />
              Shared ownership. Room to grow.
            </h2>
            <div className="principle-grid">
              {principles.map(({ title, description }, index) => (
                <article className="principle" key={title}>
                  <span className="principle-number" aria-hidden="true">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        </>}
        <section id="connect" className="section container connect-section" aria-labelledby="connect-title">
          <div>
            <p className="eyebrow">Keep the conversation going</p>
            <h2 id="connect-title">Good work starts<br />with a conversation.</h2>
            <p className="connect-description">
              Engineering leadership, thoughtful technology, or a new perspective
              on a familiar problem. I&apos;d be glad to connect.
            </p>
          </div>
          <div className="contact-card">
            <a className="contact-link" href={`mailto:${profile.email}`}>
              <span><span className="contact-label">Email</span>{" "}{profile.email}</span>
              <Arrow diagonal />
            </a>
            <a className="contact-link" href={profile.linkedin}>
              <span><span className="contact-label">LinkedIn</span>{" "}Let&apos;s connect</span>
              <Arrow diagonal />
            </a>
            <a className="contact-link" href={`tel:${profile.phoneHref}`} aria-describedby="voicemail-note">
              <span><span className="contact-label">Phone</span>{" "}{profile.phone}</span>
              <Arrow diagonal />
            </a>
            <p id="voicemail-note" className="contact-note">
              Please leave a voicemail with your name and reason for calling.
              It helps me distinguish your call from spam.
            </p>
            <button className="print-button" type="button" onClick={() => window.print()}>
              {isExperience ? "Print / save experience" : "Print / save this profile"} <Arrow />
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-name">{profile.name}</span>
          <p>People. Purpose. Engineering.</p>
          <a href="#main">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
    </>
  );
}
