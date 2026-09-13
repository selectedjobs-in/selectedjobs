"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Key } from "lucide-react";
import { DEFAULT_ADMIN_KEY } from "@/lib/constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid Passkey");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultKey = () => {
    setKey(DEFAULT_ADMIN_KEY);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">
            Admin Approval Portal
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Secure editorial access for SelectedJobs.in
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Admin Security Passkey
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter administrator passkey"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying Access...</span>
              ) : (
                <>
                  <span>Access Moderation Queue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper for user / initial setup */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="text-[11px] text-zinc-400">
              Default system passcode: <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{DEFAULT_ADMIN_KEY}</span>
            </div>
            <button
              type="button"
              onClick={fillDefaultKey}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              <Key className="h-3 w-3" />
              <span>Auto-fill Default Passcode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
