"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StoresPage() {
  const router = useRouter();
  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";
  const { user, userCoords, locationFilter, startChatWithSeller } = useApp();

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
          <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--font-helper)", padding: "8px 16px", borderRadius: "8px", marginBottom: "16px" }}>
            ← Back to Marketplace
          </Link>
          <h1 style={{ fontSize: "var(--font-h2)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)" }}>🏪 Stores Near You</h1>
          <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", marginTop: "4px" }}>
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
              fontSize: "var(--font-helper)",
              borderRadius: "20px",
              flexShrink: 0,
              fontWeight: "var(--font-weight-semibold)"
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
                  <span style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(13,14,21,0.85)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "var(--font-weight-bold)", color: "#fbbf24", border: "1px solid rgba(255,255,255,0.05)" }}>
                    ⭐ {store.averageRating ? store.averageRating.toFixed(1) : store.rating.toFixed(1)}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{ fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {store.name}
                  </h3>
                  <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)", marginTop: "4px" }}>
                    📂 Category: <strong>{store.category}</strong>
                  </span>

                  {store.contact && (
                    <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)", marginTop: "4px" }}>
                      📞 Contact: <span style={{ color: "var(--text-main)" }}>{store.contact}</span>
                    </span>
                  )}

                  <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-main)", fontWeight: "var(--font-weight-semibold)", display: "inline-flex", alignItems: "center", gap: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "45%" }} title={store.distance !== null ? `${store.distance} km away` : store.location}>
                      📍 {store.distance !== null ? `${store.distance} km` : store.location}
                    </span>
                    
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {(!user || user.id !== Math.abs(store.id)) && (
                        <span
                          className="btn btn-primary"
                          style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", fontWeight: "var(--font-weight-semibold)", display: "inline-flex", alignItems: "center", gap: "3px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            startChatWithSeller({ storeId: store.id, sellerId: Math.abs(store.id) });
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          Chat
                        </span>
                      )}
                      {store.contact && (
                        <span
                          className="btn btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", fontWeight: "var(--font-weight-semibold)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)" }}
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
                style={{ padding: "12px 32px", fontSize: "var(--font-small)", borderRadius: "10px", fontWeight: "var(--font-weight-semibold)" }}
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
