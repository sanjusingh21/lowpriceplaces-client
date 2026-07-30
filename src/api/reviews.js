import { request } from "./client.js";

export async function submitReview(listingId, formData) {
  return request(`/listings/${listingId}/reviews`, {
    method: "POST",
    body: formData, // Must be FormData object (Multipart files for review media)
  });
}

export async function deleteReview(id) {
  return request(`/reviews/${id}`, {
    method: "DELETE",
  });
}

export async function addStoreReview(id, rating, comment) {
  return request(`/stores/${id}/reviews`, {
    method: "POST",
    body: { rating, comment },
  });
}

export async function addServiceReview(id, rating, comment) {
  return request(`/services/${id}/reviews`, {
    method: "POST",
    body: { rating, comment },
  });
}

export const reviewsApi = {
  submitReview,
  deleteReview,
  addStoreReview,
  addServiceReview,
};
