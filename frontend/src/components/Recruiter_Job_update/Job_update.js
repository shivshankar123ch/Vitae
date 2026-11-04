import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  BriefcaseBusiness,
  Check,
  ClipboardList,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import axios from "../../api/axios";
import AuthContext from "../../context/AuthProvider";
import AtoZBrand from "../AtoZBrand";
import "./Job_update.css";

const companyEndpoint = "/company/ Company & Recruiter Management/";
const emptyRound = (order) => ({ name: "", order, is_elimination: order !== 1 });

const initialForm = {
  company_name: "",
  industry: "",
  company_website: "",
  headquarters: "",
  tier: "",
  founded_in: "",
  employe: "",
  description: "",
  company_skills: "",
  Position: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  title: "",
  ctc: "",
  location: "",
  drive_type: "Off-campus",
  is_active: "true",
  employment_type: "Permanent",
  work_mode: "On-site",
  vacancies: "1",
  min_experience: "0",
  max_experience: "",
  qualification: "",
  responsibilities: "",
  job_description: "",
  required_skills: "",
  preferred_skills: "",
  benefits: "",
  application_deadline: "",
  min_cgpa: "",
  allowed_branches: "",
  max_backlogs: "0",
  batch_year: String(new Date().getFullYear()),
};

function Field({ label, name, value, onChange, type = "text", placeholder, required, min, max, step, wide, hint, children }) {
  const id = `job-update-${name}`;
  return (
    <div className={`job-update__field${wide ? " job-update__field--wide" : ""}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {children || (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
        />
      )}
      {hint && <small>{hint}</small>}
    </div>
  );
}

function Job_update() {
  const { auth } = useContext(AuthContext);
  const [formData, setFormData] = useState(initialForm);
  const [rounds, setRounds] = useState([emptyRound(1)]);
  const [createdCompanyId, setCreatedCompanyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [postedJob, setPostedJob] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const updateRound = (index, field, value) => {
    setRounds((current) =>
      current.map((round, roundIndex) =>
        roundIndex === index ? { ...round, [field]: value } : round
      )
    );
  };

  const addRound = () => {
    setRounds((current) => [...current, emptyRound(current.length + 1)]);
  };

  const removeRound = (index) => {
    setRounds((current) =>
      current
        .filter((_, roundIndex) => roundIndex !== index)
        .map((round, roundIndex) => ({ ...round, order: roundIndex + 1 }))
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auth?.accessToken || !auth?.roles?.includes("Recruiter")) {
      setNotice({ type: "error", text: "Please sign in with your recruiter account before publishing a job." });
      return;
    }
    setSaving(true);
    setNotice(null);
    setPostedJob(null);

    let companyId = createdCompanyId;
    if (!companyId) {
      const companyPayload = {
        name: formData.company_name.trim(),
        industry: formData.industry.trim(),
        Position: formData.title.trim(),
        tier: formData.tier || null,
        founded_in: formData.founded_in || null,
        employe: formData.employe ? Number(formData.employe) : null,
        description: formData.description.trim() || null,
        skills_requirement: formData.company_skills.trim() || formData.required_skills.trim() || null,
        profile_details: {
          company_name: formData.company_name.trim(),
          website: formData.company_website.trim(),
          headquarters: formData.headquarters.trim(),
          contact_name: formData.contact_name.trim(),
          contact_email: formData.contact_email.trim(),
          contact_phone: formData.contact_phone.trim(),
        },
      };

      try {
        const companyResponse = await axios.post(companyEndpoint, companyPayload);
        companyId = companyResponse.data.id;
        if (!companyId) {
          throw new Error("Company was created, but the API did not return its ID.");
        }
        setCreatedCompanyId(companyId);
      } catch (error) {
        console.error("Company registration failed:", error);
        setNotice({
          type: "error",
          text: error.response?.data?.detail || error.message || "Could not save company details. Please try again.",
        });
        setSaving(false);
        return;
      }
    }

    const jobPayload = {
      title: formData.title.trim(),
      company_id: Number(companyId),
      ctc: formData.ctc ? Number(formData.ctc) : null,
      is_active: formData.is_active === "true",
      location: formData.location.trim(),
      drive_type: formData.drive_type,
      eligibility: {
        min_cgpa: formData.min_cgpa ? Number(formData.min_cgpa) : 0,
        allowed_branches: formData.allowed_branches.trim() || "All branches",
        max_backlogs: formData.max_backlogs ? Number(formData.max_backlogs) : 0,
        batch_year: Number(formData.batch_year),
      },
      rounds: rounds.map((round, index) => ({
        name: round.name.trim(),
        order: index + 1,
        is_elimination: round.is_elimination,
      })),
      profile_details: {
        employment_type: formData.employment_type,
        work_mode: formData.work_mode,
        vacancies: Number(formData.vacancies),
        experience: {
          minimum_years: Number(formData.min_experience || 0),
          maximum_years: formData.max_experience ? Number(formData.max_experience) : null,
        },
        qualification: formData.qualification.trim(),
        responsibilities: formData.responsibilities.trim(),
        about_the_job: formData.job_description.trim(),
        job_description: formData.job_description.trim(),
        required_skills: formData.required_skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        preferred_skills: formData.preferred_skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        benefits: formData.benefits.trim(),
        application_deadline: formData.application_deadline || null,
      },
    };

    try {
      const response = await axios.post("/jobs/Posting/drives", jobPayload, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setPostedJob({ ...response.data, companyId });
      setNotice({ type: "success", text: "Company details saved and the job requirement is live." });
      setFormData(initialForm);
      setRounds([emptyRound(1)]);
      setCreatedCompanyId(null);
    } catch (error) {
      console.error("Job posting failed:", error);
      setNotice({
        type: "error",
        text: error.response?.data?.detail
          ? `Company details are saved (ID ${companyId}), but the job wasn't posted: ${error.response.data.detail}. Submit again to retry the job without creating another company.`
          : `Company details are saved (ID ${companyId}), but the job wasn't posted. Submit again to retry the job without creating another company.`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="job-update">
      <header className="job-update__header">
        <div className="job-update__header-inner">
          <AtoZBrand className="pp-brand--dashboard" />
          <Link className="job-update__back" to="/Recruiter_Inbox_Msg">
            <ArrowLeft size={16} aria-hidden="true" />
            Recruiter portal
          </Link>
        </div>
      </header>

      <section className="job-update__hero">
        <div className="job-update__hero-inner">
          <span className="job-update__eyebrow"><SparklesIcon /> COMPANY + OPPORTUNITY</span>
          <h1>Tell us who you’re looking for.</h1>
          <p>Share your company story and the role requirements so candidates can see if they’re a good fit.</p>
          <div className="job-update__steps" aria-label="Form sections">
            <span><Building2 size={14} /> Company</span>
            <i />
            <span><BriefcaseBusiness size={14} /> Role</span>
            <i />
            <span><ClipboardList size={14} /> Requirements</span>
            <i />
            <span><UsersRound size={14} /> Hiring process</span>
          </div>
        </div>
      </section>

      <main className="job-update__layout">
        <aside className="job-update__aside">
          <div className="job-update__aside-card">
            <div className="job-update__aside-icon"><Check size={18} /></div>
            <h2>A clearer brief finds a better fit.</h2>
            <p>Company context, skills, eligibility and interview steps help candidates decide whether to apply.</p>
            <ul>
              <li>Be specific about day-to-day work</li>
              <li>List essential and preferred skills separately</li>
              <li>Set clear eligibility and compensation details</li>
            </ul>
          </div>
        </aside>

        <form className="job-update__form" onSubmit={handleSubmit}>
          {notice && (
            <div className={`job-update__notice job-update__notice--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
              {notice.text}
            </div>
          )}

          {postedJob && (
            <div className="job-update__posted" role="status">
              <Check size={18} />
              <span>{postedJob.message} Company ID: {postedJob.companyId}{postedJob.drive_id ? ` · Job ID: ${postedJob.drive_id}` : ""}</span>
            </div>
          )}

          <section className="job-update__section">
            <div className="job-update__section-heading">
              <span><Building2 size={19} /></span>
              <div><h2>Company profile</h2><p>Introduce your organization to candidates.</p></div>
            </div>
            <div className="job-update__grid">
              <Field label="Company name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="e.g. Acme Technologies" required />
              <Field label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Information Technology" required />
              <Field label="Company website" name="company_website" value={formData.company_website} onChange={handleChange} type="url" placeholder="https://" />
              <Field label="Headquarters" name="headquarters" value={formData.headquarters} onChange={handleChange} placeholder="City, country" />
              <Field label="Company tier" name="tier" value={formData.tier} onChange={handleChange} required>
                <select id="job-update-tier" name="tier" value={formData.tier} onChange={handleChange} required>
                  <option value="">Select company tier</option><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option>
                </select>
              </Field>
              <Field label="Founded on" name="founded_in" value={formData.founded_in} onChange={handleChange} type="date" />
              <Field label="Number of employees" name="employe" value={formData.employe} onChange={handleChange} type="number" min="1" placeholder="e.g. 250" />
              <Field label="Company skills / focus areas" name="company_skills" value={formData.company_skills} onChange={handleChange} placeholder="e.g. SaaS, Cloud, Fintech" />
              <Field label="About the company" name="description" value={formData.description} onChange={handleChange} wide hint="Keep this to 255 characters or fewer." >
                <textarea id="job-update-description" name="description" value={formData.description} onChange={handleChange} rows={3} maxLength={255} placeholder="What does your company do, and what makes it a great place to work?" />
              </Field>
            </div>
          </section>

          <section className="job-update__section">
            <div className="job-update__section-heading">
              <span><UsersRound size={19} /></span>
              <div><h2>Hiring contact</h2><p>Give candidates and your team a point of contact.</p></div>
            </div>
            <div className="job-update__grid">
              <Field label="Contact person" name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Recruiter or hiring manager" />
              <Field label="Work email" name="contact_email" value={formData.contact_email} onChange={handleChange} type="email" placeholder="name@company.com" />
              <Field label="Contact phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} type="tel" placeholder="+91 98765 43210" />
            </div>
          </section>

          <section className="job-update__section">
            <div className="job-update__section-heading">
              <span><BriefcaseBusiness size={19} /></span>
              <div><h2>Role details</h2><p>Describe the position, location, compensation and work setup.</p></div>
            </div>
            <div className="job-update__grid">
              <Field label="Job title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Frontend Engineer" required />
              <Field label="Department / position" name="Position" value={formData.Position} onChange={handleChange} placeholder="e.g. Product Engineering" />
              <Field label="Annual CTC (LPA)" name="ctc" value={formData.ctc} onChange={handleChange} type="number" min="0" step="0.01" placeholder="e.g. 8.5" hint="Enter annual CTC in lakhs; leave empty if not disclosed." />
              <Field label="Job location" name="location" value={formData.location} onChange={handleChange} placeholder="City, state or country" required />
              <Field label="Post status" name="is_active" value={formData.is_active} onChange={handleChange}>
                <select id="job-update-is_active" name="is_active" value={formData.is_active} onChange={handleChange}>
                  <option value="true">Active</option>
                  <option value="false">Deactive</option>
                </select>
              </Field>
              <Field label="Work mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>
                <select id="job-update-work_mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>
                  <option>On-site</option><option>Hybrid</option><option>Remote</option>
                </select>
              </Field>
              <Field label="Employment type" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                <select id="job-update-employment_type" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                  <option>Permanent</option><option>Contractual</option>
                </select>
              </Field>
              <Field label="Hiring drive type" name="drive_type" value={formData.drive_type} onChange={handleChange}>
                <select id="job-update-drive_type" name="drive_type" value={formData.drive_type} onChange={handleChange}>
                  <option>Off-campus</option><option>On-campus</option><option>Pool</option><option>Walk-in</option>
                </select>
              </Field>
              <Field label="Number of openings" name="vacancies" value={formData.vacancies} onChange={handleChange} type="number" min="1" required />
              <Field label="Application deadline" name="application_deadline" value={formData.application_deadline} onChange={handleChange} type="date" />
              <Field label="About the job" name="job_description" value={formData.job_description} onChange={handleChange} wide hint="Describe the role, its goals and what a successful candidate will work on.">
                <textarea id="job-update-job_description" name="job_description" value={formData.job_description} onChange={handleChange} rows={5} placeholder="Write a clear overview of the role, team and opportunity…" />
              </Field>
              <Field label="Responsibilities" name="responsibilities" value={formData.responsibilities} onChange={handleChange} wide hint="Use one responsibility per line for readability.">
                <textarea id="job-update-responsibilities" name="responsibilities" value={formData.responsibilities} onChange={handleChange} rows={4} placeholder={"Build and maintain…\nWork with…\nMeasure and improve…"} />
              </Field>
              <Field label="Benefits and perks" name="benefits" value={formData.benefits} onChange={handleChange} wide placeholder="e.g. Health insurance, learning budget, flexible hours" />
            </div>
          </section>

          <section className="job-update__section">
            <div className="job-update__section-heading">
              <span><ClipboardList size={19} /></span>
              <div><h2>Candidate requirements</h2><p>State the essential qualifications and separate must-have from nice-to-have skills.</p></div>
            </div>
            <div className="job-update__grid">
              <Field label="Minimum experience (years)" name="min_experience" value={formData.min_experience} onChange={handleChange} type="number" min="0" step="0.5" required />
              <Field label="Maximum experience (years)" name="max_experience" value={formData.max_experience} onChange={handleChange} type="number" min={formData.min_experience || "0"} step="0.5" placeholder="Optional" />
              <Field label="Minimum qualification" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. Bachelor's degree in CS or equivalent" />
              <Field label="Minimum CGPA" name="min_cgpa" value={formData.min_cgpa} onChange={handleChange} type="number" min="0" max="10" step="0.1" placeholder="e.g. 7.0" />
              <Field label="Eligible branches" name="allowed_branches" value={formData.allowed_branches} onChange={handleChange} placeholder="e.g. CS, IT, ECE; or All branches" />
              <Field label="Maximum active backlogs" name="max_backlogs" value={formData.max_backlogs} onChange={handleChange} type="number" min="0" />
              <Field label="Eligible graduation year" name="batch_year" value={formData.batch_year} onChange={handleChange} type="number" min="2000" max="2100" required />
              <Field label="Required skills" name="required_skills" value={formData.required_skills} onChange={handleChange} wide placeholder="Comma-separated, e.g. JavaScript, React, REST APIs" hint="These are the essential skills candidates should have." />
              <Field label="Preferred skills" name="preferred_skills" value={formData.preferred_skills} onChange={handleChange} wide placeholder="Comma-separated, e.g. TypeScript, AWS, testing" hint="Nice-to-have skills; candidates can still apply without these." />
            </div>
          </section>

          <section className="job-update__section">
            <div className="job-update__section-heading">
              <span><ClipboardList size={19} /></span>
              <div><h2>Hiring process</h2><p>Add each assessment or interview step in the order candidates will complete them.</p></div>
            </div>
            <div className="job-update__rounds">
              {rounds.map((round, index) => (
                <div className="job-update__round" key={`round-${index}`}>
                  <span className="job-update__round-number">{index + 1}</span>
                  <div className="job-update__round-fields">
                    <Field label="Round name" name={`round-${index}`} value={round.name} onChange={(event) => updateRound(index, "name", event.target.value)} placeholder="e.g. Online assessment" required />
                    <label className="job-update__checkbox">
                      <input type="checkbox" checked={round.is_elimination} onChange={(event) => updateRound(index, "is_elimination", event.target.checked)} />
                      Elimination round
                    </label>
                  </div>
                  {rounds.length > 1 && (
                    <button className="job-update__remove-round" type="button" onClick={() => removeRound(index)} aria-label={`Remove round ${index + 1}`}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button className="job-update__add-round" type="button" onClick={addRound}>
                <Plus size={16} /> Add hiring round
              </button>
            </div>
          </section>

          <footer className="job-update__footer">
            <p>Company details and the job post are saved together. If job posting fails after company save, retrying won’t create a duplicate company.</p>
            <button className="job-update__submit" type="submit" disabled={saving}>
              {saving ? "Saving your post…" : "Publish company & job"}
            </button>
          </footer>
        </form>
      </main>
    </div>
  );
}

function SparklesIcon() {
  return <span aria-hidden="true">✦</span>;
}

export default Job_update;
