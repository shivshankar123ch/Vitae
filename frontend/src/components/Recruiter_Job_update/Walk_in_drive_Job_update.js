import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Plus,
  Rocket,
  Trash2,
  UsersRound,
  Wallet,
} from "lucide-react";
import axios from "../../api/axios";
import AuthContext from "../../context/AuthProvider";
import AtoZBrand from "../AtoZBrand";
import "./JobCreate.css";

const companyEndpoint = "/company/ Company & Recruiter Management/";
const steps = [
  { title: "Company & role", caption: "Who are you hiring?", icon: Building2 },
  { title: "Pay & location", caption: "Where and how much?", icon: Wallet },
  { title: "Requirements", caption: "Who can apply?", icon: ClipboardList },
  { title: "Hiring process", caption: "Plan your rounds", icon: UsersRound },
  { title: "Review", caption: "Check and publish", icon: ClipboardCheck },
];

const createRound = (order) => ({
  name: "",
  order,
  is_elimination: order !== 1,
});

const initialForm = {
  company_name: "",
  industry: "",
  company_website: "",
  headquarters: "",
  company_description: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  title: "",
  department: "",
  job_description: "",
  employment_type: "Full-time",
  vacancies: "1",
  ctc: "",
  stipend: "",
  location: "",
  work_mode: "On-site",
  drive_type: "Off-campus",
  application_deadline: "",
  min_experience: "0",
  max_experience: "",
  qualification: "",
  min_cgpa: "",
  allowed_branches: "",
  max_backlogs: "0",
  batch_year: String(new Date().getFullYear()),
  required_skills: "",
  preferred_skills: "",
  responsibilities: "",
  benefits: "",
};

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  hint,
  min,
  max,
  step,
  wide = false,
  children,
  error,
}) {
  const id = `job-create-${name}`;
  return (
    <div className={`job-create__field${wide ? " job-create__field--wide" : ""}`}>
      <label htmlFor={id}>
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
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
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}
      {hint && <small>{hint}</small>}
      {error && <small className="job-create__field-error" id={`${id}-error`}>{error}</small>}
    </div>
  );
}

