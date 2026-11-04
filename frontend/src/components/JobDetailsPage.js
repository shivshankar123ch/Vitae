import React, { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, MapPin, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "../api/axios";
import AtoZBrand from "./AtoZBrand";
import "./JobExplorerHome.css";

const JOBS_URL = "/jobs/Posting/drives";
const hiddenFields = new Set(["id", "_id", "__v"]);
const descriptionFields = new Set(["about_the_job", "job_description"]);

function formatDetailLabel(label) {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function renderValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return "Not specified";
    }
    return (
      <ul className="job-details__list">
        {value.map((item, index) => (
          <li key={`${index}-${typeof item === "object" ? JSON.stringify(item) : item}`}>
            {renderValue(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([key]) => !hiddenFields.has(key));
    if (!entries.length) {
      return "Not specified";
    }
    return (
      <dl className="job-details__nested">
        {entries.map(([key, nestedValue]) => (
          <div key={key}>
            <dt>{formatDetailLabel(key)}</dt>
            <dd>{renderValue(nestedValue)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return String(value);
}

function getJobTitle(job) {
  return job.Position || job.position || job.job_title || job.title || job.company_name || job.name || job.industry || "Opportunity";
}

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!location.state?.job);
  const [error, setError] = useState("");
  const [applyStatus, setApplyStatus] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const userName = localStorage.getItem("userName") || "";

  useEffect(() => {
    if (location.state?.job) {
      setJob(location.state.job);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    axios.get(JOBS_URL)
      .then(({ data }) => {
        if (!Array.isArray(data)) {
          throw new Error("The jobs service returned an unexpected response.");
        }
        const foundJob = data.find((item) =>
          String(item.id ?? item._id ?? getJobTitle(item)) === jobId
        );
        if (!foundJob) {
          if (isMounted) {
            setError("This job could not be found. It may have been removed.");
          }
          return;
        }
        if (isMounted) {
          setJob(foundJob);
        }
      })
      .catch((requestError) => {
        console.error("Unable to load job details:", requestError);
        if (isMounted) {
          setError("Job details are temporarily unavailable. Please try again later.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobId, location.state]);

  const aboutTheJob = job?.about_the_job
    || job?.profile_details?.about_the_job
    || job?.profile_details?.job_description
    || job?.job_description;
  const details = job
    ? Object.entries(job).filter(([key, value]) =>
      !hiddenFields.has(key) &&
      key !== "profile_details" &&
      key !== "about_the_job" &&
      key !== "job_description" &&
      value !== null && value !== undefined && value !== ""
    )
    : [];
  const profileDetails = job?.profile_details && typeof job.profile_details === "object"
    ? Object.entries(job.profile_details).filter(([key, value]) =>
      !hiddenFields.has(key) &&
      !descriptionFields.has(key) &&
      !["contact_name", "contact_email", "contact_phone"].includes(key.toLowerCase()) &&
      value !== null && value !== undefined && value !== ""
    )
    : [];

  const handleApply = async () => {
    if (!job?.id) {
      setApplyStatus("This job cannot be applied for because its ID is unavailable.");
      return;
    }
    if (isApplied) {
      setApplyStatus("You have already applied for this job.");
      return;
    }

    try {
      await axios.post("/jobs/Posting/apply", null, {
        params: {
          student_id: 1,
          drive_id: job.id,
        },
      });
      setIsApplied(true);
      setApplyStatus("Job application submitted successfully.");
    } catch (requestError) {
      console.error("Unable to apply for job:", requestError);
      setApplyStatus(requestError.response?.data?.detail || "Unable to apply. Please try again.");
    }
  };

  return (
    <div className="job-explorer">
      <header className="job-explorer__header">
        <div className="job-explorer__header-inner">
          <AtoZBrand className="pp-brand--dashboard" />
          <Link className="job-explorer__profile" to="/Profile" aria-label="Open profile">
            <span className="job-explorer__avatar" aria-hidden="true">
              {userName ? userName.charAt(0).toUpperCase() : <UserRound size={22} />}
            </span>
            <span>{userName || "Profile"}</span>
          </Link>
        </div>
      </header>

      <main className="job-explorer__main job-details">
        <button type="button" className="job-details__back" onClick={() => navigate("/Home")}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to jobs
        </button>

        {loading && <p className="job-details__message" role="status">Loading job details…</p>}
        {error && <p className="job-details__message job-details__message--error" role="alert">{error}</p>}

        {job && (
          <>
            <section className="job-details__hero">
              <span className="job-details__eyebrow"><BriefcaseBusiness size={15} /> Opportunity details</span>
              <h1>{getJobTitle(job)}</h1>
              <p>{job.company_name || job.name || job.industry || "Hiring company"}</p>
              {job.location && (
                <span className="job-details__location"><MapPin size={16} /> {renderValue(job.location)}</span>
              )}
            </section>

            <section className="job-details__section" aria-labelledby="job-details-heading">
              <div className="job-details__section-heading">
                <div>
                  <span>Full overview</span>
                  <h2 id="job-details-heading">Job information</h2>
                </div>
              </div>
              <dl className="job-details__grid">
                {details.map(([key, value]) => (
                  <div className="job-details__field" key={key}>
                    <dt>{formatDetailLabel(key)}</dt>
                    <dd>{renderValue(value)}</dd>
                  </div>
                ))}
                {profileDetails.map(([key, value]) => (
                  <div className="job-details__field" key={`profile-${key}`}>
                    <dt>{formatDetailLabel(key)}</dt>
                    <dd>{renderValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="job-details__section" aria-labelledby="job-about-heading">
              <div className="job-details__section-heading">
                <div>
                  <span>Role overview</span>
                  <h2 id="job-about-heading">About the job</h2>
                </div>
              </div>
              <p className="job-details__about-copy">
                {aboutTheJob || "The recruiter has not added an overview for this job yet."}
              </p>
            </section>

            {applyStatus && <p className="job-details__apply-status" role="status">{applyStatus}</p>}
            <div className="job-details__apply-action">
              <button
                type="button"
                className="job-explorer__apply"
                onClick={handleApply}
                disabled={isApplied}
              >
                {isApplied ? "Applied" : "Apply now"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
