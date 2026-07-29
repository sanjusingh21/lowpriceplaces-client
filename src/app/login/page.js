"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";
import Logo from "@/components/logo";

export default function Login() {
  const router = useRouter();
  const { user, setUser, fetchListings } = useApp();
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Automatically redirect authenticated users
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleGoogleLoginResponse = async (response) => {
    try {
      setAuthError("");
      setAuthLoading(true);
      const currentUser = await api.googleAuth(response.credential);
      setUser(currentUser);
      fetchListings();
      router.push("/");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && typeof google !== "undefined") {
      try {
        google.accounts.id.initialize({
          client_id:
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            "613674321182-t4m0rv59tfkdhev3m4pke7hht7hbe0pl.apps.googleusercontent.com",
          callback: handleGoogleLoginResponse,
        });

        setTimeout(() => {
          const container = document.getElementById("google-signin-btn");
          if (container) {
            google.accounts.id.renderButton(container, {
              theme: "outline",
              size: "large",
              text: "continue_with",
              width: "360",
            });
          }
        }, 50);
      } catch (err) {
        console.error("Google authentication rendering error:", err);
      }
    }
  }, []);

  return (
    <div
      style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        className="glass-panel form-card"
        style={{ width: "400px", position: "relative" }}
      >
        {authLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(13, 14, 21, 0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid rgba(255,255,255,0.1)",
                borderTop: "4px solid var(--primary, #6366f1)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <span
              style={{
                marginTop: "12px",
                fontSize: "var(--font-small)",
                color: "var(--text-main)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Authenticating...
            </span>
          </div>
        )}

        <h2
          className="form-title"
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          Welcome
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <Logo />
          </div>
        </h2>

        {authError && (
          <div
            className="alert-banner alert-error"
            style={{ marginBottom: "16px" }}
          >
            {authError}
          </div>
        )}

        {/* Google Authentication Button above the email/password form */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <div
            id="google-signin-btn"
            style={{ display: "flex", justifyContent: "center", width: "100%" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
