"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api, getCurrentUser, getAuthToken } from "@/api";

const AppContext = createContext();

export function AppContextProvider({ children }) {
  // Authentication
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Theme support (light/dark)
  const [theme, setTheme] = useState("light");

  // Cache & Database data
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [nearbyListings, setNearbyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedListings, setSavedListings] = useState([]);
  const [citiesList, setCitiesList] = useState([
    { name: "Mumbai", emoji: "🏙️" },
    { name: "Delhi", emoji: "🏛️" },
    { name: "Bangalore", emoji: "💻" },
    { name: "Hyderabad", emoji: "🍛" },
    { name: "Ahmedabad", emoji: "☀️" },
    { name: "Chennai", emoji: "🏖️" },
    { name: "Kolkata", emoji: "🌉" },
    { name: "Pune", emoji: "⛰️" },
    { name: "Jaipur", emoji: "🏯" },
    { name: "Lucknow", emoji: "🏛️" }
  ]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const [selectedCatFilter, setSelectedCatFilter] = useState(null);
  const [selectedSubCatFilter, setSelectedSubCatFilter] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [photonSuggestions, setPhotonSuggestions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [customDateInput, setCustomDateInput] = useState('');
  const [selectedSortBy, setSelectedSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentNearbyPage, setCurrentNearbyPage] = useState(1);

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Dashboard & Inbox state
  const [dashboardTab, setDashboardTab] = useState('my-listings');
  const [sellerInquiries, setSellerInquiries] = useState([]);
  const [buyerInquiries, setBuyerInquiries] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [activeInquiryId, setActiveInquiryId] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [sellerListings, setSellerListings] = useState([]);

  // Load user status, categories, and listings on startup
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== "undefined") {
          const savedTheme = localStorage.getItem("glassify_theme") || "light";
          setTheme(savedTheme);
          
          if (getAuthToken()) {
            const currentUser = await api.getMe();
            setUser(currentUser);
          }
          const saved = localStorage.getItem("lowpriceplaces_saved");
          if (saved) {
            setSavedListings(JSON.parse(saved));
          }
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
    fetchCategories();
    fetchCities();
  }, []);

  // Sync theme changes with body class
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.body.classList.add("dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
      }
      localStorage.setItem("glassify_theme", theme);
    }
  }, [theme]);

  // Sync location search input
  useEffect(() => {
    setLocationSearchInput(locationFilter);
  }, [locationFilter]);

  // Helper to extract parent city from a location string
  const extractParentCity = (loc) => {
    if (!loc) return "";
    const lower = loc.toLowerCase();
    const cities = citiesList.map(c => c.name.toLowerCase());
    for (const city of cities) {
      if (lower.includes(city)) {
        const found = citiesList.find(c => c.name.toLowerCase() === city);
        return found ? found.name : city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
    const parts = loc.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return loc;
  };

  // Fetch helper routines
  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      console.error("Categories fetch error:", e);
    }
  };

  const fetchCities = async () => {
    try {
      const data = await api.getCities();
      if (data && data.length > 0) {
        setCitiesList(data);
      }
    } catch (e) {
      console.error("Cities fetch error:", e);
    }
  };

  const fetchListings = async (overrideFilters = {}) => {
    setLoading(true);
    setCurrentPage(1);
    setCurrentNearbyPage(1);
    try {
      const mergedQ = overrideFilters.search !== undefined ? overrideFilters.search : searchQuery;
      const mergedMinPrice = overrideFilters.minPrice !== undefined ? overrideFilters.minPrice : minPrice;
      const mergedMaxPrice = overrideFilters.maxPrice !== undefined ? overrideFilters.maxPrice : maxPrice;
      const mergedDiscount = overrideFilters.discountOnly !== undefined ? overrideFilters.discountOnly : (discountOnly ? 'true' : 'false');
      
      const exactLocation = overrideFilters.location !== undefined ? overrideFilters.location : locationFilter;
      const isNationwide = exactLocation && exactLocation.toLowerCase() === 'india';

      const parentCity = isNationwide ? '' : extractParentCity(exactLocation);

      const mergedDateFilter = overrideFilters.dateFilter !== undefined ? overrideFilters.dateFilter : selectedDateFilter;
      const mergedSortBy = overrideFilters.sortBy !== undefined ? overrideFilters.sortBy : selectedSortBy;

      const activeFilters = {
        q: mergedQ,
        minPrice: mergedMinPrice,
        maxPrice: mergedMaxPrice,
        location: isNationwide ? '' : (parentCity || exactLocation),
        discountOnly: mergedDiscount,
        dateFilter: mergedDateFilter,
        sortBy: mergedSortBy
      };

      if (exactLocation && !isNationwide && overrideFilters.location === undefined) {
        activeFilters.location = parentCity;
      }

      if (overrideFilters.categoryId !== undefined) {
        if (overrideFilters.categoryId === null) {
          delete activeFilters.categoryId;
        } else {
          activeFilters.categoryId = overrideFilters.categoryId;
        }
      } else if (selectedCatFilter) {
        activeFilters.categoryId = selectedCatFilter.id;
      }

      if (overrideFilters.subCategoryId !== undefined) {
        if (overrideFilters.subCategoryId === null) {
          delete activeFilters.subCategoryId;
        } else {
          activeFilters.subCategoryId = overrideFilters.subCategoryId;
        }
      } else if (selectedSubCatFilter) {
        activeFilters.subCategoryId = selectedSubCatFilter.id;
      }

      if (searchScope !== 'all' && overrideFilters.categoryId === undefined) {
        activeFilters.categoryId = searchScope;
      }

      if (overrideFilters.bookmarkedOnly) {
        activeFilters.bookmarkedOnly = true;
      }
      if (overrideFilters.sellerOnly) {
        activeFilters.sellerOnly = true;
      }

      const list = await api.getListings(activeFilters);

      if (exactLocation && !isNationwide) {
        const queryLower = exactLocation.toLowerCase();
        const primarySegment = queryLower.split(',')[0].trim();

        const exactMatches = list.filter(item => {
          if (!item.location) return false;
          const locLower = item.location.toLowerCase();
          return locLower.includes(primarySegment);
        });

        const fallbackMatches = list.filter(item => !exactMatches.includes(item));

        setListings(exactMatches);
        setNearbyListings(fallbackMatches);
      } else {
        setListings(list);
        setNearbyListings([]);
      }
    } catch (e) {
      console.error("Fetch listings error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedListings = async () => {
    if (!user) return;
    try {
      const res = await api.getListings({ bookmarkedOnly: true });
      setSavedListings(res.exact || res || []);
    } catch (e) {
      console.error("Fetch bookmarks error:", e);
    }
  };

  const fetchInquiries = async () => {
    if (!user) return;
    try {
      if (user.role === 'SELLER') {
        const data = await api.getSellerInquiries();
        setSellerInquiries(data);
      } else if (user.role === 'BUYER') {
        const data = await api.getBuyerInquiries();
        setBuyerInquiries(data);
      }
    } catch (e) {
      console.error("Fetch inquiries error:", e);
    }
  };

  const fetchSellerListings = async () => {
    if (!user || user.role !== 'SELLER') return;
    try {
      const data = await api.getListings({ sellerOnly: true });
      setSellerListings(data.exact || data || []);
    } catch (e) {
      console.error("Fetch seller listings error:", e);
    }
  };

  const handleClearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setDiscountOnly(false);
    setLocationFilter('India');
    setLocationSearchInput('India');
    setSelectedCatFilter(null);
    setSelectedSubCatFilter(null);
    setSearchQuery('');
    setSelectedDateFilter('');
    setCustomDateInput('');
    setSelectedSortBy('date_desc');
    fetchListings({
      search: '',
      categoryId: null,
      subCategoryId: null,
      minPrice: '',
      maxPrice: '',
      location: 'India',
      discountOnly: false,
      dateFilter: '',
      sortBy: 'date_desc'
    });
  };

  const isAnyFilterApplied =
    searchQuery.trim() !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    discountOnly === true ||
    selectedCatFilter !== null ||
    selectedSubCatFilter !== null ||
    (locationFilter !== '' && locationFilter.toLowerCase() !== 'india') ||
    selectedDateFilter !== '';

  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.state || '';
          const suburb = data.address.suburb || data.address.neighbourhood || data.address.road || '';
          const detected = suburb && city ? `${suburb}, ${city}` : (city || 'Hyderabad');

          setLocationFilter(detected);
          setShowLocationDropdown(false);
          fetchListings({ location: detected });
        } catch (e) {
          console.error(e);
          setLocationFilter("Madhapur, Hyderabad");
          setShowLocationDropdown(false);
          fetchListings({ location: "Hyderabad" });
        }
      }, (err) => {
        console.error(err);
        setLocationFilter("Dilsukh Nagar, Hyderabad");
        setShowLocationDropdown(false);
        fetchListings({ location: "Hyderabad" });
      });
    } else {
      setLocationFilter("Dilsukh Nagar, Hyderabad");
      setShowLocationDropdown(false);
    }
  };

  const toggleBookmark = (id) => {
    let updated;
    if (savedListings.includes(id)) {
      updated = savedListings.filter(item => item !== id);
    } else {
      updated = [...savedListings, id];
    }
    setSavedListings(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("lowpriceplaces_saved", JSON.stringify(updated));
    }
  };

  // Fetch suggestions from Photon API for location field
  useEffect(() => {
    if (!locationSearchInput || locationSearchInput.length < 2) {
      setPhotonSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationSearchInput)}&limit=8&bbox=68.1,6.8,97.4,35.5`);
        const data = await res.json();

        const suggestionsList = data.features.map(f => {
          const props = f.properties;
          const name = props.name || '';
          const city = props.city || props.town || props.district || '';
          const state = props.state || '';
          const parts = [name, city, state].filter(p => p.trim() !== '');
          return [...new Set(parts)].join(', ');
        }).filter(Boolean);

        setPhotonSuggestions([...new Set(suggestionsList)]);
      } catch (e) {
        console.error("Photon Geocoding API error:", e);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [locationSearchInput]);

  // Autocomplete Suggestions logic for keyword search input
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const filterTerm = searchQuery.toLowerCase();

    const listSuggestions = listings
      .filter(l => l.title.toLowerCase().includes(filterTerm))
      .slice(0, 4)
      .map(l => ({ id: l.id, label: l.title, type: 'Listing' }));

    const catSuggestions = categories
      .filter(c => c.name.toLowerCase().includes(filterTerm))
      .map(c => ({ id: c.id, label: c.name, type: 'Category' }));

    const subSuggestions = categories
      .flatMap(c => c.subCategories || [])
      .filter(s => s.name.toLowerCase().includes(filterTerm))
      .map(s => ({ id: s.id, label: s.name, type: 'SubCategory' }));

    setSuggestions([...listSuggestions, ...catSuggestions, ...subSuggestions].slice(0, 8));
  }, [searchQuery, listings, categories]);

  // Click outside location search box listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.location-search-box')) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const logout = () => {
    api.logout();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        logout,
        theme,
        setTheme,
        categories,
        setCategories,
        listings,
        setListings,
        nearbyListings,
        setNearbyListings,
        loading,
        setLoading,
        savedListings,
        setSavedListings,
        citiesList,
        setCitiesList,
        
        searchQuery,
        setSearchQuery,
        searchScope,
        setSearchScope,
        selectedCatFilter,
        setSelectedCatFilter,
        selectedSubCatFilter,
        setSelectedSubCatFilter,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        locationFilter,
        setLocationFilter,
        locationSearchInput,
        setLocationSearchInput,
        showLocationDropdown,
        setShowLocationDropdown,
        isScrolled,
        setIsScrolled,
        photonSuggestions,
        setPhotonSuggestions,
        suggestions,
        setSuggestions,
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
        
        mobileMenuOpen,
        setMobileMenuOpen,
        mobileFiltersOpen,
        setMobileFiltersOpen,
        
        dashboardTab,
        setDashboardTab,
        sellerInquiries,
        setSellerInquiries,
        buyerInquiries,
        setBuyerInquiries,
        replyTexts,
        setReplyTexts,
        activeInquiryId,
        setActiveInquiryId,
        editingListing,
        setEditingListing,
        sellerListings,
        setSellerListings,
        
        fetchCategories,
        fetchCities,
        fetchListings,
        fetchSavedListings,
        fetchInquiries,
        fetchSellerListings,
        detectUserLocation,
        extractParentCity,
        handleClearAllFilters,
        isAnyFilterApplied,
        toggleBookmark
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
}
