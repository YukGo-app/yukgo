"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type SupportCategory = {
  id: string;
  title: string;
  desc: string;
  badge: string;
  icon: string;
  subject: string;
};

type SupportTicketRow = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  admin_reply: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

const supportCategories: SupportCategory[] = [
  {
    id: "sponsored_ad",
    title: "Sponsorli reklama",
    desc: "Yuk yoki xizmatni yuqoriroqda ko‘rsatish.",
    badge: "Premium",
    icon: "✨",
    subject: "Sponsorli reklama bo‘yicha murojaat",
  },
  {
    id: "pinned_ad",
    title: "Sabit reklama",
    desc: "Asosiy ekranda ajratilgan reklama joyi.",
    badge: "Maxsus joy",
    icon: "📌",
    subject: "Sabit reklama bo‘yicha murojaat",
  },
  {
    id: "membership",
    title: "A’zolik va paketlar",
    desc: "Biznes, haydovchi yoki faol foydalanuvchi paketi.",
    badge: "Paket",
    icon: "💎",
    subject: "A’zolik bo‘yicha murojaat",
  },
  {
    id: "business",
    title: "Biznes hamkorlik",
    desc: "Do‘kon, servis yoki mahalliy biznes taklifi.",
    badge: "Hamkorlik",
    icon: "🤝",
    subject: "Biznes hamkorlik bo‘yicha murojaat",
  },
  {
    id: "shipment_issue",
    title: "Yuk bo‘yicha yordam",
    desc: "Yuk, taklif, tashuvchi yoki yetkazish jarayoni.",
    badge: "Yordam",
    icon: "📦",
    subject: "Yuk bo‘yicha yordam kerak",
  },
  {
    id: "complaint",
    title: "Shikoyat yuborish",
    desc: "Spam, noto‘g‘ri e’lon yoki xavfsizlik muammosi.",
    badge: "Muhim",
    icon: "🛡️",
    subject: "Shikoyat yuborish",
  },
  {
    id: "technical",
    title: "Texnik yordam",
    desc: "Kirish, OTP, bildirishnoma yoki sahifa xatosi.",
    badge: "Support",
    icon: "⚙️",
    subject: "Texnik yordam kerak",
  },
];

