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
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [citiesError, setCitiesError] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

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
  const [userCoords, setUserCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Default to Bangalore

  const cityCoords = {
    mumbai: { lat: 19.0760, lng: 72.8777 },
    delhi: { lat: 28.7041, lng: 77.1025 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    hyderabad: { lat: 17.3850, lng: 78.4867 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    kolkata: { lat: 22.5726, lng: 88.3639 },
    pune: { lat: 18.5204, lng: 73.8567 },
    jaipur: { lat: 26.9124, lng: 75.7873 },
    lucknow: { lat: 26.8467, lng: 80.9462 },
    ahmedabad: { lat: 23.0225, lng: 72.5714 }
  };

  useEffect(() => {
    if (!locationFilter) {
      setUserCoords({ lat: 12.9716, lng: 77.5946 });
      return;
    }
    const locLower = locationFilter.toLowerCase();
    let found = false;
    for (const city of Object.keys(cityCoords)) {
      if (locLower.includes(city)) {
        setUserCoords(cityCoords[city]);
        found = true;
        break;
      }
    }
    if (!found) {
      setUserCoords({ lat: 12.9716, lng: 77.5946 });
    }
  }, [locationFilter]);

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Subcategory overlay view — stored globally so Home button can close it
  const [subCategoryView, setSubCategoryView] = useState(null);
  const [subCategoryViewLoading, setSubCategoryViewLoading] = useState(false);

  // Dashboard & Inbox state
  const [dashboardTab, setDashboardTab] = useState('my-listings');
  const [sellerInquiries, setSellerInquiries] = useState([]);
  const [buyerInquiries, setBuyerInquiries] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [activeInquiryId, setActiveInquiryId] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [sellerListings, setSellerListings] = useState([]);

  // 2-User Direct Chatting App state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [allChats, setAllChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);



  const fetchUserChats = async () => {
    if (!getAuthToken()) return;
    try {
      const chats = await api.getAllChats();
      setAllChats(chats);
      let unread = 0;
      chats.forEach(c => {
        const lastMsg = c.messages?.[c.messages.length - 1];
        if (lastMsg && user && lastMsg.senderId !== user.id && c.status !== "READ") {
          unread++;
        }
      });
      setUnreadChatCount(unread);
    } catch (e) {
      console.error("Fetch chats error:", e);
    }
  };

  const startDirectChatWithListing = async (listingId, initialMessage = "") => {
    if (!getAuthToken()) {
      return false;
    }
    try {
      const chat = await api.startDirectChat(listingId, initialMessage);
      await fetchUserChats();
      setActiveChatId(chat.id);
      setIsChatOpen(true);
      return chat;
    } catch (e) {
      console.error("Start chat error:", e);
      throw e;
    }
  };

  const startChatWithSeller = async ({ listingId, sellerId, storeId, serviceId }, initialMessage = "") => {
    if (!getAuthToken()) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return false;
    }
    try {
      let targetListingId = listingId;

      // 1. Resolve from local listings cache
      if (!targetListingId && sellerId) {
        const cached = listings.find(l => l.sellerId === sellerId);
        if (cached) {
          targetListingId = cached.id;
        }
      }

      // 2. Resolve from store/service details if not cached
      if (!targetListingId) {
        if (storeId) {
          const storeData = await api.getStoreById(storeId);
          if (storeData.relatedListings && storeData.relatedListings.length > 0) {
            targetListingId = storeData.relatedListings[0].id;
          }
        } else if (serviceId) {
          const serviceData = await api.getServiceById(serviceId);
          if (serviceData.relatedListings && serviceData.relatedListings.length > 0) {
            targetListingId = serviceData.relatedListings[0].id;
          }
        }
      }

      // 3. Fallback: query active listings for this sellerId
      if (!targetListingId && sellerId) {
        try {
          const sellerListings = await api.getListings({ sellerId });
          if (sellerListings && sellerListings.length > 0) {
            targetListingId = sellerListings[0].id;
          }
        } catch (err) {
          console.error("Failed to query seller listings:", err);
        }
      }

      if (!targetListingId) {
        alert("This seller has no active listings available to start a chat session.");
        return false;
      }

      return await startDirectChatWithListing(targetListingId, initialMessage);
    } catch (err) {
      console.error("startChatWithSeller error:", err);
      alert(err.message || "Failed to start direct chat.");
      return false;
    }
  };

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
    setCitiesLoading(true);
    setCitiesError(null);
    try {
      const data = await api.getCities();
      if (data && data.length > 0) {
        setCitiesList(data);
      }
    } catch (e) {
      console.error("Cities fetch error:", e);
      setCitiesError("Unable to load cities. Please try again.");
    } finally {
      setCitiesLoading(false);
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

      const finalLat = overrideFilters.lat !== undefined ? overrideFilters.lat : (userCoords ? userCoords.lat : null);
      const finalLng = overrideFilters.lng !== undefined ? overrideFilters.lng : (userCoords ? userCoords.lng : null);

      if (finalLat) activeFilters.lat = finalLat;
      if (finalLng) activeFilters.lng = finalLng;

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
    try {
      const saved = localStorage.getItem("lowpriceplaces_saved");
      if (saved) {
        const parsedIds = JSON.parse(saved).map(id => Number(id)).filter(id => !isNaN(id));
        if (parsedIds.length === 0) {
          setSavedListings([]);
          return;
        }
        
        try {
          const activeItems = await api.getListings({ ids: parsedIds.join(','), status: 'ALL' });
          const activeIds = (activeItems || []).map(item => Number(item.id));
          setSavedListings(activeIds);
          localStorage.setItem("lowpriceplaces_saved", JSON.stringify(activeIds));
        } catch (apiErr) {
          console.error("Failed to sync shortlist with backend:", apiErr);
          setSavedListings(parsedIds);
        }
      } else {
        setSavedListings([]);
      }
    } catch (e) {
      console.error("Fetch bookmarks error:", e);
    }
  };

  const fetchInquiries = async () => {
    if (!user) return;
    try {
      const sellerData = await api.getSellerInquiries();
      setSellerInquiries(sellerData || []);
      const buyerData = await api.getBuyerInquiries();
      setBuyerInquiries(buyerData || []);
    } catch (e) {
      console.error("Fetch inquiries error:", e);
    }
  };

  const fetchSellerListings = async () => {
    if (!user) return;
    try {
      const data = await api.getListings({ sellerId: user.id, status: 'ALL' });
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

  const reverseGeocode = async (lat, lng) => {
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
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties;
          const state = props.state || "";
          const city = props.city || props.county || props.district || "";
          let locality = props.district || props.suburb || props.locality || props.neighbourhood || props.name || "";

          if (props.name && props.name !== locality && props.name !== city) {
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
  };

  const handleDetectLocation = async (onDetected) => {
    if (typeof window !== "undefined" && !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    // Check cache
    const cached = localStorage.getItem("lowpriceplaces_cached_listing_location");
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 15 * 60 * 1000) {
          if (onDetected) onDetected({ location: cachedData.location, lat: cachedData.lat, lng: cachedData.lng });
          alert("Location retrieved from cache.");
          return;
        }
      } catch (cacheErr) {
        console.error("Cache read error:", cacheErr);
      }
    }

    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const locationName = await reverseGeocode(latitude, longitude);
          const fullLoc = locationName || "Hyderabad, Telangana";
          if (onDetected) onDetected({ location: fullLoc, lat: latitude, lng: longitude });
          
          localStorage.setItem("lowpriceplaces_cached_listing_location", JSON.stringify({
            location: fullLoc,
            lat: latitude,
            lng: longitude,
            timestamp: Date.now()
          }));
          
          if (locationName) {
            alert("Location detected successfully.");
          } else {
            alert("Unable to determine exact address. Defaulting to Hyderabad, Telangana.");
          }
        } catch (err) {
          console.error(err);
          if (onDetected) onDetected({ location: "Hyderabad, Telangana" });
          alert("Unable to detect location. Defaulting to Hyderabad, Telangana.");
        } finally {
          setDetectingLoc(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (onDetected) onDetected({ location: "Hyderabad, Telangana" });
        alert("Location permission denied or unavailable. Defaulting to Hyderabad, Telangana.");
        setDetectingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationFilter("Hyderabad, Telangana");
      setShowLocationDropdown(false);
      return;
    }

    // Check Cache
    const cached = localStorage.getItem("lowpriceplaces_cached_user_location");
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 15 * 60 * 1000) {
          setLocationFilter(cachedData.location);
          setUserCoords({ lat: cachedData.lat, lng: cachedData.lng });
          setShowLocationDropdown(false);
          fetchListings({ location: cachedData.location, lat: cachedData.lat, lng: cachedData.lng });
          return;
        }
      } catch (cacheErr) {
        console.error("Cache read error:", cacheErr);
      }
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lng: longitude });
      try {
        // Blocked POI keywords
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

        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        const state = data.address.state || "";
        const city = data.address.city || data.address.town || data.address.village || "";
        const locality = data.address.suburb || data.address.neighbourhood || data.address.quarter || data.address.city_district || "";

        const cleanLocality = isBlocked(locality) ? "" : locality;
        const cleanCity = isBlocked(city) ? "" : city;
        const cleanState = isBlocked(state) ? "" : state;

        const parts = [cleanLocality, cleanCity, cleanState].filter((p) => p && p.trim() !== "");
        const detected = parts.join(", ") || "Hyderabad, Telangana";

        setLocationFilter(detected);
        setShowLocationDropdown(false);
        
        // Cache the location
        localStorage.setItem("lowpriceplaces_cached_user_location", JSON.stringify({
          lat: latitude,
          lng: longitude,
          location: detected,
          timestamp: Date.now()
        }));

        fetchListings({ location: detected, lat: latitude, lng: longitude });
      } catch (e) {
        console.error(e);
        setLocationFilter("Hyderabad, Telangana");
        setShowLocationDropdown(false);
        fetchListings({ location: "Hyderabad" });
      }
    }, (err) => {
      console.error(err);
      setLocationFilter("Hyderabad, Telangana");
      setShowLocationDropdown(false);
      fetchListings({ location: "Hyderabad" });
    });
  };

  const toggleBookmark = (id) => {
    const numId = Number(id);
    const currentSaved = (savedListings || []).map(item => Number(item));
    let updated;
    if (currentSaved.includes(numId)) {
      updated = currentSaved.filter(item => item !== numId);
    } else {
      updated = [...currentSaved, numId];
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
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    setSuggestionLoading(true);
    setSuggestionError(null);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await api.getSuggestions(trimmed);
        setSuggestions(data);
      } catch (err) {
        console.error("Suggestions fetch error:", err);
        setSuggestionError("Unable to load suggestions.");
      } finally {
        setSuggestionLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

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
        userCoords,
        setUserCoords,
        
        mobileMenuOpen,
        setMobileMenuOpen,
        mobileFiltersOpen,
        setMobileFiltersOpen,

        subCategoryView,
        setSubCategoryView,
        subCategoryViewLoading,
        setSubCategoryViewLoading,

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
        
        isChatOpen,
        setIsChatOpen,
        allChats,
        setAllChats,
        activeChatId,
        setActiveChatId,
        unreadChatCount,
        fetchUserChats,
        startDirectChatWithListing,
        startChatWithSeller,



        fetchCategories,
        fetchCities,
        citiesLoading,
        citiesError,
        suggestionLoading,
        suggestionError,
        fetchListings,
        fetchSavedListings,
        fetchInquiries,
        fetchSellerListings,
        detectUserLocation,
        detectingLoc,
        handleDetectLocation,
        reverseGeocode,
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
