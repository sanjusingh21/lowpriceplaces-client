import { request, buildQueryString } from "./client.js";

export async function getListings(filters = {}) {
  const queryString = buildQueryString(filters);
  return request(`/listings${queryString}`);
}

export async function getListingDetails(id) {
  return request(`/listings/${id}`);
}

export async function createListing(payload) {
  return request("/listings", {
    method: "POST",
    body: payload,
  });
}

export async function changeListingStatus(id, status) {
  return request(`/listings/${id}/status`, {
    method: "PUT",
    body: { status },
  });
}

export async function deleteListing(id) {
  return request(`/listings/${id}`, {
    method: "DELETE",
  });
}

export async function editListingDetails(id, updatedFields) {
  return request(`/listings/${id}`, {
    method: "PUT",
    body: updatedFields,
  });
}

export async function getSuggestions(q) {
  return request(`/suggestions?q=${encodeURIComponent(q)}`);
}

export const listingsApi = {
  getListings,
  getListingDetails,
  createListing,
  changeListingStatus,
  deleteListing,
  editListingDetails,
  getSuggestions,
};
