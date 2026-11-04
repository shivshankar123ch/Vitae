import React, { useContext, useEffect, useState } from "react";
import { Check, CircleHelp, Crown, Rocket, Sparkles, Zap } from "lucide-react";
import axios from "../../api/axios";
import AuthContext from "../../context/AuthProvider";
import "./Pricing.css";

let razorpayScriptPromise;

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

const planIcons = {
  "Pay as You Go": Zap,
  Seed: Sparkles,
  Startup: Rocket,
  Scaleup: Sparkles,
  Enterprise: Crown,
};

export default function Pricing({ onPlanActivated, activePlanName = "" }) {
  const { auth } = useContext(AuthContext);
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState([]);
  const [comparisonSections, setComparisonSections] = useState([]);
  const [featureColumnLabel, setFeatureColumnLabel] = useState("Features");
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [processingPlan, setProcessingPlan] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    let isMounted = true;
    axios.get("/recruiter/billing/plans")
      .then(({ data }) => {
        if (isMounted) {
          setPlans(data.plans);
          setComparisonSections(data.sections);
          setFeatureColumnLabel(data.feature_column_label);
          setPlansError("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setPlansError(
            error.response?.data?.detail ||
            "Could not load recruiter plans. Please try again."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setPlansLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const startCheckout = async (plan) => {
    if (!auth?.accessToken || !auth?.roles?.includes("Recruiter")) {
      setPaymentError("Please sign in with a recruiter account before purchasing a plan.");
      return;
    }

    setProcessingPlan(plan.name);
    setPaymentMessage("");
    setPaymentError("");

    try {
      const checkoutReady = await loadRazorpayCheckout();
      if (!checkoutReady) {
        throw new Error("Razorpay Checkout could not be loaded. Check your internet connection and try again.");
      }

      const billingCycle = !annual || plan.annual_price_rupees === null ? "monthly" : "annual";
      const { data: order } = await axios.post(
        "/recruiter/billing/order",
        { plan_name: plan.name, billing_cycle: billingCycle },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Vitae",
        description: `${order.plan_name} recruiter plan (${order.billing_cycle})`,
        order_id: order.order_id,
        prefill: {
          name: order.recruiter_name,
          email: order.email,
        },
        theme: { color: "#d83c83" },
        modal: {
          ondismiss: () => setProcessingPlan(""),
        },
        handler: async (payment) => {
          try {
            const { data: access } = await axios.post(
              "/recruiter/billing/verify",
              {
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${auth.accessToken}` } }
            );
            setPaymentMessage(`${access.plan_name} payment verified. Student access is active until ${new Date(access.expires_at).toLocaleDateString()}.`);
            onPlanActivated?.(access);
          } catch (error) {
            setPaymentError(
              error.response?.data?.detail ||
              "Payment could not be verified. Your student access remains locked; contact support if you were charged."
            );
          } finally {
            setProcessingPlan("");
          }
        },
      });

      checkout.on("payment.failed", (event) => {
        setPaymentError(event.error?.description || "Payment failed. Your student access remains locked.");
        setProcessingPlan("");
      });
      checkout.open();
    } catch (error) {
      setPaymentError(
        error.response?.data?.detail ||
        error.message ||
        "Could not start checkout. Please try again."
      );
      setProcessingPlan("");
    }
  };

  return (
    <section className="recruiter-pricing" aria-labelledby="recruiter-pricing-title">
      <div className="recruiter-pricing__intro">
        <span className="recruiter-pricing__eyebrow">SIMPLE, FLEXIBLE PRICING</span>
        <h1 id="recruiter-pricing-title">
          The right plan for <span>your next hire.</span>
        </h1>
        <p>Compare recruiter plans and choose the hiring pace that works for your team.</p>
        {annual && (
          <p className="recruiter-pricing__annual-note">
            Annual plans are billed upfront at each plan's listed annual price.
          </p>
        )}
        {paymentError && (
          <p className="recruiter-pricing__message recruiter-pricing__message--error" role="alert">
            {paymentError}
          </p>
        )}
        <div className="recruiter-pricing__billing" aria-label="Billing frequency">
          <span className={!annual ? "is-active" : ""}>Monthly</span>
          <button
            className={`recruiter-pricing__toggle${annual ? " is-annual" : ""}`}
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Toggle annual billing"
            onClick={() => setAnnual((current) => !current)}
          >
            <span />
          </button>
          <span className={annual ? "is-active" : ""}>Annually</span>
          <small> SAVE 60%</small>
        </div>
      </div>

      {plansLoading && <p className="recruiter-pricing__message" role="status">Loading plans…</p>}
      {plansError && <p className="recruiter-pricing__message recruiter-pricing__message--error" role="alert">{plansError}</p>}
      {!plansLoading && !plansError && plans.length === 0 && (
        <p className="recruiter-pricing__message" role="status">No recruiter plans are currently available.</p>
      )}
      {plans.length > 0 && (
      <>
      <div className="recruiter-pricing__grid">
        {plans.map((plan) => {
          const Icon = planIcons[plan.name] || Sparkles;
          const usesAnnualPrice = annual && plan.annual_price_rupees !== null;
          const checkoutAmount = usesAnnualPrice
            ? plan.annual_price_rupees
            : plan.monthly_price_rupees;
          const price = usesAnnualPrice
            ? Math.round(plan.annual_price_rupees / 12)
            : plan.monthly_price_rupees;
          const isProcessing = processingPlan === plan.name;
          const monthlyCredits = Number(plan.monthly_unlock_credits.replace(/,/g, ""));
          const pricePerUnlock = Number.isFinite(monthlyCredits) && monthlyCredits > 0
            ? Math.floor(plan.monthly_price_rupees / monthlyCredits)
            : null;
          const isActivePlan = activePlanName === plan.name;

          return (
            <article
              className={`recruiter-plan${plan.featured && isActivePlan ? " recruiter-plan--recommended" : ""}`}
              key={plan.name}
            >
              {plan.featured && isActivePlan && <span className="recruiter-plan__badge">★ MOST POPULAR</span>}
              <span className="recruiter-plan__icon"><Icon size={20} aria-hidden="true" /></span>
              <h2>{plan.name}</h2>
              <p className="recruiter-plan__subtitle">{plan.subtitle}</p>
              <div className="recruiter-plan__price">
                <strong>₹{price.toLocaleString("en-IN")}</strong>
                <span>{annual && plan.annual_price_rupees !== null ? "/ month, billed yearly" : `/ ${plan.monthly_billing_label}`}</span>
              </div>
              {annual && plan.annual_price_rupees !== null && (
                <p className="recruiter-plan__annual">
                  ₹{plan.annual_price_rupees.toLocaleString("en-IN")} billed yearly
                </p>
              )}
              <ul className="recruiter-plan__features">
                <li><Check size={15} aria-hidden="true" />{plan.job_postings} Job Postings</li>
                <li><Check size={15} aria-hidden="true" />{plan.monthly_unlock_credits} Unlock Credits</li>
                {pricePerUnlock !== null && (
                  <li><Check size={15} aria-hidden="true" />~₹{pricePerUnlock} / Unlock</li>
                )}
                <li><Check size={15} aria-hidden="true" />{plan.recruiter_seats} Recruiter {plan.recruiter_seats === 1 ? "Seat" : "Seats"}</li>
              </ul>
              <button
                className={`recruiter-plan__button${isActivePlan ? " recruiter-plan__button--active" : ""}`}
                type="button"
                disabled={Boolean(processingPlan) || isActivePlan}
                onClick={() => startCheckout(plan)}
              >
                {isActivePlan
                  ? "Active plan"
                  : isProcessing
                    ? "Opening secure checkout…"
                    : `Pay ₹${checkoutAmount.toLocaleString("en-IN")} & activate`}
              </button>
            </article>
          );
        })}
      </div>

      <div className="recruiter-pricing__table-frame">
        <table className="recruiter-pricing__table">
          <colgroup>
            <col className="recruiter-pricing__feature-column" />
            {plans.map((plan) => <col key={plan.name} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="recruiter-pricing__features-heading" scope="col">{featureColumnLabel}</th>
              {plans.map((plan) => {
                const isProcessing = processingPlan === plan.name;
                const isActivePlan = activePlanName === plan.name;
                const checkoutAmount = annual && plan.annual_price_rupees !== null
                  ? plan.annual_price_rupees
                  : plan.monthly_price_rupees;

                return (
                  <th
                    className={plan.featured && isActivePlan ? "recruiter-pricing__plan-heading is-featured" : "recruiter-pricing__plan-heading"}
                    key={plan.name}
                    scope="col"
                  >
                    <span className="recruiter-pricing__plan-name">{plan.name}</span>
                    {plan.featured && isActivePlan && <span className="recruiter-pricing__popular">MOST POPULAR</span>}
                    <button
                      className={`recruiter-pricing__start-button${isActivePlan ? " is-active" : ""}`}
                      type="button"
                      disabled={Boolean(processingPlan) || isActivePlan}
                      onClick={() => startCheckout(plan)}
                    >
                      {isActivePlan
                        ? "Active plan"
                        : isProcessing
                          ? "Opening checkout…"
                          : `Pay ₹${checkoutAmount.toLocaleString("en-IN")}`}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {comparisonSections.map((section) => (
              <React.Fragment key={section.title}>
                <tr className="recruiter-pricing__section-heading">
                  <th colSpan={plans.length + 1} scope="colgroup">{section.title}</th>
                </tr>
                {section.rows.map((row) => (
                  <tr
                    className={`recruiter-pricing__data-row${
                      (row.key === "monthly_subscription" && !annual) ||
                      (row.key === "annual_subscription" && annual) ||
                      row.shaded
                        ? " is-shaded"
                        : ""
                    }`}
                    key={row.label}
                  >
                    <th className="recruiter-pricing__feature-label" scope="row">
                      <span>{row.label}</span>
                      {row.info && (
                        <CircleHelp
                          className="recruiter-pricing__info-icon"
                          size={13}
                          strokeWidth={1.8}
                          aria-label={row.info}
                          title={row.info}
                        />
                      )}
                    </th>
                    {plans.map((plan, index) => (
                      <td
                        className={plan.featured && activePlanName === plan.name ? "recruiter-pricing__cell is-featured" : "recruiter-pricing__cell"}
                        key={plan.name}
                      >
                        {row.feature
                          ? plan.features?.[row.feature]
                            ? row.feature === "full_resume_preview"
                              ? activePlanName === plan.name
                                ? <Check className="recruiter-pricing__check-icon" size={15} strokeWidth={2.5} aria-label="Included with active plan" />
                                : <strong className="recruiter-pricing__pay-badge">Pay</strong>
                              : <Check className="recruiter-pricing__check-icon" size={15} strokeWidth={2.5} aria-label="Included" />
                            : "—"
                          : plan[row.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      <p className="recruiter-pricing__notice" aria-live="polite">
        Payments are processed securely by Razorpay. Student access starts only after payment verification.
      </p>
      {paymentMessage && <p className="recruiter-pricing__message" role="status">{paymentMessage}</p>}
      {paymentError && <p className="recruiter-pricing__message recruiter-pricing__message--error" role="alert">{paymentError}</p>}
    </section>
  );
}
