"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface LoginApiResponse {
  success: boolean;
  data: {
    access_token: string;
    factory_id: number;
    factory_name: string;
    user_id: number;
    full_name: string | null;
    role: string;
  };
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const factoryId = Number(params.get("factory"));

  const [factoryName, setFactoryName] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!factoryId) {
      router.replace("/factories");
      return;
    }
    // Fetch factory name to display in header
    api
      .get<{ success: boolean; data: Array<{ id: number; name: string }> }>("/auth/factories")
      .then((res) => {
        const f = res.data.find((x) => x.id === factoryId);
        if (f) setFactoryName(f.name);
      })
      .catch(() => {});
  }, [factoryId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<LoginApiResponse>("/auth/login", {
        factory_id: factoryId,
        username,
        password,
      });
      saveSession({
        token: res.data.access_token,
        factoryId: res.data.factory_id,
        factoryName: res.data.factory_name,
        userId: res.data.user_id,
        fullName: res.data.full_name,
        role: res.data.role,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg === "INVALID_CREDENTIALS") {
        setError("Incorrect username or password.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <button
          onClick={() => router.push("/factories")}
          className="flex items-center gap-1 text-sm text-[#6B7685] hover:text-[#1E2A3A] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All factories
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#1E2A3A] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-[#C9973A]" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#6B7685]">
                Sign in to
              </p>
              <p className="font-semibold text-[#1E2A3A] text-[15px] leading-tight">
                {factoryName || "Factory"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-xs block mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border text-sm font-medium text-[#1E2A3A]",
                  "bg-white focus:outline-none focus:ring-2 focus:ring-[#C9973A] focus:border-[#C9973A]",
                  "placeholder:text-[#6B7685] placeholder:font-normal",
                  error ? "border-red-400" : "border-gray-200"
                )}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="label-xs block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={cn(
                    "w-full px-3 py-2 pr-10 rounded-lg border text-sm font-medium text-[#1E2A3A]",
                    "bg-white focus:outline-none focus:ring-2 focus:ring-[#C9973A] focus:border-[#C9973A]",
                    "placeholder:text-[#6B7685] placeholder:font-normal",
                    error ? "border-red-400" : "border-gray-200"
                  )}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7685] hover:text-[#1E2A3A]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-semibold text-white",
                "bg-[#1E2A3A] hover:bg-[#162030] transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-[#C9973A] focus:ring-offset-2",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6B7685] mt-6">Padaraksha Factory Management</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
