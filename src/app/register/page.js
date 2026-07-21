"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { api } from "@/api";

export default function Register() {
  const router = useRouter();
  const { setUser, fetchListings } = useApp();
  const [authError, setAuthError] = useState("");
  const [selectedSignupRole, setSelectedSignupRole] = useState("select");

  const handleGoogleLoginResponse = async (response) => {
    try {
      setAuthError("");
      const currentUser = await api.googleAuth(response.credential, selectedSignupRole);
      setUser(currentUser);
      fetchListings();
      router.push("/");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && typeof google !== "undefined" && selectedSignupRole !== "select") {
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
  }, [selectedSignupRole]);

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
      <div className="glass-panel form-card" style={{ width: "450px" }}>
        <h2 className="form-title">Join lowpriceplaces</h2>
        {authError && <div className="alert-banner alert-error">{authError}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">Select Account Type</label>
            <select
              name="role"
              className="form-select"
              value={selectedSignupRole}
              onChange={(e) => setSelectedSignupRole(e.target.value)}
              required
            >
              <option value="select">-- Select Account Type --</option>
              <option value="BUYER">Buyer (Explore, bookmark, rate & message sellers)</option>
              <option value="SELLER">Seller (Advertise listings, add discounts, get WhatsApp leads)</option>
            </select>
          </div>

          {selectedSignupRole !== "select" ? (
            <div style={{ marginTop: "8px", borderTop: "1px solid var(--border-glass)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center" }}></div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", background: "rgba(255,255,255,0.02)" }}>
              👉 Please select an Account Type above to enable Google Registration.
            </div>
          )}
        </div>

        <p style={{ marginTop: "24px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
