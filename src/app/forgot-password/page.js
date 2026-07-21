"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");
    const email = e.target.email.value;

    try {
      const res = await api.forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.resetLink) {
        console.log("\n\nReset Link for local testing:\n" + res.resetLink);
        // Alert matching the original codebase style
        alert(res.message + "\n\nReset Link for local testing:\n" + res.resetLink);
      } else {
        alert(res.message);
      }
      router.push("/login");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
      <div className="glass-panel form-card" style={{ width: "400px" }}>
        <h2 className="form-title">Forgot Password</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
          Enter the email address associated with your account and we will generate a password reset link.
        </p>
        
        {authError && <div className="alert-banner alert-error">{authError}</div>}
        {successMsg && <div className="alert-banner alert-success">{successMsg}</div>}

        <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" placeholder="email@example.com" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }}>
            Request Reset Link
          </button>
        </form>

        <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
          Back to{" "}
          <Link href="/login" style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
