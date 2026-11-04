import React, { useState } from "react";

export default function PlacementOfficerForm() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    employeeId: "",
    designation: "Placement Officer",
    responsibilities: "Primary operator of the module"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitted Data:", formData);

    alert("Placement Officer Registered Successfully");
  };

  return (
    <div className="placement-form-container">

      <div className="form-card">

        <h2>Placement Officer Registration</h2>

        <p className="form-subtitle">
          Primary operator of the placement module
        </p>

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div className="form-group">
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Number</label>

            <input
              type="text"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* Department */}
          <div className="form-group">
            <label>Department</label>

            <input
              type="text"
              name="department"
              placeholder="Enter department"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          {/* Employee ID */}
          <div className="form-group">
            <label>Employee ID</label>

            <input
              type="text"
              name="employeeId"
              placeholder="Enter employee ID"
              value={formData.employeeId}
              onChange={handleChange}
            />
          </div>

          {/* Designation */}
          <div className="form-group">
            <label>Designation</label>

            <input
              type="text"
              name="designation"
              value={formData.designation}
              readOnly
            />
          </div>

          {/* Responsibilities */}
          <div className="form-group">
            <label>Responsibilities</label>

            <textarea
              name="responsibilities"
              rows="4"
              value={formData.responsibilities}
              readOnly
            />
          </div>

          {/* Submit */}
          <button type="submit" className="submit-btn">
            Register Placement Officer
          </button>

        </form>

      </div>

    </div>
  );
}