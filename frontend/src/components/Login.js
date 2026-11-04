import { useRef, useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import AuthCardHeader from "./AuthCardHeader";


import axios from '../api/axios';


const Login = () => {
    const navigate = useNavigate();
    const { setAuth } = useContext(AuthContext);
    const userRef = useRef();
    const errRef = useRef();

    const [user, setUser] = useState('');
    const [pwd, setPwd] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        userRef.current.focus();
    }, [])

    useEffect(() => {
        setErrMsg('');
    }, [user, pwd])

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(
      "/stu_profile_registration/token",
      new URLSearchParams({
        username: user,
        password: pwd,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = response.data.access_token;

    // Save username for navbar
    localStorage.setItem("userName", user);
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("authUser", user);
    sessionStorage.setItem("authRole", "User");

    setAuth({ user, accessToken, roles: [2001] });

    setUser("");
    setPwd("");
    setSuccess(true);

    navigate("/Home");

  } catch (err) {
    if (!err?.response) {
      setErrMsg("No Server Response");
    } else if (err.response?.status === 400 || err.response?.status === 422) {
      setErrMsg("Missing Username or Password");
    } else if (err.response?.status === 401) {
      setErrMsg("Incorrect username or password");
    } else {
      setErrMsg("Login Failed");
    }

    errRef.current?.focus();
  }
};


    return (
       <>
  {success ? (
    <section className="success-container">
      {/* 🎉 Congratulations GIF */}
      <img
        src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWJqY29wdXozc2JmZjhudnR2dDRtaHo4Ym1zd3FnZTZtZXc0eHE0OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/RMZWv7UqikFGIvv6m4/giphy.gif"
        alt="Congratulations"
        className="success-gif"
      />

      <h2>🎉 Congratulations!</h2>
      <p>Login Successful</p>
      <p>Redirecting to Home...</p>
    </section>
  ) : (
    <section className="auth-card">
      <AuthCardHeader title="Welcome back" subtitle="Sign in to continue to your account." />
      <p
        ref={errRef}
        className={errMsg ? "errmsg" : "offscreen"}
        aria-live="assertive"
      >
        {errMsg}
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          ref={userRef}
          autoComplete="off"
          onChange={(e) => setUser(e.target.value)}
          value={user}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          onChange={(e) => setPwd(e.target.value)}
          value={pwd}
          required
        />

        <button>Sign In</button>
      </form>

      <p>
        Need an Account?
        <br />
        <span className="line">
          <a href="/register">Sign Up</a>
        </span>
      </p>
    </section>
  )}
</>
    )
}
export default Login