import { request } from "./client.js";

export async function getSEO(path) {
  return request(`/seo?path=${encodeURIComponent(path)}`);
}

export const seoApi = {
  getSEO,
};
