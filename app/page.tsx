"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [activityIndex, setActivityIndex] = useState(0);
  const [onlineDrivers, setOnlineDrivers] = useState(184);
  const [activeRoutes, setActiveRoutes] = useState(127);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [cargoType, setCargoType] = useState("Kichik paket");
  const [cargoOpen, setCargoOpen] = useState(false);

  const activities = useMemo(
    () => [
      { icon: "📦", text: "Yangi yuk e’loni joylandi", time: "hozirgina", tone: "emerald" },
      { icon: "🛣️", text: "Toshkent → Farg‘ona yo‘nalishida yangi joy ochildi", time: "1 daq oldin", tone: "cyan" },
      { icon: "✅", text: "Yetkazish kelishuvi muvaffaqiyatli yakunlandi", time: "2 daq oldin", tone: "emerald" },
      { icon: "🚗", text: "Yangi tashuvchi yo‘nalish qo‘shdi", time: "3 daq oldin", tone: "amber" },
      { icon: "📨", text: "Asaka → Toshkent yo‘nalishida yangi taklif keldi", time: "4 daq oldin", tone: "cyan" },
      { icon: "🛵", text: "Chilonzor ichida tezkor yetkazish so‘rovi ochildi", time: "5 daq oldin", tone: "emerald" },
    ],
    []
  );

  const places = useMemo(
    () => [
      { city: "Toshkent", area: "Chilonzor" },
      { city: "Toshkent", area: "Yunusobod" },
      { city: "Toshkent", area: "Sergeli" },
      { city: "Toshkent", area: "Mirzo Ulug‘bek" },
      { city: "Andijon", area: "Asaka tumani" },
      { city: "Farg‘ona", area: "Qo‘qon" },
      { city: "Farg‘ona", area: "Marg‘ilon" },
      { city: "Farg‘ona", area: "Rishton" },
      { city: "Namangan", area: "Chust" },
      { city: "Samarqand", area: "Urgut" },
      { city: "Buxoro", area: "G‘ijduvon" },
      { city: "Xorazm", area: "Xiva" },
      { city: "Qoraqalpog‘iston", area: "Nukus" },
      { city: "Qoraqalpog‘iston", area: "Qo‘ng‘irot" },
      { city: "Surxondaryo", area: "Denov" },
      { city: "Surxondaryo", area: "Termiz" },
      { city: "Qashqadaryo", area: "Qarshi" },
      { city: "Navoiy", area: "Markaz" },
      { city: "Jizzax", area: "Markaz" },
      { city: "Sirdaryo", area: "Guliston" },
    ],
    []
  );

  const cargoOptions = [
    "Kichik paket",
    "Kiyim-kechak",
    "Hujjat nusxasi",
    "Oziq-ovqat",
    "Shaxsiy buyum",
    "Ehtiyot qismlar",
    "Sovg‘a",
    "Kosmetika",
  ];

  const cities: { name: string; x: number; y: number; size: "sm" | "md" | "lg"; mobileLabel: boolean }[] = [
    { name: "Nukus", x: 14, y: 28, size: "md", mobileLabel: true },
    { name: "Xiva", x: 19, y: 46, size: "sm", mobileLabel: false },
    { name: "Buxoro", x: 32, y: 60, size: "md", mobileLabel: true },
    { name: "Qarshi", x: 48, y: 74, size: "sm", mobileLabel: false },
    { name: "Samarqand", x: 52, y: 60, size: "lg", mobileLabel: true },
    { name: "Toshkent", x: 70, y: 38, size: "lg", mobileLabel: true },
    { name: "Qo‘qon", x: 78, y: 50, size: "sm", mobileLabel: false },
    { name: "Namangan", x: 82, y: 44, size: "md", mobileLabel: true },
    { name: "Farg‘ona", x: 86, y: 53, size: "md", mobileLabel: true },
    { name: "Andijon", x: 90, y: 49, size: "md", mobileLabel: true },
    { name: "Asaka", x: 88, y: 55, size: "sm", mobileLabel: false },
  ];

  const routes = [
    [5, 8],
    [5, 9],
    [5, 7],
    [5, 4],
    [4, 2],
    [2, 1],
    [1, 0],
    [8, 6],
    [9, 10],
    [4, 3],
  ];

  const floatingRoutes: {
    tone: "emerald" | "amber" | "cyan" | "violet";
    status: string;
    when: string;
    from: string;
    to: string;
    vehicle: string;
    detail: string;
  }[] = [
    { tone: "emerald", status: "Bo‘sh joy bor", when: "Bugun 18:30", from: "Toshkent", to: "Farg‘ona", vehicle: "🚗 Damas", detail: "3 paket joyi bor" },
    { tone: "amber", status: "Yaqinda jo‘naydi", when: "Ertaga 07:00", from: "Andijon, Asaka", to: "Toshkent", vehicle: "🚙 Yengil avto", detail: "8 kg bo‘sh joy" },
    { tone: "cyan", status: "Bugun kechqurun", when: "21:00", from: "Namangan", to: "Samarqand", vehicle: "🚐 Minivan", detail: "Kichik yuk" },
    { tone: "violet", status: "Shahar ichida", when: "35 daq", from: "Chilonzor", to: "Yunusobod", vehicle: "🛵 Moto kuryer", detail: "Tezkor yetkazib" },
  ];

  useEffect(() => {
    const t1 = setInterval(() => {
      setActivityIndex((p) => (p + 1) % activities.length);
    }, 2400);

    const t2 = setInterval(() => {
      setOnlineDrivers((p) => Math.max(150, p + Math.floor(Math.random() * 5) - 2));
      setActiveRoutes((p) => Math.max(100, p + Math.floor(Math.random() * 3) - 1));
    }, 3200);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [activities.length]);

  const filteredFrom = places
    .filter((p) => !fromValue || `${p.city} ${p.area}`.toLowerCase().includes(fromValue.toLowerCase()))
    .slice(0, 6);

  const filteredTo = places
    .filter((p) => !toValue || `${p.city} ${p.area}`.toLowerCase().includes(toValue.toLowerCase()))
    .slice(0, 6);

  const goCreate = () => router.push("/create");
  const goDriverRoute = () => router.push("/driver-route");
  const goRoutes = () => router.push("/routes");
  const goJobs = () => router.push("/jobs");
  const goSupport = () => router.push("/support");

  return (
    <div className="min-h-screen bg-[#04060d] text-white overflow-x-hidden relative pb-[96px] md:pb-0">
      <style jsx global>{`
        @keyframes pulseRing {
          0% { transform: scale(0.7); opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) translateX(0); }
          50% { transform: translateY(-6px) translateX(4px); }
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -60; }
        }
        @keyframes glowBreath {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        html {
          scroll-behavior: smooth;
        }
        .animate-floatA { animation: floatA 6s ease-in-out infinite; }
        .animate-floatB { animation: floatB 5s ease-in-out infinite; }
        .animate-glow { animation: glowBreath 3.2s ease-in-out infinite; }
        .glass {
          background: linear-gradient(180deg, rgba(20, 28, 48, 0.55), rgba(10, 14, 28, 0.55));
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .glass-strong {
          background: linear-gradient(180deg, rgba(14, 22, 40, 0.78), rgba(8, 12, 24, 0.78));
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(16,185,129,0.14);
        }
        .glass-bottom {
          background: linear-gradient(180deg, rgba(10, 14, 28, 0.65), rgba(4, 6, 13, 0.85));
          backdrop-filter: blur(28px) saturate(140%);
          -webkit-backdrop-filter: blur(28px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .glow-emerald {
          box-shadow: 0 0 50px rgba(16,185,129,0.18), 0 0 100px rgba(16,185,129,0.08);
        }
        .text-balance { text-wrap: balance; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .snap-x-mandatory { scroll-snap-type: x mandatory; }
        .snap-start { scroll-snap-align: start; }
        input, select, button { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 767px) {
          h1, h2 { letter-spacing: -0.02em; }
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none -z-0">
        <div className="absolute -top-20 left-1/4 w-[520px] h-[520px] bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-20 w-[420px] h-[420px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-emerald-700/10 rounded-full blur-[140px]" />
      </div>

      <div className="fixed inset-0 grid-bg pointer-events-none opacity-40 -z-0" />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#04060d]/75 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2.5 shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 flex items-center justify-center font-black text-[#04060d] text-base shadow-lg shadow-emerald-500/30">
                Y
              </div>
              <div className="absolute -inset-1 bg-emerald-500/30 rounded-xl blur-md -z-10" />
            </div>

            <span className="text-lg font-bold tracking-tight">
              Yuk<span className="text-emerald-400">Go</span>
            </span>

            <span className="hidden sm:inline-flex ml-1 text-[10px] uppercase tracking-wider text-emerald-300/80 bg-emerald-500/10 border border-emerald-400/15 px-1.5 py-0.5 rounded">
              UZ
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm text-slate-300">
            <a href="#yuborish" className="hover:text-emerald-400 transition flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400" /> Yuk yuborish
            </a>
            <a href="#tashuvchilar" className="hover:text-emerald-400 transition">Yo‘lga chiqyapman</a>
            <a href="#yonalishlar" className="hover:text-emerald-400 transition">Yo‘nalishlar</a>
            <a href="#xavfsizlik" className="hover:text-emerald-400 transition">Xavfsizlik</a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-[11px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-emerald-300">{onlineDrivers} tashuvchi</span>
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#04060d] font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/30 transition active:scale-95"
            >
              Kirish
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 text-xs text-slate-300">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 font-semibold tracking-wide whitespace-nowrap">
            🎁 AKSIYA
          </span>
          <span className="truncate">
            Birinchi 1000 foydalanuvchi uchun komissiya{" "}
            <b className="text-emerald-300">0%</b>
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-400">Bugun {activeRoutes} ta faol yo‘nalish</span>
        </div>
      </div>

      <section id="top" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 sm:pb-14">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass mb-6 text-[11px] sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-300">O‘zbekiston bo‘ylab tashuvchi tarmog‘i</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">27+ shahar</span>
          </div>

          <h1 className="text-[34px] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl sm:leading-[1.05] font-black tracking-tight mb-5 text-balance">
            O‘zbekiston bo‘ylab{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                yuk yuborishning
              </span>
              <svg className="absolute -bottom-1.5 left-0 w-full" height="10" viewBox="0 0 300 10" preserveAspectRatio="none">
                <path d="M2 7 Q 75 1, 150 5 T 298 4" stroke="url(#hu)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <defs>
                  <linearGradient id="hu">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </span>{" "}
            yangi yo‘li
          </h1>

          <p className="text-[15px] sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed text-balance">
            Shahar ichida yoki shaharlar orasida paket, hujjat va kichik yuklaringizni
            ishonchli tashuvchilar orqali tezroq yuboring.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={goCreate}
              className="group relative px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#04060d] font-bold overflow-hidden active:scale-[0.98] transition"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                📦 Yuk yuborish
                <span className="group-hover:translate-x-1 transition">→</span>
              </span>
              <div className="absolute -inset-1 bg-emerald-500/40 blur-xl -z-10" />
            </button>

            <button
              type="button"
              onClick={goDriverRoute}
              className="px-7 py-3.5 rounded-xl glass-strong font-semibold hover:border-emerald-500/40 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              🚗 Yo‘lga chiqyapman
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Profil va reyting</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Chat orqali kelishuv</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Taqiqlangan yuk qoidalari</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 0% boshlang‘ich komissiya</span>
          </div>
        </div>
      </section>

      <section className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/40 via-cyan-500/30 to-emerald-500/40 rounded-3xl blur-xl opacity-60 animate-glow" />

          <div className="relative glass-strong rounded-3xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">Tashuvchi qidirish</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hozirda {activeRoutes} ta faol yo‘nalish
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2.5">
              <div className="relative">
                <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/5 hover:border-emerald-500/30 focus-within:border-emerald-500/40 transition">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" /> Qayerdan
                  </label>

                  <input
                    type="text"
                    inputMode="text"
                    value={fromValue}
                    onChange={(e) => setFromValue(e.target.value)}
                    onFocus={() => setShowFrom(true)}
                    onBlur={() => setTimeout(() => setShowFrom(false), 150)}
                    placeholder="Shahar, tuman, qishloq yoki aniq manzil"
                    className="w-full bg-transparent outline-none text-base font-semibold mt-1 placeholder:text-slate-600 placeholder:font-normal"
                  />
                </div>

                {showFrom && filteredFrom.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl p-2 z-40 max-h-72 overflow-auto no-scrollbar shadow-2xl shadow-black/40">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1.5">Mashhur joylar</div>

                    {filteredFrom.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => setFromValue(`${p.city}, ${p.area}`)}
                        className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-emerald-500/10 transition"
                      >
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs">📍</span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{p.city}, {p.area}</span>
                          <span className="block text-[11px] text-slate-500">viloyat • shahar/tuman</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/5 hover:border-emerald-500/30 focus-within:border-emerald-500/40 transition">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" /> Qayerga
                  </label>

                  <input
                    type="text"
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                    onFocus={() => setShowTo(true)}
                    onBlur={() => setTimeout(() => setShowTo(false), 150)}
                    placeholder="Masalan: Toshkent, Chilonzor, 12-kvartal"
                    className="w-full bg-transparent outline-none text-base font-semibold mt-1 placeholder:text-slate-600 placeholder:font-normal"
                  />
                </div>

                {showTo && filteredTo.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl p-2 z-40 max-h-72 overflow-auto no-scrollbar shadow-2xl shadow-black/40">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1.5">Tavsiya etiladi</div>

                    {filteredTo.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => setToValue(`${p.city}, ${p.area}`)}
                        className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-cyan-500/10 transition"
                      >
                        <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs">🎯</span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{p.city}, {p.area}</span>
                          <span className="block text-[11px] text-slate-500">viloyat • shahar/tuman</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCargoOpen((v) => !v)}
                  className="w-full text-left bg-white/[0.03] rounded-2xl p-3.5 border border-white/5 hover:border-emerald-500/30 transition"
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    📦 Yuk turi
                  </span>

                  <span className="text-base font-semibold mt-1 flex items-center justify-between gap-2">
                    {cargoType}
                    <span className={`text-slate-500 transition ${cargoOpen ? "rotate-180" : ""}`}>▾</span>
                  </span>
                </button>

                {cargoOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl p-2 z-40 shadow-2xl shadow-black/40">
                    {cargoOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCargoType(c);
                          setCargoOpen(false);
                        }}
                        className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition ${
                          cargoType === c ? "bg-emerald-500/15 text-emerald-300" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="text-sm">{c}</span>
                        {cargoType === c && <span className="text-emerald-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={goJobs}
                className="group relative px-6 py-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-[#04060d] font-bold overflow-hidden active:scale-[0.98] transition"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Tashuvchi topish
                  <span className="group-hover:translate-x-1 transition">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition" />
              </button>
            </div>

            <div className="mt-3 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex flex-wrap items-center gap-1.5 px-1">
                <span className="text-[11px] text-slate-500 mr-1">Mashhur:</span>

                {["Toshkent → Farg‘ona", "Toshkent → Samarqand", "Andijon → Asaka", "Chilonzor → Yunusobod"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const [from, to] = t.split(" → ");
                      setFromValue(from);
                      setToValue(to);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] border border-white/5 hover:border-emerald-500/30 hover:text-emerald-300 transition text-slate-400"
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="lg:ml-auto flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <span className="text-amber-400 text-sm leading-none mt-0.5">⚠️</span>

                <p className="text-[11px] leading-relaxed text-amber-200/80">
                  <b className="text-amber-300">Taqiqlangan yuklar:</b> Telefon, noutbuk, naqd pul, bank kartasi, pasport, qimmatbaho buyumlar va xavfli mahsulotlar qabul qilinmaydi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="yonalishlar" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-6 sm:mb-10">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-emerald-400 mb-3">Yo‘nalishlar</div>
          <h2 className="text-[26px] leading-[1.15] sm:text-3xl md:text-5xl font-black tracking-tight text-balance">
            O‘zbekiston bo‘ylab <span className="text-slate-500">faol</span> yo‘nalishlar
          </h2>
        </div>

        <div className="relative h-[380px] sm:h-[600px] md:h-[680px] rounded-3xl glass-strong overflow-hidden glow-emerald">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id="terrain" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(16,185,129,0.10)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0)" />
              </radialGradient>
              <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#34d399" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            <path
              d="M 6 30 Q 8 22, 16 22 Q 24 18, 30 24 Q 38 20, 44 28 Q 52 22, 58 32 Q 64 26, 72 30 Q 82 26, 90 34 Q 96 40, 94 50 Q 96 58, 90 60 Q 82 62, 76 56 Q 70 64, 60 60 Q 56 70, 50 72 Q 48 82, 52 88 Q 44 86, 40 76 Q 32 78, 28 70 Q 18 70, 14 60 Q 6 56, 8 46 Q 4 38, 6 30 Z"
              fill="url(#terrain)"
              stroke="rgba(16,185,129,0.18)"
              strokeWidth="0.25"
              strokeDasharray="0.8 0.8"
              vectorEffect="non-scaling-stroke"
            />

            {routes.map(([a, b], i) => {
              const A = cities[a];
              const B = cities[b];

              return (
                <g key={i}>
                  <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(16,185,129,0.22)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
                  <line
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    stroke="url(#rg)"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                    style={{ animation: `dashMove ${2 + (i % 4) * 0.4}s linear infinite` }}
                  />
                </g>
              );
            })}

            {routes.map(([a, b], i) => {
              const A = cities[a];
              const B = cities[b];

              return (
                <circle key={`m${i}`} r="0.7" fill="#6ee7b7">
                  <animateMotion dur={`${3 + (i % 5) * 0.7}s`} repeatCount="indefinite" path={`M ${A.x} ${A.y} L ${B.x} ${B.y}`} />
                  <animate attributeName="opacity" values="0;1;1;0" dur={`${3 + (i % 5) * 0.7}s`} repeatCount="indefinite" />
                </circle>
              );
            })}
          </svg>

          {cities.map((c, i) => (
            <div
              key={c.name}
              className="absolute"
              style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-emerald-400/40"
                  style={{ animation: `pulseRing 2.6s cubic-bezier(0.4,0,0.6,1) infinite ${(i * 0.25) % 2}s` }}
                />
                <div
                  className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-emerald-400/20"
                  style={{ animation: `pulseRing 2.6s cubic-bezier(0.4,0,0.6,1) infinite ${(i * 0.25 + 1) % 2}s` }}
                />
              </div>

              <div className="relative">
                <div className={`relative ${c.size === "lg" ? "w-3 h-3 sm:w-3.5 sm:h-3.5" : c.size === "md" ? "w-2.5 h-2.5" : "w-2 h-2"} rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.9)]`}>
                  <div className="absolute inset-[2px] rounded-full bg-emerald-100" />
                </div>

                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 sm:mt-1.5 whitespace-nowrap ${c.mobileLabel ? "" : "hidden md:block"}`}>
                  <span className="text-[9px] sm:text-[10px] font-bold text-white bg-[#04060d]/85 backdrop-blur px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {c.name}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="hidden md:block absolute top-5 left-5 w-[260px] animate-floatA">
            <RouteCard {...floatingRoutes[0]} />
          </div>
          <div className="hidden md:block absolute top-24 right-5 w-[260px] animate-floatB" style={{ animationDelay: "0.8s" }}>
            <RouteCard {...floatingRoutes[1]} />
          </div>
          <div className="hidden md:block absolute bottom-20 left-5 w-[260px] animate-floatA" style={{ animationDelay: "1.6s" }}>
            <RouteCard {...floatingRoutes[2]} />
          </div>
          <div className="hidden md:block absolute bottom-5 right-5 w-[260px] animate-floatB" style={{ animationDelay: "2.2s" }}>
            <RouteCard {...floatingRoutes[3]} />
          </div>

          <div className="md:hidden absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="glass rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-semibold">{activeRoutes} yo‘nalish</span>
            </div>

            <div className="glass rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-semibold">{onlineDrivers} tashuvchi</span>
            </div>
          </div>

          <div className="hidden md:flex absolute bottom-5 left-5 glass rounded-xl px-3 py-2 items-center gap-3 text-[11px]">
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Faol</div>
              <div className="text-emerald-400 font-bold text-sm">{activeRoutes} yo‘nalish</div>
            </div>

            <div className="w-px h-7 bg-white/10" />

            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Tashuvchi</div>
              <div className="text-cyan-400 font-bold text-sm">{onlineDrivers} ta</div>
            </div>
          </div>
        </div>

        <div className="md:hidden mt-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Faol yo‘nalishlar
            </h3>
            <span className="text-[11px] text-slate-500">← suring →</span>
          </div>

          <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2">
            {floatingRoutes.map((r, i) => (
              <div key={i} className="snap-start shrink-0 w-[260px]">
                <RouteCard {...r} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tashuvchilar" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-emerald-400 mb-3">Ikki xil xizmat</div>
          <h2 className="text-[26px] leading-[1.15] sm:text-3xl md:text-5xl font-black tracking-tight text-balance">
            Bir platforma — <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">ikki yo‘l</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
          <button
            type="button"
            onClick={goCreate}
            className="group relative glass-strong rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-emerald-500/30 transition text-left active:scale-[0.99]"
          >
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-2xl">🛣️</div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Viloyatlararo</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black mb-2">Shaharlar orasida</h3>

              <p className="text-slate-400 leading-relaxed mb-5">
                Yo‘lga chiqayotgan tashuvchilar bilan viloyatlar orasida yuk yuboring.
                Toshkent, Farg‘ona, Samarqand, Buxoro va boshqa shaharlar.
              </p>

              <div className="flex flex-wrap gap-2">
                {["Damas", "Yengil avto", "Minivan", "Tungi reys"].map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-slate-300">{t}</span>
                ))}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={goCreate}
            className="group relative glass-strong rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-cyan-500/30 transition text-left active:scale-[0.99]"
          >
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl group-hover:bg-cyan-500/25 transition" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-2xl">🛵</div>
                <span className="text-[10px] uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-full">Shahar ichida</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black mb-2">Shahar ichida</h3>

              <p className="text-slate-400 leading-relaxed mb-5">
                Motor kuryer yoki yaqin tashuvchi orqali tezkor yetkazib berish.
                Toshkent, Samarqand va boshqa yirik shaharlar.
              </p>

              <div className="flex flex-wrap gap-2">
                {["Moto kuryer", "Tezkor", "30-60 daq", "Tuman ichida"].map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-slate-300">{t}</span>
                ))}
              </div>
            </div>
          </button>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 max-w-md md:max-w-none mx-auto">
          <div className="order-1 md:order-2 md:col-span-1 glass-strong rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl" />

            <div className="relative flex md:block items-center gap-4">
              <div className="flex-1 md:flex-none text-center md:text-left">
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wider mb-1">Tarmoqda</div>
                <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-emerald-300 to-emerald-500 bg-clip-text text-transparent leading-none">
                  {onlineDrivers}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">tashuvchi profili</div>
              </div>

              <div className="md:mt-5">
                <div className="flex -space-x-2 mb-2 md:mb-3 justify-end md:justify-start">
                  {["A", "M", "B", "S", "K"].map((l, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-[#04060d] flex items-center justify-center text-xs font-bold text-[#04060d]"
                      style={{ background: `linear-gradient(135deg, hsl(${150 + i * 18}, 75%, 60%), hsl(${170 + i * 18}, 70%, 40%))` }}
                    >
                      {l}
                    </div>
                  ))}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-[#04060d] bg-white/10 flex items-center justify-center text-[10px] font-bold">
                    +{Math.max(0, onlineDrivers - 5)}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-right md:text-left">27 ta shaharda</div>
              </div>
            </div>
          </div>

          <div className="order-2 md:order-1 md:col-span-2 glass-strong rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  <span className="relative block w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">Platforma faolligi</h3>
              </div>

              <span className="text-[11px] text-slate-500">Yangilanmoqda</span>
            </div>

            <div className="space-y-2.5">
              {activities.map((a, i) => (
                <div
                  key={i}
                  className={`${i >= 4 ? "hidden md:flex" : "flex"} items-center gap-3 p-3 rounded-xl transition ${
                    i === activityIndex ? "bg-emerald-500/10 border border-emerald-500/25" : "bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">{a.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] sm:text-sm font-medium leading-snug break-words">{a.text}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{a.time}</div>
                  </div>

                  {i === activityIndex && (
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold whitespace-nowrap shrink-0">Yangi</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="xavfsizlik" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-10">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-emerald-400 mb-3">Xavfsizlik</div>
          <h2 className="text-[26px] leading-[1.15] sm:text-3xl md:text-5xl font-black tracking-tight text-balance">
            Yukingiz <span className="text-emerald-400">himoyada</span>.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[
            { icon: "👤", title: "Profil va reyting", desc: "Tashuvchilar va yuk yuboruvchilar xizmat tajribasi orqali baholanadi." },
            { icon: "💬", title: "Chat orqali kelishuv", desc: "Yuk tafsilotlari, vaqt va narx foydalanuvchilar o‘rtasida kelishiladi." },
            { icon: "⭐", title: "Sharhlar", desc: "Yakunlangan kelishuvlardan keyin foydalanuvchi tajribasi baholanadi." },
            { icon: "🛡️", title: "Admin nazorati", desc: "Shikoyat va muammolar yordam markazi orqali ko‘rib chiqiladi." },
            { icon: "📨", title: "Qo‘llab-quvvatlash", desc: "Reklama, hamkorlik, texnik yordam va shikoyatlar uchun murojaat yuboriladi." },
            { icon: "⚠️", title: "Taqiqlangan yuk qoidalari", desc: "Qimmatbaho, xavfli va noqonuniy yuklar qabul qilinmaydi." },
          ].map((c, i) => (
            <div key={i} className="group relative glass-strong rounded-2xl p-5 hover:border-emerald-500/30 transition overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/15 blur-2xl transition" />

              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-xl mb-3">
                  {c.icon}
                </div>

                <h3 className="font-bold text-base mb-1.5 leading-tight">{c.title}</h3>
                <p className="text-[12.5px] sm:text-sm text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="yuborish" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-emerald-400 mb-3">Trend</div>
            <h2 className="text-[26px] leading-[1.15] sm:text-3xl md:text-5xl font-black tracking-tight">Mashhur yo‘nalishlar</h2>
          </div>

          <button
            type="button"
            onClick={goRoutes}
            className="text-sm text-slate-400 hover:text-emerald-400 transition flex items-center gap-2"
          >
            Barcha yo‘nalishlar <span>→</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[
            { from: "Toshkent", to: "Farg‘ona", drivers: 47, time: "4s 30daq", scope: "Viloyatlararo" },
            { from: "Toshkent", to: "Andijon", drivers: 32, time: "5s 15daq", scope: "Viloyatlararo" },
            { from: "Toshkent", to: "Namangan", drivers: 38, time: "4s 45daq", scope: "Viloyatlararo" },
            { from: "Toshkent", to: "Samarqand", drivers: 56, time: "3s 30daq", scope: "Viloyatlararo" },
            { from: "Farg‘ona", to: "Qo‘qon", drivers: 21, time: "1s 10daq", scope: "Viloyat ichida" },
            { from: "Andijon", to: "Asaka", drivers: 18, time: "40 daq", scope: "Viloyat ichida" },
            { from: "Chilonzor", to: "Yunusobod", drivers: 24, time: "30-45 daq", scope: "Toshkent ichida" },
            { from: "Sergeli", to: "Mirzo Ulug‘bek", drivers: 19, time: "35-50 daq", scope: "Toshkent ichida" },
          ].map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={goRoutes}
              className="group relative glass-strong rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition cursor-pointer overflow-hidden text-left active:scale-[0.99]"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-400/60 transition" />

              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                  {r.drivers} tashuvchi
                </span>
                <span className="text-[11px] text-slate-500">⏱ {r.time}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="font-bold text-base sm:text-lg">{r.from}</span>
                </div>

                <div className="ml-1 h-5 w-px bg-gradient-to-b from-emerald-400/60 to-cyan-400/40" />

                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <span className="font-bold text-base sm:text-lg">{r.to}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{r.scope}</span>
                <span className="text-emerald-400 group-hover:translate-x-1 transition">→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="biz-haqimizda" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="relative rounded-3xl glass-strong overflow-hidden p-7 sm:p-10 md:p-14">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl" />

          <div className="relative text-center mb-8 sm:mb-12">
            <h2 className="text-[26px] leading-[1.15] sm:text-3xl md:text-5xl font-black tracking-tight mb-3 text-balance">
              Ishonch asosida — <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">O‘zbekiston bo‘ylab</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              YukGo — yuk yuboruvchilar va yo‘nalishi mos tashuvchilarni bog‘laydigan marketplace platforma.
            </p>
          </div>

          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { v: "27+", l: "faol shahar", s: "O‘zbekiston bo‘ylab" },
              { v: "120+", l: "faol yo‘nalish", s: "Har kuni yangilanadi" },
              { v: "4.9", l: "o‘rtacha reyting", s: "Foydalanuvchilar baholashi" },
              { v: "0%", l: "boshlang‘ich komissiya", s: "Birinchi 1000 kishi uchun" },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left p-3 sm:p-4 rounded-2xl hover:bg-white/[0.02] transition">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-1.5">
                  {s.v}
                </div>
                <div className="text-emerald-400 font-semibold text-xs sm:text-sm mb-0.5">{s.l}</div>
                <div className="text-[11px] sm:text-xs text-slate-500">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
        <h2 className="text-[30px] leading-[1.1] sm:text-4xl md:text-6xl font-black tracking-tight mb-5 text-balance">
          Birinchi yukingizni{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">hozir</span>{" "}
          yuboring
        </h2>

        <p className="text-slate-400 mb-8 max-w-xl mx-auto text-[15px] sm:text-base">
          O‘zbekiston bo‘ylab foydalanuvchilar YukGo orqali mos tashuvchi topib, yuk yuborish jarayonini osonlashtiradi.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={goCreate}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#04060d] font-bold hover:shadow-2xl hover:shadow-emerald-500/40 transition active:scale-[0.98]"
          >
            📦 Yuk yuborish
          </button>

          <button
            type="button"
            onClick={goDriverRoute}
            className="px-7 py-3.5 rounded-xl glass-strong font-semibold hover:border-emerald-500/40 transition active:scale-[0.98]"
          >
            🚗 Tashuvchi bo‘lish →
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-300 to-emerald-600 flex items-center justify-center font-black text-[#04060d]">Y</div>
            <span className="font-bold">
              Yuk<span className="text-emerald-400">Go</span>
            </span>
            <span className="text-[11px] text-slate-600">© 2025 — O‘zbekistonda yaratilgan 🇺🇿</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
            <a href="#biz-haqimizda" className="hover:text-emerald-400 transition">Biz haqimizda</a>
            <a href="#tashuvchilar" className="hover:text-emerald-400 transition">Tashuvchilar</a>
            <a href="#xavfsizlik" className="hover:text-emerald-400 transition">Xavfsizlik</a>
            <button type="button" onClick={goSupport} className="hover:text-emerald-400 transition">
              Aloqa
            </button>
            <button type="button" onClick={() => router.push("/privacy")} className="hover:text-emerald-400 transition">
              Maxfiylik
            </button>
            <button type="button" onClick={() => router.push("/terms")} className="hover:text-emerald-400 transition">
              Shartlar
            </button>
          </div>
        </div>
      </footer>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#04060d] via-[#04060d]/85 to-transparent pointer-events-none" />

        <div className="relative glass-bottom rounded-2xl p-1.5 flex gap-1.5 shadow-2xl shadow-black/60 pointer-events-auto">
          <button
            type="button"
            onClick={goCreate}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#04060d] font-bold text-[13px] active:scale-[0.98] transition flex items-center justify-center gap-1.5"
          >
            <span>📦</span> Yuk yuborish
          </button>

          <button
            type="button"
            onClick={goDriverRoute}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-semibold text-[13px] active:scale-[0.98] transition flex items-center justify-center gap-1.5"
          >
            <span>🚗</span> Yo‘lga chiqyapman
          </button>
        </div>
      </div>
    </div>
  );
}

function RouteCard({
  tone,
  status,
  when,
  from,
  to,
  vehicle,
  detail,
}: {
  tone: "emerald" | "amber" | "cyan" | "violet";
  status: string;
  when: string;
  from: string;
  to: string;
  vehicle: string;
  detail: string;
}) {
  const toneMap = {
    emerald: { dot: "bg-emerald-400", text: "text-emerald-300", line: "from-emerald-400/60 to-cyan-400/40", arrow: "text-emerald-400", val: "text-emerald-300" },
    amber: { dot: "bg-amber-400", text: "text-amber-300", line: "from-amber-400/60 to-emerald-400/40", arrow: "text-amber-400", val: "text-amber-300" },
    cyan: { dot: "bg-cyan-400", text: "text-cyan-300", line: "from-cyan-400/60 to-emerald-400/40", arrow: "text-cyan-400", val: "text-cyan-300" },
    violet: { dot: "bg-violet-400", text: "text-violet-300", line: "from-violet-400/60 to-cyan-400/40", arrow: "text-violet-400", val: "text-violet-300" },
  }[tone];

  return (
    <div className="glass-strong rounded-2xl p-3.5 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${toneMap.dot} animate-pulse`} />
          <span className={`text-[10px] uppercase tracking-wider ${toneMap.text} font-semibold`}>{status}</span>
        </div>

        <span className="text-[10px] text-slate-500">{when}</span>
      </div>

      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-bold text-[13px] truncate">{from}</span>
        <div className={`flex-1 h-px bg-gradient-to-r ${toneMap.line} relative`}>
          <div className={`absolute -top-0.5 left-0 w-1.5 h-1.5 rounded-full ${toneMap.dot} animate-pulse`} />
        </div>
        <span className={toneMap.arrow}>→</span>
        <span className="font-bold text-[13px] truncate">{to}</span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{vehicle}</span>
        <span className={`${toneMap.val} font-semibold`}>{detail}</span>
      </div>
    </div>
  );
}