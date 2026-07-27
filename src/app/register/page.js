"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";

export default function Register() {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const role = form.role.value;

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);
    try {
      const currentUser = await api.register(email, password, role);
      setUser(currentUser);
      fetchListings();
      router.push("/");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

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
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "613674321182-t4m0rv59tfkdhev3m4pke7hht7hbe0pl.apps.googleusercontent.com",
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
    <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="glass-panel form-card" style={{ width: "450px", position: "relative" }}>
        {authLoading && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(13, 14, 21, 0.7)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", borderRadius: "16px", zIndex: 10
          }}>
            <div style={{
              width: "40px", height: "40px", border: "4px solid rgba(255,255,255,0.1)",
              borderTop: "4px solid var(--primary, #6366f1)", borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ marginTop: "12px", fontSize: "var(--font-small)", color: "var(--text-main)", fontWeight: "var(--font-weight-semibold)" }}>Authenticating...</span>
          </div>
        )}

        <h2 className="form-title" style={{ textAlign: "center", marginBottom: "20px" }}>Join lowpriceplaces</h2>
        {authError && <div className="alert-banner alert-error" style={{ marginBottom: "16px" }}>{authError}</div>}

        {/* Google Authentication Button above the email/password form */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center", width: "100%" }}></div>
        </div>

        {/* OR Separator */}
        <div style={{ display: "flex", alignItems: "center", textAlign: "center", margin: "20px 0", color: "var(--text-muted)" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }}></div>
          <span style={{ padding: "0 10px", fontSize: "var(--font-caption)", fontWeight: "var(--font-weight-semibold)", letterSpacing: "1px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }}></div>
        </div>

        {/* Manual Email/Password registration form */}
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Select Account Type</label>
            <select name="role" className="form-input" style={{ background: "var(--bg-card)", color: "var(--text-main)" }} required>
              <option value="BUYER">Buyer (Explore, bookmark, rate & message sellers)</option>
              <option value="SELLER">Seller (Advertise listings, add discounts, get WhatsApp leads)</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }}>
            Create Account
          </button>
        </form>

        <p style={{ marginTop: "24px", fontSize: "var(--font-helper)", color: "var(--text-muted)", textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "var(--font-weight-semibold)" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
