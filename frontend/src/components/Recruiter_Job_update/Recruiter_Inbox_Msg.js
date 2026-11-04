import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Send, Sparkles } from "lucide-react";
import axios from "../../api/axios";
import AuthContext from "../../context/AuthProvider";
import Pricing from "./Pricing";

export default function RecruiterInboxMsg() {
  const { auth } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [access, setAccess] = useState(null);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackPhoto, setFeedbackPhoto] = useState(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const studentsSectionRef = useRef(null);
  const isRecruiter = Boolean(auth?.accessToken && auth?.roles?.includes("Recruiter"));

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    setApplicationsError("");
    try {
      const response = await axios.get("/recruiter/applied-students", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setApplications(response.data);
    } catch (error) {
      setApplicationsError(
        error.response?.data?.detail ||
        "Could not load student profiles. Please try again."
      );
    } finally {
      setApplicationsLoading(false);
    }
  }, [auth?.accessToken]);

  useEffect(() => {
    let isMounted = true;

    if (!isRecruiter) {
      setAccess({ active: false });
      return () => {
        isMounted = false;
      };
    }

    axios.get("/recruiter/billing/access", {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
      .then(({ data }) => {
        if (isMounted) {
          setAccess(data);
          if (data.active) {
            fetchApplications();
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          setAccess({ active: false });
          setAccessError(
            error.response?.data?.detail ||
            "Could not check recruiter plan access. Please sign in again."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [auth?.accessToken, isRecruiter, fetchApplications]);

  useEffect(() => {
    if (!access?.active) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      studentsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [access?.active]);

  const handlePlanActivated = (activeAccess) => {
    setAccess(activeAccess);
    fetchApplications();
  };

  const downloadStudentResume = async (student) => {
    try {
      const response = await axios.get(`/students/students/${student.id}/resume`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const downloadUrl = window.URL.createObjectURL(response.data);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = student.resume_filename || `${student.student_name || "candidate"}-resume`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      setApplicationsError(
        error.response?.data?.detail ||
        "Could not download this resume. Check your plan access and try again."
      );
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackMessage("");
    setFeedbackError("");

    const formData = new FormData();
    formData.append("comment", feedbackComment);
    if (feedbackPhoto) {
      formData.append("photo", feedbackPhoto);
    }

    try {
      await axios.post("/public/feedback", formData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setFeedbackComment("");
      setFeedbackPhoto(null);
      event.target.reset();
      setFeedbackMessage("Thank you! Your recruiter experience has been shared.");
    } catch (error) {
      setFeedbackError(
        error.response?.data?.detail ||
        "We could not submit your experience. Please try again."
      );
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="container">
      <nav className="navbar recruiter-inbox-navbar">
        <h2>Recruiter Portal</h2>
        <div className="menu-container">
          <button
            className="menu-btn"
            type="button"
            aria-expanded={showMenu}
            onClick={() => setShowMenu((isOpen) => !isOpen)}
          >
            ☰ Menu
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <Link to="/Recruiter_Inbox_Msg">Inbox</Link>
              <Link to="/Job_update">Sell Job</Link>
              <Link to="/JobCreate">Walk-in Drive</Link>
              <Link to="/settings">Settings</Link>
            </div>
          )}
        </div>
      </nav>

      {accessError && <p className="recruiter-inbox__error" role="alert">{accessError}</p>}
      {!isRecruiter && (
        <p className="recruiter-inbox__locked" role="status">
          Sign in with your recruiter account to purchase a plan and view student profiles.
        </p>
      )}
      <Pricing
        onPlanActivated={handlePlanActivated}
        activePlanName={access?.active ? access.plan_name : ""}
      />

      {access?.active && (
        <section
          className="recruiter-inbox__students"
          aria-labelledby="applied-students-title"
          ref={studentsSectionRef}
        >
          <div className="recruiter-inbox__heading">
            <div>
              <span>ACTIVE RECRUITER PLAN</span>
              <h1 id="applied-students-title">Applied Students</h1>
            </div>
            <p>
              {access.plan_name} · Access until{" "}
              {new Date(access.expires_at).toLocaleDateString()}
            </p>
          </div>

          {applicationsLoading ? (
            <p>Loading student profiles…</p>
          ) : applicationsError ? (
            <p className="recruiter-inbox__error" role="alert">{applicationsError}</p>
          ) : applications.length === 0 ? (
            <p>No student profiles are available yet.</p>
          ) : (
            applications.map((app) => {
              const details = app.profile_details || {};
              const education = Array.isArray(details.education) ? details.education : [];
              const skills = Array.isArray(details.skills) ? details.skills : [];
              const projects = Array.isArray(details.projects) ? details.projects : [];
              const experiences = Array.isArray(details.experiences) && details.experiences.length
                ? details.experiences
                : Array.isArray(app.experiences)
                  ? app.experiences
                  : [];

              return (
                <article key={app.id} className="application-card recruiter-candidate-card">
                  <header className="recruiter-candidate-card__header">
                    <div>
                      <span className="recruiter-candidate-card__eyebrow">EMPLOYEE PROFILE</span>
                      <h2>{app.student_name || "Student profile"}</h2>
                      <p>{details.headline || app.title || "Professional profile"}</p>
                    </div>
                    {app.resume_available && (
                      <button
                        className="recruiter-candidate-card__resume"
                        type="button"
                        onClick={() => downloadStudentResume(app)}
                      >
                        CV · {app.resume_filename || "Download resume"}
                      </button>
                    )}
                  </header>

                  <div className="recruiter-candidate-card__details">
                    <div className="recruiter-candidate-card__section">
                      <h3>Contact & location</h3>
                      <div className="recruiter-candidate-card__grid">
                        <p><strong>Email</strong><span>{app.email || "Not provided"}</span></p>
                        <p><strong>Phone</strong><span>{app.phone || "Not provided"}</span></p>
                        <p><strong>Location</strong><span>{[details.city, details.state, details.country].filter(Boolean).join(", ") || "Not provided"}</span></p>
                        <p><strong>Date of birth</strong><span>{details.date_of_birth || "Not provided"}</span></p>
                      </div>
                    </div>

                    <div className="recruiter-candidate-card__section">
                      <h3>Professional summary</h3>
                      <div className="recruiter-candidate-card__grid">
                        <p><strong>Current role</strong><span>{details.current_role || app.title || "Not provided"}</span></p>
                        <p><strong>Company</strong><span>{details.current_company || "Not provided"}</span></p>
                        <p><strong>Total experience</strong><span>{details.total_experience || "Not provided"}</span></p>
                        <p><strong>About</strong><span>{details.summary || app.description || "Not provided"}</span></p>
                      </div>
                    </div>

                    {(education.length > 0 || app.branch || app.cgpa || app.batch_year) && (
                      <div className="recruiter-candidate-card__section">
                        <h3>Education</h3>
                        {education.length > 0 ? education.map((item, index) => (
                          <p className="recruiter-candidate-card__entry" key={`education-${index}`}>
                            <strong>{[item.degree, item.field_of_study].filter(Boolean).join(" · ") || "Qualification"}</strong>
                            <span>{item.institution || "Institution not provided"}{item.graduation_year ? ` · ${item.graduation_year}` : ""}{item.grade ? ` · ${item.grade}` : ""}</span>
                          </p>
                        )) : (
                          <p className="recruiter-candidate-card__entry">
                            <strong>{app.branch || "Qualification not provided"}</strong>
                            <span>{[app.batch_year, app.cgpa].filter((value) => value !== null && value !== undefined && value !== "").join(" · ")}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {(skills.length > 0 || app.skills || app.tech_stack) && (
                      <div className="recruiter-candidate-card__section">
                        <h3>Skills & tools</h3>
                        <div className="recruiter-candidate-card__tags">
                          {(skills.length ? skills.map((item) => item.name && `${item.name}${item.level ? ` · ${item.level}` : ""}`).filter(Boolean) : (app.skills || app.tech_stack || "").split(",").map((item) => item.trim()).filter(Boolean)).map((skill, index) => (
                            <span key={`skill-${index}`}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {experiences.length > 0 && (
                      <div className="recruiter-candidate-card__section">
                        <h3>Work experience</h3>
                        {experiences.map((item, index) => (
                          <div className="recruiter-candidate-card__entry" key={`experience-${index}`}>
                            <strong>{item.role || "Role"}{item.company ? ` · ${item.company}` : ""}</strong>
                            <span>{[item.location, item.experience].filter(Boolean).join(" · ")}</span>
                            {(item.start_date || item.end_date) && <span>{[item.start_date, item.end_date].filter(Boolean).join(" – ")}</span>}
                            {item.description && <p>{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {projects.length > 0 && (
                      <div className="recruiter-candidate-card__section">
                        <h3>Projects</h3>
                        {projects.map((item, index) => (
                          <div className="recruiter-candidate-card__entry" key={`project-${index}`}>
                            <strong>{item.title || "Project"}</strong>
                            <span>{[item.role, item.tech_stack].filter(Boolean).join(" · ")}</span>
                            {item.description && <p>{item.description}</p>}
                            {item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="recruiter-candidate-card__section">
                      <h3>Job preferences</h3>
                      <div className="recruiter-candidate-card__grid">
                        <p><strong>Employment type</strong><span>{details.employment_type || "Not provided"}</span></p>
                        <p><strong>Preferred location</strong><span>{details.preferred_location || "Not provided"}</span></p>
                        <p><strong>Availability</strong><span>{details.notice_period || "Not provided"}</span></p>
                        <p><strong>Expected salary</strong><span>{details.expected_salary || "Not provided"}</span></p>
                        <p><strong>Languages</strong><span>{details.languages || "Not provided"}</span></p>
                      </div>
                    </div>

                    {(details.linkedin_url || details.github_url || details.portfolio_url) && (
                      <div className="recruiter-candidate-card__section">
                        <h3>Professional links</h3>
                        <div className="recruiter-candidate-card__links">
                          {[
                            ["LinkedIn", details.linkedin_url],
                            ["GitHub", details.github_url],
                            ["Portfolio", details.portfolio_url],
                          ].filter(([, url]) => url).map(([label, url]) => (
                            <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
      {isRecruiter && (
        <section className="recruiter-experience" aria-labelledby="recruiter-experience-title">
          <div className="recruiter-experience__heading">
            <span className="recruiter-experience__icon" aria-hidden="true"><Sparkles size={19} /></span>
            <div>
              <span className="recruiter-experience__eyebrow">YOUR VOICE MATTERS</span>
              <h1 id="recruiter-experience-title">Share your recruiter experience</h1>
              <p>Tell the community how Vitae is helping with your hiring.</p>
            </div>
          </div>
          <form className="recruiter-experience__form" onSubmit={submitFeedback}>
            <label htmlFor="recruiter-experience-comment">Your experience</label>
            <textarea
              id="recruiter-experience-comment"
              value={feedbackComment}
              onChange={(event) => setFeedbackComment(event.target.value)}
              maxLength={1000}
              placeholder="Write a few words about your experience…"
              required
            />
            <div className="recruiter-experience__form-footer">
              <label className="recruiter-experience__photo" htmlFor="recruiter-experience-photo">
                <ImagePlus size={15} aria-hidden="true" />
                {feedbackPhoto ? feedbackPhoto.name : "Add your photo"}
              </label>
              <input
                id="recruiter-experience-photo"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(event) => setFeedbackPhoto(event.target.files?.[0] || null)}
                required
              />
              <span className="recruiter-experience__count">{feedbackComment.length}/1000</span>
              <button
                className="recruiter-experience__submit"
                type="submit"
                disabled={feedbackSubmitting || !feedbackComment.trim() || !feedbackPhoto}
              >
                <Send size={14} aria-hidden="true" />
                {feedbackSubmitting ? "Sharing…" : "Share feedback"}
              </button>
            </div>
            {feedbackError && <p className="recruiter-experience__message is-error" role="alert">{feedbackError}</p>}
            {feedbackMessage && <p className="recruiter-experience__message" role="status">{feedbackMessage}</p>}
          </form>
        </section>
      )}
    </div>
  );
}
