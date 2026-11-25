"use client";

import Link from "next/link";
import { useState } from "react";
import "./admin.css";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const password = new FormData(e.currentTarget).get("password");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) return location.reload();
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
    } catch {
      setError("Could not reach the server");
    }
    setBusy(false);
  };

  return (
    <div className="adm-root adm-root--center">
      <form className="adm-login" onSubmit={onSubmit}>
        <h1>Admin</h1>
        {configured ? (
          <>
            <label className="adm-field">
              <span>Password</span>
              <input name="password" type="password" autoComplete="current-password" required autoFocus />
            </label>
            <button className="adm-btn adm-btn--primary" type="submit" disabled={busy}>
              {busy ? "Checking…" : "Log in"}
            </button>
            {error && (
              <p className="adm-error" role="alert">
                {error}
              </p>
            )}
          </>
        ) : (
          <p className="adm-note">
            Admin login isn&apos;t set up yet. Add <code>ADMIN_PASSWORD</code> and a 32+ character <code>SESSION_SECRET</code>{" "}
            to <code>.env.local</code>, then restart the server.
          </p>
        )}
        <Link className="adm-link" href="/">
          ← Back to the site
        </Link>
      </form>
    </div>
  );
}
