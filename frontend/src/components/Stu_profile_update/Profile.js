import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  FileText,
  FolderGit2,
  GraduationCap,
  Link2,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import axios from "../../api/axios";
import AuthContext from "../../context/AuthProvider";
import AtoZBrand from "../AtoZBrand";
import "./Profile.css";

const emptyExperience = () => ({
  company: "",
  role: "",
  experience: "",
  location: "",
  start_date: "",
  end_date: "",
  description: "",
});

const emptyEducation = () => ({
  degree: "",
  field_of_study: "",
  institution: "",
  graduation_year: "",
  grade: "",
});

const emptySkill = () => ({ name: "", level: "", years: "" });
const emptyProject = () => ({ title: "", role: "", description: "", tech_stack: "", url: "" });

const blankProfile = {
  name: "",
  email: "",
  phone: "",
  branch: "",
  cgpa: "",
  backlogs: "",
  batch_year: "",
  skill_name: "",
  title: "",
  description: "",
  tech_stack: "",
  resume: "",
  resume_filename: "",
  profile_details: {
    headline: "",
    summary: "",
    date_of_birth: "",
    city: "",
    state: "",
    country: "",
    current_company: "",
    current_role: "",
    total_experience: "",
    employment_type: "",
    notice_period: "",
    expected_salary: "",
    preferred_location: "",
    languages: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    education: [],
    skills: [],
    projects: [],
  },
  experiences: [],
};

