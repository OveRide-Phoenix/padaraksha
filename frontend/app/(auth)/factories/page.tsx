"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Factory {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  is_active: boolean;
}

export default function FactoriesPage() {
  const router = useRouter();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already logged in → go to dashboard
    if (getSession()) {
      router.replace("/dashboard");
      return;
    }

    api.get<{ success: boolean; data: Factory[] }>("/auth/factories")
      .then((res) => setFactories(res.data))
      .catch(() => setError("Could not load factory list. Is the server running?"))
      .finally(() => setLoading(false));
  }, [router]);

  function selectFactory(id: number) {
    router.push(`/login?factory=${id}`);
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center px-4">
      {/* Logo / Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E2A3A] mb-4">
          <Building2 className="w-7 h-7 text-[#C9973A]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1E2A3A] tracking-tight">Padaraksha</h1>
        <p className="text-sm text-[#6B7685] mt-1">Select your factory to continue</p>
      </div>

      {/* State: loading */}
      {loading && (
        <div className="flex items-center gap-2 text-[#6B7685]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading factories…</span>
        </div>
      )}

      {/* State: error */}
      {error && (
        <div className="max-w-sm w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Factory cards */}
      {!loading && !error && (
        <div className="grid gap-4 w-full max-w-2xl sm:grid-cols-2">
          {factories.map((factory) => (
            <button
              key={factory.id}
              onClick={() => selectFactory(factory.id)}
              className={cn(
                "group text-left bg-white rounded-xl border border-gray-200 p-5",
                "shadow-sm hover:shadow-md hover:border-[#C9973A]",
                "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C9973A]"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#1E2A3A]/5 flex items-center justify-center group-hover:bg-[#C9973A]/10 transition-colors">
                  <Building2 className="w-5 h-5 text-[#1E2A3A] group-hover:text-[#C9973A] transition-colors" />
                </div>
                <span className="text-xs font-medium text-[#C9973A] opacity-0 group-hover:opacity-100 transition-opacity">
                  Select →
                </span>
              </div>
              <div className="mt-3">
                <p className="font-semibold text-[#1E2A3A] text-[15px]">{factory.name}</p>
                {(factory.city || factory.state) && (
                  <p className="flex items-center gap-1 text-xs text-[#6B7685] mt-1">
                    <MapPin className="w-3 h-3" />
                    {[factory.city, factory.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </button>
          ))}

          {factories.length === 0 && (
            <p className="col-span-2 text-center text-sm text-[#6B7685] py-8">
              No factories configured. Contact your administrator.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
