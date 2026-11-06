import React, { useState } from "react";
import axios from "axios";

export default function SkillName() {

  const [skillData, setSkillData] = useState({
    skill_name: "",
  });

  const handleChange = (e) => {
    setSkillData({
      ...skillData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const response = await axios.post(
        "https://brd-6.onrender.com/students/Profile/skills",
        {
          skill_name: skillData.skill_name,
        }
      );

      console.log(response.data);

      alert("Skill Saved Successfully");

      setSkillData({
        skill_name: "",
      });

    } catch (error) {

      console.error(error);
      alert("Error while saving skill");

    }
  };

  return (
    <div style={styles.container}>

      <form onSubmit={handleSubmit} style={styles.form}>

        <h2>Skill </h2>

        <input
          type="text"
          name="skill_name"
          placeholder="Enter Skill Name"
          value={skillData.skill_name}
          onChange={handleChange}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Save Skill
        </button>

      </form>

    </div>
  );
}

const styles = {

  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "50px",
  },

  form: {
    width: "350px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    padding: "25px",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    borderRadius: "10px",
  },

  input: {
    padding: "10px",
    fontSize: "16px",
  },

  button: {
    padding: "12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },

};