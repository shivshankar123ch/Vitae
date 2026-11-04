import React from "react";
import { Link } from "react-router-dom";

export default function AtoZBrand({ className = "", onClick }) {
  const classes = ["pp-brand", className].filter(Boolean).join(" ");

  return (
    <Link className={classes} to="/" aria-label="Vitae home" onClick={onClick}>
      <span className="pp-brand__name">
        <svg className="pp-brand__initial" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
          <path d="M3 3c8 2 12 8 11 20C7 17 3 11 3 3Z" fill="#3b9b55" />
          <path d="M25 3c-8 2-12 8-11 20 7-6 11-12 11-20Z" fill="#258044" />
          <path d="M14 23 8 9m6 14 6-14" fill="none" stroke="#1d5b32" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
        <span className="pp-brand__i">i</span>
        <span className="pp-brand__nature-t">T<span aria-hidden="true">✦</span></span>
        <span className="pp-brand__nature-letter">a</span>
        <span className="pp-brand__nature-letter">e</span>
      </span>
    </Link>
  );
}
