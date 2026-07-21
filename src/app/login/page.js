"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";

export default function Login() {
  const router = useRouter();
  const { setUser, fetchListings } = useApp();
  const [authError, setAuthError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      const currentUser = await api.login(email, password);
      setUser(currentUser);
      fetchListings();
      router.push("/");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleGoogleLoginResponse = async (response) => {
    try {
      setAuthError("");
      const currentUser = await api.googleAuth(response.credential, "BUYER"); // Fallback to buyer role for default sign-in
      setUser(currentUser);
      fetchListings();
      router.push("/");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && typeof google !== "undefined") {
      try {
        google.accounts.id.initialize({
          client_id: "613674321182-t4m0rv59tfkdhev3m4pke7hht7hbe0pl.apps.googleusercontent.com",
          callback: handleGoogleLoginResponse,
        });

        setTimeout(() => {
          const container = document.getElementById("google-signin-btn");
          if (container) {
            google.accounts.id.renderButton(container, {
              theme: "outline",
              size: "large",
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
    <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
      <div className="glass-panel form-card" style={{ width: "400px" }}>
        <h2 className="form-title">Welcome Back</h2>
        {authError && <div className="alert-banner alert-error">{authError}</div>}
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-glass)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center" }}></div>
        </div>

        <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}>
            Register Here
          </Link>
        </p>
        <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
          <Link href="/forgot-password" style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}>
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
}
