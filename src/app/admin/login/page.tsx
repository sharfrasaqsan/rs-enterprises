"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../AdminAuthContext";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AdminLoginPage() {
  const { signIn } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn(email, password);
    setLoading(false);
    if (res.success) {
      router.push("/admin");
    } else {
      setError(res.error || "Invalid login credentials. Please verify your email and password.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-base)]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-8 sm:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Staff Portal</Eyebrow>
          <ThemeToggle />
        </div>

        <div>
          <Heading level={2} className="text-2xl sm:text-3xl font-serif">
            RS Enterprises CRM
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Kaduruwela Head Office &bull; Showroom Management Console
          </p>
        </div>

        {error && (
          <div className="p-3 badge-status-danger text-xs rounded-[2px] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
            >
              Showroom Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff@rsenterprises.lk"
              className="w-full h-12 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-pass"
              className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1"
            >
              Security Password
            </label>
            <input
              id="admin-pass"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-12 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.2em] bg-[var(--accent)] text-stone-900 hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Showroom"}
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span>Protected Staff Gateway</span>
          <span>RS Enterprises &copy; 2026</span>
        </div>
      </div>
    </div>
  );
}

