"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { getImageUrl } from "../../utils/image";

export default function SmallScalePage() {
  const { api, userCoords, imageServer, categories, handleDetectLocation, detectingLoc } = useApp();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort states
  const [searchLocation, setSearchLocation] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("nearest"); // 'nearest', 'rating', 'newest'

  useEffect(() => {
    const fetchSmallScale = async () => {
      setLoading(true);
      try {
        // Find Small Scale Category ID (default to 43 or matching slug)
        const cat43 = categories.find(
          (c) =>
            c.id === 43 ||
            c.slug === "small-scale-business" ||
            (c.name && c.name.toLowerCase().includes("small scale"))
        );
        const catId = cat43 ? cat43.id : 43;

        // Fetch listings by category or listingType SMALL_SCALE
        let res = await api.getListings({
          categoryId: catId,
          status: "ACTIVE",
          limit: 100,
        });

        let list = Array.isArray(res) ? res : res?.data || [];
        if (list.length === 0) {
          const fallbackRes = await api.getListings({
            q: "small scale",
            status: "ACTIVE",
            limit: 100,
          });
          list = Array.isArray(fallbackRes) ? fallbackRes : fallbackRes?.data || [];
        }

        // Process distance and ratings
        const processed = list.map((item) => {
          let dist = null;
          if (
            userCoords &&
            userCoords.lat &&
            userCoords.lng &&
            item.latitude &&
            item.longitude
          ) {
            const radlat1 = (Math.PI * userCoords.lat) / 180;
            const radlat2 = (Math.PI * item.latitude) / 180;
            const theta = userCoords.lng - item.longitude;
            const radtheta = (Math.PI * theta) / 180;
            let distCalc =
              Math.sin(radlat1) * Math.sin(radlat2) +
              Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (distCalc > 1) distCalc = 1;
            distCalc = Math.acos(distCalc);
            distCalc = (distCalc * 180) / Math.PI;
            distCalc = distCalc * 60 * 1.1515 * 1.609344;
            dist = Number(distCalc.toFixed(1));
          }

          const avgRating =
            item.reviews && item.reviews.length > 0
              ? item.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                item.reviews.length
              : 4.8;

          return {
            ...item,
            distance: dist,
            rating: avgRating,
          };
        });

        setListings(processed);
      } catch (err) {
        console.error("Error loading Small Scale Business listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmallScale();
  }, [categories, userCoords]);

  // Filtered & Sorted listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Location filter
        if (searchLocation.trim()) {
          const locLower = searchLocation.toLowerCase();
          const itemLoc = (item.location || "").toLowerCase();
          if (!itemLoc.includes(locLower)) return false;
        }

        // Rating filter
        if (minRating !== "0") {
          if (item.rating < parseFloat(minRating)) return false;
        }

        // Price filter
        if (minPrice && item.price !== undefined && item.price !== null) {
          if (item.price < parseFloat(minPrice)) return false;
        }
        if (maxPrice && item.price !== undefined && item.price !== null) {
          if (item.price > parseFloat(maxPrice)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "nearest") {
          if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
          if (a.distance !== null) return -1;
          if (b.distance !== null) return 1;
        }
        if (sortBy === "featured") {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.rating - a.rating;
        }
        if (sortBy === "rating") {
          return b.rating - a.rating;
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [listings, searchLocation, minRating, minPrice, maxPrice, sortBy]);

  return (
    <div className="container" style={{ paddingTop: "24px", paddingBottom: "48px" }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 32px",
          borderRadius: "16px",
          marginBottom: "32px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
          border: "1px solid var(--border-glass)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "2rem" }}>🏪</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "700", color: "var(--text-main)" }}>
              Small Scale Businesses
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Explore micro-enterprises, neighborhood shops, home businesses, and local service providers.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          borderRadius: "12px",
          marginBottom: "32px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Location Filter */}
        <div style={{ flex: "1 1 200px", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            className="form-input"
            placeholder="📍 Filter by Location..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", fontSize: "0.875rem" }}
          />
        </div>

        {/* Min Rating Filter */}
        <div style={{ flex: "0 0 150px" }}>
          <select
            className="form-select"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", fontSize: "0.875rem" }}
          >
            <option value="0">⭐ All Ratings</option>
            <option value="4.0">⭐ 4.0 & above</option>
            <option value="4.5">⭐ 4.5 & above</option>
          </select>
        </div>

        {/* Price Filter */}
        <div style={{ flex: "0 0 200px", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="number"
            className="form-input"
            placeholder="💰 Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{ width: "50%", padding: "8px 10px", fontSize: "0.875rem" }}
          />
          <input
            type="number"
            className="form-input"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ width: "50%", padding: "8px 10px", fontSize: "0.875rem" }}
          />
        </div>

        {/* Sort By Dropdown */}
        <div style={{ flex: "0 0 180px" }}>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", fontSize: "0.875rem" }}
          >
            <option value="nearest">↕️ Sort: Nearest</option>
            <option value="featured">✨ Sort: Featured</option>
            <option value="rating">⭐ Sort: Rating</option>
            <option value="newest">🕒 Sort: Newest</option>
          </select>
        </div>
      </div>

      {/* Grid of Small Scale Listings */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="glass-panel skeleton-loader"
              style={{ height: "260px", borderRadius: "12px" }}
            />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            borderRadius: "16px",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "12px" }}>🏪</span>
          <h3 style={{ color: "var(--text-main)", marginBottom: "8px" }}>No Small Scale Businesses found nearby.</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Be the first to add a Small Scale Business in your area!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
          {filteredListings.map((item) => {
            const imageList = item.imagePath ? item.imagePath.split(",") : [];
            const coverImg = imageList[0] || "";
            return (
              <Link
                key={item.id}
                href={`/details/${item.id}`}
                className="glass-panel"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid var(--border-glass)",
                  background: "var(--bg-card)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  textDecoration: "none",
                }}
              >
                <div style={{ height: "140px", width: "100%", position: "relative", background: "rgba(255,255,255,0.02)" }}>
                  {coverImg ? (
                    <img
                      src={getImageUrl(coverImg, imageServer)}
                      alt={item.title}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/400x300?text=Small+Scale";
                      }}
                    />
                  ) : (
                    <img
                      src="https://placehold.co/400x300?text=Small+Scale"
                      alt={item.title}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  {item.isFeatured && (
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        background: "linear-gradient(135deg, #6366f1, #a855f7)",
                        color: "#ffffff",
                        fontSize: "9px",
                        fontWeight: "bold",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(13,14,21,0.85)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "600",
                      color: "#fbbf24",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    ⭐ {item.rating.toFixed(1)}
                  </span>
                </div>

                <div style={{ padding: "14px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <span
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "var(--text-main)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.category?.name || "Small Scale Business"}
                  </span>

                  {item.price !== undefined && item.price !== null && (
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "var(--primary-indigo)",
                        marginTop: "6px",
                      }}
                    >
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "10px",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "var(--text-main)", fontWeight: "500" }}>
                      📍 {item.distance !== null ? `${item.distance} km` : item.location || "Nearby"}
                    </span>
                    <span style={{ fontSize: "10px", color: "#10b981", fontWeight: "600" }}>
                      ● OPEN
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
