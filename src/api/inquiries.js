import { request } from "./client.js";

export async function sendInquiry(listingId, message) {
  return request("/inquiries", {
    method: "POST",
    body: { listingId, message },
  });
}

export async function getSellerInquiries() {
  return request("/inquiries/seller");
}

export async function getBuyerInquiries() {
  return request("/inquiries/buyer");
}

export async function getAllChats() {
  return request("/chats/all");
}

export async function startDirectChat(listingId, initialMessage) {
  return request("/chats/start", {
    method: "POST",
    body: { listingId, initialMessage },
  });
}

export async function sendChatMessage(inquiryId, text) {
  return request(`/inquiries/${inquiryId}/messages`, {
    method: "POST",
    body: { text },
  });
}

export async function replyToInquiry(id, text) {
  return request(`/inquiries/${id}/messages`, {
    method: "POST",
    body: { text },
  });
}

export async function getInquiryMessages(id) {
  return request(`/inquiries/${id}/messages`);
}

export async function markInquiryRead(id) {
  return request(`/inquiries/${id}/read`, {
    method: "POST",
  });
}

export const inquiriesApi = {
  sendInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  getAllChats,
  startDirectChat,
  sendChatMessage,
  replyToInquiry,
  getInquiryMessages,
  markInquiryRead,
};
