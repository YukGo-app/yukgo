"use client";

import { useState } from "react";

const accountTypes = [
  {
    id: "sender",
    icon: "📦",
    title: "Yuk yuboruvchi",
    desc: "Paket, hujjat yoki kichik yuk yuborish uchun.",
    bullets: ["Tashuvchi topish", "Taklif olish", "OTP bilan topshirish"],
  },
  {
    id: "carrier",
    icon: "🚗",
    title: "Tashuvchi",
    desc: "Yo‘lga chiqqanda yuk olib daromad qilish uchun.",
    bullets: ["Yo‘nalish ochish", "Taklif berish", "Reyting yig‘ish"],
  },
  {
    id: "both",
    icon: "🔁",
    title: "Ikkalasi ham",
    desc: "Ham yuk yuborish, ham tashuvchi sifatida ishlash.",
    bullets: ["Bitta hisob", "Ikki rol", "Tez almashish"],
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState("sender");

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,.7) 1px,transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-white/80">
            ←
          </button>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Hisob sozlash
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-2xl shadow-emerald-500/30">
              <span className="text-3xl">🚚</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight">
              YukGo’dan qanday foydalanasiz?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Bitta hisob bilan yuk yuborishingiz yoki tashuvchi sifatida
              ishlashingiz mumkin.
            </p>
          </div>

          <div className="space-y-3">
            {accountTypes.map((type) => {
              const active = selected === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  className={`w-full rounded-[1.6rem] border p-4 text-left transition active:scale-[0.99] ${
                    active
                      ? "border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,.15)]"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                        active
                          ? "bg-emerald-400/15"
                          : "bg-white/[0.05]"
                      }`}
                    >
                      {type.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-black">{type.title}</h2>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            active
                              ? "border-emerald-400 bg-emerald-400 text-[#03120d]"
                              : "border-white/20"
                          }`}
                        >
                          {active ? "✓" : ""}
                        </div>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {type.desc}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {type.bullets.map((item) => (
                          <span
                            key={item}
                            className={`rounded-full border px-2.5 py-1 text-[11px] ${
                              active
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                                : "border-white/10 bg-white/[0.03] text-slate-500"
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-3xl border border-emerald-400/15 bg-emerald-400/5 p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                🛡️
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Rolni keyin profil sozlamalarida o‘zgartirish mumkin. Pasport
                yoki hujjat rasmi so‘ralmaydi.
              </p>
            </div>
          </div>
        </div>

        <div className="pb-[env(safe-area-inset-bottom)]">
          <button className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-black text-[#03120d] shadow-2xl shadow-emerald-500/30 active:scale-[0.99]">
            Davom etish →
          </button>

          <button className="mt-3 w-full text-center text-sm font-semibold text-slate-500">
            Keyinroq tanlayman
          </button>
        </div>
      </section>
    </main>
  );
}