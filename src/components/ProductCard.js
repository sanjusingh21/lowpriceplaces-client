"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { getImageSrcSet } from "@/utils/image";

export default function ProductCard({ item }) {
  const { savedListings, toggleBookmark } = useApp();
  const isBookmarked = savedListings?.includes(item.id) || false;

  const hasDiscount = item.discountPercent > 0;
  const priceFrom = item.price;
  const finalPriceFrom = hasDiscount
    ? (priceFrom * (1 - item.discountPercent / 100)).toFixed(0)
    : priceFrom;

  const priceTo = item.priceMax;
  const finalPriceTo = priceTo && hasDiscount
    ? (priceTo * (1 - item.discountPercent / 100)).toFixed(0)
    : priceTo;

  const photos = item.imagePath ? item.imagePath.split(",") : [];
  const coverImage = photos[0] || "";

  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";
  const srcSet = getImageSrcSet(coverImage, imageServer);

  return (
    <Link href={`/details/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="glass-panel product-card feed-card">
        <div className="card-image-wrapper">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleBookmark(item.id);
            }}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 10,
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backdropFilter: "blur(4px)",
              color: isBookmarked ? "#ef4444" : "#ffffff",
              padding: 0
            }}
            className="bookmark-btn"
            title={isBookmarked ? "Remove from Shortlist" : "Shortlist Listing"}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill={isBookmarked ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>

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

          {photos.length > 1 && (
            <div className="photo-count-badge">
              📷 +{photos.length - 1}
            </div>
          )}

          <img
            src={coverImage ? (coverImage.startsWith("http") ? coverImage : `${imageServer}${coverImage}`) : "https://placehold.co/400x300?text=No+Photo"}
            srcSet={srcSet || undefined}
            sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
            loading="lazy"
            alt={item.title}
            className="card-img"
            onError={(e) => {
              e.target.src = "https://placehold.co/400x300?text=Listing+Item";
              e.target.srcSet = "";
            }}
          />
        </div>

        <div className="card-content">
          {/* Top Metadata Row: Badge & Category */}
          <div className="card-meta">
            <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "2px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700", marginRight: "6px" }}>
              LPP-{String(item.id).padStart(5, "0")}
            </span>
            <span className="card-category-name" style={{ fontSize: "10.5px", color: "var(--text-dim)" }}>{item.category?.name}</span>
          </div>

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
                <span className="price-discounted">
                  ₹{finalPriceFrom}{finalPriceTo ? ` - ₹${finalPriceTo}` : ""}
                </span>
                <span className="price-original">
                  ₹{priceFrom}{priceTo ? ` - ₹${priceTo}` : ""}
                </span>
              </>
            ) : (
              <span className="price-discounted">
                ₹{priceFrom}{priceTo ? ` - ₹${priceTo}` : ""}
              </span>
            )}
          </div>

          <div style={{ marginTop: "auto", marginBottom: "12px" }}>
            <div className="btn btn-primary" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "8px", fontSize: "13px", borderRadius: "8px", fontWeight: "600" }}>
              View More Details →
            </div>
          </div>

          {/* Bottom Row: Location only */}
          <div className="card-location-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-location" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              📍 {item.location}
            </span>
            {item.distance !== undefined && item.distance !== null && (
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--primary-indigo)', whiteSpace: 'nowrap' }}>
                {item.distance} km away
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
