"use client";

import { useMemo, useState } from "react";

export default function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const value = code.join("");
  const isReady = value.length === 6;

  const maskedTarget = useMemo(() => "+998 90 *** ** 67", []);

  function changeDigit(index: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      const el = document.getElementById(`otp-${index + 1}`);
      el?.focus();
    }
  }

  function backspace(index: number) {
    if (code[index]) return;

    if (index > 0) {
      const el = document.getElementById(`otp-${index - 1}`);
      el?.focus();
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
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
            Xavfsiz kirish
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-2xl shadow-emerald-500/30">
              <span className="text-3xl">🔐</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight">
              Tasdiqlash kodi
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Kod yuborildi:{" "}
              <span className="font-semibold text-white">{maskedTarget}</span>
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              6 xonali kod
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  value={digit}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(e) => changeDigit(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") backspace(index);
                  }}
                  className="h-12 rounded-2xl border border-white/10 bg-[#0b1020] text-center text-xl font-black outline-none transition focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(16,185,129,.25)] sm:h-14"
                />
              ))}
            </div>

            <button
              disabled={!isReady}
              className={`mt-5 h-14 w-full rounded-2xl text-base font-black transition ${
                isReady
                  ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-[#03120d] shadow-2xl shadow-emerald-500/30"
                  : "border border-white/10 bg-white/[0.05] text-white/50"
              }`}
            >
              Tasdiqlash
            </button>

            <div className="mt-5 flex items-center justify-between text-sm">
              <button className="text-slate-400">Kodni olmadim</button>
              <button className="font-semibold text-emerald-300">
                Qayta yuborish
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-emerald-400/15 bg-emerald-400/5 p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                🛡️
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Kod faqat sizning hisobingizni himoya qilish uchun ishlatiladi.
                Pasport yoki hujjat rasmi so‘ralmaydi.
              </p>
            </div>
          </div>
        </div>

        <footer className="pb-[env(safe-area-inset-bottom)] text-center text-xs text-slate-600">
          YukGo · Xavfsiz tasdiqlash
        </footer>
      </section>
    </main>
  );
}