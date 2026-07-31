"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { request, buildQueryString, api } from "@/api";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { userCoords } = useApp();

  const q = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const activeTab = searchParams.get("tab") || "all";
  const sortBy = searchParams.get("sortBy") || "relevance";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const rating = searchParams.get("rating") || "";
  const page = parseInt(searchParams.get("page") || "1");

  // Local state initialized from URL params
  const [qInput, setQInput] = useState(q);
  const [locInput, setLocInput] = useState(location);
  const [pageSuggestions, setPageSuggestions] = useState([]);
  const [showPageDropdown, setShowPageDropdown] = useState(false);

  const [results, setResults] = useState([]);
  const [counts, setCounts] = useState({ all: 0, products: 0, services: 0, stores: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Auto-scroll refs
  const topContainerRef = useRef(null);
  const tabsRef = useRef(null);
  const hasScrolledRef = useRef(false);

  // Sync inputs with URL changes
  useEffect(() => {
    setQInput(q);
    setLocInput(location);
  }, [q, location]);

  // Reset scroll tracker when search keyword changes
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [q]);

  // Immediately position viewport at top of Search Results interface upon loading
  useEffect(() => {
    if (!loading && q && !hasScrolledRef.current && topContainerRef.current) {
      hasScrolledRef.current = true;
      topContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, q]);

  // Autocomplete suggestions
  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed.length < 2) {
      setPageSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await api.getSuggestions(trimmed);
        setPageSuggestions(data || []);
      } catch (err) {
        setPageSuggestions([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [qInput]);

  // Load search data
  const fetchSearchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = {
        q,
        location,
        tab: activeTab,
        sortBy,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        rating: rating || null,
        lat: userCoords?.lat || null,
        lng: userCoords?.lng || null,
        page,
        limit: 12
      };

      const data = await request(`/search?${buildQueryString(queryParams)}`);

      if (data) {
        if (page === 1) {
          setResults(data.results || []);
        } else {
          setResults(prev => {
            const existingIds = new Set(prev.map(item => `${item.type}-${item.id}`));
            const newItems = (data.results || []).filter(item => !existingIds.has(`${item.type}-${item.id}`));
            return [...prev, ...newItems];
          });
        }
        if (data.counts) {
          setCounts(data.counts);
        }
        setTotalResults(data.totalResults || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (err) {
      console.error("Failed to fetch search results:", err);
      setError("Unable to fetch search results. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [q, location, activeTab, sortBy, minPrice, maxPrice, rating, page, userCoords]);

  // URL state synchronization helper
  const updateUrl = (updatedParams) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.keys(updatedParams).forEach(key => {
      const val = updatedParams[key];
      if (val === null || val === undefined || val === "") {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });
    router.push(`/search?${current.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setShowPageDropdown(false);
    updateUrl({ q: qInput, location: locInput, page: 1 });
  };

  const handleSelectPageSuggestion = (sug) => {
    const text = typeof sug === "string" ? sug : (sug.title || sug.label || sug.name || "");
    if (!text) return;
    setQInput(text);
    setShowPageDropdown(false);
    updateUrl({ q: text, location: locInput, page: 1 });
  };

  const handleTabChange = (newTab) => {
    updateUrl({ tab: newTab, page: 1 });
  };

  const getDetailHref = (item) => {
    if (item.type === "product") {
      return `/details/${item.id}`;
    }
    if (item.type === "service") {
      return item.id >= 100000 ? `/services/${item.id - 100000}` : `/details/${item.id}`;
    }
    if (item.type === "store") {
      return `/stores/${item.id}`;
    }
    return `/details/${item.id}`;
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const escapedQuery = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    return text.replace(regex, `<strong style="font-weight: 800; color: #6366f1;">$1</strong>`);
  };

  return (
    <div ref={topContainerRef} className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 20px 40px 20px", minHeight: "100vh" }}>
      
      {/* Streamlined Top Bar: Home Link + Search Bar + Active Keyword Badge */}
      <form onSubmit={handleSearchSubmit} className="glass-panel" style={{ padding: "12px 16px", borderRadius: "14px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", border: "1px solid var(--border-glass)", position: "relative" }}>
        <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", padding: "6px 12px", borderRadius: "8px", textDecoration: "none" }}>
          ← Home
        </Link>

        <div style={{ flex: "1 1 220px", position: "relative" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search keywords..."
            value={qInput}
            onChange={(e) => {
              setQInput(e.target.value);
              setShowPageDropdown(true);
            }}
            onFocus={() => setShowPageDropdown(true)}
            onBlur={() => setTimeout(() => setShowPageDropdown(false), 200)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
          />

          {showPageDropdown && pageSuggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              background: "var(--bg-glass, #1e1e2d)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
              borderRadius: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              zIndex: 100,
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              {pageSuggestions.map((sug, i) => (
                <div
                  key={i}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectPageSuggestion(sug);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom: i < pageSuggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
                  }}
                >
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>🔍</span>
                  <span style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "500" }}
                    dangerouslySetInnerHTML={{ __html: highlightText(sug.title || sug.label || "", qInput) }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: "1 1 160px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Location..."
            value={locInput}
            onChange={(e) => setLocInput(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "var(--font-weight-semibold)" }}>
          Search
        </button>

        {q && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>Query:</span>
            <span style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "2px 8px", borderRadius: "6px", fontWeight: "var(--font-weight-bold)" }}>
              {q}
            </span>
          </div>
        )}
      </form>

      {/* Switch Buttons / Tabs (Sticky & Immediately Visible) */}
      <div
        ref={tabsRef}
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border-glass)",
          paddingBottom: "10px",
          position: "sticky",
          top: "70px",
          zIndex: 40,
          background: "var(--bg-main, #0f172a)",
          paddingTop: "6px",
        }}
      >
        {[
          { id: "all", label: "All Results", icon: "🌐", count: counts.all },
          { id: "products", label: "Products", icon: "🛍️", count: counts.products },
          { id: "services", label: "Services", icon: "💼", count: counts.services },
          { id: "stores", label: "Stores", icon: "🏪", count: counts.stores },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`btn ${isActive ? "btn-primary" : "btn-secondary"}`}
              style={{
                borderRadius: "20px",
                padding: "7px 16px",
                fontSize: "12.5px",
                fontWeight: "var(--font-weight-semibold)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                  padding: "1px 7px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  marginLeft: "2px"
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Results & Filters Layout */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        
        {/* Left Filters Sidebar */}
        <div style={{ flex: "1 1 240px", maxWidth: "260px" }}>
          <div className="glass-panel" style={{ padding: "16px", borderRadius: "14px", border: "1px solid var(--border-glass)", position: "sticky", top: "130px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "var(--font-helper)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", margin: 0 }}>⚙️ Filters</h3>
              <button
                onClick={() => updateUrl({ sortBy: "relevance", minPrice: "", maxPrice: "", rating: "", page: 1 })}
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "11px", cursor: "pointer", fontWeight: "var(--font-weight-semibold)" }}
              >
                Reset All
              </button>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: "var(--font-weight-semibold)" }}>Price Range (₹)</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  value={minPrice}
                  onChange={(e) => updateUrl({ minPrice: e.target.value, page: 1 })}
                  style={{ width: "50%", padding: "6px 8px", borderRadius: "6px", fontSize: "12px" }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  value={maxPrice}
                  onChange={(e) => updateUrl({ maxPrice: e.target.value, page: 1 })}
                  style={{ width: "50%", padding: "6px 8px", borderRadius: "6px", fontSize: "12px" }}
                />
              </div>
            </div>

            {/* Ratings Filter */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: "var(--font-weight-semibold)" }}>Rating</label>
              <select
                className="form-input"
                value={rating}
                onChange={(e) => updateUrl({ rating: e.target.value, page: 1 })}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-glass)" }}
              >
                <option value="">Any Rating</option>
                <option value="4.0">⭐ 4.0 & above</option>
                <option value="3.0">⭐ 3.0 & above</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: "var(--font-weight-semibold)" }}>Sort By</label>
              <select
                className="form-input"
                value={sortBy}
                onChange={(e) => updateUrl({ sortBy: e.target.value, page: 1 })}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-glass)" }}
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price Low to High</option>
                <option value="price_desc">Price High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div style={{ flex: "1 1 500px", minWidth: 0 }}>

          {/* Loading State */}
          {loading && page === 1 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
              <div className="spinner" style={{ border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid var(--primary)", borderRadius: "50%", width: "36px", height: "36px", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }} />
              <span style={{ fontSize: "13px" }}>Loading results for "{q || 'all'}"...</span>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ padding: "40px 24px", textAlign: "center", borderRadius: "14px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>⚠️</span>
              <h3 style={{ fontSize: "var(--font-body)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "6px" }}>
                Unable to load search results
              </h3>
              <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", marginBottom: "16px" }}>
                {error}
              </p>
              <button onClick={fetchSearchResults} className="btn btn-primary" style={{ padding: "8px 20px", borderRadius: "8px", fontSize: "13px" }}>
                Retry Search
              </button>
            </div>
          ) : results.length === 0 ? (
            /* Dedicated Tab Empty State */
            <div className="glass-panel" style={{ padding: "50px 24px", textAlign: "center", borderRadius: "14px", border: "1px solid var(--border-glass)" }}>
              <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🔍</span>
              <h3 style={{ fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main)", marginBottom: "6px" }}>
                No results found for '{q || "your search"}' in this section.
              </h3>
              <p style={{ fontSize: "var(--font-small)", color: "var(--text-muted)", marginBottom: "0" }}>
                Try switching tabs or searching with another keyword.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", fontWeight: "600" }}>
                Showing {totalResults} matching {totalResults === 1 ? "result" : "results"} for "<span style={{ color: "var(--text-main)" }}>{q}</span>"
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "20px" }}>
                {results.map((item) => {
                  const detailHref = getDetailHref(item);
                  return (
                    <ProductCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      href={detailHref}
                    />
                  );
                })}
              </div>

              {/* Load More button */}
              {hasMore && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                  <button
                    className="btn btn-secondary"
                    disabled={loading}
                    onClick={() => updateUrl({ page: page + 1 })}
                    style={{ padding: "10px 28px", fontSize: "12px", borderRadius: "8px", fontWeight: "var(--font-weight-semibold)" }}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", padding: "100px 24px", color: "var(--text-muted)" }}>
        <span>Loading search results page...</span>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
