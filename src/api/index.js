import {
  getAuthToken,
  setAuthToken,
  getCurrentUser,
  setCurrentUser,
  request,
  buildQueryString,
} from "./client.js";
import { authApi } from "./auth.js";
import { categoriesApi } from "./categories.js";
import { listingsApi } from "./listings.js";
import { reviewsApi } from "./reviews.js";
import { inquiriesApi } from "./inquiries.js";
import { seoApi } from "./seo.js";
import { citiesApi } from "./cities.js";
import { profileApi } from "./profile.js";
import { storesApi } from "./stores.js";
import { servicesApi } from "./services.js";

export {
  getAuthToken,
  setAuthToken,
  getCurrentUser,
  setCurrentUser,
  request,
  buildQueryString,
  authApi,
  categoriesApi,
  listingsApi,
  reviewsApi,
  inquiriesApi,
  seoApi,
  citiesApi,
  profileApi,
  storesApi,
  servicesApi,
};

export const api = {
  ...authApi,
  ...categoriesApi,
  ...listingsApi,
  ...reviewsApi,
  ...inquiriesApi,
  ...seoApi,
  ...citiesApi,
  ...profileApi,
  ...storesApi,
  ...servicesApi,
};

export default api;
