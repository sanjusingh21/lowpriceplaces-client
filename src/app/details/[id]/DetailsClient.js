"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import { getImageSrcSet } from "@/utils/image";
import { io } from "socket.io-client";

export default function DetailsClient({ id }) {
  const router = useRouter();
  const { user, savedListings, toggleBookmark, startDirectChatWithListing } = useApp();

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

  const [activeTab, setActiveTab] = useState("description");

  // Inline live chat states
  const [chatSession, setChatSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInputText, setChatInputText] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatMessagesEndRef = useRef(null);

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

  const loadChatSession = async () => {
    if (!user || !listingDetails || user.id === listingDetails.sellerId) return;
    try {
      const chat = await api.startDirectChat(listingDetails.id);
      setChatSession(chat);
      setChatMessages(chat.messages || []);
    } catch (e) {
      console.error("Load inline chat error:", e);
    }
  };

  // Socket.IO sync for inline chat
  useEffect(() => {
    if (activeTab !== "chat" || !user || !listingDetails || user.id === listingDetails.sellerId) return;

    setChatLoading(true);
    loadChatSession().finally(() => setChatLoading(false));

    let socket;
    const interval = setInterval(loadChatSession, 4000); // 4s fallback poll

    try {
      socket = io(imageServer);
      api.startDirectChat(listingDetails.id).then((chat) => {
        socket.emit("join_room", chat.id);
      });

      socket.on("receive_message", () => {
        loadChatSession();
      });
    } catch (err) {
      console.error("Socket connect error:", err);
    }

    return () => {
      if (socket) socket.disconnect();
      clearInterval(interval);
    };
  }, [activeTab, user, listingDetails]);

  // Scroll inline chat to bottom
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const handleSendInlineMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !chatSession || chatSending) return;
    const text = chatInputText.trim();
    setChatInputText("");
    setChatSending(true);

    try {
      const newMsg = await api.sendChatMessage(chatSession.id, text);
      setChatMessages((prev) => [...prev, newMsg]);

      // Emit through Socket.IO
      const socket = io(imageServer);
      socket.emit("send_message", { inquiryId: chatSession.id, text });
      socket.disconnect();

      loadChatSession();
    } catch (err) {
      console.error("Send inline message error:", err);
    } finally {
      setChatSending(false);
    }
  };

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
            <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "var(--font-weight-bold)" }}>
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
                    <span className="price-discounted" style={{ fontSize: "var(--font-h1)" }}>
                      ₹{finalFrom}{finalTo ? ` - ₹${finalTo}` : ""}
                    </span>
                    <span className="price-original" style={{ fontSize: "var(--font-h4)" }}>
                      ₹{listingDetails.price}{listingDetails.priceMax ? ` - ₹${listingDetails.priceMax}` : ""}
                    </span>
                    <span className="card-badge" style={{ position: "static" }}>
                      {listingDetails.discountPercent}% OFF Announcement!
                    </span>
                  </>
                );
              })()
            ) : (
              <span className="price-discounted" style={{ fontSize: "var(--font-h1)" }}>
                ₹{listingDetails.price}{listingDetails.priceMax ? ` - ₹${listingDetails.priceMax}` : ""}
              </span>
            )}
          </div>

          {/* Segmented Tab Bar */}
          <div style={{
            display: "flex",
            background: "var(--bg-input)",
            border: "1px solid var(--border-glass)",
            borderRadius: "14px",
            padding: "4px",
            gap: "4px",
            marginBottom: "20px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <button
              onClick={() => setActiveTab("description")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                fontSize: "var(--font-helper)",
                fontWeight: "var(--font-weight-bold)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "description" ? "var(--primary)" : "transparent",
                color: activeTab === "description" ? "#ffffff" : "var(--text-muted)"
              }}
            >
              📄 Description
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                fontSize: "var(--font-helper)",
                fontWeight: "var(--font-weight-bold)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "chat" ? "var(--primary)" : "transparent",
                color: activeTab === "chat" ? "#ffffff" : "var(--text-muted)"
              }}
            >
              💬 Website Chat
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                fontSize: "var(--font-helper)",
                fontWeight: "var(--font-weight-bold)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "reviews" ? "var(--primary)" : "transparent",
                color: activeTab === "reviews" ? "#ffffff" : "var(--text-muted)"
              }}
            >
              ⭐ Reviews ({listingDetails.reviews?.length || 0})
            </button>
          </div>

          {/* Tab Content 1: Description & Seller Info */}
          {activeTab === "description" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="glass-panel" style={{ padding: "20px" }}>
                <h3 style={{ marginBottom: "12px", fontSize: "17px", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)" }}>Description</h3>
                <p className="detail-desc">{listingDetails.description}</p>
              </div>

              {/* Seller Information Card */}
              {listingDetails.seller?.sellerProfile && (
                <div className="glass-panel seller-info-card" style={{ padding: "20px" }}>
                  <h3 style={{ marginBottom: "12px", fontSize: "17px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "8px" }}>
                    Seller Information
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-main)" }}>
                        {listingDetails.seller.sellerProfile.displayName || listingDetails.seller.sellerProfile.fullName}
                      </h4>
                      {listingDetails.seller.sellerProfile.professionalTitle && (
                        <p style={{ fontSize: "var(--font-helper)", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                          {listingDetails.seller.sellerProfile.professionalTitle}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "var(--font-helper)", color: "var(--text-dim)" }}>
                      {listingDetails.seller.sellerProfile.yearsOfExperience !== undefined && listingDetails.seller.sellerProfile.yearsOfExperience !== null && (
                        <span>⭐ Experience: <strong>{listingDetails.seller.sellerProfile.yearsOfExperience} Years</strong></span>
                      )}
                      {listingDetails.seller.sellerProfile.businessCategory && (
                        <span>🏷️ Category: <strong>{listingDetails.seller.sellerProfile.businessCategory}</strong></span>
                      )}
                    </div>

                    {listingDetails.seller.sellerProfile.aboutSeller && (
                      <div style={{ fontSize: "var(--font-helper)", color: "var(--text-muted)", marginTop: "4px", lineHeight: "var(--line-height-normal)" }}>
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
                              fontSize: "var(--font-caption)",
                              fontWeight: "var(--font-weight-semibold)",
                              cursor: "pointer",
                              marginTop: "4px",
                            }}
                          >
                            {aboutExpanded ? "Read Less" : "Read More"}
                          </button>
                        ) : null}
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "var(--font-helper)", borderTop: "1px solid var(--border-glass)", paddingTop: "10px", marginTop: "4px" }}>
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

              {/* Contact and Call Buttons */}
              <div className="glass-panel contact-card">
                <h3 className="contact-title" style={{ fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-bold)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  📞 Call or WhatsApp Seller
                </h3>

                {(() => {
                  const sellerProfile = listingDetails.seller?.sellerProfile;
                  const showWhatsapp = sellerProfile ? sellerProfile.showWhatsapp !== false : true;
                  const showPhone = sellerProfile ? sellerProfile.showPhone !== false : true;

                  const displayWhatsApp = showWhatsapp ? (sellerProfile ? sellerProfile.whatsAppNumber : listingDetails.whatsappNumber) : null;
                  const displayCall = showPhone ? (sellerProfile ? sellerProfile.mobileNumber : listingDetails.contactNumber) : null;

                  return (
                    <div className="contact-methods" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {user ? (
                        <>
                          {displayWhatsApp && (
                            <a
                              href={`https://wa.me/${displayWhatsApp.replace(/[^0-9]/g, "")}?text=Hi, I am interested in your listing: "${encodeURIComponent(listingDetails.title)}"`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-whatsapp"
                              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                            >
                              💬 Open WhatsApp
                            </a>
                          )}

                          {displayCall && (
                            <a
                              href={`tel:${displayCall}`}
                              className="btn btn-secondary"
                              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                            >
                              📞 Call Owner
                            </a>
                          )}
                        </>
                      ) : (
                        (showWhatsapp || showPhone) && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => router.push("/login")}
                            style={{ width: "100%", fontSize: "var(--font-helper)" }}
                          >
                            🔒 Log in to view Phone / WhatsApp
                          </button>
                        )
                      )}

                      <button
                        className={`btn ${savedListings.includes(listingDetails.id) ? "btn-accent" : "btn-secondary"}`}
                        onClick={() => {
                          if (!user) {
                            router.push("/login");
                            return;
                          }
                          toggleBookmark(listingDetails.id);
                        }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        {savedListings.includes(listingDetails.id) ? "⭐ Shortlisted" : "☆ Save / Shortlist Product"}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tab Content 2: Direct Website Chat */}
          {activeTab === "chat" && (
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px", minHeight: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: 0 }}>
                    💬 Direct In-App Live Chat
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    Your contact details (phone, WhatsApp, email) are kept 100% private.
                  </p>
                </div>
                <span className="badge-id" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--emerald)", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "var(--font-weight-bold)" }}>
                  🟢 Connected
                </span>
              </div>

              {!user ? (
                <div style={{ textAlign: "center", padding: "40px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "var(--font-display-md)" }}>🔒</span>
                  <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", margin: 0 }}>
                    Please log in to start a secure chat with the seller.
                  </p>
                  <button className="btn btn-primary" onClick={() => router.push("/login")} style={{ padding: "10px 24px", borderRadius: "30px", fontSize: "var(--font-helper)" }}>
                    Log In / Register
                  </button>
                </div>
              ) : user.id === listingDetails.sellerId ? (
                <div style={{ textAlign: "center", padding: "40px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "var(--font-display-md)" }}>🏪</span>
                  <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", margin: 0 }}>
                    This is your own listing item.
                  </p>
                  <p style={{ fontSize: "var(--font-caption)", color: "var(--text-dim)", margin: 0, maxWidth: "340px" }}>
                    Go to your leads dashboard to reply to messages sent by potential buyers.
                  </p>
                  <Link href="/dashboard/leads" className="btn btn-secondary" style={{ padding: "10px 24px", borderRadius: "30px", fontSize: "var(--font-helper)", textDecoration: "none" }}>
                    Go to Leads Inbox
                  </Link>
                </div>
              ) : chatLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "10px", padding: "40px 0" }}>
                  <div className="spinner"></div>
                  <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted)" }}>Initializing live chat room...</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "350px" }}>
                  {/* Messages list */}
                  <div 
                    style={{ 
                      flex: 1, 
                      overflowY: "auto", 
                      padding: "8px 12px", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "10px", 
                      background: "rgba(0, 0, 0, 0.12)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "12px",
                      marginBottom: "12px"
                    }}
                  >
                    {chatMessages.length === 0 ? (
                      <div style={{ margin: "auto", textAlign: "center", color: "var(--text-dim)", padding: "20px" }}>
                        <span style={{ fontSize: "var(--font-h2)", display: "block", marginBottom: "8px" }}>👋</span>
                        <p style={{ fontSize: "var(--font-helper)", margin: 0, fontWeight: "var(--font-weight-semibold)" }}>No messages yet</p>
                        <p style={{ fontSize: "11px", margin: "4px 0 0 0" }}>Send a message to ask about price, availability or location.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div 
                            key={msg.id || i} 
                            style={{ 
                              alignSelf: isMe ? "flex-end" : "flex-start", 
                              maxWidth: "80%",
                              display: "flex",
                              flexDirection: "column"
                            }}
                          >
                            <div 
                              style={{ 
                                background: isMe ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(120, 120, 120, 0.15)",
                                color: "#ffffff",
                                padding: "8px 14px",
                                borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                                fontSize: "var(--font-helper)",
                                lineHeight: "1.4",
                                boxShadow: isMe ? "0 2px 8px rgba(99, 102, 241, 0.2)" : "none"
                              }}
                            >
                              {msg.text}
                            </div>
                            <span style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "3px", alignSelf: isMe ? "flex-end" : "flex-start" }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Send Input Panel */}
                  <form onSubmit={handleSendInlineMessage} style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      placeholder="Type your message about this item..." 
                      value={chatInputText} 
                      onChange={(e) => setChatInputText(e.target.value)} 
                      style={{ 
                        flex: 1, 
                        background: "var(--bg-input)", 
                        border: "1px solid var(--border-glass)", 
                        borderRadius: "10px", 
                        padding: "10px 14px", 
                        color: "var(--text-main)", 
                        fontSize: "var(--font-helper)" 
                      }} 
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={chatSending}
                      style={{ padding: "0 20px", borderRadius: "10px", fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-helper)" }}
                    >
                      {chatSending ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 3: Reviews & Star Ratings Grid */}
          {activeTab === "reviews" && (
            <section className="reviews-section" style={{ marginTop: 0 }}>
              <div className="reviews-header" style={{ marginBottom: "20px" }}>
                <h2>Product Reviews &amp; Ratings</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "var(--font-h4)", color: "#fbbf24" }}>★</span>
                  <span style={{ fontSize: "var(--font-h4)", fontWeight: "var(--font-weight-bold)" }}>
                    {listingDetails.averageRating || "N/A"}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    ({listingDetails.totalReviews} total reviews)
                  </span>
                </div>
              </div>

              {/* Add New Review Composer */}
              {user ? (
                <form onSubmit={submitReview} className="glass-panel" style={{ padding: "24px", marginBottom: "20px" }}>
                  <h3 style={{ marginBottom: "16px", fontSize: "var(--font-h5)" }}>Write a Review</h3>

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
                <div className="glass-panel" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", marginBottom: "20px" }}>
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
                    <div key={rev.id} className="glass-panel review-item" style={{ marginBottom: "12px" }}>
                      <div className="review-meta">
                        <span className="review-user">{rev.buyer?.username}</span>
                        <span className="review-stars">
                          {"★".repeat(rev.rating)}
                          {"☆".repeat(5 - rev.rating)}
                        </span>
                      </div>
                      <p className="review-comment">{rev.comment}</p>

                      {/* Media attachments */}
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
          )}
        </div>
      </div>

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
                    style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--font-small)", gap: "6px", height: "44px", padding: 0 }}
                  >
                    💬 WhatsApp
                  </a>
                )}
                {displayCall && (
                  <a
                    href={`tel:${displayCall}`}
                    className="btn btn-secondary"
                    style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--font-small)", gap: "6px", height: "44px", padding: 0 }}
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
              style={{ width: "100%", height: "44px", fontSize: "var(--font-small)", padding: 0 }}
            >
              🔑 Log In to Contact Seller
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
