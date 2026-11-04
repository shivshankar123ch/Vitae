import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import AtoZBrand from "./AtoZBrand";
import "./OtpGate.css";

const RESEND_SECONDS = 60;
const STATUS_TIMEOUT_MS = 10000;
const OTP_REQUEST_TIMEOUT_MS = 20000;

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export default function OtpGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    axios.get("/otp/status", { timeout: STATUS_TIMEOUT_MS })
      .then(({ data }) => {
        if (active) {
          setVerified(data.verified === true);
          setChecking(false);
        }
      })
      .catch((requestError) => {
        console.error("Could not check email verification:", requestError);
        if (active) {
          setError("Could not connect to the verification service. Please try again.");
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (checking) {
      return;
    }

    if (verified && location.pathname === "/otp-verify") {
      navigate("/", { replace: true });
    } else if (!verified && location.pathname !== "/otp-verify") {
      navigate("/otp-verify", { replace: true });
    }
  }, [checking, verified, location.pathname, navigate]);

  useEffect(() => {
    if (!resendCountdown) {
      return undefined;
    }
    const timer = window.setTimeout(
      () => setResendCountdown((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (challengeId) {
      otpInputRef.current?.focus();
    }
  }, [challengeId]);

  const sendOtp = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const { data } = await axios.post(
        "/otp/send",
        { email: normalizedEmail },
        { timeout: OTP_REQUEST_TIMEOUT_MS }
      );
      setChallengeId(data.challenge_id);
      setMaskedEmail(data.email);
      setResendCountdown(data.resend_after || RESEND_SECONDS);
      setOtp("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not send the OTP. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\d{4,8}$/.test(otp)) {
      setError("Enter the OTP from your SMS.");
      return;
    }

    setBusy(true);
    try {
      await axios.post(
        "/otp/verify",
        {
          challenge_id: challengeId,
          otp,
        },
        { timeout: OTP_REQUEST_TIMEOUT_MS }
      );
      setVerified(true);
    } catch (requestError) {
      if (requestError.response?.status === 410) {
        setChallengeId("");
        setOtp("");
      }
      setError(getErrorMessage(requestError, "OTP verification failed. Check the code and try again."));
    } finally {
      setBusy(false);
    }
  };

  const retryStatus = async () => {
    setChecking(true);
    setError("");
    try {
      const { data } = await axios.get("/otp/status", { timeout: STATUS_TIMEOUT_MS });
      setVerified(data.verified === true);
    } catch (requestError) {
      console.error("Could not check email verification:", requestError);
      setError("Could not connect to the verification service. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  if (verified) {
    return children;
  }

  return (
    <main className="otp-gate">
      <section className="otp-gate__card" aria-labelledby="otp-gate-title">
        <header className="otp-gate__header">
          <AtoZBrand />
          <span className="otp-gate__security-icon" aria-hidden="true">
            {challengeId ? <ShieldCheck size={23} /> : <LockKeyhole size={23} />}
          </span>
          <h1 id="otp-gate-title">
            {checking ? "Checking verification" : challengeId ? "Verify your email" : "Email verification"}
          </h1>
          <p>
            {checking
              ? "Please wait while we securely check your session."
              : challengeId
                ? `Enter the one-time code sent to ${maskedEmail}.`
                : "Verify your email address with a one-time code to continue to Vitae."}
          </p>
        </header>

        <div className="otp-gate__body">
          {checking ? (
            <div className="otp-gate__checking" role="status">
              <span className="otp-gate__spinner" />
              Connecting securely…
            </div>
          ) : challengeId ? (
            <form className="otp-gate__form" onSubmit={verifyOtp}>
              <label htmlFor="email-otp">One-time password</label>
              <input
                ref={otpInputRef}
                id="email-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="Enter email code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                required
              />
              {error && <p className="otp-gate__error" role="alert">{error}</p>}
              <button type="submit" className="otp-gate__primary-button" disabled={busy}>
                {busy ? "Verifying…" : "Verify and continue"}
                {!busy && <ArrowRight size={18} aria-hidden="true" />}
              </button>
              <div className="otp-gate__secondary-actions">
                <button
                  type="button"
                  onClick={() => {
                    setChallengeId("");
                    setOtp("");
                    setError("");
                  }}
                  disabled={busy}
                >
                  <ArrowLeft size={15} aria-hidden="true" /> Change email
                </button>
                <button type="button" onClick={sendOtp} disabled={busy || resendCountdown > 0}>
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
                </button>
              </div>
            </form>
          ) : (
            <form className="otp-gate__form" onSubmit={sendOtp}>
              <label htmlFor="email-address">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {error && <p className="otp-gate__error" role="alert">{error}</p>}
              {error.startsWith("Could not connect") && (
                <div className="otp-gate__secondary-actions">
                  <button type="button" onClick={retryStatus}>
                    Retry connection
                  </button>
                </div>
              )}
              <button type="submit" className="otp-gate__primary-button" disabled={busy}>
                {busy ? "Sending code…" : "Send email code"}
                {!busy && <ArrowRight size={18} aria-hidden="true" />}
              </button>
            </form>
          )}

          <p className="otp-gate__privacy">
            <CheckCircle2 size={15} aria-hidden="true" />
            Your email is used only for verification.
          </p>
        </div>
      </section>
    </main>
  );
}
