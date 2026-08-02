"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import ChatDrawer from "@/components/ChatDrawer";
import Logo from "./logo";
import MultiUploadComponent from "@/components/MultiUploadComponent";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const imageServer =
    process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  async function reverseGeocode(lat, lng) {
    const BLOCKED_POI_KEYWORDS = [
      "station", "stop", "bus", "metro", "railway",
      "mall", "shopping", "center", "centre", "plaza", "bazaar",
      "hospital", "clinic", "diagnostic", "health", "medical",
      "school", "college", "university", "academy", "institute",
      "temple", "mosque", "masjid", "church", "gurudwara", "ashram", "shrine",
      "building", "apartment", "residency", "tower", "villa", "house", "complex", "society",
      "road", "street", "lane", "highway", "bypass", "flyover", "chowk", "gali"
    ];

    const isBlocked = (name) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return BLOCKED_POI_KEYWORDS.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lower);
      });
    };

    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties;
          const state = props.state || "";
          const city = props.city || props.town || props.village || props.district || "";
          
          let locality = props.suburb || "";
          if (!locality && props.name) {
            const isPlaceType = props.osm_key === "place" || props.osm_key === "boundary";
            if (isPlaceType && !isBlocked(props.name)) {
              locality = props.name;
            }
          }

          const cleanLocality = isBlocked(locality) ? "" : locality;
          const cleanCity = isBlocked(city) ? "" : city;
          const cleanState = isBlocked(state) ? "" : state;

          if (cleanCity || cleanState) {
            const parts = [cleanLocality, cleanCity, cleanState].filter(p => p && p.trim() !== "");
            if (parts.length > 0) {
              return parts.join(", ");
            }
          }
        }
      }
    } catch (err) {
      console.error("Photon geocoding failed, trying Nominatim...", err);
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          const addr = data.address;
          const state = addr.state || "";
          const city = addr.city || addr.town || addr.village || "";
          const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";

          const cleanLocality = isBlocked(locality) ? "" : locality;
          const cleanCity = isBlocked(city) ? "" : city;
          const cleanState = isBlocked(state) ? "" : state;

          const parts = [cleanLocality, cleanCity, cleanState].filter(p => p && p.trim() !== "");
          if (parts.length > 0) {
            return parts.join(", ");
          }
        }
      }
    } catch (err) {
      console.error("Nominatim geocoding failed...", err);
    }

    return null;
  }



  const {
    detectingLoc,
    handleDetectLocation,
    user,
    setUser,
    authLoading,
    logout,
    theme,
    setTheme,
    categories,
    citiesList,
    searchQuery,
    setSearchQuery,
    selectedCatFilter,
    setSelectedCatFilter,
    setSelectedSubCatFilter,
    locationFilter,
    setLocationFilter,
    locationSearchInput,
    setLocationSearchInput,
    showLocationDropdown,
    setShowLocationDropdown,
    isScrolled,
    setIsScrolled,
    photonSuggestions,
    suggestions,
    setSuggestions,
    suggestionLoading,
    suggestionError,
    mobileMenuOpen,
    setMobileMenuOpen,
    editingListing,
    setEditingListing,
    fetchListings,
    fetchSellerListings,
    detectUserLocation,
    setSubCategoryView,
    isChatOpen,
    setIsChatOpen,
    unreadChatCount,
    fetchUserChats,
  } = useApp();

  // Unread chat/inquiry count
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);

  const handleKeywordKeyDown = (e) => {
    if (!showKeywordDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => 
        prev === suggestions.length - 1 ? 0 : prev + 1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => 
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[focusedSuggestionIndex].label);
      }
    } else if (e.key === "Escape") {
      setShowKeywordDropdown(false);
    }
  };

  const handleSelectSuggestion = (text) => {
    setSearchQuery(text);
    setShowKeywordDropdown(false);
    fetchListings({ search: text });
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    return text.replace(regex, `<strong style="font-weight: 800; color: #6366f1;">$1</strong>`);
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    async function fetchUnread() {
      try {
        let sellerInqs = [];
        let buyerInqs = [];
        try {
          sellerInqs = (await api.getSellerInquiries()) || [];
        } catch {}
        try {
          buyerInqs = (await api.getBuyerInquiries()) || [];
        } catch {}

        const sellerUnread = sellerInqs.filter(
          (inq) => !inq.isReadBySeller,
        ).length;
        const buyerUnread = buyerInqs.filter(
          (inq) => !inq.isReadByBuyer,
        ).length;

        setUnreadCount(sellerUnread + buyerUnread);
      } catch {
        setUnreadCount(0);
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (pathname === "/" && window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Click outside edit location dropdown
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [showEditLocDropdown, setShowEditLocDropdown] = useState(false);
  const [editLocSuggestions, setEditLocSuggestions] = useState([]);

  useEffect(() => {
    if (editingListing) {
      setEditImageFiles(editingListing.imagePath ? editingListing.imagePath.split(",") : []);
    } else {
      setEditImageFiles([]);
    }
  }, [editingListing]);

  useEffect(() => {
    if (!editingListing?.location || editingListing.location.length < 2) {
      setEditLocSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(editingListing.location)}&limit=8&bbox=68.1,6.8,97.4,35.5`,
        );
        const data = await res.json();
        const suggestionsList = data.features
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
        setEditLocSuggestions([...new Set(suggestionsList)]);
      } catch (e) {
        console.error("Photon geocoding error:", e);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [editingListing?.location]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        !e.target.closest(".location-search-box") &&
        !e.target.closest(".form-group")
      ) {
        setShowEditLocDropdown(false);
      }
      if (!e.target.closest(".location-search-box")) {
        setShowLocationDropdown(false);
      }
      if (!e.target.closest(".keyword-search-box")) {
        setShowKeywordDropdown(false);
      }
      if (!e.target.closest(".user-profile-dropdown-wrapper")) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowLocationDropdown(false);
    setShowKeywordDropdown(false);
    setSuggestions([]);
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const handleSuggestionClick = (sug) => {
    const text = typeof sug === "string" ? sug : (sug.label || sug.title || sug.name || "");
    if (!text) return;
    setSearchQuery(text);
    setSuggestions([]);
    setShowKeywordDropdown(false);
    router.push(`/search?q=${encodeURIComponent(text.trim())}`);
  };

  const handleSaveListingDetails = async (e) => {
    e.preventDefault();
    try {
      let resolvedCityId = null;
      let resolvedSubCityId = null;

      if (editingListing.location) {
        const locParts = editingListing.location.split(",").map(p => p.trim());
        if (locParts.length >= 2) {
          const subName = locParts[0];
          const cityName = locParts[1];
          const matchedCity = citiesList.find(c => c.name.toLowerCase() === cityName.toLowerCase());
          if (matchedCity) {
            resolvedCityId = matchedCity.id;
            const matchedSub = matchedCity.subCities?.find(sub => sub.name.toLowerCase() === subName.toLowerCase());
            if (matchedSub) {
              resolvedSubCityId = matchedSub.id;
            }
          }
        } else if (locParts.length === 1 && locParts[0]) {
          const cityName = locParts[0];
          const matchedCity = citiesList.find(c => c.name.toLowerCase() === cityName.toLowerCase());
          if (matchedCity) {
            resolvedCityId = matchedCity.id;
          }
        }
      }

      const payload = {
        title: editingListing.title,
        price: editingListing.price,
        priceMax: editingListing.priceMax || "",
        discountPercent: editingListing.discountPercent,
        location: editingListing.location || "",
        latitude: editingListing.latitude || null,
        longitude: editingListing.longitude || null,
        cityId: resolvedCityId,
        subCityId: resolvedSubCityId,
        description: editingListing.description,
        categoryId: editingListing.categoryId,
        subCategoryId: editingListing.subCategoryId || null,
        imageUrls: editImageFiles && editImageFiles.length > 0 ? editImageFiles.join(",") : null,
      };

      await api.editListingDetails(editingListing.id, payload);
      setEditingListing(null);
      setEditImageFiles([]);
      fetchListings();
      fetchSellerListings();
      alert("Listing updated successfully!");
    } catch (e) {
      alert("Error saving updates: " + e.message);
    }
  };

  const renderSearchForm = () => {
    // Suggest active cities
    const activeCities = citiesList.filter((c) => c.activeListingsCount > 0);

    // Suggest active sub-cities
    const activeSubCities = [];
    activeCities.forEach((c) => {
      c.subCities?.forEach((sub) => {
        if (sub.activeListingsCount > 0) {
          activeSubCities.push(`${sub.name}, ${c.name} (${sub.activeListingsCount})`);
        }
      });
    });

    const suggestionsList = [
      ...activeCities.map((c) => `${c.name} (${c.activeListingsCount})`),
      ...activeSubCities,
    ];

    const displayedLocations =
      locationSearchInput.length >= 2 && photonSuggestions.length > 0
        ? photonSuggestions
        : suggestionsList
            .filter((loc) =>
              loc.toLowerCase().includes(locationSearchInput.toLowerCase()),
            )
            .slice(0, 8);

    return (
      <form className="dual-search-container" onSubmit={handleSearchSubmit}>
        <div className="location-search-box">
          <span className="location-icon">📍</span>
          <input
            type="text"
            placeholder="Search location..."
            className="location-input"
            value={locationSearchInput}
            onChange={(e) => {
              const val = e.target.value;
              setLocationSearchInput(val);
              setLocationFilter(val);
              setShowLocationDropdown(true);
            }}
            onFocus={() => setShowLocationDropdown(true)}
          />

          {showLocationDropdown && (
            <div className="location-dropdown">
              <div
                className="detect-location-item"
                onClick={detectUserLocation}
              >
                <span className="location-icon">🎯</span>
                Detect Location
              </div>
              {displayedLocations.length > 0 ? (
                displayedLocations.map((loc, i) => (
                  <div
                    key={i}
                    className="location-dropdown-item"
                    onClick={() => {
                      const cleanLoc = loc.replace(/\s*\(\d+\)$/, "");
                      setLocationSearchInput(cleanLoc);
                      setLocationFilter(cleanLoc);
                      setShowLocationDropdown(false);
                      fetchListings({ location: cleanLoc });
                    }}
                  >
                    {loc}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "10px 16px",
                    fontSize: "var(--font-helper)",
                    color: "var(--text-dim)",
                  }}
                >
                  No matches found
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="keyword-search-box"
          style={{ display: "flex", alignItems: "center", flex: 1 }}
        >
          <span
            style={{
              fontSize: "var(--font-small)",
              marginLeft: "12px",
              color: "var(--text-dim)",
              userSelect: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            className="keyword-input"
            style={{ paddingLeft: "8px" }}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowKeywordDropdown(true);
              setFocusedSuggestionIndex(-1);
            }}
            onFocus={() => {
              setShowKeywordDropdown(true);
              setFocusedSuggestionIndex(-1);
            }}
            onKeyDown={handleKeywordKeyDown}
          />

          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
                setShowKeywordDropdown(false);
                fetchListings({ search: "" });
              }}
              title="Clear Search"
            >
              ✖
            </button>
          )}

          <button type="submit" className="search-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {showKeywordDropdown && searchQuery.trim().length >= 2 && (
            <div className="autocomplete-dropdown" style={{ display: "block" }}>
              {suggestionLoading ? (
                <div style={{ padding: "10px 16px", color: "var(--text-muted)", fontSize: "var(--font-helper)" }}>
                  Loading suggestions...
                </div>
              ) : suggestionError ? (
                <div style={{ padding: "10px 16px", color: "var(--primary)", fontSize: "var(--font-helper)" }}>
                  ⚠️ {suggestionError}
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((sug, i) => {
                  const isFocused = i === focusedSuggestionIndex;
                  return (
                    <div
                      key={i}
                      className={`autocomplete-item ${isFocused ? "active" : ""}`}
                      onClick={() => handleSelectSuggestion(sug.label)}
                      onMouseEnter={() => setFocusedSuggestionIndex(i)}
                      style={{
                        background: isFocused ? "rgba(255,255,255,0.06)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 16px",
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: highlightMatch(sug.label, searchQuery) }} />
                      <span style={{
                        fontSize: "9px",
                        color: "var(--text-dim)",
                        background: "rgba(255,255,255,0.04)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        fontWeight: "var(--font-weight-bold)"
                      }}>
                        {sug.type}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "10px 16px", color: "var(--text-muted)", fontSize: "var(--font-helper)", textAlign: "center" }}>
                  No results found.
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    );
  };

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "var(--bg-main)",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div className="spinner"></div>
          <span>Loading lowpriceplaces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Header (Amazon Style) */}
      <header className={`header-glass ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-main)",
              fontSize: "var(--font-h3)",
              cursor: "pointer",
              padding: "0 8px",
            }}
          >
            ☰
          </button>
          <Logo />

          {pathname === "/" && (
            <div
              className="search-wrapper"
              style={{
                flex: 1,
                maxWidth: "600px",
                height: "46px",
                display: "flex",
                alignItems: "center",
                marginLeft: "20px",
              }}
            >
              {renderSearchForm()}
            </div>
          )}

          <div
            className="mobile-header-actions"
            style={{
              display: "none",
              marginLeft: "auto",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {pathname !== "/" && (
              <button
                className="btn btn-secondary"
                style={{
                  padding: "6px 10px",
                  fontSize: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => {
                  router.push("/");
                  setTimeout(() => {
                    const searchHero = document.querySelector(
                      ".mobile-search-hero",
                    );
                    if (searchHero) {
                      searchHero.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }, 200);
                }}
                title="Search Listings"
              >
                🔍
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{
                padding: "6px 10px",
                fontSize: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={
                theme === "light"
                  ? "Switch to Dark Mode"
                  : "Switch to Light Mode"
              }
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>

          <div className="nav-actions">
            {pathname !== "/" && (
              <button
                className="btn btn-secondary"
                style={{
                  padding: "6px 10px",
                  fontSize: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => {
                  router.push("/");
                  setTimeout(() => {
                    const searchHero = document.querySelector(
                      ".mobile-search-hero",
                    );
                    if (searchHero) {
                      searchHero.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }, 200);
                }}
                title="Search Listings"
              >
                🔍
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{
                padding: "6px 10px",
                fontSize: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={
                theme === "light"
                  ? "Switch to Dark Mode"
                  : "Switch to Light Mode"
              }
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            {user ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                {user && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (!user) {
                        router.push("/login");
                      } else {
                        fetchUserChats();
                        setIsChatOpen(true);
                      }
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      padding: 0,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                    }}
                    title="Open 1-on-1 Messages & Chat"
                  >
                    <span style={{ fontSize: "18px" }}>💬</span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-5px",
                          background: "#ef4444",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: "bold",
                          borderRadius: "50%",
                          minWidth: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          border: "2.5px solid var(--bg-card-solid)",
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Avatar Profile Dropdown */}
                <div
                  className="user-profile-dropdown-wrapper"
                  style={{ position: "relative" }}
                >
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "20px",
                      transition: "var(--transition)",
                    }}
                  >
                    <img
                      src={
                        user.profilePicture
                          ? user.profilePicture.startsWith("http")
                            ? user.profilePicture
                            : `${imageServer}${user.profilePicture}`
                          : "https://placehold.co/100x100?text=User"
                      }
                      alt={user.fullName || user.username}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid var(--border-glass)",
                      }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/100x100?text=U";
                      }}
                    />
                    <span
                      style={{
                        fontSize: "var(--font-caption)",
                        color: "var(--text-main)",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {showUserDropdown && (
                    <div
                      className="glass-panel"
                      style={{
                        position: "absolute",
                        top: "45px",
                        right: 0,
                        zIndex: 100,
                        width: "220px",
                        padding: "16px",
                        background: "var(--bg-card-solid)",
                        border: "1px solid var(--border-glass)",
                        boxShadow: "var(--shadow-glow)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        borderRadius: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "var(--font-small)",
                            color: "var(--text-main)",
                          }}
                        >
                          {user.fullName ||
                            (user.username
                              ? user.username.split("@")[0]
                              : "User")}
                        </strong>
                        <span
                          style={{
                            fontSize: "var(--font-caption)",
                            color: "var(--text-dim)",
                            wordBreak: "break-all",
                          }}
                        >
                          {user.email || user.username}
                        </span>
                      </div>
                      <hr
                        style={{
                          border: "none",
                          borderTop: "1px solid var(--border-glass)",
                          margin: 0,
                        }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowUserDropdown(false);
                          if (user.role === "ADMIN") {
                            window.location.href =
                              "https://admin2.lowpriceplaces.com";
                          } else {
                            router.push("/dashboard/profile");
                          }
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          fontSize: "var(--font-caption)",
                        }}
                      >
                        👤{" "}
                        {user.role === "ADMIN"
                          ? "Admin Dashboard"
                          : "Profile Settings"}
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          padding: "8px 12px",
                          fontSize: "var(--font-caption)",
                        }}
                      >
                        🚪 Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => router.push("/login")}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="content-wrapper">
        {pathname === "/" && (
          <div className="mobile-search-hero">{renderSearchForm()}</div>
        )}
        {children}
      </main>

      <footer
        className="app-footer"
        style={{
          marginTop: "auto",
          borderTop: "1px solid var(--border-glass)",
          padding: "24px 0",
          background: "var(--bg-card)",
          backdropFilter: "var(--glass-blur)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <span
            style={{ fontSize: "var(--font-helper)", color: "var(--text-dim)" }}
          >
            © 2026 lowpriceplaces Classifieds. Local advertisements and
            connections for budget deals.
          </span>
          <span
            style={{
              fontSize: "var(--font-helper)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--primary)", flexShrink: 0 }}
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <a
              href="mailto:support@lowpriceplaces.com"
              style={{
                color: "var(--primary)",
                textDecoration: "none",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              support@lowpriceplaces.com
            </a>
          </span>
        </div>
      </footer>

      {/* SELLER EDIT LISTING MODAL */}
      {editingListing && (
        <div className="modal-overlay">
          <div
            className="modal-content glass-panel"
            style={{
              width: "90%",
              maxWidth: "600px",
              background: "var(--bg-card)",
              backdropFilter: "var(--glass-blur)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <h2 style={{ fontSize: "var(--font-h4)" }}>
                Edit Product: LPP-{String(editingListing.id).padStart(5, "0")}
              </h2>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingListing(null)}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSaveListingDetails} className="form-grid">
              <div
                className="form-group full-width"
                style={{ gridColumn: "span 2" }}
              >
                <label className="form-label">Product Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingListing.title}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price Range (₹)</label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="number"
                    className="form-input"
                    placeholder="From"
                    value={editingListing.price || ""}
                    onChange={(e) =>
                      setEditingListing({
                        ...editingListing,
                        price: e.target.value,
                      })
                    }
                    required
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>to</span>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="To"
                    value={editingListing.priceMax || ""}
                    onChange={(e) =>
                      setEditingListing({
                        ...editingListing,
                        priceMax: e.target.value,
                      })
                    }
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="95"
                  className="form-input"
                  value={editingListing.discountPercent}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      discountPercent: e.target.value,
                    })
                  }
                  required
                />
              </div>


              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Location</label>
                  <button
                    type="button"
                    onClick={() => handleDetectLocation(({ location, lat, lng }) => {
                      setEditingListing({
                        ...editingListing,
                        location,
                        latitude: lat || editingListing.latitude,
                        longitude: lng || editingListing.longitude
                      });
                    })}
                    disabled={detectingLoc}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontSize: "var(--font-helper)",
                      cursor: "pointer",
                      fontWeight: "var(--font-weight-semibold)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {detectingLoc ? "⏳ Detecting..." : "🎯 Detect Location"}
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Madhapur, Hyderabad, Telangana"
                  value={editingListing.location || ""}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      location: e.target.value
                    })
                  }
                  required
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Listing Type</label>
                <select
                  className="form-select"
                  value={editingListing.listingType || "SALES"}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      listingType: e.target.value,
                    })
                  }
                  required
                >
                  <option value="SALES">🛍️ Sales (New products)</option>
                  <option value="SERVICES">💼 Work & Services</option>
                  <option value="SECONDHAND">
                    ♻️ Second-Hand (Used items)
                  </option>
                  <option value="SMALL_SCALE">
                    🏪 Small Scale Business
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editingListing.categoryId}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      categoryId: e.target.value,
                      subCategoryId: "",
                    })
                  }
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="form-group full-width"
                style={{ gridColumn: "span 2" }}
              >
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editingListing.description}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      description: e.target.value,
                    })
                  }
                  required
                ></textarea>
              </div>

              <div
                className="form-group full-width"
                style={{ gridColumn: "span 2" }}
              >
                <label className="form-label">
                  Product Images (Max 10)
                </label>
                <MultiUploadComponent
                  folder="posts"
                  uploadedUrls={editImageFiles}
                  setUploadedUrls={setEditImageFiles}
                  maxFiles={10}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  gridColumn: "span 2",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingListing(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes & Resubmit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`mobile-drawer-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
          <div
            className="drawer-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Logo />
            <button
              className="drawer-close-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✖
            </button>
          </div>
          <div className="drawer-body">
            {user ? (
              <div className="drawer-profile-section">
                <div
                  className="drawer-avatar"
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                  }}
                >
                  {user.profilePicture ? (
                    <img
                      src={
                        user.profilePicture.startsWith("http")
                          ? user.profilePicture
                          : `${imageServer}${user.profilePicture}`
                      }
                      alt="Avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <div className="drawer-user-meta">
                  <div className="drawer-username">
                    {user.username ? user.username.split("@")[0] : "User"}
                  </div>
                  <div className="drawer-role-badge">{user.role}</div>
                </div>
              </div>
            ) : (
              <div className="drawer-profile-section">
                <div className="drawer-avatar">👤</div>
                <div className="drawer-user-meta">
                  <div className="drawer-username">Welcome Guest</div>
                  <div className="drawer-role-badge">GUEST</div>
                </div>
              </div>
            )}

            <div className="drawer-nav-list">
              <Link
                href="/"
                className="drawer-nav-item"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSelectedCatFilter(null);
                  setSelectedSubCatFilter(null);
                  setSearchQuery("");
                  setLocationFilter("");
                  setLocationSearchInput("");
                  fetchListings({
                    categoryId: null,
                    subCategoryId: null,
                    search: "",
                    location: "",
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                🏠 Home Feed
              </Link>
              {user ? (
                <>
                  {user.role === "ADMIN" ? (
                    <a
                      href="https://admin2.lowpriceplaces.com"
                      className="drawer-nav-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      📈 Admin Dashboard
                    </a>
                  ) : (
                    <Link
                      href="/dashboard/profile"
                      className="drawer-nav-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      👤 Profile & Listings
                    </Link>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "20px" }}
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="drawer-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔑 Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <div
          className={`mobile-bottom-nav-item ${pathname === "/" ? "active" : ""}`}
          onClick={() => {
            // Close subcategory overlay if open
            try {
              setSubCategoryView(null);
            } catch (e) {}
            // Reset all filter state
            try {
              setSelectedCatFilter(null);
            } catch (e) {}
            try {
              setSelectedSubCatFilter(null);
            } catch (e) {}
            try {
              setSearchQuery("");
            } catch (e) {}
            try {
              setLocationFilter("");
            } catch (e) {}
            try {
              setLocationSearchInput("");
            } catch (e) {}
            // If already on home page, just scroll & refetch
            if (pathname === "/") {
              try {
                fetchListings({
                  categoryId: null,
                  subCategoryId: null,
                  search: "",
                  location: "",
                });
              } catch (e) {}
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              // Navigate to home — use href for a clean state reset from deep pages
              router.push("/");
              setTimeout(
                () => window.scrollTo({ top: 0, behavior: "smooth" }),
                150,
              );
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">🏠</span>
          <span>Home</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${isChatOpen ? "active" : ""}`}
          onClick={() => {
            if (!user) {
              router.push("/login");
            } else {
              fetchUserChats();
              setIsChatOpen(true);
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">💬</span>
          <span>Chat</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${pathname === "/dashboard/add-listing" ? "active" : ""}`}
          onClick={() => {
            if (!user) {
              router.push("/login");
            } else {
              router.push("/dashboard/add-listing");
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">➕</span>
          <span>Post Ad</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${pathname === "/dashboard/bookmarks" || pathname === "/dashboard/saved" ? "active" : ""}`}
          onClick={() => {
            if (!user) {
              router.push("/login");
            } else {
              router.push("/dashboard/bookmarks");
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">❤️</span>
          <span>Shortlist</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${pathname.startsWith("/dashboard") && pathname !== "/dashboard/add-listing" && pathname !== "/dashboard/bookmarks" && pathname !== "/dashboard/saved" ? "active" : ""}`}
          onClick={() => {
            if (!user) {
              router.push("/login");
            } else {
              router.push("/dashboard/profile");
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">👤</span>
          <span>Profile</span>
        </div>
      </div>

      <ChatDrawer />
    </div>
  );
}
