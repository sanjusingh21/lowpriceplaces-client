import { request, setAuthToken, setCurrentUser } from "./client.js";

export async function googleAuth(credential, role) {
  const data = await request("/auth/google", {
    method: "POST",
    body: { credential, role },
  });
  setAuthToken(data.token);
  setCurrentUser(data.user);
  return data.user;
}

export function logout() {
  setAuthToken(null);
  setCurrentUser(null);
}

export async function getMe() {
  try {
    const user = await request("/auth/me");
    setCurrentUser(user);
    return user;
  } catch (e) {
    logout();
    return null;
  }
}

export const authApi = {
  googleAuth,
  logout,
  getMe,
};
