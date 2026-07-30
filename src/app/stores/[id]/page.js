"use client";

import React, { useEffect, useState, use } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

export default function StoreDetailPage({ params: paramsPromise }) {
  const resolvedParams = use(paramsPromise);
  const { id } = resolvedParams;

  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";
  const { user, userCoords, startChatWithSeller } = useApp();

  const [store, setStore] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function loadStoreDetails() {
      setLoading(true);
      try {
        const data = await api.getStoreById(id, {
          lat: userCoords?.lat,
          lng: userCoords?.lng
        });
        setStore(data.store);
        setRelatedListings(data.relatedListings);
      } catch (err) {
        console.error("Error loading store detail:", err);
        setError("Failed to load store details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadStoreDetails();
    }
  }, [id, userCoords]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingReview(true);
    setReviewError("");

    try {
      const newReview = await api.addStoreReview(id, rating, comment);
      
      // Update local state with new review
      setStore(prev => {
        const updatedReviews = [newReview, ...prev.reviews];
        const newAvg = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0) / updatedReviews.length;
        return {
          ...prev,
          reviews: updatedReviews,
          averageRating: Number(newAvg.toFixed(1)),
          totalReviews: updatedReviews.length
        };
      });
      
      // Reset form
      setComment("");
      setRating(5);
    } catch (err) {
      console.error("Error posting store review:", err);
      setReviewError(err.message || "Failed to post review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !store) {
    return <div style={{ textAlign: "center", padding: "100px", color: "var(--text-muted)" }}>Loading store profile...</div>;
  }

  if (error || !store) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-main)" }}>{error || "Store not found"}</h2>
        <Link href="/stores" className="btn btn-secondary" style={{ marginTop: "20px" }}>
          Back to Stores
        </Link>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh" }}>
      {/* Back Button */}
      <Link href="/stores" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--font-helper)", padding: "8px 16px", borderRadius: "8px", marginBottom: "24px" }}>
        ← Back to Stores List
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
        {/* Main Content (Left Column) */}
        <div style={{ flex: "2 1 600px", display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Main Info Card */}
          <div className="glass-panel" style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border-glass)", background: "var(--bg-card)" }}>
            {/* Banner Photo */}
            <div style={{ height: "300px", width: "100%", position: "relative", background: "rgba(255,255,255,0.01)" }}>
              {store.imagePath ? (
                <img
                  src={store.imagePath.startsWith("http") ? store.imagePath : `${imageServer}${store.imagePath}`}
                  alt={store.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.src = "https://placehold.co/800x400?text=Store+Banner"; }}
                />
              ) : (
                <img
                  src="https://placehold.co/800x400?text=Store+Banner"
                  alt={store.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>

            {/* Profile Info */}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h1 style={{ fontSize: "var(--font-h1)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: 0 }}>{store.name}</h1>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                    <span style={{ display: "inline-block", background: "rgba(99,102,241,0.15)", color: "var(--primary-indigo)", padding: "4px 12px", borderRadius: "20px", fontSize: "var(--font-caption)", fontWeight: "var(--font-weight-bold)" }}>
                      {store.category}
                    </span>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "var(--font-helper)" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--primary-indigo)" }}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <strong style={{ color: "var(--text-main)" }}>{store.location}</strong>
                      {store.distance !== null && <span style={{ color: "var(--primary-indigo)", fontWeight: "var(--font-weight-semibold)" }}>({store.distance} km away)</span>}
                    </div>
                  </div>
                </div>
                
                {/* Rating Overview */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "var(--font-h3)", fontWeight: "var(--font-weight-bold)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    ⭐ {store.averageRating ? store.averageRating.toFixed(1) : store.rating.toFixed(1)}
                  </div>
                  <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)" }}>
                    Based on {store.totalReviews || 0} reviews
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "24px" }}>
                {(!user || user.id !== Math.abs(store.id)) && (
                  <button
                    onClick={() => {
                      startChatWithSeller({ storeId: store.id, sellerId: Math.abs(store.id) });
                    }}
                    className="btn btn-primary"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "var(--font-weight-semibold)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Website Chat</span>
                  </button>
                )}
                {store.latitude && store.longitude && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: "var(--font-weight-semibold)", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    🗺️ Get Directions
                  </a>
                )}
                {store.contact && (
                  <>
                    <a
                      href={`https://wa.me/${store.contact.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: "var(--font-weight-semibold)", color: "#22c55e" }}
                    >
                      💬 WhatsApp Store
                    </a>
                    <a
                      href={`tel:${store.contact}`}
                      className="btn btn-secondary"
                      style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: "var(--font-weight-semibold)" }}
                    >
                      📞 Call: {store.contact}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "20px", border: "1px solid var(--border-glass)", background: "var(--bg-card)" }}>
            <h2 style={{ fontSize: "var(--font-h4)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "20px" }}>
              💬 Reviews & Ratings
            </h2>

            {/* Review Composer Form */}
            {user ? (
              <form onSubmit={handleReviewSubmit} style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h4 style={{ fontSize: "var(--font-small)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "12px" }}>Write a Review</h4>
                
                {reviewError && (
                  <div style={{ padding: "10px", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "6px", fontSize: "var(--font-caption)", marginBottom: "12px" }}>
                    {reviewError}
                  </div>
                )}

                {/* Star Rating Select */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--font-helper)", color: "var(--text-muted)" }}>Your Rating:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{ background: "none", border: "none", fontSize: "var(--font-h4)", cursor: "pointer", color: star <= rating ? "#fbbf24" : "var(--text-muted)", padding: 0 }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Textarea */}
                <textarea
                  className="form-input"
                  placeholder="Share your experience with this store..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  style={{ width: "100%", height: "90px", borderRadius: "10px", padding: "12px", marginBottom: "12px", resize: "none" }}
                />

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn btn-primary"
                  style={{ padding: "8px 24px", borderRadius: "8px", fontWeight: "var(--font-weight-semibold)" }}
                >
                  {submittingReview ? "Submitting..." : "Post Review"}
                </button>
              </form>
            ) : (
              <div className="glass-panel" style={{ padding: "16px", borderRadius: "10px", textAlign: "center", marginBottom: "32px", background: "rgba(255,255,255,0.01)" }}>
                <span style={{ fontSize: "var(--font-helper)", color: "var(--text-muted)", marginRight: "12px" }}>
                  You must be logged in to review this business.
                </span>
                <Link href="/login" className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "var(--font-caption)", borderRadius: "6px" }}>
                  Sign In
                </Link>
              </div>
            )}

            {/* Reviews Feed */}
            {store.reviews.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--font-helper)" }}>
                No reviews yet. Be the first to write a review!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {store.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.03)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "var(--font-helper)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)" }}>
                        👤 {rev.buyer?.username || "Verified Customer"}
                      </span>
                      <div style={{ color: "#fbbf24", fontSize: "var(--font-helper)", fontWeight: "var(--font-weight-semibold)" }}>
                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <p style={{ fontSize: "var(--font-helper)", color: "var(--text-muted)", margin: 0, lineHeight: "var(--line-height-normal)" }}>
                      {rev.comment}
                    </p>
                    <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", textAlign: "right" }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column (Right Column) */}
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Location & Details Overview */}
          <div className="glass-panel" style={{ padding: "20px", borderRadius: "20px", border: "1px solid var(--border-glass)", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "var(--font-h5)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--primary-indigo)" }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Location Details</span>
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "var(--font-helper)" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>City/Area</span>
                <strong style={{ color: "var(--text-main)" }}>{store.location}</strong>
              </div>
              {store.distance !== null && (
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Proximity</span>
                  <strong style={{ color: "var(--primary-indigo)" }}>{store.distance} km away from you</strong>
                </div>
              )}
              {store.latitude && store.longitude && (
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>GPS Coordinates</span>
                  <span style={{ fontFamily: "monospace", color: "var(--text-main)" }}>{store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related Listings Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "var(--font-h5)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: 0 }}>
              Related Deals Nearby
            </h3>
            
            {relatedListings.length === 0 ? (
              <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "var(--font-helper)" }}>No listings found in this city.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {relatedListings.map(item => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
