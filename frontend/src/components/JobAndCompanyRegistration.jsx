import React, { useState } from "react";
import axios from "axios";

function JobAndCompanyRegistration() {
  const [formData, setFormData] = useState({
    // Company Information
    industry: "",
    Position: "",
    tier: "",
    founded_in: "",
    employe: "",
    description: "",
    skills_requirement: "",
    company_id: "",

    // Job/Drive Information
    title: "",
    ctc: "",
    stipend: "",
    location: "",
    drive_type: "walk-in",

    // Eligibility
    min_cgpa: "",
    allowed_branches: "Computer Science",
    max_backlogs: "",
    batch_year: new Date().getFullYear(),

    // Rounds
    round_name: "",
    round_order: "",
    is_elimination: false,
  });

  const [submittedData, setSubmittedData] = useState(null);
  const [rounds, setRounds] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addRound = () => {
    if (formData.round_name && formData.round_order) {
      setRounds([
        ...rounds,
        {
          name: formData.round_name,
          order: Number(formData.round_order),
          is_elimination: formData.is_elimination,
        },
      ]);
      setFormData({
        ...formData,
        round_name: "",
        round_order: "",
        is_elimination: false,
      });
    } else {
      alert("Please fill in round name and order");
    }
  };

  const removeRound = (index) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jobData = {
        title: formData.title,
        company_id: Number(formData.company_id),
        ctc: Number(formData.ctc),
        stipend: Number(formData.stipend),
        location: formData.location,
        drive_type: formData.drive_type,
        eligibility: {
          min_cgpa: Number(formData.min_cgpa),
          allowed_branches: formData.allowed_branches,
          max_backlogs: Number(formData.max_backlogs),
          batch_year: Number(formData.batch_year),
        },
        rounds: rounds,
      };

      const companyData = {
        industry: formData.industry,
        Position: formData.Position,
        tier: formData.tier,
        founded_in: formData.founded_in,
        employe: Number(formData.employe),
        description: formData.description,
        skills_requirement: formData.skills_requirement,
      };

      // Submit company data
      const companyResponse = await axios.post(
        "http://127.0.0.1:8000/company/ Company & Recruiter Management/",
        companyData
      );

      // Submit job data
      const jobResponse = await axios.post(
        "https://brd-5.onrender.com/jobs/",
        jobData
      );

      alert("Company and Job Posted Successfully");

      setSubmittedData({
        company: companyResponse.data,
        job: jobResponse.data,
      });

      // Reset form
      setFormData({
        industry: "",
        Position: "",
        tier: "",
        founded_in: "",
        employe: "",
        description: "",
        skills_requirement: "",
        company_id: "",
        title: "",
        ctc: "",
        stipend: "",
        location: "",
        drive_type: "walk-in",
        min_cgpa: "",
        allowed_branches: "Computer Science",
        max_backlogs: "",
        batch_year: new Date().getFullYear(),
        round_name: "",
        round_order: "",
        is_elimination: false,
      });
      setRounds([]);
    } catch (error) {
      console.error(error);
      alert("Failed to register company and job");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🏢 Company & Job Registration</h1>
        <p style={styles.subtitle}>
          Register Company and Post Job for Campus Recruitment
        </p>

        <form onSubmit={handleSubmit}>
          {/* Company Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Company Information</h2>

            <div style={styles.formGroup}>
              <label>Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label>Position</label>
              <input
                type="text"
                name="Position"
                value={formData.Position}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label>Tier</label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  style={styles.input}
                  required
                >
                  <option value="">Select Tier</option>
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select>
              </div>

              <div style={{ ...styles.formGroup, flex: 1, marginLeft: "10px" }}>
                <label>Founded In</label>
                <input
                  type="date"
                  name="founded_in"
                  value={formData.founded_in}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label>Number of Employees</label>
              <input
                type="number"
                name="employe"
                value={formData.employe}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Skills Requirement</label>
              <input
                type="text"
                name="skills_requirement"
                value={formData.skills_requirement}
                onChange={handleChange}
                style={styles.input}
                placeholder="React, FastAPI, Python"
              />
            </div>
          </div>

          {/* Job Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Job Details</h2>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label>Company ID</label>
                <input
                  type="number"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1, marginLeft: "10px" }}>
                <label>Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label>CTC (Annual)</label>
                <input
                  type="number"
                  name="ctc"
                  value={formData.ctc}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1, marginLeft: "10px" }}>
                <label>Stipend (Monthly)</label>
                <input
                  type="number"
                  name="stipend"
                  value={formData.stipend}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1, marginLeft: "10px" }}>
                <label>Drive Type</label>
                <select
                  name="drive_type"
                  value={formData.drive_type}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="walk-in">Walk-in</option>
                  <option value="online">Online</option>
                  <option value="on-campus">On-Campus</option>
                </select>
              </div>
            </div>
          </div>

          {/* Eligibility Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Eligibility Criteria</h2>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label>Minimum CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  name="min_cgpa"
                  value={formData.min_cgpa}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1, marginLeft: "10px" }}>
                <label>Max Backlogs</label>
                <input
                  type="number"
                  name="max_backlogs"
                  value={formData.max_backlogs}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label>Allowed Branches</label>
                <input
                  type="text"
                  name="allowed_branches"
                  value={formData.allowed_branches}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1, marginLeft: "10px" }}>
                <label>Batch Year</label>
                <input
                  type="number"
                  name="batch_year"
                  value={formData.batch_year}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Rounds Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Interview Rounds</h2>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label>Round Name</label>
                <input
                  type="text"
                  name="round_name"
                  value={formData.round_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Technical, HR, Coding"
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1, marginLeft: "10px" }}>
                <label>Round Order</label>
                <input
                  type="number"
                  name="round_order"
                  value={formData.round_order}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 1, 2, 3"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_elimination"
                  checked={formData.is_elimination}
                  onChange={handleChange}
                  style={{ marginRight: "8px" }}
                />
                Is Elimination Round?
              </label>
            </div>

            <button
              type="button"
              style={styles.addButton}
              onClick={addRound}
            >
              + Add Round
            </button>

            {rounds.length > 0 && (
              <div style={styles.roundsList}>
                <h3>Added Rounds:</h3>
                {rounds.map((round, index) => (
                  <div key={index} style={styles.roundItem}>
                    <span>
                      {round.order}. {round.name}
                      {round.is_elimination && " (Elimination)"}
                    </span>
                    <button
                      type="button"
                      style={styles.removeButton}
                      onClick={() => removeRound(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" style={styles.button}>
            Register Company & Post Job
          </button>
        </form>

        {submittedData && (
          <div style={styles.result}>
            <h3>✅ Company and Job Posted Successfully</h3>
            <p>
              <strong>Company:</strong> {submittedData.company.industry}
            </p>
            <p>
              <strong>Position:</strong> {submittedData.job.title}
            </p>
            <p>
              <strong>Location:</strong> {submittedData.job.location}
            </p>
            <p>
              <strong>CTC:</strong> ₹{submittedData.job.ctc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "800px",
    background: "#fff",
    borderRadius: "20px",
    padding: "35px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  title: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "10px",
    color: "#1f2937",
  },

  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "30px",
    fontSize: "14px",
  },

  section: {
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "2px solid #e5e7eb",
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px",
    color: "#4f46e5",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "15px",
  },

  row: {
    display: "flex",
    gap: "20px",
  },

  input: {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    marginTop: "5px",
    fontSize: "14px",
    fontFamily: "inherit",
  },

  textarea: {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    marginTop: "5px",
    minHeight: "100px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    marginTop: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },

  button: {
    width: "100%",
    padding: "14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s",
  },

  addButton: {
    padding: "10px 15px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    marginTop: "10px",
  },

  roundsList: {
    marginTop: "15px",
    padding: "15px",
    background: "#f3f4f6",
    borderRadius: "8px",
  },

  roundItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    background: "#fff",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },

  removeButton: {
    padding: "6px 12px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },

  result: {
    marginTop: "30px",
    padding: "20px",
    borderRadius: "10px",
    background: "#f0fdf4",
    border: "2px solid #22c55e",
  },
};

export default JobAndCompanyRegistration;
