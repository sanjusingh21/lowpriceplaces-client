"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { calculateDistance } from "@/utils/distance";

export default function ListingMap({
  location,
  latitude,
  longitude,
  title,
  landmark,
}) {
  const { userCoords } = useApp();

  const lat = latitude ? parseFloat(latitude) : null;
  const lng = longitude ? parseFloat(longitude) : null;

  // Calculate distance if both user and item coordinates exist
  const distanceText =
    userCoords && userCoords.lat && userCoords.lng && lat && lng
      ? calculateDistance(userCoords.lat, userCoords.lng, lat, lng)
      : null;

  const searchQuery =
    lat && lng ? `${lat},${lng}` : encodeURIComponent(location || "Hyderabad, Telangana");

  const embedUrl = `https://maps.google.com/maps?q=${searchQuery}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;

  return (
    <div
      className="glass-panel listing-map-card"
      style={{
        padding: "20px",
        borderRadius: "16px",
        marginTop: "20px",
        border: "1px solid var(--border-glass)",
        background: "var(--bg-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "var(--font-body-lg)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--text-main)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🗺️ Exact Location & Map Navigation
          </h3>
          <p
            style={{
              fontSize: "var(--font-small)",
              color: "var(--text-muted)",
              margin: "4px 0 0 0",
            }}
          >
            {location || "Location address not specified"}
          </p>
          {landmark && (
            <p
              style={{
                fontSize: "var(--font-caption)",
                color: "var(--primary)",
                margin: "4px 0 0 0",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              🏢 Landmark: {landmark}
            </p>
          )}
        </div>

        {distanceText && (
          <span
            style={{
              background: "rgba(99, 102, 241, 0.15)",
              color: "var(--primary)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              padding: "6px 14px",
              borderRadius: "50px",
              fontSize: "var(--font-helper)",
              fontWeight: "var(--font-weight-bold)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📍 {distanceText}
          </span>
        )}
      </div>

      {/* Embedded Google Map */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "260px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border-glass)",
          background: "#1a1d2d",
        }}
      >
        <iframe
          title={`Map view for ${title || location || "Listing"}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
        />
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
          flexWrap: "wrap",
        }}
      >
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{
            flex: 1,
            minWidth: "160px",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: "var(--font-weight-semibold)",
            padding: "10px 16px",
            borderRadius: "10px",
          }}
        >
          <span>🚗 Get Directions</span>
        </a>
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{
            flex: 1,
            minWidth: "160px",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: "var(--font-weight-semibold)",
            padding: "10px 16px",
            borderRadius: "10px",
          }}
        >
          <span>🗺️ Open in Google Maps</span>
        </a>
      </div>
    </div>
  );
}
