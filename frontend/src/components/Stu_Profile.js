// AtoZJobDashboard.jsx
import React, { useState } from "react";
import AtoZBrand from "./AtoZBrand";

export default function AtoZJobDashboard() {
  const [dropdown, setDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setDropdown(dropdown === name ? null : name);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ================= HEADER ================= */}
      <header className="bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <AtoZBrand className="pp-brand--dashboard" />

          {/* Nav */}
          <nav className="flex items-center gap-6 text-gray-700 font-medium">

            <a href="/" className="hover:text-teal-600">
              Invite Friends
            </a>

            {/* Jobs */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("jobs")}
                className="hover:text-teal-600"
              >
                Jobs ▾
              </button>

              {dropdown === "jobs" && (
                <div className="absolute top-10 left-0 bg-white shadow-lg rounded-lg w-48 p-3 flex flex-col gap-2">
                  <a href="/">IT Jobs</a>
                  <a href="/">Core Jobs</a>
                  <a href="/">Internships</a>
                  <a href="/">Remote Jobs</a>
                </div>
              )}
            </div>

            {/* Companies */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("companies")}
                className="hover:text-teal-600"
              >
                Companies ▾
              </button>

              {dropdown === "companies" && (
                <div className="absolute top-10 left-0 bg-white shadow-lg rounded-lg w-52 p-3 flex flex-col gap-2">
                  <a href="/">Top Companies</a>
                  <a href="/">Startup Hiring</a>
                  <a href="/">MNC Hiring</a>
                </div>
              )}
            </div>

            <a href="/" className="hover:text-teal-600">
              Activity
            </a>

            <a href="/" className="hover:text-teal-600">
              Inbox
            </a>

            <a href="/Profile" className="hover:text-teal-600">
              Profile
            </a>

            {/* Employer */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("employer")}
                className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600"
              >
                Employers ▾
              </button>

              {dropdown === "employer" && (
                <div className="absolute top-12 right-0 bg-white shadow-lg rounded-lg w-56 p-3 flex flex-col gap-2">
                  <a href="/">Post Jobs</a>
                  <a href="/">Hire Developers</a>
                  <a href="/">Campus Hiring</a>
                  <a href="/">Intern Hiring</a>
                  <a href="/">Bulk Hiring</a>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ================= PROFILE SECTION ================= */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 h-44 relative">

        {/* Profile */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-14 flex flex-col items-center">

          <img
            src="https://i.pravatar.cc/150"
            alt="profile"
            className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
          />

          <h2 className="mt-4 text-blue-700 text-3xl font-bold">
            Shivshankar Chaudhary
          </h2>

          <p className="text-blue-700/80 text-sm mt-1">
            Full Stack Developer | AI Engineer
          </p>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-7xl mx-auto mt-28 px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">

          <ProfileSection
            title="Job Preferences"
            content={[
              "Currently located in Bangalore",
              "Open to Remote / Hybrid opportunities",
              "Expected Salary: ₹18 LPA",
              "Can join within 30 days",
            ]}
          />

          <ProfileSection
            title="Skills"
            content={[
              "ReactJS, FastAPI, Django",
              "Python, LangChain, OpenAI",
              "Docker, Kubernetes, AWS",
              "PostgreSQL, MongoDB, Pinecone",
            ]}
          />

          <ProfileSection
            title="Experience"
            content={[
              "Technical Lead at Accenture",
              "6+ Years Experience",
              "Built AI-based enterprise solutions",
            ]}
          />

          <ProfileSection
            title="Education"
            content={[
              "M.Tech - Electronics",
              "RGPV University, Bhopal",
            ]}
          />

          {/* Resume */}
          <div className="py-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Resume
              </h3>

              <button className="text-teal-600 font-medium">
                Edit
              </button>
            </div>

            <div className="border rounded-xl p-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📄</div>

                <div>
                  <p className="font-semibold">
                    Shivshankar_Resume.pdf
                  </p>

                  <p className="text-sm text-gray-500">
                    Updated April 2025
                  </p>
                </div>
              </div>

              <button className="text-red-500 text-xl">
                ❌
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="py-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Links
              </h3>

              <button className="text-teal-600 font-medium">
                Edit
              </button>
            </div>

            <div className="flex gap-5 text-3xl">
              <span>🔗</span>
              <span>💼</span>
              <span>🌐</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">

          {/* CARD 1 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              Recommended Companies
            </h3>

            <p className="text-gray-600 leading-7">
              Top companies are actively searching for candidates
              with Full Stack and AI experience.
            </p>

            <button className="mt-5 w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg">
              View Opportunities
            </button>
          </div>

          {/* CARD 2 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              Interview Tips
            </h3>

            <ul className="space-y-3 text-gray-600">
              <li>✔ Keep your resume updated</li>
              <li>✔ Add project links</li>
              <li>✔ Respond quickly to recruiters</li>
              <li>✔ Practice DSA & System Design</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
<footer className="mt-16 bg-white border-t">
  <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm text-gray-600">

    {/* Column 1 */}
    <div>
      <h4 className="font-semibold mb-4 text-gray-800">
        Jobs by Location
      </h4>

      <ul className="space-y-2">
        <li>Bangalore</li>
        <li>Delhi / NCR</li>
        <li>Hyderabad</li>
        <li>Mumbai</li>
      </ul>
    </div>

    {/* Column 2 */}
    <div>
      <h4 className="font-semibold mb-4 text-gray-800">
        Jobs by Function
      </h4>

      <ul className="space-y-2">
        <li>Software Engineering</li>
        <li>Marketing</li>
        <li>Sales</li>
        <li>Internships</li>
      </ul>
    </div>

    {/* Column 3 */}
    <div>
      <h4 className="font-semibold mb-4 text-gray-800">
        Employers
      </h4>

      <ul className="space-y-2">
        <li>Post Jobs</li>
        <li>Campus Hiring</li>
        <li>Resources</li>
      </ul>
    </div>

    {/* Column 4 */}
    <div>
      <h4 className="font-semibold mb-4 text-gray-800">
        Vitae
      </h4>

      <ul className="space-y-2">
        <li>About</li>
        <li>Privacy</li>
        <li>Terms</li>
      </ul>
    </div>

    {/* Column 5 */}
    <div>
      <h4 className="font-semibold mb-4 text-gray-800">
        Connect
      </h4>

      <a href="/" className="block mb-2 hover:text-teal-600">
        Help Center
      </a>

      <a href="/" className="block mb-4 hover:text-teal-600">
        Contact Us
      </a>

      <div className="flex gap-3">
       <div className="w-10 h-10 rounded-none bg-gray-500 flex items-center justify-center hover:bg-teal-500 text-white font-bold cursor-pointer">
          f
        </div>

        <div className="w-10 h-10 rounded-none bg-gray-500 flex items-center justify-center hover:bg-teal-500 text-white font-bold cursor-pointer">
          in
        </div>

        <div className="w-10 h-10 rounded-none bg-gray-500 flex items-center justify-center hover:bg-teal-500 text-white font-bold cursor-pointer">
          t
        </div>
      </div>
    </div>

  </div>
</footer>
    </div>
  );
}

/* ================= REUSABLE SECTION ================= */
function ProfileSection({ title, content }) {
  return (
    <div className="border-b py-6">
      <div className="flex justify-between items-center mb-4">

        <h3 className="text-xl font-semibold">
          {title}
        </h3>

        <button className="text-teal-600 font-medium">
          Edit
        </button>
      </div>

      <ul className="space-y-2 text-gray-700">
        {content.map((item, index) => (
          <li key={index}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}