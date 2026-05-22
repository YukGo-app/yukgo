"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNavbar from "@/components/navigation/bottom-navbar";

type Shipment = {
  id: string;
  user_id: string | null;
  from_city: string | null;
  to_city: string | null;
  description: string | null;
  price: number | null;
  status: string | null;
  created_at: string | null;
  delivery_speed: string | null;
  expires_at: string | null;
  is_premium: boolean | null;
  premium_until: string | null;
  is_pinned: boolean | null;
  pinned_until: string | null;
  delivery_mode: string | null;
};

type DriverRoute = {
  id: string;
  user_id: string | null;
  from_location: string | null;
  to_location: string | null;
  departure_time: string | null;
  vehicle_type: string | null;
  capacity: string | null;
  status: string | null;
  expires_at: string | null;
  is_premium: boolean | null;
  premium_until: string | null;
  is_pinned: boolean | null;
  pinned_until: string | null;
  created_at: string | null;
};

type MarketplaceItem =
  | {
      type: "shipment";
      id: string;
      created_at: string | null;
      sponsored: boolean;
      pinned: boolean;
      shipment: Shipment;
    }
  | {
      type: "route";
      id: string;
      created_at: string | null;
      sponsored: boolean;
      pinned: boolean;
      route: DriverRoute;
    };

type FilterType = "all" | "shipments" | "routes" | "urgent";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "Hammasi" },
  { id: "shipments", label: "Yuklar" },
  { id: "routes", label: "Rotalar" },
  { id: "urgent", label: "Tezkor" },
];

