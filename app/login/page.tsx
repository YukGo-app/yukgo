"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedEmail, setFocusedEmail] = useState(false);
  const [focusedPassword, setFocusedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const isValid = isValidEmail && normalizedPassword.length >= 6;

  const handleContinue = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error || !data.session) {
      setLoading(false);
      setMessage("Email yoki parol noto‘g‘ri. Qayta tekshirib ko‘ring.");
      return;
    }

    router.replace("/home");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden flex flex-col">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-32 w-[460px] h-[460px] rounded-full bg-emerald-500/20 blur-[130px] animate-float-slow" />
        <div className="absolute top-1/2 -right-32 w-[420px] h-[420px] rounded-full bg-cyan-500/15 blur-[130px] animate-float-slower" />
        <div className="absolute -bottom-32 left-1/4 w-[380px] h-[380px] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,.6) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div
        className="relative z-10 px-6 pt-3 flex items-center justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[10.5px] text-emerald-300/90 font-medium tracking-wide">
            YukGo tarmog‘i
          </span>
        </div>

        <button
          type="button"
          className="text-[11px] text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
        >
          🇺🇿 O‘zbekcha
        </button>
      </div>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 blur-xl animate-pulse-soft" />
            <div className="relative w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)]">
              <div className="absolute inset-[2px] rounded-[22px] bg-gradient-to-br from-emerald-500/90 to-cyan-600/90 flex items-center justify-center">
                <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M5 11l11-5 11 5v10l-11 5-11-5V11z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 11l11 5 11-5M16 16v10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="22" cy="8" r="2" fill="#fff" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-black tracking-tight bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-transparent">
              YukGo
            </span>
            <span className="text-[11px] font-bold text-emerald-400 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 ml-1">
              UZ
            </span>
          </div>

          <span className="text-[11px] text-white/40 mt-1 tracking-wider uppercase">
            Logistika · Yetkazib berish
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-[26px] font-black tracking-tight text-white leading-tight">
            YukGo'ga kirish
          </h1>
          <p className="text-[14px] text-white/55 mt-2 leading-relaxed">
            Email va parol orqali davom eting
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-px rounded-[28px] bg-gradient-to-b from-emerald-500/20 via-white/5 to-cyan-500/20 opacity-60 blur-sm" />

          <div className="relative rounded-[28px] bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] backdrop-blur-2xl p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            <label className="block">
              <span className="text-[11.5px] font-semibold text-white/60 uppercase tracking-wider px-1">
                Email
              </span>

              <div className="relative mt-2 group">
                <div
                  className={`absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/50 via-cyan-400/40 to-emerald-500/50 blur transition-opacity duration-500 ${
                    focusedEmail ? "opacity-100" : "opacity-0"
                  }`}
                />

                <div
                  className={`relative rounded-2xl bg-[#0a0f1c] border transition-colors ${
                    focusedEmail ? "border-emerald-500/50" : "border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 h-[54px]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0"
                    >
                      <path
                        d="M4 6h16v12H4zM4 6l8 7 8-7"
                        stroke={focusedEmail ? "#34d399" : "#ffffff80"}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onFocus={() => setFocusedEmail(true)}
                      onBlur={() => setFocusedEmail(false)}
                      placeholder="email@example.com"
                      className="flex-1 bg-transparent text-[15px] placeholder:text-white/25 outline-none font-medium"
                      autoComplete="email"
                      inputMode="email"
                    />

                    {isValidEmail && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="#34d399"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </label>

            <label className="block mt-4">
              <span className="text-[11.5px] font-semibold text-white/60 uppercase tracking-wider px-1">
                Parol
              </span>

              <div className="relative mt-2 group">
                <div
                  className={`absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/50 via-cyan-400/40 to-emerald-500/50 blur transition-opacity duration-500 ${
                    focusedPassword ? "opacity-100" : "opacity-0"
                  }`}
                />

                <div
                  className={`relative rounded-2xl bg-[#0a0f1c] border transition-colors ${
                    focusedPassword
                      ? "border-emerald-500/50"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 h-[54px]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="10"
                        rx="2"
                        stroke={focusedPassword ? "#34d399" : "#ffffff80"}
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7a4 4 0 118 0v3"
                        stroke={focusedPassword ? "#34d399" : "#ffffff80"}
                        strokeWidth="1.8"
                      />
                    </svg>

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onFocus={() => setFocusedPassword(true)}
                      onBlur={() => setFocusedPassword(false)}
                      placeholder="Parolingizni kiriting"
                      className="flex-1 bg-transparent text-[15px] placeholder:text-white/25 outline-none font-medium"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-white/45 hover:text-white/80 transition-colors text-sm font-bold"
                    >
                      {showPassword ? "Yashir" : "Ko‘rsat"}
                    </button>
                  </div>
                </div>
              </div>
            </label>

            {message && (
              <div className="mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-[13px] text-rose-100 font-medium">
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={!isValid || loading}
              className="relative w-full mt-4 group active:scale-[0.99] transition-transform disabled:active:scale-100"
            >
              <div
                className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 blur-md transition-opacity ${
                  isValid && !loading ? "opacity-70 animate-gradient-x" : "opacity-0"
                }`}
              />

              <div
                className={`relative h-[54px] rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  isValid && !loading
                    ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)]"
                    : "bg-white/[0.04] border border-white/10"
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-emerald-950/30 border-t-emerald-950 animate-spin" />
                    <span className="text-[15px] font-bold text-emerald-950">
                      Tekshirilmoqda...
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={`text-[15px] font-black ${
                        isValid ? "text-emerald-950" : "text-white/40"
                      }`}
                    >
                      Kirish
                    </span>

                    {isValid && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="group-hover:translate-x-1 transition-transform"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          stroke="#022c22"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </>
                )}
              </div>
            </button>

            <div className="mt-5 pt-4 border-t border-white/5 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l8 4v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4z"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="text-[12px] text-white/45 leading-relaxed">
                YukGo hisobingiz email orqali yaratiladi. Pasport, KYC
                yoki hujjat rasmi so‘ralmaydi.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[13px] text-white/45">
            Hisobingiz yo‘qmi?{" "}
            <Link
              href="/register"
              className="text-emerald-300 font-bold hover:text-emerald-200"
            >
              Ro‘yxatdan o‘tish
            </Link>
          </p>
        </div>
      </main>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-soft {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(24px) translateX(16px);
          }
        }

        @keyframes float-slower {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(-18px);
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }

        .animate-pulse-soft {
          animation: pulse-soft 4s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 13s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}