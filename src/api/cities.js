import { request } from "./client.js";

export async function getCities() {
  return request("/cities?all=true");
}

export async function addCity(name, emoji, state, parentCity) {
  return request("/cities", {
    method: "POST",
    body: { name, emoji, state, parentCity },
  });
}

export async function updateCity(id, name, emoji, state, parentCity) {
  return request(`/cities/${id}`, {
    method: "PUT",
    body: { name, emoji, state, parentCity },
  });
}

export async function deleteCity(id) {
  return request(`/cities/${id}`, {
    method: "DELETE",
  });
}

export const citiesApi = {
  getCities,
  addCity,
  updateCity,
  deleteCity,
};
