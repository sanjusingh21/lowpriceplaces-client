"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import ChatDrawer from "@/components/ChatDrawer";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const {
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
    userMode,
    switchUserMode,
  } = useApp();

  // Unread chat/inquiry count
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    async function fetchUnread() {
      try {
        const data = user.role === 'SELLER'
          ? await api.getSellerInquiries()
          : await api.getBuyerInquiries();
        const unread = (data || []).filter(inq =>
          (user.role === 'SELLER' && !inq.isReadBySeller) ||
          (user.role === 'BUYER'  && !inq.isReadByBuyer)
        ).length;
        setUnreadCount(unread);
      } catch { setUnreadCount(0); }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (pathname === '/' && window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Click outside edit location dropdown
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [showEditLocDropdown, setShowEditLocDropdown] = useState(false);
  const [editLocSuggestions, setEditLocSuggestions] = useState([]);

  useEffect(() => {
    if (!editingListing?.location || editingListing.location.length < 2) {
      setEditLocSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(editingListing.location)}&limit=8&bbox=68.1,6.8,97.4,35.5`);
        const data = await res.json();
        const suggestionsList = data.features.map(f => {
          const props = f.properties;
          const name = props.name || '';
          const city = props.city || props.town || props.district || '';
          const state = props.state || '';
          const parts = [name, city, state].filter(p => p && p.trim() !== '');
          return [...new Set(parts)].join(', ');
        }).filter(Boolean);
        setEditLocSuggestions([...new Set(suggestionsList)]);
      } catch (e) {
        console.error("Photon geocoding error:", e);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [editingListing?.location]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.location-search-box') && !e.target.closest('.form-group')) {
        setShowEditLocDropdown(false);
      }
      if (!e.target.closest('.user-profile-dropdown-wrapper')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowLocationDropdown(false);
    setSuggestions([]);
    fetchListings();
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const handleSuggestionClick = (sug) => {
    setSearchQuery(sug.label);
    setSuggestions([]);
    if (sug.type === 'Listing') {
      router.push(`/details/${sug.id}`);
    } else if (sug.type === 'Category') {
      const cat = categories.find(c => c.id === sug.id);
      setSelectedCatFilter(cat);
      setSelectedSubCatFilter(null);
      router.push('/');
    } else if (sug.type === 'SubCategory') {
      const cat = categories.find(c => c.subCategories?.some(s => s.id === sug.id));
      const sub = cat?.subCategories?.find(s => s.id === sug.id);
      setSelectedCatFilter(cat || null);
      setSelectedSubCatFilter(sub || null);
      router.push('/');
    }
  };

  const handleSaveListingDetails = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', editingListing.title);
      formData.append('price', editingListing.price);
      formData.append('priceMax', editingListing.priceMax || '');
      formData.append('discountPercent', editingListing.discountPercent);
      formData.append('location', editingListing.location);
      formData.append('description', editingListing.description);
      formData.append('categoryId', editingListing.categoryId);

      if (editImageFiles && editImageFiles.length > 0) {
        for (let i = 0; i < editImageFiles.length; i++) {
          formData.append('image', editImageFiles[i]);
        }
      }

      await api.editListingDetails(editingListing.id, formData);
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
    const displayedLocations = locationSearchInput.length >= 2 && photonSuggestions.length > 0
      ? photonSuggestions
      : citiesList.map(c => c.name).filter(loc => loc.toLowerCase().includes(locationSearchInput.toLowerCase())).slice(0, 8);

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
              <div className="detect-location-item" onClick={detectUserLocation}>
                <span className="location-icon">🎯</span>
                Detect Location
              </div>
              {displayedLocations.length > 0 ? (
                displayedLocations.map((loc, i) => (
                  <div
                    key={i}
                    className="location-dropdown-item"
                    onClick={() => {
                      setLocationSearchInput(loc);
                      setLocationFilter(loc);
                      setShowLocationDropdown(false);
                      fetchListings({ location: loc });
                    }}
                  >
                    {loc}
                  </div>
                ))
              ) : (
                <div style={{ padding: '10px 16px', fontSize: "var(--font-helper)", color: 'var(--text-dim)' }}>
                  No matches found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="keyword-search-box" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: "var(--font-small)", marginLeft: '12px', color: 'var(--text-dim)', userSelect: 'none' }}>🔍</span>
          <input
            type="text"
            className="keyword-input"
            style={{ paddingLeft: '8px' }}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('');
                fetchListings({ search: '' });
              }}
              title="Clear Search"
            >
              ✖
            </button>
          )}

          <button type="submit" className="search-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map((sug, i) => (
                <div key={i} className="autocomplete-item" onClick={() => handleSuggestionClick(sug)}>
                  <span className="item-type">{sug.type}</span>
                  <span>{sug.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    );
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="spinner"></div>
          <span>Loading lowpriceplaces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Header (Amazon Style) */}
      <header className={`header-glass ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: "var(--font-h3)",
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ☰
          </button>
          <div className="brand-logo" onClick={() => {
            setSelectedCatFilter(null);
            setSelectedSubCatFilter(null);
            setSearchQuery("");
            setLocationFilter("");
            setLocationSearchInput("");
            fetchListings({ categoryId: null, subCategoryId: null, search: "", location: "" });
            router.push('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad" x1="31" y1="10" x2="79" y2="95" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--logo-blue)" />
                  <stop offset="1" stopColor="var(--logo-green)" />
                </linearGradient>
                <mask id="logo-mask">
                  <rect width="100" height="100" fill="white" />
                  <circle cx="43" cy="43" r="5.5" fill="black" />
                  <path d="M 53 62 L 49 68 M 58 64 L 54 70" stroke="black" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 47 70 L 63 62" stroke="black" strokeWidth="3.5" strokeLinecap="round" />
                </mask>
              </defs>
              <g mask="url(#logo-mask)">
                <path d="M 43 43 C 28 20, 56 6, 48 31" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 31 35 L 31 54 L 79 54 L 59 31 L 43 31 Z" fill="url(#logo-grad)" />
                <path d="M 31 60 L 42 60 L 42 72 L 31 72 Z" fill="url(#logo-grad)" />
                <path d="M 79 60 L 68 60 L 68 72 L 79 72 Z" fill="url(#logo-grad)" />
                <path d="M 46 60 C 46 60, 51 55, 55 57 C 59 59, 64 60, 64 60 L 64 72 C 64 72, 59 74, 55 72 C 51 70, 46 72, 46 72 Z" fill="url(#logo-grad)" />
                <path d="M 31 72 L 79 72 L 60 95 Z" fill="url(#logo-grad)" />
              </g>
            </svg>
            <span style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--logo-blue)' }}>low</span>
              <span style={{ color: 'var(--logo-green)', fontWeight: "var(--font-weight-bold)" }}>p</span>
              <span style={{ color: 'var(--logo-blue)' }}>riceplaces</span>
              <span style={{ color: 'var(--logo-gray)', fontSize: '0.75em', marginLeft: '1px' }}>.com</span>
            </span>
          </div>

          {pathname === '/' && (
            <div className="search-wrapper" style={{ flex: 1, maxWidth: '600px', height: '46px', display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
              {renderSearchForm()}
            </div>
          )}

          <div className="mobile-header-actions" style={{ display: 'none', marginLeft: 'auto', gap: '10px', alignItems: 'center' }}>
            {pathname !== '/' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: "var(--font-body)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  router.push('/');
                  setTimeout(() => {
                    const searchHero = document.querySelector('.mobile-search-hero');
                    if (searchHero) {
                      searchHero.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              style={{ padding: '6px 10px', fontSize: "var(--font-body)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>

          <div className="nav-actions">
            {pathname !== '/' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: "var(--font-body)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  router.push('/');
                  setTimeout(() => {
                    const searchHero = document.querySelector('.mobile-search-hero');
                    if (searchHero) {
                      searchHero.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              style={{ padding: '6px 10px', fontSize: "var(--font-body)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {(user.role === 'SELLER' || user.role === 'BUYER' || user.role === 'ADMIN') && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (!user) {
                        router.push('/login');
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
                      border: "1px solid var(--border-glass)"
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
                          border: "2.5px solid var(--bg-card-solid)"
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Avatar Profile Dropdown */}
                <div className="user-profile-dropdown-wrapper" style={{ position: "relative" }}>
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
                      transition: "var(--transition)"
                    }}
                  >
                    <img
                      src={user.profilePicture || "https://placehold.co/100x100?text=User"}
                      alt={user.fullName || user.username}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid var(--border-glass)"
                      }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/100x100?text=U";
                      }}
                    />
                    <span style={{ fontSize: "var(--font-caption)", color: "var(--text-main)" }}>▼</span>
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
                        borderRadius: "12px"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <strong style={{ fontSize: "var(--font-small)", color: "var(--text-main)" }}>
                          {user.fullName || (user.username ? user.username.split('@')[0] : 'User')}
                        </strong>
                        <span style={{ fontSize: "var(--font-caption)", color: "var(--text-dim)", wordBreak: "break-all" }}>
                          {user.email || user.username}
                        </span>
                      </div>
                      <hr style={{ border: "none", borderTop: "1px solid var(--border-glass)", margin: 0 }} />
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowUserDropdown(false);
                          if (user.role === 'ADMIN') {
                            window.location.href = 'https://admin2.lowpriceplaces.com';
                          } else {
                            router.push('/dashboard/profile');
                          }
                        }}
                        style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "var(--font-caption)" }}
                      >
                        👤 {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Profile Settings'}
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        style={{ width: "100%", justifyContent: "center", padding: "8px 12px", fontSize: "var(--font-caption)" }}
                      >
                        🚪 Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => router.push('/login')}>Sign In</button>
                <button className="btn btn-primary" onClick={() => router.push('/register')}>Register</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="content-wrapper">
        {pathname === '/' && (
          <div className="mobile-search-hero">
            {renderSearchForm()}
          </div>
        )}
        {children}
      </main>

      <footer className="app-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-glass)', padding: '24px 0', background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: "var(--font-helper)", color: 'var(--text-dim)' }}>
            © 2026 lowpriceplaces Classifieds. Local advertisements and connections for budget deals.
          </span>
          <span style={{ fontSize: "var(--font-helper)", display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', flexShrink: 0 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <a href="mailto:support@lowpriceplaces.com" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: "var(--font-weight-semibold)" }}>support@lowpriceplaces.com</a>
          </span>
        </div>
      </footer>

      {/* SELLER EDIT LISTING MODAL */}
      {editingListing && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '90%', maxWidth: '600px', background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: "var(--font-h4)" }}>Edit Product: LPP-{String(editingListing.id).padStart(5, '0')}</h2>
              <button className="btn btn-secondary" onClick={() => setEditingListing(null)}>✖</button>
            </div>

            <form onSubmit={handleSaveListingDetails} className="form-grid">
              <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Product Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingListing.title}
                  onChange={(e) => setEditingListing({ ...editingListing, title: e.target.value })}
                  required
                />
              </div>

               <div className="form-group">
                 <label className="form-label">Price Range (₹)</label>
                 <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                   <input
                     type="number"
                     className="form-input"
                     placeholder="From"
                     value={editingListing.price || ""}
                     onChange={(e) => setEditingListing({ ...editingListing, price: e.target.value })}
                     required
                     style={{ flex: 1 }}
                   />
                   <span style={{ color: "var(--text-muted)" }}>to</span>
                   <input
                     type="number"
                     className="form-input"
                     placeholder="To"
                     value={editingListing.priceMax || ""}
                     onChange={(e) => setEditingListing({ ...editingListing, priceMax: e.target.value })}
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
                  onChange={(e) => setEditingListing({ ...editingListing, discountPercent: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Location (Area, City, State)</label>
                  <span
                    onClick={async () => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(async (position) => {
                          const { latitude, longitude } = position.coords;
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                            const data = await res.json();
                            const area = data.address.suburb || data.address.neighbourhood || data.address.road || '';
                            const city = data.address.city || data.address.town || data.address.village || '';
                            const state = data.address.state || '';
                            const parts = [area, city, state].filter(p => p && p.trim() !== '');
                            const formatted = parts.join(', ');
                            setEditingListing({ ...editingListing, location: formatted || 'Hyderabad, Telangana' });
                          } catch (e) {
                            console.error(e);
                          }
                        });
                      }
                    }}
                    style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', fontWeight: "var(--font-weight-semibold)" }}
                  >
                    📍 Auto-fill GPS
                  </span>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Madhapur, Hyderabad, Telangana"
                  value={editingListing.location || ''}
                  onChange={(e) => {
                    setEditingListing({ ...editingListing, location: e.target.value });
                    setShowEditLocDropdown(true);
                  }}
                  onFocus={() => setShowEditLocDropdown(true)}
                  required
                />
                {showEditLocDropdown && editLocSuggestions.length > 0 && (
                  <div className="location-dropdown" style={{ width: '100%', top: 'calc(100% - 2px)' }}>
                    {editLocSuggestions.map((loc, i) => (
                      <div
                        key={i}
                        className="location-dropdown-item"
                        onClick={() => {
                          setEditingListing({ ...editingListing, location: loc });
                          setShowEditLocDropdown(false);
                        }}
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>

               <div className="form-group">
                 <label className="form-label">Listing Type</label>
                 <select
                   className="form-select"
                   value={editingListing.listingType || "SALES"}
                   onChange={(e) => setEditingListing({ ...editingListing, listingType: e.target.value })}
                   required
                 >
                   <option value="SALES">🛍️ Sales (New products)</option>
                   <option value="SERVICES">💼 Work & Services</option>
                   <option value="SECONDHAND">♻️ Second-Hand (Used items)</option>
                 </select>
               </div>

               <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editingListing.categoryId}
                  onChange={(e) => setEditingListing({ ...editingListing, categoryId: e.target.value, subCategoryId: '' })}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editingListing.description}
                  onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Upload New Product Images (Max 10) (Replaces existing)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-input"
                  onChange={(e) => setEditImageFiles(e.target.files)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', gridColumn: 'span 2', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingListing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes & Resubmit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div className="brand-logo" style={{ fontSize: "var(--font-h4)" }} onClick={() => {
              setMobileMenuOpen(false);
              setSelectedCatFilter(null);
              setSelectedSubCatFilter(null);
              setSearchQuery("");
              setLocationFilter("");
              setLocationSearchInput("");
              fetchListings({ categoryId: null, subCategoryId: null, search: "", location: "" });
              router.push('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <span style={{ fontSize: "var(--font-h5)" }}>🛍️</span>
              <span style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--logo-blue)' }}>low</span>
                <span style={{ color: 'var(--logo-green)', fontWeight: "var(--font-weight-bold)" }}>p</span>
                <span style={{ color: 'var(--logo-blue)' }}>riceplaces</span>
                <span style={{ color: 'var(--logo-gray)', fontSize: '0.75em', marginLeft: '1px' }}>.com</span>
              </span>
            </div>
            <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>✖</button>
          </div>
          <div className="drawer-body">
            {user ? (
              <div className="drawer-profile-section">
                <div className="drawer-avatar">👤</div>
                <div className="drawer-user-meta">
                  <div className="drawer-username">{user.username ? user.username.split('@')[0] : 'User'}</div>
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
              <Link href="/" className="drawer-nav-item" onClick={() => {
                setMobileMenuOpen(false);
                setSelectedCatFilter(null);
                setSelectedSubCatFilter(null);
                setSearchQuery("");
                setLocationFilter("");
                setLocationSearchInput("");
                fetchListings({ categoryId: null, subCategoryId: null, search: "", location: "" });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                🏠 Home Feed
              </Link>
              {user ? (
                <>
                  {user.role === 'ADMIN' ? (
                    <a href="https://admin2.lowpriceplaces.com" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      📈 Admin Dashboard
                    </a>
                  ) : (
                    (user.role === 'SELLER' || user.role === 'BUYER') && (
                      <Link href={`/dashboard/${user.role === 'SELLER' ? 'my-listings' : 'inquiries'}`} className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                        📈 Profile
                      </Link>
                    )
                  )}
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => { logout(); setMobileMenuOpen(false); }}>
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    🔑 Sign In
                  </Link>
                  <Link href="/register" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    ➕ Register
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
          className={`mobile-bottom-nav-item ${pathname === '/' ? 'active' : ''}`}
          onClick={() => {
            // Close subcategory overlay if open
            try { setSubCategoryView(null); } catch(e) {}
            // Reset all filter state
            try { setSelectedCatFilter(null); } catch(e) {}
            try { setSelectedSubCatFilter(null); } catch(e) {}
            try { setSearchQuery(""); } catch(e) {}
            try { setLocationFilter(""); } catch(e) {}
            try { setLocationSearchInput(""); } catch(e) {}
            // If already on home page, just scroll & refetch
            if (pathname === '/') {
              try { fetchListings({ categoryId: null, subCategoryId: null, search: "", location: "" }); } catch(e) {}
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              // Navigate to home — use href for a clean state reset from deep pages
              router.push('/');
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 150);
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">🏠</span>
          <span>Home</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${isChatOpen ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              router.push('/login');
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
          className={`mobile-bottom-nav-item ${pathname === '/dashboard/add-listing' ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              router.push('/login');
            } else if (user.role === 'SELLER') {
              router.push('/dashboard/add-listing');
            } else {
              alert("Only registered sellers can post listings. Check your profile settings.");
              router.push(`/dashboard/${user.role === 'ADMIN' ? 'cities' : 'inquiries'}`);
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">➕</span>
          <span>Post Ad</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${pathname === '/dashboard/bookmarks' || pathname === '/dashboard/saved' ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              router.push('/login');
            } else {
              router.push('/dashboard/bookmarks');
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">❤️</span>
          <span>Shortlist</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${pathname.startsWith('/dashboard') && pathname !== '/dashboard/add-listing' && pathname !== '/dashboard/bookmarks' && pathname !== '/dashboard/saved' ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              router.push('/login');
            } else {
              router.push('/dashboard/profile');
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
