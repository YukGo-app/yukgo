"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type Shipment = {
  id: string;
  from_city: string | null;
  to_city: string | null;
  description: string | null;
  price: number | null;
  status: string | null;
  created_at: string | null;
};

export default function JobsPage() {
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadUserShipments = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        if (mounted) {
          setUserEmail(session.user.email || "");
        }

        const { data, error } = await supabase
          .from("shipments")
          .select(
            "id, from_city, to_city, description, price, status, created_at"
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("User shipments error:", error.message);

          if (mounted) {
            setShipments([]);
          }

          return;
        }

        if (mounted) {
          setShipments(data || []);
        }
      } catch (error) {
        console.error("Jobs page error:", error);

        if (mounted) {
          setShipments([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUserShipments();

    const channel = supabase
      .channel("user-shipments-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
        },
        () => {
          loadUserShipments();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-md px-5 py-6 pb-28">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Sizning shipmentlaringiz
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight">
                Mening yuklarim
              </h1>
            </div>

            <Link
              href="/create"
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#04110d] transition-all duration-200 active:scale-95"
            >
              + Yangi
            </Link>
          </div>

          <div className="mt-4 rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-xl font-black text-emerald-300">
                {userEmail?.charAt(0).toUpperCase() || "Y"}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold text-white">
                  {userEmail || "YukGo foydalanuvchisi"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Shipment boshqaruvi va marketplace activity
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatsCard
                value={String(shipments.length)}
                label="Jami"
              />

              <StatsCard
                value={String(
                  shipments.filter((s) => s.status === "open").length
                )}
                label="Ochiq"
              />

              <StatsCard
                value={String(
                  shipments.filter((s) => s.status === "completed").length
                )}
                label="Yakunlangan"
              />
            </div>
          </div>
        </header>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">
              So‘nggi shipmentlar
            </h2>

            <span className="text-xs text-slate-500">
              realtime sync
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
                <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-white/10" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
              </div>
            ) : shipments.length === 0 ? (
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-2xl">
                <div className="text-4xl">📦</div>

                <h3 className="mt-3 text-lg font-black">
                  Sizda hali shipment yo‘q
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Birinchi yuk e’loningizni joylang va tashuvchilardan
                  taklif oling.
                </p>

                <Link
                  href="/create"
                  className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#04110d]"
                >
                  Yuk yaratish
                </Link>
              </div>
            ) : (
              shipments.map((shipment) => (
                <Link
                  key={shipment.id}
                  href={`/shipments/${shipment.id}`}
                  className="block rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl transition-all duration-200 active:scale-[0.99]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            shipment.status === "completed"
                              ? "bg-cyan-400/15 text-cyan-300"
                              : shipment.status === "in_transit"
                              ? "bg-yellow-400/15 text-yellow-300"
                              : "bg-emerald-400/15 text-emerald-300"
                          }`}
                        >
                          {getStatusLabel(shipment.status)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-black">
                        {shipment.from_city || "Noma’lum"} →{" "}
                        {shipment.to_city || "Noma’lum"}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-300">
                        {shipment.price
                          ? `${shipment.price.toLocaleString(
                              "uz-UZ"
                            )} so‘m`
                          : "Kelishiladi"}
                      </div>

                      <div className="mt-1 text-[11px] text-slate-500">
                        {formatDate(shipment.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                    <p className="line-clamp-3 text-sm leading-6 text-slate-300">
                      {shipment.description ||
                        "Shipment tavsifi mavjud emas"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      marketplace active
                    </div>

                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
                      Batafsil
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </section>

      <BottomNavbar />
    </main>
  );
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case "completed":
      return "Yetkazildi";

    case "in_transit":
      return "Yo‘lda";

    case "cancelled":
      return "Bekor qilingan";

    default:
      return "Ochiq";
  }
}

function formatDate(date: string | null) {
  if (!date) return "Yangi";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function StatsCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
      <div className="text-lg font-black text-emerald-300">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-slate-500">
        {label}
      </div>
    </div>
  );
}