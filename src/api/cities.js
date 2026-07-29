import { request } from "./client.js";

export async function getCities() {
  return request("/cities");
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

export const citiesApi = {
  getCities,
  addCity,
  deleteCity,
};