function Field({ label, id, hint, children }) {
  return (
    <div className="employee-profile__field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="employee-profile__section-heading">
      <span className="employee-profile__section-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ListActions({ onAdd, onRemove, removeLabel }) {
  return (
    <div className="employee-profile__list-actions">
      <button className="employee-profile__add-button" type="button" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" />
        Add another
      </button>
      {onRemove && (
        <button
          className="employee-profile__remove-button"
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function hasSavedProfile(data) {
  if (!data) return false;

  const details = data.profile_details || {};
  const hasDetails = Object.values(details).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim())
  );

  return Boolean(
    data.phone ||
    data.branch ||
    data.resume ||
    data.skill_name ||
    data.title ||
    data.description ||
    data.tech_stack ||
    hasDetails ||
    data.experiences?.length
  );
}

function PreviewField({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === "") return null;

  return (
    <div className="employee-profile__preview-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function StudentProfile() {
  const { auth } = useContext(AuthContext);
  const [profile, setProfile] = useState(blankProfile);
  const [savedProfile, setSavedProfile] = useState(null);
  const [experiences, setExperiences] = useState([emptyExperience()]);
  const [education, setEducation] = useState([emptyEducation()]);
  const [skills, setSkills] = useState([emptySkill()]);
  const [projects, setProjects] = useState([emptyProject()]);
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!auth.accessToken) {
        setNotice({ type: "error", text: "Please sign in to view and edit your profile." });
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/students/profile/me", {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        if (!isActive) return;

        const data = response.data;
        const details = data.profile_details || {};
        const savedEducation = Array.isArray(details.education) ? details.education : [];
        const savedSkills = Array.isArray(details.skills) ? details.skills : [];
        const savedProjects = Array.isArray(details.projects) ? details.projects : [];
        const savedExperiences = Array.isArray(details.experiences)
          ? details.experiences
          : Array.isArray(data.experiences)
            ? data.experiences
            : [];
        const legacySkills = (data.skill_name || "")
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ name, level: "", years: "" }));
        const legacyEducation =
          data.branch || data.cgpa || data.batch_year
            ? [{
                ...emptyEducation(),
                degree: data.branch || "",
                grade: data.cgpa == null ? "" : String(data.cgpa),
                graduation_year: data.batch_year == null ? "" : String(data.batch_year),
              }]
            : [];
        const legacyProject =
          data.title || data.description || data.tech_stack
            ? [{
                ...emptyProject(),
                title: data.title || "",
                description: data.description || "",
                tech_stack: data.tech_stack || "",
              }]
            : [];

        setProfile({
          ...blankProfile,
          ...data,
          profile_details: { ...blankProfile.profile_details, ...details },
        });
        setSavedProfile(hasSavedProfile(data) ? data : null);
        setEducation(savedEducation.length ? savedEducation : legacyEducation.length ? legacyEducation : [emptyEducation()]);
        setSkills(savedSkills.length ? savedSkills : legacySkills.length ? legacySkills : [emptySkill()]);
        setProjects(savedProjects.length ? savedProjects : legacyProject.length ? legacyProject : [emptyProject()]);
        setExperiences(savedExperiences.length ? savedExperiences : [emptyExperience()]);
      } catch (error) {
        if (!isActive) return;
        setNotice({
          type: "error",
          text: error.response?.data?.detail || "We couldn't load your profile. Please try again.",
        });
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, [auth.accessToken]);

  const filledSections = useMemo(() => {
    const details = profile.profile_details;
    return [
      Boolean(profile.name && profile.phone),
      Boolean(details.headline && details.summary),
      education.some((item) => item.degree && item.institution),
      skills.some((item) => item.name),
      experiences.some((item) => item.role && item.company),
      projects.some((item) => item.title),
      Boolean(details.preferred_location && details.employment_type),
      Boolean(profile.resume || resumeFile),
    ].filter(Boolean).length;
  }, [education, experiences, profile, projects, resumeFile, skills]);
  const completion = Math.round((filledSections / 8) * 100);

  const updateProfile = (event) => {
    const { name, value } = event.target;
    if (Object.prototype.hasOwnProperty.call(profile.profile_details, name)) {
      setProfile((current) => ({
        ...current,
        profile_details: { ...current.profile_details, [name]: value },
      }));
      return;
    }
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const updateRow = (setter, rows, index, event) => {
    const { name, value } = event.target;
    setter(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [name]: value } : row)));
  };

  const updateArrayRow = (setter, rows, index, field, value) => {
    setter(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const showError = (error) => {
    const detail = error.response?.data?.detail;
    setNotice({
      type: "error",
      text: typeof detail === "string" ? detail : "Your profile could not be saved. Please review the fields and try again.",
    });
  };

  const downloadResume = async () => {
    try {
      const response = await axios.get("/students/profile/me/resume", {
        responseType: "blob",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const downloadUrl = URL.createObjectURL(response.data);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = profile.resume_filename || "resume";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      showError(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    const firstEducation = education.find((item) => item.degree || item.institution) || {};
    const firstProject = projects.find((item) => item.title) || {};
    const completeDetails = {
      ...profile.profile_details,
      education: education.filter((item) => Object.values(item).some(Boolean)),
      skills: skills.filter((item) => item.name.trim()),
      projects: projects.filter((item) => item.title.trim()),
      experiences: experiences.filter((item) =>
        [item.company, item.role, item.description].some((value) => value.trim())
      ),
    };

    const formData = new FormData();
    formData.append("name", profile.name);
    formData.append("phone", profile.phone);
    formData.append("branch", firstEducation.degree || "");
    formData.append("cgpa", firstEducation.grade || "");
    formData.append("backlogs", profile.backlogs || "");
    formData.append("batch_year", firstEducation.graduation_year || "");
    formData.append("skill_name", completeDetails.skills.map((item) => item.name.trim()).join(", "));
    formData.append("title", firstProject.title || "");
    formData.append("description", firstProject.description || "");
    formData.append("tech_stack", firstProject.tech_stack || "");
    formData.append("profile_details", JSON.stringify(completeDetails));
    formData.append("experiences", JSON.stringify(completeDetails.experiences));
    if (resumeFile) formData.append("resume", resumeFile);

    try {
      const response = await axios.put("/students/profile/me", formData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile((current) => ({ ...current, ...response.data }));
      setSavedProfile(response.data);
      setNotice({ type: "success", text: "Your employee profile has been saved." });
      setResumeFile(null);
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const renderRowInput = (setter, rows, index, name, label, placeholder, type = "text") => (
    <Field label={label} id={`${name}-${index}`}>
      <input
        id={`${name}-${index}`}
        name={name}
        type={type}
        value={rows[index][name] || ""}
        onChange={(event) => updateRow(setter, rows, index, event)}
        placeholder={placeholder}
      />
    </Field>
  );
  const savedDetails = savedProfile?.profile_details || {};
  const savedEducation = Array.isArray(savedDetails.education) ? savedDetails.education : [];
  const savedSkills = Array.isArray(savedDetails.skills) ? savedDetails.skills : [];
  const savedProjects = Array.isArray(savedDetails.projects) ? savedDetails.projects : [];
  const savedExperiences = Array.isArray(savedDetails.experiences) && savedDetails.experiences.length
    ? savedDetails.experiences
    : Array.isArray(savedProfile?.experiences)
      ? savedProfile.experiences
      : [];

  return (
    <div className="employee-profile">
      <header className="employee-profile__header">
        <div className="employee-profile__header-inner">
          <AtoZBrand className="pp-brand--dashboard" />
          <Link className="employee-profile__back-link" to="/Home">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to opportunities
          </Link>
        </div>
      </header>

      <div className="employee-profile__hero">
        <div className="employee-profile__hero-inner">
          <span className="employee-profile__eyebrow"><Sparkles size={14} /> YOUR CAREER, CLEARLY PRESENTED</span>
          <h1>Build a profile that opens doors.</h1>
          <p>Share the details that help the right opportunities find you.</p>
        </div>
      </div>

      <main className="employee-profile__layout">
        <aside className="employee-profile__sidebar">
          <section className="employee-profile__progress-card">
            <div className="employee-profile__avatar">
              {profile.name ? profile.name.trim().charAt(0).toUpperCase() : <UserRound size={27} />}
            </div>
            <h2>{profile.name || auth.user || "Your profile"}</h2>
            <p>{profile.profile_details.headline || "Add a professional headline"}</p>
            {profile.profile_details.city && (
              <span className="employee-profile__location">
                <MapPin size={14} aria-hidden="true" />
                {profile.profile_details.city}
                {profile.profile_details.state ? `, ${profile.profile_details.state}` : ""}
              </span>
            )}
            <div className="employee-profile__progress-label">
              <span>Profile strength</span>
              <strong>{completion}%</strong>
            </div>
            <div
              className="employee-profile__progress-track"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Profile completion"
            >
              <span style={{ width: `${completion}%` }} />
            </div>
            <p className="employee-profile__progress-hint">
              Complete the sections below to give recruiters a fuller picture of you.
            </p>
            <ul className="employee-profile__checklist">
              {["Personal details", "Professional summary", "Education", "Skills", "Experience", "Projects", "Job preferences", "Resume"].map((label, index) => {
                const complete = [
                  Boolean(profile.name && profile.phone),
                  Boolean(profile.profile_details.headline && profile.profile_details.summary),
                  education.some((item) => item.degree && item.institution),
                  skills.some((item) => item.name),
                  experiences.some((item) => item.role && item.company),
                  projects.some((item) => item.title),
                  Boolean(profile.profile_details.preferred_location && profile.profile_details.employment_type),
                  Boolean(profile.resume || resumeFile),
                ][index];
                return (
                  <li className={complete ? "is-complete" : ""} key={label}>
                    <span>{complete ? <Check size={12} /> : index + 1}</span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="employee-profile__privacy-card">
            <span><FileText size={17} aria-hidden="true" /></span>
            <div>
              <strong>Your information stays yours</strong>
              <p>Only share details you are comfortable including in your professional profile.</p>
            </div>
          </section>
        </aside>

        <form className="employee-profile__form" onSubmit={handleSubmit}>
          {notice && (
            <div className={`employee-profile__notice employee-profile__notice--${notice.type}`} role="status">
              {notice.text}
            </div>
          )}
          {loading && <div className="employee-profile__loading">Loading your profile…</div>}

          <section className="employee-profile__section">
            <SectionHeading icon={UserRound} title="Personal details" description="How recruiters can identify and reach you." />
            <div className="employee-profile__grid">
              <Field label="Full name" id="name">
                <input id="name" name="name" value={profile.name} onChange={updateProfile} placeholder="Your full name" autoComplete="name" />
              </Field>
              <Field label="Account email" id="email" hint="This is the email attached to your account.">
                <input id="email" value={profile.email} readOnly />
              </Field>
              <Field label="Phone number" id="phone">
                <input id="phone" name="phone" type="tel" value={profile.phone || ""} onChange={updateProfile} placeholder="+91 98765 43210" autoComplete="tel" />
              </Field>
              <Field label="Date of birth" id="date_of_birth">
                <input id="date_of_birth" name="date_of_birth" type="date" value={profile.profile_details.date_of_birth || ""} onChange={updateProfile} />
              </Field>
              <Field label="City" id="city">
                <input id="city" name="city" value={profile.profile_details.city || ""} onChange={updateProfile} placeholder="e.g. Bengaluru" autoComplete="address-level2" />
              </Field>
              <Field label="State / region" id="state">
                <input id="state" name="state" value={profile.profile_details.state || ""} onChange={updateProfile} placeholder="e.g. Karnataka" autoComplete="address-level1" />
              </Field>
              <Field label="Country" id="country">
                <input id="country" name="country" value={profile.profile_details.country || ""} onChange={updateProfile} placeholder="e.g. India" autoComplete="country-name" />
              </Field>
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={BriefcaseBusiness} title="Professional summary" description="A clear introduction to your experience, strengths, and career direction." />
            <div className="employee-profile__grid">
              <Field label="Professional headline" id="headline" hint="Example: Entry-level Data Analyst | SQL, Python & Power BI">
                <input id="headline" name="headline" value={profile.profile_details.headline || ""} onChange={updateProfile} placeholder="What kind of professional are you?" maxLength={140} />
              </Field>
              <Field label="Current role" id="current_role">
                <input id="current_role" name="current_role" value={profile.profile_details.current_role || ""} onChange={updateProfile} placeholder="Your current or most recent role" />
              </Field>
              <Field label="Current / most recent company" id="current_company">
                <input id="current_company" name="current_company" value={profile.profile_details.current_company || ""} onChange={updateProfile} placeholder="Company name" />
              </Field>
              <Field label="Total experience" id="total_experience">
                <input id="total_experience" name="total_experience" value={profile.profile_details.total_experience || ""} onChange={updateProfile} placeholder="e.g. 2 years 6 months" />
              </Field>
              <div className="employee-profile__field employee-profile__field--wide">
                <Field label="About you" id="summary" hint="Mention your strengths, achievements, and what you want to work on next.">
                  <textarea id="summary" name="summary" value={profile.profile_details.summary || ""} onChange={updateProfile} placeholder="Write a concise professional introduction…" rows={5} maxLength={1200} />
                </Field>
                <span className="employee-profile__character-count">{(profile.profile_details.summary || "").length}/1200</span>
              </div>
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={GraduationCap} title="Education" description="Add your qualifications, institutions, and academic results." />
            <div className="employee-profile__repeat-list">
              {education.map((item, index) => (
                <div className="employee-profile__repeat-card" key={`education-${index}`}>
                  <div className="employee-profile__repeat-title"><span>Qualification {index + 1}</span></div>
                  <div className="employee-profile__grid">
                    {renderRowInput(setEducation, education, index, "degree", "Degree / qualification", "e.g. B.Tech")}
                    {renderRowInput(setEducation, education, index, "field_of_study", "Field of study", "e.g. Computer Science")}
                    {renderRowInput(setEducation, education, index, "institution", "College / institution", "Institution name")}
                    {renderRowInput(setEducation, education, index, "graduation_year", "Graduation year", "e.g. 2025", "number")}
                    {renderRowInput(setEducation, education, index, "grade", "CGPA / percentage", "e.g. 8.4", "number")}
                  </div>
                  <ListActions
                    onAdd={() => setEducation((current) => [...current, emptyEducation()])}
                    onRemove={education.length > 1 ? () => setEducation((current) => current.filter((_, rowIndex) => rowIndex !== index)) : null}
                    removeLabel={`Remove qualification ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={Sparkles} title="Skills" description="List the skills you can bring to a role and your confidence in each." />
            <div className="employee-profile__repeat-list">
              {skills.map((item, index) => (
                <div className="employee-profile__repeat-card employee-profile__repeat-card--compact" key={`skill-${index}`}>
                  <div className="employee-profile__grid">
                    {renderRowInput(setSkills, skills, index, "name", "Skill", "e.g. React")}
                    <Field label="Proficiency" id={`skill-level-${index}`}>
                      <select id={`skill-level-${index}`} value={item.level || ""} onChange={(event) => updateArrayRow(setSkills, skills, index, "level", event.target.value)}>
                        <option value="">Choose level</option>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert</option>
                      </select>
                    </Field>
                    {renderRowInput(setSkills, skills, index, "years", "Years used", "e.g. 2", "number")}
                  </div>
                  <ListActions
                    onAdd={() => setSkills((current) => [...current, emptySkill()])}
                    onRemove={skills.length > 1 ? () => setSkills((current) => current.filter((_, rowIndex) => rowIndex !== index)) : null}
                    removeLabel={`Remove skill ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={BriefcaseBusiness} title="Work experience" description="Describe your responsibilities and the impact of each role." />
            <div className="employee-profile__repeat-list">
              {experiences.map((item, index) => (
                <div className="employee-profile__repeat-card" key={`experience-${index}`}>
                  <div className="employee-profile__repeat-title"><span>Role {index + 1}</span></div>
                  <div className="employee-profile__grid">
                    {renderRowInput(setExperiences, experiences, index, "role", "Job title", "e.g. Customer Support Associate")}
                    {renderRowInput(setExperiences, experiences, index, "company", "Company", "Company name")}
                    {renderRowInput(setExperiences, experiences, index, "experience", "Duration", "e.g. 1 year 4 months")}
                    {renderRowInput(setExperiences, experiences, index, "location", "Location", "City or remote")}
                    {renderRowInput(setExperiences, experiences, index, "start_date", "Start date", "", "date")}
                    {renderRowInput(setExperiences, experiences, index, "end_date", "End date", "", "date")}
                    <div className="employee-profile__field employee-profile__field--wide">
                      <Field label="Responsibilities and achievements" id={`experience-description-${index}`}>
                        <textarea id={`experience-description-${index}`} name="description" value={item.description || ""} onChange={(event) => updateRow(setExperiences, experiences, index, event)} placeholder="What did you own, improve, or deliver?" rows={3} />
                      </Field>
                    </div>
                  </div>
                  <ListActions
                    onAdd={() => setExperiences((current) => [...current, emptyExperience()])}
                    onRemove={experiences.length > 1 ? () => setExperiences((current) => current.filter((_, rowIndex) => rowIndex !== index)) : null}
                    removeLabel={`Remove role ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={FolderGit2} title="Projects" description="Showcase projects that demonstrate how you apply your skills." />
            <div className="employee-profile__repeat-list">
              {projects.map((item, index) => (
                <div className="employee-profile__repeat-card" key={`project-${index}`}>
                  <div className="employee-profile__repeat-title"><span>Project {index + 1}</span></div>
                  <div className="employee-profile__grid">
                    {renderRowInput(setProjects, projects, index, "title", "Project name", "Project title")}
                    {renderRowInput(setProjects, projects, index, "role", "Your contribution", "e.g. Frontend developer")}
                    {renderRowInput(setProjects, projects, index, "tech_stack", "Tools and technologies", "e.g. React, FastAPI, PostgreSQL")}
                    {renderRowInput(setProjects, projects, index, "url", "Project link", "https://")}
                    <div className="employee-profile__field employee-profile__field--wide">
                      <Field label="Project description" id={`project-description-${index}`}>
                        <textarea id={`project-description-${index}`} name="description" value={item.description || ""} onChange={(event) => updateRow(setProjects, projects, index, event)} placeholder="What problem did it solve, and what did you build?" rows={3} />
                      </Field>
                    </div>
                  </div>
                  <ListActions
                    onAdd={() => setProjects((current) => [...current, emptyProject()])}
                    onRemove={projects.length > 1 ? () => setProjects((current) => current.filter((_, rowIndex) => rowIndex !== index)) : null}
                    removeLabel={`Remove project ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={MapPin} title="Job preferences" description="Help recruiters understand the opportunities you are looking for." />
            <div className="employee-profile__grid">
              <Field label="Employment type" id="employment_type">
                <select id="employment_type" name="employment_type" value={profile.profile_details.employment_type || ""} onChange={updateProfile}>
                  <option value="">Choose employment type</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Apprenticeship</option>
                </select>
              </Field>
              <Field label="Preferred location(s)" id="preferred_location">
                <input id="preferred_location" name="preferred_location" value={profile.profile_details.preferred_location || ""} onChange={updateProfile} placeholder="e.g. Bengaluru, Pune, Remote" />
              </Field>
              <Field label="Notice period / availability" id="notice_period">
                <input id="notice_period" name="notice_period" value={profile.profile_details.notice_period || ""} onChange={updateProfile} placeholder="e.g. Immediate, 30 days" />
              </Field>
              <Field label="Expected salary (optional)" id="expected_salary">
                <input id="expected_salary" name="expected_salary" value={profile.profile_details.expected_salary || ""} onChange={updateProfile} placeholder="e.g. ₹6–8 LPA" />
              </Field>
              <Field label="Languages" id="languages" hint="Separate languages with commas.">
                <input id="languages" name="languages" value={profile.profile_details.languages || ""} onChange={updateProfile} placeholder="e.g. Hindi, English" />
              </Field>
              <Field label="Academic backlogs (if applicable)" id="backlogs">
                <input id="backlogs" name="backlogs" type="number" min="0" value={profile.backlogs ?? ""} onChange={updateProfile} placeholder="0" />
              </Field>
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={Link2} title="Professional links" description="Add links that help recruiters learn more about your work." />
            <div className="employee-profile__grid">
              <Field label="LinkedIn profile" id="linkedin_url">
                <input id="linkedin_url" name="linkedin_url" type="url" value={profile.profile_details.linkedin_url || ""} onChange={updateProfile} placeholder="https://linkedin.com/in/…" />
              </Field>
              <Field label="GitHub profile" id="github_url">
                <input id="github_url" name="github_url" type="url" value={profile.profile_details.github_url || ""} onChange={updateProfile} placeholder="https://github.com/…" />
              </Field>
              <Field label="Portfolio / personal website" id="portfolio_url">
                <input id="portfolio_url" name="portfolio_url" type="url" value={profile.profile_details.portfolio_url || ""} onChange={updateProfile} placeholder="https://…" />
              </Field>
            </div>
          </section>

          <section className="employee-profile__section">
            <SectionHeading icon={FileText} title="Resume" description="Upload a current resume so recruiters can review your experience." />
            {profile.resume && !resumeFile && (
              <button className="employee-profile__existing-resume" type="button" onClick={downloadResume}>
                <FileText size={18} aria-hidden="true" />
                <span><strong>{profile.resume_filename || "Current resume"}</strong><small>Download your uploaded document</small></span>
                <span className="employee-profile__resume-link">Download</span>
              </button>
            )}
            <label className="employee-profile__upload" htmlFor="resume">
              <span className="employee-profile__upload-icon"><Upload size={20} aria-hidden="true" /></span>
              <span>
                <strong>{resumeFile ? resumeFile.name : "Choose a resume to upload"}</strong>
                <small>PDF, DOC, or DOCX · up to 10 MB</small>
              </span>
              <span className="employee-profile__upload-cta">Browse files</span>
              <input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
            </label>
          </section>

          <div className="employee-profile__submit-row">
            <p>Your changes are saved to your employee profile.</p>
            <button className="employee-profile__save-button" type="submit" disabled={saving || loading}>
              <Save size={17} aria-hidden="true" />
              {saving ? "Saving profile…" : "Save profile"}
            </button>
          </div>
        </form>
        {savedProfile && (
          <section className="employee-profile__saved-preview" aria-labelledby="saved-profile-title">
            <div className="employee-profile__preview-header">
              <div>
                <span className="employee-profile__preview-eyebrow">SAVED TO YOUR ACCOUNT</span>
                <h2 id="saved-profile-title">Your profile details</h2>
                <p>This is the profile information currently saved for recruiters to review.</p>
              </div>
              {savedProfile.resume && (
                <button className="employee-profile__preview-cv" type="button" onClick={downloadResume}>
                  <FileText size={17} aria-hidden="true" />
                  <span>{savedProfile.resume_filename || "View your CV"}</span>
                  <span className="employee-profile__resume-link">Download CV</span>
                </button>
              )}
            </div>

            <div className="employee-profile__preview-section">
              <h3><UserRound size={16} aria-hidden="true" /> Personal details</h3>
              <div className="employee-profile__preview-grid">
                <PreviewField label="Full name" value={savedProfile.name} />
                <PreviewField label="Email" value={savedProfile.email} />
                <PreviewField label="Phone" value={savedProfile.phone} />
                <PreviewField label="Date of birth" value={savedDetails.date_of_birth} />
                <PreviewField
                  label="Location"
                  value={[
                    savedDetails.city,
                    savedDetails.state,
                    savedDetails.country,
                  ].filter(Boolean).join(", ")}
                />
                <PreviewField label="Qualification" value={savedProfile.branch} />
                <PreviewField label="CGPA / percentage" value={savedProfile.cgpa} />
                <PreviewField label="Graduation year" value={savedProfile.batch_year} />
              </div>
            </div>

            {(savedDetails.headline ||
              savedDetails.summary ||
              savedDetails.current_role ||
              savedDetails.current_company ||
              savedDetails.total_experience) && (
              <div className="employee-profile__preview-section">
                <h3><BriefcaseBusiness size={16} aria-hidden="true" /> Professional summary</h3>
                <div className="employee-profile__preview-grid">
                  <PreviewField label="Headline" value={savedDetails.headline} />
                  <PreviewField label="Current role" value={savedDetails.current_role} />
                  <PreviewField label="Company" value={savedDetails.current_company} />
                  <PreviewField label="Total experience" value={savedDetails.total_experience} />
                  <PreviewField label="About" value={savedDetails.summary} />
                </div>
              </div>
            )}

            {savedEducation.length > 0 && (
              <div className="employee-profile__preview-section">
                <h3><GraduationCap size={16} aria-hidden="true" /> Education</h3>
                <div className="employee-profile__preview-list">
                  {savedEducation.map((item, index) => (
                    <article className="employee-profile__preview-item" key={`saved-education-${index}`}>
                      <strong>{[item.degree, item.field_of_study].filter(Boolean).join(" · ") || "Qualification"}</strong>
                      <span>{item.institution}</span>
                      <small>{[item.graduation_year, item.grade].filter(Boolean).join(" · ")}</small>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {savedSkills.length > 0 && (
              <div className="employee-profile__preview-section">
                <h3><Sparkles size={16} aria-hidden="true" /> Skills</h3>
                <div className="employee-profile__preview-tags">
                  {savedSkills.map((item, index) => (
                    <span key={`saved-skill-${index}`}>
                      {item.name}{item.level ? ` · ${item.level}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {savedExperiences.length > 0 && (
              <div className="employee-profile__preview-section">
                <h3><BriefcaseBusiness size={16} aria-hidden="true" /> Work experience</h3>
                <div className="employee-profile__preview-list">
                  {savedExperiences.map((item, index) => (
                    <article className="employee-profile__preview-item" key={`saved-experience-${index}`}>
                      <strong>{item.role || "Role"}{item.company ? ` · ${item.company}` : ""}</strong>
                      <span>{[item.location, item.experience].filter(Boolean).join(" · ")}</span>
                      {(item.start_date || item.end_date) && (
                        <small>{[item.start_date, item.end_date].filter(Boolean).join(" – ")}</small>
                      )}
                      {item.description && <p>{item.description}</p>}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {savedProjects.length > 0 && (
              <div className="employee-profile__preview-section">
                <h3><FolderGit2 size={16} aria-hidden="true" /> Projects</h3>
                <div className="employee-profile__preview-list">
                  {savedProjects.map((item, index) => (
                    <article className="employee-profile__preview-item" key={`saved-project-${index}`}>
                      <strong>{item.title}</strong>
                      {item.role && <span>{item.role}</span>}
                      {item.tech_stack && <small>{item.tech_stack}</small>}
                      {item.description && <p>{item.description}</p>}
                      {item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>}
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="employee-profile__preview-section">
              <h3><MapPin size={16} aria-hidden="true" /> Job preferences</h3>
              <div className="employee-profile__preview-grid">
                <PreviewField label="Employment type" value={savedDetails.employment_type} />
                <PreviewField label="Preferred location" value={savedDetails.preferred_location} />
                <PreviewField label="Availability" value={savedDetails.notice_period} />
                <PreviewField label="Expected salary" value={savedDetails.expected_salary} />
                <PreviewField label="Languages" value={savedDetails.languages} />
              </div>
            </div>

            {(savedDetails.linkedin_url || savedDetails.github_url || savedDetails.portfolio_url) && (
              <div className="employee-profile__preview-section">
                <h3><Link2 size={16} aria-hidden="true" /> Professional links</h3>
                <div className="employee-profile__preview-links">
                  {[
                    ["LinkedIn", savedDetails.linkedin_url],
                    ["GitHub", savedDetails.github_url],
                    ["Portfolio", savedDetails.portfolio_url],
                  ].filter(([, url]) => url).map(([label, url]) => (
                    <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
