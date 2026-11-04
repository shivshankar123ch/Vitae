import { useRef, useState, useEffect } from "react";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "../api/axios";
import { Link } from "react-router-dom";

import AuthCardHeader from "./AuthCardHeader";

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

const Register = () => {
    const userRef = useRef();
    const errRef = useRef();

    const [user, setUser] = useState("");
    const [validName, setValidName] = useState(false);

    const [email, setEmail] = useState("");
    const [validEmail, setValidEmail] = useState(false);

    const [pwd, setPwd] = useState("");
    const [validPwd, setValidPwd] = useState(false);

    const [matchPwd, setMatchPwd] = useState("");
    const [validMatch, setValidMatch] = useState(false);

    const [errMsg, setErrMsg] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        userRef.current.focus();
    }, []);

    useEffect(() => {
        setValidName(USER_REGEX.test(user));
    }, [user]);

    useEffect(() => {
        setValidEmail(EMAIL_REGEX.test(email));
    }, [email]);

    useEffect(() => {
        setValidPwd(PWD_REGEX.test(pwd));
        setValidMatch(pwd === matchPwd);
    }, [pwd, matchPwd]);

    useEffect(() => {
        setErrMsg("");
    }, [user, email, pwd, matchPwd]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const v1 = USER_REGEX.test(user);
        const vEmail = EMAIL_REGEX.test(email);
        const v2 = PWD_REGEX.test(pwd);

        if (!v1 || !vEmail || !v2) {
            setErrMsg("Invalid Entry");
            return;
        }

    

    try {
        await axios.post(
            "/stu_profile_registration/register/",
            {
                username: user,
                email: email,
                password: pwd
            },
            {
                headers: { "Content-Type": "application/json" }
                
            }
        );

        setSuccess(true);

        setUser("");
        setEmail("");
        setPwd("");
        setMatchPwd("");

    } catch (err) {
        if (!err.response) {
            setErrMsg("No Server Response");
        } else if (err.response.status === 400) {
            setErrMsg(err.response.data?.detail || "Username or email is already registered.");
        } else if (err.response.status === 422) {
            setErrMsg("Please check your username, email, and password.");
        } else {
            setErrMsg(err.response.data?.detail || "Registration Failed");
        }
        errRef.current.focus();
    }
};


    return (
        <>
            {success ? (
                <section className="auth-card">
                    <AuthCardHeader title="You're all set!" subtitle="Your job seeker account has been created." />
                    <p>
                        <Link to="/login">Sign In</Link>
                    </p>
                </section>
            ) : (
                <section className="auth-card">
                    <AuthCardHeader title="Create your account" subtitle="Join Vitae and discover your next opportunity." />
                    <p
                        ref={errRef}
                        className={errMsg ? "errmsg" : "offscreen"}
                        aria-live="assertive"
                    >
                        {errMsg}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Username */}
                        <label htmlFor="username">
                            Username:
                            <FontAwesomeIcon icon={faCheck} className={validName ? "valid" : "hide"} />
                            <FontAwesomeIcon icon={faTimes} className={validName || !user ? "hide" : "invalid"} />
                        </label>
                        <input
                            type="text"
                            id="username"
                            ref={userRef}
                            autoComplete="off"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            required
                            aria-invalid={!validName}
                        />

                        {/* Email */}
                        <label htmlFor="email">
                            Email:
                            <FontAwesomeIcon icon={faCheck} className={validEmail ? "valid" : "hide"} />
                            <FontAwesomeIcon icon={faTimes} className={validEmail || !email ? "hide" : "invalid"} />
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-invalid={!validEmail}
                        />

                        {/* Password */}
                        <label htmlFor="password">
                            Password:
                            <FontAwesomeIcon icon={faCheck} className={validPwd ? "valid" : "hide"} />
                            <FontAwesomeIcon icon={faTimes} className={validPwd || !pwd ? "hide" : "invalid"} />
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            required
                            aria-invalid={!validPwd}
                        />

                        {/* Confirm Password */}
                        <label htmlFor="confirm_pwd">
                            Confirm Password:
                            <FontAwesomeIcon icon={faCheck} className={validMatch && matchPwd ? "valid" : "hide"} />
                            <FontAwesomeIcon icon={faTimes} className={validMatch || !matchPwd ? "hide" : "invalid"} />
                        </label>
                        <input
                            type="password"
                            id="confirm_pwd"
                            value={matchPwd}
                            onChange={(e) => setMatchPwd(e.target.value)}
                            required
                            aria-invalid={!validMatch}
                        />

                        {/* <button disabled={!validName || !validEmail || !validPwd || !validMatch}>
                            Sign Up
                        </button> */}
                        <button
    disabled={
        !validName ||
        !validEmail ||
        !validPwd ||
        !validMatch
    }
>
    Sign Up
</button>

<div style={{ marginTop: "15px", textAlign: "center" }}>
    <p>Already have an account?</p>

    <Link to="/login">
        <button
            type="button"
            style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
            }}
        >
            Login
        </button>
    </Link>
</div>
                    </form>
                </section>
            )}
        </>
    );
};

export default Register;
