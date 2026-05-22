"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type SpeedType = {
  id: string;
  label: string;
  desc: string;
  icon: string;
};

const speedOptions: SpeedType[] = [
  { id: "oddiy", label: "Oddiy", desc: "1-3 kun", icon: "🚚" },
  { id: "tez", label: "Tez", desc: "24 soat", icon: "⚡" },
  { id: "bugun", label: "Bugun", desc: "4-8 soat", icon: "🔥" },
  { id: "moto", label: "Moto", desc: "1-2 soat", icon: "🏍️" },
];

const recentAddresses = [
  "Toshkent, Yunusobod",
  "Samarqand, Registon",
  "Andijon, Asaka",
  "Buxoro, Markaz",
];

export default function CreateListingPage() {
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(3);
  const [dimension, setDimension] = useState(30);
  const [selectedSpeed, setSelectedSpeed] = useState("tez");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

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

  const handleCreateShipment = async () => {
    if (isSubmitting) return;

    const cleanPickup = pickup.trim();
    const cleanDelivery = delivery.trim();
    const cleanDescription = description.trim();
    const cleanNote = note.trim();

    if (!cleanPickup || !cleanDelivery) {
      setSubmitMessage("Olib ketish va yetkazish manzilini kiriting.");
      return;
    }

    if (cleanDescription.length < 5) {
      setSubmitMessage("Yuk haqida qisqa va tushunarli tavsif yozing.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    const speedLabel =
      speedOptions.find((speed) => speed.id === selectedSpeed)?.label || "Tez";

    const fullDescription = [
      `Yuk: ${cleanDescription}`,
      `Og'irlik: ${weight} kg`,
      `O'lcham: ${dimension}×${Math.round(
        dimension * 0.66
      )}×${Math.round(dimension * 0.5)} cm`,
      `Yetkazish turi: ${speedLabel}`,
      cleanNote ? `Izoh: ${cleanNote}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setSubmitMessage("Avval tizimga kiring.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("shipments").insert({
      user_id: userId,
      from_city: cleanPickup,
      to_city: cleanDelivery,
      description: fullDescription,
      price: 0,
      status: "open",
    });

    if (error) {
      setSubmitMessage("Yuk saqlanmadi. Iltimos, qayta urinib ko‘ring.");
      setIsSubmitting(false);
      return;
    }

    setSubmitMessage("Yuk joylandi. Tashuvchilar sizga xabar yuborishi mumkin.");

    setPickup("");
    setDelivery("");
    setDescription("");
    setNote("");
    setWeight(3);
    setDimension(30);
    setSelectedSpeed("tez");
    setIsSubmitting(false);

    setTimeout(() => {
      router.push("/profile");
    }, 900);
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
        <header className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg font-black active:scale-95"
            aria-label="Orqaga"
          >
            ←
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">Yuk joylash</h1>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              yangi e’lon
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-lg font-black text-emerald-300 active:scale-95"
            aria-label="Profil"
          >
            ☰
          </button>
        </header>

        {submitMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200">
            {submitMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          <Section title="Yo‘nalish" icon="📍">
            <div className="space-y-3">
              <InputBox
                label="Olib ketish manzili"
                value={pickup}
                onChange={setPickup}
                placeholder="Masalan: Andijon, Asaka"
                dotColor="emerald"
                clearable
              />

              <div className="flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent" />
                <span className="text-[11px] font-black text-slate-500">→</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
              </div>

              <InputBox
                label="Yetkazish manzili"
                value={delivery}
                onChange={setDelivery}
                placeholder="Masalan: Toshkent, Chilonzor"
                dotColor="cyan"
              />

              <div className="flex flex-wrap gap-1.5">
                {recentAddresses.map((address) => (
                  <button
                    key={address}
                    type="button"
                    onClick={() => setDelivery(address)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 active:scale-95"
                  >
                    {address}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Yuk haqida" icon="📦">
            <TextBox
              value={description}
              onChange={setDescription}
              maxLength={180}
              placeholder="Masalan: kichik paket, kiyim, hujjat yoki uy buyumi..."
            />
          </Section>

          <Section title="O‘lcham va og‘irlik" icon="⚖️">
            <div className="space-y-4">
              <SliderRow
                label="Og‘irlik"
                value={`${weight} kg`}
                min={0.1}
                max={50}
                step={0.5}
                current={weight}
                onChange={setWeight}
              />

              <SliderRow
                label="O‘lcham"
                value={`${dimension}×${Math.round(
                  dimension * 0.66
                )}×${Math.round(dimension * 0.5)} cm`}
                min={5}
                max={120}
                step={1}
                current={dimension}
                onChange={setDimension}
              />
            </div>
          </Section>

          <Section title="Yetkazish turi" icon="⚡">
            <div className="grid grid-cols-4 gap-1.5">
              {speedOptions.map((speed) => {
                const active = selectedSpeed === speed.id;

                return (
                  <button
                    key={speed.id}
                    type="button"
                    onClick={() => setSelectedSpeed(speed.id)}
                    className={`min-h-[72px] rounded-2xl border px-1.5 py-2 text-center transition active:scale-95 ${
                      active
                        ? "border-emerald-400/40 bg-emerald-400 text-[#03120d]"
                        : "border-white/10 bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    <div className="text-lg">{speed.icon}</div>
                    <div className="mt-1 truncate text-[11px] font-black">
                      {speed.label}
                    </div>
                    <div
                      className={`mt-0.5 truncate text-[9.5px] font-semibold ${
                        active ? "text-[#03120d]/70" : "text-slate-500"
                      }`}
                    >
                      {speed.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Qo‘shimcha izoh" icon="📝">
            <TextBox
              value={note}
              onChange={setNote}
              maxLength={200}
              placeholder="Masalan: ehtiyotkorlik bilan olib boring..."
            />
          </Section>

          <div className="rounded-[1.6rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/12 to-cyan-400/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  Marketplace
                </div>

                <div className="mt-1 text-sm font-black text-white">
                  {pickup.trim() || "Olib ketish"} →{" "}
                  {delivery.trim() || "Yetkazish"}
                </div>
              </div>

              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold text-slate-300">
                Ochiq
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Yuk joylangandan keyin tashuvchilar sizga suhbat orqali yozadi.
              Narx va vaqt suhbatda kelishiladi.
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
            onClick={handleCreateShipment}
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 text-[#03120d] shadow-[0_14px_40px_rgba(16,185,129,0.28)] active:scale-[0.99] disabled:opacity-70"
          >
            <span>
              <span className="block text-[10px] font-black uppercase tracking-wider opacity-70">
                Yuk e’loni
              </span>
              <span className="block text-base font-black">
                {isSubmitting ? "Joylanmoqda..." : "Yukni joylash"}
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
  clearable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dotColor: "emerald" | "cyan";
  clearable?: boolean;
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

        {clearable && value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-slate-500 active:scale-95"
          >
            ✕
          </button>
        ) : null}
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

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}) {
  const percent = ((current - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-slate-400">{label}</span>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-300">
          {value}
        </span>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
          style={{ width: `${percent}%` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="-mt-2 h-3 w-full cursor-pointer appearance-none bg-transparent"
      />

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, #34d399, #22d3ee);
          border: 3px solid #050816;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.45);
        }

        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, #34d399, #22d3ee);
          border: 3px solid #050816;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.45);
        }
      `}</style>
    </div>
  );
}
