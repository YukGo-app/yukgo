"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  LockKeyhole,
  Package,
  Route,
  Send,
  ShieldCheck,
} from "lucide-react";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type ChatMode = "shipment" | "route";

type Shipment = {
  id: number;
  user_id: string;
  from_city: string | null;
  to_city: string | null;
  status: string | null;
};

type DriverRoute = {
  id: string;
  user_id: string;
  from_location: string | null;
  to_location: string | null;
  status: string | null;
};

type Offer = {
  id: string;
  shipment_id: number;
  carrier_id: string;
  sender_id: string | null;
  status: string;
};

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

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const rawId = String(params.id || "");
  const chatMode: ChatMode =
    searchParams.get("type") === "route" ? "route" : "shipment";

  const shipmentId = Number(rawId);
  const routeId = rawId;

  const [currentUserId, setCurrentUserId] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [conversationOffer, setConversationOffer] = useState<Offer | null>(
    null
  );
  const [routeOtherUserId, setRouteOtherUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectingCarrier, setSelectingCarrier] = useState(false);
  const [error, setError] = useState("");

  const senderId = conversationOffer?.sender_id || shipment?.user_id || "";
  const carrierId = conversationOffer?.carrier_id || "";

  const isShipmentOwner = Boolean(
    chatMode === "shipment" &&
      currentUserId &&
      shipment?.user_id === currentUserId
  );

  const isShipmentCarrier = Boolean(
    chatMode === "shipment" &&
      currentUserId &&
      carrierId &&
      currentUserId === carrierId
  );

  const isRouteOwner = Boolean(
    chatMode === "route" && currentUserId && route?.user_id === currentUserId
  );

  const otherUserId = useMemo(() => {
    if (chatMode === "route") return routeOtherUserId;
    if (!currentUserId || !senderId || !carrierId) return "";
    return currentUserId === carrierId ? senderId : carrierId;
  }, [chatMode, routeOtherUserId, currentUserId, senderId, carrierId]);

  const canWrite = Boolean(
    currentUserId &&
      otherUserId &&
      ((chatMode === "shipment" &&
        shipment &&
        conversationOffer &&
        (isShipmentOwner || isShipmentCarrier) &&
        ["pending", "accepted"].includes(conversationOffer.status) &&
        shipment.status !== "cancelled" &&
        shipment.status !== "completed") ||
        (chatMode === "route" && route && route.status === "active"))
  );

  const canSelectCarrier = Boolean(
    chatMode === "shipment" &&
      isShipmentOwner &&
      shipment?.status === "open" &&
      conversationOffer?.status === "pending" &&
      carrierId
  );

  useEffect(() => {
    let mounted = true;

    const markConversationAsRead = async (
      userId: string,
      realOtherUserId: string
    ) => {
      if (!userId || !realOtherUserId) return;

      let query = supabase
        .from("chat_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", userId)
        .eq("sender_id", realOtherUserId)
        .is("read_at", null);

      if (chatMode === "route") {
        query = query.eq("chat_type", "route").eq("route_id", routeId);
      } else {
        query = query.eq("shipment_id", shipmentId);
      }

      const { error: readError } = await query;

      if (readError) {
        console.error("Mark chat read error:", readError.message);
      }
    };

    const loadChat = async () => {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (!rawId) {
        router.replace("/home");
        return;
      }

      if (chatMode === "route") {
        const { data: routeData, error: routeError } = await supabase
          .from("driver_routes")
          .select("id, user_id, from_location, to_location, status")
          .eq("id", routeId)
          .single();

        if (routeError || !routeData) {
          router.replace("/routes");
          return;
        }

        let realOtherUserId = "";

        if (routeData.user_id === session.user.id) {
          const queryUser = searchParams.get("user");

          if (queryUser && queryUser !== session.user.id) {
            realOtherUserId = queryUser;
          } else {
            const { data: latestMessage } = await supabase
              .from("chat_messages")
              .select("sender_id, receiver_id")
              .eq("chat_type", "route")
              .eq("route_id", routeId)
              .or(
                `sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`
              )
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (latestMessage) {
              realOtherUserId =
                latestMessage.sender_id === session.user.id
                  ? latestMessage.receiver_id
                  : latestMessage.sender_id;
            }
          }
        } else {
          realOtherUserId = routeData.user_id;
        }

        if (!realOtherUserId || realOtherUserId === session.user.id) {
          router.replace("/routes");
          return;
        }

        await markConversationAsRead(session.user.id, realOtherUserId);

        const { data: messageData, error: messageError } = await supabase
          .from("chat_messages")
          .select(
            "id, shipment_id, route_id, chat_type, sender_id, receiver_id, body, created_at, read_at"
          )
          .eq("chat_type", "route")
          .eq("route_id", routeId)
          .or(
            `and(sender_id.eq.${session.user.id},receiver_id.eq.${realOtherUserId}),and(sender_id.eq.${realOtherUserId},receiver_id.eq.${session.user.id})`
          )
          .order("created_at", { ascending: true });

        if (messageError) {
          setError("Xabarlar yuklanmadi. Qayta urinib ko‘ring.");
        }

        if (mounted) {
          setCurrentUserId(session.user.id);
          setRoute(routeData as DriverRoute);
          setRouteOtherUserId(realOtherUserId);
          setMessages((messageData || []) as ChatMessage[]);
          setLoading(false);
        }

        return;
      }

      if (!shipmentId || Number.isNaN(shipmentId)) {
        router.replace("/home");
        return;
      }

      const { data: shipmentData, error: shipmentError } = await supabase
        .from("shipments")
        .select("id, user_id, from_city, to_city, status")
        .eq("id", shipmentId)
        .single();

      if (shipmentError || !shipmentData) {
        router.replace("/home");
        return;
      }

      const ownerViewing = shipmentData.user_id === session.user.id;
      let offerData: Offer | null = null;

      if (ownerViewing) {
        const { data: ownerOffers, error: ownerOfferError } = await supabase
          .from("offers")
          .select("id, shipment_id, carrier_id, sender_id, status")
          .eq("shipment_id", shipmentId)
          .in("status", ["accepted", "pending"])
          .order("created_at", { ascending: false });

        if (ownerOfferError || !ownerOffers || ownerOffers.length === 0) {
          router.replace(`/shipments/${shipmentId}`);
          return;
        }

        offerData =
          (ownerOffers.find((offer) => offer.status === "accepted") as
            | Offer
            | undefined) || (ownerOffers[0] as Offer);
      } else {
        const { data: carrierOffer, error: carrierOfferError } = await supabase
          .from("offers")
          .select("id, shipment_id, carrier_id, sender_id, status")
          .eq("shipment_id", shipmentId)
          .eq("carrier_id", session.user.id)
          .in("status", ["accepted", "pending"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (carrierOfferError || !carrierOffer) {
          router.replace(`/shipments/${shipmentId}`);
          return;
        }

        offerData = carrierOffer as Offer;
      }

      const realSenderId = offerData.sender_id || shipmentData.user_id;
      const realOtherUserId = getOtherUserId(
        session.user.id,
        realSenderId,
        offerData.carrier_id
      );

      const canOpenChat =
        realSenderId === session.user.id ||
        offerData.carrier_id === session.user.id ||
        shipmentData.user_id === session.user.id;

      if (!canOpenChat || !realOtherUserId) {
        router.replace("/home");
        return;
      }

      await markConversationAsRead(session.user.id, realOtherUserId);

      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .select(
          "id, shipment_id, route_id, chat_type, sender_id, receiver_id, body, created_at, read_at"
        )
        .eq("shipment_id", shipmentId)
        .or(
          `and(sender_id.eq.${session.user.id},receiver_id.eq.${realOtherUserId}),and(sender_id.eq.${realOtherUserId},receiver_id.eq.${session.user.id})`
        )
        .order("created_at", { ascending: true });

      if (messageError) {
        setError("Xabarlar yuklanmadi. Qayta urinib ko‘ring.");
      }

      if (mounted) {
        setCurrentUserId(session.user.id);
        setShipment(shipmentData as Shipment);
        setConversationOffer({
          ...offerData,
          sender_id: realSenderId,
        });
        setMessages((messageData || []) as ChatMessage[]);
        setLoading(false);
      }
    };

    loadChat();

    return () => {
      mounted = false;
    };
  }, [rawId, chatMode, routeId, shipmentId, router, searchParams]);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const markIncomingMessageAsRead = async (message: ChatMessage) => {
      if (
        message.receiver_id !== currentUserId ||
        message.sender_id !== otherUserId ||
        message.read_at
      ) {
        return;
      }

      const readAt = new Date().toISOString();

      const { error: readError } = await supabase
        .from("chat_messages")
        .update({ read_at: readAt })
        .eq("id", message.id)
        .eq("receiver_id", currentUserId)
        .is("read_at", null);

      if (readError) {
        console.error("Incoming message read error:", readError.message);
        return;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id ? { ...item, read_at: readAt } : item
        )
      );
    };

    const channelName =
      chatMode === "route"
        ? `chat-route-${routeId}-${currentUserId}-${otherUserId}`
        : `chat-shipment-${shipmentId}-${currentUserId}-${otherUserId}`;

    const filter =
      chatMode === "route"
        ? `route_id=eq.${routeId}`
        : `shipment_id=eq.${shipmentId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldMessage = payload.old as Pick<ChatMessage, "id">;

            setMessages((prev) =>
              prev.filter((message) => message.id !== oldMessage.id)
            );

            return;
          }

          const newMessage = payload.new as ChatMessage;

          if (chatMode === "route" && newMessage.chat_type !== "route") return;

          const belongsToThisChat =
            (newMessage.sender_id === currentUserId &&
              newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId &&
              newMessage.receiver_id === currentUserId);

          if (!belongsToThisChat) return;

          setMessages((prev) => {
            if (payload.eventType === "UPDATE") {
              return prev.map((message) =>
                message.id === newMessage.id ? newMessage : message
              );
            }

            if (prev.some((message) => message.id === newMessage.id)) {
              return prev;
            }

            return [...prev, newMessage];
          });

          if (payload.eventType === "INSERT") {
            markIncomingMessageAsRead(newMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatMode, shipmentId, routeId, currentUserId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBack = () => {
    router.push("/messages");
  };

  const handleSelectCarrier = async () => {
    if (
      chatMode !== "shipment" ||
      !shipment ||
      !conversationOffer ||
      !isShipmentOwner ||
      !carrierId ||
      shipment.status !== "open" ||
      conversationOffer.status !== "pending" ||
      selectingCarrier
    ) {
      return;
    }

    setSelectingCarrier(true);
    setError("");

    const { error: acceptError } = await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", conversationOffer.id)
      .eq("sender_id", currentUserId)
      .eq("status", "pending");

    if (acceptError) {
      setError("Tashuvchini tanlab bo‘lmadi.");
      setSelectingCarrier(false);
      return;
    }

    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("shipment_id", shipment.id)
      .neq("id", conversationOffer.id)
      .eq("status", "pending");

    const { error: shipmentError } = await supabase
      .from("shipments")
      .update({ status: "in_transit" })
      .eq("id", shipment.id)
      .eq("user_id", currentUserId)
      .eq("status", "open");

    if (shipmentError) {
      setError("Yuk holatini yangilab bo‘lmadi.");
      setSelectingCarrier(false);
      return;
    }

    const { data: insertedMessage } = await supabase
      .from("chat_messages")
      .insert({
        chat_type: "shipment",
        shipment_id: shipment.id,
        route_id: null,
        sender_id: currentUserId,
        receiver_id: carrierId,
        body: "Sizni tashuvchi sifatida tanladim. Yetkazish tafsilotlarini shu suhbatda kelishamiz.",
        read_at: null,
      })
      .select(
        "id, shipment_id, route_id, chat_type, sender_id, receiver_id, body, created_at, read_at"
      )
      .single();

    if (insertedMessage) {
      setMessages((prev) => {
        if (prev.some((message) => message.id === insertedMessage.id)) {
          return prev;
        }

        return [...prev, insertedMessage as ChatMessage];
      });
    }

    setShipment((prev) => (prev ? { ...prev, status: "in_transit" } : prev));
    setConversationOffer((prev) =>
      prev ? { ...prev, status: "accepted" } : prev
    );
    setSelectingCarrier(false);
  };

  const handleSend = async () => {
    const cleanText = text.trim();

    if (!cleanText || !otherUserId || sending) {
      return;
    }

    if (!canWrite) {
      setError("Bu suhbatga yozish huquqingiz yo‘q.");
      return;
    }

    setSending(true);
    setError("");

    const insertPayload =
      chatMode === "route"
        ? {
            chat_type: "route",
            shipment_id: null,
            route_id: route?.id || routeId,
            sender_id: currentUserId,
            receiver_id: otherUserId,
            body: cleanText.slice(0, 1000),
            read_at: null,
          }
        : {
            chat_type: "shipment",
            shipment_id: shipment?.id ?? null,
            route_id: null,
            sender_id: currentUserId,
            receiver_id: otherUserId,
            body: cleanText.slice(0, 1000),
            read_at: null,
          };

    const { data: insertedMessage, error: sendError } = await supabase
      .from("chat_messages")
      .insert(insertPayload as any)
      .select(
        "id, shipment_id, route_id, chat_type, sender_id, receiver_id, body, created_at, read_at"
      )
      .single();

    if (sendError || !insertedMessage) {
      setError("Xabar yuborilmadi. Qayta urinib ko‘ring.");
      setSending(false);
      return;
    }

    setMessages((prev) => {
      if (prev.some((message) => message.id === insertedMessage.id)) {
        return prev;
      }

      return [...prev, insertedMessage as ChatMessage];
    });

    setText("");
    setSending(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const title =
    chatMode === "route"
      ? `${route?.from_location || "Boshlanish"} → ${
          route?.to_location || "Manzil"
        }`
      : `${shipment?.from_city || "Boshlanish"} → ${
          shipment?.to_city || "Manzil"
        }`;

  const subtitle =
    chatMode === "route"
      ? isRouteOwner
        ? "Siz ochgan rota bo‘yicha suhbat"
        : "Rota egasi bilan suhbat"
      : conversationOffer?.status === "accepted"
      ? "Tanlangan tashuvchi bilan suhbat"
      : "Yuk bo‘yicha suhbat";

  const modeLabel = chatMode === "route" ? "Rota suhbati" : "Yuk suhbati";

  const avatarText =
    chatMode === "route"
      ? isRouteOwner
        ? "R"
        : "Y"
      : isShipmentCarrier
      ? "T"
      : "Y";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] px-5 py-8 text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          Chat yuklanmoqda...
        </div>
      </main>
    );
  }

  if (chatMode === "shipment" && (!shipment || !conversationOffer)) return null;
  if (chatMode === "route" && !route) return null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <section className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-[#070b18] pb-[104px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-36 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/[0.055] blur-3xl" />
          <div className="absolute bottom-32 right-[-120px] h-64 w-64 rounded-full bg-cyan-400/[0.055] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.28) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
        </div>

        <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#070b18]/92 px-4 py-3 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 active:scale-95"
              aria-label="Orqaga"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/15 text-sm font-black text-emerald-300">
              {avatarText}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-black leading-5">
                {title}
              </h1>

              <p className="mt-0.5 truncate text-[11px] font-bold text-emerald-300">
                {subtitle}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-300">
              {chatMode === "route" ? (
                <Route size={19} />
              ) : (
                <Package size={19} />
              )}
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="shrink-0 text-emerald-300" />

                <p className="line-clamp-1 text-[10.5px] font-semibold text-slate-300">
                  {modeLabel} · Hurmatli va aniq muloqot qiling.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 text-[10px] font-black text-emerald-300">
              <LockKeyhole size={12} />
              Xavfsiz
            </div>
          </div>
        </header>

        {error ? (
          <div className="relative z-10 mx-4 mt-3 shrink-0 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs font-bold text-red-300">
            {error}
          </div>
        ) : null}

        {canSelectCarrier ? (
          <div className="relative z-10 mx-3 mt-3 shrink-0 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
            <p className="text-xs leading-5 text-slate-300">
              Bu tashuvchi sizga yozgan. Mos deb topsangiz, shu suhbatdan
              tanlab yetkazishni boshlashingiz mumkin.
            </p>

            <button
              onClick={handleSelectCarrier}
              disabled={selectingCarrier}
              className="mt-3 h-10 w-full rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d] disabled:opacity-60"
            >
              {selectingCarrier ? "Tanlanmoqda..." : "Bu tashuvchini tanlash"}
            </button>
          </div>
        ) : null}

        <div className="chat-scroll relative z-10 flex-1 overflow-y-auto px-3 py-4">
          {messages.length === 0 ? (
            <div className="mx-auto mt-16 max-w-[270px] rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center shadow-[0_20px_70px_rgba(0,0,0,.25)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                {chatMode === "route" ? (
                  <Route size={22} />
                ) : (
                  <Package size={22} />
                )}
              </div>

              <h2 className="mt-3 text-sm font-black">Hali xabar yo‘q</h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Tafsilotlarni kelishish uchun xabar yozing.
              </p>
            </div>
          ) : (
            <div className="space-y-1 pb-2">
              {messages.map((message, index) => {
                const mine = message.sender_id === currentUserId;
                const previousMessage = messages[index - 1];
                const sameSenderAsPrevious =
                  previousMessage?.sender_id === message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      mine ? "justify-end" : "justify-start"
                    } ${sameSenderAsPrevious ? "pt-1" : "pt-3"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-[1.25rem] px-3.5 py-2.5 text-[14px] leading-5 shadow-[0_12px_34px_rgba(0,0,0,.2)] ${
                        mine
                          ? "rounded-br-md bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#02130d]"
                          : "rounded-bl-md border border-white/10 bg-[#111827]/95 text-slate-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.body}
                      </p>

                      <div
                        className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] leading-none ${
                          mine ? "text-[#02130d]/60" : "text-slate-500"
                        }`}
                      >
                        <span>{formatTime(message.created_at)}</span>

                        {mine ? (
                          <span className="inline-flex items-center">
                            {message.read_at ? (
                              <CheckCheck size={12} />
                            ) : (
                              "✓"
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="relative z-30 shrink-0 border-t border-white/5 bg-[#070b18]/96 px-3 pb-3 pt-2 backdrop-blur-2xl">
          <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.055] p-2 shadow-[0_16px_70px_rgba(0,0,0,.35)]">
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                rows={1}
                placeholder="Xabar yozing..."
                disabled={!canWrite || sending}
                className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
              />

              <button
                onClick={handleSend}
                disabled={sending || !text.trim() || !canWrite}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-[#02130d] shadow-lg shadow-emerald-400/20 active:scale-95 disabled:opacity-50"
                aria-label="Xabar yuborish"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#02130d] border-t-transparent" />
                ) : (
                  <Send size={17} fill="currentColor" />
                )}
              </button>
            </div>

            {!canWrite ? (
              <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-500">
                Bu suhbat hozir yozish uchun yopiq.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <BottomNavbar />

      <style jsx>{`
        .chat-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .chat-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}

function getOtherUserId(
  currentUserId: string,
  senderId: string,
  carrierId: string
) {
  return currentUserId === carrierId ? senderId : carrierId;
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}