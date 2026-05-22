"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setMessage("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (cleanFirstName.length < 2) {
      setMessage("Ismingizni to‘g‘ri kiriting.");
      return;
    }

    if (cleanLastName.length < 2) {
      setMessage("Familiyangizni to‘g‘ri kiriting.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessage("To‘g‘ri email kiriting.");
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      setMessage("Telefon raqamingizni to‘g‘ri kiriting.");
      return;
    }

    if (password.length < 6) {
      setMessage("Parol kamida 6 ta belgidan iborat bo‘lishi kerak.");
      return;
    }

    if (password !== confirm) {
      setMessage("Parollar mos emas.");
      return;
    }

    if (!agree) {
      setMessage("Davom etish uchun Foydalanish shartlari va Maxfiylik siyosatini tasdiqlang.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          first_name: cleanFirstName,
          last_name: cleanLastName,
          full_name: `${cleanFirstName} ${cleanLastName}`,
          phone: cleanPhone,
          account_type: "both",
          accepted_terms: true,
          accepted_terms_at: new Date().toISOString(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage("Ro‘yxatdan o‘tishda xatolik yuz berdi. Email yoki parolni tekshiring.");
      return;
    }

    setMessage("Hisob yaratildi. Emailingizni tasdiqlang yoki kirish sahifasiga o‘ting.");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#05080b] text-white antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-32 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 1.25rem)",
          paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)",
        }}
      >
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/login"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition active:scale-95"
            aria-label="Orqaga"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-emerald-400/40 blur-md" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/30">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#05080b]">
                  <path
                    d="M3 13l3-7h12l3 7v5h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3v-5z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <span className="text-base font-semibold tracking-tight">
              Yuk
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Go
              </span>
            </span>
          </div>

          <div className="h-10 w-10" />
        </div>

        <div className="mt-7">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            Hisob yarating
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-white/55">
            Yuk yuborish va tashishni bitta hisob orqali boshlang.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_40px_-12px_rgba(16,185,129,0.15)] backdrop-blur-xl">
            <Field label="Ism" icon={<UserIcon />}>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Ismingiz"
                autoComplete="given-name"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-white/30"
              />
            </Field>

            <div className="mt-3">
              <Field label="Familiya" icon={<UserIcon />}>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Familiyangiz"
                  autoComplete="family-name"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-white/30"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Email" icon={<MailIcon />}>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@example.com"
                  inputMode="email"
                  autoComplete="email"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-white/30"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Telefon" icon={<PhoneIcon />}>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+998 90 123 45 67"
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-white/30"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Parol" icon={<LockIcon />}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder="Kamida 6 ta belgi"
                  autoComplete="new-password"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-white/30"
                />

                <button
                  type="button"
                  onClick={() => setShowPass((value) => !value)}
                  className="ml-2 text-white/40 transition hover:text-white/80"
                  aria-label="Parolni ko‘rsatish"
                >
                  {showPass ? <EyeOff /> : <Eye />}
                </button>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Parolni tasdiqlash" icon={<CheckIcon />}>
                <input
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Parolni qayta kiriting"
                  autoComplete="new-password"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-white/30"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="ml-2 text-white/40 transition hover:text-white/80"
                  aria-label="Parolni ko‘rsatish"
                >
                  {showConfirm ? <EyeOff /> : <Eye />}
                </button>
              </Field>

              {confirm.length > 0 && confirm !== password ? (
                <p className="mt-1.5 pl-1 text-xs text-rose-300/90">
                  Parollar mos emas
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3.5 backdrop-blur-xl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
              <ShieldIcon />
            </div>

            <p className="text-[12.5px] leading-relaxed text-white/65">
              Bitta hisob bilan yuk yuborishingiz ham, tashuvchi sifatida ishlashingiz ham mumkin.
              Pasport, hujjat rasmi yoki selfie so‘ralmaydi.
            </p>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 px-1">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              className="peer sr-only"
            />

            <span
              className={`mt-0.5 flex shrink-0 items-center justify-center rounded-md border transition ${
                agree
                  ? "border-emerald-300 bg-emerald-400 text-[#05080b]"
                  : "border-white/20 bg-white/5"
              }`}
              style={{ height: "1.125rem", width: "1.125rem" }}
            >
              {agree ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                  <path
                    d="M5 12l4 4 10-10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>

            <span className="text-[12.5px] leading-relaxed text-white/55">
              Men{" "}
              <Link
                href="/terms"
                className="font-medium text-emerald-300 underline-offset-2 hover:underline"
              >
                Foydalanish shartlari
              </Link>{" "}
              va{" "}
              <Link
                href="/privacy"
                className="font-medium text-emerald-300 underline-offset-2 hover:underline"
              >
                Maxfiylik siyosati
              </Link>{" "}
              bilan tanishdim va roziman.
            </span>
          </label>

          {message ? (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-3 text-[12.5px] leading-relaxed text-emerald-100">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !agree}
            className="relative mt-5 flex h-[54px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-semibold text-[#04110d] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.6)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  opacity="0.3"
                />
                <path
                  d="M21 12a9 9 0 00-9-9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="flex items-center gap-2 text-[15px]">
                Ro‘yxatdan o‘tish
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[13.5px] text-white/55">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-emerald-300 hover:text-emerald-200">
            Kirish
          </Link>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-center gap-4 text-[11.5px] text-white/40">
            <Link href="/terms" className="transition hover:text-white/70">
              Shartlar
            </Link>
            <span className="h-1 w-1 rounded-full bg-white/15" />
            <Link href="/privacy" className="transition hover:text-white/70">
              Maxfiylik
            </Link>
            <span className="h-1 w-1 rounded-full bg-white/15" />
            <Link href="/support" className="transition hover:text-white/70">
              Yordam
            </Link>
          </div>

          <div className="mt-3 text-center text-[10.5px] text-white/25">
            © {new Date().getFullYear()} YukGo · Logistika tizimi
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block pl-1 text-[11.5px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </span>

      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 transition focus-within:border-emerald-300/40 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]">
        <span className="text-white/40">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 20c1.5-3.5 4.5-5 7-5s5.5 1.5 7 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M10 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M5 12l4 4 10-10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M10.6 6.1c.45-.07.92-.1 1.4-.1 6.5 0 10 7 10 7s-1.06 2.13-3.1 4M6.5 7.5C3.6 9.3 2 12 2 12s3.5 7 10 7c1.6 0 3-.27 4.2-.73"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.9 9.9a3 3 0 004.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}