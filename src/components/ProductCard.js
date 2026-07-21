"use client";

import React from "react";
import Link from "next/link";

export default function ProductCard({ item }) {
  const hasDiscount = item.discountPercent > 0;
  const finalPrice = hasDiscount
    ? (item.price * (1 - item.discountPercent / 100)).toFixed(0)
    : item.price;
  const photos = item.imagePath ? item.imagePath.split(",") : [];
  const coverImage = photos[0] || "";

  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  return (
    <Link href={`/details/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="glass-panel product-card feed-card">
        <div className="card-image-wrapper">
          {hasDiscount && (
            <div className="card-badge">-{item.discountPercent}% OFF</div>
          )}

          {item.averageRating > 0 && (
            <div className="rating-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
              </svg>
              {Number(item.averageRating).toFixed(1)}
            </div>
          )}

          <img
            src={coverImage ? `${imageServer}${coverImage}` : "https://placehold.co/400x300?text=No+Photo"}
            alt={item.title}
            className="card-img"
            onError={(e) => {
              e.target.src = "https://placehold.co/400x300?text=Listing+Item";
            }}
          />
        </div>

        <div className="card-content">
          <h3 className="card-title">{item.title}</h3>
          <p className="card-desc">{item.description}</p>

          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>👤 Seller:</span>
            <strong style={{ color: "var(--text-main)" }}>{item.seller?.username || "Seller"}</strong>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>📅 Posted:</span>
            <span style={{ color: "var(--text-main)", fontWeight: "500" }}>
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div className="card-prices">
            {hasDiscount ? (
              <>
                <span className="price-discounted">₹{finalPrice}</span>
                <span className="price-original">₹{item.price}</span>
              </>
            ) : (
              <span className="price-discounted">₹{item.price}</span>
            )}
          </div>

          <div style={{ marginTop: "auto", marginBottom: "12px" }}>
            <div className="btn btn-primary" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "8px", fontSize: "13px", borderRadius: "8px", fontWeight: "600" }}>
              View More Details →
            </div>
          </div>

          <div className="card-meta">
            <span>📍 {item.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "2px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700" }}>
                LPP-{String(item.id).padStart(5, "0")}
              </span>
              <span>{item.category?.name}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
