import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import AtoZBrand from "./AtoZBrand";
import "./JobExplorerHome.css";

const JOBS_URL = "/jobs/Posting/drives";

const roles = [
  "Full-Stack Development",
  "Backend Development",
  "Frontend Development",
  "Mobile Development",
  "QA Engineering / Test Automation",
  "IoT & Edge Development",
];

const roleKeywords = {
  "Full-Stack Development": ["full-stack", "full stack", "fullstack"],
  "Backend Development": ["backend", "back-end", "back end", "server-side"],
  "Frontend Development": ["frontend", "front-end", "front end", "ui development"],
  "Mobile Development": ["mobile", "android", "ios", "iOS"],
  "QA Engineering / Test Automation": ["qa", "quality assurance", "test automation", "testing"],
  "IoT & Edge Development": ["iot", "internet of things", "edge computing", "edge development"],
};

function getSearchableText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(getSearchableText).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(getSearchableText).join(" ");
  }

  return "";
}

function getCompanyTitle(company) {
  return company.Position || company.position || company.job_title || company.title ||
    company.name || company.industry || "Opportunity";
}

export default function JobExplorerHome() {
  const [companies, setCompanies] = useState([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobsError, setJobsError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [applyStatus, setApplyStatus] = useState("");
  const [appliedJobs, setAppliedJobs] = useState([]);
  const resultsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "");

    let isMounted = true;
    axios.get(JOBS_URL)
      .then(({ data }) => {
        if (!Array.isArray(data)) {
          throw new Error("The jobs service returned an unexpected response.");
        }
        if (isMounted) {
          setCompanies(data);
          setCompanyCount(data.length);
        }
      })
      .catch((error) => {
        console.error("Unable to load jobs:", error);
        if (isMounted) {
          setJobsError("Jobs are temporarily unavailable. Please try again later.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCompanies = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    const keywords = roleKeywords[selectedRole];

    return companies.filter((company) => {
      const searchableText = getSearchableText(company).toLowerCase();
      const matchesRole = !keywords ||
        keywords.some((keyword) => searchableText.includes(keyword.toLowerCase()));
      const matchesQuery = !query || searchableText.includes(query);
      return matchesRole && matchesQuery;
    });
  }, [companies, jobSearch, selectedRole]);

  const handleSearch = () => {
    if (!selectedRole) {
      setSearchMessage("Please select a primary role to find matching jobs.");
      return;
    }

    setSearchMessage(`${filteredCompanies.length} matching ${filteredCompanies.length === 1 ? "job" : "jobs"} found.`);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSkip = () => {
    setSelectedRole("");
    setJobSearch("");
    setSearchMessage("");
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleApply = async (company) => {
    if (appliedJobs.includes(company.id)) {
      setApplyStatus("You have already applied for this job.");
      return;
    }

    try {
      await axios.post("/jobs/Posting/apply", null, {
        params: {
          student_id: 1,
          drive_id: company.id,
        },
      });
      setAppliedJobs((previous) => [...previous, company.id]);
      setApplyStatus("Job application submitted successfully.");
    } catch (error) {
      console.error("Unable to apply for job:", error);
      setApplyStatus("Unable to apply. Please try again.");
    }
  };

  return (
    <div className="job-explorer">
      <header className="job-explorer__header">
        <div className="job-explorer__header-inner">
          <AtoZBrand className="pp-brand--dashboard" />
          <Link className="job-explorer__profile" to="/Profile" aria-label="Open profile">
            <span className="job-explorer__avatar" aria-hidden="true">
              <svg viewBox="0 0 48 48" focusable="false">
                <path d="M40 6C22 6 9 11 7 25c-1.2 8.5 4.7 14.7 12.8 14.7C34 39.7 40 23 40 6Z" />
                <path d="M11 36 35 12m-13 12-1-8m-4 14-7-2m19-8 1 7" />
              </svg>
              <span>{userName ? userName.trim().charAt(0).toUpperCase() : "?"}</span>
            </span>
            <span>{userName || "Profile"}</span>
          </Link>
        </div>
      </header>

      <main className="job-explorer__main">
        <section className="job-explorer__welcome">
          <p>Hello{userName ? ` ${userName}` : ""},</p>
          <h1>Explore some live jobs</h1>
        </section>

        <section className="job-explorer__role-card" aria-labelledby="job-role-title">
          <div className="job-explorer__role-content">
            <h2 id="job-role-title">What kind of role are you looking for?</h2>
            <label className="job-explorer__select-wrap">
              <span className="job-explorer__sr-only">Select primary role</span>
              <select
                value={selectedRole}
                onChange={(event) => {
                  setSelectedRole(event.target.value);
                  setSearchMessage("");
                }}
              >
                <option value="">Select primary role</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <ChevronDown size={20} aria-hidden="true" />
            </label>

            <div className="job-explorer__role-list" aria-label="Choose a role">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`job-explorer__role-pill${selectedRole === role ? " is-selected" : ""}`}
                  aria-pressed={selectedRole === role}
                  onClick={() => {
                    setSelectedRole(selectedRole === role ? "" : role);
                    setSearchMessage("");
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
            {searchMessage && <p className="job-explorer__search-message" role="status">{searchMessage}</p>}
          </div>

          <div className="job-explorer__card-footer">
            <div className="job-explorer__steps" aria-label="Step 1 of 4">
              <span className="is-active" />
              <span />
              <span />
              <span />
            </div>
            <button type="button" className="job-explorer__search-button" onClick={handleSearch}>
              Search <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
        </section>

        <div className="job-explorer__skip">
          <button type="button" onClick={handleSkip}>Skip all &amp; Explore jobs <span aria-hidden="true">→</span></button>
        </div>

        <label className="job-explorer__job-search">
          <Search size={21} aria-hidden="true" />
          <span className="job-explorer__sr-only">Search jobs</span>
          <input
            type="search"
            value={jobSearch}
            onChange={(event) => setJobSearch(event.target.value)}
            placeholder="Search jobs"
          />
        </label>

        <section className="job-explorer__results" ref={resultsRef} aria-labelledby="job-results-title">
          <div className="job-explorer__results-heading">
            <div>
              <h2 id="job-results-title">Available opportunities</h2>
              <p>{filteredCompanies.length} of {companyCount} jobs</p>
            </div>
            {(selectedRole || jobSearch) && (
              <button type="button" onClick={handleSkip}>Clear filters</button>
            )}
          </div>

          {applyStatus && <p className="job-explorer__status" role="status">{applyStatus}</p>}
          {jobsError && <p className="job-explorer__error" role="alert">{jobsError}</p>}
          {!jobsError && filteredCompanies.length === 0 && (
            <p className="job-explorer__empty">
              {companies.length ? "No jobs match your search. Try another role or keyword." : "No jobs are available right now."}
            </p>
          )}

          <div className="job-explorer__job-list">
            {filteredCompanies.map((company, index) => {
              const skills = company.skills_requirement || company.skills || "";
              const skillList = Array.isArray(skills)
                ? skills
                : String(skills).split(/[,|]/).map((skill) => skill.trim()).filter(Boolean);

              return (
                <article className="job-explorer__job-card" key={company.id || `${getCompanyTitle(company)}-${index}`}>
                  <div className="job-explorer__job-copy">
                    <h3>{getCompanyTitle(company)}</h3>
                    <p className="job-explorer__company">{company.company_name || company.name || company.industry || "Hiring company"}</p>
                    <div className="job-explorer__job-meta">
                      {company.location && <span>{company.location}</span>}
                      {company.tier && <span>{company.tier}</span>}
                      {company.employe && <span>{company.employe} employees</span>}
                    </div>
                    {(company.about_the_job || company.profile_details?.about_the_job || company.profile_details?.job_description) && (
                      <p className="job-explorer__description">
                        {company.about_the_job || company.profile_details?.about_the_job || company.profile_details?.job_description}
                      </p>
                    )}
                    {skillList.length > 0 && (
                      <div className="job-explorer__skills">
                        {skillList.map((skill) => <span key={skill}>{skill}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="job-explorer__job-actions">
                    <button
                      type="button"
                      className="job-explorer__details-button"
                      onClick={() => navigate(`/job-details/${encodeURIComponent(company.id ?? company._id ?? getCompanyTitle(company))}`, {
                        state: { job: company },
                      })}
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      className="job-explorer__apply"
                      onClick={() => handleApply(company)}
                    >
                      {appliedJobs.includes(company.id) ? "Applied" : "Apply now"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
