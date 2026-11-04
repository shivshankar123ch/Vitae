import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
  RefreshCw,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import AtoZBrand from "../components/AtoZBrand";
import "./Inbox.css";

function JobInbox() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("/company/ Company & Recruiter Management/");
      setCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
        "We couldn’t load opportunities right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <main className="job-inbox">
      <header className="job-inbox__header">
        <div className="job-inbox__header-inner">
          <AtoZBrand className="pp-brand--dashboard" />
          <Link className="job-inbox__back" to="/Home">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </header>

      <section className="job-inbox__hero">
        <div className="job-inbox__hero-inner">
          <span className="job-inbox__eyebrow"><Sparkles size={14} aria-hidden="true" /> YOUR NEXT OPPORTUNITY</span>
          <h1>Jobs picked for your next chapter.</h1>
          <p>Explore companies, discover what they’re looking for, and find a role that fits your skills.</p>
          <div className="job-inbox__hero-stats">
            <span><BriefcaseBusiness size={16} aria-hidden="true" />{companies.length} {companies.length === 1 ? "opportunity" : "opportunities"}</span>
            <span><Building2 size={16} aria-hidden="true" />Real company profiles</span>
          </div>
        </div>
      </section>

      <section className="job-inbox__content" aria-labelledby="job-inbox-title">
        <div className="job-inbox__section-heading">
          <div>
            <span>EXPLORE OPENINGS</span>
            <h2 id="job-inbox-title">Available opportunities</h2>
          </div>
          {!loading && !error && (
            <span className="job-inbox__count">{companies.length} {companies.length === 1 ? "company" : "companies"}</span>
          )}
        </div>

        {loading ? (
          <div className="job-inbox__state" role="status">
            <span className="job-inbox__state-icon"><RefreshCw size={20} aria-hidden="true" /></span>
            <h3>Finding opportunities for you…</h3>
            <p>Company listings will be ready in just a moment.</p>
          </div>
        ) : error ? (
          <div className="job-inbox__state job-inbox__state--error" role="alert">
            <span className="job-inbox__state-icon"><BriefcaseBusiness size={20} aria-hidden="true" /></span>
            <h3>We couldn’t load the jobs</h3>
            <p>{error}</p>
            <button className="job-inbox__retry" type="button" onClick={fetchCompanies}>
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="job-inbox__state">
            <span className="job-inbox__state-icon"><BriefcaseBusiness size={20} aria-hidden="true" /></span>
            <h3>No opportunities just yet</h3>
            <p>New company listings will appear here as soon as they’re available.</p>
          </div>
        ) : (
          <div className="job-inbox__grid">
            {companies.map((company) => (
              <article key={company.id} className="job-inbox__card">
                <div className="job-inbox__card-top">
                  <span className="job-inbox__company-icon"><Building2 size={21} aria-hidden="true" /></span>
                  {company.tier && <span className="job-inbox__tier">{company.tier} company</span>}
                </div>

                <h3>{company.name || company.industry || "Hiring company"}</h3>
                {company.industry && <p className="job-inbox__industry">{company.industry}</p>}

                <div className="job-inbox__position">
                  <BriefcaseBusiness size={15} aria-hidden="true" />
                  <span>{company.Position || company.position || "Open position"}</span>
                </div>

                {company.description && (
                  <p className="job-inbox__description">{company.description}</p>
                )}

                {company.skills_requirement && (
                  <div className="job-inbox__skills">
                    <span className="job-inbox__label"><Sparkles size={13} aria-hidden="true" /> Skills they value</span>
                    <div className="job-inbox__tags">
                      {company.skills_requirement.split(",").map((skill) => skill.trim()).filter(Boolean).map((skill, index) => (
                        <span key={`${company.id}-skill-${index}`}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="job-inbox__meta">
                  {company.founded_in && (
                    <span><CalendarDays size={14} aria-hidden="true" />Since {String(company.founded_in).slice(0, 4)}</span>
                  )}
                  {company.employe != null && (
                    <span><UsersRound size={14} aria-hidden="true" />{company.employe} team members</span>
                  )}
                  {company.profile_details?.location && (
                    <span><MapPin size={14} aria-hidden="true" />{company.profile_details.location}</span>
                  )}
                </div>

                <button className="job-inbox__apply" type="button">
                  Explore opportunity
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default JobInbox;
