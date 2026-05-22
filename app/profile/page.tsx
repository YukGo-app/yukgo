"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  rating: number | null;
  is_online: boolean | null;
};

type ShipmentRow = {
  id: number;
  from_city: string | null;
  to_city: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState("");
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAllShipments, setShowAllShipments] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        const metadataName =
          typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : "";

        if (mounted) {
          setEmail(user.email || "");
        }

        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, rating, is_online")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile load error:", profileError.message);
        }

        if (!existingProfile) {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              full_name: metadataName || user.email || "YukGo foydalanuvchisi",
              is_online: true,
            })
            .select("id, full_name, phone, rating, is_online")
            .single();

          if (insertError) {
            console.error("Profile insert error:", insertError.message);
          }

          if (mounted) {
            setProfile(newProfile || null);
          }
        } else {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ is_online: true })
            .eq("id", user.id);

          if (updateError) {
            console.error("Profile online update error:", updateError.message);
          }

          if (mounted) {
            setProfile({ ...existingProfile, is_online: true });
          }
        }

        const { data: shipmentData, error: shipmentError } = await supabase
          .from("shipments")
          .select("id, from_city, to_city, description, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (shipmentError) {
          console.error("Profile shipments error:", shipmentError.message);
        }

        if (mounted) {
          setShipments((shipmentData || []) as ShipmentRow[]);
        }
      } catch (error) {
        console.error("Profile page error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  const displayName = profile?.full_name || email || "YukGo foydalanuvchisi";

  const avatarLetter = useMemo(
    () => displayName.trim().charAt(0).toUpperCase() || "Y",
    [displayName]
  );

  const visibleShipments = showAllShipments ? shipments : shipments.slice(0, 2);
  const hiddenShipmentCount = Math.max(shipments.length - 2, 0);

  const activeCount = shipments.filter((item) =>
    ["open", "in_transit"].includes(item.status || "")
  ).length;

  const completedCount = shipments.filter(
    (item) => item.status === "completed"
  ).length;

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-md px-5 py-5 pb-28">
        <header className="mb-4">
          <p className="text-xs font-semibold text-emerald-300/80">Profil</p>
          <h1 className="text-2xl font-black tracking-tight">Hisobim</h1>
        </header>

        <section className="rounded-[1.6rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/14 to-cyan-400/8 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-emerald-400 to-cyan-400 text-2xl font-black text-[#03120d]">
              {avatarLetter}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-xl font-black">
                  {loading ? "Yuklanmoqda..." : displayName}
                </h2>

                <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  OTP
                </span>
              </div>

              <p className="mt-1 truncate text-xs text-slate-400">
                {profile?.phone || email || "email/telefon"}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                online
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat
              value={loading ? "..." : String(profile?.rating || "5.0")}
              label="reyting"
            />
            <MiniStat value={loading ? "..." : String(activeCount)} label="faol yuk" />
            <MiniStat
              value={loading ? "..." : String(completedCount)}
              label="yakunlangan"
            />
          </div>
        </section>

        <section className="mt-4 rounded-[1.4rem] border border-emerald-400/15 bg-emerald-400/5 p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-sm">
              🛡️
            </div>

            <div>
              <h3 className="text-sm font-black">Xavfsiz profil</h3>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Telefon yoki email orqali tasdiqlash yetarli. Pasport, selfie
                yoki hujjat rasmi so‘ralmaydi.
              </p>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => router.push("/support")}
          className="mt-4 w-full overflow-hidden rounded-[1.55rem] border border-cyan-300/15 bg-gradient-to-br from-white/[0.07] via-cyan-400/[0.06] to-emerald-400/[0.08] p-4 text-left shadow-[0_24px_70px_rgba(16,185,129,0.08)] transition active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-cyan-200/80">
                YukGo yordam markazi
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-white">
                Yordam markazi
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                Reklama, sabit joy, a’zolik, hamkorlik yoki texnik yordam
                bo‘yicha murojaat yuboring.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <SupportChip label="Sponsorli reklama" />
                <SupportChip label="Sabit reklama" />
                <SupportChip label="A’zolik" />
                <SupportChip label="Shikoyat" />
              </div>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-lg">
              💬
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-400/15 bg-emerald-400/8 px-3.5 py-3">
            <span className="text-sm font-black text-emerald-200">
              Murojaat yuborish va javoblarni ko‘rish
            </span>

            <span className="text-sm font-black text-emerald-300">→</span>
          </div>
        </button>

        <section className="mt-4 rounded-[1.55rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-base">
              ⚖️
            </div>

            <div>
              <h2 className="text-base font-black text-white">
                Huquqiy va xavfsizlik
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ilova do‘konlari talablari uchun maxfiylik, foydalanish
                shartlari va hisobni o‘chirish bo‘limlari.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <ProfileLink
              icon="🔐"
              title="Maxfiylik siyosati"
              desc="Ma’lumotlaringiz qanday ishlatilishini ko‘ring"
              onClick={() => router.push("/privacy")}
            />

            <ProfileLink
              icon="📄"
              title="Foydalanish shartlari"
              desc="YukGo qoidalari va xizmat shartlari"
              onClick={() => router.push("/terms")}
            />

            <ProfileLink
              icon="🧾"
              title="Hisobni o‘chirish"
              desc="Hisob va shaxsiy ma’lumotlarni o‘chirish so‘rovi"
              onClick={() => router.push("/delete-account")}
              danger
            />
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Mening yuklarim</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Oxirgi joylangan yuklar
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/jobs")}
              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black text-emerald-300 active:scale-95"
            >
              Hammasi
            </button>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <>
                <ShipmentSkeleton />
                <ShipmentSkeleton />
              </>
            ) : shipments.length === 0 ? (
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <h3 className="text-sm font-black text-white">
                  Hozircha yuk yo‘q
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  Birinchi yukni joylang, tashuvchilar sizga yozadi.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/create")}
                  className="mt-4 h-11 w-full rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d]"
                >
                  Yuk joylash
                </button>
              </div>
            ) : (
              <>
                {visibleShipments.map((shipment) => (
                  <button
                    key={shipment.id}
                    type="button"
                    onClick={() => router.push(`/shipments/${shipment.id}`)}
                    className="w-full rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 text-left active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-white">
                          {shipment.from_city || "Boshlanish"} →{" "}
                          {shipment.to_city || "Manzil"}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                          {formatDescription(shipment.description)}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                        {getShipmentStatus(shipment.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>#{shipment.id}</span>
                      <span>{formatDate(shipment.created_at)}</span>
                    </div>
                  </button>
                ))}

                {hiddenShipmentCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllShipments((current) => !current)}
                    className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-400/8 py-3 text-sm font-black text-emerald-300 active:scale-[0.99]"
                  >
                    {showAllShipments
                      ? "Kamroq ko‘rsatish"
                      : `Yana ${hiddenShipmentCount} ta yukni ko‘rsatish`}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </section>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 w-full rounded-2xl border border-red-400/20 bg-red-500/5 py-3.5 text-sm font-bold text-red-300 transition active:scale-[0.99] disabled:opacity-60"
        >
          {loggingOut ? "Chiqilmoqda..." : "Chiqish"}
        </button>

        <footer className="mt-5 text-center text-[11px] text-slate-600">
          YukGo v1.0 · O‘zbekistonda yaratilgan
        </footer>
      </section>

      <BottomNavbar />
    </main>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 text-center">
      <div className="text-lg font-black text-emerald-300">{value}</div>
      <div className="mt-0.5 text-[10.5px] text-slate-500">{label}</div>
    </div>
  );
}

function SupportChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-[10px] font-bold text-slate-300">
      {label}
    </span>
  );
}

function ProfileLink({
  icon,
  title,
  desc,
  onClick,
  danger = false,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
        danger
          ? "border-red-400/15 bg-red-500/[0.045]"
          : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm ${
          danger
            ? "border-red-300/15 bg-red-400/10"
            : "border-emerald-300/15 bg-emerald-400/10"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={`truncate text-sm font-black ${
            danger ? "text-red-200" : "text-white"
          }`}
        >
          {title}
        </h3>

        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
          {desc}
        </p>
      </div>

      <span
        className={`shrink-0 text-sm font-black ${
          danger ? "text-red-300" : "text-emerald-300"
        }`}
      >
        →
      </span>
    </button>
  );
}

function ShipmentSkeleton() {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5">
      <div className="h-4 w-44 animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-white/10" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

function formatDescription(description: string | null) {
  if (!description) return "Yuk tafsilotlari kiritilmagan.";

  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" · ");
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

function getShipmentStatus(status: string | null) {
  if (status === "in_transit") return "Yo‘lda";
  if (status === "completed") return "Yetkazildi";
  if (status === "cancelled") return "Bekor";

  return "Ochiq";
}