export default function HomePage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState("");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(data.session.user.id);
      setAuthChecked(true);
    };

    checkAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(session.user.id);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  const fetchShipments = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("shipments")
        .select(
          "id, user_id, from_city, to_city, description, price, status, created_at, delivery_speed, expires_at, is_premium, premium_until, is_pinned, pinned_until, delivery_mode"
        )
        .eq("status", "open")
        .or(
          `expires_at.is.null,expires_at.gt.${nowIso},premium_until.gt.${nowIso},pinned_until.gt.${nowIso}`
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setShipments(((data ?? []) as Shipment[]).filter(isShipmentVisible));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Yuklab bo‘lmadi";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("driver_routes")
        .select(
          "id, user_id, from_location, to_location, departure_time, vehicle_type, capacity, status, created_at, expires_at, is_premium, premium_until, is_pinned, pinned_until"
        )
        .eq("status", "active")
        .or(
          `expires_at.is.null,expires_at.gt.${nowIso},premium_until.gt.${nowIso},pinned_until.gt.${nowIso}`
        )
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;

      setRoutes(((data ?? []) as DriverRoute[]).filter(isRouteVisible));
    } catch (err) {
      console.error("Routes load error:", err);
      setRoutes([]);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    fetchShipments();
    fetchRoutes();

    const channel = supabase
      .channel("marketplace-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shipments" },
        () => fetchShipments()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_routes" },
        () => fetchRoutes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authChecked, fetchShipments, fetchRoutes]);

  const filteredShipments = useMemo(() => {
    let list = shipments.filter(isShipmentVisible);

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      list = list.filter((shipment) => {
        return (
          (shipment.from_city ?? "").toLowerCase().includes(query) ||
          (shipment.to_city ?? "").toLowerCase().includes(query) ||
          (shipment.description ?? "").toLowerCase().includes(query)
        );
      });
    }

    return list;
  }, [shipments, search]);

  const allMarketplaceItems = useMemo<MarketplaceItem[]>(() => {
    const query = search.trim().toLowerCase();

    const filteredRoutes = routes.filter((route) => {
      if (!isRouteVisible(route)) return false;
      if (!query) return true;

      return (
        (route.from_location ?? "").toLowerCase().includes(query) ||
        (route.to_location ?? "").toLowerCase().includes(query) ||
        (route.departure_time ?? "").toLowerCase().includes(query) ||
        (route.vehicle_type ?? "").toLowerCase().includes(query) ||
        (route.capacity ?? "").toLowerCase().includes(query)
      );
    });

    const shipmentItems: MarketplaceItem[] = filteredShipments.map(
      (shipment) => ({
        type: "shipment",
        id: `shipment-${shipment.id}`,
        created_at: shipment.created_at,
        sponsored: isActivePremium(shipment),
        pinned: isActivePinned(shipment),
        shipment,
      })
    );

    const routeItems: MarketplaceItem[] = filteredRoutes.map((route) => ({
      type: "route",
      id: `route-${route.id}`,
      created_at: route.created_at,
      sponsored: isActivePremium(route),
      pinned: isActivePinned(route),
      route,
    }));

    let list = [...shipmentItems, ...routeItems];

    if (filter === "shipments") {
      list = shipmentItems;
    }

    if (filter === "routes") {
      list = routeItems;
    }

    if (filter === "urgent") {
      list = list.filter((item) =>
        item.type === "shipment" ? isUrgentShipment(item.shipment) : false
      );
    }

    return list;
  }, [filteredShipments, routes, search, filter]);

  const pinnedItems = useMemo(() => {
    return allMarketplaceItems.filter((item) => item.pinned).sort(sortByNewest);
  }, [allMarketplaceItems]);

  const marketplaceItems = useMemo(() => {
    const nonPinnedItems = allMarketplaceItems.filter((item) => !item.pinned);

    const sponsoredItems = nonPinnedItems
      .filter((item) => item.sponsored)
      .sort(sortByNewest);

    const normalItems = nonPinnedItems
      .filter((item) => !item.sponsored)
      .sort(sortByNewest);

    return mixSponsoredItems(normalItems, sponsoredItems);
  }, [allMarketplaceItems]);

  const totalVisibleCount = pinnedItems.length + marketplaceItems.length;
  const shouldShowPinnedAdSlot = pinnedItems.length > 0 && pinnedItems.length % 2 !== 0;

  const tickerItems = useMemo(() => {
    return shipments
      .filter(isShipmentVisible)
      .slice(0, 12)
      .map((shipment) => ({
        id: shipment.id,
        text: `${shipment.from_city ?? "?"} → ${shipment.to_city ?? "?"}`,
        tag:
          isActivePinned(shipment) || isActivePremium(shipment)
            ? "Faol"
            : getRemainingTime(
                shipment.expires_at,
                shipment.is_premium,
                shipment.premium_until,
                shipment.is_pinned,
                shipment.pinned_until
              ),
      }));
  }, [shipments]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05080b]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#05080b] text-white antialiased">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-24 -top-40 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header
        className="sticky top-0 z-40 border-b border-white/5 bg-[#05080b]/80 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-12 max-w-md items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-1.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-md bg-emerald-400/40 blur-sm" />

              <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3.5 w-3.5 text-[#05080b]"
                >
                  <path
                    d="M3 13l3-7h12l3 7v5h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3v-5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <span className="text-[13px] font-semibold tracking-tight">
              Yuk
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Go
              </span>
            </span>
          </Link>

          <h1 className="text-[14px] font-semibold tracking-tight text-white/90">
            Marketplace
          </h1>

          <Link
            href="/messages"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-emerald-300 transition active:scale-95"
            aria-label="Xabarlar"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
              <path
                d="M5 6.5A3.5 3.5 0 018.5 3h7A3.5 3.5 0 0119 6.5v5A3.5 3.5 0 0115.5 15H11l-4.5 4v-4A3.5 3.5 0 015 11.5v-5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 8h6M9 11h4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>

        {tickerItems.length > 0 ? (
          <div className="relative overflow-hidden border-t border-white/5 bg-emerald-500/[0.03]">
            <div className="flex h-7 items-center">
              <div className="flex shrink-0 items-center gap-1.5 border-r border-white/5 px-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  Live
                </span>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <div className="ticker-track flex whitespace-nowrap will-change-transform">
                  {[...tickerItems, ...tickerItems].map((item, index) => (
                    <span
                      key={`${item.id}-${index}`}
                      className="mx-4 flex items-center gap-2 text-[11.5px]"
                    >
                      <span className="text-white/80">{item.text}</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-white/40">{item.tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-md px-4 pb-3 pt-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-md focus-within:border-emerald-300/40">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white/40">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M20 20l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Shahar, yuk yoki yo‘nalish qidiring..."
              className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-white/30"
            />

            {search ? (
              <button
                onClick={() => setSearch("")}
                className="text-white/40 hover:text-white/80"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {FILTERS.map((item) => {
              const active = filter === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`h-9 rounded-xl border px-1 text-[11px] font-black transition active:scale-95 ${
                    active
                      ? "border-emerald-300/40 bg-emerald-400 text-[#03120d]"
                      : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="block truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-md px-3 pb-32 pt-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.02]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5 text-center">
            <p className="text-[13px] text-rose-200/90">{error}</p>

            <button
              onClick={() => {
                fetchShipments();
                fetchRoutes();
              }}
              className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-1.5 text-[12px] text-rose-100"
            >
              Qayta urinish
            </button>
          </div>
        ) : totalVisibleCount === 0 ? (
          <EmptyState hasFilter={!!search || filter !== "all"} />
        ) : (
          <>
            {pinnedItems.length > 0 ? (
              <section className="mb-4 rounded-[1.6rem] border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.08] via-emerald-400/[0.035] to-cyan-400/[0.035] p-2.5 shadow-[0_0_36px_-22px_rgba(251,191,36,1)]">
                <div className="grid grid-cols-2 gap-2.5">
                  {pinnedItems.map((item) =>
                    item.type === "shipment" ? (
                      <ShipmentCard
                        key={item.id}
                        shipment={item.shipment}
                        currentUserId={currentUserId}
                        sponsored={item.sponsored}
                        pinned={item.pinned}
                      />
                    ) : (
                      <DriverRouteCard
                        key={item.id}
                        route={item.route}
                        currentUserId={currentUserId}
                        sponsored={item.sponsored}
                        pinned={item.pinned}
                      />
                    )
                  )}

                  {shouldShowPinnedAdSlot ? <PremiumAdSlot /> : null}
                </div>
              </section>
            ) : null}

            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11px] uppercase tracking-wider text-white/40">
                {totalVisibleCount} ta faol e’lon
              </span>

              <span className="text-[11px] text-emerald-300/80">
                yuklar va rotalar
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {marketplaceItems.map((item) =>
                item.type === "shipment" ? (
                  <ShipmentCard
                    key={item.id}
                    shipment={item.shipment}
                    currentUserId={currentUserId}
                    sponsored={item.sponsored}
                    pinned={item.pinned}
                  />
                ) : (
                  <DriverRouteCard
                    key={item.id}
                    route={item.route}
                    currentUserId={currentUserId}
                    sponsored={item.sponsored}
                    pinned={item.pinned}
                  />
                )
              )}
            </div>
          </>
        )}
      </main>

      <BottomNavbar />

      <style jsx>{`
        .ticker-track {
          animation: ticker 40s linear infinite;
        }

        @keyframes ticker {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function PremiumAdSlot() {
  return (
    <div className="relative min-h-[156px] overflow-hidden rounded-2xl border border-dashed border-amber-300/30 bg-gradient-to-br from-amber-300/[0.10] via-white/[0.025] to-cyan-300/[0.045] p-3 shadow-[0_0_28px_-18px_rgba(251,191,36,1)]">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-300/15 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-emerald-300/10 blur-2xl" />

      <div className="relative flex h-full min-h-[132px] flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/35 bg-black/25 text-[13px]">
            ✦
          </span>

          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-100/85">
            Premium
          </span>
        </div>

        <div>
          <div className="text-[13px] font-black leading-tight text-white">
            Reklama joyi
          </div>

          <p className="mt-1 text-[10.5px] font-medium leading-snug text-white/50">
            E’loningizni shu maydonda ko‘rsatish mumkin.
          </p>
        </div>

        <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-300/70 via-emerald-300/45 to-cyan-300/55" />
      </div>
    </div>
  );
}

function ShipmentCard({
  shipment,
  currentUserId,
  sponsored,
  pinned,
}: {
  shipment: Shipment;
  currentUserId: string;
  sponsored: boolean;
  pinned: boolean;
}) {
  const router = useRouter();
  const isOwnShipment = shipment.user_id === currentUserId;

  const type =
    getDescriptionValue(shipment.description, "Yuk") ||
    getDescriptionValue(shipment.description, "Yuk turi") ||
    getDescriptionValue(shipment.description, "Kargo turi") ||
    "Yuk";

  const delivery =
    getDescriptionValue(shipment.description, "Yetkazish turi") ||
    getDescriptionValue(shipment.description, "Teslimat hızı") ||
    getDescriptionValue(shipment.description, "delivery") ||
    "Suhbatda kelishiladi";

  const urgent = isUrgentShipment(shipment);
  const remainingTime = getRemainingTime(
    shipment.expires_at,
    shipment.is_premium,
    shipment.premium_until,
    shipment.is_pinned,
    shipment.pinned_until
  );

  return (
    <button
      onClick={() => router.push(`/shipments/${shipment.id}`)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl text-left backdrop-blur-md transition active:scale-[0.98] ${
        pinned
          ? "border-2 border-amber-300/70 bg-gradient-to-b from-amber-400/[0.18] via-emerald-400/[0.08] to-white/[0.025] shadow-[0_0_34px_-14px_rgba(251,191,36,1)]"
          : sponsored
          ? "border border-amber-300/40 bg-gradient-to-b from-amber-400/[0.12] to-white/[0.025] shadow-[0_0_24px_-14px_rgba(251,191,36,0.95)]"
          : urgent
          ? "border border-emerald-300/25 bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-[0_0_22px_-12px_rgba(16,185,129,0.8)]"
          : "border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] hover:border-emerald-300/25"
      }`}
    >
      {pinned || sponsored ? (
        <div className="absolute left-2 right-2 top-2 z-10 flex items-center justify-between">
          {sponsored ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.16em] text-amber-200 backdrop-blur-md">
              Sponsorli
            </span>
          ) : (
            <span />
          )}

          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/35 bg-black/35 text-[11px] text-amber-100 backdrop-blur-md">
            {pinned ? "📌" : "Reklama"}
          </span>
        </div>
      ) : null}

      <div className="relative h-[72px] overflow-hidden border-b border-white/5">
        <div
          className={`absolute inset-0 ${
            pinned
              ? "bg-gradient-to-br from-amber-400/24 via-emerald-400/12 to-cyan-500/14"
              : sponsored
              ? "bg-gradient-to-br from-amber-500/18 via-emerald-500/10 to-cyan-500/12"
              : "bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/10"
          }`}
        />

        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(16,185,129,0.4), transparent 40%), radial-gradient(circle at 80% 50%, rgba(6,182,212,0.35), transparent 40%)",
          }}
        />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <path
            d="M 20 55 Q 100 5 180 55"
            stroke="url(#routeGrad)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="3 3"
          />

          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {!pinned && !sponsored ? (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 backdrop-blur-md">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200">
              {isOwnShipment ? "meniki" : urgent ? "tezkor" : "ochiq"}
            </span>
          </div>
        ) : null}

        <div className="absolute right-2 bottom-2 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] text-white/70 backdrop-blur-md">
          {remainingTime}
        </div>

        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]">
            <div className="h-1 w-1 rounded-full bg-white" />
          </div>
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            <div className="h-1 w-1 rounded-full bg-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="flex items-center gap-1 text-[12.5px] font-semibold leading-tight">
          <span className="truncate text-white">{shipment.from_city ?? "?"}</span>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-3 w-3 shrink-0 text-emerald-300"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span className="truncate text-white">{shipment.to_city ?? "?"}</span>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-white/50">
          <span className="truncate">{type}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
          <span className="truncate">{delivery}</span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-white/35">
              Holat
            </div>

            <div
              className={`truncate text-[12.5px] font-semibold ${
                pinned || sponsored ? "text-amber-100" : "text-emerald-300"
              }`}
            >
              Xabar kutmoqda
            </div>
          </div>

          <div
            className={`flex h-7 shrink-0 items-center gap-0.5 rounded-lg border px-2 text-[10.5px] font-semibold transition ${
              pinned || sponsored
                ? "border-amber-300/35 bg-amber-300/10 text-amber-100 group-hover:bg-amber-300/20"
                : "border-emerald-300/30 bg-emerald-400/10 text-emerald-200 group-hover:bg-emerald-400/20"
            }`}
          >
            {isOwnShipment ? "Boshqarish" : "Yozish"}
          </div>
        </div>
      </div>
    </button>
  );
}

function DriverRouteCard({
  route,
  currentUserId,
  sponsored,
  pinned,
}: {
  route: DriverRoute;
  currentUserId: string;
  sponsored: boolean;
  pinned: boolean;
}) {
  const router = useRouter();
  const isOwnRoute = route.user_id === currentUserId;

  return (
    <button
      onClick={() =>
        router.push(isOwnRoute ? "/routes" : `/chat/${route.id}?type=route`)
      }
      className={`group relative flex flex-col overflow-hidden rounded-2xl text-left backdrop-blur-md transition active:scale-[0.98] ${
        pinned
          ? "border-2 border-amber-300/70 bg-gradient-to-b from-amber-400/[0.18] via-cyan-400/[0.08] to-white/[0.025] shadow-[0_0_34px_-14px_rgba(251,191,36,1)]"
          : sponsored
          ? "border border-amber-300/40 bg-gradient-to-b from-amber-400/[0.12] to-cyan-400/[0.04] shadow-[0_0_24px_-14px_rgba(251,191,36,0.95)]"
          : "border border-cyan-300/20 bg-gradient-to-b from-cyan-400/[0.10] to-white/[0.02] hover:border-cyan-300/35"
      }`}
    >
      {pinned || sponsored ? (
        <div className="absolute left-2 right-2 top-2 z-10 flex items-center justify-between">
          {sponsored ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.16em] text-amber-200 backdrop-blur-md">
              Sponsorli
            </span>
          ) : (
            <span />
          )}

          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/35 bg-black/35 text-[11px] text-amber-100 backdrop-blur-md">
            {pinned ? "📌" : "Reklama"}
          </span>
        </div>
      ) : null}

      <div className="relative h-[72px] overflow-hidden border-b border-white/5">
        <div
          className={`absolute inset-0 ${
            pinned
              ? "bg-gradient-to-br from-amber-400/24 via-cyan-400/14 to-emerald-500/12"
              : sponsored
              ? "bg-gradient-to-br from-amber-500/18 via-cyan-500/14 to-emerald-500/10"
              : "bg-gradient-to-br from-cyan-500/20 via-transparent to-emerald-500/10"
          }`}
        />

        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(34,211,238,0.4), transparent 40%), radial-gradient(circle at 80% 50%, rgba(16,185,129,0.35), transparent 40%)",
          }}
        />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <path
            d="M 20 55 Q 100 5 180 55"
            stroke="url(#routeCardGrad)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="3 3"
          />

          <defs>
            <linearGradient id="routeCardGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {!pinned && !sponsored ? (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 backdrop-blur-md">
            <span className="h-1 w-1 rounded-full bg-cyan-300" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-200">
              rota
            </span>
          </div>
        ) : null}

        <div className="absolute right-2 bottom-2 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] text-white/70 backdrop-blur-md">
          {getRemainingTime(
            route.expires_at,
            route.is_premium,
            route.premium_until,
            route.is_pinned,
            route.pinned_until
          )}
        </div>

        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]">
            <div className="h-1 w-1 rounded-full bg-white" />
          </div>
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]">
            <div className="h-1 w-1 rounded-full bg-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="flex items-center gap-1 text-[12.5px] font-semibold leading-tight">
          <span className="truncate text-white">{route.from_location ?? "?"}</span>
          <span className="text-cyan-300">→</span>
          <span className="truncate text-white">{route.to_location ?? "?"}</span>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-white/50">
          <span className="truncate">{route.vehicle_type ?? "Transport"}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
          <span className="truncate">{route.departure_time ?? "Vaqt"}</span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-white/35">
              Holat
            </div>

            <div
              className={`truncate text-[12.5px] font-semibold ${
                pinned || sponsored ? "text-amber-100" : "text-cyan-300"
              }`}
            >
              Faol yo‘nalish
            </div>
          </div>

          <div
            className={`flex h-7 shrink-0 items-center rounded-lg border px-2 text-[10.5px] font-semibold ${
              pinned || sponsored
                ? "border-amber-300/35 bg-amber-300/10 text-amber-100"
                : "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
            }`}
          >
            {isOwnRoute ? "Boshqarish" : "Yozish"}
          </div>
        </div>
      </div>
    </button>
  );
}

function sortByNewest(a: MarketplaceItem, b: MarketplaceItem) {
  const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
  const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

  return timeB - timeA;
}

function mixSponsoredItems(
  normalItems: MarketplaceItem[],
  sponsoredItems: MarketplaceItem[]
) {
  if (sponsoredItems.length === 0) return normalItems;
  if (normalItems.length === 0) return sponsoredItems;

  const result: MarketplaceItem[] = [];
  let sponsorIndex = 0;

  normalItems.forEach((item, index) => {
    result.push(item);

    const shouldInsertSponsor =
      (index + 1) % 4 === 0 || index === normalItems.length - 1;

    if (shouldInsertSponsor && sponsorIndex < sponsoredItems.length) {
      result.push(sponsoredItems[sponsorIndex]);
      sponsorIndex += 1;
    }
  });

  while (sponsorIndex < sponsoredItems.length) {
    result.push(sponsoredItems[sponsorIndex]);
    sponsorIndex += 1;
  }

  return result;
}

function getDescriptionValue(description: string | null, key: string): string | null {
  if (!description) return null;

  const line = description
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(key.toLowerCase()));

  if (line) {
    return line.split(":").slice(1).join(":").trim();
  }

  const patterns = [
    new RegExp(`${key}\\s*:\\s*([^|;\\n,]+)`, "i"),
    new RegExp(`${key}\\s*=\\s*([^|;\\n,]+)`, "i"),
  ];

  for (const re of patterns) {
    const match = description.match(re);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function isActivePremium(item: {
  is_premium: boolean | null;
  premium_until: string | null;
}): boolean {
  if (!item.is_premium || !item.premium_until) return false;

  return new Date(item.premium_until).getTime() > Date.now();
}

function isActivePinned(item: {
  is_pinned: boolean | null;
  pinned_until: string | null;
}): boolean {
  if (!item.is_pinned || !item.pinned_until) return false;

  return new Date(item.pinned_until).getTime() > Date.now();
}

function isShipmentVisible(shipment: Shipment): boolean {
  if (shipment.delivery_mode === "city_courier") return false;
  if (shipment.status !== "open") return false;
  if (isActivePremium(shipment) || isActivePinned(shipment)) return true;
  if (!shipment.expires_at) return true;

  return new Date(shipment.expires_at).getTime() > Date.now();
}

function isRouteVisible(route: DriverRoute): boolean {
  if (route.status !== "active") return false;
  if (isActivePremium(route) || isActivePinned(route)) return true;
  if (!route.expires_at) return true;

  return new Date(route.expires_at).getTime() > Date.now();
}

function getRemainingTime(
  expiresAt: string | null,
  isPremium: boolean | null,
  premiumUntil: string | null,
  isPinned: boolean | null,
  pinnedUntil: string | null
): string {
  if (
    (isPinned && pinnedUntil && new Date(pinnedUntil).getTime() > Date.now()) ||
    (isPremium && premiumUntil && new Date(premiumUntil).getTime() > Date.now())
  ) {
    return "Faol";
  }

  if (!expiresAt) return "Faol";

  const diffMs = new Date(expiresAt).getTime() - Date.now();

  if (diffMs <= 0) return "Tugagan";

  const mins = Math.floor(diffMs / 60000);

  if (mins < 60) return `${mins} daq qoldi`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours} soat qoldi`;

  const days = Math.ceil(hours / 24);

  return `${days} kun qoldi`;
}

function isUrgentShipment(shipment: Shipment): boolean {
  if (
    shipment.delivery_speed === "30_minutes" ||
    shipment.delivery_speed === "1_hour" ||
    shipment.delivery_speed === "2_hours" ||
    shipment.delivery_speed === "6_hours"
  ) {
    return true;
  }

  const delivery =
    getDescriptionValue(shipment.description, "Yetkazish turi") ||
    getDescriptionValue(shipment.description, "Teslimat hızı") ||
    "";

  if (
    ["tez", "tezkor", "bugun", "moto"].some((word) =>
      delivery.toLowerCase().includes(word)
    )
  ) {
    return true;
  }

  if (!shipment.expires_at) return false;

  const diffMs = new Date(shipment.expires_at).getTime() - Date.now();

  return diffMs > 0 && diffMs <= 6 * 60 * 60 * 1000;
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="mx-auto mt-12 max-w-xs text-center">
      <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8 text-emerald-300/70"
          >
            <path d="M3 7h13v10H3z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 10h3l2 3v4h-5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="7" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="17" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <h3 className="text-[15px] font-semibold">
        {hasFilter ? "Hech narsa topilmadi" : "Hozircha e’lonlar yo‘q"}
      </h3>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50">
        {hasFilter
          ? "Filtrlarni o‘zgartirib qayta urinib ko‘ring."
          : "Yangi e’lonlar shu yerda jonli ko‘rinadi."}
      </p>
    </div>
  );
}