"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";

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
    detectUserLocation
  } = useApp();

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
      formData.append('discountPercent', editingListing.discountPercent);
      formData.append('location', editingListing.location);
      formData.append('description', editingListing.description);
      formData.append('categoryId', editingListing.categoryId);

      if (editImageFiles && editImageFiles.length > 0) {
        for (let i = 0; i < editImageFiles.length; i++) {
          formData.append('images', editImageFiles[i]);
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
                <div style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>
                  No matches found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="keyword-search-box" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '14px', marginLeft: '12px', color: 'var(--text-dim)', userSelect: 'none' }}>🔍</span>
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
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ☰
          </button>
          <div className="brand-logo" onClick={() => { setSelectedCatFilter(null); setSelectedSubCatFilter(null); fetchListings({ categoryId: null, subCategoryId: null }); router.push('/'); }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad" x1="31" y1="10" x2="79" y2="95" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#ec4899" />
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
            lowpriceplaces
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
                style={{ padding: '6px 10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              style={{ padding: '6px 10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                style={{ padding: '6px 10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              style={{ padding: '6px 10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {user ? (
              <>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Hello, <strong style={{ color: 'var(--text-main)' }}>{user.username ? user.username.split('@')[0] : ''}</strong> ({user.role})
                </span>

                {(user.role === 'SELLER' || user.role === 'BUYER' || user.role === 'ADMIN') && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (user.role === 'ADMIN') {
                        window.location.href = 'https://admin2.lowpriceplaces.com';
                      } else {
                        router.push(`/dashboard/${user.role === 'SELLER' ? 'my-listings' : 'inquiries'}`);
                      }
                    }}
                  >
                    {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Profile'}
                  </button>
                )}

                <button className="btn btn-primary" onClick={logout}>
                  Log Out
                </button>
              </>
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
        {children}
      </main>

      <footer className="app-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-glass)', padding: '24px 0', background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
            © 2026 lowpriceplaces Classifieds. Local advertisements and connections for budget deals.
          </span>
          <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', flexShrink: 0 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <a href="mailto:support@lowpriceplaces.com" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>support@lowpriceplaces.com</a>
          </span>
        </div>
      </footer>

      {/* SELLER EDIT LISTING MODAL */}
      {editingListing && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '90%', maxWidth: '600px', background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px' }}>Edit Product: LPP-{String(editingListing.id).padStart(5, '0')}</h2>
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
                <label className="form-label">Price (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingListing.price}
                  onChange={(e) => setEditingListing({ ...editingListing, price: e.target.value })}
                  required
                />
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
                    style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
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
            <div className="brand-logo" style={{ fontSize: '20px' }} onClick={() => { setMobileMenuOpen(false); router.push('/'); }}>
              <span style={{ fontSize: '18px' }}>🛍️</span>
              <span>lowpriceplaces</span>
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
              <Link href="/" className="drawer-nav-item" onClick={() => { setMobileMenuOpen(false); setSelectedCatFilter(null); setSelectedSubCatFilter(null); fetchListings(); }}>
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
          onClick={() => { router.push('/'); }}
        >
          <span className="mobile-bottom-nav-icon">🏠</span>
          <span>Home</span>
        </div>
        <div
          className="mobile-bottom-nav-item"
          onClick={() => {
            router.push('/');
            setTimeout(() => {
              const searchHero = document.querySelector('.mobile-search-hero');
              if (searchHero) {
                searchHero.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 200);
          }}
        >
          <span className="mobile-bottom-nav-icon">🔍</span>
          <span>Search</span>
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
            } else if (user.role === 'BUYER') {
              router.push('/dashboard/bookmarks');
            } else {
              router.push(`/dashboard/${user.role === 'ADMIN' ? 'cities' : 'my-listings'}`);
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
              router.push(`/dashboard/${user.role === 'ADMIN' ? 'cities' : (user.role === 'SELLER' ? 'my-listings' : 'inquiries')}`);
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">👤</span>
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
}
