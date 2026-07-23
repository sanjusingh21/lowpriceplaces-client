"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import { getImageSrcSet } from "@/utils/image";

export default function DetailsClient({ id }) {
  const router = useRouter();
  const { user, savedListings, toggleBookmark } = useApp();

  const [listingDetails, setListingDetails] = useState(null);
  const [activeDetailImage, setActiveDetailImage] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(true);

  // In-app messaging state
  const [inquiryText, setInquiryText] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState("");

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewVideos, setReviewVideos] = useState([]);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  const loadListingDetails = async (listingId) => {
    try {
      const data = await api.getListingDetails(listingId);
      setListingDetails(data);
      const photos = data.imagePath ? data.imagePath.split(",") : [];
      if (!activeDetailImage && photos.length > 0) {
        setActiveDetailImage(photos[0]);
      }
    } catch (e) {
      console.error("Listing details load error:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingDetails(true);
      await loadListingDetails(id);
      setLoadingDetails(false);
    };
    init();
  }, [id]);

  const submitInquiry = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!inquiryText.trim()) return;

    try {
      await api.sendInquiry(listingDetails.id, inquiryText);
      setInquirySuccess(
        "Inquiry sent successfully! The seller has been notified in their leads inbox."
      );
      setInquiryText("");
    } catch (e) {
      alert(e.message);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError("Please type a comment.");
      return;
    }

    const formData = new FormData();
    formData.append("rating", reviewRating);
    formData.append("comment", reviewComment);

    for (let i = 0; i < reviewImages.length; i++) {
      formData.append("images", reviewImages[i]);
    }
    for (let i = 0; i < reviewVideos.length; i++) {
      formData.append("videos", reviewVideos[i]);
    }

    try {
      await api.submitReview(listingDetails.id, formData);
      setReviewSuccess("Review submitted! Thank you.");
      setReviewComment("");
      setReviewImages([]);
      setReviewVideos([]);
      setReviewError("");
      loadListingDetails(listingDetails.id);
    } catch (err) {
      setReviewError(err.message);
    }
  };

  if (loadingDetails) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
        Loading product details...
      </div>
    );
  }

  if (!listingDetails) {
    return (
      <div className="glass-panel" style={{ padding: "40px", textAlign: "center", margin: "40px 0" }}>
        <h2>Product Not Found</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>
          The product listing you are looking for may have been removed or does not exist.
        </p>
        <button className="btn btn-primary" style={{ marginTop: "20px" }} onClick={() => router.push("/")}>
          ← Back to Homepage
        </button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary" style={{ marginBottom: "24px" }} onClick={() => router.push("/")}>
        ← Back to Listings
      </button>

      <div className="detail-layout">
        {/* Left Column: Image display */}
        <div className="detail-gallery">
          <div
            className="gallery-main"
            style={{
              position: "relative",
              width: "100%",
              height: "400px",
              background: "#141420",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid var(--border-glass)",
            }}
          >
            <img
              src={activeDetailImage ? (activeDetailImage.startsWith("http") ? activeDetailImage : `${imageServer}${activeDetailImage}`) : "https://placehold.co/600x400?text=No+Photo"}
              srcSet={getImageSrcSet(activeDetailImage, imageServer) || undefined}
              sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
              loading="lazy"
              alt={listingDetails.title}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => {
                e.target.src = "https://placehold.co/600x400?text=No+Image+Provided";
                e.target.srcSet = "";
              }}
            />
          </div>

          {/* Thumbnails Row Carousel */}
          {listingDetails.imagePath && listingDetails.imagePath.split(",").length > 1 && (
            <div className="thumbnail-carousel" style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0", scrollbarWidth: "thin" }}>
              {listingDetails.imagePath.split(",").map((img, index) => {
                const isSelected = activeDetailImage === img;
                return (
                  <div
                    key={index}
                    onClick={() => setActiveDetailImage(img)}
                    style={{
                      width: "80px",
                      height: "60px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: isSelected ? "2px solid var(--primary)" : "2px solid transparent",
                      background: "#141420",
                      flexShrink: 0,
                      transition: "var(--transition)",
                    }}
                  >
                    <img
                      src={img ? (img.startsWith("http") ? img : `${imageServer}${img}`) : "https://placehold.co/100x100?text=No+Image"}
                      srcSet={getImageSrcSet(img, imageServer) || undefined}
                      sizes="80px"
                      loading="lazy"
                      alt={`Thumbnail ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/100x100?text=No+Image";
                        e.target.srcSet = "";
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Contact Panel */}
        <div className="detail-info">
          <div className="category-breadcrumbs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div>
              <span>{listingDetails.category?.name}</span>
              {listingDetails.subCategory && (
                <>
                  <span>/</span>
                  <span>{listingDetails.subCategory.name}</span>
                </>
              )}
            </div>
            <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
              Listing ID: LPP-{String(listingDetails.id).padStart(5, "0")}
            </span>
          </div>

          <h1 className="detail-title">{listingDetails.title}</h1>

          <div className="detail-meta-row">
            <span>📍 {listingDetails.location}</span>
            {listingDetails.averageRating > 0 ? (
              <span className="detail-meta-rating">
                ★ {listingDetails.averageRating} ({listingDetails.totalReviews} Reviews)
              </span>
            ) : (
              <span style={{ color: "var(--text-dim)" }}>No reviews yet</span>
            )}
            <span style={{ color: "var(--text-dim)" }}>|</span>
            <span>Seller: <strong>{listingDetails.seller?.sellerProfile?.displayName || listingDetails.seller?.username}</strong></span>
            <span style={{ color: "var(--text-dim)" }}>|</span>
            <span>📅 Posted: <strong>{new Date(listingDetails.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong></span>
          </div>

          <div className="card-prices">
            {listingDetails.discountPercent > 0 ? (
              (() => {
                const finalFrom = (listingDetails.price * (1 - listingDetails.discountPercent / 100)).toFixed(0);
                const finalTo = listingDetails.priceMax
                  ? (listingDetails.priceMax * (1 - listingDetails.discountPercent / 100)).toFixed(0)
                  : null;
                return (
                  <>
                    <span className="price-discounted" style={{ fontSize: "36px" }}>
                      ₹{finalFrom}{finalTo ? ` - ₹${finalTo}` : ""}
                    </span>
                    <span className="price-original" style={{ fontSize: "20px" }}>
                      ₹{listingDetails.price}{listingDetails.priceMax ? ` - ₹${listingDetails.priceMax}` : ""}
                    </span>
                    <span className="card-badge" style={{ position: "static" }}>
                      {listingDetails.discountPercent}% OFF Announcement!
                    </span>
                  </>
                );
              })()
            ) : (
              <span className="price-discounted" style={{ fontSize: "36px" }}>
                ₹{listingDetails.price}{listingDetails.priceMax ? ` - ₹${listingDetails.priceMax}` : ""}
              </span>
            )}
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3 style={{ marginBottom: "12px", fontSize: "18px" }}>Description</h3>
            <p className="detail-desc">{listingDetails.description}</p>
          </div>

          {/* Seller Information Card */}
          {listingDetails.seller?.sellerProfile && (
            <div className="glass-panel seller-info-card" style={{ padding: "20px", marginTop: "20px" }}>
              <h3 style={{ marginBottom: "12px", fontSize: "18px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "8px" }}>
                Seller Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-main)" }}>
                    {listingDetails.seller.sellerProfile.displayName || listingDetails.seller.sellerProfile.fullName}
                  </h4>
                  {listingDetails.seller.sellerProfile.professionalTitle && (
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                      {listingDetails.seller.sellerProfile.professionalTitle}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-dim)" }}>
                  {listingDetails.seller.sellerProfile.yearsOfExperience !== undefined && listingDetails.seller.sellerProfile.yearsOfExperience !== null && (
                    <span>⭐ Experience: <strong>{listingDetails.seller.sellerProfile.yearsOfExperience} Years</strong></span>
                  )}
                  {listingDetails.seller.sellerProfile.businessCategory && (
                    <span>🏷️ Category: <strong>{listingDetails.seller.sellerProfile.businessCategory}</strong></span>
                  )}
                </div>

                {listingDetails.seller.sellerProfile.aboutSeller && (
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.5" }}>
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: aboutExpanded ? "unset" : 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {listingDetails.seller.sellerProfile.aboutSeller}
                    </div>
                    {listingDetails.seller.sellerProfile.aboutSeller.split("\n").length > 3 || listingDetails.seller.sellerProfile.aboutSeller.length > 180 ? (
                      <button
                        onClick={() => setAboutExpanded(!aboutExpanded)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          padding: 0,
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          marginTop: "4px",
                        }}
                      >
                        {aboutExpanded ? "Read Less" : "Read More"}
                      </button>
                    ) : null}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", borderTop: "1px solid var(--border-glass)", paddingTop: "10px", marginTop: "4px" }}>
                  {listingDetails.seller.sellerProfile.email && (
                    <div>📧 Email: <a href={`mailto:${listingDetails.seller.sellerProfile.email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{listingDetails.seller.sellerProfile.email}</a></div>
                  )}
                  {listingDetails.seller.sellerProfile.mobileNumber && (
                    <div>📞 Mobile: <a href={`tel:${listingDetails.seller.sellerProfile.mobileNumber}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{listingDetails.seller.sellerProfile.mobileNumber}</a></div>
                  )}
                  {listingDetails.seller.sellerProfile.whatsAppNumber && (
                    <div>💬 WhatsApp: <a href={`https://wa.me/${listingDetails.seller.sellerProfile.whatsAppNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none" }}>{listingDetails.seller.sellerProfile.whatsAppNumber}</a></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact and Messaging Box */}
          <div className="glass-panel contact-card" style={{ marginTop: "20px" }}>
            <h3 className="contact-title">Contact Seller</h3>
            {user ? (
              (() => {
                const sellerProfile = listingDetails.seller?.sellerProfile;
                const displayWhatsApp = sellerProfile ? sellerProfile.whatsAppNumber : listingDetails.whatsappNumber;
                const displayCall = sellerProfile ? sellerProfile.mobileNumber : listingDetails.contactNumber;

                return (
                  <>
                    <div className="contact-methods">
                      {displayWhatsApp && (
                        <a
                          href={`https://wa.me/${displayWhatsApp.replace(/[^0-9]/g, "")}?text=Hi, I am interested in your listing: "${encodeURIComponent(listingDetails.title)}"`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp"
                          style={{ textDecoration: "none" }}
                        >
                          💬 Chat on WhatsApp ({displayWhatsApp})
                        </a>
                      )}

                      {displayCall && (
                        <a href={`tel:${displayCall}`} className="btn btn-secondary" style={{ textDecoration: "none" }}>
                          📞 Call Seller ({displayCall})
                        </a>
                      )}

                      <button
                        className={`btn ${savedListings.includes(listingDetails.id) ? "btn-accent" : "btn-secondary"}`}
                        onClick={() => toggleBookmark(listingDetails.id)}
                      >
                        {savedListings.includes(listingDetails.id) ? "⭐ Bookmarked" : "☆ Save/Bookmark Product"}
                      </button>
                    </div>

                    {/* In-app Message Inquiry composer */}
                    <form onSubmit={submitInquiry} className="inquiry-box" style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "16px", marginTop: "8px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "600" }}>Send Instant Inquiry Message</h4>
                      {inquirySuccess && <div className="alert-banner alert-success">{inquirySuccess}</div>}
                      <textarea
                        className="inquiry-textarea"
                        placeholder="Ask the seller for availability, negotiation, or coordinates..."
                        value={inquiryText}
                        onChange={(e) => setInquiryText(e.target.value)}
                        required
                      ></textarea>
                      <button type="submit" className="btn btn-primary">
                        Send Message
                      </button>
                    </form>
                  </>
                );
              })()
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0 8px 0" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: "14px", lineHeight: "1.5" }}>
                  Please log in to contact the seller and view listing contact details.
                </p>
                <button className="btn btn-primary" onClick={() => router.push("/login")} style={{ width: "100%" }}>
                  Log In to Contact Seller
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REVIEWS & STAR RATINGS GRID */}
      <section className="reviews-section">
        <div className="reviews-header">
          <h2>Product Reviews & Ratings</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", color: "#fbbf24" }}>★</span>
            <span style={{ fontSize: "20px", fontWeight: "700" }}>
              {listingDetails.averageRating || "N/A"}
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              ({listingDetails.totalReviews} total reviews)
            </span>
          </div>
        </div>

        {/* Add New Review Composer */}
        {user ? (
          <form onSubmit={submitReview} className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Write a Review</h3>

            {reviewSuccess && <div className="alert-banner alert-success">{reviewSuccess}</div>}
            {reviewError && <div className="alert-banner alert-error">{reviewError}</div>}

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Rating</label>
              <div className="star-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={reviewRating >= star ? "selected" : ""}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Your Comment</label>
              <textarea
                className="form-textarea"
                placeholder="Write your review details (quality, delivery time, packaging, etc.)..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="form-grid" style={{ marginBottom: "16px" }}>
              <div className="form-group">
                <label className="form-label">Upload Photos (Max 5)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-input"
                  onChange={(e) => setReviewImages(e.target.files)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Upload Videos (Max 2)</label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="form-input"
                  onChange={(e) => setReviewVideos(e.target.files)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Submit Review
            </button>
          </form>
        ) : (
          <div className="glass-panel" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
            Please <strong style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => router.push("/login")}>Login</strong> to post a rating or review.
          </div>
        )}

        {/* Reviews Feed */}
        <div className="reviews-list">
          {listingDetails.reviews?.length === 0 ? (
            <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "20px" }}>
              No reviews for this product yet. Be the first to review!
            </div>
          ) : (
            listingDetails.reviews?.map((rev) => (
              <div key={rev.id} className="glass-panel review-item">
                <div className="review-meta">
                  <span className="review-user">{rev.buyer?.username}</span>
                  <span className="review-stars">
                    {"★".repeat(rev.rating)}
                    {"☆".repeat(5 - rev.rating)}
                  </span>
                </div>
                <p className="review-comment">{rev.comment}</p>

                {/* Media (photos & videos) attachment gallery */}
                {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                  <div className="review-media-grid">
                    {rev.images?.map((img, i) => (
                      <img
                        key={i}
                        src={`${imageServer}${img}`}
                        srcSet={getImageSrcSet(img, imageServer) || undefined}
                        sizes="(max-width: 480px) 150px, 300px"
                        loading="lazy"
                        alt="Review image"
                        className="review-img"
                        onClick={() => window.open(`${imageServer}${img}`)}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ))}
                    {rev.videos?.map((vid, i) => (
                      <video
                        key={i}
                        src={`${imageServer}${vid}`}
                        controls
                        className="review-video"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Sticky Bottom Details Contact Bar (Mobile Only) */}
      <div className="mobile-detail-sticky-bar">
        {user ? (
          (() => {
            const sellerProfile = listingDetails.seller?.sellerProfile;
            const displayWhatsApp = sellerProfile ? sellerProfile.whatsAppNumber : listingDetails.whatsappNumber;
            const displayCall = sellerProfile ? sellerProfile.mobileNumber : listingDetails.contactNumber;

            return (
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                {displayWhatsApp && (
                  <a
                    href={`https://wa.me/${displayWhatsApp.replace(/[^0-9]/g, "")}?text=Hi, I am interested in your listing: "${encodeURIComponent(listingDetails.title)}"`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp"
                    style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", gap: "6px", height: "44px", padding: 0 }}
                  >
                    💬 WhatsApp
                  </a>
                )}
                {displayCall && (
                  <a
                    href={`tel:${displayCall}`}
                    className="btn btn-secondary"
                    style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", gap: "6px", height: "44px", padding: 0 }}
                  >
                    📞 Call Owner
                  </a>
                )}
              </div>
            );
          })()
        ) : (
          <div style={{ width: "100%" }}>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/login")}
              style={{ width: "100%", height: "44px", fontSize: "14px", padding: 0 }}
            >
              🔑 Log In to Contact Seller
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
