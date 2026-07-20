import React, { useState, useEffect } from 'react';
import { api, getAuthToken } from './api';
const API_BASE = import.meta.env.VITE_API_BASE;

const getCategoryEmoji = (name) => {
  const term = name.toLowerCase();
  if (term.includes('elec') || term.includes('phone') || term.includes('laptop') || term.includes('camera')) return '💻';
  if (term.includes('vehic') || term.includes('car') || term.includes('bike')) return '🚗';
  if (term.includes('real') || term.includes('home') || term.includes('decor') || term.includes('house') || term.includes('flat') || term.includes('room') || term.includes('pg') || term.includes('hostel')) return '🛋️';
  if (term.includes('job') || term.includes('work') || term.includes('career')) return '💼';
  if (term.includes('serv') || term.includes('contract') || term.includes('repair') || term.includes('plumb')) return '🛠️';
  if (term.includes('rest') || term.includes('food') || term.includes('cafe')) return '🍽️';
  if (term.includes('hotel') || term.includes('stay') || term.includes('lodg')) return '🏨';
  if (term.includes('spa') || term.includes('salon') || term.includes('beauty') || term.includes('hair')) return '💅';
  if (term.includes('wed') || term.includes('marri') || term.includes('event') || term.includes('plan')) return '👰';
  if (term.includes('edu') || term.includes('class') || term.includes('school') || term.includes('teach')) return '🎓';
  if (term.includes('rent') || term.includes('hire')) return '🔑';
  if (term.includes('hosp') || term.includes('doc') || term.includes('clinic') || term.includes('dentist') || term.includes('health')) return '🏥';
  if (term.includes('pet') || term.includes('dog') || term.includes('cat')) return '🐶';
  if (term.includes('agent') || term.includes('brok')) return '👨‍💼';
  if (term.includes('gym') || term.includes('fit') || term.includes('workout')) return '🏋️';
  if (term.includes('loan') || term.includes('finance') || term.includes('bank') || term.includes('money')) return '💰';
  if (term.includes('pack') || term.includes('move') || term.includes('transport')) return '🚚';
  if (term.includes('post') || term.includes('mail') || term.includes('courier') || term.includes('ship')) return '📦';
  return '📁'; // fallback
};

const getSubCategoryEmoji = (name) => {
  const term = name.toLowerCase();
  if (term.includes('phone') || term.includes('mobile')) return '📱';
  if (term.includes('laptop') || term.includes('computer')) return '💻';
  if (term.includes('camera') || term.includes('photo')) return '📷';
  if (term.includes('car') || term.includes('auto')) return '🚗';
  if (term.includes('bike') || term.includes('motor')) return '🏍️';
  if (term.includes('apart') || term.includes('flat')) return '🏢';
  if (term.includes('house') || term.includes('villa')) return '🏠';
  if (term.includes('land') || term.includes('plot')) return '📐';
  if (term.includes('soft') || term.includes('dev') || term.includes('tech')) return '💻';
  if (term.includes('mark') || term.includes('sale') || term.includes('advert')) return '📈';
  if (term.includes('plumb') || term.includes('pipe')) return '🚰';
  if (term.includes('elec') || term.includes('wire') || term.includes('power')) return '⚡';
  if (term.includes('clean') || term.includes('maid')) return '🧹';
  if (term.includes('food') || term.includes('dine') || term.includes('cook')) return '🍳';
  if (term.includes('stay') || term.includes('room')) return '🛏️';
  if (term.includes('hair') || term.includes('makeup') || term.includes('spa')) return '💇‍♀️';
  if (term.includes('music') || term.includes('band')) return '🎵';
  if (term.includes('lesson') || term.includes('tutor') || term.includes('study')) return '📚';
  if (term.includes('rent') || term.includes('hire')) return '🔑';
  if (term.includes('dog') || term.includes('cat') || term.includes('vet')) return '🐾';
  if (term.includes('dentist') || term.includes('teeth')) return '🦷';
  if (term.includes('fit') || term.includes('gym') || term.includes('cardio')) return '💪';
  if (term.includes('loan') || term.includes('mortg')) return '💸';
  if (term.includes('pack') || term.includes('move')) return '📦';
  if (term.includes('ship') || term.includes('deliver')) return '🚚';
  return '🔹'; // fallback
};

const INDIAN_LOCATIONS = [
  "Dilsukh Nagar, Hyderabad",
  "Madhapur, Hyderabad",
  "Gachibowli, Hyderabad",
  "Banjara Hills, Hyderabad",
  "Jubilee Hills, Hyderabad",
  "Connaught Place, Delhi",
  "Chandni Chowk, Delhi",
  "Karol Bagh, Delhi",
  "Dwarka, Delhi",
  "Andheri, Mumbai",
  "Bandra, Mumbai",
  "Colaba, Mumbai",
  "Juhu, Mumbai",
  "Koramangala, Bangalore",
  "Indiranagar, Bangalore",
  "Whitefield, Bangalore",
  "Adyar, Chennai",
  "T. Nagar, Chennai",
  "Salt Lake, Kolkata",
  "Park Street, Kolkata",
  "Koregaon Park, Pune",
  "Hazratganj, Lucknow",
  "Gomti Nagar, Lucknow"
];

