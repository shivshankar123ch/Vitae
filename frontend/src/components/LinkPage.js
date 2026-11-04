import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import axios from "../api/axios";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthProvider";
import AtoZBrand from "./AtoZBrand";
import "./LandingPage.css";

const roles = [
  {
    title: "Software Engineer",
    type: "Full-time",
    detail: "Build products, solve problems, and grow your engineering career.",
    icon: Workflow,
  },
  {
    title: "Data Analyst",
    type: "Early career",
    detail: "Turn information into insights that help teams make better decisions.",
    icon: Search,
  },
  {
    title: "Product Design Intern",
    type: "Internship",
    detail: "Create thoughtful digital experiences alongside a product team.",
    icon: Sparkles,
  },
];

const audiences = [
  {
    icon: UserRound,
    title: "For job seekers",
    description:
      "Build a profile, discover relevant opportunities, and keep your applications organised.",
    link: "/register",
    linkText: "Create a job seeker account",
  },
  {
    icon: Building2,
    title: "For recruiters",
    description:
      "Share openings with emerging talent and stay connected throughout hiring.",
    link: "/r_register",
    linkText: "Join as a recruiter",
  },
  {
    icon: Users,
    title: "For placement teams",
    description:
      "Coordinate students, employers, and placement activity in one shared space.",
    link: "/login",
    linkText: "Sign in to your workspace",
  },
];

const publicStats = [
  { key: "active_job_seekers", label: "Active job seekers", icon: UserRound },
  { key: "recruiters", label: "Recruiters", icon: Users },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "jobs_posted", label: "Jobs posted", icon: BriefcaseBusiness },
];