export default function SupportPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    supportCategories[0].id
  );
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSupport = async () => {
      try {
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
        }

        const { data, error } = await supabase
          .from("support_tickets")
          .select(
            "id, user_id, category, subject, message, admin_reply, status, created_at, updated_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) {
          console.error("Support tickets load error:", error.message);
          if (mounted) {
            setNotice("Murojaatlar hozircha yuklanmadi.");
          }
          return;
        }

        if (mounted) {
          const rows = (data || []) as SupportTicketRow[];
          setTickets(rows);
          setExpandedTicketId(rows[0]?.id || null);
        }
      } catch (error) {
        console.error("Support page error:", error);
        if (mounted) {
          setNotice("Yordam markazi hozircha yuklanmadi.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSupport();

    return () => {
      mounted = false;
    };
  }, [router]);

  const selectedCategory =
    supportCategories.find((item) => item.id === selectedCategoryId) ||
    supportCategories[0];

  const openCount = useMemo(
    () =>
      tickets.filter((ticket) =>
        ["open", "in_review"].includes(ticket.status || "open")
      ).length,
    [tickets]
  );

  const answeredCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "answered").length,
    [tickets]
  );

  const handleSubmit = async () => {
    if (sending || !userId) return;

    const cleanMessage = message.trim();

    if (cleanMessage.length < 10) {
      setNotice("Iltimos, murojaatingizni kamida 10 ta belgi bilan yozing.");
      return;
    }

    setSending(true);
    setNotice("");

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        category: selectedCategory.id,
        subject: selectedCategory.subject,
        message: cleanMessage,
        status: "open",
      })
      .select(
        "id, user_id, category, subject, message, admin_reply, status, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("Support ticket send error:", error.message);
      setNotice("Murojaat yuborilmadi. Keyinroq qayta urinib ko‘ring.");
      setSending(false);
      return;
    }

    const newTicket = data as SupportTicketRow;

    setTickets((current) => [newTicket, ...current]);
    setExpandedTicketId(newTicket.id);
    setMessage("");
    setNotice("Murojaatingiz qabul qilindi.");
    setSending(false);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-140px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute right-[-160px] top-48 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.16),rgba(3,7,18,1))]" />
      </div>

      <section className="relative mx-auto max-w-md px-5 py-5 pb-28">
        <header className="mb-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300 active:scale-95"
          >
            Orqaga
          </button>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  YukGo yordam markazi
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight">
                  Qo‘llab-quvvatlash
                </h1>

                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  Reklama, a’zolik, hamkorlik yoki muammo bo‘yicha murojaat
                  yuboring.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-xl shadow-[0_0_35px_rgba(16,185,129,0.12)]">
                💬
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat value={String(tickets.length)} label="jami" />
              <MiniStat value={String(openCount)} label="ochiq" />
              <MiniStat value={String(answeredCount)} label="javob" />
            </div>
          </div>
        </header>

        <section className="rounded-[1.65rem] border border-emerald-400/15 bg-[#07111f]/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">Yangi murojaat</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Talep turi va xabar matni
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
              Private
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(event) => {
                setSelectedCategoryId(event.target.value);
                setNotice("");
              }}
              className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#111827] px-3.5 pr-10 text-sm font-black text-white outline-none focus:border-emerald-300/40"
            >
              {supportCategories.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  className="bg-[#07111f] text-white"
                >
                  {item.title}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              ▼
            </span>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/8 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-base text-[#03120d]">
              {selectedCategory.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-black text-white">
                  {selectedCategory.title}
                </h3>

                <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                  {selectedCategory.badge}
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                {selectedCategory.desc}
              </p>
            </div>
          </div>

          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setNotice("");
            }}
            rows={3}
            maxLength={700}
            placeholder="Xabaringizni yozing..."
            className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#0b1220] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/40"
          />

          <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-500">{message.trim().length}/700</span>
            <span className="text-slate-500">Javob xabar ichida ko‘rinadi</span>
          </div>

          {notice ? (
            <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/8 px-3 py-2.5 text-xs leading-5 text-emerald-200">
              {notice}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || loading}
            className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-300 text-sm font-black text-[#03120d] shadow-[0_18px_45px_rgba(52,211,153,0.18)] transition active:scale-[0.99] disabled:opacity-60"
          >
            {sending ? "Yuborilmoqda..." : "Talep yuborish"}
          </button>
        </section>

        <section className="mt-5 rounded-[1.65rem] border border-white/10 bg-[#07111f]/72 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">Murojaatlar</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Barcha xabarlar bitta ro‘yxatda
              </p>
            </div>

            {tickets.length > 0 ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                {tickets.length}
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-2">
              <TicketSkeleton />
              <TicketSkeleton />
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#050816]/55 p-5 text-center">
              <p className="text-sm font-black text-white">
                Hozircha murojaat yo‘q
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Birinchi murojaatingiz yuborilganda shu yerda ko‘rinadi.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {tickets.map((ticket) => {
                const expanded = expandedTicketId === ticket.id;
                const hasReply = Boolean(ticket.admin_reply?.trim());

                return (
                  <article
                    key={ticket.id}
                    className={[
                      "rounded-2xl border transition",
                      expanded
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-white/10 bg-[#050816]/45",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTicketId(expanded ? null : ticket.id)
                      }
                      className="w-full p-3 text-left active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black text-cyan-200">
                              {getCategoryLabel(ticket.category)}
                            </span>

                            <span
                              className={[
                                "rounded-full border px-2 py-0.5 text-[10px] font-black",
                                getStatusClass(ticket.status),
                              ].join(" ")}
                            >
                              {getStatusLabel(ticket.status)}
                            </span>
                          </div>

                          <h3 className="mt-2 truncate text-sm font-black text-white">
                            {ticket.subject || "Murojaat"}
                          </h3>

                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {hasReply
                              ? `Javob: ${ticket.admin_reply}`
                              : ticket.message}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="block text-[10px] text-slate-600">
                            {formatDate(ticket.created_at)}
                          </span>

                          <span className="mt-2 block text-xs font-black text-emerald-300">
                            {expanded ? "−" : "+"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="border-t border-white/10 px-3 pb-3">
                        <div className="mt-3 rounded-2xl border border-white/10 bg-[#030712]/70 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                            Xabaringiz
                          </p>

                          <p className="mt-1.5 text-xs leading-5 text-slate-300">
                            {ticket.message}
                          </p>
                        </div>

                        <div
                          className={[
                            "mt-2 rounded-2xl border p-3",
                            hasReply
                              ? "border-emerald-400/25 bg-emerald-400/10"
                              : "border-white/10 bg-white/[0.035]",
                          ].join(" ")}
                        >
                          <p
                            className={[
                              "text-[10px] font-black uppercase tracking-[0.14em]",
                              hasReply ? "text-emerald-300" : "text-slate-500",
                            ].join(" ")}
                          >
                            Javob
                          </p>

                          <p
                            className={[
                              "mt-1.5 text-xs leading-5",
                              hasReply ? "text-emerald-100" : "text-slate-500",
                            ].join(" ")}
                          >
                            {hasReply
                              ? ticket.admin_reply
                              : "Javob kutilmoqda. Murojaatingiz ko‘rib chiqiladi."}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <BottomNavbar />
    </main>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 text-center">
      <div className="text-lg font-black text-emerald-300">{value}</div>
      <div className="mt-0.5 text-[10.5px] text-slate-500">{label}</div>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-44 animate-pulse rounded-full bg-white/10" />
      <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

function getCategoryLabel(category: string) {
  if (category === "sponsored_ad") return "Sponsorli";
  if (category === "pinned_ad") return "Sabit reklama";
  if (category === "membership") return "A’zolik";
  if (category === "business") return "Hamkorlik";
  if (category === "shipment_issue") return "Yuk";
  if (category === "complaint") return "Shikoyat";
  if (category === "technical") return "Texnik";

  return "Murojaat";
}

function getStatusLabel(status: string | null) {
  if (status === "in_review") return "Ko‘rib chiqilmoqda";
  if (status === "answered") return "Javob berildi";
  if (status === "closed") return "Yopildi";

  return "Yangi";
}

function getStatusClass(status: string | null) {
  if (status === "answered") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "in_review") {
    return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
  }

  if (status === "closed") {
    return "border-slate-400/20 bg-slate-400/10 text-slate-400";
  }

  return "border-amber-400/25 bg-amber-400/10 text-amber-200";
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