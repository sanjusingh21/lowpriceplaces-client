"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StoresPage() {
  const router = useRouter();
  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";
  const { userCoords, locationFilter } = useApp();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("proximity"); // proximity, rating
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const storeCategories = [
    "All", "Grocery", "Medical", "Restaurants", "Clothing", "Electronics", 
    "Furniture", "Hardware", "Stationery", "Jewellery", "Bakery", "Hotels"
  ];

  // Reset page when category or sort changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    async function loadStores() {
      setLoading(true);
      try {
        const data = await api.getStores({
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          category: selectedCategory === "All" ? "" : selectedCategory,
          page: page,
          limit: 12
        });

        let sorted = [...data];
        if (sortBy === "rating") {
          sorted.sort((a, b) => b.averageRating - a.averageRating);
        }

        if (page === 1) {
          setStores(sorted);
        } else {
          setStores(prev => {
            // Filter duplicates by ID
            const existingIds = new Set(prev.map(item => item.id));
            const newItems = sorted.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }

        if (data.length < 12) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Error loading stores:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, [userCoords, selectedCategory, sortBy, page]);

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <div>
          <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 16px", borderRadius: "8px", marginBottom: "16px" }}>
            ← Back to Marketplace
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)" }}>🏪 Stores Near You</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Showing verified stores near <strong style={{ color: "var(--text-main)" }}>{locationFilter || "your location"}</strong>
          </p>
        </div>

        {/* Search & Sort Container */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Sort Selector */}
          <select
            className="form-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "10px 16px", borderRadius: "10px", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-glass)" }}
          >
            <option value="proximity">Proximity (Nearest)</option>
            <option value="rating">Rating (Highest)</option>
          </select>

          {/* Search Input */}
          <div style={{ minWidth: "260px" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search stores by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "10px 16px", borderRadius: "10px" }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills Scroller */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px", marginBottom: "32px", scrollbarWidth: "none" }}>
        {storeCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-secondary"}`}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              borderRadius: "20px",
              flexShrink: 0,
              fontWeight: "600"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stores Grid */}
      {filteredStores.length === 0 && !loading ? (
        <div className="glass-panel" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", borderRadius: "16px" }}>
          No stores found matching your search criteria.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            {filteredStores.map(store => (
              <div
                key={store.id}
                onClick={() => router.push(`/stores/${store.id}`)}
                className="glass-panel"
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--border-glass)",
                  background: "var(--bg-card)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer"
                }}
              >
                {/* Photo header */}
                <div style={{ height: "130px", width: "100%", position: "relative", background: "rgba(255,255,255,0.02)" }}>
                  {store.imagePath ? (
                    <img
                      src={store.imagePath.startsWith("http") ? store.imagePath : `${imageServer}${store.imagePath}`}
                      alt={store.name}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Store"; }}
                    />
                  ) : (
                    <img
                      src="https://placehold.co/400x300?text=Store"
                      alt={store.name}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  <span style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(13,14,21,0.85)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", color: "#fbbf24", border: "1px solid rgba(255,255,255,0.05)" }}>
                    ⭐ {store.averageRating ? store.averageRating.toFixed(1) : store.rating.toFixed(1)}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {store.name}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    📂 Category: <strong>{store.category}</strong>
                  </span>

                  {store.contact && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      📞 Contact: <span style={{ color: "var(--text-main)" }}>{store.contact}</span>
                    </span>
                  )}

                  <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      📍 {store.distance !== null ? `${store.distance} km away` : store.location}
                    </span>
                    
                    {store.contact && (
                      <span
                        className="btn btn-primary"
                        style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", fontWeight: "600" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${store.contact.replace(/[^0-9]/g, '')}`, '_blank');
                        }}
                      >
                        WhatsApp
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Load More Button */}
          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
              <button
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => setPage(prev => prev + 1)}
                style={{ padding: "12px 32px", fontSize: "14px", borderRadius: "10px", fontWeight: "600" }}
              >
                {loading ? "Loading..." : "Load More Stores"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
