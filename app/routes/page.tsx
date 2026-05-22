"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type DriverRoute = {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  vehicle_type: string;
  capacity: string;
  status: string;
  created_at: string;
};

export default function RoutesPage() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingRouteId, setDeletingRouteId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadRoutes = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) {
            setCurrentUserId("");
            setRoutes([]);
            setLoading(false);
          }

          return;
        }

        if (mounted) {
          setCurrentUserId(session.user.id);
        }

        const { data, error } = await supabase
          .from("driver_routes")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);

          if (mounted) {
            setRoutes([]);
          }

          return;
        }

        if (mounted) {
          setRoutes((data || []) as DriverRoute[]);
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setRoutes([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRoutes();

    const channel = supabase
      .channel("my-driver-routes-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_routes",
        },
        () => {
          loadRoutes();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteRoute = async (route: DriverRoute) => {
    if (!currentUserId || route.user_id !== currentUserId) return;

    const confirmed = window.confirm(
      "Bu yo‘nalish o‘chirilsinmi? Bu amalni ortga qaytarib bo‘lmaydi."
    );

    if (!confirmed) return;

    setMessage("");
    setDeletingRouteId(route.id);

    const { error } = await supabase
      .from("driver_routes")
      .delete()
      .eq("id", route.id)
      .eq("user_id", currentUserId);

    if (error) {
      console.error(error);
      setMessage("Yo‘nalishni o‘chirib bo‘lmadi.");
      setDeletingRouteId("");
      return;
    }

    setRoutes((prev) => prev.filter((item) => item.id !== route.id));
    setMessage("Yo‘nalish o‘chirildi.");
    setDeletingRouteId("");
  };

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-md px-4 py-4 pb-32">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
              Mening yo‘nalishlarim
            </p>

            <h1 className="mt-1 text-[24px] font-black leading-tight">
              Yo‘l boshqaruvi
            </h1>

            <p className="mt-1 max-w-[260px] text-xs leading-5 text-slate-400">
              Ochgan rotalaringizni shu yerda ko‘rasiz va kerak bo‘lsa
              o‘chirasiz.
            </p>
          </div>

          <Link
            href="/driver-route"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-[#03120d] active:scale-95"
            aria-label="Yo‘l ochish"
          >
            +
          </Link>
        </header>

        {message ? (
          <div className="mb-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-300">
            {message}
          </div>
        ) : null}

        <div className="mb-3 rounded-[1.25rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/14 to-cyan-400/8 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Faol rotalar
              </div>

              <h2 className="mt-0.5 text-lg font-black">
                {routes.length} ta yo‘l
              </h2>
            </div>

            <Link
              href="/driver-route"
              className="rounded-2xl bg-emerald-400 px-3.5 py-2 text-[11px] font-black text-[#03120d] active:scale-95"
            >
              + Yo‘l
            </Link>
          </div>
        </div>

        <div className="space-y-2.5">
          {loading ? (
            <>
              <RouteSkeleton />
              <RouteSkeleton />
            </>
          ) : routes.length === 0 ? (
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-6 text-center">
              <div className="text-3xl">🚗</div>

              <h2 className="mt-3 text-base font-black">
                Hozircha faol yo‘lingiz yo‘q
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Yo‘l ochsangiz, uni shu sahifadan boshqarasiz.
              </p>

              <Link
                href="/driver-route"
                className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#03120d]"
              >
                Yo‘l ochish
              </Link>
            </div>
          ) : (
            routes.map((route) => (
              <div
                key={route.id}
                className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.04]"
              >
                <div className="relative h-[52px] overflow-hidden border-b border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/10" />

                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 18% 50%, rgba(16,185,129,0.45), transparent 38%), radial-gradient(circle at 82% 50%, rgba(34,211,238,0.35), transparent 38%)",
                    }}
                  />

                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 260 52"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 28 34 Q 130 8 232 34"
                      stroke="url(#routeLine)"
                      strokeWidth="1.3"
                      fill="none"
                      strokeDasharray="4 4"
                    />

                    <defs>
                      <linearGradient id="routeLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute left-4 top-1/2 flex h-2.5 w-2.5 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,.85)]">
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </div>

                  <div className="absolute right-4 top-1/2 flex h-2.5 w-2.5 -translate-y-1/2 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.85)]">
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </div>

                  <div className="absolute left-3 top-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                    Sizning yo‘l
                  </div>

                  <div className="absolute right-3 top-2 text-[9px] font-semibold text-slate-400">
                    {formatDate(route.created_at)}
                  </div>
                </div>

                <div className="p-3">
                  <h2 className="truncate text-[15px] font-black leading-tight">
                    {route.from_location}{" "}
                    <span className="text-emerald-300">→</span>{" "}
                    {route.to_location}
                  </h2>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <InfoCard label="Transport" value={route.vehicle_type} />
                    <InfoCard label="Jo‘nash" value={route.departure_time} />
                  </div>

                  <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[9px] font-semibold text-slate-500">
                      Bo‘sh joy
                    </div>

                    <div className="mt-0.5 line-clamp-1 text-[11px] leading-5 text-slate-300">
                      {route.capacity}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-500">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span className="truncate">faol yo‘nalish</span>
                    </div>

                    <button
                      onClick={() => handleDeleteRoute(route)}
                      disabled={deletingRouteId === route.id}
                      className="shrink-0 rounded-2xl border border-red-400/20 bg-red-400/10 px-3.5 py-1.5 text-[11px] font-bold text-red-300 active:scale-95 disabled:opacity-60"
                    >
                      {deletingRouteId === route.id
                        ? "O‘chirilmoqda..."
                        : "O‘chirish"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <BottomNavbar />
    </main>
  );
}

function RouteSkeleton() {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3">
      <div className="h-3.5 w-36 animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 h-3.5 w-full animate-pulse rounded-full bg-white/10" />
      <div className="mt-2 h-3.5 w-2/3 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[9px] font-semibold text-slate-500">{label}</div>

      <div className="mt-0.5 truncate text-[11px] font-bold text-white">
        {value}
      </div>
    </div>
  );
}