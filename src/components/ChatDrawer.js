"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import { io } from "socket.io-client";

export default function ChatDrawer() {
  const {
    user,
    isChatOpen,
    setIsChatOpen,
    allChats,
    activeChatId,
    setActiveChatId,
    unreadChatCount,
    fetchUserChats,
  } = useApp();

  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  // Socket.IO Real-Time Chat Listener
  useEffect(() => {
    if (!isChatOpen || !user || !activeChatId) return;

    const socket = io(imageServer);
    socket.emit("join_room", activeChatId);

    socket.on("receive_message", () => {
      fetchUserChats();
    });

    return () => {
      socket.disconnect();
    };
  }, [isChatOpen, user, activeChatId]);

  // Auto-poll messages every 3s as fallback
  useEffect(() => {
    if (isChatOpen && user) {
      fetchUserChats();
      const interval = setInterval(() => {
        fetchUserChats();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, user]);

  // Scroll to bottom of active message list when activeChatId or messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allChats, activeChatId]);

  if (!isChatOpen || !user) return null;

  const activeChat = allChats.find((c) => c.id === activeChatId) || allChats[0];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat || sending) return;
    const textToSend = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      await api.sendChatMessage(activeChat.id, textToSend);
      await fetchUserChats();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={() => setIsChatOpen(false)}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          height: "100%",
          background: "var(--bg-card, #141422)",
          borderLeft: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
            background: "rgba(255, 255, 255, 0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>💬</span>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0, color: "var(--text-main, #fff)" }}>
                Messages
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)" }}>
                Direct 1-on-1 Conversation
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Main Body: Split View */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Conversations Sidebar */}
          <div
            style={{
              width: "280px",
              borderRight: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
              background: "rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-dim, #64748b)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              Active Chats ({allChats.length})
            </div>

            {allChats.length === 0 ? (
              <div
                style={{
                  padding: "30px 16px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "var(--text-muted, #94a3b8)",
                }}
              >
                No active chat conversations yet. Click "Chat Now" on any product listing to start messaging a seller!
              </div>
            ) : (
              allChats.map((chat) => {
                const isActive = activeChat?.id === chat.id;
                const lastMsg = chat.messages?.[chat.messages.length - 1];

                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      background: isActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--primary, #6366f1)" : "3px solid transparent",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* User Avatar */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: isActive
                          ? "linear-gradient(135deg, #6366f1, #ec4899)"
                          : "linear-gradient(135deg, #334155, #475569)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "15px",
                        flexShrink: 0,
                      }}
                    >
                      {chat.otherUser?.name ? chat.otherUser.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: "600",
                            color: "var(--text-main, #fff)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {chat.otherUser?.name || "User"}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "11.5px",
                          color: "var(--text-muted, #94a3b8)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🛍️ {chat.listing?.title || "Product Listing"}
                      </div>

                      {lastMsg && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-dim, #64748b)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: "2px",
                          }}
                        >
                          {lastMsg.senderId === user.id ? "You: " : ""}{lastMsg.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Message Chat Stream Window */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.08)" }}>
            {activeChat ? (
              <>
                {/* Chat Top Banner */}
                <div
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
                    background: "rgba(255, 255, 255, 0.02)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {activeChat.listing?.imagePath ? (
                    <img
                      src={`${imageServer}${activeChat.listing.imagePath.split(",")[0]}`}
                      alt={activeChat.listing.title}
                      style={{ width: "38px", height: "38px", objectFit: "cover", borderRadius: "6px" }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: "38px", height: "38px", borderRadius: "6px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛍️</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main, #fff)" }}>
                      Chatting with {activeChat.otherUser?.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--primary, #6366f1)", fontWeight: "600" }}>
                      Item: {activeChat.listing?.title} (₹{activeChat.listing?.price})
                    </div>
                  </div>
                </div>

                {/* Message Stream */}
                <div
                  style={{
                    flex: 1,
                    padding: "20px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {activeChat.messages && activeChat.messages.length > 0 ? (
                    activeChat.messages.map((msg, idx) => {
                      const isMe = msg.senderId === user.id;

                      return (
                        <div
                          key={msg.id || idx}
                          style={{
                            alignSelf: isMe ? "flex-end" : "flex-start",
                            maxWidth: "75%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              padding: "10px 14px",
                              borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                              background: isMe
                                ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                                : "var(--bg-input, rgba(255,255,255,0.08))",
                              color: "#ffffff",
                              fontSize: "13.5px",
                              lineHeight: "1.45",
                              boxShadow: isMe ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
                              wordBreak: "break-word",
                            }}
                          >
                            {msg.text}
                          </div>
                          <span
                            style={{
                              fontSize: "10.5px",
                              color: "var(--text-dim, #64748b)",
                              marginTop: "4px",
                              padding: "0 4px",
                            }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px", fontSize: "13px" }}>
                      Send your first message to start the conversation!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: "14px 18px",
                    borderTop: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
                    background: "rgba(255, 255, 255, 0.02)",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Message ${activeChat.otherUser?.name || 'user'}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid var(--border-glass, rgba(255,255,255,0.15))",
                      borderRadius: "24px",
                      padding: "10px 18px",
                      color: "var(--text-main, #fff)",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #ec4899)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "24px",
                      padding: "10px 20px",
                      fontWeight: "600",
                      fontSize: "13.5px",
                      cursor: messageInput.trim() && !sending ? "pointer" : "not-allowed",
                      opacity: messageInput.trim() && !sending ? 1 : 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.18s ease",
                    }}
                  >
                    Send ➔
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <span style={{ fontSize: "40px", marginBottom: "12px" }}>💬</span>
                Select a conversation on the left to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
