"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const IMAGE_SERVER = process.env.NEXT_PUBLIC_IMAGE_SERVER || "";

export default function CategoriesPage() {
  const { categories } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCat, setExpandedCat] = useState(null);

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.subCategories || []).some((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCategoryClick = (catId) => {
    router.push(`/?categoryId=${catId}`);
  };

  const handleSubCategoryClick = (catId, subId) => {
    router.push(`/?categoryId=${catId}&subCategoryId=${subId}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary, #6366f1) 100%)",
          padding: "48px 24px 40px",
          textAlign: "center",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.8)",
            textDecoration: "none",
            marginBottom: "20px",
            background: "rgba(255,255,255,0.15)",
            padding: "6px 14px",
            borderRadius: "20px",
            backdropFilter: "blur(8px)",
          }}
        >
          ← Back to Home
        </Link>
        <h1
          style={{
            fontSize: "clamp(24px, 6vw, 40px)",
            fontWeight: "800",
            color: "#fff",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
          }}
        >
          📁 All Categories
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", margin: "0 0 28px" }}>
          Browse {categories.length} categories &amp; find exactly what you need
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "16px",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 46px",
              borderRadius: "50px",
              border: "none",
              fontSize: "15px",
              background: "rgba(255,255,255,0.95)",
              color: "#1a1a2e",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        {filtered.length === 0 ? (
          <div
            className="glass-panel"
            style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", borderRadius: "16px" }}
          >
            No categories found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {filtered.map((cat) => {
              const isExpanded = expandedCat === cat.id;
              const subs = cat.subCategories || [];

              return (
                <div
                  key={cat.id}
                  className="glass-panel"
                  style={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid var(--border-glass)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  {/* Category Header */}
                  <div
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "20px",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "14px",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "var(--bg-input)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        border: "1px solid var(--border-glass)",
                      }}
                    >
                      {cat.imagePath ? (
                        <img
                          src={`${IMAGE_SERVER}${cat.imagePath}`}
                          alt={cat.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                      ) : null}
                      <span style={{ display: cat.imagePath ? "none" : "inline" }}>
                        {cat.emoji || "📁"}
                      </span>
                    </div>

                    {/* Name & count */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "var(--text-main)",
                          marginBottom: "4px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {cat.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {subs.length > 0
                          ? `${subs.length} subcategorie${subs.length !== 1 ? "s" : ""}`
                          : "Browse listings →"}
                      </div>
                    </div>

                    {/* Expand button if has subcategories */}
                    {subs.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCat(isExpanded ? null : cat.id);
                        }}
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "12px",
                          transition: "transform 0.2s",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          flexShrink: 0,
                        }}
                      >
                        ▼
                      </button>
                    )}
                  </div>

                  {/* Subcategories Pills */}
                  {subs.length > 0 && isExpanded && (
                    <div
                      style={{
                        borderTop: "1px solid var(--border-glass)",
                        padding: "12px 20px 16px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        background: "rgba(0,0,0,0.1)",
                      }}
                    >
                      {subs.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleSubCategoryClick(cat.id, sub.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: "1px solid var(--border-glass)",
                            background: "var(--bg-input)",
                            color: "var(--text-main)",
                            fontSize: "12px",
                            fontWeight: "500",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "background 0.2s, color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--accent-primary)";
                            e.currentTarget.style.color = "#fff";
                            e.currentTarget.style.border = "1px solid var(--accent-primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--bg-input)";
                            e.currentTarget.style.color = "var(--text-main)";
                            e.currentTarget.style.border = "1px solid var(--border-glass)";
                          }}
                        >
                          <span>{sub.emoji || "🔹"}</span>
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Browse Listings CTA */}
                  {subs.length === 0 && (
                    <div
                      onClick={() => handleCategoryClick(cat.id)}
                      style={{
                        borderTop: "1px solid var(--border-glass)",
                        padding: "10px 20px",
                        fontSize: "12px",
                        color: "var(--accent-primary)",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      View Listings →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Browse All Listings CTA */}
        <div
          style={{
            marginTop: "48px",
            textAlign: "center",
            padding: "40px 24px",
            background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-input) 100%)",
            borderRadius: "20px",
            border: "1px solid var(--border-glass)",
          }}
        >
          <p style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Not sure which category? Browse all listings
          </p>
          <Link
            href="/"
            className="btn btn-primary"
            style={{
              padding: "12px 32px",
              fontSize: "15px",
              fontWeight: "700",
              borderRadius: "50px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            🏠 Browse All Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
