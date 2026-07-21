"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [authError, setAuthError] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAuthError("");
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    if (!token) {
      setAuthError("Reset token not found in URL query parameters.");
      return;
    }

    try {
      const res = await api.resetPassword(token, newPassword);
      alert(res.message);
      router.push("/login");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  return (
    <div className="glass-panel form-card" style={{ width: "400px" }}>
      <h2 className="form-title">Reset Password</h2>
      {authError && <div className="alert-banner alert-error">{authError}</div>}
      <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input type="password" name="newPassword" className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input type="password" name="confirmPassword" className="form-input" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }}>
          Save New Password
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
      <Suspense fallback={<div style={{ color: "var(--text-muted)" }}>Loading parameters...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
