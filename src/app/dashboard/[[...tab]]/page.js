"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import ProductCard from "@/components/ProductCard";

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();

  const {
    user,
    userLoading,
    categories,
    listings,
    savedListings,
    citiesList,
    setCitiesList,
    fetchListings,
    fetchSavedListings,
    mobileMenuOpen,
    setMobileMenuOpen,
    editingListing,
    setEditingListing,
    sellerInquiries,
    setSellerInquiries,
    buyerInquiries,
    setBuyerInquiries,
    replyTexts,
    setReplyTexts,
    activeInquiryId,
    setActiveInquiryId,
    sellerListings,
    setSellerListings,
    fetchInquiries,
    fetchSellerListings,
    detectUserLocation
  } = useApp();

  const activeTabParam = params.tab?.[0] || "";

  const [dashboardTab, setDashboardTab] = useState("my-listings");

  // Sync route param with state tab
  useEffect(() => {
    if (!user) return;
    if (activeTabParam) {
      setDashboardTab(activeTabParam);
    } else {
      // Default fallback tabs
      if (user.role === "SELLER") {
        setDashboardTab("my-listings");
        router.replace("/dashboard/my-listings");
      } else if (user.role === "BUYER") {
        setDashboardTab("inquiries");
        router.replace("/dashboard/inquiries");
      } else if (user.role === "ADMIN") {
        setDashboardTab("cities");
        router.replace("/dashboard/cities");
      }
    }
  }, [activeTabParam, user]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    if (!user) return;
    
    if (activeTabParam === "saved" || activeTabParam === "bookmarks") {
      fetchSavedListings();
      fetchListings();
    }

    if (user.role === "SELLER") {
      fetchSellerListings();
      fetchInquiries();
      if (activeTabParam === "profile" || dashboardTab === "profile") {
        try {
          const prof = await api.getProfile();
          setProfileForm({
            fullName: prof.fullName || "",
            displayName: prof.displayName || "",
            professionalTitle: prof.professionalTitle || "",
            yearsOfExperience: prof.yearsOfExperience !== null && prof.yearsOfExperience !== undefined ? String(prof.yearsOfExperience) : "",
            businessCategory: prof.businessCategory || "",
            aboutSeller: prof.aboutSeller || "",
            email: prof.email || "",
            mobileNumber: prof.mobileNumber || "",
            whatsAppNumber: prof.whatsAppNumber || ""
          });
        } catch (e) {
          console.error("Failed to load seller profile:", e);
        }
      }
    } else if (user.role === "BUYER") {
      fetchInquiries();
      fetchSavedListings();
      fetchListings(); // Load catalog items so bookmarks list renders titles/prices
    } else if (user.role === "ADMIN") {
      // Admin loads configured cities
      try {
        const data = await api.getCities();
        if (data) setCitiesList(data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadDashboardData();
  }, [user, dashboardTab]);

  // Focus-based Polling for leads and inquiries
  useEffect(() => {
    if (!user) return;
    const shouldPoll =
      (user.role === "SELLER" && dashboardTab === "leads") ||
      (user.role === "BUYER" && dashboardTab === "inquiries");

    if (!shouldPoll) return;

    const pollInterval = setInterval(() => {
      fetchInquiries();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [dashboardTab, user]);

  // Post Listing Form States
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPriceMax, setNewPriceMax] = useState("");
  const [newDiscount, setNewDiscount] = useState("0");
  const [newLocation, setNewLocation] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newListingType, setNewListingType] = useState("SALES");
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAddLocDropdown, setShowAddLocDropdown] = useState(false);
  const [addLocSuggestions, setAddLocSuggestions] = useState([]);

  // Seller Profile Tab state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    displayName: "",
    professionalTitle: "",
    yearsOfExperience: "",
    businessCategory: "",
    aboutSeller: "",
    email: "",
    mobileNumber: "",
    whatsAppNumber: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await api.updateProfile(profileForm);
      triggerToast("Seller Profile updated successfully!", "success");
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Auto detect listing coordinates
  const autoDetectListingLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const area = data.address.suburb || data.address.neighbourhood || data.address.road || "";
          const city = data.address.city || data.address.town || data.address.village || "";
          const state = data.address.state || "";
          const parts = [area, city, state].filter((p) => p && p.trim() !== "");
          const formatted = parts.join(", ");
          setNewLocation(formatted || "Hyderabad, Telangana");
        } catch (e) {
          console.error(e);
          setNewLocation("Hyderabad, Telangana");
        }
      });
    }
  };

  // Photon geocoding for add listing location field
  useEffect(() => {
    if (!newLocation || newLocation.length < 2) {
      setAddLocSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(newLocation)}&limit=8&bbox=68.1,6.8,97.4,35.5`
        );
        const data = await res.json();
        const suggestions = data.features.map((f) => {
          const props = f.properties;
          const name = props.name || "";
          const city = props.city || props.town || props.district || "";
          const state = props.state || "";
          const parts = [name, city, state].filter((p) => p && p.trim() !== "");
          return [...new Set(parts)].join(", ");
        }).filter(Boolean);
        setAddLocSuggestions([...new Set(suggestions)]);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [newLocation]);

  const triggerToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();

    if (!newCategory) {
      triggerToast("Please select a Category.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("description", newDesc);
    formData.append("price", newPrice);
    formData.append("priceMax", newPriceMax);
    formData.append("listingType", newListingType);
    formData.append("discountPercent", newDiscount || 0);
    formData.append("location", newLocation);
    formData.append("whatsappNumber", newWhatsapp);
    formData.append("contactNumber", newPhone);
    formData.append("categoryId", newCategory);
    if (newSubCategory) {
      formData.append("subCategoryId", newSubCategory);
    }

    for (let i = 0; i < newImageFiles.length; i++) {
      formData.append("image", newImageFiles[i]);
    }

    try {
      await api.createListing(formData);
      triggerToast("Pending and It will be reviewed by lowpriceplaces team shortly.", "success");
      setNewTitle("");
      setNewDesc("");
      setNewPrice("");
      setNewPriceMax("");
      setNewListingType("SALES");
      setNewDiscount("0");
      setNewLocation("");
      setNewWhatsapp("");
      setNewPhone("");
      setNewCategory("");
      setNewSubCategory("");
      setNewImageFiles([]);
      loadDashboardData();
    } catch (err) {
      triggerToast(err.message, "error");
    }
  };

  const updateListingStatus = async (id, status) => {
    try {
      await api.changeListingStatus(id, status);
      loadDashboardData();
      alert(`Listing marked as ${status.toLowerCase()}!`);
    } catch (e) {
      alert("Error updating status: " + e.message);
    }
  };

  // Chat inquiries methods
  const markAsRead = async (id) => {
    try {
      await api.replyToInquiry(id, ""); // Triggers read flag
      fetchInquiries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (inqId) => {
    const text = replyTexts[inqId] || "";
    if (!text.trim()) return;

    try {
      await api.replyToInquiry(inqId, text);
      setReplyTexts((prev) => ({ ...prev, [inqId]: "" }));
      fetchInquiries();
      // Scroll to bottom
      setTimeout(() => {
        const element = document.getElementById(`chat-messages-${inqId}`);
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      }, 100);
    } catch (e) {
      alert("Error sending message: " + e.message);
    }
  };

  // Admin Cities state
  const [cityNameInput, setCityNameInput] = useState("");
  const [cityEmojiInput, setCityEmojiInput] = useState("📍");
  const [adminCityError, setAdminCityError] = useState("");
  const [adminCitySuccess, setAdminCitySuccess] = useState("");

  const handleAddCity = async (e) => {
    e.preventDefault();
    setAdminCityError("");
    setAdminCitySuccess("");
    try {
      await api.addCity(cityNameInput, cityEmojiInput);
      setAdminCitySuccess(`City "${cityNameInput}" added successfully!`);
      setCityNameInput("");
      setCityEmojiInput("📍");
      loadDashboardData();
    } catch (e) {
      setAdminCityError(e.message);
    }
  };

  const handleDeleteCity = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteCity(id);
      loadDashboardData();
      alert(`Deleted ${name} city.`);
    } catch (e) {
      alert(e.message);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
        Authenticating dashboard session...
      </div>
    );
  }

  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";
  const isBookmarksTab = dashboardTab === "saved" || dashboardTab === "bookmarks";

  return (
    <div className={`dashboard-layout ${isBookmarksTab ? "full-width" : ""}`}>
      {/* Mobile Direct Navigation Tabs */}
      {!isBookmarksTab && (
        <div className="mobile-dashboard-tabs" style={{ display: "flex", marginBottom: "16px", gap: "8px", width: "100%", overflowX: "auto", paddingBottom: "4px" }}>
          {user.role === "SELLER" && (
            <>
              <button
                className={`mobile-tab-btn ${dashboardTab === "my-listings" ? "active" : ""}`}
                onClick={() => router.push("/dashboard/my-listings")}
              >
                📦 Listings
              </button>
              <button
                className={`mobile-tab-btn ${dashboardTab === "add-listing" ? "active" : ""}`}
                onClick={() => router.push("/dashboard/add-listing")}
              >
                ➕ Post
              </button>
              <button
                className={`mobile-tab-btn ${dashboardTab === "leads" ? "active" : ""}`}
                onClick={() => router.push("/dashboard/leads")}
              >
                💬 Messages ({sellerInquiries.length})
              </button>
              <button
                className={`mobile-tab-btn ${dashboardTab === "profile" ? "active" : ""}`}
                onClick={() => router.push("/dashboard/profile")}
              >
                👤 Profile
              </button>
            </>
          )}
          {user.role === "BUYER" && (
            <>
              <button
                className={`mobile-tab-btn ${dashboardTab === "inquiries" ? "active" : ""}`}
                onClick={() => router.push("/dashboard/inquiries")}
              >
                ✉️ Inquiries ({buyerInquiries.length})
              </button>
            </>
          )}
          {user.role === "ADMIN" && (
            <>
              <button
                className={`mobile-tab-btn ${dashboardTab === "cities" ? "active" : ""}`}
                onClick={() => router.push("/dashboard/cities")}
              >
                🌆 Cities
              </button>
            </>
          )}
        </div>
      )}

      {!isBookmarksTab && (
        <aside className="dashboard-sidebar">
          {user.role === "SELLER" && (
            <>
              <Link href="/dashboard/my-listings" className={`sidebar-tab ${dashboardTab === "my-listings" ? "active" : ""}`}>
                📦 My Listings
              </Link>
              <Link href="/dashboard/add-listing" className={`sidebar-tab ${dashboardTab === "add-listing" ? "active" : ""}`}>
                ➕ Post New Product
              </Link>
              <Link href="/dashboard/leads" className={`sidebar-tab ${dashboardTab === "leads" ? "active" : ""}`}>
                💬 Buyer Messages ({sellerInquiries.length})
              </Link>
              <Link href="/dashboard/profile" className={`sidebar-tab ${dashboardTab === "profile" ? "active" : ""}`}>
                👤 Seller Profile
              </Link>
            </>
          )}

          {user.role === "BUYER" && (
            <>
              <Link href="/dashboard/inquiries" className={`sidebar-tab ${dashboardTab === "inquiries" ? "active" : ""}`}>
                ✉️ Sent Message Inquiries ({buyerInquiries.length})
              </Link>
            </>
          )}

          {user.role === "ADMIN" && (
            <>
              <Link href="/dashboard/cities" className={`sidebar-tab ${dashboardTab === "cities" ? "active" : ""}`}>
                🌆 Manage Cities
              </Link>
            </>
          )}
        </aside>
      )}

      <section className="dashboard-content" style={isBookmarksTab ? { gridColumn: "span 2" } : {}}>
        {/* Tab: My Listings (Seller) */}
        {user.role === "SELLER" && dashboardTab === "my-listings" && (
          <div>
            <h2 style={{ marginBottom: "16px" }}>Manage Listings</h2>
            <div className="products-grid">
              {sellerListings.map((item) => {
                const photos = item.imagePath ? item.imagePath.split(",") : [];
                const coverImage = photos[0] || "";
                const hasDiscount = item.discountPercent > 0;
                const priceFrom = item.price;
                const finalPriceFrom = hasDiscount
                  ? (priceFrom * (1 - item.discountPercent / 100)).toFixed(0)
                  : priceFrom;

                const priceTo = item.priceMax;
                const finalPriceTo = priceTo && hasDiscount
                  ? (priceTo * (1 - item.discountPercent / 100)).toFixed(0)
                  : priceTo;

                return (
                  <div
                    key={item.id}
                    className="glass-panel product-card dashboard-card"
                    onClick={(e) => {
                      if (!e.target.closest("button")) {
                        router.push(`/details/${item.id}`);
                      }
                    }}
                    style={{ minHeight: "380px", height: "auto", cursor: "pointer", display: "flex", flexDirection: "column" }}
                  >
                    <div className="dashboard-card-main-row" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                      <div className="card-image-wrapper" style={{ height: "160px", position: "relative" }}>
                        {hasDiscount && (
                          <div className="card-badge" style={{ zIndex: 3 }}>-{item.discountPercent}% OFF</div>
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
                      <div className="card-content" style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <h3 style={{ fontSize: "15px", marginBottom: "4px" }}>{item.title}</h3>
                        <p className="card-desc" style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {item.description}
                        </p>
                        <div className="card-prices" style={{ marginBottom: "8px" }}>
                          {hasDiscount ? (
                            <>
                              <span className="price-discounted" style={{ fontSize: "15px", fontWeight: "700" }}>
                                ₹{finalPriceFrom}{finalPriceTo ? ` - ₹${finalPriceTo}` : ""}
                              </span>
                              <span className="price-original" style={{ fontSize: "11px", textDecoration: "line-through", color: "var(--text-dim)", marginLeft: "6px" }}>
                                ₹{priceFrom}{priceTo ? ` - ₹${priceTo}` : ""}
                              </span>
                            </>
                          ) : (
                            <span className="price-discounted" style={{ fontSize: "15px", fontWeight: "700" }}>
                              ₹{priceFrom}{priceTo ? ` - ₹${priceTo}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-card-footer" style={{ padding: "0 12px 12px 12px", display: "flex", flexDirection: "column", marginTop: "auto" }}>
                      {item.status === "REJECTED" && item.rejectReason && (
                        <div style={{ fontSize: "11px", color: "#f43f5e", background: "rgba(244, 63, 94, 0.05)", padding: "6px", borderRadius: "4px", borderLeft: "2px solid #f43f5e", marginBottom: "8px" }}>
                          ❌ <strong>Reason:</strong> {item.rejectReason}
                        </div>
                      )}
                      <div className="dashboard-card-badges" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <span className="badge-id" style={{ padding: "4px 8px", fontSize: "11px", background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", borderRadius: "4px", fontWeight: "700" }}>
                          LPP-{String(item.id).padStart(5, "0")}
                        </span>
                        <span className="alert-banner" style={{ padding: "4px 8px", fontSize: "11px", margin: 0, background: item.status === "ACTIVE" ? "var(--emerald-glow)" : (item.status === "REJECTED" ? "rgba(244, 63, 94, 0.15)" : (item.status === "INACTIVE" ? "rgba(156, 163, 175, 0.1)" : "rgba(245, 158, 11, 0.1)")), color: item.status === "ACTIVE" ? "var(--emerald)" : (item.status === "REJECTED" ? "#f43f5e" : (item.status === "INACTIVE" ? "#9ca3af" : "#fbbf24")), border: "1px solid rgba(255,255,255,0.05)" }}>
                          {item.status}
                        </span>
                      </div>
                      <div className="dashboard-card-actions" style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingBottom: "8px" }}>
                        {item.status === "ACTIVE" && (
                          <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => updateListingStatus(item.id, "SOLD")}>
                            Mark Sold
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditingListing(item)}>
                          Edit
                        </button>
                        <button className="btn btn-accent" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={async () => { if (confirm(`Delete listing LPP-${String(item.id).padStart(5, "0")}?`)) { await api.deleteListing(item.id); fetchSellerListings(); } }}>
                          Delete
                        </button>
                      </div>
                      <div className="dashboard-card-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-dim)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px", gap: "8px" }}>
                        <span>📍 {item.location}</span>
                        <span>📅 {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Post New Listing (Seller) */}
        {user.role === "SELLER" && dashboardTab === "add-listing" && (
          <div className="glass-panel form-card">
            <h2 className="form-title">Advertise New Product Listing</h2>

            <form onSubmit={handleCreateListing} className="form-grid">
              <div className="form-group full-width" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Product Title / Heading</label>
                <input type="text" className="form-input" placeholder="e.g. Brand New Sony PlayStation 5 console" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Listing Type</label>
                <select
                  className="form-select"
                  value={newListingType}
                  onChange={(e) => setNewListingType(e.target.value)}
                  required
                >
                  <option value="SALES">🛍️ Sales (New products)</option>
                  <option value="SERVICES">💼 Work & Services</option>
                  <option value="SECONDHAND">♻️ Second-Hand (Used items)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Root Category</label>
                <select
                  className="form-select"
                  value={newCategory}
                  onChange={(e) => { setNewCategory(e.target.value); setNewSubCategory(""); }}
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sub-Category</label>
                <select
                  className="form-select"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  disabled={!newCategory}
                >
                  <option value="">-- Choose Subcategory (Optional) --</option>
                  {categories.find((c) => c.id === parseInt(newCategory))?.subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price Range (₹ INR)</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="From (e.g. 499)"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>to</span>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="To (e.g. 999)"
                    value={newPriceMax}
                    onChange={(e) => setNewPriceMax(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Announce Discount (%)</label>
                <input type="number" min="0" max="95" className="form-input" placeholder="e.g. 10 (Set 0 for none)" value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)} />
              </div>

              <div className="form-group" style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Location (Area, City, State)</label>
                  <span
                    onClick={autoDetectListingLocation}
                    style={{ fontSize: "12px", color: "var(--primary)", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}
                    title="Click to automatically detect your current location"
                  >
                    📍 Detect My Location
                  </span>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Madhapur, Hyderabad, Telangana"
                  value={newLocation}
                  onChange={(e) => {
                    setNewLocation(e.target.value);
                    setShowAddLocDropdown(true);
                  }}
                  onFocus={() => setShowAddLocDropdown(true)}
                  required
                />
                {showAddLocDropdown && addLocSuggestions.length > 0 && (
                  <div className="location-dropdown" style={{ width: "100%", top: "calc(100% - 2px)" }}>
                    {addLocSuggestions.map((loc, i) => (
                      <div
                        key={i}
                        className="location-dropdown-item"
                        onClick={() => {
                          setNewLocation(loc);
                          setShowAddLocDropdown(false);
                        }}
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Upload Product Images (Max 10)</label>
                <input type="file" accept="image/*" multiple className="form-input" onChange={(e) => setNewImageFiles(e.target.files)} />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Contact Number (For redirection)</label>
                <input type="text" className="form-input" placeholder="e.g. 919876543210" value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Normal Phone Call Contact</label>
                <input type="text" className="form-input" placeholder="e.g. 919876543210" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
              </div>

              <div className="form-group full-width" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Product Detailed Description</label>
                <textarea className="form-textarea" placeholder="Describe specifications, parameters, usage history..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required></textarea>
              </div>

              <button type="submit" className="btn btn-primary full-width" style={{ gridColumn: "span 2" }}>
                Publish Advertising Listing
              </button>
            </form>
          </div>
        )}

        {/* Tab: Leads Inbox (Seller) */}
        {user.role === "SELLER" && dashboardTab === "leads" && (
          <div>
            <h2 style={{ marginBottom: "16px" }}>Buyer Inquiries & Leads Inbox</h2>
            {sellerInquiries.length === 0 ? (
              <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                No inquiries sent by buyers yet. Keep advertising!
              </div>
            ) : (
              <div className={`chat-split-container ${activeInquiryId ? "has-active-chat" : ""}`} style={{ display: "flex", gap: "20px", height: "550px", background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: "16px", overflow: "hidden" }}>
                <div className="chat-sidebar" style={{ width: "320px", borderRight: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.1)" }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid var(--border-glass)", fontWeight: "600", color: "var(--text-main)" }}>Conversations</div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {sellerInquiries.map((inq) => {
                      const isActive = activeInquiryId === inq.id;
                      const lastMsg = inq.messages?.[inq.messages.length - 1];
                      const isUnread = lastMsg && lastMsg.senderId !== user.id && inq.status !== "READ";
                      return (
                        <div
                          key={inq.id}
                          onClick={() => {
                            setActiveInquiryId(inq.id);
                            markAsRead(inq.id);
                          }}
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            cursor: "pointer",
                            background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                            transition: "var(--transition)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: isActive ? "linear-gradient(135deg, #6366f1, #ec4899)" : "linear-gradient(135deg, #374151, #4b5563)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "14px",
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}>
                            {inq.buyer?.username ? inq.buyer.username.charAt(0) : "U"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "13.5px", fontWeight: isUnread ? "700" : "600", color: isUnread ? "var(--text-main)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {inq.buyer?.username?.split("@")[0]}
                              </span>
                              {(() => {
                                const unreadCount = (() => {
                                  if (inq.status === "READ") return 0;
                                  const msgs = inq.messages || [];
                                  let lastMyMsgIndex = -1;
                                  for (let i = msgs.length - 1; i >= 0; i--) {
                                    if (msgs[i].senderId === user.id) {
                                      lastMyMsgIndex = i;
                                      break;
                                    }
                                  }
                                  let count = 0;
                                  for (let i = lastMyMsgIndex + 1; i < msgs.length; i++) {
                                    if (msgs[i].senderId !== user.id) {
                                      count++;
                                    }
                                  }
                                  return count;
                                })();

                                if (unreadCount > 0) {
                                  return (
                                    <span style={{
                                      background: "#ef4444",
                                      color: "#ffffff",
                                      borderRadius: "10px",
                                      padding: "2px 6px",
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      minWidth: "18px",
                                      textAlign: "center",
                                      display: "inline-block",
                                      lineHeight: "1.2",
                                      flexShrink: 0,
                                    }}>
                                      {unreadCount}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "1px 4px", borderRadius: "3px", fontSize: "9.5px", fontWeight: "700", flexShrink: 0 }}>
                                LPP-{String(inq.listing?.id || inq.listingId).padStart(5, "0")}
                              </span>
                              <span>{inq.listing?.title}</span>
                            </div>
                            {lastMsg && (
                              <div style={{ fontSize: "12px", color: isUnread ? "var(--text-main)" : "var(--text-dim)", fontStyle: isUnread ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                                {lastMsg.text}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="chat-window" style={{ flex: 1, display: "flex", flexDirection: "column", background: "transparent" }}>
                  {(() => {
                    const activeInq = sellerInquiries.find((i) => i.id === activeInquiryId);
                    if (!activeInq) {
                      return (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", gap: "12px" }}>
                          <span style={{ fontSize: "48px" }}>💬</span>
                          <div style={{ fontSize: "15px" }}>Select a conversation to start chatting</div>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.05)" }}>
                          <button
                            className="chat-back-btn"
                            onClick={() => setActiveInquiryId(null)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--primary)",
                              fontSize: "14px",
                              fontWeight: "600",
                              cursor: "pointer",
                              padding: "4px 8px 4px 0",
                              display: "none",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            ⬅ Back
                          </button>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "15px" }}>{activeInq.buyer?.username?.split("@")[0]}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span>Listing:</span>
                              <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "2px 5px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700" }}>
                                LPP-{String(activeInq.listing?.id || activeInq.listingId).padStart(5, "0")}
                              </span>
                              <strong>{activeInq.listing?.title}</strong> (₹{activeInq.listing?.price})
                            </div>
                          </div>
                        </div>

                        <div
                          id={`chat-messages-${activeInq.id}`}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            padding: "20px",
                            overflowY: "auto",
                            background: "rgba(0,0,0,0.1)",
                          }}
                        >
                          {activeInq.messages?.map((msg) => {
                            const isMe = msg.senderId === user.id;
                            const hasDoubleTicks = activeInq.status === "READ" || activeInq.status === "REPLIED";
                            return (
                              <div key={msg.id} style={{
                                display: "flex",
                                flexDirection: "column",
                                alignSelf: isMe ? "flex-end" : "flex-start",
                                maxWidth: "75%",
                              }}>
                                <div style={{
                                  background: isMe ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(120, 120, 120, 0.12)",
                                  color: isMe ? "#ffffff" : "var(--text-main)",
                                  border: isMe ? "none" : "1px solid var(--border-glass)",
                                  padding: "10px 14px",
                                  borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                                  fontSize: "13.5px",
                                  lineHeight: "1.4",
                                  boxShadow: isMe ? "0 2px 8px rgba(99, 102, 241, 0.2)" : "none",
                                }}>
                                  {msg.text}
                                </div>
                                <span style={{
                                  fontSize: "10px",
                                  color: "var(--text-dim)",
                                  marginTop: "4px",
                                  alignSelf: isMe ? "flex-end" : "flex-start",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  {isMe && (
                                    <span style={{ color: hasDoubleTicks ? "#3b82f6" : "var(--text-dim)", fontWeight: "bold" }}>
                                      {hasDoubleTicks ? "✓✓" : "✓"}
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.05)" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              type="text"
                              className="reply-input"
                              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "10px 14px", color: "var(--text-main)", fontSize: "13.5px" }}
                              placeholder="Type a message..."
                              value={replyTexts[activeInq.id] || ""}
                              onChange={(e) => setReplyTexts((prev) => ({ ...prev, [activeInq.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSendMessage(activeInq.id);
                                }
                              }}
                            />
                            <button
                              className="btn btn-primary"
                              style={{ padding: "0 20px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                              onClick={() => handleSendMessage(activeInq.id)}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Sent Inquiries (Buyer) */}
        {user.role === "BUYER" && dashboardTab === "inquiries" && (
          <div>
            <h2 style={{ marginBottom: "16px" }}>Sent Message History</h2>
            {buyerInquiries.length === 0 ? (
              <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                You haven't sent any messages to sellers yet.
              </div>
            ) : (
              <div className="chat-split-container" style={{ display: "flex", gap: "20px", height: "550px", background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: "16px", overflow: "hidden" }}>
                <div className="chat-sidebar" style={{ width: "320px", borderRight: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.1)" }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid var(--border-glass)", fontWeight: "600", color: "var(--text-main)" }}>Conversations</div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {buyerInquiries.map((inq) => {
                      const isActive = activeInquiryId === inq.id;
                      const lastMsg = inq.messages?.[inq.messages.length - 1];
                      const isUnread = lastMsg && lastMsg.senderId !== user.id && inq.status !== "READ";
                      return (
                        <div
                          key={inq.id}
                          onClick={() => {
                            setActiveInquiryId(inq.id);
                            markAsRead(inq.id);
                          }}
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            cursor: "pointer",
                            background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                            transition: "var(--transition)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: isActive ? "linear-gradient(135deg, #6366f1, #ec4899)" : "linear-gradient(135deg, #374151, #4b5563)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "14px",
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}>
                            {inq.listing?.seller?.username ? inq.listing.seller.username.charAt(0) : "S"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "13.5px", fontWeight: isUnread ? "700" : "600", color: isUnread ? "var(--text-main)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {inq.listing?.seller?.username?.split("@")[0]}
                              </span>
                              {(() => {
                                const unreadCount = (() => {
                                  if (inq.status === "READ") return 0;
                                  const msgs = inq.messages || [];
                                  let lastMyMsgIndex = -1;
                                  for (let i = msgs.length - 1; i >= 0; i--) {
                                    if (msgs[i].senderId === user.id) {
                                      lastMyMsgIndex = i;
                                      break;
                                    }
                                  }
                                  let count = 0;
                                  for (let i = lastMyMsgIndex + 1; i < msgs.length; i++) {
                                    if (msgs[i].senderId !== user.id) {
                                      count++;
                                    }
                                  }
                                  return count;
                                })();

                                if (unreadCount > 0) {
                                  return (
                                    <span style={{
                                      background: "#ef4444",
                                      color: "#ffffff",
                                      borderRadius: "10px",
                                      padding: "2px 6px",
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      minWidth: "18px",
                                      textAlign: "center",
                                      display: "inline-block",
                                      lineHeight: "1.2",
                                      flexShrink: 0,
                                    }}>
                                      {unreadCount}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "1px 4px", borderRadius: "3px", fontSize: "9.5px", fontWeight: "700", flexShrink: 0 }}>
                                LPP-{String(inq.listing?.id || inq.listingId).padStart(5, "0")}
                              </span>
                              <span>{inq.listing?.title}</span>
                            </div>
                            {lastMsg && (
                              <div style={{ fontSize: "12px", color: isUnread ? "var(--text-main)" : "var(--text-dim)", fontStyle: isUnread ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                                {lastMsg.text}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="chat-window" style={{ flex: 1, display: "flex", flexDirection: "column", background: "transparent" }}>
                  {(() => {
                    const activeInq = buyerInquiries.find((i) => i.id === activeInquiryId);
                    if (!activeInq) {
                      return (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", gap: "12px" }}>
                          <span style={{ fontSize: "48px" }}>💬</span>
                          <div style={{ fontSize: "15px" }}>Select a conversation to start chatting</div>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.05)" }}>
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "15px" }}>Seller: {activeInq.listing?.seller?.username}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span>Listing:</span>
                              <span className="badge-id" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "2px 5px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700" }}>
                                LPP-{String(activeInq.listing?.id || activeInq.listingId).padStart(5, "0")}
                              </span>
                              <strong>{activeInq.listing?.title}</strong>
                            </div>
                          </div>
                        </div>

                        <div
                          id={`chat-messages-${activeInq.id}`}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            padding: "20px",
                            overflowY: "auto",
                            background: "rgba(0,0,0,0.1)",
                          }}
                        >
                          {activeInq.messages?.map((msg) => {
                            const isMe = msg.senderId === user.id;
                            const hasDoubleTicks = activeInq.status === "READ" || activeInq.status === "REPLIED";
                            return (
                              <div key={msg.id} style={{
                                display: "flex",
                                flexDirection: "column",
                                alignSelf: isMe ? "flex-end" : "flex-start",
                                maxWidth: "75%",
                              }}>
                                <div style={{
                                  background: isMe ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(120, 120, 120, 0.12)",
                                  color: isMe ? "#ffffff" : "var(--text-main)",
                                  border: isMe ? "none" : "1px solid var(--border-glass)",
                                  padding: "10px 14px",
                                  borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                                  fontSize: "13.5px",
                                  lineHeight: "1.4",
                                  boxShadow: isMe ? "0 2px 8px rgba(99, 102, 241, 0.2)" : "none",
                                }}>
                                  {msg.text}
                                </div>
                                <span style={{
                                  fontSize: "10px",
                                  color: "var(--text-dim)",
                                  marginTop: "4px",
                                  alignSelf: isMe ? "flex-end" : "flex-start",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  {isMe && (
                                    <span style={{ color: hasDoubleTicks ? "#3b82f6" : "var(--text-dim)", fontWeight: "bold" }}>
                                      {hasDoubleTicks ? "✓✓" : "✓"}
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.05)" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              type="text"
                              className="reply-input"
                              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "10px 14px", color: "var(--text-main)", fontSize: "13.5px" }}
                              placeholder="Type a message..."
                              value={replyTexts[activeInq.id] || ""}
                              onChange={(e) => setReplyTexts((prev) => ({ ...prev, [activeInq.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSendMessage(activeInq.id);
                                }
                              }}
                            />
                            <button
                              className="btn btn-primary"
                              style={{ padding: "0 20px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                              onClick={() => handleSendMessage(activeInq.id)}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Saved Bookmarks (All Roles) */}
        {(dashboardTab === "saved" || dashboardTab === "bookmarks") && (
          <div>
            <h2 style={{ marginBottom: "16px" }}>Shortlisted Products</h2>
            {savedListings.length === 0 ? (
              <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                No shortlisted products saved yet. Explore products and click the heart icon on any listing card to add.
              </div>
            ) : (
              <div className="products-grid">
                {listings.filter((l) => savedListings.includes(l.id)).map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Cities Management (Admin) */}
        {user.role === "ADMIN" && dashboardTab === "cities" && (
          <div>
            <h2 style={{ marginBottom: "16px" }}>Manage Cities & Icons</h2>
            {adminCitySuccess && <div className="alert-banner alert-success" style={{ marginBottom: "16px" }}>{adminCitySuccess}</div>}
            {adminCityError && <div className="alert-banner alert-error" style={{ marginBottom: "16px" }}>{adminCityError}</div>}

            <div className="glass-panel form-card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Add New City</h3>

              <form onSubmit={handleAddCity} style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: 2, minWidth: "200px", marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: "12px" }}>City Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bhopal"
                    value={cityNameInput}
                    onChange={(e) => setCityNameInput(e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: "100px", marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: "12px" }}>Choose Icon / Emoji</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 🕌"
                    value={cityEmojiInput}
                    onChange={(e) => setCityEmojiInput(e.target.value)}
                    required
                    style={{ width: "100%", textAlign: "center", fontSize: "18px" }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: "42px", padding: "0 24px" }}>
                  ➕ Add City
                </button>
              </form>
            </div>

            <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Configured Cities</h3>
            <div className="glass-panel" style={{ padding: "20px" }}>
              {citiesList.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No cities configured yet.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                  {citiesList.map((city) => (
                    <div
                      key={city.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "12px",
                        transition: "transform 0.2s ease, background-color 0.2s ease",
                      }}
                      className="city-manage-card"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>{city.emoji}</span>
                        <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-main)" }}>{city.name}</span>
                      </div>
                      <button
                        className="btn btn-accent"
                        style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px" }}
                        onClick={() => handleDeleteCity(city.id, city.name)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Seller Profile (Seller) */}
        {user.role === "SELLER" && dashboardTab === "profile" && (
          <div>
            <h2 style={{ marginBottom: "16px" }}>Seller Profile</h2>
            <div className="glass-panel form-card" style={{ padding: "24px" }}>
              <form onSubmit={handleSaveProfile}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. John Doe"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Display Name / Shop Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Luxe Deals Shop"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Professional Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Premium Certified Dealer"
                      value={profileForm.professionalTitle}
                      onChange={(e) => setProfileForm({ ...profileForm, professionalTitle: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5"
                      value={profileForm.yearsOfExperience}
                      onChange={(e) => setProfileForm({ ...profileForm, yearsOfExperience: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Business Category</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Electronics & Gadgets"
                      value={profileForm.businessCategory}
                      onChange={(e) => setProfileForm({ ...profileForm, businessCategory: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. contact@luxedeals.com"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={profileForm.mobileNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp Number (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={profileForm.whatsAppNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsAppNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "20px", marginBottom: "0" }}>
                  <label className="form-label">About Seller</label>
                  <textarea
                    className="form-input"
                    placeholder="Describe your services, business, or shop..."
                    rows={4}
                    value={profileForm.aboutSeller}
                    onChange={(e) => setProfileForm({ ...profileForm, aboutSeller: e.target.value })}
                    required
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: "20px" }} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "💾 Save Profile"}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(8px)',
            fontWeight: '600',
            fontSize: '14px',
            maxWidth: '350px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease'
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              opacity: 0.7,
              marginLeft: '10px',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
