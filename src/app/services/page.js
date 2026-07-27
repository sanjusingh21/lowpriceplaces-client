"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ServicesPage() {
  const router = useRouter();
  const { userCoords, locationFilter } = useApp();
  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("proximity"); // proximity, rating
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const serviceTypes = [
    "All", "Electrician", "Plumber", "Home Cleaning", "AC Repair", "Car Repair",
    "Bike Service", "Pest Control", "Packers & Movers", "Carpenter", "Painter", 
    "RO Service", "Water Tank Cleaning", "Internet Providers", "Laundry", "Salon", 
    "Beautician", "Tuition", "Coaching Centres", "Hospitals", "Clinics", "Ambulance", 
    "Pharmacy", "Courier"
  ];

  // Reset page when filter/sort changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [selectedType, sortBy]);

  useEffect(() => {
    async function loadServices() {
      setLoading(true);
      try {
        const data = await api.getServices({
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          serviceType: selectedType === "All" ? "" : selectedType,
          page: page,
          limit: 12
        });

        let sorted = [...data];
        if (sortBy === "rating") {
          sorted.sort((a, b) => b.averageRating - a.averageRating);
        }

        if (page === 1) {
          setServices(sorted);
        } else {
          setServices(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newItems = sorted.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }

        if (data.length < 12) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, [userCoords, selectedType, sortBy, page]);

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <div>
          <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--font-helper)", padding: "8px 16px", borderRadius: "8px", marginBottom: "16px" }}>
            ← Back to Marketplace
          </Link>
          <h1 style={{ fontSize: "var(--font-h2)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)" }}>🛠️ Services Near You</h1>
          <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", marginTop: "4px" }}>
            Showing verified local professionals near <strong style={{ color: "var(--text-main)" }}>{locationFilter || "your location"}</strong>
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
              placeholder="Search services by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "10px 16px", borderRadius: "10px" }}
            />
          </div>
        </div>
      </div>

      {/* Service Type Pills Scroller */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px", marginBottom: "32px", scrollbarWidth: "none" }}>
        {serviceTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`btn ${selectedType === type ? "btn-primary" : "btn-secondary"}`}
            style={{
              padding: "8px 16px",
              fontSize: "var(--font-helper)",
              borderRadius: "20px",
              flexShrink: 0,
              fontWeight: "var(--font-weight-semibold)"
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 && !loading ? (
        <div className="glass-panel" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", borderRadius: "16px" }}>
          No services found matching your search criteria.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            {filteredServices.map(service => (
              <div
                key={service.id}
                onClick={() => router.push(`/services/${service.id}`)}
                className="glass-panel"
                style={{
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid var(--border-glass)",
                  background: "var(--bg-card)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer"
                }}
              >
                {/* Circular Icon */}
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  {service.imagePath ? (
                    <img
                      src={service.imagePath.startsWith("http") ? service.imagePath : `${imageServer}${service.imagePath}`}
                      alt={service.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "https://placehold.co/100x100?text=Service"; }}
                    />
                  ) : (
                    <img
                      src="https://placehold.co/100x100?text=Service"
                      alt={service.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>

                {/* Title & Type */}
                <h3 style={{ fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {service.name}
                </h3>
                <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)", marginTop: "4px" }}>
                  🛠️ {service.serviceType}
                </span>

                {/* Rating */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "var(--font-helper)", color: "#fbbf24", fontWeight: "var(--font-weight-semibold)" }}>
                  ⭐ {service.averageRating ? service.averageRating.toFixed(1) : service.rating.toFixed(1)}
                </div>

                {/* Location & Contact Button */}
                <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--font-caption)", color: "var(--text-main)", fontWeight: "var(--font-weight-semibold)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    📍 {service.distance !== null ? `${service.distance} km away` : service.location}
                  </span>

                  {service.contact && (
                    <span
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: "var(--font-caption)", borderRadius: "8px", fontWeight: "var(--font-weight-semibold)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://wa.me/${service.contact.replace(/[^0-9]/g, '')}`, '_blank');
                      }}
                    >
                      Hire Now
                    </span>
                  )}
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
                {loading ? "Loading..." : "Load More Services"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
