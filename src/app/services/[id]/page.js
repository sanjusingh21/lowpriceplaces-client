"use client";

import React, { useEffect, useState, use } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

export default function ServiceDetailPage({ params: paramsPromise }) {
  const resolvedParams = use(paramsPromise);
  const { id } = resolvedParams;

  const { user, userCoords } = useApp();
  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  const [service, setService] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function loadServiceDetails() {
      setLoading(true);
      try {
        const data = await api.getServiceById(id, {
          lat: userCoords?.lat,
          lng: userCoords?.lng
        });
        setService(data.service);
        setRelatedListings(data.relatedListings);
      } catch (err) {
        console.error("Error loading service detail:", err);
        setError("Failed to load service details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadServiceDetails();
    }
  }, [id, userCoords]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingReview(true);
    setReviewError("");

    try {
      const newReview = await api.addServiceReview(id, rating, comment);
      
      setService(prev => {
        const updatedReviews = [newReview, ...prev.reviews];
        const newAvg = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0) / updatedReviews.length;
        return {
          ...prev,
          reviews: updatedReviews,
          averageRating: Number(newAvg.toFixed(1)),
          totalReviews: updatedReviews.length
        };
      });
      
      setComment("");
      setRating(5);
    } catch (err) {
      console.error("Error posting service review:", err);
      setReviewError(err.message || "Failed to post review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !service) {
    return <div style={{ textAlign: "center", padding: "100px", color: "var(--text-muted)" }}>Loading service details...</div>;
  }

  if (error || !service) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-main)" }}>{error || "Service not found"}</h2>
        <Link href="/services" className="btn btn-secondary" style={{ marginTop: "20px" }}>
          Back to Services
        </Link>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`;

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh" }}>
      {/* Back Button */}
      <Link href="/services" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--font-helper)", padding: "8px 16px", borderRadius: "8px", marginBottom: "24px" }}>
        ← Back to Services
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
        {/* Main Column */}
        <div style={{ flex: "2 1 600px", display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Main Info Card */}
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "20px", border: "1px solid var(--border-glass)", background: "var(--bg-card)", display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
            {/* Circular Avatar */}
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              {service.imagePath ? (
                <img
                  src={service.imagePath.startsWith("http") ? service.imagePath : `${imageServer}${service.imagePath}`}
                  alt={service.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.src = "https://placehold.co/200x200?text=Service"; }}
                />
              ) : (
                <img
                  src="https://placehold.co/200x200?text=Service"
                  alt={service.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <h1 style={{ fontSize: "var(--font-h2)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: 0 }}>{service.name}</h1>
                  <span style={{ display: "inline-block", background: "rgba(236,72,153,0.15)", color: "var(--text-main)", padding: "4px 12px", borderRadius: "20px", fontSize: "var(--font-caption)", fontWeight: "var(--font-weight-bold)", marginTop: "8px" }}>
                    📂 {service.serviceType}
                  </span>
                </div>
                
                {/* Rating */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ fontSize: "var(--font-h4)", fontWeight: "var(--font-weight-bold)", color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                    ⭐ {service.averageRating ? service.averageRating.toFixed(1) : service.rating.toFixed(1)}
                  </div>
                  <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)", marginTop: "2px" }}>
                    ({service.totalReviews || 0} reviews)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                {service.latitude && service.longitude && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: "var(--font-weight-semibold)", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--font-helper)" }}
                  >
                    🗺️ Directions
                  </a>
                )}
                {service.contact && (
                  <>
                    <a
                      href={`https://wa.me/${service.contact.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: "var(--font-weight-semibold)", color: "#22c55e", fontSize: "var(--font-helper)" }}
                    >
                      💬 Hire via WhatsApp
                    </a>
                    <a
                      href={`tel:${service.contact}`}
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-helper)" }}
                    >
                      📞 Call Professional
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reviews list */}
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "20px", border: "1px solid var(--border-glass)", background: "var(--bg-card)" }}>
            <h2 style={{ fontSize: "var(--font-h4)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "20px" }}>
              💬 Reviews & Client Feedback
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

                <textarea
                  className="form-input"
                  placeholder="Tell us about the service quality..."
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
                  You must be logged in to leave feedback.
                </span>
                <Link href="/login" className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "var(--font-caption)", borderRadius: "6px" }}>
                  Sign In
                </Link>
              </div>
            )}

            {/* Reviews Feed */}
            {service.reviews.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--font-helper)" }}>
                No reviews yet. Write a review to help others!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {service.reviews.map((rev) => (
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

        {/* Sidebar Column */}
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Details Overview */}
          <div className="glass-panel" style={{ padding: "20px", borderRadius: "20px", border: "1px solid var(--border-glass)", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "var(--font-h5)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              📍 Location Details
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "var(--font-helper)" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>City/Area</span>
                <strong style={{ color: "var(--text-main)" }}>{service.location}</strong>
              </div>
              {service.distance !== null && (
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Distance</span>
                  <strong style={{ color: "var(--primary-indigo)" }}>{service.distance} km away</strong>
                </div>
              )}
              {service.latitude && service.longitude && (
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>GPS Coordinates</span>
                  <span style={{ fontFamily: "monospace", color: "var(--text-main)" }}>{service.latitude.toFixed(5)}, {service.longitude.toFixed(5)}</span>
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
