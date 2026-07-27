"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useParams } from "next/navigation";

const IMAGE_SERVER = process.env.NEXT_PUBLIC_IMAGE_SERVER || "";

export default function SubcategoryPage() {
  const { categories, userCoords } = useApp();
  const params = useParams();
  const { categorySlug, subcategorySlug } = params;

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("date_desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const LIMIT = 16;

  // Resolve category + subcategory from slugs
  const category = categories.find((c) => c.slug === categorySlug);
  const subcategory = (category?.subCategories || []).find((s) => s.slug === subcategorySlug);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setListings([]);
  }, [categorySlug, subcategorySlug, sortBy, minPrice, maxPrice]);

  useEffect(() => {
    if (!category || !subcategory) return;
    async function load() {
      setLoading(true);
      try {
        const params = {
          categoryId: category.id,
          subCategoryId: subcategory.id,
          sortBy,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          page,
          limit: LIMIT,
        };
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const data = await api.getListings(params);
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
  }, [category, subcategory, sortBy, minPrice, maxPrice, page, userCoords]);

  // Other subcategories in same parent (for quick navigation)
  const siblingSubcats = (category?.subCategories || []).filter((s) => s.slug !== subcategorySlug);

  if (categories.length > 0 && (!category || !subcategory)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "24px" }}>
        <div style={{ fontSize: "52px" }}>🔍</div>
        <div style={{ fontSize: "var(--font-h4)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", textAlign: "center" }}>
          {!category ? "Category not found" : "Subcategory not found"}
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href={`/category/${categorySlug}`} className="btn btn-secondary" style={{ textDecoration: "none", padding: "10px 24px", borderRadius: "50px" }}>
            ← Back to {category?.name || "Category"}
          </Link>
          <Link href="/categories" className="btn btn-primary" style={{ textDecoration: "none", padding: "10px 24px", borderRadius: "50px" }}>
            All Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        padding: "32px 24px 40px",
      }}>
        {/* Back button */}
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "var(--font-helper)", color: "rgba(255,255,255,0.85)",
            textDecoration: "none", marginBottom: "16px",
            background: "rgba(255,255,255,0.12)", padding: "6px 16px",
            borderRadius: "20px", border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          ← Home
        </Link>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <Link href="/" style={{ fontSize: "var(--font-caption)", color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>Home</Link>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>›</span>
          <Link href="/categories" style={{ fontSize: "var(--font-caption)", color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>Categories</Link>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>›</span>
          <Link href={`/category/${categorySlug}`} style={{ fontSize: "var(--font-caption)", color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>
            {category?.name || categorySlug}
          </Link>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>›</span>
          <span style={{ fontSize: "var(--font-caption)", color: "#fff", fontWeight: "var(--font-weight-semibold)" }}>
            {subcategory?.name || subcategorySlug}
          </span>
        </nav>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "clamp(20px, 5vw, 32px)", fontWeight: "var(--font-weight-bold)", color: "#fff", margin: "0 0 6px" }}>
              {subcategory?.emoji} {subcategory?.name || subcategorySlug}
            </h1>
            <p style={{ fontSize: "var(--font-helper)", color: "rgba(255,255,255,0.7)", margin: 0 }}>
              in <strong style={{ color: "rgba(255,255,255,0.9)" }}>{category?.name}</strong>
              {!loading && (
                <span> · <strong style={{ color: "rgba(255,255,255,0.9)" }}>{listings.length}{hasMore ? "+" : ""}</strong> listings</span>
              )}
            </p>
          </div>
        </div>

        {/* Other subcategories in same parent */}
        {siblingSubcats.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              More in {category?.name}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {siblingSubcats.slice(0, 6).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${categorySlug}/${sub.slug}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "5px 12px", borderRadius: "16px",
                    background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)",
                    fontSize: "var(--font-caption)", textDecoration: "none", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                >
                  {sub.emoji || "🔹"} {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters + Sort Bar */}
      <div style={{
        background: "var(--bg-card)", borderBottom: "1px solid var(--border-glass)",
        padding: "14px 24px", display: "flex", alignItems: "center",
        flexWrap: "wrap", gap: "12px", position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ flex: 1, display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Min price */}
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{
              padding: "7px 12px", borderRadius: "8px",
              border: "1px solid var(--border-glass)", background: "var(--bg-input)",
              color: "var(--text-main)", fontSize: "var(--font-helper)", width: "90px", outline: "none",
            }}
          />
          <span style={{ color: "var(--text-dim)", fontSize: "var(--font-caption)" }}>—</span>
          {/* Max price */}
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{
              padding: "7px 12px", borderRadius: "8px",
              border: "1px solid var(--border-glass)", background: "var(--bg-input)",
              color: "var(--text-main)", fontSize: "var(--font-helper)", width: "90px", outline: "none",
            }}
          />
          {(minPrice || maxPrice) && (
            <button
              onClick={() => { setMinPrice(""); setMaxPrice(""); }}
              style={{
                background: "none", border: "none", color: "var(--primary)",
                fontSize: "var(--font-caption)", cursor: "pointer", fontWeight: "var(--font-weight-semibold)",
              }}
            >Clear</button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "7px 14px", borderRadius: "8px",
            border: "1px solid var(--border-glass)", background: "var(--bg-input)",
            color: "var(--text-main)", fontSize: "var(--font-helper)", cursor: "pointer", outline: "none",
          }}
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="distance_asc">Nearest</option>
        </select>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px 60px" }}>

        {loading && listings.length === 0 ? (
          /* Skeleton */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-panel" style={{ height: "280px", borderRadius: "14px", animation: "pulse 1.4s ease-in-out infinite" }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          /* Empty state */
          <div className="glass-panel" style={{ padding: "80px 24px", textAlign: "center", borderRadius: "24px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📭</div>
            <h2 style={{ fontSize: "var(--font-h4)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "8px" }}>
              No listings yet
            </h2>
            <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", marginBottom: "28px" }}>
              No products found in <strong>{subcategory?.name}</strong>
              {(minPrice || maxPrice) && " with the selected price range"}.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                  className="btn btn-secondary"
                  style={{ padding: "10px 24px", borderRadius: "50px" }}
                >Clear Filters</button>
              )}
              <Link
                href={`/category/${categorySlug}`}
                className="btn btn-primary"
                style={{ textDecoration: "none", padding: "10px 24px", borderRadius: "50px" }}
              >
                Browse {category?.name}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Result count */}
            <p style={{ fontSize: "var(--font-helper)", color: "var(--text-muted)", marginBottom: "20px" }}>
              Showing <strong style={{ color: "var(--text-main)" }}>{listings.length}{hasMore ? "+" : ""}</strong> listings
              {minPrice && ` from ₹${minPrice}`}
              {maxPrice && ` to ₹${maxPrice}`}
            </p>

            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "36px",
            }}>
              {listings.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div style={{ textAlign: "center" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  style={{ padding: "12px 40px", borderRadius: "50px", fontSize: "var(--font-small)", fontWeight: "var(--font-weight-semibold)" }}
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
