
import React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AtoZBrand from "./AtoZBrand";
import "./Home.css";


export default function JobBoardDashboard() {
  
   const [companyCount, setCompanyCount] = useState(0);
   const [applyStatus, setApplyStatus] = useState("");
   const navigate = useNavigate();
   const [appliedJobs, setAppliedJobs] = useState([]);
   const [userName, setUserName] = useState("");

useEffect(() => {
  const name = localStorage.getItem("userName");

  if (name) {
    setUserName(name);
  }

  fetchCompanyCount();
  fetchCompanies();
}, []);

  useEffect(() => {
    fetchCompanyCount();
  }, []);

  const fetchCompanyCount = async () => {
    try {
      const response = await axios.get(
        "https://brd-6.onrender.com/company/ Company & Recruiter Management/"
      );

      setCompanyCount(response.data.length);

    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
  fetchCompanyCount();
  fetchCompanies();
}, []);

const fetchCompanies = async () => {
  try {
    const response = await axios.get(
      "https://brd-6.onrender.com/company/ Company & Recruiter Management/"
    );

    setCompanies(response.data);
  } catch (error) {
    console.error(error);
  }
};


const handleApply = async (company) => {
  try {

    // Check already applied
    if (appliedJobs.includes(company.id)) {
      setApplyStatus("⚠️ You have already applied for this job!");

      setTimeout(() => {
        setApplyStatus("");
      }, 3000);

      return;
    }

    const response = await axios.post(
      "https://brd-6.onrender.com/jobs/Posting/apply",
      null,
      {
        params: {
          student_id: 1,
          drive_id: company.id,
        },
      }
    );

    // Applied Jobs List Update
    setAppliedJobs((prev) => [...prev, company.id]);

    // Inbox Count Increase
    setCompanyCount((prev) => prev + 1);

    // Success Message
    setApplyStatus(
      `✅ Job Applied Successfully! Total Applied Jobs: ${
        companyCount + 1
      }`
    );

    setTimeout(() => {
      setApplyStatus("");
    }, 3000);

  } catch (error) {
    console.error(error);

    setApplyStatus(
      "❌ Unable to apply. Please try again."
    );

    setTimeout(() => {
      setApplyStatus("");
    }, 3000);
  }
};

  return (
    <div className="dashboard employee-dashboard">
      {/* Navbar */}
      <header className="navbar">
  <div className="navbar-container">
    <AtoZBrand className="pp-brand--dashboard" />

    {/* Show message inside navbar only */}
    {applyStatus && (
      <div className="navbar-notification">
        {applyStatus}
      </div>
    )}

    <div className="nav-right">
      {/* <button className="premium-btn">
        Go Premium
      </button> */}

      <nav className="nav-menu">
        <Link to="/activity">
          <NavItem label="Activity" count="23" />
        </Link>

        <Link to="/opportunities">
          <NavItem label="Opportunities" count="128" />
        </Link>

        <Link to="/Job_inbox">
          <NavItem
            label="Inbox"
            count={companyCount}
          />
        </Link>

        {/* <Link to="/settings">
          <NavItem label="settings" />
        </Link> */}
        {/* <div className="nav-right"> */}
      <button className="premium-btn">
        Go Premium
      </button>

        <Link to="/Profile" className="profile-link">
  <div className="profile-container">
    
    <div className="avatar">
      {userName ? userName.charAt(0).toUpperCase() : "U"}
    </div>

    <div className="user-info">
      <span className="profile-label"></span>
      <span className="user-name">
        {userName || "User"}
      </span>
    </div>

  </div>
</Link>
        
      </nav>
    </div>
  </div>
</header>
{/* Popup Message */}
{applyStatus && (
  <div className="popup-message">
    {applyStatus}
  </div>
)}
      
      {/* <section className="hero">
        <h2>Showing 1 - 30 out of 128 jobs</h2>
        <p>that are recommended for you</p>
      </section> */}
      <section className="hero">
  <h2>
    Total Available Jobs: {companies.length}
  </h2>

  <p>
    Jobs posted by recruiters
  </p>
</section>

      {applyStatus && (
        <div className="apply-status-banner">
          {applyStatus}
        </div>
      )}

      
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="card">
          
<div className="search-box">
  <input
    type="text"
    placeholder="Search jobs, skills, companies..."
    className="search-input"
  />

  <button className="search-icon-btn">
    🔍
  </button>
</div>


          </div>

          <div className="card">
            <h3>Quick tip</h3>
            <p>
              Apply to several companies to increase
              your chances.
            </p>
            {/* Sidebar */}
<div className="sidebar">

  {/* Quick Tip */}
  <div className="sidebar-card">

    <h3>Quick tip</h3>

    <p>
      Since not all companies will go ahead,
      we encourage you to apply to several
      companies.
    </p>

    <p>
      However, avoid applying if you don’t want
      to interview, as any interview backouts
      will be shown to other companies!
    </p>

  </div>

  {/* Filter by Status */}
  <div className="sidebar-card">

    <h3>Filter by status</h3>

    <label>
      <input type="radio" name="status" checked />
      Undecided (128)
    </label>

    <label>
      <input type="radio" name="status" />
      Interested (109)
    </label>

    <label>
      <input type="radio" name="status" />
      Not Interested (2)
    </label>

  </div>

  {/* Filter by Location */}
  <div className="sidebar-card">

    <h3>Filter by location</h3>

    <label>
      <input type="checkbox" checked />
      All (128)
    </label>

    <label>
      <input type="checkbox" />
      Bangalore (59)
    </label>

    <label>
      <input type="checkbox" />
      Work From Home (25)
    </label>

    <label>
      <input type="checkbox" />
      Hyderabad (18)
    </label>

    <label>
      <input type="checkbox" />
      Pune (8)
    </label>

  </div>

</div>
          </div>
        </aside>

        {/* Jobs */}
        {/* <main className="jobs-section">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </main> */}
        <main className="jobs-section">
  {companies.map((company) => (
    <div key={company.id} className="job-card">
      <div className="job-content">
        <h2>{company.name || company.industry}</h2>

        <p>
          <strong>Position:</strong> {company.Position}
        </p>

        <p>
          <strong>Tier:</strong> {company.tier}
        </p>
          <p>
          <strong>FoundedIn:</strong> {company.founded_in}
        </p>
        <p>
          <strong>Employe:</strong> {company.employe}
        </p>
        <p>
          <strong>Decription:</strong> {company.description}
        </p>
         <p>
          <strong>Skill:</strong> {company.skills_requirement}
        </p>
        <button
          className="view-btn"
          onClick={() => handleApply(company)}
        >
          Apply Now
        </button>
      </div>
    </div>
  ))}
</main>
      </div>
    </div>
  );
}

function NavItem({ label, count }) {
  return (
    <div className="nav-item">
      {count && <span className="badge">{count}</span>}
      {label}
    </div>
  );
}

function JobCard({ job }) {
  return (
    <div className="job-card">
      <div className="job-left">
        <div className={`job-logo ${job.logoClass}`}>
          {job.logo}
        </div>

        <div className="job-content">
          <h2>
            {job.company} - {job.role}
          </h2>

          <div className="job-meta">
            <span>📍 {job.location}</span>

            <span>
              🏢 Founded in {job.founded} •{" "}
              {job.employees}
            </span>
          </div>

          <p>{job.description}</p>

          <div className="skills">
            {job.skills.map((skill) => (
              <span key={skill} className="skill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="job-right">
        <button className="view-btn">
          View »
        </button>

        <button className="ignore-btn">
          Not Interested
        </button>
      </div>
    </div>
  );
}
