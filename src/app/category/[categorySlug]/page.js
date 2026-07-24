"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useParams } from "next/navigation";

const IMAGE_SERVER = process.env.NEXT_PUBLIC_IMAGE_SERVER || "";

export default function CategoryPage() {
  const { categories, userCoords } = useApp();
  const params = useParams();
  const { categorySlug } = params;

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("date_desc");
  const [expandedSub, setExpandedSub] = useState(null);

  const LIMIT = 16;

  // Resolve category from slug
  const category = categories.find((c) => c.slug === categorySlug);
  const subs = category?.subCategories || [];

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setListings([]);
  }, [categorySlug, sortBy]);

  useEffect(() => {
    if (!category) return;
    async function load() {
      setLoading(true);
      try {
        const data = await api.getListings({
          categoryId: category.id,
          sortBy,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          page,
          limit: LIMIT,
        });
        if (page === 1) {
          setListings(data);
        } else {
          setListings((prev) => {
            const ids = new Set(prev.map((i) => i.id));
            return [...prev, ...data.filter((i) => !ids.has(i.id))];
          });
        }
        if (data.length < LIMIT) setHasMore(false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, sortBy, page, userCoords]);

  if (categories.length > 0 && !category) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "48px" }}>🔍</div>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-main)" }}>Category not found</div>
        <Link href="/categories" className="btn btn-primary" style={{ textDecoration: "none", padding: "10px 24px", borderRadius: "50px" }}>← All Categories</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        padding: "40px 24px 48px",
      }}>
        {/* Back button */}
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "13px", color: "rgba(255,255,255,0.85)",
            textDecoration: "none", marginBottom: "16px",
            background: "rgba(255,255,255,0.12)", padding: "6px 16px",
            borderRadius: "20px", border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          ← Home
        </Link>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <Link href="/" style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Home</Link>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>›</span>
          <Link href="/categories" style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Categories</Link>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>›</span>
          <span style={{ fontSize: "13px", color: "#fff", fontWeight: "600" }}>{category?.name || categorySlug}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          {/* Category icon */}
          {category?.imagePath && (
            <div style={{
              width: "72px", height: "72px", borderRadius: "16px", overflow: "hidden",
              border: "3px solid rgba(255,255,255,0.25)", flexShrink: 0,
            }}>
              <img src={`${IMAGE_SERVER}${category.imagePath}`} alt={category.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: "clamp(22px, 5vw, 34px)", fontWeight: "800", color: "#fff", margin: "0 0 6px" }}>
              {category?.emoji} {category?.name || categorySlug}
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: 0 }}>
              {loading && listings.length === 0 ? "Loading..." : `${listings.length}${hasMore ? "+" : ""} listings`}
            </p>
          </div>
        </div>

        {/* Subcategory chips */}
        {subs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "24px" }}>
            {subs.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${categorySlug}/${sub.slug}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "20px",
                  background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
                  fontSize: "13px", fontWeight: "500", textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              >
                <span>{sub.emoji || "🔹"}</span>
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* Sort bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            {!loading && <><strong style={{ color: "var(--text-main)" }}>{listings.length}{hasMore ? "+" : ""}</strong> listings in <strong style={{ color: "var(--text-main)" }}>{category?.name}</strong></>}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: "10px",
              border: "1px solid var(--border-glass)", background: "var(--bg-input)",
              color: "var(--text-main)", fontSize: "13px", cursor: "pointer", outline: "none",
            }}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>

        {/* Listings grid */}
        {loading && listings.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-panel" style={{ height: "280px", borderRadius: "14px", animation: "pulse 1.4s ease-in-out infinite" }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="glass-panel" style={{ padding: "72px 24px", textAlign: "center", borderRadius: "20px" }}>
            <div style={{ fontSize: "52px", marginBottom: "14px" }}>📭</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>No listings yet</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Be the first to post in <strong>{category?.name}</strong></p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
              {listings.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: "center" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  style={{ padding: "12px 36px", borderRadius: "50px", fontSize: "14px", fontWeight: "600" }}
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
