"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

const Logo = () => {
  const router = useRouter();
  const {
    setSelectedCatFilter,
    setSelectedSubCatFilter,
    setSearchQuery,
    setLocationFilter,
    setLocationSearchInput,
    fetchListings,
  } = useApp() || {};

  const handleClick = () => {
    if (setSelectedCatFilter) setSelectedCatFilter(null);
    if (setSelectedSubCatFilter) setSelectedSubCatFilter(null);
    if (setSearchQuery) setSearchQuery("");
    if (setLocationFilter) setLocationFilter("");
    if (setLocationSearchInput) setLocationSearchInput("");
    if (fetchListings) {
      fetchListings({
        categoryId: null,
        subCategoryId: null,
        search: "",
        location: "",
      });
    }
    if (router) router.push("/");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      className="brand-logo"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="logo-grad"
            x1="31"
            y1="10"
            x2="79"
            y2="95"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--logo-blue)" />
            <stop offset="1" stopColor="var(--logo-green)" />
          </linearGradient>
          <mask id="logo-mask">
            <rect width="100" height="100" fill="white" />
            <circle cx="43" cy="43" r="5.5" fill="black" />
            <path
              d="M 53 62 L 49 68 M 58 64 L 54 70"
              stroke="black"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 47 70 L 63 62"
              stroke="black"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </mask>
        </defs>
        <g mask="url(#logo-mask)">
          <path
            d="M 43 43 C 28 20, 56 6, 48 31"
            stroke="url(#logo-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 31 35 L 31 54 L 79 54 L 59 31 L 43 31 Z"
            fill="url(#logo-grad)"
          />
          <path d="M 31 60 L 42 60 L 42 72 L 31 72 Z" fill="url(#logo-grad)" />
          <path d="M 79 60 L 68 60 L 68 72 L 79 72 Z" fill="url(#logo-grad)" />
          <path
            d="M 46 60 C 46 60, 51 55, 55 57 C 59 59, 64 60, 64 60 L 64 72 C 64 72, 59 74, 55 72 C 51 70, 46 72, 46 72 Z"
            fill="url(#logo-grad)"
          />
          <path d="M 31 72 L 79 72 L 60 95 Z" fill="url(#logo-grad)" />
        </g>
      </svg>
      <span style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ color: "var(--logo-blue)" }}>low</span>
        <span
          style={{
            color: "var(--logo-green)",
            fontWeight: "var(--font-weight-bold)",
          }}
        >
          p
        </span>
        <span style={{ color: "var(--logo-blue)" }}>riceplaces</span>
        <span
          style={{
            color: "var(--logo-gray)",
            fontSize: "0.75em",
            marginLeft: "1px",
          }}
        >
          .com
        </span>
      </span>
    </div>
  );
};

export default Logo;
