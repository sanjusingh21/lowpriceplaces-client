const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }
  return "/api";
};

const API_BASE = getApiBase();

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("lowpriceplaces_token");
  }
  return null;
}

export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem("lowpriceplaces_token", token);
    } else {
      localStorage.removeItem("lowpriceplaces_token");
    }
  }
}

export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem("lowpriceplaces_user");
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function setCurrentUser(user) {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem("lowpriceplaces_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("lowpriceplaces_user");
    }
  }
}

// Request Helper
async function request(endpoint, options = {}, isRetry = false) {
  const token = getAuthToken();
  const headers = {
    ...options.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (options.body && typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Network error occurred.");
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      if (!isRetry) {
        await new Promise((r) => setTimeout(r, 500));
        return request(endpoint, options, true);
      }
      throw new Error("Unable to connect to the backend server (http://localhost:5000). Please ensure the backend server is running.");
    }
    throw err;
  }
}

export const api = {
  // Authentication
  async login(username, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: { username, password }
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  },

  async register(email, password, role) {
    const data = await request("/auth/register", {
      method: "POST",
      body: { email, password, role }
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  },

  async googleAuth(credential, role) {
    const data = await request("/auth/google", {
      method: "POST",
      body: { credential, role }
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  },

  async forgotPassword(email) {
    return request("/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  },

  async resetPassword(token, newPassword) {
    return request("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword }
    });
  },

  logout() {
    setAuthToken(null);
    setCurrentUser(null);
  },

  async getMe() {
    try {
      const user = await request("/auth/me");
      setCurrentUser(user);
      return user;
    } catch (e) {
      this.logout();
      return null;
    }
  },

  async switchRole(role) {
    const data = await request("/auth/switch-role", {
      method: "PUT",
      body: { role }
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  },

  // Categories
  async getCategories() {
    return request("/categories");
  },

  // Listings
  async getListings(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request(`/listings${queryString}`);
  },

  async getListingDetails(id) {
    return request(`/listings/${id}`);
  },

  async createListing(formData) {
    return request("/listings", {
      method: "POST",
      body: formData // Must be FormData object (Multipart file)
    });
  },

  async changeListingStatus(id, status) {
    return request(`/listings/${id}/status`, {
      method: "PUT",
      body: { status }
    });
  },

  async deleteListing(id) {
    return request(`/listings/${id}`, {
      method: "DELETE"
    });
  },

  async editListingDetails(id, updatedFields) {
    return request(`/listings/${id}`, {
      method: "PUT",
      body: updatedFields
    });
  },

  // Reviews
  async submitReview(listingId, formData) {
    return request(`/listings/${listingId}/reviews`, {
      method: "POST",
      body: formData // Must be FormData object (Multipart files for review media)
    });
  },

  async deleteReview(id) {
    return request(`/reviews/${id}`, {
      method: "DELETE"
    });
  },

  // Inquiries / Chats
  async sendInquiry(listingId, message) {
    return request("/inquiries", {
      method: "POST",
      body: { listingId, message }
    });
  },

  async getSellerInquiries() {
    return request("/inquiries/seller");
  },

  async getBuyerInquiries() {
    return request("/inquiries/buyer");
  },

  async getAllChats() {
    return request("/chats/all");
  },

  async startDirectChat(listingId, initialMessage) {
    return request("/chats/start", {
      method: "POST",
      body: { listingId, initialMessage }
    });
  },

  async sendChatMessage(inquiryId, text) {
    return request(`/inquiries/${inquiryId}/messages`, {
      method: "POST",
      body: { text }
    });
  },

  async replyToInquiry(id, text) {
    return request(`/inquiries/${id}/messages`, {
      method: "POST",
      body: { text }
    });
  },

  async getInquiryMessages(id) {
    return request(`/inquiries/${id}/messages`);
  },

  async markInquiryRead(id) {
    return request(`/inquiries/${id}/read`, {
      method: "POST"
    });
  },

  // SEO tags
  async getSEO(path) {
    return request(`/seo?path=${encodeURIComponent(path)}`);
  },

  // Cities Management
  async getCities() {
    return request("/cities");
  },

  // Seller Profile
  async getProfile() {
    return request("/profile");
  },

  async updateProfile(profileData) {
    return request("/profile", {
      method: "PUT",
      body: profileData
    });
  },

  async addCity(name, emoji) {
    return request("/cities", {
      method: "POST",
      body: { name, emoji }
    });
  },

  async deleteCity(id) {
    return request(`/cities/${id}`, {
      method: "DELETE"
    });
  },

  // Stores and Services
  async getStores(params = {}) {
    const query = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        query[key] = params[key];
      }
    });
    const queryString = Object.keys(query).length > 0
      ? "?" + new URLSearchParams(query).toString()
      : "";
    return request(`/stores${queryString}`);
  },

  async getServices(params = {}) {
    const query = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        query[key] = params[key];
      }
    });
    const queryString = Object.keys(query).length > 0
      ? "?" + new URLSearchParams(query).toString()
      : "";
    return request(`/services${queryString}`);
  },

  async getStoreById(id, params = {}) {
    const query = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        query[key] = params[key];
      }
    });
    const queryString = Object.keys(query).length > 0
      ? "?" + new URLSearchParams(query).toString()
      : "";
    return request(`/stores/${id}${queryString}`);
  },

  async getServiceById(id, params = {}) {
    const query = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        query[key] = params[key];
      }
    });
    const queryString = Object.keys(query).length > 0
      ? "?" + new URLSearchParams(query).toString()
      : "";
    return request(`/services/${id}${queryString}`);
  },

  async addStoreReview(id, rating, comment) {
    return request(`/stores/${id}/reviews`, {
      method: "POST",
      body: { rating, comment }
    });
  },

  async addServiceReview(id, rating, comment) {
    return request(`/services/${id}/reviews`, {
      method: "POST",
      body: { rating, comment }
    });
  }
};
