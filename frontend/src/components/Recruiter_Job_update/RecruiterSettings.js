import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
import axios from "../../api/axios";
import AuthContext from "../../context/AuthProvider";
import AtoZBrand from "../AtoZBrand";
import "./RecruiterSettings.css";

function formatSalary(job) {
  if (job.ctc) return `₹${Number(job.ctc).toLocaleString("en-IN")} LPA`;
  if (job.stipend) return `₹${Number(job.stipend).toLocaleString("en-IN")} / month`;
  return "Compensation not shared";
}

export default function RecruiterSettings() {
  const { auth } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadJobs = useCallback(async () => {
    if (!auth?.accessToken || !auth?.roles?.includes("Recruiter")) {
      setNotice({ type: "error", text: "Sign in with your recruiter account to manage published jobs." });
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const response = await axios.get("/jobs/Posting/my-drives", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setJobs(response.data);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.detail || "Could not load your published jobs. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [auth?.accessToken, auth?.roles]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const unpublishJob = async (job) => {
    const confirmed = window.confirm(
      `Unpublish ${job.title} at ${job.company_name}? Candidates will no longer see this opening. Existing applications will be kept.`
    );
    if (!confirmed) return;

    setRemovingId(job.id);
    setNotice(null);
    try {
      await axios.delete(`/jobs/Posting/drives/${job.id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setJobs((current) =>
        current.map((item) => (item.id === job.id ? { ...item, is_active: false } : item))
      );
      setNotice({ type: "success", text: `${job.title} has been unpublished. Its applications and history have been kept.` });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.detail || "Could not unpublish this job. Please try again.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const activeJobs = jobs.filter((job) => job.is_active);
  const unpublishedJobs = jobs.filter((job) => !job.is_active);

  return (
    <div className="recruiter-settings">
      <header className="recruiter-settings__header">
        <div className="recruiter-settings__header-inner">
          <AtoZBrand className="pp-brand--dashboard" />
          <Link className="recruiter-settings__back" to="/Recruiter_Inbox_Msg">
            <ArrowLeft size={16} aria-hidden="true" />
            Recruiter portal
          </Link>
        </div>
      </header>

      <section className="recruiter-settings__hero">
        <div className="recruiter-settings__hero-inner">
          <span className="recruiter-settings__eyebrow">RECRUITER SETTINGS</span>
          <h1>Manage your published jobs.</h1>
          <p>Review active openings and unpublish roles that are no longer hiring.</p>
        </div>
      </section>

      <main className="recruiter-settings__content">
        {notice && (
          <div className={`recruiter-settings__notice recruiter-settings__notice--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
            {notice.text}
          </div>
        )}

        <div className="recruiter-settings__toolbar">
          <div>
            <h2>Published openings</h2>
            <p>{activeJobs.length} active · {unpublishedJobs.length} unpublished</p>
          </div>
          <div className="recruiter-settings__toolbar-actions">
            <button className="recruiter-settings__refresh" type="button" onClick={loadJobs} disabled={loading}>
              <RotateCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <Link className="recruiter-settings__new-job" to="/Job_update">
              <Plus size={16} aria-hidden="true" />
              Publish a job
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="recruiter-settings__state">Loading your job posts…</div>
        ) : jobs.length === 0 ? (
          <div className="recruiter-settings__empty">
            <span><BriefcaseBusiness size={24} aria-hidden="true" /></span>
            <h3>No job posts yet</h3>
            <p>When you publish a company and job, it will appear here for you to manage.</p>
            <Link to="/Job_update"><Plus size={15} /> Publish your first job</Link>
          </div>
        ) : (
          <div className="recruiter-settings__list">
            {jobs.map((job) => (
              <article className={`recruiter-settings__job${job.is_active ? "" : " is-unpublished"}`} key={job.id}>
                <div className="recruiter-settings__job-top">
                  <div className="recruiter-settings__job-symbol"><Building2 size={20} aria-hidden="true" /></div>
                  <div className="recruiter-settings__job-title">
                    <span className={`recruiter-settings__status${job.is_active ? " is-active" : ""}`}>
                      {job.is_active ? "Published" : "Unpublished"}
                    </span>
                    <h3>{job.title || "Untitled role"}</h3>
                    <p>{job.company_name}{job.industry ? ` · ${job.industry}` : ""}</p>
                  </div>
                  <span className="recruiter-settings__job-id">Job #{job.id}</span>
                </div>

                <div className="recruiter-settings__job-meta">
                  <span><MapPin size={14} aria-hidden="true" />{job.location || "Location not set"}</span>
                  <span><BriefcaseBusiness size={14} aria-hidden="true" />{job.profile_details?.employment_type || job.drive_type || "Role"}</span>
                  <span><CalendarDays size={14} aria-hidden="true" />{job.created_at ? new Date(job.created_at).toLocaleDateString() : "Date not available"}</span>
                  <strong>{formatSalary(job)}</strong>
                </div>

                {job.profile_details?.required_skills?.length > 0 && (
                  <div className="recruiter-settings__skills">
                    {job.profile_details.required_skills.slice(0, 6).map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                )}

                {job.eligibility && (
                  <p className="recruiter-settings__eligibility">
                    {job.eligibility.allowed_branches || "All branches"}
                    {job.eligibility.min_cgpa ? ` · Min CGPA ${job.eligibility.min_cgpa}` : ""}
                    {job.eligibility.batch_year ? ` · Batch ${job.eligibility.batch_year}` : ""}
                  </p>
                )}

                <div className="recruiter-settings__job-actions">
                  {job.is_active ? (
                    <button
                      className="recruiter-settings__unpublish"
                      type="button"
                      onClick={() => unpublishJob(job)}
                      disabled={removingId === job.id}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      {removingId === job.id ? "Unpublishing…" : "Unpublish job"}
                    </button>
                  ) : (
                    <span className="recruiter-settings__retained">
                      Existing applications and job history are retained.
                    </span>
                  )}
                  <Link to="/Recruiter_Inbox_Msg">
                    Recruiter portal <ExternalLink size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
