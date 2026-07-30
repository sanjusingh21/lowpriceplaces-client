import { request } from "./client.js";

export async function getCities() {
  return request("/cities?all=true");
}

export async function addCity(name, emoji) {
  return request("/cities", {
    method: "POST",
    body: { name, emoji },
  });
}

export async function deleteCity(id) {
  return request(`/cities/${id}`, {
    method: "DELETE",
  });
}

export async function getSubCities(cityId) {
  return request(`/cities/${cityId}/sub-cities`);
}

export async function addSubCity(name, emoji, cityId) {
  return request("/cities/sub-cities", {
    method: "POST",
    body: { name, emoji, cityId },
  });
}

export async function updateSubCity(id, name, emoji, cityId) {
  return request(`/cities/sub-cities/${id}`, {
    method: "PUT",
    body: { name, emoji, cityId },
  });
}

export async function deleteSubCity(id) {
  return request(`/cities/sub-cities/${id}`, {
    method: "DELETE",
  });
}

export const citiesApi = {
  getCities,
  addCity,
  deleteCity,
  getSubCities,
  addSubCity,
  updateSubCity,
  deleteSubCity,
};
