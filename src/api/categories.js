import { request } from "./client.js";

export async function getCategories() {
  return request("/categories");
}

export const categoriesApi = {
  getCategories,
};
