// import React, { useState } from "react";
// import axios from "axios";

// export default function StudentProfile() {

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     branch: "",
//     cgpa: "",
//     backlogs: "",
//     batch_year: "",
//     skill_name: "",
//     title: "",
//     description: "",
//     tech_stack: "",
//     resume: null,
//   });

//   const [experiences, setExperiences] = useState([
//     {
//       company: "",
//       role: "",
//       experience: "",
//       start_date: "",
//       end_date: "",
//     },
//   ]);

//   const [savedProfile, setSavedProfile] = useState(null);
//   const [showProfile, setShowProfile] = useState(false);

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     setFormData({
//       ...formData,
//       [name]: files ? files[0] : value,
//     });
//   };

//   const handleExperienceChange = (index, e) => {
//     const values = [...experiences];
//     values[index][e.target.name] = e.target.value;
//     setExperiences(values);
//   };

//   const addExperience = () => {
//     setExperiences([
//       ...experiences,
//       {
//         company: "",
//         role: "",
//         experience: "",
//         start_date: "",
//         end_date: "",
//       },
//     ]);
//   };

//   const removeExperience = (index) => {
//     const values = [...experiences];
//     values.splice(index, 1);
//     setExperiences(values);
//   };

//   // ✅ SAVE
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const data = new FormData();

//       Object.keys(formData).forEach((key) => {
//         data.append(key, formData[key]);
//       });

//       data.append("experiences", JSON.stringify(experiences));

//       const response = await axios.post(
//         "https://brd-6.onrender.com/students/students",
//         data,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );

//       // 🔥 IMPORTANT FIX: store full response safely
//       setSavedProfile(response.data);

//       alert("Profile Saved Successfully");

//     } catch (error) {
//       console.error(error);
//       alert("Error While Saving Profile");
//     }
//   };

//   // ✅ VIEW PROFILE (FIXED)
//   const handleViewProfile = async () => {
//     try {
//       if (!savedProfile) {
//         alert("Please save profile first");
//         return;
//       }

//       const id = savedProfile.id || savedProfile?.student_id;

//       if (!id) {
//         alert("Profile ID not found in response");
//         return;
//       }

//       const res = await axios.get(
//         `https://brd-6.onrender.com/students/students/${id}`
//       );

//       setSavedProfile(res.data);
//       setShowProfile(true);

//     } catch (error) {
//       console.error(error);
//       alert("Error fetching profile");
//     }
//   };

//   return (
//     <div style={styles.page}>

//       <form onSubmit={handleSubmit} style={styles.form}>
//         <h1 style={styles.heading}>Student Profile</h1>

//         {/* YOUR FORM FIELDS (UNCHANGED) */}

//         <button type="submit" style={styles.button}>
//           Save Complete Profile
//         </button>

//         <button
//           type="button"
//           onClick={handleViewProfile}
//           style={styles.addBtn}
//         >
//           View Profile
//         </button>
//       </form>

//       {/* ✅ PROFILE VIEW */}
//       {showProfile && savedProfile && (
//         <div style={styles.card}>
//           <h2>Profile Details</h2>

//           <p><b>Name:</b> {savedProfile.name}</p>
//           <p><b>Email:</b> {savedProfile.email}</p>
//           <p><b>Phone:</b> {savedProfile.phone}</p>
//           <p><b>Branch:</b> {savedProfile.branch}</p>
//           <p><b>CGPA:</b> {savedProfile.cgpa}</p>

//           <p><b>Skills:</b> {savedProfile.skill_name}</p>

//           <p><b>Project:</b> {savedProfile.title}</p>
//           <p><b>Description:</b> {savedProfile.description}</p>
//           <p><b>Tech Stack:</b> {savedProfile.tech_stack}</p>

//           {/* 🔥 EXPERIENCE FIX */}
//           <h3>Experience</h3>
//           {savedProfile.experiences &&
//             JSON.parse(savedProfile.experiences || "[]").map((exp, i) => (
//               <div key={i}>
//                 <p>{exp.company} - {exp.role}</p>
//               </div>
//             ))
//           }

//           <button
//             onClick={() => setShowProfile(false)}
//             style={styles.removeBtn}
//           >
//             Close View
//           </button>
//         </div>
//       )}

//     </div>
//   );
// }
// const styles = {
//   page: {
//     backgroundColor: "#f4f4f4",
//     minHeight: "100vh",
//     padding: "40px",
//     display: "flex",
//     justifyContent: "center",
//   },

//   form: {
//     width: "850px",
//     display: "flex",
//     flexDirection: "column",
//     gap: "25px",
//   },

//   heading: {
//     textAlign: "center",
//     color: "#1e293b",
//     fontSize: "36px",
//     fontWeight: "bold",
//   },

//   card: {
//     backgroundColor: "white",
//     padding: "25px",
//     borderRadius: "10px",
//     boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "15px",
//     marginTop: "20px",
//   },

//   input: {
//     padding: "12px",
//     fontSize: "16px",
//     borderRadius: "6px",
//     border: "1px solid #ccc",
//   },

//   button: {
//     padding: "15px",
//     backgroundColor: "#0f766e",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "18px",
//     cursor: "pointer",
//   },

//   addBtn: {
//     padding: "12px",
//     backgroundColor: "#2563eb",
//     color: "white",
//     border: "none",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontSize: "16px",
//     marginTop: "10px",
//   },

//   removeBtn: {
//     padding: "10px",
//     backgroundColor: "#dc2626",
//     color: "white",
//     border: "none",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontSize: "15px",
//     marginTop: "10px",
//   },
// };