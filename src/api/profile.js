import { request } from "./client.js";

export async function getProfile() {
  return request("/profile");
}

export async function updateProfile(profileData) {
  return request("/profile", {
    method: "PUT",
    body: profileData,
  });
}

export const profileApi = {
  getProfile,
  updateProfile,
};
