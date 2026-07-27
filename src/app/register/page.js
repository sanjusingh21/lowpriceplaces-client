"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
      <p style={{ color: "var(--text-muted)" }}>Redirecting to Login...</p>
    </div>
  );
}