export default function App() {
  const ITEMS_PER_PAGE = 20;
  // Product card renderer to reuse across exact and nearby sections
  const renderProductCard = (item) => {
    const hasDiscount = item.discountPercent > 0;
    const finalPrice = hasDiscount ? (item.price * (1 - item.discountPercent / 100)).toFixed(0) : item.price;
    const photos = item.imagePath ? item.imagePath.split(',') : [];
    const coverImage = photos[0] || "";
    const hasMultiplePhotos = photos.length > 1;

    return (
      <div key={item.id} className="glass-panel product-card feed-card" onClick={() => window.location.hash = `#/details/${item.id}`}>
        <div className="card-image-wrapper">
          {hasDiscount && (
            <div className="card-badge">-{item.discountPercent}% OFF</div>
          )}

          {item.averageRating > 0 && (
            <div className="rating-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
              </svg>
              {item.averageRating}
            </div>
          )}

          {hasMultiplePhotos && (
            <div className="photo-count-badge" style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 2,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              📷 +{photos.length - 1} photos
            </div>
          )}

          <img
            src={coverImage ? `${import.meta.env.VITE_IMAGE_SERVER}${coverImage}` : "https://placehold.co/400x300?text=No+Photo"}
            alt={item.title}
            className="card-img"
            onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Listing+Item"; }}
          />
        </div>

        <div className="card-content">
          <h3 className="card-title">{item.title}</h3>
          <p className="card-desc">{item.description}</p>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👤 Seller:</span>
            <strong style={{ color: 'var(--text-main)' }}>{item.seller?.username || 'Seller'}</strong>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📅 Posted:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="card-prices">
            {hasDiscount ? (
              <>
                <span className="price-discounted">₹{finalPrice}</span>
                <span className="price-original">₹{item.price}</span>
              </>
            ) : (
              <span className="price-discounted">₹{item.price}</span>
            )}
          </div>

          <div style={{ marginTop: 'auto', marginBottom: '12px' }}>
            <div className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px', fontSize: '13px', borderRadius: '8px', fontWeight: '600' }}>
              View More Details →
            </div>
          </div>

          <div className="card-meta">
            <span>📍 {item.location}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-id" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>
                LPP-{String(item.id).padStart(5, '0')}
              </span>
              <span>{item.category?.name}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };
  // Navigation & Session
  const [page, setPage] = useState('home'); // home, details, login, register, dashboard
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Cache & Database data
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [nearbyListings, setNearbyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedListings, setSavedListings] = useState([]);

  // Theme support (light/dark)
  const [theme, setTheme] = useState(() => localStorage.getItem('glassify_theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('glassify_theme', theme);
  }, [theme]);

  // Homepage Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all'); // category ID or 'all'
  const [selectedCatFilter, setSelectedCatFilter] = useState(null);
  const [selectedSubCatFilter, setSelectedSubCatFilter] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [photonSuggestions, setPhotonSuggestions] = useState([]);
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

  const getCityEmoji = (city) => {
    const found = citiesList.find(c => c.name.toLowerCase() === city.toLowerCase());
    return found ? found.emoji : '📍';
  };

  useEffect(() => {
    const handleScroll = () => {
      if (page === 'home' && window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page]);

  // Sync search input with filter changes
  useEffect(() => {
    setLocationSearchInput(locationFilter);
  }, [locationFilter]);

  // Fetch real-time suggestions from Photon (OpenStreetMap geocoding API) filtered to India bounding box
  useEffect(() => {
    if (!locationSearchInput || locationSearchInput.length < 2) {
      setPhotonSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationSearchInput)}&limit=8&bbox=68.1,6.8,97.4,35.5`);
        const data = await res.json();

        const suggestions = data.features.map(f => {
          const props = f.properties;
          const name = props.name || '';
          const city = props.city || props.town || props.district || '';
          const state = props.state || '';

          const parts = [name, city, state].filter(p => p.trim() !== '');
          const uniqueParts = [...new Set(parts)];
          return uniqueParts.join(', ');
        }).filter(Boolean);

        setPhotonSuggestions([...new Set(suggestions)]);
      } catch (e) {
        console.error("Photon Geocoding API error:", e);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [locationSearchInput]);

  const displayedLocations = locationSearchInput.length >= 2 && photonSuggestions.length > 0
    ? photonSuggestions
    : INDIAN_LOCATIONS.filter(loc => loc.toLowerCase().includes(locationSearchInput.toLowerCase())).slice(0, 8);

  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          // Find town, city, or village
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.location-search-box')) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Detail Page Data
  const [listingDetails, setListingDetails] = useState(null);
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState('');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewVideos, setReviewVideos] = useState([]);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Admin Cities form state
  const [cityNameInput, setCityNameInput] = useState('');
  const [cityEmojiInput, setCityEmojiInput] = useState('📍');
  const [adminCityError, setAdminCityError] = useState('');
  const [adminCitySuccess, setAdminCitySuccess] = useState('');

  // Seller Dashboard state
  const [dashboardTab, setDashboardTab] = useState('my-listings'); // my-listings, add-listing, leads, saved
  const [sellerInquiries, setSellerInquiries] = useState([]);
  const [buyerInquiries, setBuyerInquiries] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [activeInquiryId, setActiveInquiryId] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [sellerListings, setSellerListings] = useState([]);

  // Listing creation form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDiscount, setNewDiscount] = useState('0');
  const [newLocation, setNewLocation] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [activeDetailImage, setActiveDetailImage] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');
  const [selectedSignupRole, setSelectedSignupRole] = useState('select');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState(''); // 'today', 'yesterday', or 'YYYY-MM-DD'
  const [customDateInput, setCustomDateInput] = useState('');
  const [selectedSortBy, setSelectedSortBy] = useState('date_desc'); // 'date_desc', 'price_asc', 'price_desc'

  // Auto-detect and set seller's exact location (Area, City, State) when loading Add Listing tab
  const autoDetectListingLocation = () => {
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

          setNewLocation(formatted || 'Hyderabad, Telangana');
          console.log("Auto-detected exact listing location:", formatted);
        } catch (e) {
          console.error("Auto detect listing geocode lookup failed:", e);
        }
      }, (err) => {
        console.error("Auto detect listing geolocation query failed:", err);
      });
    }
  };

  useEffect(() => {
    if (dashboardTab === 'add-listing') {
      autoDetectListingLocation();
    }
  }, [dashboardTab]);

  const [showAddLocDropdown, setShowAddLocDropdown] = useState(false);
  const [addLocSuggestions, setAddLocSuggestions] = useState([]);
  const [showEditLocDropdown, setShowEditLocDropdown] = useState(false);
  const [editLocSuggestions, setEditLocSuggestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentNearbyPage, setCurrentNearbyPage] = useState(1);

  // Fetch real-time suggestions from Photon (OpenStreetMap geocoding API) for creation location field
  useEffect(() => {
    if (!newLocation || newLocation.length < 2) {
      setAddLocSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(newLocation)}&limit=8&bbox=68.1,6.8,97.4,35.5`);
        const data = await res.json();
        const suggestions = data.features.map(f => {
          const props = f.properties;
          const name = props.name || '';
          const city = props.city || props.town || props.district || '';
          const state = props.state || '';
          const parts = [name, city, state].filter(p => p && p.trim() !== '');
          return [...new Set(parts)].join(', ');
        }).filter(Boolean);
        setAddLocSuggestions([...new Set(suggestions)]);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [newLocation]);

  // Fetch real-time suggestions from Photon (OpenStreetMap geocoding API) for edit location field
  useEffect(() => {
    if (!editingListing?.location || editingListing.location.length < 2) {
      setEditLocSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(editingListing.location)}&limit=8&bbox=68.1,6.8,97.4,35.5`);
        const data = await res.json();
        const suggestions = data.features.map(f => {
          const props = f.properties;
          const name = props.name || '';
          const city = props.city || props.town || props.district || '';
          const state = props.state || '';
          const parts = [name, city, state].filter(p => p && p.trim() !== '');
          return [...new Set(parts)].join(', ');
        }).filter(Boolean);
        setEditLocSuggestions([...new Set(suggestions)]);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [editingListing?.location]);

  // Close form location dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.form-group')) {
        setShowAddLocDropdown(false);
        setShowEditLocDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Autocomplete Suggestions logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const filterTerm = searchQuery.toLowerCase();

    // Auto suggest matching listings, categories or subcategories
    const listSuggestions = listings
      .filter(l => l.title.toLowerCase().includes(filterTerm))
      .slice(0, 4)
      .map(l => ({ id: l.id, label: l.title, type: 'Listing' }));

    const catSuggestions = categories
      .filter(c => c.name.toLowerCase().includes(filterTerm))
      .map(c => ({ id: c.id, label: c.name, type: 'Category' }));

    const subSuggestions = categories
      .flatMap(c => c.subCategories)
      .filter(s => s.name.toLowerCase().includes(filterTerm))
      .map(s => ({ id: s.id, label: s.name, type: 'SubCategory' }));

    setSuggestions([...listSuggestions, ...catSuggestions, ...subSuggestions].slice(0, 8));
  }, [searchQuery, listings, categories]);

  // Load user status, categories, and listings on startup + Hash Router
  useEffect(() => {
    const init = async () => {
      try {
        if (getAuthToken()) {
          const currentUser = await api.getMe();
          setUser(currentUser);
        }
        const cats = await api.getCategories();
        setCategories(cats);
        try {
          const loadedCities = await api.getCities();
          setCitiesList(loadedCities);
        } catch (cityErr) {
          console.error("Error loading cities:", cityErr);
        }
      } catch (e) {
        console.error("Initialization error:", e);
        api.logout();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    init();

    // Load saved bookmarks from localStorage
    const saved = localStorage.getItem("lowpriceplaces_saved");
    if (saved) setSavedListings(JSON.parse(saved));

    // Listen to hash change event
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';

      if (getAuthToken()) {
        if (hash === '#/login' || hash === '#/register' || hash === '#/forgot-password' || hash.startsWith('#/reset-password')) {
          window.location.hash = '#/';
          return;
        }
      }

      if (hash.startsWith('#/details/')) {
        const id = parseInt(hash.replace('#/details/', ''));
        if (id) {
          setSelectedListingId(id);
          setLoading(true);
          api.getListingDetails(id).then(data => {
            setListingDetails(data);
            const firstImg = data.imagePath ? data.imagePath.split(',')[0] : '';
            setActiveDetailImage(firstImg);
            setPage('details');
            setInquirySuccess('');
            setInquiryText('');
            setReviewComment('');
            setReviewSuccess('');
            setReviewError('');
          }).catch(err => {
            console.error(err);
            window.location.hash = '#/';
          }).finally(() => setLoading(false));
        }
      } else if (hash.startsWith('#/dashboard')) {
        if (!getAuthToken()) {
          window.location.hash = '#/login';
          return;
        }
        setPage('dashboard');
        const parts = hash.split('/');
        if (parts[2]) {
          setDashboardTab(parts[2]);
        }
      } else if (hash === '#/login') {
        setPage('login');
      } else if (hash === '#/register') {
        setSelectedSignupRole('select');
        setPage('register');
      } else if (hash === '#/forgot-password') {
        setPage('forgot-password');
      } else if (hash.startsWith('#/reset-password')) {
        setPage('reset-password');
      } else {
        setPage('home');
        setSelectedListingId(null);
        setListingDetails(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on initial load/refresh

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auto fetch public listings when returning to home page
  useEffect(() => {
    if (page === 'home') {
      fetchListings();
    }
  }, [page]);

  // Update bookmarks to localStorage
  const toggleBookmark = (id) => {
    let updated;
    if (savedListings.includes(id)) {
      updated = savedListings.filter(item => item !== id);
    } else {
      updated = [...savedListings, id];
    }
    setSavedListings(updated);
    localStorage.setItem("lowpriceplaces_saved", JSON.stringify(updated));
  };

  // SEO tags live updater based on current route/page
  useEffect(() => {
    let route = "/";
    if (page === 'details' && selectedListingId) {
      route = `/listings/${selectedListingId}`;
    } else if (page !== 'home') {
      route = `/${page}`;
    }

    api.getSEO(route).then(seo => {
      // Set Document title tag
      document.title = seo.titleTag || (listingDetails ? `${listingDetails.title} - lowpriceplaces` : "lowpriceplaces");

      // Set Meta Description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = seo.metaDescription || (listingDetails ? listingDetails.description.substring(0, 150) : "lowpriceplaces local listings website.");

      // Set Keywords
      let metaKeys = document.querySelector('meta[name="keywords"]');
      if (!metaKeys) {
        metaKeys = document.createElement('meta');
        metaKeys.name = "keywords";
        document.head.appendChild(metaKeys);
      }
      metaKeys.content = seo.keywords || "classifieds, marketplace";
    }).catch(err => console.error("SEO Injector error:", err));
  }, [page, selectedListingId, listingDetails]);

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

  // Fetch Listings wrapper
  const fetchListings = async (customFilters = {}) => {
    setLoading(true);
    setCurrentPage(1);
    setCurrentNearbyPage(1);
    try {
      // Merge custom parameters with current states to avoid stale values
      const mergedQ = customFilters.q !== undefined ? customFilters.q : searchQuery;
      const mergedMinPrice = customFilters.minPrice !== undefined ? customFilters.minPrice : minPrice;
      const mergedMaxPrice = customFilters.maxPrice !== undefined ? customFilters.maxPrice : maxPrice;
      const mergedDiscount = customFilters.discountOnly !== undefined ? customFilters.discountOnly : (discountOnly ? 'true' : 'false');

      // Determine the exact search location (priority: customFilters.location -> locationFilter)
      const exactLocation = customFilters.location !== undefined
        ? customFilters.location
        : locationFilter;

      const isNationwide = exactLocation && exactLocation.toLowerCase() === 'india';

      // Extract the parent city so we query the database for all listings in that city
      const parentCity = isNationwide ? '' : extractParentCity(exactLocation);

      const mergedDateFilter = customFilters.dateFilter !== undefined ? customFilters.dateFilter : selectedDateFilter;
      const mergedSortBy = customFilters.sortBy !== undefined ? customFilters.sortBy : selectedSortBy;

      const activeFilters = {
        q: mergedQ,
        minPrice: mergedMinPrice,
        maxPrice: mergedMaxPrice,
        location: isNationwide ? '' : (parentCity || exactLocation),
        discountOnly: mergedDiscount,
        dateFilter: mergedDateFilter,
        sortBy: mergedSortBy
      };

      // Ensure we pass the parentCity to the API request if location is present and not nationwide
      if (exactLocation && !isNationwide && customFilters.location === undefined) {
        activeFilters.location = parentCity;
      }

      if (customFilters.categoryId !== undefined) {
        if (customFilters.categoryId === null) {
          delete activeFilters.categoryId;
        } else {
          activeFilters.categoryId = customFilters.categoryId;
        }
      } else if (selectedCatFilter) {
        activeFilters.categoryId = selectedCatFilter.id;
      }

      if (customFilters.subCategoryId !== undefined) {
        if (customFilters.subCategoryId === null) {
          delete activeFilters.subCategoryId;
        } else {
          activeFilters.subCategoryId = customFilters.subCategoryId;
        }
      } else if (selectedSubCatFilter) {
        activeFilters.subCategoryId = selectedSubCatFilter.id;
      }

      // Scoped search box integration
      if (searchScope !== 'all' && customFilters.categoryId === undefined) {
        activeFilters.categoryId = searchScope;
      }

      const list = await api.getListings(activeFilters);

      // Sort items: exact location matches first, city fallback matches second
      if (exactLocation && !isNationwide) {
        const queryLower = exactLocation.toLowerCase();

        // Extract the primary segment of the search location (e.g. "Dilsukh Nagar" from "Dilsukh Nagar, Hyderabad")
        const primarySegment = queryLower.split(',')[0].trim();

        const exactMatches = list.filter(item => {
          if (!item.location) return false;
          const locLower = item.location.toLowerCase();

          // Must contain the primary search segment exactly
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
      console.error("Listing loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSuggestions([]);
    if (window.location.hash !== '#/' && window.location.hash !== '') {
      window.location.hash = '#/';
    } else {
      fetchListings();
    }
  };

  const handleSuggestionClick = (sug) => {
    setSearchQuery(sug.label);
    setSuggestions([]);
    if (sug.type === 'Listing') {
      setSelectedListingId(sug.id);
      window.location.hash = `#/details/${sug.id}`;
    } else if (sug.type === 'Category') {
      const cat = categories.find(c => c.id === sug.id);
      setSelectedCatFilter(cat);
      setSelectedSubCatFilter(null);
      if (window.location.hash !== '#/' && window.location.hash !== '') {
        window.location.hash = '#/';
      } else {
        fetchListings({ categoryId: cat.id, subCategoryId: null });
      }
    } else if (sug.type === 'SubCategory') {
      const sub = categories.flatMap(c => c.subCategories).find(sub => sub.id === sug.id);
      setSelectedSubCatFilter(sub);
      if (window.location.hash !== '#/' && window.location.hash !== '') {
        window.location.hash = '#/';
      } else {
        fetchListings({ subCategoryId: sub.id });
      }
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
      q: '',
      categoryId: null,
      subCategoryId: null,
      minPrice: '',
      maxPrice: '',
      location: 'India',
      discountOnly: 'false',
      dateFilter: '',
      sortBy: 'date_desc'
    });
  };

  // Listing details retrieval
  const loadListingDetails = async (id) => {
    setLoading(true);
    try {
      const data = await api.getListingDetails(id);
      setListingDetails(data);
      const firstImg = data.imagePath ? data.imagePath.split(',')[0] : '';
      setActiveDetailImage(firstImg);
      setPage('details');
      setInquirySuccess('');
      setInquiryText('');
      setReviewComment('');
      setReviewSuccess('');
      setReviewError('');
      setReviewImages([]);
      setReviewVideos([]);
    } catch (e) {
      alert("Error loading product detail: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Send product inquiry (In-app Chat messaging)
  const submitInquiry = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.hash = '#/login';
      return;
    }
    if (!inquiryText.trim()) return;

    try {
      await api.sendInquiry(listingDetails.id, inquiryText);
      setInquirySuccess("Inquiry sent successfully! The seller has been notified in their leads inbox.");
      setInquiryText('');
    } catch (e) {
      alert(e.message);
    }
  };

  // Submit product review (with photo and video uploads)
  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.hash = '#/login';
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError("Please type a comment.");
      return;
    }

    const formData = new FormData();
    formData.append("rating", reviewRating);
    formData.append("comment", reviewComment);

    for (let i = 0; i < reviewImages.length; i++) {
      formData.append("images", reviewImages[i]);
    }
    for (let i = 0; i < reviewVideos.length; i++) {
      formData.append("videos", reviewVideos[i]);
    }

    try {
      const newReview = await api.submitReview(listingDetails.id, formData);
      setReviewSuccess("Review submitted! Thank you.");
      setReviewComment('');
      setReviewImages([]);
      setReviewVideos([]);
      setReviewError('');
      loadListingDetails(listingDetails.id); // Reload listings for rating averages
    } catch (err) {
      setReviewError(err.message);
    }
  };

  // Google OAuth Login handler
  const handleGoogleLoginResponse = async (response) => {
    try {
      setAuthError('');
      const currentUser = await api.googleAuth(response.credential, selectedSignupRole);
      setUser(currentUser);
      window.location.hash = '#/';
      fetchListings();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Google OAuth Initializer
  useEffect(() => {
    if ((page === 'login' || page === 'register') && typeof google !== 'undefined') {
      try {
        google.accounts.id.initialize({
          client_id: "613674321182-t4m0rv59tfkdhev3m4pke7hht7hbe0pl.apps.googleusercontent.com",
          callback: handleGoogleLoginResponse
        });

        // On registration page, the container is conditionally rendered, so we wait briefly for DOM flush
        if (page === 'login' || (page === 'register' && selectedSignupRole !== 'select')) {
          setTimeout(() => {
            const container = document.getElementById("google-signin-btn");
            if (container) {
              google.accounts.id.renderButton(container, {
                theme: "outline",
                size: "large",
                width: "360"
              });
            }
          }, 50);
        }
      } catch (err) {
        console.error("Google authentication rendering error:", err);
      }
    }
  }, [page, selectedSignupRole]);

  // Forgot Password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    const email = e.target.email.value;
    try {
      const res = await api.forgotPassword(email);
      console.log(res.message + (res.resetLink ? "\n\nReset Link for local testing:\n" + res.resetLink : ""));
      alert(res.message + (res.resetLink ? "\n\nReset Link for local testing:\n" + res.resetLink : ""));
      window.location.hash = '#/login';
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Reset Password handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;
    if (newPassword !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    // Extract token from URL hash query
    const hash = window.location.hash;
    const queryIdx = hash.indexOf('?');
    if (queryIdx === -1) {
      setAuthError("Reset token not found in URL.");
      return;
    }
    const urlParams = new URLSearchParams(hash.substring(queryIdx + 1));
    const token = urlParams.get('token');

    if (!token) {
      setAuthError("Reset token not found in URL.");
      return;
    }

    try {
      const res = await api.resetPassword(token, newPassword);
      alert(res.message);
      window.location.hash = '#/login';
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      const currentUser = await api.login(email, password);
      setUser(currentUser);
      window.location.hash = '#/';
      fetchListings();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const role = form.role.value;

    try {
      const currentUser = await api.register(email, password, role);
      setUser(currentUser);
      window.location.hash = '#/';
      fetchListings();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Create Listing upload handler
  const handleCreateListing = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!newCategory) {
      setCreateError("Please select a Category.");
      return;
    }

    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("description", newDesc);
    formData.append("price", newPrice);
    formData.append("discountPercent", newDiscount);
    formData.append("location", newLocation);
    formData.append("whatsappNumber", newWhatsapp);
    formData.append("contactNumber", newPhone);
    formData.append("categoryId", newCategory);
    if (newSubCategory) formData.append("subCategoryId", newSubCategory);

    if (newImageFiles && newImageFiles.length > 0) {
      for (let i = 0; i < newImageFiles.length; i++) {
        formData.append("image", newImageFiles[i]);
      }
    }

    try {
      await api.createListing(formData);
      setCreateSuccess("Listing posted successfully! Since your role is SELLER, it is currently PENDING moderation approval from our Editors/Admins.");
      // Reset form fields
      setNewTitle('');
      setNewDesc('');
      setNewPrice('');
      setNewDiscount('0');
      setNewLocation('');
      setNewWhatsapp('');
      setNewPhone('');
      setNewImageFiles([]);
      setNewCategory('');
      setNewSubCategory('');
      fetchListings();
    } catch (err) {
      setCreateError(err.message);
    }
  };

  // Admin Cities Handlers
  const handleAddCity = async (e) => {
    e.preventDefault();
    setAdminCityError('');
    setAdminCitySuccess('');
    if (!cityNameInput.trim()) {
      setAdminCityError("City name cannot be blank.");
      return;
    }
    try {
      const newCity = await api.addCity(cityNameInput.trim(), cityEmojiInput.trim() || '📍');
      setAdminCitySuccess(`City "${newCity.name}" added successfully!`);
      setCityNameInput('');
      setCityEmojiInput('📍');
      // Refresh list
      const loadedCities = await api.getCities();
      setCitiesList(loadedCities);
    } catch (err) {
      setAdminCityError(err.message);
    }
  };

  const handleDeleteCity = async (cityId, cityName) => {
    if (!confirm(`Are you sure you want to delete "${cityName}"?`)) return;
    setAdminCityError('');
    setAdminCitySuccess('');
    try {
      await api.deleteCity(cityId);
      setAdminCitySuccess(`City "${cityName}" deleted successfully.`);
      // Refresh list
      const loadedCities = await api.getCities();
      setCitiesList(loadedCities);
    } catch (err) {
      setAdminCityError(err.message);
    }
  };

  // Load dashboard tables
  const loadDashboardData = async () => {
    if (!user) return;
    try {
      if (user.role === 'SELLER') {
        const inquiries = await api.getSellerInquiries();
        setSellerInquiries(inquiries);
        if (inquiries.length > 0 && !activeInquiryId) {
          setActiveInquiryId(inquiries[0].id);
          const lastMsg = inquiries[0].messages?.[inquiries[0].messages.length - 1];
          if (lastMsg && lastMsg.senderId !== user.id && inquiries[0].status !== 'READ') {
            await fetch(`${import.meta.env.VITE_API_BASE}/inquiries/${inquiries[0].id}/read`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('lowpriceplaces_token')}` }
            });
            inquiries[0].status = 'READ';
          }
        }
        // Fetch seller's own listings (all statuses: ACTIVE, PENDING, REJECTED, SOLD, INACTIVE)
        const ownListings = await api.getListings({ sellerId: user.id, status: 'ALL' });
        setSellerListings(ownListings);
      } else if (user.role === 'BUYER') {
        const inquiries = await api.getBuyerInquiries();
        setBuyerInquiries(inquiries);
        if (inquiries.length > 0 && !activeInquiryId) {
          setActiveInquiryId(inquiries[0].id);
          const lastMsg = inquiries[0].messages?.[inquiries[0].messages.length - 1];
          if (lastMsg && lastMsg.senderId !== user.id && inquiries[0].status !== 'READ') {
            await fetch(`${import.meta.env.VITE_API_BASE}/inquiries/${inquiries[0].id}/read`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('lowpriceplaces_token')}` }
            });
            inquiries[0].status = 'READ';
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load inquiries whenever dashboard state changes
  useEffect(() => {
    if (page === 'dashboard' && user) {
      loadDashboardData();
    }
  }, [page, dashboardTab, user]);

  // Focus-based Polling for Leads & Sent Inquiries Messages (every 5 seconds)
  useEffect(() => {
    if (page !== 'dashboard' || !user) return;

    const shouldPoll =
      (user.role === 'SELLER' && dashboardTab === 'leads') ||
      (user.role === 'BUYER' && dashboardTab === 'inquiries');

    if (!shouldPoll) return;

    const pollInterval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        if (user.role === 'SELLER') {
          const inquiries = await api.getSellerInquiries();
          const totalMsgsBefore = sellerInquiries.reduce((acc, inq) => acc + (inq.messages?.length || 0), 0);
          const totalMsgsAfter = inquiries.reduce((acc, inq) => acc + (inq.messages?.length || 0), 0);

          if (totalMsgsAfter > totalMsgsBefore) {
            let hasNewIncoming = false;
            inquiries.forEach(inq => {
              const oldInq = sellerInquiries.find(o => o.id === inq.id);
              const oldLength = oldInq ? (oldInq.messages?.length || 0) : 0;
              const newLength = inq.messages?.length || 0;
              if (newLength > oldLength) {
                const lastMsg = inq.messages[newLength - 1];
                if (lastMsg && lastMsg.senderId !== user.id) {
                  hasNewIncoming = true;
                  if (inq.id === activeInquiryId) {
                    markAsRead(inq.id);
                  }
                }
              }
            });
            if (hasNewIncoming) {
              playNotificationSound();
            }
          }
          setSellerInquiries(inquiries);
        } else if (user.role === 'BUYER') {
          const inquiries = await api.getBuyerInquiries();
          const totalMsgsBefore = buyerInquiries.reduce((acc, inq) => acc + (inq.messages?.length || 0), 0);
          const totalMsgsAfter = inquiries.reduce((acc, inq) => acc + (inq.messages?.length || 0), 0);

          if (totalMsgsAfter > totalMsgsBefore) {
            let hasNewIncoming = false;
            inquiries.forEach(inq => {
              const oldInq = buyerInquiries.find(o => o.id === inq.id);
              const oldLength = oldInq ? (oldInq.messages?.length || 0) : 0;
              const newLength = inq.messages?.length || 0;
              if (newLength > oldLength) {
                const lastMsg = inq.messages[newLength - 1];
                if (lastMsg && lastMsg.senderId !== user.id) {
                  hasNewIncoming = true;
                  if (inq.id === activeInquiryId) {
                    markAsRead(inq.id);
                  }
                }
              }
            });
            if (hasNewIncoming) {
              playNotificationSound();
            }
          }
          setBuyerInquiries(inquiries);
        }
      } catch (err) {
        console.error("Polling inquiries error:", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [page, dashboardTab, user, sellerInquiries, buyerInquiries, activeInquiryId]);

  // Auto-scroll chat boxes to bottom on new messages
  useEffect(() => {
    const scrollChatsToBottom = () => {
      const activeInquiries = user?.role === 'SELLER' ? sellerInquiries : buyerInquiries;
      if (!activeInquiries) return;

      activeInquiries.forEach(inq => {
        const el = document.getElementById(`chat-messages-${inq.id}`);
        if (el) {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    };

    const timer = setTimeout(scrollChatsToBottom, 100);
    return () => clearTimeout(timer);
  }, [sellerInquiries, buyerInquiries, user]);

  // Synthesize a beautiful chime notification sound offline using HTML5 Web Audio API
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.2);
      }, 80);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  // Mark an inquiry thread as READ on the server
  const markAsRead = async (inquiryId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE}/inquiries/${inquiryId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lowpriceplaces_token')}`
        }
      });

      // Update local state
      if (user.role === 'SELLER') {
        setSellerInquiries(prev => prev.map(inq => inq.id === inquiryId ? { ...inq, status: 'READ' } : inq));
      } else {
        setBuyerInquiries(prev => prev.map(inq => inq.id === inquiryId ? { ...inq, status: 'READ' } : inq));
      }
    } catch (e) {
      console.error("Error marking as read:", e);
    }
  };

  // Send back-and-forth chat message in lead inquiry
  const handleSendMessage = async (inquiryId) => {
    const text = replyTexts[inquiryId];
    if (!text || !text.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/inquiries/${inquiryId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('lowpriceplaces_token')}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send message");
      }

      const newMsg = await response.json();

      setReplyTexts(prev => ({ ...prev, [inquiryId]: '' }));

      if (user.role === 'SELLER') {
        setSellerInquiries(prev => prev.map(inq => {
          if (inq.id === inquiryId) {
            return {
              ...inq,
              messages: [...inq.messages, newMsg],
              status: 'REPLIED',
              replyMessage: text
            };
          }
          return inq;
        }));
      } else if (user.role === 'BUYER') {
        setBuyerInquiries(prev => prev.map(inq => {
          if (inq.id === inquiryId) {
            return {
              ...inq,
              messages: [...inq.messages, newMsg],
              status: 'UNREAD'
            };
          }
          return inq;
        }));
      }
    } catch (err) {
      alert("Error sending message: " + err.message);
    }
  };

  // Change product listing status (Active, Inactive, Sold)
  const updateListingStatus = async (id, status) => {
    try {
      await api.changeListingStatus(id, status);
      fetchListings();
      loadDashboardData(); // Refresh dashboard listings
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit edited listing details (resets status to PENDING)
  const handleSaveListingDetails = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", editingListing.title);
    formData.append("description", editingListing.description);
    formData.append("price", editingListing.price);
    formData.append("discountPercent", editingListing.discountPercent);
    formData.append("location", editingListing.location);
    formData.append("categoryId", editingListing.categoryId);
    if (editingListing.subCategoryId) {
      formData.append("subCategoryId", editingListing.subCategoryId);
    }

    if (editImageFiles && editImageFiles.length > 0) {
      for (let i = 0; i < editImageFiles.length; i++) {
        formData.append("image", editImageFiles[i]);
      }
    }

    try {
      await api.editListingDetails(editingListing.id, formData);
      setEditingListing(null);
      setEditImageFiles([]);
      alert("Listing edited successfully! Since you are a SELLER, the listing has been set to PENDING for Admin/Editor moderation approval.");
      fetchListings();
      loadDashboardData(); // Refresh dashboard listings
    } catch (err) {
      alert("Error editing listing: " + err.message);
    }
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

  const renderFilterContent = (isMobile = false) => {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>Filters</span>
          <span
            onClick={() => {
              handleClearAllFilters();
              if (isMobile) setMobileFiltersOpen(false);
            }}
            style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
          >
            Clear All
          </span>
        </div>

        <div className="filter-group">
          <div className="filter-title">Sort By</div>
          <select
            className="form-select"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px', fontSize: '13px' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter === ''}
                onChange={() => setSelectedDateFilter('')}
              />
              All Time
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter === 'today'}
                onChange={() => setSelectedDateFilter('today')}
              />
              Today
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter === 'yesterday'}
                onChange={() => setSelectedDateFilter('yesterday')}
              />
              Yesterday
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={isMobile ? "mobileDateFilter" : "dateFilter"}
                checked={selectedDateFilter !== '' && selectedDateFilter !== 'today' && selectedDateFilter !== 'yesterday'}
                onChange={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  setSelectedDateFilter(todayStr);
                  setCustomDateInput(todayStr);
                }}
              />
              Specific Date
            </label>

            {selectedDateFilter !== '' && selectedDateFilter !== 'today' && selectedDateFilter !== 'yesterday' && (
              <input
                type="date"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  marginTop: '4px'
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
            <span style={{ color: 'var(--text-dim)' }}>-</span>
            <input
              type="number"
              placeholder="Max"
              className="price-input"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id={isMobile ? "mobile-discount-check" : "discount-check"}
            checked={discountOnly}
            onChange={(e) => setDiscountOnly(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor={isMobile ? "mobile-discount-check" : "discount-check"} style={{ fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            Discounted Deals Only
          </label>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={() => {
          fetchListings();
          if (isMobile) setMobileFiltersOpen(false);
        }}>
          Apply Filters
        </button>
      </>
    );
  };

  const renderSearchForm = () => {
    return (
      <form className="dual-search-container" onSubmit={handleSearchSubmit}>
        {/* Location Search Box */}
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

        {/* Keyword Search Box */}
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
                fetchListings({ q: '' });
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

          {/* Suggestions Overlay */}
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

  if (getAuthToken() && authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="loading-spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading your session...</span>
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
          <div className="brand-logo" onClick={() => { window.location.hash = '#/'; setSelectedCatFilter(null); setSelectedSubCatFilter(null); fetchListings({ categoryId: null, subCategoryId: null }); }}>
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

          {/* Dual Justdial-style Search Bar Wrapper (only displayed on home page) */}
          {page === 'home' && (
            <div className="search-wrapper" style={{ flex: 1, maxWidth: '600px', height: '46px', display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
              {renderSearchForm()}
            </div>
          )}

          <div className="mobile-header-actions" style={{ display: 'none', marginLeft: 'auto', gap: '10px', alignItems: 'center' }}>
            {page !== 'home' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  window.location.hash = '#/';
                  setTimeout(() => {
                    const searchHero = document.querySelector('.mobile-search-hero');
                    if (searchHero) {
                      searchHero.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
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

          {/* User Account / Navigation Controls */}
          <div className="nav-actions">
            {page !== 'home' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  window.location.hash = '#/';
                  setTimeout(() => {
                    const searchHero = document.querySelector('.mobile-search-hero');
                    if (searchHero) {
                      searchHero.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
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

                {/* Dashboards routing dependent on client status */}
                {(user.role === 'SELLER' || user.role === 'BUYER' || user.role === 'ADMIN') && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (user.role === 'ADMIN') {
                        window.location.href = 'https://admin2.lowpriceplaces.com';
                      } else {
                        window.location.hash = `#/dashboard/${user.role === 'SELLER' ? 'my-listings' : 'inquiries'}`;
                      }
                    }}
                  >
                    {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Profile'}
                  </button>
                )}

                <button className="btn btn-primary" onClick={() => { api.logout(); setUser(null); window.location.hash = '#/'; }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => window.location.hash = '#/login'}>Sign In</button>
                <button className="btn btn-primary" onClick={() => window.location.hash = '#/register'}>Register</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="content-wrapper">

        {/* LOGIN VIEW */}
        {page === 'login' && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="glass-panel form-card" style={{ width: '400px' }}>
              <h2 className="form-title">Welcome Back</h2>
              {authError && <div className="alert-banner alert-error">{authError}</div>}
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" className="form-input" placeholder="email@example.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" className="form-input" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Sign In</button>
              </form>

              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center' }}></div>
              </div>

              <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => window.location.hash = '#/register'}>Register Here</span>
              </p>
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => window.location.hash = '#/forgot-password'}>Forgot Password?</span>
              </p>
            </div>
          </div>
        )}

        {/* REGISTER VIEW */}
        {page === 'register' && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="glass-panel form-card" style={{ width: '450px' }}>
              <h2 className="form-title">Join lowpriceplaces</h2>
              {authError && <div className="alert-banner alert-error">{authError}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Select Account Type</label>
                  <select
                    name="role"
                    className="form-select"
                    value={selectedSignupRole}
                    onChange={(e) => setSelectedSignupRole(e.target.value)}
                    required
                  >
                    <option value="select">-- Select Account Type --</option>
                    <option value="BUYER">Buyer (Explore, bookmark, rate & message sellers)</option>
                    <option value="SELLER">Seller (Advertise listings, add discounts, get WhatsApp leads)</option>
                  </select>
                </div>

                {selectedSignupRole !== 'select' ? (
                  <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center' }}></div>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255,255,255,0.02)' }}>
                    👉 Please select an Account Type above to enable Google Registration.
                  </div>
                )}
              </div>

              <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => window.location.hash = '#/login'}>Sign In</span>
              </p>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {page === 'forgot-password' && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="glass-panel form-card" style={{ width: '400px' }}>
              <h2 className="form-title">Forgot Password</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                Enter the email address associated with your account and we will generate a password reset link.
              </p>
              {authError && <div className="alert-banner alert-error">{authError}</div>}
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" className="form-input" placeholder="email@example.com" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Request Reset Link</button>
              </form>
              <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Back to <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => window.location.hash = '#/login'}>Sign In</span>
              </p>
            </div>
          </div>
        )}

        {/* RESET PASSWORD VIEW */}
        {page === 'reset-password' && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="glass-panel form-card" style={{ width: '400px' }}>
              <h2 className="form-title">Reset Password</h2>
              {authError && <div className="alert-banner alert-error">{authError}</div>}
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" name="newPassword" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" name="confirmPassword" className="form-input" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Save New Password</button>
              </form>
            </div>
          </div>
        )}

        {/* HOME FEED VIEW */}
        {page === 'home' && (
          <div className="home-content-container">

            {/* Mobile Hero Search (Hidden on Desktop via CSS) */}
            <div className="mobile-search-hero">
              {renderSearchForm()}
            </div>

            {/* Top Categories Grid Bar */}
            <div className="glass-panel mobile-flat-panel" style={{ padding: '24px' }}>
              <div className="mobile-section-title" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📁 Browse Categories
              </div>
              <div className="category-bar-grid">
                <div
                  className="category-bar-item"
                  onClick={() => { setSelectedCatFilter(null); setSelectedSubCatFilter(null); fetchListings({ categoryId: null, subCategoryId: null }); }}
                >
                  <div className={`category-bar-icon-box ${!selectedCatFilter ? 'active' : ''}`}>
                    <span className="category-bar-emoji">☰</span>
                  </div>
                  <span className="category-bar-label">All Categories</span>
                </div>

                {categories.map(cat => {
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
                      <div className={`category-bar-icon-box ${isSelected ? 'active' : ''}`}>
                        <span className="category-bar-emoji">{cat.emoji || '📁'}</span>
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
                    {selectedCatFilter.subCategories.map(sub => {
                      const isSubSelected = selectedSubCatFilter?.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          className={`subcategory-pill-btn ${isSubSelected ? 'active' : ''}`}
                          onClick={() => {
                            if (isSubSelected) {
                              setSelectedSubCatFilter(null);
                              fetchListings({ subCategoryId: null });
                            } else {
                              setSelectedSubCatFilter(sub);
                              fetchListings({ subCategoryId: sub.id });
                            }
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <span>{sub.emoji || '🔹'}</span>
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Explore by City Grid Bar */}
            <div className="glass-panel mobile-flat-panel" style={{ padding: '20px 24px' }}>
              <div className="mobile-city-title" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📍 Explore by City
              </div>
              <div className="category-bar-grid">
                <div
                  className="category-bar-item"
                  onClick={() => { setLocationFilter('India'); setLocationSearchInput('India'); fetchListings({ location: 'India' }); }}
                >
                  <div className={`category-bar-icon-box ${!locationFilter || locationFilter.toLowerCase() === 'india' ? 'active' : ''}`} style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                    <span className="category-bar-emoji" style={{ fontSize: '18px' }}>🇮🇳</span>
                  </div>
                  <span className="category-bar-label" style={{ fontSize: '12px' }}>All India</span>
                </div>

                {citiesList.map(c => c.name).map(city => {
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
                      <div className={`category-bar-icon-box ${isSelected ? 'active' : ''}`} style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                        <span className="category-bar-emoji" style={{ fontSize: '20px' }}>{getCityEmoji(city)}</span>
                      </div>
                      <span className="category-bar-label" style={{ fontSize: '12px' }}>{city}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="home-layout">

              {/* Sidebar Filters */}
              <aside className="sidebar-filter">
                {renderFilterContent(false)}
              </aside>

              {/* Product Feed Grid */}
              <section className="products-section">
                <div className="section-header">
                  <div>
                    <h2 style={{ fontSize: '24px' }}>
                      {selectedSubCatFilter ? selectedSubCatFilter.name : (selectedCatFilter ? selectedCatFilter.name : "Featured Listings")}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {listings.length} exact match(es) found
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading items...</div>
                ) : listings.length === 0 && nearbyListings.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '15px' }}>
                      No active listings found matching the query. Try broadening your keywords.
                    </div>
                    {isAnyFilterApplied && (
                      <button
                        className="btn btn-primary"
                        onClick={handleClearAllFilters}
                        style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
                      >
                        Reset & Clear All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Exact Locality Matches */}
                    {listings.length > 0 ? (
                      <div>
                        <div className="products-grid">
                          {listings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(renderProductCard)}
                        </div>
                        {/* Pagination Controls */}
                        {listings.length > ITEMS_PER_PAGE && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                              Previous
                            </button>
                            {[...Array(Math.ceil(listings.length / ITEMS_PER_PAGE))].map((_, i) => (
                              <button
                                key={i}
                                className={`btn ${currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px', minWidth: '32px' }}
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                              disabled={currentPage === Math.ceil(listings.length / ITEMS_PER_PAGE)}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(listings.length / ITEMS_PER_PAGE)))}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      locationFilter && (
                        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No direct listings found in <strong>{locationFilter}</strong>.
                        </div>
                      )
                    )}

                    {/* Nearby City-Wide Matches Fallback */}
                    {nearbyListings.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                          🗺️ Nearby Listings in {extractParentCity(locationFilter)}
                        </h2>
                        <div className="products-grid">
                          {nearbyListings.slice((currentNearbyPage - 1) * ITEMS_PER_PAGE, currentNearbyPage * ITEMS_PER_PAGE).map(renderProductCard)}
                        </div>
                        {/* Pagination Controls */}
                        {nearbyListings.length > ITEMS_PER_PAGE && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                              disabled={currentNearbyPage === 1}
                              onClick={() => setCurrentNearbyPage(prev => Math.max(prev - 1, 1))}
                            >
                              Previous
                            </button>
                            {[...Array(Math.ceil(nearbyListings.length / ITEMS_PER_PAGE))].map((_, i) => (
                              <button
                                key={i}
                                className={`btn ${currentNearbyPage === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px', minWidth: '32px' }}
                                onClick={() => setCurrentNearbyPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                              disabled={currentNearbyPage === Math.ceil(nearbyListings.length / ITEMS_PER_PAGE)}
                              onClick={() => setCurrentNearbyPage(prev => Math.min(prev + 1, Math.ceil(nearbyListings.length / ITEMS_PER_PAGE)))}
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
          </div>
        )}

        {/* LISTING DETAILS VIEW */}
        {page === 'details' && listingDetails && (
          <div>
            <button className="btn btn-secondary" style={{ marginBottom: '24px' }} onClick={() => { window.location.hash = '#/'; }}>
              ← Back to Listings
            </button>

            <div className="detail-layout">
              {/* Left Column: Image display */}
              <div className="detail-gallery">
                <div className="gallery-main" style={{ position: 'relative', width: '100%', height: '400px', background: '#141420', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                  <img
                    src={activeDetailImage ? `${import.meta.env.VITE_IMAGE_SERVER}${activeDetailImage}` : "https://placehold.co/600x400?text=No+Photo"}
                    alt={listingDetails.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.src = "https://placehold.co/600x400?text=No+Image+Provided"; }}
                  />
                </div>

                {/* Thumbnails Row Carousel */}
                {listingDetails.imagePath && listingDetails.imagePath.split(',').length > 1 && (
                  <div className="thumbnail-carousel" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0', scrollbarWidth: 'thin' }}>
                    {listingDetails.imagePath.split(',').map((img, index) => {
                      const isSelected = activeDetailImage === img;
                      return (
                        <div
                          key={index}
                          onClick={() => setActiveDetailImage(img)}
                          style={{
                            width: '80px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                            background: '#141420',
                            flexShrink: 0,
                            transition: 'var(--transition)'
                          }}
                        >
                          <img
                            src={img ? (img.startsWith('http') ? img : `${import.meta.env.VITE_IMAGE_SERVER}${img}`) : "https://placehold.co/100x100?text=No+Image"}
                            alt={`Thumbnail ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = "https://placehold.co/100x100?text=No+Image"; }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Pricing & Contact Panel */}
              <div className="detail-info">
                <div className="category-breadcrumbs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <span>{listingDetails.category?.name}</span>
                    {listingDetails.subCategory && (
                      <>
                        <span>/</span>
                        <span>{listingDetails.subCategory.name}</span>
                      </>
                    )}
                  </div>
                  <span className="badge-id" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                    Listing ID: LPP-{String(listingDetails.id).padStart(5, '0')}
                  </span>
                </div>

                <h1 className="detail-title">{listingDetails.title}</h1>

                <div className="detail-meta-row">
                  <span>📍 {listingDetails.location}</span>
                  {listingDetails.averageRating > 0 ? (
                    <span className="detail-meta-rating">
                      ★ {listingDetails.averageRating} ({listingDetails.totalReviews} Reviews)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>No reviews yet</span>
                  )}
                  <span style={{ color: 'var(--text-dim)' }}>|</span>
                  <span>Seller: <strong>{listingDetails.seller?.username}</strong></span>
                  <span style={{ color: 'var(--text-dim)' }}>|</span>
                  <span>📅 Posted: <strong>{new Date(listingDetails.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                </div>

                <div className="card-prices">
                  {listingDetails.discountPercent > 0 ? (
                    <>
                      <span className="price-discounted" style={{ fontSize: '36px' }}>
                        ₹{(listingDetails.price * (1 - listingDetails.discountPercent / 100)).toFixed(0)}
                      </span>
                      <span className="price-original" style={{ fontSize: '20px' }}>
                        ₹{listingDetails.price}
                      </span>
                      <span className="card-badge" style={{ position: 'static' }}>
                        {listingDetails.discountPercent}% OFF Announcement!
                      </span>
                    </>
                  ) : (
                    <span className="price-discounted" style={{ fontSize: '36px' }}>
                      ₹{listingDetails.price}
                    </span>
                  )}
                </div>

                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Description</h3>
                  <p className="detail-desc">{listingDetails.description}</p>
                </div>

                {/* Contact and Messaging Box */}
                <div className="glass-panel contact-card">
                  <h3 className="contact-title">Contact Seller</h3>
                  {user ? (
                    <>
                      <div className="contact-methods">
                        <a
                          href={`https://wa.me/${listingDetails.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi, I am interested in your listing: "${encodeURIComponent(listingDetails.title)}"`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp"
                          style={{ textDecoration: 'none' }}
                        >
                          💬 Chat on WhatsApp ({listingDetails.whatsappNumber})
                        </a>

                        <a href={`tel:${listingDetails.contactNumber}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                          📞 Call Seller ({listingDetails.contactNumber})
                        </a>

                        <button
                          className={`btn ${savedListings.includes(listingDetails.id) ? 'btn-accent' : 'btn-secondary'}`}
                          onClick={() => toggleBookmark(listingDetails.id)}
                        >
                          {savedListings.includes(listingDetails.id) ? '⭐ Bookmarked' : '☆ Save/Bookmark Product'}
                        </button>
                      </div>

                      {/* In-app Message Inquiry composer */}
                      <form onSubmit={submitInquiry} className="inquiry-box" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Send Instant Inquiry Message</h4>
                        {inquirySuccess && <div className="alert-banner alert-success">{inquirySuccess}</div>}
                        <textarea
                          className="inquiry-textarea"
                          placeholder="Ask the seller for availability, negotiation, or coordinates..."
                          value={inquiryText}
                          onChange={(e) => setInquiryText(e.target.value)}
                          required
                        ></textarea>
                        <button type="submit" className="btn btn-primary">
                          Send Message
                        </button>
                      </form>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0 8px 0' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                        Please log in to contact the seller and view listing contact details.
                      </p>
                      <button className="btn btn-primary" onClick={() => { window.location.hash = '#/login'; }} style={{ width: '100%' }}>
                        Log In to Contact Seller
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* REVIEWS & STAR RATINGS GRID */}
            <section className="reviews-section">
              <div className="reviews-header">
                <h2>Product Reviews & Ratings</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', color: '#fbbf24' }}>★</span>
                  <span style={{ fontSize: '20px', fontWeight: '700' }}>
                    {listingDetails.averageRating || 'N/A'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    ({listingDetails.totalReviews} total reviews)
                  </span>
                </div>
              </div>

              {/* Add New Review Composer */}
              {user ? (
                <form onSubmit={submitReview} className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Write a Review</h3>

                  {reviewSuccess && <div className="alert-banner alert-success">{reviewSuccess}</div>}
                  {reviewError && <div className="alert-banner alert-error">{reviewError}</div>}

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Rating</label>
                    <div className="star-selector">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={reviewRating >= star ? 'selected' : ''}
                          onClick={() => setReviewRating(star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Your Comment</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Write your review details (quality, delivery time, packaging, etc.)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="form-grid" style={{ marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Upload Photos (Max 5)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="form-input"
                        onChange={(e) => setReviewImages(e.target.files)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Upload Videos (Max 2)</label>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        className="form-input"
                        onChange={(e) => setReviewVideos(e.target.files)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Submit Review
                  </button>
                </form>
              ) : (
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Please <strong style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setPage('login')}>Login</strong> to post a rating or review.
                </div>
              )}

              {/* Reviews Feed */}
              <div className="reviews-list">
                {listingDetails.reviews?.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                    No reviews for this product yet. Be the first to review!
                  </div>
                ) : (
                  listingDetails.reviews?.map(rev => (
                    <div key={rev.id} className="glass-panel review-item">
                      <div className="review-meta">
                        <span className="review-user">{rev.buyer?.username}</span>
                        <span className="review-stars">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                      </div>
                      <p className="review-comment">{rev.comment}</p>

                      {/* Media (photos & videos) attachment gallery */}
                      {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                        <div className="review-media-grid">
                          {rev.images?.map((img, i) => (
                            <img
                              key={i}
                              src={`${import.meta.env.VITE_IMAGE_SERVER}${img}`}
                              alt="Review image"
                              className="review-img"
                              onClick={() => window.open(`${import.meta.env.VITE_IMAGE_SERVER}${img}`)}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ))}
                          {rev.videos?.map((vid, i) => (
                            <video
                              key={i}
                              src={`${import.meta.env.VITE_IMAGE_SERVER}${vid}`}
                              controls
                              className="review-video"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* CUSTOMER DASHBOARDS VIEW */}
        {page === 'dashboard' && user && (
          <div className="dashboard-layout">
            {/* Mobile Direct Navigation Tabs (replacing select dropdown and swipe tabs) */}
            <div className="mobile-dashboard-tabs" style={{ display: 'none', marginBottom: '16px', gap: '8px', width: '100%' }}>
              {user.role === 'SELLER' && (
                <>
                  <button
                    className={`mobile-tab-btn ${dashboardTab === 'my-listings' ? 'active' : ''}`}
                    onClick={() => { setDashboardTab('my-listings'); window.location.hash = '#/dashboard/my-listings'; }}
                  >
                    📦 Listings
                  </button>
                  <button
                    className={`mobile-tab-btn ${dashboardTab === 'add-listing' ? 'active' : ''}`}
                    onClick={() => { setDashboardTab('add-listing'); window.location.hash = '#/dashboard/add-listing'; }}
                  >
                    ➕ Post
                  </button>
                  <button
                    className={`mobile-tab-btn ${dashboardTab === 'leads' ? 'active' : ''}`}
                    onClick={() => { setDashboardTab('leads'); window.location.hash = '#/dashboard/leads'; }}
                  >
                    💬 Messages ({sellerInquiries.length})
                  </button>
                </>
              )}
              {user.role === 'BUYER' && (
                <>
                  <button
                    className={`mobile-tab-btn ${dashboardTab === 'inquiries' ? 'active' : ''}`}
                    onClick={() => { setDashboardTab('inquiries'); window.location.hash = '#/dashboard/inquiries'; }}
                  >
                    ✉️ Inquiries ({buyerInquiries.length})
                  </button>
                  <button
                    className={`mobile-tab-btn ${dashboardTab === 'saved' ? 'active' : ''}`}
                    onClick={() => { setDashboardTab('saved'); window.location.hash = '#/dashboard/saved'; }}
                  >
                    ⭐ Saved
                  </button>
                </>
              )}
              {user.role === 'ADMIN' && (
                <>
                  <button
                    className={`mobile-tab-btn ${dashboardTab === 'cities' ? 'active' : ''}`}
                    onClick={() => { setDashboardTab('cities'); window.location.hash = '#/dashboard/cities'; }}
                  >
                    🌆 Cities
                  </button>
                </>
              )}
            </div>
            <aside className="dashboard-sidebar">
              {user.role === 'SELLER' && (
                <>
                  <div
                    className={`sidebar-tab ${dashboardTab === 'my-listings' ? 'active' : ''}`}
                    onClick={() => window.location.hash = '#/dashboard/my-listings'}
                  >
                    📦 My Listings
                  </div>
                  <div
                    className={`sidebar-tab ${dashboardTab === 'add-listing' ? 'active' : ''}`}
                    onClick={() => window.location.hash = '#/dashboard/add-listing'}
                  >
                    ➕ Post New Product
                  </div>
                  <div
                    className={`sidebar-tab ${dashboardTab === 'leads' ? 'active' : ''}`}
                    onClick={() => window.location.hash = '#/dashboard/leads'}
                  >
                    💬 Buyer Messages ({sellerInquiries.length})
                  </div>
                </>
              )}

              {user.role === 'BUYER' && (
                <>
                  <div
                    className={`sidebar-tab ${dashboardTab === 'inquiries' ? 'active' : ''}`}
                    onClick={() => window.location.hash = '#/dashboard/inquiries'}
                  >
                    ✉️ Sent Message Inquiries ({buyerInquiries.length})
                  </div>
                  <div
                    className={`sidebar-tab ${dashboardTab === 'saved' ? 'active' : ''}`}
                    onClick={() => window.location.hash = '#/dashboard/saved'}
                  >
                    ⭐ Bookmarks & Saved
                  </div>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <div
                    className={`sidebar-tab ${dashboardTab === 'cities' ? 'active' : ''}`}
                    onClick={() => window.location.hash = '#/dashboard/cities'}
                  >
                    🌆 Manage Cities
                  </div>
                </>
              )}
            </aside>

            <section className="dashboard-content">

              {/* Tab: My Listings (Seller) */}
              {user.role === 'SELLER' && dashboardTab === 'my-listings' && (
                <div>
                  <h2 style={{ marginBottom: '16px' }}>Manage Listings</h2>
                  <div className="products-grid">
                    {sellerListings.map(item => {
                      const photos = item.imagePath ? item.imagePath.split(',') : [];
                      const coverImage = photos[0] || "";
                      const hasDiscount = item.discountPercent > 0;
                      const finalPrice = hasDiscount ? (item.price * (1 - item.discountPercent / 100)).toFixed(0) : item.price;
                      return (
                        <div
                          key={item.id}
                          className="glass-panel product-card dashboard-card"
                          onClick={(e) => {
                            if (!e.target.closest('button')) {
                              window.location.hash = `#/details/${item.id}`;
                            }
                          }}
                          style={{ minHeight: '380px', height: 'auto', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                        >
                          {/* Main Row: splits image on left and text on right on mobile */}
                          <div className="dashboard-card-main-row" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div className="card-image-wrapper" style={{ height: '160px', position: 'relative' }}>
                              {hasDiscount && (
                                <div className="card-badge" style={{ zIndex: 3 }}>-{item.discountPercent}% OFF</div>
                              )}
                              <img
                                src={coverImage ? (coverImage.startsWith('http') ? coverImage : `${import.meta.env.VITE_IMAGE_SERVER}${coverImage}`) : "https://placehold.co/400x300?text=No+Photo"}
                                alt={item.title}
                                className="card-img"
                                onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Listing+Item"; }}
                              />
                            </div>
                            <div className="card-content" style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>{item.title}</h3>

                              <p className="card-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.description}
                              </p>

                              <div className="card-prices" style={{ marginBottom: '8px' }}>
                                {hasDiscount ? (
                                  <>
                                    <span className="price-discounted" style={{ fontSize: '15px', fontWeight: '700' }}>₹{finalPrice}</span>
                                    <span className="price-original" style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-dim)', marginLeft: '6px' }}>₹{item.price}</span>
                                  </>
                                ) : (
                                  <span className="price-discounted" style={{ fontSize: '15px', fontWeight: '700' }}>₹{item.price}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer Section: contains buttons, badges, status, location, date */}
                          <div className="dashboard-card-footer" style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
                            {item.status === 'REJECTED' && item.rejectReason && (
                              <div style={{ fontSize: '11px', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)', padding: '6px', borderRadius: '4px', borderLeft: '2px solid #f43f5e', marginBottom: '8px' }}>
                                ❌ <strong>Reason:</strong> {item.rejectReason}
                              </div>
                            )}

                            <div className="dashboard-card-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <span className="badge-id" style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontWeight: '700' }}>
                                LPP-{String(item.id).padStart(5, '0')}
                              </span>
                              <span className="alert-banner" style={{ padding: '4px 8px', fontSize: '11px', margin: 0, background: item.status === 'ACTIVE' ? 'var(--emerald-glow)' : (item.status === 'REJECTED' ? 'rgba(244, 63, 94, 0.15)' : (item.status === 'INACTIVE' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(245, 158, 11, 0.1)')), color: item.status === 'ACTIVE' ? 'var(--emerald)' : (item.status === 'REJECTED' ? '#f43f5e' : (item.status === 'INACTIVE' ? '#9ca3af' : '#fbbf24')), border: '1px solid rgba(255,255,255,0.05)' }}>
                                {item.status}
                              </span>
                            </div>

                            <div className="dashboard-card-actions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingBottom: '8px' }}>
                              {item.status === 'ACTIVE' && (
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => updateListingStatus(item.id, "SOLD")}>
                                  Mark Sold
                                </button>
                              )}
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setEditingListing(item)}>
                                Edit
                              </button>
                              <button className="btn btn-accent" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={async () => { if (confirm(`Delete listing LPP-${String(item.id).padStart(5, '0')}?`)) { await api.deleteListing(item.id); fetchListings(); } }}>
                                Delete
                              </button>
                            </div>

                            <div className="dashboard-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', gap: '8px' }}>
                              <span>📍 {item.location}</span>
                              <span>📅 {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Post New Listing (Seller) */}
              {user.role === 'SELLER' && dashboardTab === 'add-listing' && (
                <div className="glass-panel form-card">
                  <h2 className="form-title">Advertise New Product Listing</h2>

                  {createSuccess && <div className="alert-banner alert-success">{createSuccess}</div>}
                  {createError && <div className="alert-banner alert-error">{createError}</div>}

                  <form onSubmit={handleCreateListing} className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Product Title / Heading</label>
                      <input type="text" className="form-input" placeholder="e.g. Brand New Sony PlayStation 5 console" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Root Category</label>
                      <select
                        className="form-select"
                        value={newCategory}
                        onChange={(e) => { setNewCategory(e.target.value); setNewSubCategory(''); }}
                        required
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map(c => (
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
                        {categories.find(c => c.id === parseInt(newCategory))?.subCategories.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Price (₹ INR)</label>
                      <input type="number" className="form-input" placeholder="e.g. 499" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Announce Discount (%)</label>
                      <input type="number" min="0" max="95" className="form-input" placeholder="e.g. 10 (Set 0 for none)" value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-label" style={{ margin: 0 }}>Location (Area, City, State)</label>
                        <span
                          onClick={autoDetectListingLocation}
                          style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}
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
                        <div className="location-dropdown" style={{ width: '100%', top: 'calc(100% - 2px)' }}>
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
                      <input type="text" className="form-input" placeholder="e.g. 14085551234" value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Normal Phone Call Contact</label>
                      <input type="text" className="form-input" placeholder="e.g. 14085551234" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Product Detailed Description</label>
                      <textarea className="form-textarea" placeholder="Describe specifications, parameters, usage history..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary full-width" style={{ gridColumn: 'span 2' }}>
                      Publish Advertising Listing
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Leads Inbox (Seller) */}
              {user.role === 'SELLER' && dashboardTab === 'leads' && (
                <div>
                  <h2 style={{ marginBottom: '16px' }}>Buyer Inquiries & Leads Inbox</h2>
                  {sellerInquiries.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No inquiries sent by buyers yet. Keep advertising!
                    </div>
                  ) : (
                    <div className={`chat-split-container ${activeInquiryId ? 'has-active-chat' : ''}`} style={{ display: 'flex', gap: '20px', height: '550px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', overflow: 'hidden' }}>
                      {/* Left Sidebar: Threads List */}
                      <div className="chat-sidebar" style={{ width: '320px', borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', fontWeight: '600', color: 'var(--text-main)' }}>Conversations</div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                          {sellerInquiries.map(inq => {
                            const isActive = activeInquiryId === inq.id;
                            const lastMsg = inq.messages?.[inq.messages.length - 1];
                            const isUnread = lastMsg && lastMsg.senderId !== user.id && inq.status !== 'READ';
                            return (
                              <div
                                key={inq.id}
                                onClick={() => {
                                  setActiveInquiryId(inq.id);
                                  markAsRead(inq.id);
                                }}
                                style={{
                                  padding: '14px 16px',
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  cursor: 'pointer',
                                  background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                  transition: 'var(--transition)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                              >
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: isActive ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'linear-gradient(135deg, #374151, #4b5563)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  textTransform: 'uppercase',
                                  flexShrink: 0
                                }}>
                                  {inq.buyer?.username ? inq.buyer.username.charAt(0) : 'U'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13.5px', fontWeight: isUnread ? '700' : '600', color: isUnread ? 'var(--text-main)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {inq.buyer?.username?.split('@')[0]}
                                    </span>
                                    {(() => {
                                      const unreadCount = (() => {
                                        if (inq.status === 'READ') return 0;
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
                                            background: '#ef4444',
                                            color: '#ffffff',
                                            borderRadius: '10px',
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            minWidth: '18px',
                                            textAlign: 'center',
                                            display: 'inline-block',
                                            lineHeight: '1.2',
                                            flexShrink: 0
                                          }}>
                                            {unreadCount}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span className="badge-id" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1px 4px', borderRadius: '3px', fontSize: '9.5px', fontWeight: '700', flexShrink: 0 }}>
                                      LPP-{String(inq.listing?.id || inq.listingId).padStart(5, '0')}
                                    </span>
                                    <span>{inq.listing?.title}</span>
                                  </div>
                                  {lastMsg && (
                                    <div style={{ fontSize: '12px', color: isUnread ? 'var(--text-main)' : 'var(--text-dim)', fontStyle: isUnread ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                      {lastMsg.text}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Panel: Chat Thread Window */}
                      <div className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                        {(() => {
                          const activeInq = sellerInquiries.find(i => i.id === activeInquiryId);
                          if (!activeInq) {
                            return (
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', gap: '12px' }}>
                                <span style={{ fontSize: '48px' }}>💬</span>
                                <div style={{ fontSize: '15px' }}>Select a conversation to start chatting</div>
                              </div>
                            );
                          }
                          return (
                            <>
                              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.05)' }}>
                                <button
                                  className="chat-back-btn"
                                  onClick={() => setActiveInquiryId(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    padding: '4px 8px 4px 0',
                                    display: 'none',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  ⬅ Back
                                </button>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>{activeInq.buyer?.username?.split('@')[0]}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span>Listing:</span>
                                    <span className="badge-id" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 5px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>
                                      LPP-{String(activeInq.listing?.id || activeInq.listingId).padStart(5, '0')}
                                    </span>
                                    <strong>{activeInq.listing?.title}</strong> (₹{activeInq.listing?.price})
                                  </div>
                                </div>
                              </div>

                              <div
                                id={`chat-messages-${activeInq.id}`}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '12px',
                                  padding: '20px',
                                  overflowY: 'auto',
                                  background: 'rgba(0,0,0,0.1)'
                                }}
                              >
                                {activeInq.messages?.map((msg) => {
                                  const isMe = msg.senderId === user.id;
                                  const hasDoubleTicks = activeInq.status === 'READ' || activeInq.status === 'REPLIED';
                                  return (
                                    <div key={msg.id} style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                                      maxWidth: '75%'
                                    }}>
                                      <div style={{
                                        background: isMe ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(120, 120, 120, 0.12)',
                                        color: isMe ? '#ffffff' : 'var(--text-main)',
                                        border: isMe ? 'none' : '1px solid var(--border-glass)',
                                        padding: '10px 14px',
                                        borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                        fontSize: '13.5px',
                                        lineHeight: '1.4',
                                        boxShadow: isMe ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none'
                                      }}>
                                        {msg.text}
                                      </div>
                                      <span style={{
                                        fontSize: '10px',
                                        color: 'var(--text-dim)',
                                        marginTop: '4px',
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && (
                                          <span style={{ color: hasDoubleTicks ? '#3b82f6' : 'var(--text-dim)', fontWeight: 'bold' }}>
                                            {hasDoubleTicks ? '✓✓' : '✓'}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type="text"
                                    className="reply-input"
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-main)', fontSize: '13.5px' }}
                                    placeholder="Type a message..."
                                    value={replyTexts[activeInq.id] || ''}
                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [activeInq.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSendMessage(activeInq.id);
                                      }
                                    }}
                                  />
                                  <button
                                    className="btn btn-primary"
                                    style={{ padding: '0 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              {user.role === 'BUYER' && dashboardTab === 'inquiries' && (
                <div>
                  <h2 style={{ marginBottom: '16px' }}>Sent Message History</h2>
                  {buyerInquiries.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      You haven't sent any messages to sellers yet.
                    </div>
                  ) : (
                    <div className="chat-split-container" style={{ display: 'flex', gap: '20px', height: '550px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', overflow: 'hidden' }}>
                      {/* Left Sidebar: Threads List */}
                      <div className="chat-sidebar" style={{ width: '320px', borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', fontWeight: '600', color: 'var(--text-main)' }}>Conversations</div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                          {buyerInquiries.map(inq => {
                            const isActive = activeInquiryId === inq.id;
                            const lastMsg = inq.messages?.[inq.messages.length - 1];
                            const isUnread = lastMsg && lastMsg.senderId !== user.id && inq.status !== 'READ';
                            return (
                              <div
                                key={inq.id}
                                onClick={() => {
                                  setActiveInquiryId(inq.id);
                                  markAsRead(inq.id);
                                }}
                                style={{
                                  padding: '14px 16px',
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  cursor: 'pointer',
                                  background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                  transition: 'var(--transition)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                              >
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: isActive ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'linear-gradient(135deg, #374151, #4b5563)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  textTransform: 'uppercase',
                                  flexShrink: 0
                                }}>
                                  {inq.listing?.seller?.username ? inq.listing.seller.username.charAt(0) : 'S'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13.5px', fontWeight: isUnread ? '700' : '600', color: isUnread ? 'var(--text-main)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {inq.listing?.seller?.username?.split('@')[0]}
                                    </span>
                                    {(() => {
                                      const unreadCount = (() => {
                                        if (inq.status === 'READ') return 0;
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
                                            background: '#ef4444',
                                            color: '#ffffff',
                                            borderRadius: '10px',
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            minWidth: '18px',
                                            textAlign: 'center',
                                            display: 'inline-block',
                                            lineHeight: '1.2',
                                            flexShrink: 0
                                          }}>
                                            {unreadCount}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span className="badge-id" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1px 4px', borderRadius: '3px', fontSize: '9.5px', fontWeight: '700', flexShrink: 0 }}>
                                      LPP-{String(inq.listing?.id || inq.listingId).padStart(5, '0')}
                                    </span>
                                    <span>{inq.listing?.title}</span>
                                  </div>
                                  {lastMsg && (
                                    <div style={{ fontSize: '12px', color: isUnread ? 'var(--text-main)' : 'var(--text-dim)', fontStyle: isUnread ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                      {lastMsg.text}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Panel: Chat Thread Window */}
                      <div className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                        {(() => {
                          const activeInq = buyerInquiries.find(i => i.id === activeInquiryId);
                          if (!activeInq) {
                            return (
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', gap: '12px' }}>
                                <span style={{ fontSize: '48px' }}>💬</span>
                                <div style={{ fontSize: '15px' }}>Select a conversation to start chatting</div>
                              </div>
                            );
                          }
                          return (
                            <>
                              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.05)' }}>
                                <div>
                                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>Seller: {activeInq.listing?.seller?.username}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span>Listing:</span>
                                    <span className="badge-id" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 5px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>
                                      LPP-{String(activeInq.listing?.id || activeInq.listingId).padStart(5, '0')}
                                    </span>
                                    <strong>{activeInq.listing?.title}</strong>
                                  </div>
                                </div>
                              </div>

                              <div
                                id={`chat-messages-${activeInq.id}`}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '12px',
                                  padding: '20px',
                                  overflowY: 'auto',
                                  background: 'rgba(0,0,0,0.1)'
                                }}
                              >
                                {activeInq.messages?.map((msg) => {
                                  const isMe = msg.senderId === user.id;
                                  const hasDoubleTicks = activeInq.status === 'READ' || activeInq.status === 'REPLIED';
                                  return (
                                    <div key={msg.id} style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                                      maxWidth: '75%'
                                    }}>
                                      <div style={{
                                        background: isMe ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(120, 120, 120, 0.12)',
                                        color: isMe ? '#ffffff' : 'var(--text-main)',
                                        border: isMe ? 'none' : '1px solid var(--border-glass)',
                                        padding: '10px 14px',
                                        borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                        fontSize: '13.5px',
                                        lineHeight: '1.4',
                                        boxShadow: isMe ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none'
                                      }}>
                                        {msg.text}
                                      </div>
                                      <span style={{
                                        fontSize: '10px',
                                        color: 'var(--text-dim)',
                                        marginTop: '4px',
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && (
                                          <span style={{ color: hasDoubleTicks ? '#3b82f6' : 'var(--text-dim)', fontWeight: 'bold' }}>
                                            {hasDoubleTicks ? '✓✓' : '✓'}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type="text"
                                    className="reply-input"
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-main)', fontSize: '13.5px' }}
                                    placeholder="Type a message..."
                                    value={replyTexts[activeInq.id] || ''}
                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [activeInq.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSendMessage(activeInq.id);
                                      }
                                    }}
                                  />
                                  <button
                                    className="btn btn-primary"
                                    style={{ padding: '0 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

              {/* Tab: Saved Bookmarks (Buyer) */}
              {user.role === 'BUYER' && dashboardTab === 'saved' && (
                <div>
                  <h2 style={{ marginBottom: '16px' }}>Saved Products</h2>
                  {savedListings.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No bookmarks saved yet. Explore products and click "Save/Bookmark Product" to add.
                    </div>
                  ) : (
                    <div className="products-grid">
                      {listings.filter(l => savedListings.includes(l.id)).map(item => (
                        <div key={item.id} className="glass-panel product-card" onClick={() => loadListingDetails(item.id)}>
                          <div className="card-image-wrapper">
                            <img
                              src={item.imagePath ? `${import.meta.env.VITE_IMAGE_SERVER}${item.imagePath}` : "https://placehold.co/400x300?text=No+Photo"}
                              alt={item.title}
                              className="card-img"
                              onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Product"; }}
                            />
                          </div>
                          <div className="card-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span className="badge-id" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>
                                LPP-{String(item.id).padStart(5, '0')}
                              </span>
                            </div>
                            <h3 className="card-title">{item.title}</h3>
                            <p className="price-discounted">₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Cities Management (Admin) */}
              {user.role === 'ADMIN' && dashboardTab === 'cities' && (
                <div>
                  <h2 style={{ marginBottom: '16px' }}>Manage Cities & Icons</h2>

                  {adminCitySuccess && <div className="alert-banner alert-success" style={{ marginBottom: '16px' }}>{adminCitySuccess}</div>}
                  {adminCityError && <div className="alert-banner alert-error" style={{ marginBottom: '16px' }}>{adminCityError}</div>}

                  <div className="glass-panel form-card" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Add New City</h3>

                    <form onSubmit={handleAddCity} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>City Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Bhopal"
                          value={cityNameInput}
                          onChange={(e) => setCityNameInput(e.target.value)}
                          required
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Choose Icon / Emoji</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 🕌"
                          value={cityEmojiInput}
                          onChange={(e) => setCityEmojiInput(e.target.value)}
                          required
                          style={{ width: '100%', textAlign: 'center', fontSize: '18px' }}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px' }}>
                        ➕ Add City
                      </button>
                    </form>
                  </div>

                  <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Configured Cities</h3>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    {citiesList.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No cities configured yet.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        {citiesList.map(city => (
                          <div
                            key={city.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '12px',
                              transition: 'transform 0.2s ease, background-color 0.2s ease'
                            }}
                            className="city-manage-card"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '24px' }}>{city.emoji}</span>
                              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)' }}>{city.name}</span>
                            </div>
                            <button
                              className="btn btn-accent"
                              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
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

            </section>
          </div>
        )}

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
            <div className="brand-logo" style={{ fontSize: '20px' }} onClick={() => { setPage('home'); setMobileMenuOpen(false); }}>
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
              <a href="#/" className="drawer-nav-item" onClick={() => { setMobileMenuOpen(false); setSelectedCatFilter(null); setSelectedSubCatFilter(null); fetchListings(); }}>
                🏠 Home Feed
              </a>
              {user ? (
                <>
                  {user.role === 'ADMIN' ? (
                    <a href="https://admin2.lowpriceplaces.com" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      📈 Admin Dashboard
                    </a>
                  ) : (
                    (user.role === 'SELLER' || user.role === 'BUYER') && (
                      <a href={`#/dashboard/${user.role === 'SELLER' ? 'my-listings' : 'inquiries'}`} className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                        📈 Profile
                      </a>
                    )
                  )}
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => { api.logout(); setUser(null); setMobileMenuOpen(false); window.location.hash = '#/'; }}>
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <a href="#/login" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    🔑 Sign In
                  </a>
                  <a href="#/register" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    ➕ Register
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Filter Drawer */}
      <div className={`mobile-filter-drawer-overlay ${mobileFiltersOpen ? 'open' : ''}`} onClick={() => setMobileFiltersOpen(false)}>
        <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Filter Listings</span>
            <button className="drawer-close-btn" onClick={() => setMobileFiltersOpen(false)}>✖</button>
          </div>
          <div className="drawer-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
            {renderFilterContent(true)}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Mobile Filter Button */}
      {page === 'home' && (
        <div className="mobile-filter-floating-bar">
          <button className="mobile-floating-btn" onClick={() => setMobileFiltersOpen(true)}>
            ⚡ Filters & Sort {isAnyFilterApplied && <span className="filter-active-dot"></span>}
          </button>
        </div>
      )}

      {/* Sticky Bottom Details Contact Bar (Mobile Only) */}
      {page === 'details' && listingDetails && (
        <div className="mobile-detail-sticky-bar">
          {user ? (
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <a
                href={`https://wa.me/${listingDetails.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi, I am interested in your listing: "${encodeURIComponent(listingDetails.title)}"`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', gap: '6px', height: '44px', padding: 0 }}
              >
                💬 WhatsApp
              </a>
              <a
                href={`tel:${listingDetails.contactNumber}`}
                className="btn btn-secondary"
                style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', gap: '6px', height: '44px', padding: 0 }}
              >
                📞 Call Owner
              </a>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <button
                className="btn btn-primary"
                onClick={() => { window.location.hash = '#/login'; }}
                style={{ width: '100%', height: '44px', fontSize: '14px', padding: 0 }}
              >
                🔑 Log In to Contact Seller
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <div
          className={`mobile-bottom-nav-item ${page === 'home' ? 'active' : ''}`}
          onClick={() => { window.location.hash = '#/'; }}
        >
          <span className="mobile-bottom-nav-icon">🏠</span>
          <span>Home</span>
        </div>
        <div
          className="mobile-bottom-nav-item"
          onClick={() => {
            window.location.hash = '#/';
            setTimeout(() => {
              const searchHero = document.querySelector('.mobile-search-hero');
              if (searchHero) {
                searchHero.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }}
        >
          <span className="mobile-bottom-nav-icon">🔍</span>
          <span>Search</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${page === 'dashboard' && dashboardTab === 'add-listing' ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              window.location.hash = '#/login';
            } else if (user.role === 'SELLER') {
              window.location.hash = '#/dashboard/add-listing';
            } else {
              alert("Only registered sellers can post listings. Check your profile settings.");
              window.location.hash = `#/dashboard/${user.role === 'ADMIN' ? 'cities' : 'inquiries'}`;
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">➕</span>
          <span>Post Ad</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${page === 'dashboard' && (dashboardTab === 'bookmarks' || dashboardTab === 'saved') ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              window.location.hash = '#/login';
            } else if (user.role === 'BUYER') {
              window.location.hash = '#/dashboard/bookmarks';
            } else {
              window.location.hash = `#/dashboard/${user.role === 'ADMIN' ? 'cities' : 'my-listings'}`;
            }
          }}
        >
          <span className="mobile-bottom-nav-icon">❤️</span>
          <span>Shortlist</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${page === 'dashboard' && (dashboardTab !== 'add-listing' && dashboardTab !== 'bookmarks' && dashboardTab !== 'saved') ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              window.location.hash = '#/login';
            } else {
              window.location.hash = `#/dashboard/${user.role === 'ADMIN' ? 'cities' : (user.role === 'SELLER' ? 'my-listings' : 'inquiries')}`;
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
