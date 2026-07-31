"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useParams } from "next/navigation";

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
  const [rating, setRating] = useState("");

  const LIMIT = 12;

  // Resolve category + subcategory from slugs
  const category = categories.find((c) => c.slug === categorySlug);
  const subcategory = (category?.subCategories || []).find((s) => s.slug === subcategorySlug);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setListings([]);
  }, [categorySlug, subcategorySlug, sortBy, minPrice, maxPrice, rating]);

  useEffect(() => {
    if (!category || !subcategory) return;
    async function load() {
      setLoading(true);
      try {
        const queryParams = {
          categoryId: category.id,
          subCategoryId: subcategory.id,
          sortBy,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          page,
          limit: LIMIT,
        };
        if (minPrice) queryParams.minPrice = minPrice;
        if (maxPrice) queryParams.maxPrice = maxPrice;
        if (rating) queryParams.rating = rating;

        const data = await api.request(`/listings?${api.buildQueryString(queryParams)}`);
        if (data) {
          if (page === 1) {
            setListings(data);
          } else {
            setListings((prev) => {
              const ids = new Set(prev.map((i) => i.id));
              return [...prev, ...data.filter((i) => !ids.has(i.id))];
            });
          }
          if (data.length < LIMIT) setHasMore(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, subcategory, sortBy, minPrice, maxPrice, rating, page, userCoords]);

  if (categories.length > 0 && (!category || !subcategory)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "24px" }}>
        <div style={{ fontSize: "52px" }}>🔍</div>
        <div style={{ fontSize: "var(--font-h4)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", textAlign: "center" }}>
          Subcategory not found
        </div>
        <Link href="/" className="btn btn-secondary" style={{ textDecoration: "none", padding: "10px 24px", borderRadius: "50px" }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--font-helper)", padding: "8px 16px", borderRadius: "8px", marginBottom: "16px" }}>
            ← Home
          </Link>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: "0 0 6px" }}>
            {subcategory?.emoji || "🔹"} {subcategory?.name || subcategorySlug}
          </h1>
          <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", margin: 0 }}>
            in <strong style={{ color: "var(--text-main)" }}>{category?.name}</strong> · {!loading && <span><strong style={{ color: "var(--text-main)" }}>{listings.length}</strong> listings available</span>}
          </p>
        </div>

        {/* Compact Horizontal Toolbar */}
        <div className="glass-panel" style={{
          padding: "16px 20px", display: "flex", alignItems: "center",
          flexWrap: "wrap", gap: "16px", marginBottom: "32px", borderRadius: "16px",
          border: "1px solid var(--border-glass)"
        }}>
          {/* Price Range */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)", fontWeight: "var(--font-weight-semibold)" }}>Price:</span>
            <input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: "8px",
                border: "1px solid var(--border-glass)", background: "var(--bg-input)",
                color: "var(--text-main)", fontSize: "var(--font-helper)", width: "100px", outline: "none",
              }}
            />
            <span style={{ color: "var(--text-dim)", fontSize: "var(--font-caption)" }}>—</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: "8px",
                border: "1px solid var(--border-glass)", background: "var(--bg-input)",
                color: "var(--text-main)", fontSize: "var(--font-helper)", width: "100px", outline: "none",
              }}
            />
          </div>

          {/* Rating Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)", fontWeight: "var(--font-weight-semibold)" }}>Rating:</span>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: "8px",
                border: "1px solid var(--border-glass)", background: "var(--bg-input)",
                color: "var(--text-main)", fontSize: "var(--font-helper)", cursor: "pointer", outline: "none",
              }}
            >
              <option value="">Any Rating</option>
              <option value="4.0">⭐ 4.0 & above</option>
              <option value="3.0">⭐ 3.0 & above</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
            <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)", fontWeight: "var(--font-weight-semibold)" }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: "8px",
                border: "1px solid var(--border-glass)", background: "var(--bg-input)",
                color: "var(--text-main)", fontSize: "var(--font-helper)", cursor: "pointer", outline: "none",
              }}
            >
              <option value="date_desc">Newest</option>
              <option value="relevance">Relevance</option>
              <option value="views_desc">Most Viewed</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Listings Content */}
        {loading && listings.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-panel" style={{ height: "300px", borderRadius: "14px", animation: "pulse 1.4s ease-in-out infinite" }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          /* Simplified Clean Empty State */
          <div className="glass-panel" style={{ padding: "80px 24px", textAlign: "center", borderRadius: "24px", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📭</div>
            <h2 style={{ fontSize: "var(--font-h3)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "8px" }}>
              No listings available in this subcategory yet.
            </h2>
            <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", marginBottom: "28px" }}>
              Be the first to post in this subcategory!
            </p>
            <Link
              href="/dashboard/add-listing"
              className="btn btn-primary"
              style={{ textDecoration: "none", padding: "12px 32px", borderRadius: "50px", fontWeight: "var(--font-weight-semibold)" }}
            >
              ➕ Create Listing
            </Link>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px",
              marginBottom: "40px",
            }}>
              {listings.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>

            {/* Load More Pagination */}
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