export default function JobCreate() {
  const { auth } = useContext(AuthContext);
  const [formData, setFormData] = useState(initialForm);
  const [rounds, setRounds] = useState([createRound(1)]);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [createdCompanyId, setCreatedCompanyId] = useState(null);
  const [postedJob, setPostedJob] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    if (["company_name", "industry", "company_website", "headquarters", "company_description", "contact_name", "contact_email", "contact_phone"].includes(name)) {
      setCreatedCompanyId(null);
    }
  };

  const updateRound = (index, field, value) => {
    setRounds((current) => current.map((round, roundIndex) => (
      roundIndex === index ? { ...round, [field]: value } : round
    )));
    setErrors((current) => ({ ...current, rounds: "" }));
  };

  const addRound = () => {
    setRounds((current) => [...current, createRound(current.length + 1)]);
  };

  const removeRound = (index) => {
    setRounds((current) => current
      .filter((_, roundIndex) => roundIndex !== index)
      .map((round, roundIndex) => ({ ...round, order: roundIndex + 1 })));
  };

  const validateStep = () => {
    const nextErrors = {};
    if (step === 0) {
      if (!formData.company_name.trim()) nextErrors.company_name = "Enter the company name.";
      if (!formData.industry.trim()) nextErrors.industry = "Enter the company's industry.";
      if (!formData.title.trim()) nextErrors.title = "Enter the job title.";
      if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        nextErrors.contact_email = "Enter a valid work email.";
      }
    }
    if (step === 1 && !formData.location.trim()) {
      nextErrors.location = "Enter where this role is based.";
    }
    if (step === 2) {
      const minCgpa = Number(formData.min_cgpa);
      if (formData.min_cgpa && (minCgpa < 0 || minCgpa > 10)) {
        nextErrors.min_cgpa = "CGPA must be between 0 and 10.";
      }
      if (!formData.batch_year || Number(formData.batch_year) < 2000) {
        nextErrors.batch_year = "Enter a valid graduation year.";
      }
      if (formData.max_experience && Number(formData.max_experience) < Number(formData.min_experience || 0)) {
        nextErrors.max_experience = "Maximum experience must be at least the minimum.";
      }
    }
    if (step === 3) {
      if (rounds.length === 0) nextErrors.rounds = "Add at least one hiring round.";
      rounds.forEach((round, index) => {
        if (!round.name.trim()) nextErrors[`round-${index}`] = "Enter a name for this round.";
      });
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);
    if (step < steps.length - 1) {
      if (validateStep()) {
        setStep((current) => current + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (!auth?.accessToken || !auth?.roles?.includes("Recruiter")) {
      setNotice({ type: "error", text: "Please sign in with your recruiter account before publishing a job." });
      return;
    }
    setSaving(true);
    setPostedJob(null);

    let companyId = createdCompanyId;
    if (!companyId) {
      const companyPayload = {
        name: formData.company_name.trim(),
        industry: formData.industry.trim(),
        Position: formData.title.trim(),
        description: formData.company_description.trim() || null,
        skills_requirement: formData.required_skills.trim() || null,
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
        if (!companyId) throw new Error("Company was saved, but its ID was not returned.");
        setCreatedCompanyId(companyId);
      } catch (error) {
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
      stipend: formData.stipend ? Number(formData.stipend) : null,
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
        department: formData.department.trim(),
        employment_type: formData.employment_type,
        work_mode: formData.work_mode,
        vacancies: Number(formData.vacancies) || 1,
        experience: {
          minimum_years: Number(formData.min_experience || 0),
          maximum_years: formData.max_experience ? Number(formData.max_experience) : null,
        },
        qualification: formData.qualification.trim(),
        about_the_job: formData.job_description.trim(),
        job_description: formData.job_description.trim(),
        responsibilities: formData.responsibilities.trim(),
        required_skills: formData.required_skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        preferred_skills: formData.preferred_skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        benefits: formData.benefits.trim(),
        application_deadline: formData.application_deadline || null,
        contact_name: formData.contact_name.trim(),
        contact_email: formData.contact_email.trim(),
        contact_phone: formData.contact_phone.trim(),
      },
    };

    try {
      const response = await axios.post("/jobs/Posting/drives", jobPayload, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setPostedJob({ ...response.data, companyId });
      setNotice({ type: "success", text: "Your company details and job requirement are now live." });
      setFormData(initialForm);
      setRounds([createRound(1)]);
      setStep(0);
      setErrors({});
      setCreatedCompanyId(null);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.detail
          ? `Company details were saved, but the job could not be published: ${error.response.data.detail}. You can retry without creating the company again.`
          : "Company details were saved, but the job could not be published. Your answers are still here; try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setErrors({});
    setNotice(null);
    setStep((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderReview = () => (
    <div className="job-create__review">
      <section className="job-create__review-card">
        <h3><Building2 size={17} /> Company & role</h3>
        <dl>
          <div><dt>Company</dt><dd>{formData.company_name} · {formData.industry}</dd></div>
          <div><dt>Role</dt><dd>{formData.title}{formData.department ? ` · ${formData.department}` : ""}</dd></div>
          <div><dt>Employment</dt><dd>{formData.employment_type} · {formData.work_mode}</dd></div>
        </dl>
      </section>
      <section className="job-create__review-card">
        <h3><Wallet size={17} /> Compensation & location</h3>
        <dl>
          <div><dt>Location</dt><dd>{formData.location} · {formData.drive_type}</dd></div>
          <div><dt>Compensation</dt><dd>{formData.ctc ? `₹${formData.ctc} LPA CTC` : "CTC not disclosed"}{formData.stipend ? ` · ₹${formData.stipend} monthly stipend` : ""}</dd></div>
          <div><dt>Openings</dt><dd>{formData.vacancies}</dd></div>
        </dl>
      </section>
      <section className="job-create__review-card">
        <h3><ClipboardList size={17} /> Candidate requirements</h3>
        <dl>
          <div><dt>Graduation year</dt><dd>{formData.batch_year}</dd></div>
          <div><dt>Eligibility</dt><dd>{formData.min_cgpa ? `${formData.min_cgpa} CGPA minimum` : "No CGPA minimum"} · {formData.allowed_branches || "All branches"} · {formData.max_backlogs || "0"} backlogs max</dd></div>
          <div><dt>Required skills</dt><dd>{formData.required_skills || "Not specified"}</dd></div>
        </dl>
      </section>
      <section className="job-create__review-card">
        <h3><UsersRound size={17} /> Hiring rounds</h3>
        <ol className="job-create__review-rounds">
          {rounds.map((round, index) => (
            <li key={`review-round-${index}`}>
              <span>{round.name}</span>
              <small>{round.is_elimination ? "Elimination round" : "Non-elimination round"}</small>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );

  const renderStep = () => {
    if (step === 0) {
      return (
        <>
          <div className="job-create__section-title">
            <span><Building2 size={19} /></span>
            <div><h2>Start with your company and role</h2><p>Help candidates understand who is hiring and what the opportunity is.</p></div>
          </div>
          <div className="job-create__fields">
            <Field label="Company name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="e.g. Acme Technologies" required error={errors.company_name} />
            <Field label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Software & IT" required error={errors.industry} />
            <Field label="Job title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Frontend Engineer" required error={errors.title} />
            <Field label="Department / team" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Product Engineering" />
            <Field label="Employment type" name="employment_type" value={formData.employment_type} onChange={handleChange}>
              <select id="job-create-employment_type" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Apprenticeship</option>
              </select>
            </Field>
            <Field label="Number of openings" name="vacancies" value={formData.vacancies} onChange={handleChange} type="number" min="1" />
            <Field label="Company website" name="company_website" value={formData.company_website} onChange={handleChange} type="url" placeholder="https://company.com" />
            <Field label="Headquarters" name="headquarters" value={formData.headquarters} onChange={handleChange} placeholder="City, country" />
            <Field label="About your company" name="company_description" value={formData.company_description} onChange={handleChange} wide hint="A short introduction helps candidates decide if your company is right for them.">
              <textarea id="job-create-company_description" name="company_description" value={formData.company_description} onChange={handleChange} rows={3} maxLength={255} placeholder="What does your company do?" />
            </Field>
            <Field label="Hiring contact name" name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Recruiter or hiring manager" />
            <Field label="Work email" name="contact_email" value={formData.contact_email} onChange={handleChange} type="email" placeholder="name@company.com" error={errors.contact_email} />
          </div>
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <div className="job-create__section-title">
            <span><Wallet size={19} /></span>
            <div><h2>Set pay, location and work style</h2><p>Clear compensation and work details help the right people apply.</p></div>
          </div>
          <div className="job-create__fields">
            <Field label="Annual CTC (LPA)" name="ctc" value={formData.ctc} onChange={handleChange} type="number" min="0" step="0.1" placeholder="e.g. 8.5" hint="Leave blank if compensation is not disclosed." />
            <Field label="Monthly stipend (₹)" name="stipend" value={formData.stipend} onChange={handleChange} type="number" min="0" step="100" placeholder="For internship roles" />
            <Field label="Job location" name="location" value={formData.location} onChange={handleChange} placeholder="City, state or country" required error={errors.location} />
            <Field label="Work mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>
              <select id="job-create-work_mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>
                <option>On-site</option><option>Hybrid</option><option>Remote</option>
              </select>
            </Field>
            <Field label="Hiring drive type" name="drive_type" value={formData.drive_type} onChange={handleChange}>
              <select id="job-create-drive_type" name="drive_type" value={formData.drive_type} onChange={handleChange}>
                <option>Off-campus</option><option>On-campus</option><option>Pool</option><option>Walk-in</option>
              </select>
            </Field>
            <Field label="Application deadline" name="application_deadline" value={formData.application_deadline} onChange={handleChange} type="date" />
          </div>
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <div className="job-create__section-title">
            <span><ClipboardList size={19} /></span>
            <div><h2>Tell candidates what they need</h2><p>Set eligibility and separate must-have skills from nice-to-haves.</p></div>
          </div>
          <div className="job-create__fields">
            <Field label="Minimum experience (years)" name="min_experience" value={formData.min_experience} onChange={handleChange} type="number" min="0" step="0.5" />
            <Field label="Maximum experience (years)" name="max_experience" value={formData.max_experience} onChange={handleChange} type="number" min="0" step="0.5" placeholder="Optional" error={errors.max_experience} />
            <Field label="Minimum qualification" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. Bachelor's degree or equivalent" />
            <Field label="Minimum CGPA (out of 10)" name="min_cgpa" value={formData.min_cgpa} onChange={handleChange} type="number" min="0" max="10" step="0.1" placeholder="e.g. 7.0" error={errors.min_cgpa} />
            <Field label="Eligible branches" name="allowed_branches" value={formData.allowed_branches} onChange={handleChange} placeholder="e.g. CS, IT, ECE; or All branches" />
            <Field label="Maximum active backlogs" name="max_backlogs" value={formData.max_backlogs} onChange={handleChange} type="number" min="0" />
            <Field label="Eligible graduation year" name="batch_year" value={formData.batch_year} onChange={handleChange} type="number" min="2000" max="2100" required error={errors.batch_year} />
            <Field label="Required skills" name="required_skills" value={formData.required_skills} onChange={handleChange} wide placeholder="e.g. JavaScript, React, REST APIs" hint="Separate skills with commas. These are essential for the role." />
            <Field label="Preferred skills" name="preferred_skills" value={formData.preferred_skills} onChange={handleChange} wide placeholder="e.g. TypeScript, AWS, automated testing" hint="Nice-to-have skills; candidates can still apply without them." />
            <Field label="About the job" name="job_description" value={formData.job_description} onChange={handleChange} wide hint="Describe the role, its goals and what a successful candidate will work on.">
              <textarea id="job-create-job_description" name="job_description" value={formData.job_description} onChange={handleChange} rows={5} placeholder="Write a clear overview of the role, team and opportunity…" />
            </Field>
            <Field label="Responsibilities" name="responsibilities" value={formData.responsibilities} onChange={handleChange} wide>
              <textarea id="job-create-responsibilities" name="responsibilities" value={formData.responsibilities} onChange={handleChange} rows={4} placeholder={"Build and maintain…\nCollaborate with…\nMeasure and improve…"} />
            </Field>
            <Field label="Benefits and perks" name="benefits" value={formData.benefits} onChange={handleChange} wide placeholder="e.g. Health insurance, learning budget, flexible hours" />
          </div>
        </>
      );
    }
    if (step === 3) {
      return (
        <>
          <div className="job-create__section-title">
            <span><UsersRound size={19} /></span>
            <div><h2>Map out the hiring journey</h2><p>Add each assessment or interview in the order candidates will complete it.</p></div>
          </div>
          <div className="job-create__rounds">
            {rounds.map((round, index) => (
              <article className="job-create__round" key={`round-${index}`}>
                <span className="job-create__round-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="job-create__round-content">
                  <Field
                    label={`Round ${index + 1}`}
                    name={`round-${index}`}
                    value={round.name}
                    onChange={(event) => updateRound(index, "name", event.target.value)}
                    placeholder="e.g. Online assessment, Technical interview"
                    required
                    error={errors[`round-${index}`]}
                  />
                  <label className="job-create__checkbox">
                    <input type="checkbox" checked={round.is_elimination} onChange={(event) => updateRound(index, "is_elimination", event.target.checked)} />
                    <span><strong>Elimination round</strong><small>Unsuccessful candidates won't move to the next step.</small></span>
                  </label>
                </div>
                {rounds.length > 1 && (
                  <button className="job-create__remove-round" type="button" onClick={() => removeRound(index)} aria-label={`Remove round ${index + 1}`}>
                    <Trash2 size={16} />
                  </button>
                )}
              </article>
            ))}
            {errors.rounds && <p className="job-create__field-error" role="alert">{errors.rounds}</p>}
            <button className="job-create__add-round" type="button" onClick={addRound}><Plus size={16} /> Add another round</button>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="job-create__section-title">
          <span><ClipboardCheck size={19} /></span>
          <div><h2>Review your job requirement</h2><p>Make sure everything looks right before you publish it to candidates.</p></div>
        </div>
        {renderReview()}
      </>
    );
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="job-create">
      <header className="job-create__header">
        <div className="job-create__header-inner">
          <AtoZBrand className="pp-brand--dashboard" />
          <Link className="job-create__back-link" to="/Recruiter_Inbox_Msg"><ArrowLeft size={16} /> Recruiter portal</Link>
        </div>
      </header>

      <section className="job-create__hero">
        <div className="job-create__hero-inner">
          <span className="job-create__eyebrow"><Rocket size={14} /> RECRUITER · NEW OPPORTUNITY</span>
          <h1>Build a brief great people can say yes to.</h1>
          <p>Answer one step at a time. A clear company story and role brief help the right candidates find you.</p>
          <div className="job-create__progress-meta">
            <span>STEP {step + 1} OF {steps.length}</span>
            <span>{Math.round(((step + 1) / steps.length) * 100)}% complete</span>
          </div>
          <div className="job-create__progress-track" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label="Job setup progress">
            <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </section>

      <main className="job-create__layout">
        <aside className="job-create__sidebar">
          <nav className="job-create__step-list" aria-label="Job creation steps">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const isComplete = index < step;
              const isCurrent = index === step;
              return (
                <div className={`job-create__step${isCurrent ? " is-current" : ""}${isComplete ? " is-complete" : ""}`} key={item.title}>
                  <span className="job-create__step-icon">{isComplete ? <Check size={16} /> : <Icon size={16} />}</span>
                  <span className="job-create__step-copy"><strong>{item.title}</strong><small>{item.caption}</small></span>
                  {isCurrent && <span className="job-create__step-dot" />}
                </div>
              );
            })}
          </nav>
          <div className="job-create__tip">
            <BadgeCheck size={18} />
            <h3>Make every detail count</h3>
            <p>Clear expectations and honest requirements help candidates decide whether your role is right for them.</p>
          </div>
        </aside>

        <form className="job-create__form" onSubmit={handleSubmit} noValidate>
          {notice && <div className={`job-create__notice is-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}
          {postedJob && (
            <div className="job-create__posted" role="status">
              <CheckCircle2 size={19} />
              <span>{postedJob.message} · Job ID {postedJob.drive_id}</span>
            </div>
          )}
          <div className="job-create__form-top">
            <span className="job-create__form-step"><StepIcon size={16} /> STEP {step + 1}</span>
            <span className="job-create__required-note">* Required to publish</span>
          </div>
          <div className="job-create__step-content" key={step}>{renderStep()}</div>
          <div className="job-create__form-footer">
            <span className="job-create__save-note">Your answers stay here while you move between steps.</span>
            <div className="job-create__actions">
              {step > 0 && <button className="job-create__previous" type="button" onClick={goBack} disabled={saving}><ArrowLeft size={16} /> Back</button>}
              <button className="job-create__next" type="submit" disabled={saving}>
                {saving ? "Publishing…" : step === steps.length - 1 ? "Publish job" : "Continue"}
                {!saving && (step === steps.length - 1 ? <Rocket size={16} /> : <ArrowRight size={16} />)}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
