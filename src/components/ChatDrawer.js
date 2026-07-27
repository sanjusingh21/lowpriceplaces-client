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
    fetchUserChats,
  } = useApp();

  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

  // Fetch message history for active chat
  useEffect(() => {
    if (!isChatOpen || !user || !activeChatId) {
      setActiveChatMessages([]);
      return;
    }

    let isMounted = true;
    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const data = await api.getInquiryMessages(activeChatId);
        if (isMounted) {
          setActiveChatMessages(data);
          // Mark conversation as read
          await api.markInquiryRead(activeChatId);
          fetchUserChats(); // Refresh unread count in drawer list
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
        }
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeChatId, isChatOpen, user]);

  // Socket.IO Real-Time Chat Listener
  useEffect(() => {
    if (!isChatOpen || !user || !activeChatId) return;

    const socket = io(imageServer);
    socket.emit("join_room", activeChatId);

    socket.on("receive_message", (newMessage) => {
      fetchUserChats();
      if (newMessage && newMessage.inquiryId === activeChatId) {
        setActiveChatMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isChatOpen, user, activeChatId]);

  // Auto-poll chats list every 6s as fallback
  useEffect(() => {
    if (isChatOpen && user) {
      fetchUserChats();
      const interval = setInterval(() => {
        fetchUserChats();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, user]);

  // Scroll to bottom of active message list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatMessages]);

  if (!isChatOpen || !user) return null;

  const activeChat = allChats.find((c) => c.id === activeChatId);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat || sending) return;
    const textToSend = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      const newMsg = await api.sendChatMessage(activeChat.id, textToSend);
      setActiveChatMessages((prev) => [...prev, newMsg]);
      await fetchUserChats();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Helper: Get message media type icon
  const getMessageTypeIcon = (text = "") => {
    const lower = text.toLowerCase().trim();
    if (lower.match(/\.(jpeg|jpg|gif|png|webp)/) || lower.includes("[image]") || lower.includes("[photo]")) {
      return "📷 ";
    }
    if (lower.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)/) || lower.includes("[pdf]") || lower.includes("[document]")) {
      return "📄 ";
    }
    if (lower.match(/\.(mp4|mov|avi|mkv|webm)/) || lower.includes("[video]")) {
      return "🎥 ";
    }
    if (lower.match(/\.(mp3|wav|ogg|m4a|aac)/) || lower.includes("[audio]") || lower.includes("[voice]")) {
      return "🎵 ";
    }
    return null;
  };

  // Helper: Format message time like WhatsApp
  const formatMsgTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
          maxWidth: "900px",
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
            <span style={{ fontSize: "var(--font-h4)" }}>💬</span>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "var(--font-weight-bold)", margin: 0, color: "var(--text-main, #fff)" }}>
                Chats
              </h2>
              <span style={{ fontSize: "var(--font-caption)", color: "var(--text-muted, #94a3b8)" }}>
                Classifieds Conversations
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
              fontSize: "var(--font-body-lg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Main Body: WhatsApp Responsive Split View */}
        <div 
          className={`chat-split-container ${activeChatId ? "has-active-chat" : ""}`}
          style={{ flex: 1, display: "flex", overflow: "hidden" }}
        >
          {/* Left Conversations Sidebar */}
          <div
            className="chat-sidebar"
            style={{
              width: "340px",
              borderRight: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
              background: "rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              flexShrink: 0
            }}
          >
            {allChats.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", fontSize: "var(--font-helper)", color: "var(--text-muted)" }}>
                No active conversations yet. Click "Chat Now" on listings to message sellers!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {allChats.map((chat) => {
                  const isActive = activeChatId === chat.id;
                  const lastMsg = chat.latestMessage || chat.messages?.[chat.messages.length - 1];
                  const hasUnread = chat.unreadCount > 0;
                  const isOnline = chat.otherUser?.isOnline;

                  // Name priority: display name -> otherUser name -> phone number
                  const displayName = chat.otherUser?.name || chat.otherUser?.phoneNumber || "User";
                  const avatarLetter = displayName.charAt(0).toUpperCase();

                  // Avatar background color based on name hash for consistency
                  const colors = [
                    "linear-gradient(135deg, #10b981, #059669)", // Emerald
                    "linear-gradient(135deg, #3b82f6, #2563eb)", // Blue
                    "linear-gradient(135deg, #8b5cf6, #7c3aed)", // Violet
                    "linear-gradient(135deg, #ec4899, #db2777)", // Pink
                    "linear-gradient(135deg, #f59e0b, #d97706)", // Amber
                    "linear-gradient(135deg, #ef4444, #dc2626)"  // Red
                  ];
                  const charCode = displayName.charCodeAt(0) || 0;
                  const bgGradient = colors[charCode % colors.length];

                  return (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        cursor: "pointer",
                        background: isActive ? "rgba(255, 255, 255, 0.06)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "background 0.2s ease",
                        position: "relative"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Avatar Wrapper */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            background: bgGradient,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "var(--font-weight-bold)",
                            fontSize: "17px",
                          }}
                        >
                          {avatarLetter}
                        </div>
                        {/* Online status indicator */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "2px",
                            right: "2px",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: isOnline ? "#10b981" : "#94a3b8",
                            border: "2px solid var(--bg-card, #141422)",
                            boxShadow: "0 0 4px rgba(0,0,0,0.5)"
                          }}
                        />
                      </div>

                      {/* Card Middle Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <span
                            style={{
                              fontSize: "14.5px",
                              fontWeight: hasUnread ? "700" : "600",
                              color: hasUnread ? "var(--text-main, #fff)" : "rgba(255, 255, 255, 0.9)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginRight: "8px"
                            }}
                          >
                            {displayName}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: hasUnread ? "#10b981" : "var(--text-dim, #64748b)",
                              fontWeight: hasUnread ? "700" : "normal",
                              whiteSpace: "nowrap",
                              flexShrink: 0
                            }}
                          >
                            {lastMsg ? formatMsgTime(lastMsg.createdAt) : ""}
                          </span>
                        </div>

                        {/* Product listing tag */}
                        <div style={{ fontSize: "11.5px", color: "var(--primary, #6366f1)", fontWeight: "var(--font-weight-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>
                          🏷️ {chat.listing?.title || "Product Listing"}
                        </div>

                        {/* Last message preview with type icon */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: "12.5px",
                              color: hasUnread ? "rgba(255,255,255,0.9)" : "var(--text-muted, #94a3b8)",
                              fontWeight: hasUnread ? "600" : "normal",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1
                            }}
                          >
                            {lastMsg ? (
                              <>
                                {getMessageTypeIcon(lastMsg.text)}
                                {lastMsg.senderId === user.id ? "You: " : ""}
                                {lastMsg.text}
                              </>
                            ) : (
                              "No messages yet"
                            )}
                          </span>

                          {/* Unread count badge */}
                          {hasUnread && (
                            <span
                              style={{
                                background: "#10b981",
                                color: "#ffffff",
                                borderRadius: "50%",
                                minWidth: "20px",
                                height: "20px",
                                padding: "0 6px",
                                fontSize: "11px",
                                fontWeight: "var(--font-weight-bold)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginLeft: "8px"
                              }}
                            >
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Message Chat Stream Window */}
          <div 
            className="chat-window"
            style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              background: "rgba(0,0,0,0.06)",
              minWidth: 0
            }}
          >
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
                  {/* Mobile Back Arrow to Conversations List */}
                  <button
                    className="chat-back-btn"
                    onClick={() => setActiveChatId(null)}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "var(--font-helper)",
                      cursor: "pointer",
                      display: "none", // Display set to block in responsive CSS
                      alignItems: "center",
                      gap: "4px",
                      marginRight: "6px"
                    }}
                  >
                    ← Back
                  </button>

                  {/* Listing thumbnail */}
                  {activeChat.listing?.imagePath ? (
                    <img
                      src={`${imageServer}${activeChat.listing.imagePath.split(",")[0]}`}
                      alt={activeChat.listing.title}
                      style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px" }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--font-h5)" }}>🛍️</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--font-small)", fontWeight: "var(--font-weight-bold)", color: "var(--text-main, #fff)" }}>
                      {activeChat.otherUser?.name || "User"}
                      <span style={{ fontSize: "11px", color: activeChat.otherUser?.isOnline ? "#10b981" : "#94a3b8", fontWeight: "var(--font-weight-medium)", marginLeft: "8px" }}>
                        ● {activeChat.otherUser?.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div style={{ fontSize: "var(--font-caption)", color: "var(--primary, #6366f1)", fontWeight: "var(--font-weight-semibold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                  {loadingMessages && activeChatMessages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px", fontSize: "var(--font-helper)" }}>
                      Loading messages...
                    </div>
                  ) : activeChatMessages.length > 0 ? (
                    activeChatMessages.map((msg, idx) => {
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
                                ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" // WhatsApp style green gradient
                                : "var(--bg-input, rgba(255,255,255,0.08))",
                              color: "#ffffff",
                              fontSize: "13.5px",
                              lineHeight: "1.45",
                              boxShadow: isMe ? "0 4px 12px rgba(16,185,129,0.2)" : "none",
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
                    <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px", fontSize: "var(--font-helper)" }}>
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
                      background: "linear-gradient(135deg, #10b981, #059669)", // WhatsApp green send button
                      border: "none",
                      color: "#fff",
                      borderRadius: "24px",
                      padding: "10px 20px",
                      fontWeight: "var(--font-weight-semibold)",
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
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", padding: "16px" }}>
                <span style={{ fontSize: "52px", marginBottom: "16px" }}>💬</span>
                <div style={{ fontSize: "var(--font-body-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-main)", marginBottom: "4px" }}>No Chat Selected</div>
                Select a conversation on the left to start messaging.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
