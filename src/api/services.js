import { request, buildQueryString } from "./client.js";
import { addServiceReview } from "./reviews.js";

export async function getServices(params = {}) {
  const queryString = buildQueryString(params);
  return request(`/services${queryString}`);
}

export async function getServiceById(id, params = {}) {
  const queryString = buildQueryString(params);
  return request(`/services/${id}${queryString}`);
}

export const servicesApi = {
  getServices,
  getServiceById,
  addServiceReview,
};
