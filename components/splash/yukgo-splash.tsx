"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY = "yukgo_splash_seen";

export default function YukGoSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadySeen = window.sessionStorage.getItem(SPLASH_KEY);

    if (alreadySeen) {
      return;
    }

    setVisible(true);
    window.sessionStorage.setItem(SPLASH_KEY, "true");

    const timer = setTimeout(() => {
      setVisible(false);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#020807] text-white">
      <style jsx>{`
        @keyframes splashFadeOut {
          0% {
            opacity: 1;
          }
          84% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes logoRise {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
            filter: blur(16px);
          }
          42% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.94);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }

        @keyframes lineFlow {
          0% {
            transform: translateX(-120%) skewX(-18deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          76% {
            opacity: 1;
          }
          100% {
            transform: translateX(120%) skewX(-18deg);
            opacity: 0;
          }
        }

        @keyframes colorReveal {
          0% {
            opacity: 0;
            transform: translateY(18px) scaleX(0.78);
          }
          45% {
            opacity: 1;
            transform: translateY(0) scaleX(1);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleX(1);
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes softFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .splash-root {
          animation: splashFadeOut 4.2s ease-in-out forwards;
        }

        .logo-rise {
          animation: logoRise 1.55s ease-out forwards;
        }

        .glow-pulse {
          animation: glowPulse 2.7s ease-in-out infinite;
        }

        .line-flow {
          animation: lineFlow 3.4s ease-in-out infinite;
        }

        .soft-float {
          animation: softFloat 3.2s ease-in-out infinite;
        }

        .color-reveal {
          animation: colorReveal 1.45s ease-out forwards;
          animation-delay: 0.55s;
          opacity: 0;
        }

        .progress-bar {
          animation: progress 2.65s ease-in-out forwards;
          animation-delay: 0.95s;
        }
      `}</style>

      <div className="splash-root absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(16,185,129,0.25),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(6,182,212,0.18),transparent_28%),radial-gradient(circle_at_80%_72%,rgba(30,181,58,0.14),transparent_30%),linear-gradient(180deg,#03110e,#020807_48%,#000)]" />

        <div className="glow-pulse absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-[100px]" />

        <div className="absolute left-[-18%] top-[25%] h-20 w-[136%] rotate-[-8deg] overflow-hidden opacity-90">
          <div className="line-flow h-full w-1/2 bg-gradient-to-r from-transparent via-[#12A8D8]/45 to-transparent" />
        </div>

        <div className="absolute left-[-18%] top-[39%] h-12 w-[136%] rotate-[-8deg] overflow-hidden opacity-75">
          <div className="line-flow h-full w-1/2 bg-gradient-to-r from-transparent via-white/32 to-transparent [animation-delay:0.35s]" />
        </div>

        <div className="absolute left-[-18%] top-[51%] h-[3px] w-[136%] rotate-[-8deg] bg-[#CE1126]/65 shadow-[0_0_18px_rgba(206,17,38,0.45)]" />

        <div className="absolute left-[-18%] top-[56%] h-20 w-[136%] rotate-[-8deg] overflow-hidden opacity-90">
          <div className="line-flow h-full w-1/2 bg-gradient-to-r from-transparent via-[#1EB53A]/45 to-transparent [animation-delay:0.7s]" />
        </div>

        <div className="absolute left-1/2 top-[18%] h-1 w-56 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#12A8D8]/70 to-transparent opacity-70" />
        <div className="absolute left-1/2 top-[20%] h-[2px] w-44 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70" />
        <div className="absolute left-1/2 top-[22%] h-[2px] w-36 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#CE1126]/60 to-transparent opacity-70" />
        <div className="absolute left-1/2 top-[24%] h-1 w-48 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#1EB53A]/70 to-transparent opacity-70" />

        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="logo-rise soft-float flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-9 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#12A8D8]/18 via-white/8 to-[#1EB53A]/18 blur-2xl" />

              <div className="relative flex h-30 w-30 items-center justify-center rounded-[2.15rem] border border-white/12 bg-white/[0.07] shadow-[0_0_78px_rgba(16,185,129,0.3)] backdrop-blur-2xl">
                <div className="absolute inset-0 rounded-[2.15rem] bg-gradient-to-br from-[#12A8D8]/16 via-white/[0.05] to-[#1EB53A]/18" />
                <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-[#12A8D8]/80" />
                <div className="absolute left-4 right-4 top-7 h-[2px] rounded-full bg-white/80" />
                <div className="absolute left-4 right-4 bottom-7 h-[2px] rounded-full bg-[#CE1126]/80" />
                <div className="absolute left-4 right-4 bottom-4 h-1 rounded-full bg-[#1EB53A]/80" />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.45rem] bg-gradient-to-br from-emerald-300 via-emerald-400 to-cyan-400 text-5xl font-black tracking-tight text-[#02110c] shadow-[0_18px_60px_rgba(16,185,129,0.35)]">
                  Y
                </div>
              </div>
            </div>

            <h1 className="mt-8 text-5xl font-black tracking-tight">
              Yuk<span className="text-emerald-400">Go</span>
            </h1>

            <p className="mt-3 text-center text-sm font-semibold tracking-[0.18em] text-white/55">
              O‘ZBEKISTON BO‘YLAB
            </p>

            <div className="color-reveal mt-5 flex w-56 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[0_0_28px_rgba(16,185,129,0.14)]">
              <div className="h-2 flex-1 rounded-l-full bg-[#12A8D8]" />
              <div className="h-2 w-8 bg-white" />
              <div className="h-2 w-3 bg-[#CE1126]" />
              <div className="h-2 flex-1 rounded-r-full bg-[#1EB53A]" />
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-white/38">
              Yuk yuboruvchi va tashuvchilar uchun
              <br />
              zamonaviy marketplace
            </p>
          </div>

          <div className="absolute bottom-[max(3.4rem,env(safe-area-inset-bottom))] left-1/2 w-40 -translate-x-1/2">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="progress-bar h-full rounded-full bg-gradient-to-r from-[#12A8D8] via-white to-[#1EB53A] shadow-[0_0_18px_rgba(52,211,153,0.75)]" />
            </div>

            <p className="mt-4 text-center text-[11px] font-semibold tracking-[0.24em] text-white/38">
              YUKLANMOQDA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}