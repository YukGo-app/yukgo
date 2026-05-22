"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCheck,
  MessageCircle,
  Package,
  Route,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  id: string;
  shipment_id: number | null;
  route_id: string | null;
  chat_type: string | null;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type Shipment = {
  id: number;
  from_city: string | null;
  to_city: string | null;
  status: string | null;
};

type DriverRoute = {
  id: string;
  from_location: string | null;
  to_location: string | null;
  status: string | null;
};

type UserProfile = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
};

type Conversation = {
  key: string;
  type: "shipment" | "route";
  relatedId: string;
  otherUserId: string;
  title: string;
  subtitle: string;
  personName: string;
  initials: string;
  lastMessage: string;
  lastTime: string;
  lastCreatedAt: string;
  unreadCount: number;
  isLastMine: boolean;
};

export default function MessagesPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [shipments, setShipments] = useState<Record<string, Shipment>>({});
  const [routes, setRoutes] = useState<Record<string, DriverRoute>>({});
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [deletingKey, setDeletingKey] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const loadMessages = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .select(
          "id, shipment_id, route_id, chat_type, sender_id, receiver_id, body, created_at, read_at"
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(400);

      if (!mounted) return;

      if (messageError) {
        console.error("Messages load error:", messageError.message);
        setCurrentUserId(userId);
        setMessages([]);
        setLoading(false);
        return;
      }

      const cleanMessages = (messageData ?? []) as ChatMessage[];

      const shipmentIds = Array.from(
        new Set(
          cleanMessages
            .filter((item) => item.chat_type !== "route" && item.shipment_id)
            .map((item) => Number(item.shipment_id))
        )
      );

      const routeIds = Array.from(
        new Set(
          cleanMessages
            .filter((item) => item.chat_type === "route" && item.route_id)
            .map((item) => String(item.route_id))
        )
      );

      const userIds = Array.from(
        new Set(
          cleanMessages.flatMap((item) => [item.sender_id, item.receiver_id])
        )
      ).filter((id) => id && id !== userId);

      let shipmentMap: Record<string, Shipment> = {};
      let routeMap: Record<string, DriverRoute> = {};
      let profileMap: Record<string, UserProfile> = {};

      if (shipmentIds.length > 0) {
        const { data: shipmentData, error: shipmentError } = await supabase
          .from("shipments")
          .select("id, from_city, to_city, status")
          .in("id", shipmentIds);

        if (!shipmentError && shipmentData) {
          shipmentMap = Object.fromEntries(
            (shipmentData as Shipment[]).map((item) => [String(item.id), item])
          );
        }
      }

      if (routeIds.length > 0) {
        const { data: routeData, error: routeError } = await supabase
          .from("driver_routes")
          .select("id, from_location, to_location, status")
          .in("id", routeIds);

        if (!routeError && routeData) {
          routeMap = Object.fromEntries(
            (routeData as DriverRoute[]).map((item) => [String(item.id), item])
          );
        }
      }

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        if (!profileError && profileData) {
          profileMap = Object.fromEntries(
            (profileData as UserProfile[]).map((item) => [item.id, item])
          );
        }
      }

      if (!mounted) return;

      setCurrentUserId(userId);
      setMessages(cleanMessages);
      setShipments(shipmentMap);
      setRoutes(routeMap);
      setProfiles(profileMap);
      setLoading(false);
    };

    const scheduleRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);

      refreshTimer = setTimeout(() => {
        loadMessages();
      }, 350);
    };

    loadMessages();

    const channel = supabase
      .channel("messages-list-premium-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
        },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      mounted = false;
      if (refreshTimer) window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [router]);

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();

    for (const message of messages) {
      const isRouteChat = message.chat_type === "route";
      const relatedId = isRouteChat
        ? message.route_id
          ? String(message.route_id)
          : ""
        : message.shipment_id
        ? String(message.shipment_id)
        : "";

      if (!relatedId) continue;

      const otherUserId =
        message.sender_id === currentUserId
          ? message.receiver_id
          : message.sender_id;

      if (!otherUserId) continue;

      const key = `${
        isRouteChat ? "route" : "shipment"
      }_${relatedId}_${otherUserId}`;

      if (map.has(key)) continue;

      const unreadCount = messages.filter((item) => {
        const itemIsRoute = item.chat_type === "route";
        const itemRelatedId = itemIsRoute
          ? item.route_id
            ? String(item.route_id)
            : ""
          : item.shipment_id
          ? String(item.shipment_id)
          : "";

        const itemOtherUserId =
          item.sender_id === currentUserId ? item.receiver_id : item.sender_id;

        return (
          itemRelatedId === relatedId &&
          itemOtherUserId === otherUserId &&
          item.receiver_id === currentUserId &&
          !item.read_at
        );
      }).length;

      const profile = profiles[otherUserId];
      const personName = getProfileName(profile, otherUserId);

      if (isRouteChat) {
        const route = routes[relatedId];

        map.set(key, {
          key,
          type: "route",
          relatedId,
          otherUserId,
          title: `${route?.from_location || "Boshlanish"} → ${
            route?.to_location || "Manzil"
          }`,
          subtitle: "Rota suhbati",
          personName,
          initials: getInitials(personName),
          lastMessage: message.body,
          lastTime: formatTime(message.created_at),
          lastCreatedAt: message.created_at,
          unreadCount,
          isLastMine: message.sender_id === currentUserId,
        });

        continue;
      }

      const shipment = shipments[relatedId];

      map.set(key, {
        key,
        type: "shipment",
        relatedId,
        otherUserId,
        title: `${shipment?.from_city || "Boshlanish"} → ${
          shipment?.to_city || "Manzil"
        }`,
        subtitle: "Yuk suhbati",
        personName,
        initials: getInitials(personName),
        lastMessage: message.body,
        lastTime: formatTime(message.created_at),
        lastCreatedAt: message.created_at,
        unreadCount,
        isLastMine: message.sender_id === currentUserId,
      });
    }

    const query = search.trim().toLowerCase();

    return Array.from(map.values())
      .filter((conversation) => {
        if (!query) return true;

        return (
          conversation.personName.toLowerCase().includes(query) ||
          conversation.title.toLowerCase().includes(query) ||
          conversation.subtitle.toLowerCase().includes(query) ||
          conversation.lastMessage.toLowerCase().includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.lastCreatedAt).getTime() -
          new Date(a.lastCreatedAt).getTime()
      );
  }, [messages, currentUserId, shipments, routes, profiles, search]);

  const unreadTotal = conversations.reduce(
    (total, item) => total + item.unreadCount,
    0
  );

  const routeCount = conversations.filter((item) => item.type === "route").length;

  const openConversation = (conversation: Conversation) => {
    if (conversation.type === "route") {
      router.push(
        `/chat/${conversation.relatedId}?type=route&user=${conversation.otherUserId}`
      );
      return;
    }

    router.push(`/chat/${conversation.relatedId}`);
  };

  const deleteConversation = async (conversation: Conversation) => {
    if (!currentUserId || deletingKey) return;

    const confirmed = window.confirm(
      "Bu suhbatdagi xabarlar o‘chirilsinmi? Bu amalni ortga qaytarib bo‘lmaydi."
    );

    if (!confirmed) return;

    setDeletingKey(conversation.key);

    let query = supabase
      .from("chat_messages")
      .delete()
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${conversation.otherUserId}),and(sender_id.eq.${conversation.otherUserId},receiver_id.eq.${currentUserId})`
      );

    if (conversation.type === "route") {
      query = query
        .eq("chat_type", "route")
        .eq("route_id", conversation.relatedId);
    } else {
      query = query.eq("shipment_id", Number(conversation.relatedId));
    }

    const { error } = await query;

    setDeletingKey("");

    if (error) {
      console.error("Conversation delete error:", error.message);
      window.alert("Suhbatni o‘chirishda xatolik yuz berdi.");
      return;
    }

    setMessages((prev) =>
      prev.filter((message) => {
        const isRouteChat = message.chat_type === "route";
        const relatedId = isRouteChat
          ? message.route_id
            ? String(message.route_id)
            : ""
          : message.shipment_id
          ? String(message.shipment_id)
          : "";

        const otherUserId =
          message.sender_id === currentUserId
            ? message.receiver_id
            : message.sender_id;

        return !(
          relatedId === conversation.relatedId &&
          otherUserId === conversation.otherUserId &&
          (conversation.type === "route") === isRouteChat
        );
      })
    );
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <section className="relative mx-auto max-w-md px-4 py-4 pb-36">
        <div className="pointer-events-none fixed inset-0 -z-0">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={() => router.push("/home")}
            className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-black text-slate-200 backdrop-blur-xl active:scale-95"
          >
            ← Orqaga
          </button>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black text-emerald-300">
            {unreadTotal > 0
              ? `${unreadTotal} yangi`
              : "Hammasi o‘qilgan"}
          </div>
        </div>

        <div className="relative z-10 mt-4 overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-3.5 shadow-[0_18px_70px_rgba(0,0,0,.3)]">
          <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-400/15 blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300">
                Suhbat markazi
              </p>

              <h1 className="mt-1 text-[24px] font-black leading-none">
                Xabarlar
              </h1>

              <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                Yuk va rota bo‘yicha suhbatlaringiz shu yerda xavfsiz
                saqlanadi.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/15 text-emerald-300">
              <MessageCircle size={20} />
            </div>
          </div>

          <div className="relative mt-3 grid grid-cols-3 gap-2">
            <MiniStat value={String(conversations.length)} label="suhbat" />
            <MiniStat value={String(unreadTotal)} label="yangi" />
            <MiniStat value={String(routeCount)} label="rota" />
          </div>
        </div>

        <div className="relative z-10 mt-3 rounded-[1.15rem] border border-amber-300/15 bg-amber-300/[0.07] px-3 py-2.5">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-200" />

            <p className="text-[11px] leading-4 text-amber-100/80">
              Suhbatlarda hurmat saqlang. Haqorat, spam, yolg‘on ma’lumot yoki
              platformadan noto‘g‘ri foydalanish aniqlansa, hisob cheklanishi
              mumkin.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-2 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-xl focus-within:border-emerald-300/40">
          <Search size={16} className="shrink-0 text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ism, rota yoki xabar qidiring..."
            className="w-full bg-transparent text-[12.5px] font-semibold text-white outline-none placeholder:text-slate-600"
          />

          {search ? (
            <button
              onClick={() => setSearch("")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-400 active:scale-95"
              aria-label="Qidiruvni tozalash"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="relative z-10 mt-4 overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.035] shadow-[0_20px_80px_rgba(0,0,0,.25)]">
          {loading ? (
            <>
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
            </>
          ) : conversations.length === 0 ? (
            <div className="p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-emerald-300">
                <MessageCircle size={25} />
              </div>

              <h2 className="mt-4 text-base font-black">
                Hozircha suhbat yo‘q
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Yuk yoki rota bo‘yicha xabar yozilganda suhbatlar shu yerda
                ko‘rinadi.
              </p>
            </div>
          ) : (
            conversations.map((conversation, index) => (
              <div
                key={conversation.key}
                className={`group relative ${
                  index !== conversations.length - 1
                    ? "border-b border-white/10"
                    : ""
                }`}
              >
                <button
                  onClick={() => openConversation(conversation)}
                  disabled={deletingKey === conversation.key}
                  className="flex w-full items-start gap-3 px-3 py-3.5 pr-12 text-left transition active:bg-white/[0.04] disabled:opacity-60"
                >
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-[14px] font-black ${
                        conversation.type === "route"
                          ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-200"
                          : "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                      }`}
                    >
                      {conversation.initials}
                    </div>

                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#050816] bg-[#111827] text-emerald-300">
                      {conversation.type === "route" ? (
                        <Route size={13} />
                      ) : (
                        <Package size={13} />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate text-[13.5px] font-black text-white">
                            {conversation.personName}
                          </h2>

                          <ShieldCheck
                            size={13}
                            className="shrink-0 text-emerald-300"
                          />
                        </div>

                        <p className="mt-0.5 truncate text-[10.5px] font-black text-emerald-300">
                          {conversation.title}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 text-[10px] font-bold ${
                          conversation.unreadCount > 0
                            ? "text-emerald-300"
                            : "text-slate-500"
                        }`}
                      >
                        {conversation.lastTime}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${
                          conversation.type === "route"
                            ? "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20"
                            : "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20"
                        }`}
                      >
                        {conversation.subtitle}
                      </span>

                      {conversation.isLastMine ? (
                        <CheckCheck
                          size={13}
                          className="shrink-0 text-slate-500"
                        />
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p
                        className={`line-clamp-1 text-[12px] leading-4 ${
                          conversation.unreadCount > 0
                            ? "font-bold text-slate-200"
                            : "text-slate-400"
                        }`}
                      >
                        {conversation.lastMessage || "Xabar mavjud emas."}
                      </p>

                      {conversation.unreadCount > 0 ? (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-black text-[#03120d] shadow-[0_0_14px_rgba(16,185,129,.65)]">
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteConversation(conversation);
                  }}
                  disabled={deletingKey === conversation.key}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/25 text-slate-500 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 active:scale-95 disabled:opacity-50"
                  aria-label="Suhbatni o‘chirish"
                  title="Suhbatni o‘chirish"
                >
                  {deletingKey === conversation.key ? (
                    <Archive size={15} />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <BottomNavbar />
    </main>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center">
      <div className="text-base font-black leading-none text-emerald-300">
        {value}
      </div>

      <div className="mt-1 text-[9px] font-semibold text-slate-500">
        {label}
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="border-b border-white/10 px-3 py-3.5 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-white/10" />

        <div className="min-w-0 flex-1">
          <div className="h-3.5 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function getProfileName(profile: UserProfile | undefined, userId: string) {
  const name =
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    profile?.email?.split("@")[0];

  if (name && name.trim()) return name.trim();

  return `Foydalanuvchi ${userId.slice(0, 4).toUpperCase()}`;
}

function getInitials(name: string) {
  const cleanName = name.trim();

  if (!cleanName) return "U";

  const parts = cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = parts.map((part) => part[0]).join("").toUpperCase();

  return initials || cleanName.slice(0, 1).toUpperCase();
}

function formatTime(date: string) {
  const messageDate = new Date(date);
  const today = new Date();

  const sameDay =
    messageDate.getFullYear() === today.getFullYear() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getDate() === today.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(messageDate);
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
  }).format(messageDate);
}