export default function LinkPage() {
  const { auth } = React.useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState("");
  const isRecruiter = Boolean(auth?.accessToken && auth?.roles?.includes("Recruiter"));

  React.useEffect(() => {
    const supportsGlow = window.matchMedia("(hover: hover) and (pointer: fine)");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!supportsGlow.matches || prefersReducedMotion.matches) {
      return undefined;
    }

    const cursorGlow = document.createElement("div");
    cursorGlow.className = "pp-cursor-glow";
    cursorGlow.setAttribute("aria-hidden", "true");

    const svgNamespace = "http://www.w3.org/2000/svg";
    const cursorMark = document.createElementNS(svgNamespace, "svg");
    cursorMark.setAttribute("viewBox", "0 0 28 28");
    cursorMark.setAttribute("focusable", "false");

    const leafPaths = [
      { d: "M3 3c8 2 12 8 11 20C7 17 3 11 3 3Z", fill: "#3b9b55" },
      { d: "M25 3c-8 2-12 8-11 20 7-6 11-12 11-20Z", fill: "#258044" },
      { d: "M14 23 8 9m6 14 6-14", fill: "none", stroke: "#1d5b32", strokeWidth: "1.5" },
    ];

    leafPaths.forEach((attributes) => {
      const path = document.createElementNS(svgNamespace, "path");
      Object.entries(attributes).forEach(([name, value]) => path.setAttribute(name, value));
      if (attributes.stroke) {
        path.setAttribute("stroke-linecap", "round");
      }
      cursorMark.appendChild(path);
    });

    cursorGlow.appendChild(cursorMark);
    document.body.appendChild(cursorGlow);

    let animationFrame = 0;
    let latestPointer = null;

    const moveGlow = () => {
      animationFrame = 0;
      if (!latestPointer) {
        return;
      }
      cursorGlow.style.transform = `translate3d(${latestPointer.x}px, ${latestPointer.y}px, 0) translate(-50%, -50%)`;
      cursorGlow.classList.add("pp-cursor-glow--visible");
    };

    const handlePointerMove = (event) => {
      latestPointer = { x: event.clientX, y: event.clientY };
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(moveGlow);
      }
    };

    const hideGlow = () => {
      cursorGlow.classList.remove("pp-cursor-glow--visible");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", hideGlow);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", hideGlow);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      cursorGlow.remove();
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    axios.get("/public/stats")
      .then(({ data }) => {
        if (isMounted) {
          setStats(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatsError("Live community numbers are temporarily unavailable.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    axios.get("/public/feedback")
      .then(({ data }) => {
        if (isMounted) {
          setFeedback(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeedbackError("Recruiter feedback is temporarily unavailable.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setFeedbackLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  return (
    <main className="pp-landing">
      <div className="pp-announcement">
        <span className="pp-announcement__dot" />
        One connected space for campus careers and hiring
        <a href="#how-it-works">
          See how it works <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>

      <header className="pp-header">
        <div className="pp-header__inner">
          <AtoZBrand onClick={closeMenu} />

          <button
            className="pp-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((open) => !open);
              setDropdownOpen(false);
            }}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <nav className={`pp-nav${menuOpen ? " pp-nav--open" : ""}`} aria-label="Main navigation">
            <a href="#opportunities" onClick={closeMenu}>Opportunities</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#community" onClick={closeMenu}>Who it’s for</a>
            <div className={`pp-nav__dropdown${dropdownOpen ? " pp-nav__dropdown--open" : ""}`}>
              <button
                type="button"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((open) => !open)}
              >
                Get started <ChevronDown size={15} aria-hidden="true" />
              </button>
              <div className="pp-nav__dropdown-menu">
                <Link to="/register" onClick={closeMenu}>I’m a job seeker</Link>
                <Link to="/r_register" onClick={closeMenu}>I’m a recruiter</Link>
                <Link to="/login" onClick={closeMenu}>Placement team sign in</Link>
              </div>
            </div>
            <div className="pp-nav__actions">
              <Link className="pp-button pp-button--quiet" to="/login" onClick={closeMenu}>Log in</Link>
              <Link className="pp-button pp-button--small" to="/register" onClick={closeMenu}>
                Get started <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="pp-hero">
        <div className="pp-hero__glow pp-hero__glow--one" />
        <div className="pp-hero__glow pp-hero__glow--two" />
        <div className="pp-container pp-hero__grid">
          <div className="pp-hero__copy">
            <div className="pp-eyebrow">
              <span className="pp-eyebrow__icon"><Sparkles size={14} /></span>
              A brighter way to begin your career
            </div>
            <h1>
              Make your next move <span>count.</span>
            </h1>
            <p className="pp-hero__description">
              Meet the opportunities, people, and placement support that can take
              your career from campus to what’s next.
            </p>
            <div className="pp-hero__actions">
              <Link className="pp-button pp-button--primary" to="/register">
                Explore opportunities <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="pp-button pp-button--outline" to="/r_login">
                Employer login
              </Link>
            </div>
            <div className="pp-hero__note">
              <ShieldCheck size={16} aria-hidden="true" />
              Your journey, your pace — a workspace built around you.
            </div>
          </div>

          <div className="pp-preview" aria-label="Illustration of the Vitae workspace">
            <div className="pp-preview__top">
              <div className="pp-preview__dots" aria-hidden="true"><i /><i /><i /></div>
              <span>YOUR NEXT CHAPTER</span>
              <span className="pp-preview__live"><span /> READY TO EXPLORE</span>
            </div>
            <div className="pp-preview__welcome">
              <div>
                <span className="pp-preview__overline">A little progress goes a long way</span>
                <h2>Good things are<br />within reach.</h2>
              </div>
              <div className="pp-preview__sparkle" aria-hidden="true"><Sparkles size={24} /></div>
            </div>
            <div className="pp-preview__search">
              <Search size={17} aria-hidden="true" />
              <span>Try “design internship”</span>
              <span className="pp-preview__search-key">↵</span>
            </div>
            <div className="pp-preview__cards">
              <div className="pp-preview__card">
                <div className="pp-preview__card-icon pp-preview__card-icon--pink"><Briefcase size={17} /></div>
                <div><strong>Discover</strong><span>Find a role that fits</span></div>
                <ArrowUpRight size={16} aria-hidden="true" />
              </div>
              <div className="pp-preview__card">
                <div className="pp-preview__card-icon pp-preview__card-icon--lilac"><Users size={17} /></div>
                <div><strong>Connect</strong><span>Meet your next team</span></div>
                <ArrowUpRight size={16} aria-hidden="true" />
              </div>
            </div>
            <div className="pp-preview__footer">
              <span className="pp-preview__avatar-stack" aria-hidden="true"><i>J</i><i>A</i><i>M</i></span>
              <span>Every great career starts somewhere.</span>
              <span className="pp-preview__heart" aria-hidden="true">✳</span>
            </div>
          </div>
        </div>
        <a className="pp-scroll-cue" href="#community"><span /> A better way to move forward</a>
      </section>

      <section className="pp-stats" aria-label="Live placement community statistics">
        <div className="pp-container">
          {statsError ? (
            <p className="pp-stats__message" role="status">{statsError}</p>
          ) : (
            <div className="pp-stats__grid" aria-live="polite">
              {publicStats.map(({ key, label, icon: Icon }) => (
                <article className="pp-stat" key={key}>
                  <span className="pp-stat__icon"><Icon size={18} aria-hidden="true" /></span>
                  <div className="pp-stat__value">
                    {stats ? stats[key].toLocaleString() : <span className="pp-stat__loading">—</span>}
                  </div>
                  <div className="pp-stat__label">{label}</div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pp-community" id="community">
        <div className="pp-container">
          <div className="pp-founder-galaxy" aria-label="Vitae founder portraits orbiting in a galaxy">
            <div className="pp-founder-galaxy__nebula pp-founder-galaxy__nebula--one" aria-hidden="true" />
            <div className="pp-founder-galaxy__nebula pp-founder-galaxy__nebula--two" aria-hidden="true" />
            <div className="pp-founder-galaxy__stars" aria-hidden="true" />
            <div className="pp-founder-galaxy__orbit pp-founder-galaxy__orbit--one" aria-hidden="true">
              <span className="pp-founder-galaxy__planet" />
              <span className="pp-founder-galaxy__satellite pp-founder-galaxy__satellite--one">
                <span className="pp-founder-galaxy__satellite-frame"><img src={`${axios.defaults.baseURL}/uploads/founder/founder-photo.jpg`} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /></span>
              </span>
              <span className="pp-founder-galaxy__satellite pp-founder-galaxy__satellite--two">
                <span className="pp-founder-galaxy__satellite-frame"><img src={`${axios.defaults.baseURL}/uploads/founder/founder-photo.jpg`} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /></span>
              </span>
            </div>
            <div className="pp-founder-galaxy__orbit pp-founder-galaxy__orbit--two" aria-hidden="true">
              <span className="pp-founder-galaxy__planet pp-founder-galaxy__planet--two" />
              <span className="pp-founder-galaxy__satellite pp-founder-galaxy__satellite--three">
                <span className="pp-founder-galaxy__satellite-frame"><img src={`${axios.defaults.baseURL}/uploads/founder/founder-photo.jpg`} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /></span>
              </span>
              <span className="pp-founder-galaxy__satellite pp-founder-galaxy__satellite--four">
                <span className="pp-founder-galaxy__satellite-frame"><img src={`${axios.defaults.baseURL}/uploads/founder/founder-photo.jpg`} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /></span>
              </span>
            </div>
            <div className="pp-founder-galaxy__portrait-wrap">
              <div className="pp-founder-galaxy__portrait-fallback" aria-hidden="true">
                <UserRound size={46} strokeWidth={1.35} />
              </div>
              <img
                className="pp-founder-galaxy__portrait"
                src={`${axios.defaults.baseURL}/uploads/founder/founder-photo.jpg`}
                alt="Founder of Vitae"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span className="pp-founder-galaxy__caption">ONE VISION. A GALAXY OF POSSIBILITIES.</span>
          </div>
          <div className="pp-section-heading pp-section-heading--center">
            <span className="pp-kicker">ONE COMMUNITY, MANY POSSIBILITIES</span>
            <h2>Built for the people behind every placement.</h2>
            <p>Students, recruiters, and placement teams — moving forward together.</p>
          </div>
          <div className="pp-audience-grid">
            {audiences.map(({ icon: Icon, title, description, link, linkText }, index) => (
              <article className="pp-audience-card" key={title}>
                <div className={`pp-audience-card__icon pp-audience-card__icon--${index + 1}`}>
                  <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
                </div>
                <span className="pp-audience-card__number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link to={link}>{linkText}<ArrowRight size={15} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pp-opportunities" id="opportunities">
        <div className="pp-container">
          <div className="pp-section-heading pp-section-heading--split">
            <div>
              <span className="pp-kicker">YOUR NEXT CHAPTER STARTS HERE</span>
              <h2>Find a path that feels like yours.</h2>
            </div>
            <p>Explore a few of the paths you can pursue through your placement journey.</p>
          </div>
          <div className="pp-role-grid">
            {roles.map(({ title, type, detail, icon: Icon }, index) => (
              <article className="pp-role-card" key={title}>
                <div className="pp-role-card__top">
                  <div className={`pp-role-card__icon pp-role-card__icon--${index + 1}`}>
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="pp-role-card__type">{type}</span>
                </div>
                <h3>{title}</h3>
                <p>{detail}</p>
                <Link to="/register" aria-label={`Explore ${title} opportunities`}>
                  Explore this path <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="pp-opportunities__note">
            <Sparkles size={15} aria-hidden="true" />
            These are examples of career paths — sign in to explore opportunities shared with your placement community.
          </div>
        </div>
      </section>

      <section className="pp-steps" id="how-it-works">
        <div className="pp-container pp-steps__grid">
          <div className="pp-steps__intro">
            <span className="pp-kicker">SMALL STEPS. BIG POSSIBILITIES.</span>
            <h2>Your journey, made a little simpler.</h2>
            <p>Keep the important things together, so you can spend more time focusing on where you want to go.</p>
            <Link className="pp-text-link" to="/register">Start your journey <ArrowRight size={16} /></Link>
            <div className="pp-steps__deco" aria-hidden="true"><span /><span /><span /></div>
          </div>
          <div className="pp-step-list">
            <article className="pp-step">
              <span className="pp-step__number">01</span>
              <div className="pp-step__icon"><Users size={20} aria-hidden="true" /></div>
              <div><h3>Create your space</h3><p>Set up your student, recruiter, or placement team account.</p></div>
              <Check size={17} className="pp-step__check" aria-hidden="true" />
            </article>
            <article className="pp-step">
              <span className="pp-step__number">02</span>
              <div className="pp-step__icon"><Search size={20} aria-hidden="true" /></div>
              <div><h3>Find your fit</h3><p>Discover opportunities and connect with the right people.</p></div>
              <Check size={17} className="pp-step__check" aria-hidden="true" />
            </article>
            <article className="pp-step">
              <span className="pp-step__number">03</span>
              <div className="pp-step__icon"><ArrowUpRight size={20} aria-hidden="true" /></div>
              <div><h3>Take the next step</h3><p>Keep applications and placement progress moving forward.</p></div>
              <Check size={17} className="pp-step__check" aria-hidden="true" />
            </article>
          </div>
        </div>
      </section>

      <section className="pp-feedback" aria-labelledby="pp-feedback-title">
        <div className="pp-container">
          <div className="pp-feedback__panel">
            <div className="pp-feedback__header">
              <span className="pp-feedback__sparkle" aria-hidden="true"><Sparkles size={19} /></span>
              <span className="pp-kicker">RECRUITER FEEDBACK</span>
              <h2 id="pp-feedback-title">What hiring teams value.</h2>
              <p>Real words shared by recruiters in our community.</p>
            </div>
            <div className="pp-feedback__grid">
              {feedback.map((entry) => (
                <article className="pp-feedback__item" key={entry.id}>
                  <span className="pp-feedback__quote-mark" aria-hidden="true">“</span>
                  <blockquote>{entry.comment}</blockquote>
                  <div className="pp-feedback__author">
                    {entry.image_url ? (
                      <img
                        className="pp-feedback__avatar"
                        src={`${axios.defaults.baseURL}${entry.image_url}`}
                        alt=""
                      />
                    ) : (
                      <span className="pp-feedback__avatar pp-feedback__avatar--initials" aria-hidden="true">
                        {entry.recruiter_name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="pp-feedback__author-details">
                      <strong>{entry.recruiter_name}</strong>
                      <span>Verified recruiter</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {!feedbackLoading && feedback.length === 0 && !feedbackError && (
              <p className="pp-feedback__empty">No recruiter feedback yet. Be the first to share your experience.</p>
            )}
            {feedbackLoading && <p className="pp-feedback__empty">Loading recruiter feedback…</p>}
            {isRecruiter ? (
              <p className="pp-feedback__invite">
                <Link to="/Recruiter_Inbox_Msg">Share your experience from your recruiter workspace.</Link>
              </p>
            ) : (
              <p className="pp-feedback__invite">
                A registered recruiter? <Link to="/r_login">Sign in to share your feedback.</Link>
              </p>
            )}
            {feedbackError && <p className="pp-feedback__message pp-feedback__message--error" role="alert">{feedbackError}</p>}
          </div>
        </div>
      </section>

      <section className="pp-cta">
        <div className="pp-container">
          <div className="pp-cta__panel">
            <div className="pp-cta__decoration pp-cta__decoration--one" aria-hidden="true" />
            <div className="pp-cta__decoration pp-cta__decoration--two" aria-hidden="true" />
            <div className="pp-cta__content">
              <span className="pp-kicker">IT ALL STARTS WITH A FIRST STEP</span>
              <h2>Ready to see what’s possible?</h2>
              <p>Make space for new opportunities, new connections, and whatever comes next.</p>
              <div className="pp-cta__actions">
                <Link className="pp-button pp-button--white" to="/register">
                  Create your account <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link className="pp-cta__login" to="/login">Already a member? Log in</Link>
              </div>
            </div>
            <div className="pp-cta__badge" aria-hidden="true"><Sparkles size={27} /></div>
          </div>
        </div>
      </section>

      <footer className="pp-footer">
        <div className="pp-container">
          <div className="pp-footer__main">
            <div className="pp-footer__brand">
              <AtoZBrand className="pp-brand--footer" />
              <p>Bringing campus talent and new opportunities closer together.</p>
            </div>
            <div className="pp-footer__column">
              <h3>Explore</h3>
              <a href="#opportunities">Opportunities</a>
              <a href="#how-it-works">How it works</a>
              <a href="#community">Our community</a>
            </div>
            <div className="pp-footer__column">
              <h3>Get started</h3>
              <Link to="/register">Job seeker account</Link>
              <Link to="/r_register">Recruiter account</Link>
              <Link to="/login">Placement team</Link>
            </div>
            <div className="pp-footer__card">
              <div className="pp-footer__card-icon"><Briefcase size={18} aria-hidden="true" /></div>
              <strong>Have a role to share?</strong>
              <span>Bring your next opportunity to campus.</span>
              <Link to="/r_login">Visit the recruiter portal <ArrowRight size={14} /></Link>
            </div>
          </div>
          <div className="pp-footer__bottom">
            <span>© {new Date().getFullYear()} Vitae. Made for what comes next.</span>
            <span className="pp-footer__made"><span /> Connecting people with possibility</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
