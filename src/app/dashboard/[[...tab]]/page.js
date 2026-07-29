"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import ProductCard from "@/components/ProductCard";
import MultiUploadComponent from "@/components/MultiUploadComponent";
import UploadComponent from "@/components/UploadComponent";
import { io } from "socket.io-client";

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
    detectUserLocation,
  } = useApp();

  const [shortlistedProducts, setShortlistedProducts] = useState([]);
  const [loadingShortlist, setLoadingShortlist] = useState(false);

  const activeTabParam = params.tab?.[0] || "";

  // Dynamic active tab — initialized from URL param or defaults to "profile"
  const [dashboardTab, setDashboardTab] = useState(activeTabParam || "profile");
  const [inboxSubTab, setInboxSubTab] = useState("received");

  const [dashboardMessages, setDashboardMessages] = useState([]);
  const [loadingDashboardMessages, setLoadingDashboardMessages] =
    useState(false);
  const imageServer =
    process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  // Fetch message history for active dashboard chat
  useEffect(() => {
    if (!user || !activeInquiryId) {
      setDashboardMessages([]);
      return;
    }

    let isMounted = true;
    async function loadMessages() {
      setLoadingDashboardMessages(true);
      try {
        const data = await api.getInquiryMessages(activeInquiryId);
        if (isMounted) {
          setDashboardMessages(data);
          // Mark as read
          await api.markInquiryRead(activeInquiryId);
          fetchInquiries();
        }
      } catch (err) {
        console.error("Failed to load messages in dashboard:", err);
      } finally {
        if (isMounted) {
          setLoadingDashboardMessages(false);
        }
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeInquiryId, user]);

  // Socket.IO real-time listener for active dashboard chat
  useEffect(() => {
    if (!user || !activeInquiryId) return;

    const socket = io(imageServer);
    socket.emit("join_room", activeInquiryId);

    socket.on("receive_message", (newMessage) => {
      fetchInquiries();
      if (newMessage && newMessage.inquiryId === activeInquiryId) {
        setDashboardMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, activeInquiryId]);

  // Scroll active chat messages to bottom
  useEffect(() => {
    if (activeInquiryId) {
      const element = document.getElementById(
        `chat-messages-${activeInquiryId}`,
      );
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }
  }, [dashboardMessages, activeInquiryId]);

  // Sync route param with state tab
  useEffect(() => {
    if (!user) return;
    if (activeTabParam) {
      setDashboardTab(activeTabParam);
    } else {
      setDashboardTab("profile");
    }
  }, [activeTabParam, user]);

  // Load Dashboard Data (Profile & Bookmarks focus)
  const loadDashboardData = async () => {
    if (!user) return;
    try {
      fetchSavedListings();
      fetchListings();
      fetchSellerListings();
      fetchInquiries();
      const prof = await api.getProfile();
      if (prof) {
        setProfileForm({
          fullName: prof.fullName || user.username?.split("@")[0] || "",
          displayName: prof.displayName || user.username?.split("@")[0] || "",
          professionalTitle: prof.professionalTitle || "",
          yearsOfExperience:
            prof.yearsOfExperience !== null &&
            prof.yearsOfExperience !== undefined
              ? String(prof.yearsOfExperience)
              : "",
          businessCategory: prof.businessCategory || "",
          businessType: prof.businessType || "",
          aboutSeller: prof.aboutSeller || "",
          email: prof.email || user.email || user.username || "",
          mobileNumber: prof.mobileNumber || "",
          whatsAppNumber: prof.whatsAppNumber || "",
          showWhatsapp: prof.showWhatsapp !== false,
          showPhone: prof.showPhone !== false,
          allowChat: prof.allowChat !== false,
          location: prof.location || "",
          latitude:
            prof.latitude !== null && prof.latitude !== undefined
              ? String(prof.latitude)
              : "",
          longitude:
            prof.longitude !== null && prof.longitude !== undefined
              ? String(prof.longitude)
              : "",
          imagePath: prof.imagePath || "",
        });
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadDashboardData();
  }, [user, dashboardTab]);

  // Shortlist products fetch & auto-syncing
  useEffect(() => {
    if (dashboardTab === "bookmarks" || dashboardTab === "saved") {
      const loadShortlist = async () => {
        if (!savedListings || savedListings.length === 0) {
          setShortlistedProducts([]);
          return;
        }
        setLoadingShortlist(true);
        try {
          const data = await api.getListings({ ids: savedListings.join(','), status: 'ALL' });
          setShortlistedProducts(data || []);
          
          // Prune/Sync deleted bookmarked listings
          const activeIds = (data || []).map(item => Number(item.id));
          const synced = savedListings.filter(id => activeIds.includes(Number(id)));
          if (synced.length !== savedListings.length) {
            fetchSavedListings();
          }
        } catch (e) {
          console.error("Error loading shortlist products:", e);
        } finally {
          setLoadingShortlist(false);
        }
      };
      loadShortlist();
    }
  }, [dashboardTab, savedListings]);

  // Focus-based Polling for leads and inquiries
  useEffect(() => {
    if (!user) return;
    const shouldPoll =
      dashboardTab === "leads" ||
      dashboardTab === "inquiries" ||
      dashboardTab === "messages";

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
    businessType: "",
    aboutSeller: "",
    email: "",
    mobileNumber: "",
    whatsAppNumber: "",
    location: "",
    latitude: "",
    longitude: "",
    imagePath: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileLogoFile, setProfileLogoFile] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const payload = {};
      Object.keys(profileForm).forEach((key) => {
        if (profileForm[key] !== null && profileForm[key] !== undefined) {
          payload[key] = profileForm[key];
        }
      });

      const updatedProfile = await api.updateProfile(payload);
      setProfileForm((prev) => ({
        ...prev,
        ...updatedProfile,
        yearsOfExperience:
          updatedProfile.yearsOfExperience !== null
            ? String(updatedProfile.yearsOfExperience)
            : "",
        latitude:
          updatedProfile.latitude !== null
            ? String(updatedProfile.latitude)
            : "",
        longitude:
          updatedProfile.longitude !== null
            ? String(updatedProfile.longitude)
            : "",
      }));
      setProfileLogoFile(null);
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
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await res.json();
          const area =
            data.address.suburb ||
            data.address.neighbourhood ||
            data.address.road ||
            "";
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "";
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
          `https://photon.komoot.io/api/?q=${encodeURIComponent(newLocation)}&limit=8&bbox=68.1,6.8,97.4,35.5`,
        );
        const data = await res.json();
        const suggestions = data.features
          .map((f) => {
            const props = f.properties;
            const name = props.name || "";
            const city = props.city || props.town || props.district || "";
            const state = props.state || "";
            const parts = [name, city, state].filter(
              (p) => p && p.trim() !== "",
            );
            return [...new Set(parts)].join(", ");
          })
          .filter(Boolean);
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

    const payload = {
      title: newTitle,
      description: newDesc,
      price: newPrice,
      priceMax: newPriceMax || "",
      listingType: newListingType,
      discountPercent: newDiscount || 0,
      location: newLocation,
      whatsappNumber: newWhatsapp,
      contactNumber: newPhone,
      categoryId: newCategory,
      subCategoryId: newSubCategory || null,
      imageUrls: newImageFiles && newImageFiles.length > 0 ? newImageFiles.join(",") : null,
    };

    try {
      await api.createListing(payload);
      triggerToast(
        "Pending and It will be reviewed by lowpriceplaces team shortly.",
        "success",
      );
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
      await api.markInquiryRead(id);
      fetchInquiries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (inqId) => {
    const text = replyTexts[inqId] || "";
    if (!text.trim()) return;

    try {
      const newMsg = await api.replyToInquiry(inqId, text);
      setDashboardMessages((prev) => [...prev, newMsg]);
      setReplyTexts((prev) => ({ ...prev, [inqId]: "" }));
      fetchInquiries();
    } catch (e) {
      alert("Error sending message: " + e.message);
    }
  };

  // Helper: Get message file/media type icon
  const getMessageTypeIcon = (text = "") => {
    const lower = text.toLowerCase().trim();
    if (
      lower.match(/\.(jpeg|jpg|gif|png|webp)/) ||
      lower.includes("[image]") ||
      lower.includes("[photo]")
    ) {
      return "📷 ";
    }
    if (
      lower.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)/) ||
      lower.includes("[pdf]") ||
      lower.includes("[document]")
    ) {
      return "📄 ";
    }
    if (lower.match(/\.(mp4|mov|avi|mkv|webm)/) || lower.includes("[video]")) {
      return "🎥 ";
    }
    if (
      lower.match(/\.(mp3|wav|ogg|m4a|aac)/) ||
      lower.includes("[audio]") ||
      lower.includes("[voice]")
    ) {
      return "🎵 ";
    }
    return null;
  };

  // Helper: Format message time like WhatsApp
  const formatMsgTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Helper: Get Chat Metadata (name, phone, online)
  const getChatMetadata = (inq) => {
    const isSeller = inq.buyerId !== user?.id;
    const displayName = isSeller
      ? inq.buyer?.username?.split("@")[0] || inq.buyer?.phoneNumber || "Buyer"
      : inq.listing?.seller?.username?.split("@")[0] ||
        inq.listing?.seller?.phoneNumber ||
        "Seller";

    const phoneNumber = isSeller
      ? inq.buyer?.phoneNumber || inq.buyer?.whatsappNumber || ""
      : inq.listing?.seller?.phoneNumber ||
        inq.listing?.seller?.whatsappNumber ||
        "";

    const isOnline = isSeller
      ? inq.buyerId % 3 !== 0
      : inq.listing?.sellerId % 3 !== 0;

    return { displayName, phoneNumber, isOnline };
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
      <div
        style={{
          textAlign: "center",
          padding: "80px 0",
          color: "var(--text-muted)",
        }}
      >
        Authenticating dashboard session...
      </div>
    );
  }
  // Use URL param directly — available immediately, no render-cycle delay
  const activeTab = activeTabParam || dashboardTab;
  const isBookmarksTab = activeTab === "saved" || activeTab === "bookmarks";
  const isChatTab = activeTab === "leads" || activeTab === "inquiries";
  const isProfileTab =
    activeTab === "profile" ||
    (!isBookmarksTab && !isChatTab && activeTab !== "cities");

  return (
    <>
      {/* Stats Summary Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: "20px 24px",
            borderRadius: "16px",
            border: "1px solid var(--border-glass)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-h3)",
            }}
          >
            📦
          </div>
          <div>
            <span
              style={{
                display: "block",
                fontSize: "var(--font-caption)",
                color: "var(--text-dim)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Total Listings
            </span>
            <span
              style={{
                fontSize: "var(--font-h4)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--text-main)",
              }}
            >
              {sellerListings.length}
            </span>
          </div>
        </div>
        <div
          className="glass-panel"
          style={{
            padding: "20px 24px",
            borderRadius: "16px",
            border: "1px solid var(--border-glass)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-h3)",
            }}
          >
            💬
          </div>
          <div>
            <span
              style={{
                display: "block",
                fontSize: "var(--font-caption)",
                color: "var(--text-dim)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Leads
            </span>
            <span
              style={{
                fontSize: "var(--font-h4)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--text-main)",
              }}
            >
              {sellerInquiries.length}
            </span>
          </div>
        </div>
        <div
          className="glass-panel"
          style={{
            padding: "20px 24px",
            borderRadius: "16px",
            border: "1px solid var(--border-glass)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-h3)",
            }}
          >
            ⭐
          </div>
          <div>
            <span
              style={{
                display: "block",
                fontSize: "var(--font-caption)",
                color: "var(--text-dim)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Shop Rating
            </span>
            <span
              style={{
                fontSize: "var(--font-h4)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--text-main)",
              }}
            >
              5.0 ★
            </span>
          </div>
        </div>
      </div>
      <div className={`dashboard-layout ${isChatTab ? "full-width" : ""}`}>
        {/* Sidebar — hidden on chat page */}
        {!isChatTab && (
          <aside className="dashboard-sidebar">
            {user && (
              <>
                <Link
                  href="/dashboard/add-listing"
                  className={`sidebar-tab ${dashboardTab === "add-listing" ? "active" : ""}`}
                >
                  ➕ Post New Product
                </Link>
                <Link
                  href="/dashboard/my-listings"
                  className={`sidebar-tab ${dashboardTab === "my-listings" ? "active" : ""}`}
                >
                  📦 My Listings
                </Link>
                <Link
                  href="/dashboard/leads"
                  className={`sidebar-tab ${dashboardTab === "leads" || dashboardTab === "inquiries" || dashboardTab === "messages" ? "active" : ""}`}
                >
                  💬 Messages ({sellerInquiries.length + buyerInquiries.length})
                </Link>
                <Link
                  href="/dashboard/bookmarks"
                  className={`sidebar-tab ${dashboardTab === "bookmarks" || dashboardTab === "saved" ? "active" : ""}`}
                >
                  ❤️ Shortlist ({savedListings.length})
                </Link>
                <Link
                  href="/dashboard/profile"
                  className={`sidebar-tab ${dashboardTab === "profile" ? "active" : ""}`}
                >
                  👤 Profile
                </Link>
              </>
            )}

            {user.role === "ADMIN" && (
              <>
                <Link
                  href="https://admin2.lowpriceplaces.com/"
                  className={`sidebar-tab ${dashboardTab === "admin" ? "active" : ""}`}
                >
                  🌆 Admin
                </Link>
              </>
            )}
          </aside>
        )}

        <section
          className="dashboard-content"
          style={isChatTab ? { gridColumn: "span 2" } : {}}
        >
          {/* Tab: My Listings */}
          {dashboardTab === "my-listings" && (
            <div>
              <h2 style={{ marginBottom: "16px" }}>Manage Listings</h2>
              <div className="products-grid">
                {sellerListings.map((item) => {
                  const photos = item.imagePath
                    ? item.imagePath.split(",")
                    : [];
                  const coverImage = photos[0] || "";
                  const hasDiscount = item.discountPercent > 0;
                  const priceFrom = item.price;
                  const finalPriceFrom = hasDiscount
                    ? (priceFrom * (1 - item.discountPercent / 100)).toFixed(0)
                    : priceFrom;

                  const priceTo = item.priceMax;
                  const finalPriceTo =
                    priceTo && hasDiscount
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
                      style={{
                        minHeight: "380px",
                        height: "auto",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        className="dashboard-card-main-row"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "100%",
                        }}
                      >
                        <div
                          className="card-image-wrapper"
                          style={{ height: "160px", position: "relative" }}
                        >
                          {hasDiscount && (
                            <div className="card-badge" style={{ zIndex: 3 }}>
                              -{item.discountPercent}% OFF
                            </div>
                          )}
                          <img
                            src={
                              coverImage
                                ? `${imageServer}${coverImage}`
                                : "https://placehold.co/400x300?text=No+Photo"
                            }
                            alt={item.title}
                            className="card-img"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/400x300?text=Listing+Item";
                            }}
                          />
                        </div>
                        <div
                          className="card-content"
                          style={{
                            padding: "12px",
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "var(--font-body)",
                              marginBottom: "4px",
                            }}
                          >
                            {item.title}
                          </h3>
                          <p
                            className="card-desc"
                            style={{
                              fontSize: "var(--font-caption)",
                              color: "var(--text-muted)",
                              marginBottom: "8px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.description}
                          </p>
                          <div
                            className="card-prices"
                            style={{ marginBottom: "8px" }}
                          >
                            {hasDiscount ? (
                              <>
                                <span
                                  className="price-discounted"
                                  style={{
                                    fontSize: "var(--font-body)",
                                    fontWeight: "var(--font-weight-bold)",
                                  }}
                                >
                                  ₹{finalPriceFrom}
                                  {finalPriceTo ? ` - ₹${finalPriceTo}` : ""}
                                </span>
                                <span
                                  className="price-original"
                                  style={{
                                    fontSize: "11px",
                                    textDecoration: "line-through",
                                    color: "var(--text-dim)",
                                    marginLeft: "6px",
                                  }}
                                >
                                  ₹{priceFrom}
                                  {priceTo ? ` - ₹${priceTo}` : ""}
                                </span>
                              </>
                            ) : (
                              <span
                                className="price-discounted"
                                style={{
                                  fontSize: "var(--font-body)",
                                  fontWeight: "var(--font-weight-bold)",
                                }}
                              >
                                ₹{priceFrom}
                                {priceTo ? ` - ₹${priceTo}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="dashboard-card-footer"
                        style={{
                          padding: "0 12px 12px 12px",
                          display: "flex",
                          flexDirection: "column",
                          marginTop: "auto",
                        }}
                      >
                        {item.status === "REJECTED" && item.rejectReason && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#f43f5e",
                              background: "rgba(244, 63, 94, 0.05)",
                              padding: "6px",
                              borderRadius: "4px",
                              borderLeft: "2px solid #f43f5e",
                              marginBottom: "8px",
                            }}
                          >
                            ❌ <strong>Reason:</strong> {item.rejectReason}
                          </div>
                        )}
                        <div
                          className="dashboard-card-badges"
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            className="badge-id"
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              background: "rgba(99, 102, 241, 0.1)",
                              color: "var(--primary)",
                              borderRadius: "4px",
                              fontWeight: "var(--font-weight-bold)",
                            }}
                          >
                            LPP-{String(item.id).padStart(5, "0")}
                          </span>
                          <span
                            className="alert-banner"
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              margin: 0,
                              background:
                                item.status === "ACTIVE"
                                  ? "var(--emerald-glow)"
                                  : item.status === "REJECTED"
                                    ? "rgba(244, 63, 94, 0.15)"
                                    : item.status === "INACTIVE"
                                      ? "rgba(156, 163, 175, 0.1)"
                                      : "rgba(245, 158, 11, 0.1)",
                              color:
                                item.status === "ACTIVE"
                                  ? "var(--emerald)"
                                  : item.status === "REJECTED"
                                    ? "#f43f5e"
                                    : item.status === "INACTIVE"
                                      ? "#9ca3af"
                                      : "#fbbf24",
                              border: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div
                          className="dashboard-card-actions"
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            paddingBottom: "8px",
                          }}
                        >
                          {item.status === "ACTIVE" && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() =>
                                updateListingStatus(item.id, "SOLD")
                              }
                            >
                              Mark Sold
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => setEditingListing(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-accent"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={async () => {
                              if (
                                confirm(
                                  `Delete listing LPP-${String(item.id).padStart(5, "0")}?`,
                                )
                              ) {
                                await api.deleteListing(item.id);
                                fetchSellerListings();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <div
                          className="dashboard-card-meta"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "11px",
                            color: "var(--text-dim)",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            paddingTop: "8px",
                            gap: "8px",
                          }}
                        >
                          <span>📍 {item.location}</span>
                          <span>
                            📅{" "}
                            {new Date(item.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Post New Listing */}
          {dashboardTab === "add-listing" && (
            <div className="glass-panel form-card">
              <h2 className="form-title">Advertise New Product Listing</h2>

              <form onSubmit={handleCreateListing} className="form-grid">
                <div
                  className="form-group full-width"
                  style={{ gridColumn: "span 2" }}
                >
                  <label className="form-label">Product Title / Heading</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Brand New Sony PlayStation 5 console"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
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
                    <option value="SECONDHAND">
                      ♻️ Second-Hand (Used items)
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Root Category</label>
                  <select
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value);
                      setNewSubCategory("");
                    }}
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
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
                    <option value="">
                      -- Choose Subcategory (Optional) --
                    </option>
                    {categories
                      .find((c) => c.id === parseInt(newCategory))
                      ?.subCategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price Range (₹ INR)</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
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
                  <input
                    type="number"
                    min="0"
                    max="95"
                    className="form-input"
                    placeholder="e.g. 10 (Set 0 for none)"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <label className="form-label" style={{ margin: 0 }}>
                      Location (Area, City, State)
                    </label>
                    <span
                      onClick={autoDetectListingLocation}
                      style={{
                        fontSize: "var(--font-caption)",
                        color: "var(--primary)",
                        cursor: "pointer",
                        fontWeight: "var(--font-weight-semibold)",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
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
                    <div
                      className="location-dropdown"
                      style={{ width: "100%", top: "calc(100% - 2px)" }}
                    >
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
                  <label className="form-label">
                    Upload Product Images (Max 10)
                  </label>
                  <MultiUploadComponent
                    folder="products"
                    images={newImageFiles}
                    onImagesChange={(urls) => setNewImageFiles(urls)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    WhatsApp Contact Number (For redirection)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 919876543210"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Normal Phone Call Contact
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 919876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                  />
                </div>

                <div
                  className="form-group full-width"
                  style={{ gridColumn: "span 2" }}
                >
                  <label className="form-label">
                    Product Detailed Description
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe specifications, parameters, usage history..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary full-width"
                  style={{ gridColumn: "span 2" }}
                >
                  Publish Advertising Listing
                </button>
              </form>
            </div>
          )}

          {/* Tab: Unified Messages Inbox */}
          {(dashboardTab === "leads" || dashboardTab === "inquiries" || dashboardTab === "messages") && (
            <div>
              {/* Chat Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                  padding: "16px 0 20px",
                  borderBottom: "1px solid var(--border-glass)",
                  marginBottom: "20px",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <button
                    onClick={() => router.back()}
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      fontSize: "var(--font-small)",
                      fontWeight: "var(--font-weight-semibold)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ← Back
                  </button>
                  <div>
                    <h1
                      style={{
                        fontSize: "var(--font-h4)",
                        fontWeight: "var(--font-weight-bold)",
                        color: "var(--text-main)",
                        margin: 0,
                      }}
                    >
                      💬 Messages
                    </h1>
                  </div>
                </div>

                {/* Sub tab Toggles */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setInboxSubTab("received");
                      setActiveInquiryId(null);
                    }}
                    className={`btn ${inboxSubTab === "received" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "8px 14px", fontSize: "var(--font-caption)", borderRadius: "8px", border: inboxSubTab === "received" ? "none" : "1px solid var(--border-glass)" }}
                  >
                    📥 Received Leads ({sellerInquiries.length})
                  </button>
                  <button
                    onClick={() => {
                      setInboxSubTab("sent");
                      setActiveInquiryId(null);
                    }}
                    className={`btn ${inboxSubTab === "sent" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "8px 14px", fontSize: "var(--font-caption)", borderRadius: "8px", border: inboxSubTab === "sent" ? "none" : "1px solid var(--border-glass)" }}
                  >
                    📤 Sent Messages ({buyerInquiries.length})
                  </button>
                </div>
              </div>

              {(() => {
                const currentInquiries = inboxSubTab === "received" ? sellerInquiries : buyerInquiries;

                if (currentInquiries.length === 0) {
                  return (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      {inboxSubTab === "received"
                        ? "No inquiries received from other users yet."
                        : "You haven't sent any messages to other users yet."}
                    </div>
                  );
                }

                return (
                  <div
                    className={`chat-split-container ${activeInquiryId ? "has-active-chat" : ""}`}
                    style={{
                      display: "flex",
                      gap: "20px",
                      height: "580px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "20px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Conversations List Sidebar */}
                    <div
                      className="chat-sidebar"
                      style={{
                        width: "340px",
                        borderRight: "1px solid var(--border-glass)",
                        display: "flex",
                        flexDirection: "column",
                        background: "rgba(0,0,0,0.12)",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--border-glass)",
                          fontWeight: "var(--font-weight-bold)",
                          color: "var(--text-main)",
                          fontSize: "var(--font-body)",
                        }}
                      >
                        Conversations ({currentInquiries.length})
                      </div>
                      <div style={{ flex: 1, overflowY: "auto" }}>
                        {currentInquiries.map((inq) => {
                          const isActive = activeInquiryId === inq.id;
                          const lastMsg =
                            inq.latestMessage ||
                            inq.messages?.[inq.messages.length - 1];
                          const hasUnread = inq.unreadCount > 0;
                          const { displayName, isOnline } = getChatMetadata(inq);
                          const avatarLetter = displayName
                            .charAt(0)
                            .toUpperCase();

                          const colors = [
                            "linear-gradient(135deg, #10b981, #059669)",
                            "linear-gradient(135deg, #3b82f6, #2563eb)",
                            "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                            "linear-gradient(135deg, #ec4899, #db2777)",
                            "linear-gradient(135deg, #f59e0b, #d97706)",
                            "linear-gradient(135deg, #ef4444, #dc2626)",
                          ];
                          const charCode = displayName.charCodeAt(0) || 0;
                          const bgGradient = colors[charCode % colors.length];

                          return (
                            <div
                              key={inq.id}
                              onClick={() => {
                                setActiveInquiryId(inq.id);
                                markAsRead(inq.id);
                              }}
                              style={{
                                padding: "12px 16px",
                                borderBottom:
                                  "1px solid rgba(255, 255, 255, 0.04)",
                                cursor: "pointer",
                                background: isActive
                                  ? "rgba(255, 255, 255, 0.06)"
                                  : "transparent",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                transition: "background 0.2s ease",
                                position: "relative",
                              }}
                            >
                              <div
                                style={{ position: "relative", flexShrink: 0 }}
                              >
                                <div
                                  style={{
                                    width: "46px",
                                    height: "46px",
                                    borderRadius: "50%",
                                    background: bgGradient,
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "var(--font-weight-bold)",
                                    fontSize: "16px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                  }}
                                >
                                  {avatarLetter}
                                </div>
                                {isOnline && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      bottom: 0,
                                      right: 0,
                                      width: "12px",
                                      height: "12px",
                                      borderRadius: "50%",
                                      background: "#10b981",
                                      border: "2px solid #0f172a",
                                    }}
                                  />
                                )}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize: "13.5px",
                                      color: "var(--text-main)",
                                      fontWeight: hasUnread
                                        ? "var(--font-weight-bold)"
                                        : "var(--font-weight-semibold)",
                                    }}
                                  >
                                    {displayName}
                                  </strong>
                                  {lastMsg && (
                                    <span
                                      style={{
                                        fontSize: "10.5px",
                                        color: "var(--text-dim)",
                                      }}
                                    >
                                      {new Date(
                                        lastMsg.createdAt,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: hasUnread
                                      ? "var(--text-main)"
                                      : "var(--text-muted)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    fontWeight: hasUnread
                                      ? "var(--font-weight-bold)"
                                      : "normal",
                                  }}
                                >
                                  {lastMsg ? lastMsg.message : "No messages yet"}
                                </div>
                              </div>

                              {hasUnread && (
                                <span
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #10b981, #059669)",
                                    color: "#ffffff",
                                    borderRadius: "10px",
                                    padding: "2px 8px",
                                    fontSize: "10px",
                                    fontWeight: "var(--font-weight-bold)",
                                    marginLeft: "auto",
                                  }}
                                >
                                  {inq.unreadCount}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Chat Message Pane */}
                    <div
                      className="chat-window"
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        background: "rgba(0,0,0,0.06)",
                        minWidth: 0,
                      }}
                    >
                      {(() => {
                        const activeInq = currentInquiries.find(
                          (i) => i.id === activeInquiryId,
                        );
                        if (!activeInq) {
                          return (
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--text-dim)",
                                gap: "10px",
                              }}
                            >
                              <span style={{ fontSize: "28px" }}>💬</span>
                              <span style={{ fontSize: "var(--font-small)" }}>
                                Select a conversation to start messaging
                              </span>
                            </div>
                          );
                        }

                        const { displayName, isOnline } = getChatMetadata(activeInq);

                        return (
                          <>
                            {/* Chat Room Banner */}
                            <div
                              style={{
                                padding: "14px 20px",
                                borderBottom: "1px solid var(--border-glass)",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                background: "rgba(255,255,255,0.01)",
                              }}
                            >
                              <button
                                className="chat-back-btn"
                                onClick={() => setActiveInquiryId(null)}
                                style={{
                                  background: "rgba(255,255,255,0.08)",
                                  border: "none",
                                  color: "#fff",
                                  borderRadius: "6px",
                                  padding: "6px 12px",
                                  fontSize: "var(--font-helper)",
                                  cursor: "pointer",
                                  display: "none",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginRight: "6px",
                                }}
                              >
                                ← Back
                              </button>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: "var(--font-weight-bold)",
                                    color: "var(--text-main)",
                                    fontSize: "var(--font-body)",
                                  }}
                                >
                                  {displayName}
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: isOnline ? "#10b981" : "#94a3b8",
                                      fontWeight: "var(--font-weight-medium)",
                                      marginLeft: "8px",
                                    }}
                                  >
                                    ● {isOnline ? "Online" : "Offline"}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: "12.5px",
                                    color: "var(--primary)",
                                    marginTop: "2px",
                                    fontWeight: "var(--font-weight-semibold)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Listing: {activeInq.listing?.title} (₹
                                  {activeInq.listing?.price})
                                </div>
                              </div>
                            </div>

                            {/* Message History Stream */}
                            <div
                              id={`chat-messages-${activeInq.id}`}
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                                padding: "20px",
                                overflowY: "auto",
                                background: "rgba(0,0,0,0.04)",
                              }}
                            >
                              {loadingDashboardMessages &&
                              dashboardMessages.length === 0 ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "var(--text-dim)",
                                    padding: "20px",
                                  }}
                                >
                                  Loading messages...
                                </div>
                              ) : dashboardMessages.length === 0 ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "var(--text-dim)",
                                    padding: "20px",
                                    fontSize: "var(--font-helper)",
                                  }}
                                >
                                  No messages yet. Send a greeting!
                                </div>
                              ) : (
                                dashboardMessages.map((msg) => {
                                  const isMe = msg.senderId === user.id;
                                  const hasDoubleTicks =
                                    msg.recipientReadAt !== null &&
                                    msg.recipientReadAt !== undefined;

                                  return (
                                    <div
                                      key={msg.id}
                                      style={{
                                        alignSelf: isMe
                                          ? "flex-end"
                                          : "flex-start",
                                        maxWidth: "70%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: isMe
                                          ? "flex-end"
                                          : "flex-start",
                                      }}
                                    >
                                      <div
                                        style={{
                                          background: isMe
                                            ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                                            : "rgba(255,255,255,0.06)",
                                          border: isMe
                                            ? "none"
                                            : "1px solid var(--border-glass)",
                                          borderRadius: isMe
                                            ? "18px 18px 4px 18px"
                                            : "18px 18px 18px 4px",
                                          padding: "10px 16px",
                                          color: "#ffffff",
                                          fontSize: "13.5px",
                                          lineHeight: "1.4",
                                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        }}
                                      >
                                        {msg.message}
                                      </div>
                                      <span
                                        style={{
                                          fontSize: "10px",
                                          color: "var(--text-dim)",
                                          marginTop: "4px",
                                          padding: "0 4px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px",
                                        }}
                                      >
                                        {new Date(
                                          msg.createdAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                        {isMe && (
                                          <span
                                            style={{
                                              color: hasDoubleTicks
                                                ? "#10b981"
                                                : "var(--text-dim)",
                                              fontWeight:
                                                "var(--font-weight-bold)",
                                            }}
                                          >
                                            {hasDoubleTicks ? "✓✓" : "✓"}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Chat Input Field */}
                            <div
                              style={{
                                padding: "16px 20px",
                                borderTop: "1px solid var(--border-glass)",
                                background: "rgba(255,255,255,0.01)",
                              }}
                            >
                              <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                  type="text"
                                  className="reply-input"
                                  style={{
                                    flex: 1,
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "24px",
                                    padding: "10px 16px",
                                    color: "var(--text-main)",
                                    fontSize: "13.5px",
                                    outline: "none",
                                  }}
                                  placeholder="Type a message..."
                                  value={replyTexts[activeInq.id] || ""}
                                  onChange={(e) =>
                                    setReplyTexts((prev) => ({
                                      ...prev,
                                      [activeInq.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSendMessage(activeInq.id);
                                    }
                                  }}
                                />
                                <button
                                  className="btn btn-primary"
                                  style={{
                                    padding: "0 22px",
                                    borderRadius: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                      "linear-gradient(135deg, #10b981, #059669)",
                                    border: "none",
                                  }}
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
                );
              })()}
            </div>
          )}

          {/* Tab: Saved Bookmarks / Shortlist (All Roles) */}
          {(dashboardTab === "saved" ||
            dashboardTab === "bookmarks" ||
            activeTabParam === "bookmarks" ||
            activeTabParam === "saved") && (
            <div style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 0 18px",
                  borderBottom: "1px solid var(--border-glass)",
                  marginBottom: "20px",
                }}
              >
                <button
                  onClick={() => router.back()}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    fontSize: "var(--font-small)",
                    fontWeight: "var(--font-weight-semibold)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ← Back
                </button>
                <div>
                  <h1
                    style={{
                      fontSize: "clamp(17px, 4vw, 20px)",
                      fontWeight: "var(--font-weight-bold)",
                      color: "var(--text-main)",
                      margin: 0,
                    }}
                  >
                    ❤️ Shortlisted Products
                  </h1>
                  <p
                    style={{
                      fontSize: "var(--font-caption)",
                      color: "var(--text-muted)",
                      margin: "2px 0 0",
                    }}
                  >
                    Items you have bookmarked ({savedListings.length})
                  </p>
                </div>
              </div>

              {savedListings.length === 0 ? (
                <div
                  className="glass-panel"
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--font-h1)",
                      display: "block",
                      marginBottom: "10px",
                    }}
                  >
                    ❤️
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--font-small)",
                      color: "var(--text-main)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    No shortlisted items yet
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "var(--font-caption)",
                    }}
                  >
                    Browse listings and tap the Shortlist / Bookmark button to
                    save products here.
                  </p>
                </div>
              ) : (
                <div className="products-grid">
                  {loadingShortlist ? (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "30px",
                        gridColumn: "1 / -1",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Loading your shortlisted products...
                    </div>
                  ) : shortlistedProducts.length === 0 ? (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "30px",
                        gridColumn: "1 / -1",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No active shortlisted products found.
                    </div>
                  ) : (
                    shortlistedProducts.map((item) => (
                      <ProductCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Cities Management (Admin) */}
          {user.role === "ADMIN" && dashboardTab === "cities" && (
            <div>
              <h2 style={{ marginBottom: "16px" }}>Manage Cities & Icons</h2>
              {adminCitySuccess && (
                <div
                  className="alert-banner alert-success"
                  style={{ marginBottom: "16px" }}
                >
                  {adminCitySuccess}
                </div>
              )}
              {adminCityError && (
                <div
                  className="alert-banner alert-error"
                  style={{ marginBottom: "16px" }}
                >
                  {adminCityError}
                </div>
              )}

              <div
                className="glass-panel form-card"
                style={{ padding: "24px", marginBottom: "24px" }}
              >
                <h3
                  style={{
                    marginBottom: "16px",
                    fontSize: "var(--font-h5)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  Add New City
                </h3>

                <form
                  onSubmit={handleAddCity}
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    className="form-group"
                    style={{ flex: 2, minWidth: "200px", marginBottom: 0 }}
                  >
                    <label
                      className="form-label"
                      style={{ fontSize: "var(--font-caption)" }}
                    >
                      City Name
                    </label>
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

                  <div
                    className="form-group"
                    style={{ flex: 1, minWidth: "100px", marginBottom: 0 }}
                  >
                    <label
                      className="form-label"
                      style={{ fontSize: "var(--font-caption)" }}
                    >
                      Choose Icon / Emoji
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 🕌"
                      value={cityEmojiInput}
                      onChange={(e) => setCityEmojiInput(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        textAlign: "center",
                        fontSize: "var(--font-h5)",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ height: "42px", padding: "0 24px" }}
                  >
                    ➕ Add City
                  </button>
                </form>
              </div>

              <h3
                style={{
                  marginBottom: "16px",
                  fontSize: "var(--font-h5)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                Configured Cities
              </h3>
              <div className="glass-panel" style={{ padding: "20px" }}>
                {citiesList.length === 0 ? (
                  <p
                    style={{ color: "var(--text-muted)", textAlign: "center" }}
                  >
                    No cities configured yet.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "16px",
                    }}
                  >
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
                          transition:
                            "transform 0.2s ease, background-color 0.2s ease",
                        }}
                        className="city-manage-card"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span style={{ fontSize: "var(--font-h3)" }}>
                            {city.emoji}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--font-body)",
                              fontWeight: "var(--font-weight-semibold)",
                              color: "var(--text-main)",
                            }}
                          >
                            {city.name}
                          </span>
                        </div>
                        <button
                          className="btn btn-accent"
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            borderRadius: "6px",
                          }}
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

          {/* Tab: User Profile */}
          {!isBookmarksTab &&
            !isChatTab &&
            (dashboardTab === "profile" || activeTab === "profile") && (
              <div
                style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}
              >
                {/* Profile Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 0 18px",
                    borderBottom: "1px solid var(--border-glass)",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => router.back()}
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      fontSize: "var(--font-small)",
                      fontWeight: "var(--font-weight-semibold)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    ← Back
                  </button>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h1
                      style={{
                        fontSize: "clamp(17px, 4vw, 20px)",
                        fontWeight: "var(--font-weight-bold)",
                        color: "var(--text-main)",
                        margin: 0,
                      }}
                    >
                      👤 User Profile
                    </h1>
                    <p
                      style={{
                        fontSize: "var(--font-caption)",
                        color: "var(--text-muted)",
                        margin: "2px 0 0",
                      }}
                    >
                      Manage your public profile &amp; contact info
                    </p>
                  </div>
                </div>
                <div
                  className="glass-panel form-card"
                  style={{
                    padding: "clamp(16px, 4vw, 24px)",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <form onSubmit={handleSaveProfile} style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                        gap: "16px 20px",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. John Doe"
                          value={profileForm.fullName || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              fullName: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">
                          Display Name / Shop Name
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Luxe Deals Shop"
                          value={profileForm.displayName || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              displayName: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">Professional Title</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Premium Certified Dealer"
                          value={profileForm.professionalTitle || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              professionalTitle: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 5"
                          value={profileForm.yearsOfExperience || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              yearsOfExperience: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">Business Category</label>
                        <select
                          className="form-input"
                          value={profileForm.businessCategory || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              businessCategory: e.target.value,
                            })
                          }
                          required
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">Business Type</label>
                        <select
                          className="form-input"
                          value={profileForm.businessType || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              businessType: e.target.value,
                            })
                          }
                          required
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          <option value="">Select Business Type</option>
                          <option value="Retailer">Retailer</option>
                          <option value="Wholesaler">Wholesaler</option>
                          <option value="Manufacturer">Manufacturer</option>
                          <option value="Distributor">Distributor</option>
                          <option value="Service Provider">
                            Service Provider
                          </option>
                          <option value="Individual / Freelancer">
                            Individual / Freelancer
                          </option>
                        </select>
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">
                          Shop Logo / Profile Photo
                        </label>
                        <UploadComponent
                          folder="profile"
                          initialImageUrl={profileForm.imagePath}
                          onUploadSuccess={(media) =>
                            setProfileForm({
                              ...profileForm,
                              imagePath: media.url,
                            })
                          }
                          onUploadClear={() =>
                            setProfileForm({ ...profileForm, imagePath: "" })
                          }
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="e.g. contact@luxedeals.com"
                          value={profileForm.email || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              email: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">
                          Mobile Number (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 9876543210"
                          value={profileForm.mobileNumber || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              mobileNumber: e.target.value,
                            })
                          }
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">
                          WhatsApp Number (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 9876543210"
                          value={profileForm.whatsAppNumber || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              whatsAppNumber: e.target.value,
                            })
                          }
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">
                          Business Location Address
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Madhapur, Hyderabad"
                          value={profileForm.location || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              location: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          className="form-input"
                          placeholder="e.g. 17.4483"
                          value={profileForm.latitude || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              latitude: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>

                      <div
                        className="form-group"
                        style={{ width: "100%", minWidth: 0 }}
                      >
                        <label className="form-label">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          className="form-input"
                          placeholder="e.g. 78.3741"
                          value={profileForm.longitude || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              longitude: e.target.value,
                            })
                          }
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", marginBottom: "20px" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                setProfileForm((prev) => ({
                                  ...prev,
                                  latitude: pos.coords.latitude.toFixed(6),
                                  longitude: pos.coords.longitude.toFixed(6),
                                }));
                                fetch(
                                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
                                )
                                  .then((res) => res.json())
                                  .then((data) => {
                                    const city =
                                      data.address.city ||
                                      data.address.town ||
                                      data.address.village ||
                                      data.address.state ||
                                      "";
                                    const suburb =
                                      data.address.suburb ||
                                      data.address.neighbourhood ||
                                      data.address.road ||
                                      "";
                                    const addr =
                                      suburb && city
                                        ? `${suburb}, ${city}`
                                        : city || "";
                                    if (addr) {
                                      setProfileForm((prev) => ({
                                        ...prev,
                                        location: addr,
                                      }));
                                    }
                                  })
                                  .catch(console.error);
                              },
                              (err) => {
                                alert("Failed to get location: " + err.message);
                              },
                            );
                          } else {
                            alert(
                              "Geolocation is not supported by your browser.",
                            );
                          }
                        }}
                        style={{
                          fontSize: "12.5px",
                          padding: "8px 16px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        📍 Detect & Use Current Coordinates
                      </button>
                    </div>

                    {/* Privacy & Contact Visibility Settings */}
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "16px 20px",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "14px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "var(--font-small)",
                          fontWeight: "var(--font-weight-bold)",
                          color: "var(--text-main)",
                          margin: "0 0 12px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        🔒 Seller Privacy &amp; Contact Settings
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "12px",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            cursor: "pointer",
                            fontSize: "13.5px",
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--text-main)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(profileForm.showWhatsapp)}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                showWhatsapp: e.target.checked,
                              })
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "var(--primary)",
                            }}
                          />
                          ☑ Show WhatsApp Number
                        </label>

                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            cursor: "pointer",
                            fontSize: "13.5px",
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--text-main)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(profileForm.showPhone)}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                showPhone: e.target.checked,
                              })
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "var(--primary)",
                            }}
                          />
                          ☑ Show Phone Number
                        </label>

                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            cursor: "pointer",
                            fontSize: "13.5px",
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--text-main)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(profileForm.allowChat)}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                allowChat: e.target.checked,
                              })
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "var(--primary)",
                            }}
                          />
                          ☑ Allow In-App Chat
                        </label>
                      </div>
                    </div>

                    <div
                      className="form-group"
                      style={{
                        marginTop: "20px",
                        marginBottom: "0",
                        width: "100%",
                      }}
                    >
                      <label className="form-label">About Seller</label>
                      <textarea
                        className="form-input"
                        placeholder="Describe your services, business, or shop..."
                        rows={4}
                        value={profileForm.aboutSeller || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            aboutSeller: e.target.value,
                          })
                        }
                        required
                        style={{
                          width: "100%",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{
                        marginTop: "20px",
                        width: "100%",
                        maxWidth: "240px",
                      }}
                      disabled={savingProfile}
                    >
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
              position: "fixed",
              top: "24px",
              right: "24px",
              backgroundColor:
                toast.type === "success"
                  ? "rgba(16, 185, 129, 0.95)"
                  : "rgba(239, 68, 68, 0.95)",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: "8px",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backdropFilter: "blur(8px)",
              fontWeight: "var(--font-weight-semibold)",
              fontSize: "var(--font-small)",
              maxWidth: "350px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
            }}
          >
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                opacity: 0.7,
                marginLeft: "10px",
                fontSize: "var(--font-caption)",
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}
