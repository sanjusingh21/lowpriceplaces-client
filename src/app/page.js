"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useApp } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";
import { api } from "@/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getImageSrcSet } from "@/utils/image";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";

function HomeContent() {
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
    searchQuery,
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
    extractParentCity,
    userCoords,
    setUserCoords,
    subCategoryView,
    setSubCategoryView,
    subCategoryViewLoading,
    setSubCategoryViewLoading,
    user,
    userMode,
    switchUserMode,
    sellerListings,
    fetchSellerListings,
    sellerInquiries,
    fetchInquiries,
  } = useApp();

  const ITEMS_PER_PAGE = 20;

  const [nearbyStores, setNearbyStores] = useState([]);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [activeSegmentTab, setActiveSegmentTab] = useState("SALES");
  const [subViewVisible, setSubViewVisible] = useState(false); // for fade animation
  const [showAllCitiesModal, setShowAllCitiesModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const savedScrollY = useRef(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryScrollRef = useRef(null);
  const subcategoryScrollRef = useRef(null);
  const cityScrollRef = useRef(null);
  const storesScrollRef = useRef(null);
  const dealsScrollRef = useRef(null);
  const secondHandScrollRef = useRef(null);
  const jobsScrollRef = useRef(null);

  const [showLeftCat, setShowLeftCat] = useState(false);
  const [showRightCat, setShowRightCat] = useState(true);

  const [showLeftCity, setShowLeftCity] = useState(false);
  const [showRightCity, setShowRightCity] = useState(true);

  const [showLeftSubCat, setShowLeftSubCat] = useState(false);
  const [showRightSubCat, setShowRightSubCat] = useState(true);

  const [showLeftStores, setShowLeftStores] = useState(false);
  const [showRightStores, setShowRightStores] = useState(true);

  const [showLeftDeals, setShowLeftDeals] = useState(false);
  const [showRightDeals, setShowRightDeals] = useState(true);

  const [showLeftSecondHand, setShowLeftSecondHand] = useState(false);
  const [showRightSecondHand, setShowRightSecondHand] = useState(true);

  const [showLeftJobs, setShowLeftJobs] = useState(false);
  const [showRightJobs, setShowRightJobs] = useState(true);

  const updateArrowVisibility = (ref, setLeft, setRight) => {
    const el = ref.current;
    if (el) {
      setLeft(el.scrollLeft > 5);
      setRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    }
  };

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrowVisibility(categoryScrollRef, setShowLeftCat, setShowRightCat);
      updateArrowVisibility(cityScrollRef, setShowLeftCity, setShowRightCity);
      if (selectedCatFilter && selectedCatFilter.subCategories?.length > 0) {
        updateArrowVisibility(subcategoryScrollRef, setShowLeftSubCat, setShowRightSubCat);
      }
      updateArrowVisibility(storesScrollRef, setShowLeftStores, setShowRightStores);
      updateArrowVisibility(dealsScrollRef, setShowLeftDeals, setShowRightDeals);
      updateArrowVisibility(secondHandScrollRef, setShowLeftSecondHand, setShowRightSecondHand);
      updateArrowVisibility(jobsScrollRef, setShowLeftJobs, setShowRightJobs);
    }, 500);
    return () => clearTimeout(timer);
  }, [categories, citiesList, nearbyStores, listings, selectedCatFilter]);

  // Auto-apply category filter from URL params (e.g. coming from /categories page)
  useEffect(() => {
    const catId = searchParams.get("categoryId");
    const subId = searchParams.get("subCategoryId");
    if (catId && categories.length > 0) {
      const cat = categories.find((c) => c.id === parseInt(catId));
      if (cat) {
        setSelectedCatFilter(cat);
        if (subId) {
          const sub = (cat.subCategories || []).find((s) => s.id === parseInt(subId));
          if (sub) setSelectedSubCatFilter(sub);
        }
        fetchListings({ categoryId: parseInt(catId), subCategoryId: subId ? parseInt(subId) : null });
        setTimeout(() => scrollToTabSection(), 400);
      }
    }
  }, [searchParams, categories]);

  useEffect(() => {
    if (userMode === "SELLER" && user) {
      fetchSellerListings();
      fetchInquiries();
    }
  }, [userMode, user]);

  const scrollToTabSection = () => {
    setTimeout(() => {
      const element = document.getElementById("segmented-toggle-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Enter focused subcategory view
  const enterSubCategoryView = async (cat, sub) => {
    savedScrollY.current = window.scrollY;
    setSubCategoryView({ category: cat, subcategory: sub, listings: [] });
    setSubCategoryViewLoading(true);
    setSubViewVisible(false);
    // scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const data = await api.getListings({
        categoryId: cat.id,
        subCategoryId: sub.id,
        status: "ACTIVE",
        limit: 100,
      });
      setSubCategoryView({ category: cat, subcategory: sub, listings: data });
    } catch (e) {
      setSubCategoryView({ category: cat, subcategory: sub, listings: [] });
    } finally {
      setSubCategoryViewLoading(false);
      // trigger fade-in after brief delay
      setTimeout(() => setSubViewVisible(true), 40);
    }
  };

  // Exit focused subcategory view and restore scroll
  const exitSubCategoryView = () => {
    setSubViewVisible(false);
    setTimeout(() => {
      setSubCategoryView(null);
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollY.current, behavior: "instant" });
      });
    }, 220);
  };

  const handleDragScroll = (e) => {
    const slider = e.currentTarget;
    slider.isDown = true;
    slider.classList.add('active');
    slider.startX = e.pageX - slider.offsetLeft;
    slider.scrollLeftStart = slider.scrollLeft;
  };

  const handleDragScrollLeaveOrUp = (e) => {
    const slider = e.currentTarget;
    slider.isDown = false;
    slider.classList.remove('active');
  };

  const handleDragScrollMove = (e) => {
    const slider = e.currentTarget;
    if (!slider.isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - slider.startX) * 1.5; // scroll speed multiplier
    slider.scrollLeft = slider.scrollLeftStart - walk;
  };

  const getTabForCategory = (cat) => {
    if (!cat) return "SALES";
    const name = (cat.name || "").toLowerCase();
    const slug = (cat.slug || "").toLowerCase();

    if (
      slug.includes("service") || 
      name.includes("service") ||
      slug.includes("education") || 
      name.includes("education") ||
      slug.includes("beauty") || 
      name.includes("beauty") ||
      slug.includes("hospital") || 
      name.includes("hospital") ||
      slug.includes("repair") || 
      name.includes("repair") ||
      slug.includes("work") || 
      name.includes("work") ||
      slug.includes("business") || 
      name.includes("business") ||
      slug.includes("spa") ||
      name.includes("spa") ||
      slug.includes("salon") ||
      name.includes("salon")
    ) {
      return "SERVICES";
    }

    if (
      slug.includes("second") || 
      name.includes("second") ||
      slug.includes("used") || 
      name.includes("used")
    ) {
      return "SECONDHAND";
    }

    return "SALES";
  };

  const getCombinedFilteredListings = (type) => {
    const direct = listings.filter(item => (item.listingType || "SALES") === type && item.status === "ACTIVE");
    const nearby = nearbyListings.filter(item => (item.listingType || "SALES") === type && item.status === "ACTIVE");
    
    const combined = [...direct];
    const directIds = new Set(direct.map(item => item.id));
    for (const item of nearby) {
      if (!directIds.has(item.id)) {
        combined.push(item);
      }
    }
    
    return combined.filter((item) => {
      if (selectedCatFilter && item.categoryId !== selectedCatFilter.id) return false;
      if (selectedSubCatFilter && item.subCategoryId !== selectedSubCatFilter.id) return false;
      
      if (locationFilter && locationFilter.toLowerCase() !== "india") {
        const itemLoc = (item.location || "").toLowerCase();
        if (!itemLoc.includes(locationFilter.toLowerCase())) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const descMatch = (item.description || "").toLowerCase().includes(q);
        const catMatch = item.category?.name?.toLowerCase().includes(q);
        const subCatMatch = item.subCategory?.name?.toLowerCase().includes(q);
        const locMatch = (item.location || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch && !subCatMatch && !locMatch) return false;
      }

      if (minPrice && item.price < parseFloat(minPrice)) return false;
      if (maxPrice && item.price > parseFloat(maxPrice)) return false;

      if (discountOnly && (!item.discountPercent || item.discountPercent <= 0)) return false;

      if (selectedDateFilter) {
        const itemDateStr = new Date(item.createdAt).toISOString().split("T")[0];
        if (selectedDateFilter === "today") {
          const todayStr = new Date().toISOString().split("T")[0];
          if (itemDateStr !== todayStr) return false;
        } else if (selectedDateFilter === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          if (itemDateStr !== yesterdayStr) return false;
        } else {
          if (itemDateStr !== selectedDateFilter) return false;
        }
      }

      return true;
    });
  };

  const salesListings = getCombinedFilteredListings("SALES");
  const secondhandListings = getCombinedFilteredListings("SECONDHAND");
  const jobsListings = getCombinedFilteredListings("SERVICES");

  const getFilteredListingsForGrid = (sourceArray, type) => {
    return sourceArray.filter((item) => {
      const itemType = item.listingType || "SALES";
      if (itemType !== type) return false;
      if (item.status !== "ACTIVE") return false;
      if (selectedCatFilter && item.categoryId !== selectedCatFilter.id) return false;
      if (selectedSubCatFilter && item.subCategoryId !== selectedSubCatFilter.id) return false;
      
      if (locationFilter && locationFilter.toLowerCase() !== "india") {
        const itemLoc = (item.location || "").toLowerCase();
        if (!itemLoc.includes(locationFilter.toLowerCase())) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const descMatch = (item.description || "").toLowerCase().includes(q);
        const catMatch = item.category?.name?.toLowerCase().includes(q);
        const subCatMatch = item.subCategory?.name?.toLowerCase().includes(q);
        const locMatch = (item.location || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch && !subCatMatch && !locMatch) return false;
      }

      if (minPrice && item.price < parseFloat(minPrice)) return false;
      if (maxPrice && item.price > parseFloat(maxPrice)) return false;

      if (discountOnly && (!item.discountPercent || item.discountPercent <= 0)) return false;

      if (selectedDateFilter) {
        const itemDateStr = new Date(item.createdAt).toISOString().split("T")[0];
        if (selectedDateFilter === "today") {
          const todayStr = new Date().toISOString().split("T")[0];
          if (itemDateStr !== todayStr) return false;
        } else if (selectedDateFilter === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          if (itemDateStr !== yesterdayStr) return false;
        } else {
          if (itemDateStr !== selectedDateFilter) return false;
        }
      }

      return true;
    });
  };

  const filteredListings = getFilteredListingsForGrid(listings, activeSegmentTab);
  const filteredNearbyListings = getFilteredListingsForGrid(nearbyListings, activeSegmentTab);

  useEffect(() => {
    setCurrentPage(1);
    setCurrentNearbyPage(1);
  }, [activeSegmentTab]);

  useEffect(() => {
    async function loadStoresAndServices() {
      try {
        const storesData = await api.getStores({
          lat: userCoords?.lat,
          lng: userCoords?.lng
        });
        setNearbyStores(storesData);

        const servicesData = await api.getServices({
          lat: userCoords?.lat,
          lng: userCoords?.lng
        });
        setNearbyServices(servicesData);
      } catch (err) {
        console.error("Failed to load stores/services:", err);
      }
    }
    if (userCoords) {
      loadStoresAndServices();
    }
  }, [userCoords]);

  const handleSecondHandClick = (catName) => {
    let matchedCat = null;
    let matchedSub = null;
    const lowerName = catName.toLowerCase();

    const searchMap = {
      "mobiles": "mobile-phones",
      "laptops": "laptops",
      "bikes": "motorcycles",
      "cars": "cars",
      "furniture": "furniture",
      "electronics": "electronics",
      "books": "books",
      "fashion": "clothing",
      "appliances": "appliances",
      "sports": "sports",
      "toys": "toys",
      "instruments": "musical-instruments"
    };

    const targetSlug = searchMap[lowerName] || lowerName;

    for (const cat of categories) {
      if (cat.slug === targetSlug || cat.name.toLowerCase() === lowerName) {
        matchedCat = cat;
        break;
      }
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          if (sub.slug === targetSlug || sub.name.toLowerCase() === lowerName) {
            matchedCat = cat;
            matchedSub = sub;
            break;
          }
        }
      }
      if (matchedCat) break;
    }

    if (matchedCat) {
      setSelectedCatFilter(matchedCat);
      if (matchedSub) {
        setSelectedSubCatFilter(matchedSub);
        fetchListings({ categoryId: matchedCat.id, subCategoryId: matchedSub.id });
      } else {
        setSelectedSubCatFilter(null);
        fetchListings({ categoryId: matchedCat.id, subCategoryId: null });
      }
      setActiveSegmentTab("SECONDHAND");
      scrollToTabSection();
    } else {
      fetchListings({ q: catName });
      setActiveSegmentTab("SECONDHAND");
      scrollToTabSection();
    }
  };

  // Fetch listings on initial load
  useEffect(() => {
    fetchListings();
  }, []);

  // Fallback: If current category filter has listings, auto-switch to a tab that contains them if the current active tab has 0 matches
  useEffect(() => {
    if (selectedCatFilter || selectedSubCatFilter) {
      const allItems = [...listings, ...nearbyListings];
      if (allItems.length > 0) {
        const typesInListings = new Set(allItems.map(item => item.listingType || "SALES"));
        if (!typesInListings.has(activeSegmentTab)) {
          const order = ["SALES", "SERVICES", "SECONDHAND"];
          const nextTab = order.find(t => typesInListings.has(t)) || Array.from(typesInListings)[0];
          if (nextTab) {
            setActiveSegmentTab(nextTab);
          }
        }
      }
    }
  }, [listings, nearbyListings, selectedCatFilter, selectedSubCatFilter]);

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

      {/* ========== FOCUSED SUBCATEGORY VIEW ========== */}
      {subCategoryView && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "var(--bg-main)",
            overflowY: "auto",
            opacity: subViewVisible ? 1 : 0,
            transform: subViewVisible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.22s ease, transform 0.22s ease",
          }}
        >
          {/* Sticky Header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border-glass)",
              backdropFilter: "blur(12px)",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <button
              onClick={exitSubCategoryView}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "10px",
                padding: "8px 14px",
                color: "var(--text-main)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              ← Back
            </button>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, overflow: "hidden" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {subCategoryView.category?.name}
              </span>
              <span style={{ color: "var(--text-dim)", fontSize: "12px" }}>›</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "var(--accent-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subCategoryView.subcategory?.imagePath ? (
                  <img
                    src={`${imageServer}${subCategoryView.subcategory.imagePath}`}
                    alt={subCategoryView.subcategory.name}
                    style={{ width: "18px", height: "18px", objectFit: "cover", borderRadius: "3px" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span>{subCategoryView.subcategory?.emoji}</span>
                )}
                {subCategoryView.subcategory?.name}
              </span>
            </div>
          </div>

          {/* Content */}
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px" }}>
            {/* Title */}
            <h1
              style={{
                fontSize: "clamp(20px, 5vw, 28px)",
                fontWeight: "800",
                color: "var(--text-main)",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {subCategoryView.subcategory?.imagePath ? (
                <img
                  src={`${imageServer}${subCategoryView.subcategory.imagePath}`}
                  alt={subCategoryView.subcategory.name}
                  style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "6px" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <span>{subCategoryView.subcategory?.emoji}</span>
              )}
              {subCategoryView.subcategory?.name}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
              in <strong style={{ color: "var(--text-main)" }}>{subCategoryView.category?.name}</strong>
              {subCategoryView.listings.length > 0 && (
                <> &nbsp;·&nbsp; <span style={{ color: "var(--accent-primary)", fontWeight: "600" }}>{subCategoryView.listings.length} listings found</span></>
              )}
            </p>

            {/* Loading */}
            {subCategoryViewLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="glass-panel"
                    style={{
                      height: "280px",
                      borderRadius: "14px",
                      background: "var(--bg-card)",
                      animation: "pulse 1.4s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : subCategoryView.listings.length === 0 ? (
              /* Empty State */
              <div
                className="glass-panel"
                style={{
                  padding: "72px 24px",
                  textAlign: "center",
                  borderRadius: "20px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔍</div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
                  No products found
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
                  There are no listings in <strong>{subCategoryView.subcategory?.name}</strong> yet.
                  <br />Be the first to post one!
                </p>
                <button
                  onClick={exitSubCategoryView}
                  className="btn btn-primary"
                  style={{ padding: "10px 28px", borderRadius: "50px" }}
                >
                  ← Go Back
                </button>
              </div>
            ) : (
              /* Product Grid */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "20px",
                }}
              >
                {subCategoryView.listings.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== HOMEPAGE (hidden behind subcategory view) ========== */}

      {/* 🔄 Account Mode Switcher Tab Bar */}
      <div 
        className="glass-panel mobile-flat-panel" 
        style={{ 
          padding: "16px 24px", 
          marginBottom: "24px", 
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)", 
          border: "1.5px solid var(--border-glass)",
          borderRadius: "20px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "clamp(15px, 4vw, 18px)", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              {userMode === "SELLER" ? "🏪 Seller Account Mode" : "🛒 Buyer Account Mode"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
              {userMode === "SELLER" 
                ? "You are viewing lowpriceplaces as a seller. Post ads, view leads & manage inquiries."
                : "You are viewing lowpriceplaces as a buyer. Browse ads, search items & chat with sellers."}
            </p>
          </div>

          <div style={{ display: "inline-flex", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "40px", padding: "4px", gap: "4px" }}>
            <button
              onClick={() => switchUserMode("BUYER")}
              style={{
                padding: "8px 20px",
                borderRadius: "32px",
                border: "none",
                fontSize: "13.5px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: userMode === "BUYER" ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
                color: userMode === "BUYER" ? "#ffffff" : "var(--text-muted)",
                boxShadow: userMode === "BUYER" ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none"
              }}
            >
              🛒 Buyer Mode
            </button>
            <button
              onClick={() => switchUserMode("SELLER")}
              style={{
                padding: "8px 20px",
                borderRadius: "32px",
                border: "none",
                fontSize: "13.5px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: userMode === "SELLER" ? "linear-gradient(135deg, #059669, #10b981)" : "transparent",
                color: userMode === "SELLER" ? "#ffffff" : "var(--text-muted)",
                boxShadow: userMode === "SELLER" ? "0 2px 8px rgba(16, 185, 129, 0.3)" : "none"
              }}
            >
              🏪 Seller Mode
            </button>
          </div>
        </div>
      </div>

      {userMode === "SELLER" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
          {/* Welcome Seller Card */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: "32px", 
              borderRadius: "20px", 
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
              border: "1px solid var(--border-glass)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: "-10px", right: "-10px", fontSize: "120px", opacity: 0.08, userSelect: "none" }}>🏪</div>
            <h2 style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>
              Welcome back, {user?.username ? user.username.split('@')[0] : "Seller"}! 👋
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "600px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
              Advertise new items, manage active inquiries, edit contact settings, or track statistics for your shop. Everything you need is right at your fingertips.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/dashboard/add-listing" className="btn btn-primary" style={{ padding: "10px 24px", borderRadius: "30px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                ➕ Post New Product
              </Link>
              <Link href="/dashboard/my-listings" className="btn btn-secondary" style={{ padding: "10px 24px", borderRadius: "30px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                📦 Manage My Listings
              </Link>
              <Link href="/dashboard/leads" className="btn btn-secondary" style={{ padding: "10px 24px", borderRadius: "30px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                💬 Buyer Messages ({sellerInquiries.length})
              </Link>
              <Link href="/dashboard/profile" className="btn btn-secondary" style={{ padding: "10px 24px", borderRadius: "30px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                🔒 Privacy & Profile Settings
              </Link>
            </div>
          </div>

          {/* Stats Summary Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            <div className="glass-panel" style={{ padding: "20px 24px", borderRadius: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📦</div>
              <div>
                <span style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>Total Listings</span>
                <span style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)" }}>{sellerListings.length}</span>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: "20px 24px", borderRadius: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>💬</div>
              <div>
                <span style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>Buyer Leads</span>
                <span style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)" }}>{sellerInquiries.length}</span>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: "20px 24px", borderRadius: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>⭐</div>
              <div>
                <span style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>Shop Rating</span>
                <span style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)" }}>5.0 ★</span>
              </div>
            </div>
          </div>

          {/* Seller listings section */}
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              📂 My Current Listings ({sellerListings.length})
            </h3>
            {sellerListings.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>You have not posted any advertising listings yet.</p>
                <Link href="/dashboard/add-listing" className="btn btn-primary" style={{ padding: "8px 20px", borderRadius: "30px", textDecoration: "none", fontSize: "13px" }}>
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {sellerListings.map((item) => {
                  const photos = item.imagePath ? item.imagePath.split(",") : [];
                  const coverImage = photos[0] || "";
                  return (
                    <div 
                      key={item.id} 
                      className="glass-panel product-card" 
                      style={{ height: "auto", display: "flex", flexDirection: "column", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-glass)", borderRadius: "14px", overflow: "hidden", cursor: "pointer" }}
                      onClick={() => router.push(`/details/${item.id}`)}
                    >
                      <div style={{ height: "150px", position: "relative", background: "#000" }}>
                        <img 
                          src={coverImage ? `${imageServer}${coverImage}` : "https://placehold.co/400x300?text=No+Photo"} 
                          alt={item.title} 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Product"; }}
                        />
                        <span style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", fontSize: "10px", fontWeight: "700", borderRadius: "4px", background: item.status === "ACTIVE" ? "var(--emerald-glow)" : "rgba(245, 158, 11, 0.15)", color: item.status === "ACTIVE" ? "var(--emerald)" : "#fbbf24" }}>
                          {item.status}
                        </span>
                      </div>
                      <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", marginBottom: "12px" }}>
                          ₹{item.price}{item.priceMax ? ` - ₹${item.priceMax}` : ""}
                        </span>
                        <div style={{ marginTop: "auto", display: "flex", gap: "6px" }}>
                          <Link href={`/dashboard/my-listings`} className="btn btn-secondary" style={{ flex: 1, padding: "6px", fontSize: "11px", borderRadius: "6px", textAlign: "center", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
                            ✏️ Edit
                          </Link>
                          <button 
                            className="btn btn-accent" 
                            style={{ flex: 1, padding: "6px", fontSize: "11px", borderRadius: "6px" }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Delete listing LPP-${String(item.id).padStart(5, "0")}?`)) {
                                try {
                                  await api.deleteListing(item.id);
                                  fetchSellerListings();
                                } catch (err) {
                                  alert(err.message);
                                }
                              }
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Top Categories Grid Bar */}
          <div className="glass-panel mobile-flat-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                📁 Browse Categories
              </h2>
          <Link
            href="/categories"
            className="btn btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
              whiteSpace: "nowrap",
              textDecoration: "none"
            }}
          >
            View All →
          </Link>
        </div>

        <div className="scroll-arrow-wrapper">
          {showLeftCat && (
            <button className="scroll-arrow-btn left" onClick={() => scrollLeft(categoryScrollRef)}>◀</button>
          )}
          <div
            ref={categoryScrollRef}
            className="category-bar-grid grab-scroll-container"
            onMouseDown={handleDragScroll}
            onMouseLeave={handleDragScrollLeaveOrUp}
            onMouseUp={handleDragScrollLeaveOrUp}
            onMouseMove={handleDragScrollMove}
            onScroll={() => updateArrowVisibility(categoryScrollRef, setShowLeftCat, setShowRightCat)}
            style={{ scrollBehavior: "smooth" }}
          >
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
                      const targetTab = getTabForCategory(cat);
                      setActiveSegmentTab(targetTab);
                      fetchListings({ categoryId: cat.id, subCategoryId: null });
                      if (!cat.subCategories || cat.subCategories.length === 0) {
                        scrollToTabSection();
                      }
                    }
                  }}
                >
                  <div className={`category-bar-icon-box ${isSelected ? "active" : ""}`}>
                    {cat.imagePath ? (
                      <img
                        src={`${imageServer}${cat.imagePath}`}
                        srcSet={getImageSrcSet(cat.imagePath, imageServer) || undefined}
                        sizes="70px"
                        loading="lazy"
                        alt={cat.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.srcSet = "";
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
          {showRightCat && (
            <button className="scroll-arrow-btn right" onClick={() => scrollRight(categoryScrollRef)}>▶</button>
          )}
        </div>

        {/* Subcategories Pills bar */}
        {selectedCatFilter && (selectedCatFilter.subCategories?.length > 0 || selectedCatFilter.subcategories?.length > 0) && (
          <div className="subcategory-bar-pills">
            <span className="subcategory-title">Subcategories:</span>
            <div className="scroll-arrow-wrapper">
              {showLeftSubCat && (
                <button className="scroll-arrow-btn left" onClick={() => scrollLeft(subcategoryScrollRef)}>◀</button>
              )}
              <div
                ref={subcategoryScrollRef}
                className="subcategory-pills-row grab-scroll-container"
                onMouseDown={handleDragScroll}
                onMouseLeave={handleDragScrollLeaveOrUp}
                onMouseUp={handleDragScrollLeaveOrUp}
                onMouseMove={handleDragScrollMove}
                onScroll={() => updateArrowVisibility(subcategoryScrollRef, setShowLeftSubCat, setShowRightSubCat)}
                style={{ scrollBehavior: "smooth" }}
              >
                {(selectedCatFilter.subCategories || selectedCatFilter.subcategories || []).map((sub) => {
                  const isSubSelected = selectedSubCatFilter?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      className={`subcategory-pill-btn ${isSubSelected ? "active" : ""}`}
                      onClick={() => {
                        setSelectedSubCatFilter(sub);
                        router.push(`/category/${selectedCatFilter.slug}/${sub.slug}`);
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {sub.imagePath ? (
                        <img
                          src={`${imageServer}${sub.imagePath}`}
                          alt={sub.name}
                          style={{ width: "16px", height: "16px", objectFit: "cover", borderRadius: "3px" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <span>{sub.emoji || "🔹"}</span>
                      )}
                      {sub.name}
                    </button>
                  );
                })}
              </div>
              {showRightSubCat && (
                <button className="scroll-arrow-btn right" onClick={() => scrollRight(subcategoryScrollRef)}>▶</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explore by City Grid Bar */}
      <div className="glass-panel mobile-flat-panel" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
            📍 Explore by City
          </h2>
          <button
            className="btn btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
              whiteSpace: "nowrap",
              cursor: "pointer"
            }}
            onClick={() => {
              setCitySearchQuery("");
              setShowAllCitiesModal(true);
            }}
          >
            View All →
          </button>
        </div>
        <div className="scroll-arrow-wrapper">
          {showLeftCity && (
            <button className="scroll-arrow-btn left" onClick={() => scrollLeft(cityScrollRef)}>◀</button>
          )}
          <div
            ref={cityScrollRef}
            className="category-bar-grid grab-scroll-container"
            onMouseDown={handleDragScroll}
            onMouseLeave={handleDragScrollLeaveOrUp}
            onMouseUp={handleDragScrollLeaveOrUp}
            onMouseMove={handleDragScrollMove}
            onScroll={() => updateArrowVisibility(cityScrollRef, setShowLeftCity, setShowRightCity)}
            style={{ scrollBehavior: "smooth" }}
          >
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

            {citiesList.map((c) => {
              const isSelected = locationFilter?.toLowerCase() === c.name.toLowerCase();
              return (
                <div
                  key={c.id || c.name}
                  className="category-bar-item"
                  onClick={() => {
                    setLocationFilter(c.name);
                    setLocationSearchInput(c.name);
                    fetchListings({ location: c.name });
                  }}
                >
                  <div className={`category-bar-icon-box ${isSelected ? "active" : ""}`} style={{ width: "48px", height: "48px", borderRadius: "12px" }}>
                    {c.imagePath ? (
                      <img
                        src={`${imageServer}${c.imagePath}`}
                        srcSet={getImageSrcSet(c.imagePath, imageServer) || undefined}
                        sizes="48px"
                        loading="lazy"
                        alt={c.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.srcSet = "";
                          const fallbackSpan = e.target.nextSibling;
                          if (fallbackSpan) fallbackSpan.style.display = 'inline';
                        }}
                      />
                    ) : null}
                    <span className="category-bar-emoji" style={{ display: c.imagePath ? "none" : "inline", fontSize: "20px" }}>
                      {c.emoji || "📍"}
                    </span>
                  </div>
                  <span className="category-bar-label" style={{ fontSize: "12px" }}>{c.name}</span>
                </div>
              );
            })}
          </div>
          {showRightCity && (
            <button className="scroll-arrow-btn right" onClick={() => scrollRight(cityScrollRef)}>▶</button>
          )}
        </div>
      </div>

      <div className="home-layout">
        {/* Sidebar Filters */}
        <aside className="sidebar-filter">{renderFilterContent(false)}</aside>

        {/* Product Feed Grid */}
        <section className="products-section">
          {/* Nearby Stores Section */}
          <div className="homepage-section-wrapper" style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "nowrap" }}>
              <h2 style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", margin: 0, whiteSpace: "nowrap", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                🏪 Nearby Stores
              </h2>
              <Link 
                href="/stores" 
                className="btn btn-secondary" 
                style={{ 
                  padding: "6px 12px", 
                  fontSize: "12px", 
                  borderRadius: "6px", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  flexShrink: 0, 
                  whiteSpace: "nowrap",
                  textDecoration: "none"
                }}
              >
                View All →
              </Link>
            </div>
            
            {nearbyStores.length === 0 ? (
              <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>No stores found nearby.</div>
            ) :             (
              <div className="scroll-arrow-wrapper">
                {showLeftStores && (
                  <button className="scroll-arrow-btn left" onClick={() => scrollLeft(storesScrollRef)}>◀</button>
                )}
                <div
                  ref={storesScrollRef}
                  className="grab-scroll-container"
                  onMouseDown={handleDragScroll}
                  onMouseLeave={handleDragScrollLeaveOrUp}
                  onMouseUp={handleDragScrollLeaveOrUp}
                  onMouseMove={handleDragScrollMove}
                  onScroll={() => updateArrowVisibility(storesScrollRef, setShowLeftStores, setShowRightStores)}
                  style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px", scrollBehavior: "smooth" }}
                >
                  {nearbyStores.map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.id}`}
                      className="glass-panel"
                      style={{
                        width: "180px",
                        flexShrink: 0,
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid var(--border-glass)",
                        background: "var(--bg-card)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s ease",
                        cursor: "pointer",
                        textDecoration: "none"
                      }}
                    >
                      <div style={{ height: "100px", width: "100%", position: "relative", background: "rgba(255,255,255,0.02)" }}>
                        {store.imagePath ? (
                          <img
                            src={store.imagePath.startsWith("http") ? store.imagePath : `${imageServer}${store.imagePath}`}
                            srcSet={getImageSrcSet(store.imagePath, imageServer) || undefined}
                            sizes="200px"
                            alt={store.name}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { 
                              e.target.src = "https://placehold.co/400x300?text=Store"; 
                              e.target.srcSet = "";
                            }}
                          />
                        ) : (
                          <img
                            src="https://placehold.co/400x300?text=Store"
                            alt={store.name}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                        <span style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(13,14,21,0.85)", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", color: "#fbbf24", border: "1px solid rgba(255,255,255,0.05)" }}>
                          ⭐ {store.rating.toFixed(1)}
                        </span>
                      </div>
                      <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {store.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {store.category}
                        </span>
                        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-main)", fontWeight: "500" }}>
                            📍 {store.distance !== null ? `${store.distance} km` : store.location}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {showRightStores && (
                  <button className="scroll-arrow-btn right" onClick={() => scrollRight(storesScrollRef)}>▶</button>
                )}
              </div>
            )}
          </div>

          {/* Best Services Near You Section */}
          <div className="homepage-section-wrapper" style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "nowrap" }}>
              <h2 style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", margin: 0, whiteSpace: "nowrap", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                🛠️ Best Services Near You
              </h2>
              <Link 
                href="/services" 
                className="btn btn-secondary" 
                style={{ 
                  padding: "6px 12px", 
                  fontSize: "12px", 
                  borderRadius: "6px", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  flexShrink: 0, 
                  whiteSpace: "nowrap",
                  textDecoration: "none"
                }}
              >
                View All →
              </Link>
            </div>
            {nearbyServices.length === 0 ? (
              <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>No services found nearby.</div>
            ) : (
              <Splide
                options={{
                  autoWidth: true,
                  gap: '12px',
                  arrows: true,
                  pagination: false,
                  drag: 'free',
                  snap: true,
                }}
              >
                {nearbyServices.map((service) => (
                  <SplideSlide key={service.id}>
                    <Link
                      href={`/services/${service.id}`}
                      className="glass-panel"
                      style={{
                        width: "130px",
                        flexShrink: 0,
                        borderRadius: "12px",
                        padding: "12px",
                        border: "1px solid var(--border-glass)",
                        background: "var(--bg-card)",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        cursor: "pointer",
                        textDecoration: "none"
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          position: "relative",
                          overflow: "hidden",
                          marginBottom: "10px",
                          border: "1px solid rgba(255, 255, 255, 0.05)"
                        }}
                      >
                        {service.imagePath ? (
                          <img
                            src={service.imagePath.startsWith("http") ? service.imagePath : `${imageServer}${service.imagePath}`}
                            srcSet={getImageSrcSet(service.imagePath, imageServer) || undefined}
                            sizes="50px"
                            loading="lazy"
                            alt={service.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { 
                              e.target.src = "https://placehold.co/100x100?text=Service"; 
                              e.target.srcSet = "";
                            }}
                          />
                        ) : (
                          <img
                            src="https://placehold.co/100x100?text=Service"
                            loading="lazy"
                            alt={service.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", height: "36px", lineHeight: "18px" }}>
                        {service.name}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {service.serviceType}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--primary-indigo)", fontWeight: "600", marginTop: "6px" }}>
                        📍 {service.distance !== null ? `${service.distance} km` : service.location}
                      </span>
                    </Link>
                  </SplideSlide>
                ))}
              </Splide>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading items...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

              {/* Second-Hand Items Section */}
              <div className="homepage-section-wrapper" style={{ marginBottom: "36px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "nowrap" }}>
                  <h2 style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", margin: 0, whiteSpace: "nowrap", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                    ♻️ Second-Hand Items
                  </h2>
                  <Link 
                    href="/marketplace" 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: "6px 12px", 
                      fontSize: "12px", 
                      borderRadius: "6px", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      flexShrink: 0, 
                      whiteSpace: "nowrap",
                      textDecoration: "none"
                    }}
                  >
                    View All →
                  </Link>
                </div>
                {secondhandListings.length === 0 ? (
                  <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>No items found matching current filters.</div>
                ) : (
                  <div className="scroll-arrow-wrapper">
                    {showLeftSecondHand && (
                      <button className="scroll-arrow-btn left" onClick={() => scrollLeft(secondHandScrollRef)}>◀</button>
                    )}
                    <div
                      ref={secondHandScrollRef}
                      className="grab-scroll-container"
                      onMouseDown={handleDragScroll}
                      onMouseLeave={handleDragScrollLeaveOrUp}
                      onMouseUp={handleDragScrollLeaveOrUp}
                      onMouseMove={handleDragScrollMove}
                      onScroll={() => updateArrowVisibility(secondHandScrollRef, setShowLeftSecondHand, setShowRightSecondHand)}
                      style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px", scrollBehavior: "smooth" }}
                    >
                      {secondhandListings.map((item) => (
                        <div key={item.id} style={{ width: "220px", flexShrink: 0 }}>
                          <ProductCard item={item} />
                        </div>
                      ))}
                    </div>
                    {showRightSecondHand && (
                      <button className="scroll-arrow-btn right" onClick={() => scrollRight(secondHandScrollRef)}>▶</button>
                    )}
                  </div>
                )}
              </div>

              {/* Segmented Switch Toggle */}
              <div id="segmented-toggle-section" className="segmented-toggle-container" style={{ marginTop: "40px" }}>
                <div className="segmented-toggle">
                  {[
                    { id: "SALES", label: "Sales", emoji: "🛍️" },
                    { id: "SERVICES", label: "Work & Services", emoji: "💼" },
                    { id: "SECONDHAND", label: "Second-Hand", emoji: "♻️" }
                  ].map((tab) => {
                    const isActive = activeSegmentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSegmentTab(tab.id)}
                        className={`segmented-toggle-btn ${isActive ? "active" : ""}`}
                      >
                        <span>{tab.emoji}</span>
                        <span className="tab-label-text">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="section-header" style={{ marginTop: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "22px" }}>
                    {selectedSubCatFilter ? selectedSubCatFilter.name : selectedCatFilter ? selectedCatFilter.name : "Featured Listings Grid"}
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {filteredListings.length} exact match(es) found
                  </p>
                </div>
              </div>

              {filteredListings.length === 0 && filteredNearbyListings.length === 0 ? (
                <div className="glass-panel" style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                  <div style={{ fontSize: "15px" }}>
                    No active listings found in this category. Try switching tabs or broadening your keywords.
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
                  {filteredListings.length > 0 ? (
                    <div>
                      <div className="products-grid">
                        {filteredListings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((item) => (
                          <ProductCard key={item.id} item={item} />
                        ))}
                      </div>
                      {/* Pagination Controls */}
                      {filteredListings.length > ITEMS_PER_PAGE && (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "13px" }}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          >
                            Previous
                          </button>
                          {[...Array(Math.ceil(filteredListings.length / ITEMS_PER_PAGE))].map((_, i) => (
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
                            disabled={currentPage === Math.ceil(filteredListings.length / ITEMS_PER_PAGE)}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE)))}
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
                  {filteredNearbyListings.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "24px" }}>
                      <h2 style={{ fontSize: "20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)" }}>
                        🗺️ Nearby {activeSegmentTab === "SALES" ? "Sales" : activeSegmentTab === "SERVICES" ? "Services" : "Second-Hand"} Listings in {extractParentCity(locationFilter)}
                      </h2>
                      <div className="products-grid">
                        {filteredNearbyListings.slice((currentNearbyPage - 1) * ITEMS_PER_PAGE, currentNearbyPage * ITEMS_PER_PAGE).map((item) => (
                          <ProductCard key={item.id} item={item} />
                        ))}
                      </div>
                      {/* Pagination Controls */}
                      {filteredNearbyListings.length > ITEMS_PER_PAGE && (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "13px" }}
                            disabled={currentNearbyPage === 1}
                            onClick={() => setCurrentNearbyPage((prev) => Math.max(prev - 1, 1))}
                          >
                            Previous
                          </button>
                          {[...Array(Math.ceil(filteredNearbyListings.length / ITEMS_PER_PAGE))].map((_, i) => (
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
                            disabled={currentNearbyPage === Math.ceil(filteredNearbyListings.length / ITEMS_PER_PAGE)}
                            onClick={() => setCurrentNearbyPage((prev) => Math.min(prev + 1, Math.ceil(filteredNearbyListings.length / ITEMS_PER_PAGE)))}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>)}

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

      {/* View All Cities Modal overlay */}
      {showAllCitiesModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setShowAllCitiesModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "var(--bg-card, #141422)",
              border: "1px solid var(--border-glass)",
              borderRadius: "20px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "85vh",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                  📍 Select Your City / Location
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Choose a location to discover deals near you
                </p>
              </div>
              <button
                onClick={() => setShowAllCitiesModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  color: "#ffffff",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✖
              </button>
            </div>

            {/* Modal Search Input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search city name..."
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "12px",
                  padding: "12px 16px 12px 40px",
                  color: "var(--text-main)",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--text-dim)" }}>
                🔍
              </span>
            </div>

            {/* Modal Grid of Cities */}
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "12px" }}>
                {/* Nationwide All India Option */}
                <div
                  onClick={() => {
                    setLocationFilter("India");
                    setLocationSearchInput("India");
                    fetchListings({ location: "India" });
                    setShowAllCitiesModal(false);
                  }}
                  style={{
                    background: (!locationFilter || locationFilter.toLowerCase() === "india") ? "var(--primary)" : "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "14px",
                    padding: "16px 8px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "var(--transition)"
                  }}
                >
                  <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>🇮🇳</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>All India</span>
                </div>

                {citiesList
                  .filter((c) => c.name.toLowerCase().includes(citySearchQuery.toLowerCase()))
                  .map((c) => {
                    const isSelected = locationFilter?.toLowerCase() === c.name.toLowerCase();
                    return (
                      <div
                        key={c.id || c.name}
                        onClick={() => {
                          setLocationFilter(c.name);
                          setLocationSearchInput(c.name);
                          fetchListings({ location: c.name });
                          setShowAllCitiesModal(false);
                        }}
                        style={{
                          background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "14px",
                          padding: "16px 8px",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "var(--transition)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {c.imagePath ? (
                          <img
                            src={`${imageServer}${c.imagePath}`}
                            alt={c.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              marginBottom: "8px"
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>
                            {c.emoji || "📍"}
                          </span>
                        )}
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", wordBreak: "break-word" }}>
                          {c.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
