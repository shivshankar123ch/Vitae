import React from "react";
import AtoZBrand from "./AtoZBrand";

export default function AuthCardHeader({ title, subtitle }) {
  return (
    <div className="auth-card__header">
      <AtoZBrand />
      <span className="auth-card__eyebrow">WELCOME TO VITAE</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
