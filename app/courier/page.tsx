"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type CourierShipment = {
  id: number;
  user_id: string;
  from_city: string | null;
  to_city: string | null;
  description: string | null;
  price: number | null;
  status: string | null;
  created_at: string | null;
  delivery_mode: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  courier_speed: string | null;
  item_category: string | null;
  recipient_phone: string | null;
};

const CITY_OPTIONS = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg‘ona",
  "Namangan",
  "Qo‘qon",
  "Nukus",
  "Qarshi",
  "Termiz",
];

const SPEED_OPTIONS = [
  { value: "30_minutes", label: "30 daqiqa ichida" },
  { value: "1_hour", label: "1 soat ichida" },
  { value: "2_hours", label: "2 soat ichida" },
  { value: "today", label: "Bugun ichida" },
];

const CATEGORY_OPTIONS = [
  { value: "documents", label: "Hujjat" },
  { value: "small_package", label: "Kichik posilka" },
  { value: "clothing", label: "Kiyim" },
  { value: "personal", label: "Shaxsiy buyum" },
  { value: "other_safe", label: "Boshqa xavfsiz buyum" },
];

export default function CourierPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [itemCategory, setItemCategory] = useState("small_package");
  const [courierSpeed, setCourierSpeed] = useState("1_hour");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [message, setMessage] = useState("");
  const [courierShipments, setCourierShipments] = useState<CourierShipment[]>([]);

  const loadCourierShipments = useCallback(async () => {
    const { data, error } = await supabase
      .from("shipments")
      .select(
        "id, user_id, from_city, to_city, description, price, status, created_at, delivery_mode, pickup_address, dropoff_address, courier_speed, item_category, recipient_phone"
      )
      .eq("delivery_mode", "city_courier")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Courier shipments load error:", error.message);
      setCourierShipments([]);
    } else {
      setCourierShipments((data || []) as CourierShipment[]);
    }

    setLoadingList(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (mounted) {
        setCurrentUserId(session.user.id);
      }

      await loadCourierShipments();
    };

    init();

    const channel = supabase
      .channel("city-courier-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
        },
        () => {
          loadCourierShipments();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [router, loadCourierShipments]);

  const visibleCourierShipments = useMemo(() => {
    return courierShipments.filter(
      (item) =>
        item.delivery_mode === "city_courier" &&
        item.status === "open"
    );
  }, [courierShipments]);

  const createCourierRequest = async () => {
    setMessage("");

    const cleanPickup = pickupAddress.trim();
    const cleanDropoff = dropoffAddress.trim();
    const cleanDescription = description.trim();
    const cleanPhone = recipientPhone.trim();
    const cleanBudget = Number(budget.replace(/\s/g, ""));

    if (!cleanPickup || cleanPickup.length < 6) {
      setMessage("Olish manzilini aniqroq kiriting.");
      return;
    }

    if (!cleanDropoff || cleanDropoff.length < 6) {
      setMessage("Yetkazish manzilini aniqroq kiriting.");
      return;
    }

    if (!cleanDescription || cleanDescription.length < 4) {
      setMessage("Yuboriladigan buyumni qisqacha yozing.");
      return;
    }

    if (!cleanBudget || cleanBudget < 5000 || cleanBudget > 5000000) {
      setMessage("Byudjetni to‘g‘ri kiriting. Minimal 5 000 so‘m.");
      return;
    }

    if (cleanPhone && cleanPhone.length < 7) {
      setMessage("Qabul qiluvchi telefon raqamini to‘g‘ri kiriting.");
      return;
    }

    const riskyWords = [
      "telefon",
      "iphone",
      "laptop",
      "noutbuk",
      "pul",
      "naqd",
      "oltin",
      "zargarlik",
      "qurol",
      "dori",
      "narkotik",
      "pasport",
    ];

    const riskText = `${cleanDescription} ${cleanPickup} ${cleanDropoff}`.toLowerCase();

    if (riskyWords.some((word) => riskText.includes(word))) {
      setMessage(
        "Bu buyum xavfli yoki yuqori riskli bo‘lishi mumkin. YukGo hozircha hujjat, kiyim, kichik posilka va oddiy shaxsiy buyumlar uchun."
      );
      return;
    }

    setCreating(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const fullDescription = [
      `Rejim: Shahar ichida kurye`,
      `Shahar: ${city}`,
      `Olish manzili: ${cleanPickup}`,
      `Yetkazish manzili: ${cleanDropoff}`,
      `Buyum turi: ${getCategoryLabel(itemCategory)}`,
      `Tezlik: ${getSpeedLabel(courierSpeed)}`,
      `Qabul qiluvchi telefon: ${cleanPhone || "Kiritilmagan"}`,
      `Izoh: ${cleanDescription}`,
    ].join("\n");

    const { data, error } = await supabase
      .from("shipments")
      .insert({
        user_id: session.user.id,
        from_city: city,
        to_city: city,
        description: fullDescription,
        price: cleanBudget,
        status: "open",
        delivery_mode: "city_courier",
        pickup_address: cleanPickup,
        dropoff_address: cleanDropoff,
        courier_speed: courierSpeed,
        item_category: itemCategory,
        recipient_phone: cleanPhone || null,
      })
      .select("id")
      .single();

    if (error) {
      setMessage("Kurye chaqiruvi yaratilmadi. Qayta urinib ko‘ring.");
      setCreating(false);
      return;
    }

    setPickupAddress("");
    setDropoffAddress("");
    setRecipientPhone("");
    setDescription("");
    setBudget("");
    setCreating(false);

    router.push(`/shipments/${data.id}`);
  };

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-md px-5 py-6 pb-28">
        <button
          onClick={() => router.push("/home")}
          className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold active:scale-95"
        >
          ← Orqaga
        </button>

        <div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 p-5">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
            Shahar ichida
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight">
            Kurye chaqirish
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Kichik posilka, hujjat, kiyim yoki oddiy shaxsiy buyum uchun
            shaharingizdagi faol tashuvchilardan taklif oling.
          </p>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-bold leading-6 text-amber-200">
            {message}
          </div>
        ) : null}

        <div className="mt-5 space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div>
            <label className="text-xs font-bold text-slate-400">Shahar</label>

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-emerald-400/40"
            >
              {CITY_OPTIONS.map((item) => (
                <option key={item} value={item} className="bg-[#050816]">
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">
              Olish manzili
            </label>

            <input
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Masalan: Chilonzor 10-kvartal, 24-uy"
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">
              Yetkazish manzili
            </label>

            <input
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="Masalan: Yunusobod, Mega Planet yonida"
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">Buyum turi</label>

            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-emerald-400/40"
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value} className="bg-[#050816]">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">
              Yetkazish tezligi
            </label>

            <select
              value={courierSpeed}
              onChange={(e) => setCourierSpeed(e.target.value)}
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-emerald-400/40"
            >
              {SPEED_OPTIONS.map((item) => (
                <option key={item.value} value={item.value} className="bg-[#050816]">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">
              Qabul qiluvchi telefon
            </label>

            <input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              inputMode="tel"
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">
              Buyum haqida qisqa izoh
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Masalan: kichik hujjat papkasi, ehtiyotkorlik bilan olib borish kerak"
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">
              Taklif qilinadigan byudjet
            </label>

            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              inputMode="numeric"
              placeholder="Masalan: 25000"
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-emerald-400/40"
            />
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
            <h3 className="text-sm font-black text-red-200">
              Yuqori riskli buyumlar qabul qilinmaydi
            </h3>

            <p className="mt-2 text-xs leading-5 text-red-100/80">
              Telefon, laptop, katta naqd pul, zargarlik buyumlari, dori,
              qurol, noqonuniy yoki xavfli mahsulotlar uchun YukGo ishlatilmaydi.
            </p>
          </div>

          <button
            onClick={createCourierRequest}
            disabled={creating}
            className="h-14 w-full rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d] transition active:scale-95 disabled:opacity-60"
          >
            {creating ? "Yaratilmoqda..." : "Kurye chaqirish"}
          </button>
        </div>

        <div className="mt-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Faol kurye chaqiruvlari</h2>

              <p className="mt-1 text-sm text-slate-500">
                Shahar ichidagi tezkor yetkazish ishlari
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              {visibleCourierShipments.length} ta
            </span>
          </div>

          <div className="space-y-3">
            {loadingList ? (
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
                <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-white/10" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
              </div>
            ) : visibleCourierShipments.length === 0 ? (
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 text-center">
                <div className="text-4xl">🏍️</div>

                <h3 className="mt-3 text-lg font-black">
                  Hozircha faol chaqiruv yo‘q
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Shahar ichidagi yangi kurye chaqiruvlari shu yerda ko‘rinadi.
                </p>
              </div>
            ) : (
              visibleCourierShipments.map((item) => {
                const isOwn = item.user_id === currentUserId;

                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/shipments/${item.id}`)}
                    className="w-full rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-2xl transition active:scale-[0.99]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold text-cyan-200">
                          {isOwn ? "Sizning chaqiruvingiz" : "Kurye chaqiruvi"}
                        </span>

                        <h3 className="mt-3 text-base font-black">
                          {item.from_city || "Shahar"} ichida tezkor yetkazish
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-300">
                          {item.price
                            ? `${item.price.toLocaleString("uz-UZ")} so‘m`
                            : "Kelishiladi"}
                        </div>

                        <div className="mt-1 text-[11px] text-slate-500">
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-white/5 bg-black/20 p-3">
                      <InfoLine label="Olish" value={item.pickup_address || "Manzil kiritilmagan"} />
                      <InfoLine label="Yetkazish" value={item.dropoff_address || "Manzil kiritilmagan"} />
                      <InfoLine label="Tezlik" value={getSpeedLabel(item.courier_speed || "")} />
                      <InfoLine label="Buyum" value={getCategoryLabel(item.item_category || "")} />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        city courier live
                      </div>

                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
                        {isOwn ? "Boshqarish" : "Taklif berish"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      <BottomNavbar />
    </main>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm leading-6">
      <span className="w-20 shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 text-slate-300">{value}</span>
    </div>
  );
}

function getSpeedLabel(value: string) {
  return SPEED_OPTIONS.find((item) => item.value === value)?.label || "Kelishiladi";
}

function getCategoryLabel(value: string) {
  return CATEGORY_OPTIONS.find((item) => item.value === value)?.label || "Kichik posilka";
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