"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";
  const {
    listings,
    nearbyListings,
    categories,
    citiesList,
    loading,
    locationFilter,
    setLocationFilter,
    setLocationSearchInput,
    selectedCatFilter,
    setSelectedCatFilter,
    selectedSubCatFilter,
    setSelectedSubCatFilter,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    discountOnly,
    setDiscountOnly,
    selectedDateFilter,
    setSelectedDateFilter,
    customDateInput,
    setCustomDateInput,
    selectedSortBy,
    setSelectedSortBy,
    currentPage,
    setCurrentPage,
    currentNearbyPage,
    setCurrentNearbyPage,
    mobileFiltersOpen,
    setMobileFiltersOpen,
    fetchListings,
    handleClearAllFilters,
    isAnyFilterApplied,
    detectUserLocation,
    extractParentCity
  } = useApp();

  const ITEMS_PER_PAGE = 20;

  // Fetch listings on initial load
  useEffect(() => {
    fetchListings();
  }, []);

  const getCityEmoji = (city) => {
    const found = citiesList.find((c) => c.name.toLowerCase() === city.toLowerCase());
    return found ? found.emoji : "📍";
  };

  const renderFilterContent = (isMobile = false) => {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
          <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)" }}>Filters</span>
          <span
            onClick={() => {
              handleClearAllFilters();
              if (isMobile) setMobileFiltersOpen(false);
            }}
            style={{ fontSize: "12px", color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}
          >
            Clear All
          </span>
        </div>

        <div className="filter-group">
          <div className="filter-title">Sort By</div>
          <select
            className="form-select"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", fontSize: "13px" }}
            value={selectedSortBy}
            onChange={(e) => setSelectedSortBy(e.target.value)}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        <div className="filter-group">
          <div className="filter-title">Posted Date</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter === ""}
                onChange={() => setSelectedDateFilter("")}
              />
              All Time
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter === "today"}
                onChange={() => setSelectedDateFilter("today")}
              />
              Today
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter === "yesterday"}
                onChange={() => setSelectedDateFilter("yesterday")}
              />
              Yesterday
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter !== "" && selectedDateFilter !== "today" && selectedDateFilter !== "yesterday"}
                onChange={() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  setSelectedDateFilter(todayStr);
                  setCustomDateInput(todayStr);
                }}
              />
              Specific Date
            </label>

            {selectedDateFilter !== "" && selectedDateFilter !== "today" && selectedDateFilter !== "yesterday" && (
              <input
                type="date"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "8px",
                  padding: "6px 8px",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
                value={customDateInput}
                onChange={(e) => {
                  const dateVal = e.target.value;
                  setCustomDateInput(dateVal);
                  setSelectedDateFilter(dateVal);
                }}
              />
            )}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-title">Price Range (₹)</div>
          <div className="price-range-inputs">
            <input
              type="number"
              placeholder="Min"
              className="price-input"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span style={{ color: "var(--text-dim)" }}>-</span>
            <input
              type="number"
              placeholder="Max"
              className="price-input"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id={isMobile ? "mobile-discount-check" : "discount-check"}
            checked={discountOnly}
            onChange={(e) => setDiscountOnly(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <label htmlFor={isMobile ? "mobile-discount-check" : "discount-check"} style={{ fontSize: "14px", color: "var(--text-muted)", cursor: "pointer" }}>
            Discounted Deals Only
          </label>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "8px" }}
          onClick={() => {
            fetchListings();
            if (isMobile) setMobileFiltersOpen(false);
          }}
        >
          Apply Filters
        </button>
      </>
    );
  };

  return (
    <div className="home-content-container">
      {/* Top Categories Grid Bar */}
      <div className="glass-panel mobile-flat-panel" style={{ padding: "24px" }}>
        <div className="mobile-section-title" style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
          📁 Browse Categories
        </div>
        <div className="category-bar-grid">
          <div
            className="category-bar-item"
            onClick={() => {
              setSelectedCatFilter(null);
              setSelectedSubCatFilter(null);
              fetchListings({ categoryId: null, subCategoryId: null });
            }}
          >
            <div className={`category-bar-icon-box ${!selectedCatFilter ? "active" : ""}`}>
              <span className="category-bar-emoji">☰</span>
            </div>
            <span className="category-bar-label">All Categories</span>
          </div>

          {categories.map((cat) => {
            const isSelected = selectedCatFilter?.id === cat.id;
            return (
              <div
                key={cat.id}
                className="category-bar-item"
                onClick={() => {
                  if (isSelected) {
                    setSelectedCatFilter(null);
                    setSelectedSubCatFilter(null);
                    fetchListings({ categoryId: null, subCategoryId: null });
                  } else {
                    setSelectedCatFilter(cat);
                    setSelectedSubCatFilter(null);
                    fetchListings({ categoryId: cat.id, subCategoryId: null });
                  }
                }}
              >
                <div className={`category-bar-icon-box ${isSelected ? "active" : ""}`}>
                  {cat.imagePath ? (
                    <img
                      src={`${imageServer}${cat.imagePath}`}
                      alt={cat.name}
                      className="category-bar-image"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallbackSpan = e.target.nextSibling;
                        if (fallbackSpan) fallbackSpan.style.display = 'inline';
                      }}
                    />
                  ) : null}
                  <span className="category-bar-emoji" style={{ display: cat.imagePath ? "none" : "inline" }}>
                    {cat.emoji || "📁"}
                  </span>
                </div>
                <span className="category-bar-label">{cat.name}</span>
              </div>
            );
          })}
        </div>

        {/* Subcategories Pills bar */}
        {selectedCatFilter && selectedCatFilter.subCategories?.length > 0 && (
          <div className="subcategory-bar-pills">
            <span className="subcategory-title">Subcategories:</span>
            <div className="subcategory-pills-row">
              {selectedCatFilter.subCategories.map((sub) => {
                const isSubSelected = selectedSubCatFilter?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    className={`subcategory-pill-btn ${isSubSelected ? "active" : ""}`}
                    onClick={() => {
                      if (isSubSelected) {
                        setSelectedSubCatFilter(null);
                        fetchListings({ subCategoryId: null });
                      } else {
                        setSelectedSubCatFilter(sub);
                        fetchListings({ subCategoryId: sub.id });
                      }
                    }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>{sub.emoji || "🔹"}</span>
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Explore by City Grid Bar */}
      <div className="glass-panel mobile-flat-panel" style={{ padding: "20px 24px" }}>
        <div className="mobile-city-title" style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
          📍 Explore by City
        </div>
        <div className="category-bar-grid">
          <div
            className="category-bar-item"
            onClick={() => {
              setLocationFilter("India");
              setLocationSearchInput("India");
              fetchListings({ location: "India" });
            }}
          >
            <div className={`category-bar-icon-box ${!locationFilter || locationFilter.toLowerCase() === "india" ? "active" : ""}`} style={{ width: "48px", height: "48px", borderRadius: "12px" }}>
              <span className="category-bar-emoji" style={{ fontSize: "18px" }}>🇮🇳</span>
            </div>
            <span className="category-bar-label" style={{ fontSize: "12px" }}>All India</span>
          </div>

          {citiesList.map((c) => c.name).map((city) => {
            const isSelected = locationFilter?.toLowerCase() === city.toLowerCase();
            return (
              <div
                key={city}
                className="category-bar-item"
                onClick={() => {
                  setLocationFilter(city);
                  setLocationSearchInput(city);
                  fetchListings({ location: city });
                }}
              >
                <div className={`category-bar-icon-box ${isSelected ? "active" : ""}`} style={{ width: "48px", height: "48px", borderRadius: "12px" }}>
                  <span className="category-bar-emoji" style={{ fontSize: "20px" }}>{getCityEmoji(city)}</span>
                </div>
                <span className="category-bar-label" style={{ fontSize: "12px" }}>{city}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-layout">
        {/* Sidebar Filters */}
        <aside className="sidebar-filter">{renderFilterContent(false)}</aside>

        {/* Product Feed Grid */}
        <section className="products-section">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "24px" }}>
                {selectedSubCatFilter ? selectedSubCatFilter.name : selectedCatFilter ? selectedCatFilter.name : "Featured Listings"}
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                {listings.length} exact match(es) found
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading items...</div>
          ) : listings.length === 0 && nearbyListings.length === 0 ? (
            <div className="glass-panel" style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{ fontSize: "15px" }}>
                No active listings found matching the query. Try broadening your keywords.
              </div>
              {isAnyFilterApplied && (
                <button
                  className="btn btn-primary"
                  onClick={handleClearAllFilters}
                  style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "8px" }}
                >
                  Reset & Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* Exact Locality Matches */}
              {listings.length > 0 ? (
                <div>
                  <div className="products-grid">
                    {listings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((item) => (
                      <ProductCard key={item.id} item={item} />
                    ))}
                  </div>
                  {/* Pagination Controls */}
                  {listings.length > ITEMS_PER_PAGE && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </button>
                      {[...Array(Math.ceil(listings.length / ITEMS_PER_PAGE))].map((_, i) => (
                        <button
                          key={i}
                          className={`btn ${currentPage === i + 1 ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "6px 12px", fontSize: "13px", minWidth: "32px" }}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                        disabled={currentPage === Math.ceil(listings.length / ITEMS_PER_PAGE)}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(listings.length / ITEMS_PER_PAGE)))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                locationFilter && (
                  <div className="glass-panel" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                    No direct listings found in <strong>{locationFilter}</strong>.
                  </div>
                )
              )}

              {/* Nearby City-Wide Matches Fallback */}
              {nearbyListings.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "24px" }}>
                  <h2 style={{ fontSize: "20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)" }}>
                    🗺️ Nearby Listings in {extractParentCity(locationFilter)}
                  </h2>
                  <div className="products-grid">
                    {nearbyListings.slice((currentNearbyPage - 1) * ITEMS_PER_PAGE, currentNearbyPage * ITEMS_PER_PAGE).map((item) => (
                      <ProductCard key={item.id} item={item} />
                    ))}
                  </div>
                  {/* Pagination Controls */}
                  {nearbyListings.length > ITEMS_PER_PAGE && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                        disabled={currentNearbyPage === 1}
                        onClick={() => setCurrentNearbyPage((prev) => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </button>
                      {[...Array(Math.ceil(nearbyListings.length / ITEMS_PER_PAGE))].map((_, i) => (
                        <button
                          key={i}
                          className={`btn ${currentNearbyPage === i + 1 ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "6px 12px", fontSize: "13px", minWidth: "32px" }}
                          onClick={() => setCurrentNearbyPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                        disabled={currentNearbyPage === Math.ceil(nearbyListings.length / ITEMS_PER_PAGE)}
                        onClick={() => setCurrentNearbyPage((prev) => Math.min(prev + 1, Math.ceil(nearbyListings.length / ITEMS_PER_PAGE)))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Bottom Filter Drawer */}
      <div className={`mobile-filter-drawer-overlay ${mobileFiltersOpen ? "open" : ""}`} onClick={() => setMobileFiltersOpen(false)}>
        <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)" }}>Filter Listings</span>
            <button className="drawer-close-btn" onClick={() => setMobileFiltersOpen(false)}>✖</button>
          </div>
          <div className="drawer-body" style={{ maxHeight: "70vh", overflowY: "auto", padding: "16px" }}>
            {renderFilterContent(true)}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Mobile Filter Button */}
      <div className="mobile-filter-floating-bar">
        <button className="mobile-floating-btn" onClick={() => setMobileFiltersOpen(true)}>
          ⚡ Filters & Sort {isAnyFilterApplied && <span className="filter-active-dot"></span>}
        </button>
      </div>
    </div>
  );
}
