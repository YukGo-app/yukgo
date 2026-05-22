"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type RouteDurationOption = {
  id: string;
  label: string;
  desc: string;
  hours: number;
};

const routeDurationOptions: RouteDurationOption[] = [
  { id: "1h", label: "1 soat", desc: "Tez chiqaman", hours: 1 },
  { id: "6h", label: "6 soat", desc: "Bugun ichida", hours: 6 },
  { id: "24h", label: "24 soat", desc: "1 kun faol", hours: 24 },
  { id: "72h", label: "3 kun", desc: "Maksimal", hours: 72 },
];

export default function DriverRoutePage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [vehicleType, setVehicleType] = useState("Yengil avtomobil");
  const [capacityNote, setCapacityNote] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("24h");

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setAuthChecking(false);
    };

    checkAuth();
  }, [router]);

  const handleCreateRoute = async () => {
    setErrorText("");
    setSuccessText("");

    if (
      !fromCity.trim() ||
      !toCity.trim() ||
      !departureTime.trim() ||
      !capacityNote.trim()
    ) {
      setErrorText("Barcha maydonlarni to‘ldiring.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const duration =
        routeDurationOptions.find((item) => item.id === selectedDuration) ||
        routeDurationOptions[2];

      const expiresAt = new Date(
        Date.now() + duration.hours * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase.from("driver_routes").insert({
        user_id: session.user.id,
        from_location: fromCity.trim(),
        to_location: toCity.trim(),
        departure_time: departureTime.trim(),
        vehicle_type: vehicleType,
        capacity: capacityNote.trim(),
        status: "active",
        expires_at: expiresAt,
        is_premium: false,
      });

      if (error) {
        console.error(error);
        setErrorText("Yo‘nalishni yaratib bo‘lmadi.");
        return;
      }

      setSuccessText("Yo‘nalish yaratildi.");

      setFromCity("");
      setToCity("");
      setDepartureTime("");
      setCapacityNote("");
      setSelectedDuration("24h");

      setTimeout(() => {
        router.push("/routes");
      }, 900);
    } catch (error) {
      console.error(error);
      setErrorText("Kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-emerald-300">
          Yuklanmoqda...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-md px-5 py-6 pb-44">
        <header className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/routes")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg font-black active:scale-95"
            aria-label="Orqaga"
          >
            ←
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">
              Yo‘l ochish
            </h1>

            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              tashuvchi yo‘nalishi
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/home")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-lg font-black text-emerald-300 active:scale-95"
            aria-label="Marketplace"
          >
            ☰
          </button>
        </header>

        {errorText ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
            {errorText}
          </div>
        ) : null}

        {successText ? (
          <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
            {successText}
          </div>
        ) : null}

        <div className="space-y-4">
          <Section title="Yo‘nalish" icon="📍">
            <div className="space-y-3">
              <InputBox
                label="Qayerdan"
                value={fromCity}
                onChange={setFromCity}
                placeholder="Masalan: Toshkent"
                dotColor="emerald"
              />

              <div className="flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent" />
                <span className="text-[11px] font-black text-slate-500">→</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
              </div>

              <InputBox
                label="Qayerga"
                value={toCity}
                onChange={setToCity}
                placeholder="Masalan: Samarqand"
                dotColor="cyan"
              />
            </div>
          </Section>

          <Section title="Vaqt va transport" icon="🚗">
            <div className="space-y-3">
              <InputBox
                label="Jo‘nab ketish vaqti"
                value={departureTime}
                onChange={setDepartureTime}
                placeholder="Bugun 18:00"
                dotColor="emerald"
              />

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Transport turi
                </span>

                <select
                  value={vehicleType}
                  onChange={(event) => setVehicleType(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white outline-none focus:border-emerald-400/40"
                >
                  <option value="Yengil avtomobil">Yengil avtomobil</option>
                  <option value="Moto kurye">Moto kurye</option>
                  <option value="Minivan">Minivan</option>
                  <option value="Yuk mashinasi">Yuk mashinasi</option>
                </select>
              </label>
            </div>
          </Section>

          <Section title="Faollik muddati" icon="⏱️">
            <div className="grid grid-cols-4 gap-1.5">
              {routeDurationOptions.map((option) => {
                const active = selectedDuration === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedDuration(option.id)}
                    className={`min-h-[68px] rounded-2xl border px-1.5 py-2 text-center transition active:scale-95 ${
                      active
                        ? "border-emerald-400/40 bg-emerald-400 text-[#03120d]"
                        : "border-white/10 bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    <div className="truncate text-[12px] font-black">
                      {option.label}
                    </div>

                    <div
                      className={`mt-1 line-clamp-2 text-[9.5px] font-semibold leading-3 ${
                        active ? "text-[#03120d]/70" : "text-slate-500"
                      }`}
                    >
                      {option.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Bo‘sh joy" icon="📦">
            <TextBox
              value={capacityNote}
              onChange={setCapacityNote}
              maxLength={160}
              placeholder="Masalan: 2 ta kichik quti yoki 15 kg gacha"
            />
          </Section>

          <div className="rounded-[1.6rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/12 to-emerald-400/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                  Marketplace
                </div>

                <div className="mt-1 text-sm font-black text-white">
                  {fromCity.trim() || "Qayerdan"} →{" "}
                  {toCity.trim() || "Qayerga"}
                </div>
              </div>

              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold text-slate-300">
                Faol
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Yo‘nalish ochilgandan keyin shu tomonga yuk yubormoqchi bo‘lgan
              foydalanuvchilar sizni ko‘radi.
            </p>
          </div>
        </div>
      </section>

      <div
        className="fixed left-0 right-0 z-40 px-5"
        style={{ bottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={handleCreateRoute}
            disabled={loading}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 text-[#03120d] shadow-[0_14px_40px_rgba(16,185,129,0.28)] active:scale-[0.99] disabled:opacity-70"
          >
            <span>
              <span className="block text-[10px] font-black uppercase tracking-wider opacity-70">
                Tashuvchi yo‘li
              </span>

              <span className="block text-base font-black">
                {loading ? "Yaratilmoqda..." : "Yo‘nalishni ochish"}
              </span>
            </span>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03120d]/15 text-xl font-black">
              →
            </span>
          </button>
        </div>
      </div>

      <BottomNavbar />
    </main>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <h2 className="text-[15px] font-black text-white">{title}</h2>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
        {children}
      </div>
    </section>
  );
}

function InputBox({
  label,
  value,
  onChange,
  placeholder,
  dotColor,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dotColor: "emerald" | "cyan";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 focus-within:border-emerald-400/40">
        <span
          className={`h-3 w-3 shrink-0 rounded-full ${
            dotColor === "emerald"
              ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,.7)]"
              : "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.7)]"
          }`}
        />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
        />
      </div>
    </label>
  );
}

function TextBox({
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={2}
        placeholder={placeholder}
        className="min-h-[92px] w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/40"
      />

      <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-600">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}
