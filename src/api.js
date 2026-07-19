const API_BASE = "http://localhost:5000/api";

export function getAuthToken() {
  return localStorage.getItem("lowpriceplaces_token");
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("lowpriceplaces_token", token);
  } else {
    localStorage.removeItem("lowpriceplaces_token");
  }
}

export function getCurrentUser() {
  const user = localStorage.getItem("lowpriceplaces_user");
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("lowpriceplaces_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("lowpriceplaces_user");
  }
}

// Request Helper
async function request(endpoint, options = {}) {
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle standard JSON objects vs Multipart Forms
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (options.body) {
      options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Network error occurred.");
  }
  return data;
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

  async replyToInquiry(id, replyMessage) {
    return request(`/inquiries/${id}/reply`, {
      method: "POST",
      body: { replyMessage }
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
  }
};
