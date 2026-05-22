"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

export default function DeleteAccountPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (mounted) {
        setUserId(user.id);
        setEmail(user.email || "");
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  const canSubmit = confirmText.trim().toUpperCase() === "OCHIRISH";

  const handleSubmit = async () => {
    if (!userId || sending || !canSubmit) return;

    setSending(true);
    setErrorText("");

    const { error } = await supabase.from("account_deletion_requests").insert({
      user_id: userId,
      email,
      reason: reason.trim() || null,
      status: "pending",
    });

    if (error) {
      setErrorText(
        "So‘rov yuborilmadi. Iltimos, keyinroq qayta urinib ko‘ring."
      );
      setSending(false);
      return;
    }

    await supabase.auth.signOut();

    setDone(true);
    setSending(false);
  };

  if (done) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
          <div className="rounded-[1.8rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/12 via-white/[0.04] to-cyan-400/8 p-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-emerald-300/20 bg-emerald-400/10 text-2xl">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-black">
              So‘rov qabul qilindi
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Hisobni o‘chirish so‘rovingiz yuborildi. Xavfsizlik tekshiruvidan
              so‘ng hisobingiz va shaxsiy ma’lumotlaringiz xizmat qoidalariga
              muvofiq o‘chiriladi yoki anonimlashtiriladi.
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-6 h-12 w-full rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d] active:scale-[0.99]"
            >
              Login sahifasiga qaytish
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-md px-5 py-5 pb-28">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg active:scale-95"
          >
            ←
          </button>

          <div>
            <p className="text-xs font-semibold text-red-300/80">
              Hisob xavfsizligi
            </p>
            <h1 className="text-2xl font-black tracking-tight">
              Hisobni o‘chirish
            </h1>
          </div>
        </header>

        <section className="rounded-[1.6rem] border border-red-400/20 bg-gradient-to-br from-red-500/12 via-white/[0.04] to-orange-400/8 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-300/20 bg-red-400/10 text-xl">
            ⚠️
          </div>

          <h2 className="text-xl font-black">Bu amal muhim</h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Hisobni o‘chirish so‘rovi yuborilgandan so‘ng profilingiz, shaxsiy
            ma’lumotlaringiz va faoliyat tarixingiz tekshirilib, xizmat
            qoidalariga muvofiq o‘chiriladi yoki anonimlashtiriladi.
          </p>
        </section>

        <section className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-base font-black text-white">
            O‘chirishdan oldin biling
          </h2>

          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
            <p>• Faol yuk, taklif yoki shikoyat bo‘lsa, avval tekshiriladi.</p>
            <p>• Firibgarlik va xavfsizlik yozuvlari cheklangan muddat saqlanishi mumkin.</p>
            <p>• So‘rov yuborilgandan so‘ng hisobdan avtomatik chiqasiz.</p>
          </div>
        </section>

        <section className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
          <label className="text-sm font-black text-white">
            Hisob
          </label>

          <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-slate-300">
            {loading ? "Yuklanmoqda..." : email || "Email topilmadi"}
          </div>

          <label className="mt-4 block text-sm font-black text-white">
            Sabab ixtiyoriy
          </label>

          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Nima sababdan hisobni o‘chirmoqchisiz?"
            className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/30"
          />

          <label className="mt-4 block text-sm font-black text-white">
            Tasdiqlash uchun OCHIRISH deb yozing
          </label>

          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="OCHIRISH"
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white outline-none placeholder:text-slate-600 focus:border-red-300/30"
          />

          {errorText ? (
            <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-semibold leading-5 text-red-200">
              {errorText}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || sending || !canSubmit}
            className="mt-5 h-12 w-full rounded-2xl bg-red-400 text-sm font-black text-[#210606] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {sending ? "So‘rov yuborilmoqda..." : "Hisobni o‘chirish so‘rovini yuborish"}
          </button>
        </section>
      </section>

      <BottomNavbar />
    </main>
  );
}