"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

export default function MarketplacePage() {
  const { userCoords, locationFilter, categories } = useApp();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc, price_asc, price_desc, distance_asc
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset pagination on filter or sort updates
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [selectedCatId, minPrice, maxPrice, sortBy, searchQuery]);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      try {
        const params = {
          q: searchQuery,
          categoryId: selectedCatId === "" ? null : selectedCatId,
          minPrice: minPrice === "" ? null : minPrice,
          maxPrice: maxPrice === "" ? null : maxPrice,
          sortBy: sortBy,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          page: page,
          limit: 12,
          listingType: "SECONDHAND"
        };

        const data = await api.getListings(params);

        if (page === 1) {
          setListings(data);
        } else {
          setListings(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newItems = data.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }

        if (data.length < 12) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Error loading marketplace listings:", err);
      } finally {
        setLoading(false);
      }
    }
    const delayDebounce = setTimeout(() => {
      loadListings();
    }, 300); // 300ms debounce for typing search/prices

    return () => clearTimeout(delayDebounce);
  }, [userCoords, selectedCatId, minPrice, maxPrice, sortBy, searchQuery, page]);

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <div>
          <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 16px", borderRadius: "8px", marginBottom: "16px" }}>
            ← Back to Home
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)" }}>🛍️ Second-Hand Marketplace</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Find the best second-hand deals in <strong style={{ color: "var(--text-main)" }}>{locationFilter || "your area"}</strong>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", marginBottom: "32px", display: "flex", flexWrap: "wrap", gap: "16px", border: "1px solid var(--border-glass)" }}>
        {/* Search */}
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Search Keyword</label>
          <input
            type="text"
            className="form-input"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px" }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Category</label>
          <select
            className="form-input"
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-glass)" }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Price Inputs */}
        <div style={{ flex: "1 1 150px", display: "flex", gap: "8px" }}>
          <div style={{ width: "50%" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Min Price</label>
            <input
              type="number"
              className="form-input"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px" }}
            />
          </div>
          <div style={{ width: "50%" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Max Price</label>
            <input
              type="number"
              className="form-input"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px" }}
            />
          </div>
        </div>

        {/* Sorting option */}
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Sort By</label>
          <select
            className="form-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-glass)" }}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="distance_asc">Proximity (Nearest)</option>
          </select>
        </div>
      </div>

      {/* Product Feed Grid */}
      {listings.length === 0 && !loading ? (
        <div className="glass-panel" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", borderRadius: "16px" }}>
          No products found matching your search filters.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            {listings.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>

          {/* Load More Pagination */}
          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
              <button
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => setPage(prev => prev + 1)}
                style={{ padding: "12px 32px", fontSize: "14px", borderRadius: "10px", fontWeight: "600" }}
              >
                {loading ? "Loading..." : "Load More Products"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
