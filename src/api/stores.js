import { request, buildQueryString } from "./client.js";
import { addStoreReview } from "./reviews.js";

export async function getStores(params = {}) {
  const queryString = buildQueryString(params);
  return request(`/stores${queryString}`);
}

export async function getStoreById(id, params = {}) {
  const queryString = buildQueryString(params);
  return request(`/stores/${id}${queryString}`);
}

export const storesApi = {
  getStores,
  getStoreById,
  addStoreReview,
};
