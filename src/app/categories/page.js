"use client";
import { getImageUrl } from "@/utils/image";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const IMAGE_SERVER = process.env.NEXT_PUBLIC_IMAGE_SERVER || "";

// Animated subcategory panel — uses max-height trick for smooth expand
function SubcategoryPanel({ subs, catSlug, isOpen }) {
  const innerRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (innerRef.current) {
      setHeight(isOpen ? innerRef.current.scrollHeight : 0);
    }
  }, [isOpen, subs]);

  return (
    <div
      style={{
        maxHeight: `${height}px`,
        overflow: "hidden",
        transition: "max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        borderTop: isOpen ? "1px solid var(--border-glass)" : "none",
      }}
    >
      <div
        ref={innerRef}
        style={{
          padding: "16px 20px 20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          background: "rgba(99,102,241,0.03)",
        }}
      >
        {subs.map((sub) => (
          <Link
            key={sub.id}
            href={`/category/${catSlug}/${sub.slug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "24px",
              border: "1px solid var(--border-glass)",
              background: "var(--bg-input)",
              color: "var(--text-main)",
              fontSize: "var(--font-helper)",
              fontWeight: "var(--font-weight-medium)",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(79,70,229,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-input)";
              e.currentTarget.style.color = "var(--text-main)";
              e.currentTarget.style.borderColor = "var(--border-glass)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {sub.imagePath ? (
              <img
                src={getImageUrl(sub.imagePath, IMAGE_SERVER)}
                alt={sub.name}
                style={{ width: "18px", height: "18px", objectFit: "cover", borderRadius: "3px" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: "var(--font-body)" }}>{sub.emoji || "🔹"}</span>
            )}
            {sub.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { categories } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCat, setExpandedCat] = useState(null);

  const filtered = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.subCategories || []).some((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Auto-expand first result when searching
  useEffect(() => {
    if (searchQuery && filtered.length === 1) {
      setExpandedCat(filtered[0].id);
    }
  }, [searchQuery]);

  const toggleExpand = (e, catId) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCat((prev) => (prev === catId ? null : catId));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          padding: "48px 24px 56px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "200px", height: "200px", borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "-40px",
          width: "150px", height: "150px", borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", pointerEvents: "none"
        }} />

        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "var(--font-helper)", color: "rgba(255,255,255,0.85)",
            textDecoration: "none", marginBottom: "24px",
            background: "rgba(255,255,255,0.12)", padding: "6px 16px",
            borderRadius: "20px", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          ← Back to Home
        </Link>

        <h1 style={{
          fontSize: "clamp(26px, 6vw, 42px)", fontWeight: "var(--font-weight-bold)",
          color: "#fff", margin: "0 0 10px", letterSpacing: "-0.5px",
        }}>
          Browse All Categories
        </h1>
        <p style={{ fontSize: "var(--font-body)", color: "rgba(255,255,255,0.72)", margin: "0 0 32px" }}>
          {categories.length} categories · Tap to expand subcategories
        </p>

        {/* Search */}
        <div style={{ maxWidth: "520px", margin: "0 auto", position: "relative" }}>
          <span style={{
            position: "absolute", left: "18px", top: "50%",
            transform: "translateY(-50%)", fontSize: "17px", pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "15px 18px 15px 50px",
              borderRadius: "50px", border: "none", fontSize: "var(--font-body)",
              background: "rgba(255,255,255,0.97)", color: "#1a1a2e",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)", outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute", right: "16px", top: "50%",
                transform: "translateY(-50%)", background: "none", border: "none",
                fontSize: "var(--font-h5)", cursor: "pointer", color: "#64748b",
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 20px 60px" }}>

        {filtered.length === 0 ? (
          <div className="glass-panel" style={{
            padding: "64px 24px", textAlign: "center",
            color: "var(--text-muted)", borderRadius: "20px",
          }}>
            <div style={{ fontSize: "var(--font-display-lg)", marginBottom: "12px" }}>🔍</div>
            <div style={{ fontSize: "var(--font-h5)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "6px" }}>
              No results for &quot;{searchQuery}&quot;
            </div>
            <div style={{ fontSize: "var(--font-small)" }}>Try a different keyword</div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}>
            {filtered.map((cat) => {
              const isExpanded = expandedCat === cat.id;
              const subs = cat.subCategories || [];

              return (
                <div
                  key={cat.id}
                  className="glass-panel"
                  style={{
                    borderRadius: "18px",
                    border: isExpanded
                      ? "1px solid rgba(99,102,241,0.35)"
                      : "1px solid var(--border-glass)",
                    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                    boxShadow: isExpanded ? "0 8px 32px rgba(79,70,229,0.12)" : "",
                    overflow: "visible",
                  }}
                >
                  {/* Card Header — entire row is clickable for expand OR navigate */}
                  <div
                    onClick={(e) => {
                      if (subs.length > 0) {
                        toggleExpand(e, cat.id);
                      } else {
                        router.push(`/category/${cat.slug}`);
                      }
                    }}
                    style={{
                      display: "flex", alignItems: "center",
                      gap: "14px", padding: "18px 20px",
                      cursor: "pointer", borderRadius: "18px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Icon */}
                    <div style={{
                      width: "62px", height: "62px", borderRadius: "14px",
                      overflow: "hidden", flexShrink: 0,
                      background: "var(--bg-input)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "26px", border: "1px solid var(--border-glass)",
                    }}>
                      {cat.imagePath ? (
                        <>
                          <img
                            src={getImageUrl(cat.imagePath, IMAGE_SERVER)}
                            alt={cat.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "inline";
                            }}
                          />
                          <span style={{ display: "none" }}>{cat.emoji || "📁"}</span>
                        </>
                      ) : (
                        <span>{cat.emoji || "📁"}</span>
                      )}
                    </div>

                    {/* Name + count */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-bold)",
                        color: "var(--text-main)", marginBottom: "3px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)" }}>
                        {subs.length > 0
                          ? `${subs.length} subcategor${subs.length !== 1 ? "ies" : "y"}`
                          : "Tap to browse listings →"}
                      </div>
                    </div>

                    {/* Expand chevron (only when has subcategories) */}
                    {subs.length > 0 && (
                      <div
                        onClick={(e) => toggleExpand(e, cat.id)}
                        style={{
                          width: "34px", height: "34px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "10px", flexShrink: 0,
                          background: isExpanded ? "var(--primary)" : "var(--bg-input)",
                          border: `1px solid ${isExpanded ? "var(--primary)" : "var(--border-glass)"}`,
                          color: isExpanded ? "#fff" : "var(--text-muted)",
                          fontSize: "11px",
                          transition: "all 0.22s ease",
                          cursor: "pointer",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      >
                        ▼
                      </div>
                    )}
                  </div>

                  {/* Animated subcategory panel */}
                  {subs.length > 0 && (
                    <SubcategoryPanel
                      subs={subs}
                      catSlug={cat.slug}
                      isOpen={isExpanded}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div style={{
          marginTop: "56px", textAlign: "center", padding: "40px 24px",
          background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-input) 100%)",
          borderRadius: "20px", border: "1px solid var(--border-glass)",
        }}>
          <p style={{ fontSize: "var(--font-body)", color: "var(--text-muted)", marginBottom: "18px" }}>
            Not sure which category? Browse everything
          </p>
          <Link
            href="/"
            className="btn btn-primary"
            style={{
              padding: "12px 36px", fontSize: "var(--font-body)", fontWeight: "var(--font-weight-bold)",
              borderRadius: "50px", textDecoration: "none", display: "inline-block",
            }}
          >
            🏠 Browse All Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
