"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";
import { supabase } from "@/lib/supabase";

type Shipment = {
  id: number;
  user_id: string;
  from_city: string | null;
  to_city: string | null;
  description: string | null;
  price: number | null;
  status: string | null;
  created_at: string | null;
};

type Offer = {
  id: string;
  shipment_id: number;
  carrier_id: string;
  sender_id: string;
  price: number;
  delivery_time: string;
  note: string | null;
  status: string;
  created_at: string;
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const shipmentId = Number(params.id);

  const [currentUserId, setCurrentUserId] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  const [messagePrice, setMessagePrice] = useState("");
  const [messageTime, setMessageTime] = useState("");
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectingCarrierId, setSelectingCarrierId] = useState("");
  const [cancellingShipment, setCancellingShipment] = useState(false);
  const [deletingShipment, setDeletingShipment] = useState(false);
  const [message, setMessage] = useState("");

  const isOwner = shipment?.user_id === currentUserId;
  const acceptedOffer = offers.find((offer) => offer.status === "accepted");

  const alreadyStartedConversation = offers.some(
    (offer) =>
      offer.carrier_id === currentUserId &&
      ["pending", "accepted"].includes(offer.status)
  );

  const visibleConversations = offers.filter((offer) =>
    ["pending", "accepted", "rejected", "cancelled"].includes(offer.status)
  );

  const descriptionLines = useMemo(() => {
    if (!shipment?.description) return [];

    return shipment.description
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [shipment?.description]);

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (mounted) {
        setCurrentUserId(session.user.id);
      }

      const { data: shipmentData, error: shipmentError } = await supabase
        .from("shipments")
        .select(
          "id, user_id, from_city, to_city, description, price, status, created_at"
        )
        .eq("id", shipmentId)
        .single();

      if (shipmentError || !shipmentData) {
        router.replace("/home");
        return;
      }

      const { data: offerData, error: offerError } = await supabase
        .from("offers")
        .select(
          "id, shipment_id, carrier_id, sender_id, price, delivery_time, note, status, created_at"
        )
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false });

      if (offerError) {
        console.error("Conversations load error:", offerError.message);
      }

      if (mounted) {
        setShipment(shipmentData as Shipment);
        setOffers((offerData || []) as Offer[]);
        setLoading(false);
      }
    };

    if (!shipmentId || Number.isNaN(shipmentId)) {
      router.replace("/home");
      return;
    }

    loadPage();

    const channel = supabase
      .channel(`shipment-detail-${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        loadPage
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
          filter: `id=eq.${shipmentId}`,
        },
        loadPage
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [shipmentId, router]);

  const handleStartConversation = async () => {
    setMessage("");

    if (!shipment || !currentUserId || sendingMessage) return;

    if (isOwner) {
      setMessage("O‘z yukingiz uchun xabar yubora olmaysiz.");
      return;
    }

    if (shipment.status !== "open") {
      setMessage("Bu yuk hozir yangi suhbat qabul qilmaydi.");
      return;
    }

    if (alreadyStartedConversation) {
      router.push(`/chat/${shipment.id}`);
      return;
    }

    const cleanPrice = Number(messagePrice.replace(/\s/g, ""));
    const cleanTime = messageTime.trim();
    const cleanText = messageText.trim();

    if (!cleanPrice || cleanPrice < 1000 || cleanPrice > 100000000) {
      setMessage("Narxni to‘g‘ri kiriting.");
      return;
    }

    if (cleanTime.length < 3) {
      setMessage("Yetkazish vaqtini kiriting.");
      return;
    }

    if (cleanText.length < 8) {
      setMessage("Yuk egasiga qisqa va aniq xabar yozing.");
      return;
    }

    setSendingMessage(true);

    const { data: insertedOffer, error: offerError } = await supabase
      .from("offers")
      .insert({
        shipment_id: shipment.id,
        carrier_id: currentUserId,
        sender_id: shipment.user_id,
        price: cleanPrice,
        delivery_time: cleanTime.slice(0, 60),
        note: cleanText.slice(0, 400),
        status: "pending",
      })
      .select(
        "id, shipment_id, carrier_id, sender_id, price, delivery_time, note, status, created_at"
      )
      .single();

    if (offerError || !insertedOffer) {
      setMessage("Xabar yuborilmadi. Qayta urinib ko‘ring.");
      setSendingMessage(false);
      return;
    }

    const firstMessage = createFirstChatMessage({
      text: cleanText,
      price: cleanPrice,
      time: cleanTime,
    });

    const { error: chatError } = await supabase.from("chat_messages").insert({
      shipment_id: shipment.id,
      sender_id: currentUserId,
      receiver_id: shipment.user_id,
      body: firstMessage,
    });

    if (chatError) {
      await supabase.from("offers").delete().eq("id", insertedOffer.id);

      setMessage("Xabar chatga yuborilmadi. Qayta urinib ko‘ring.");
      setSendingMessage(false);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: shipment.user_id,
      title: "Yangi xabar",
      body: `${shipment.from_city || "Boshlanish"} → ${
        shipment.to_city || "Manzil"
      } bo‘yicha tashuvchidan yangi xabar keldi.`,
      type: "chat_message",
      related_id: shipment.id,
      is_read: false,
    });

    setOffers((prev) => [insertedOffer as Offer, ...prev]);
    setMessagePrice("");
    setMessageTime("");
    setMessageText("");
    setSendingMessage(false);

    router.push(`/chat/${shipment.id}`);
  };

  const handleSelectCarrier = async (offer: Offer) => {
    if (!shipment || !isOwner || shipment.status !== "open") return;

    setSelectingCarrierId(offer.id);
    setMessage("");

    const { error: acceptError } = await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offer.id)
      .eq("sender_id", currentUserId)
      .eq("status", "pending");

    if (acceptError) {
      setMessage("Tashuvchini tanlab bo‘lmadi.");
      setSelectingCarrierId("");
      return;
    }

    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("shipment_id", shipment.id)
      .neq("id", offer.id)
      .eq("status", "pending");

    const { error: shipmentError } = await supabase
      .from("shipments")
      .update({ status: "in_transit" })
      .eq("id", shipment.id)
      .eq("user_id", currentUserId)
      .eq("status", "open");

    if (shipmentError) {
      setMessage("Yuk holatini yangilab bo‘lmadi.");
      setSelectingCarrierId("");
      return;
    }

    await supabase.from("chat_messages").insert({
      shipment_id: shipment.id,
      sender_id: currentUserId,
      receiver_id: offer.carrier_id,
      body: "Sizni tashuvchi sifatida tanladim. Yetkazish tafsilotlarini shu chatda kelishamiz.",
    });

    await supabase.from("notifications").insert({
      user_id: offer.carrier_id,
      title: "Siz tanlandingiz",
      body: `${shipment.from_city || "Boshlanish"} → ${
        shipment.to_city || "Manzil"
      } bo‘yicha siz tashuvchi sifatida tanlandingiz.`,
      type: "chat_message",
      related_id: shipment.id,
      is_read: false,
    });

    setShipment((prev) => (prev ? { ...prev, status: "in_transit" } : prev));

    setOffers((prev) =>
      prev.map((item) =>
        item.id === offer.id
          ? { ...item, status: "accepted" }
          : item.status === "pending"
          ? { ...item, status: "rejected" }
          : item
      )
    );

    setSelectingCarrierId("");
    router.push(`/chat/${shipment.id}`);
  };

  const handleCompleteShipment = async () => {
    if (!shipment || !isOwner || shipment.status !== "in_transit") return;

    setMessage("");

    const { error } = await supabase
      .from("shipments")
      .update({ status: "completed" })
      .eq("id", shipment.id)
      .eq("user_id", currentUserId)
      .eq("status", "in_transit");

    if (error) {
      setMessage("Yukni yakunlab bo‘lmadi.");
      return;
    }

    if (acceptedOffer) {
      await supabase.from("notifications").insert({
        user_id: acceptedOffer.carrier_id,
        title: "Yuk yetkazildi",
        body: `${shipment.from_city || "Boshlanish"} → ${
          shipment.to_city || "Manzil"
        } yuk yetkazilgan deb belgilandi.`,
        type: "shipment_completed",
        related_id: shipment.id,
        is_read: false,
      });
    }

    setShipment((prev) => (prev ? { ...prev, status: "completed" } : prev));
    setMessage("Yuk muvaffaqiyatli yakunlandi.");
  };

  const handleCancelShipment = async () => {
    if (
      !shipment ||
      !isOwner ||
      !["open", "in_transit"].includes(shipment.status || "")
    ) {
      return;
    }

    setCancellingShipment(true);
    setMessage("");

    const { error } = await supabase
      .from("shipments")
      .update({ status: "cancelled" })
      .eq("id", shipment.id)
      .eq("user_id", currentUserId);

    if (error) {
      setMessage("Yuk bekor qilinmadi.");
      setCancellingShipment(false);
      return;
    }

    await supabase
      .from("offers")
      .update({ status: "cancelled" })
      .eq("shipment_id", shipment.id)
      .neq("status", "accepted");

    if (acceptedOffer) {
      await supabase.from("notifications").insert({
        user_id: acceptedOffer.carrier_id,
        title: "Yuk bekor qilindi",
        body: `${shipment.from_city || "Boshlanish"} → ${
          shipment.to_city || "Manzil"
        } yuk bekor qilindi.`,
        type: "shipment_cancelled",
        related_id: shipment.id,
        is_read: false,
      });
    }

    setShipment((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    setMessage("Yuk bekor qilindi.");
    setCancellingShipment(false);
  };

  const handleDeleteShipment = async () => {
    if (!shipment || !isOwner || deletingShipment) return;

    if (shipment.status === "in_transit") {
      setMessage(
        "Yo‘ldagi yukni o‘chirib bo‘lmaydi. Avval bekor qiling yoki yakunlang."
      );
      return;
    }

    setDeletingShipment(true);
    setMessage("");

    const { error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", shipment.id)
      .eq("user_id", currentUserId);

    if (error) {
      setMessage("Yuk o‘chirilmadi.");
      setDeletingShipment(false);
      return;
    }

    router.replace("/jobs");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] px-5 py-8 text-white">
        <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          Yuklanmoqda...
        </div>
      </main>
    );
  }

  if (!shipment) return null;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-md px-5 py-6 pb-28">
        <button
          onClick={() => router.push(isOwner ? "/jobs" : "/home")}
          className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold"
        >
          ← Geri
        </button>

        {message ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
            {message}
          </div>
        ) : null}

        <div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              {getShipmentStatus(shipment.status)}
            </span>

            <span className="text-xs text-slate-400">
              #{String(shipment.id).slice(0, 8)}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black leading-tight">
            {shipment.from_city || "Boshlanish"} →{" "}
            {shipment.to_city || "Manzil"}
          </h1>

          <div className="mt-5 space-y-2">
            {descriptionLines.length > 0 ? (
              descriptionLines.map((line, index) => (
                <div
                  key={`${line}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200"
                >
                  {line}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
                Yuk tafsilotlari kiritilmagan.
              </div>
            )}
          </div>
        </div>

        {isOwner ? (
          <OwnerContent
            shipment={shipment}
            conversations={visibleConversations}
            acceptedOffer={acceptedOffer}
            selectingCarrierId={selectingCarrierId}
            cancellingShipment={cancellingShipment}
            deletingShipment={deletingShipment}
            onOpenChat={() => router.push(`/chat/${shipment.id}`)}
            onSelectCarrier={handleSelectCarrier}
            onCompleteShipment={handleCompleteShipment}
            onCancelShipment={handleCancelShipment}
            onDeleteShipment={handleDeleteShipment}
          />
        ) : (
          <CarrierContent
            shipment={shipment}
            alreadyStartedConversation={alreadyStartedConversation}
            sendingMessage={sendingMessage}
            messagePrice={messagePrice}
            messageTime={messageTime}
            messageText={messageText}
            onPriceChange={setMessagePrice}
            onTimeChange={setMessageTime}
            onTextChange={setMessageText}
            onStartConversation={handleStartConversation}
            onOpenChat={() => router.push(`/chat/${shipment.id}`)}
          />
        )}
      </section>

      <BottomNavbar />
    </main>
  );
}

function OwnerContent({
  shipment,
  conversations,
  acceptedOffer,
  selectingCarrierId,
  cancellingShipment,
  deletingShipment,
  onOpenChat,
  onSelectCarrier,
  onCompleteShipment,
  onCancelShipment,
  onDeleteShipment,
}: {
  shipment: Shipment;
  conversations: Offer[];
  acceptedOffer: Offer | undefined;
  selectingCarrierId: string;
  cancellingShipment: boolean;
  deletingShipment: boolean;
  onOpenChat: () => void;
  onSelectCarrier: (offer: Offer) => void;
  onCompleteShipment: () => void;
  onCancelShipment: () => void;
  onDeleteShipment: () => void;
}) {
  return (
    <>
      <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">E’lon boshqaruvi</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Tashuvchilar bilan suhbat qiling, mos odamni tanlang va
              yetkazishni boshqaring.
            </p>
          </div>

          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
            Egasi
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onCancelShipment}
            disabled={
              cancellingShipment ||
              shipment.status === "completed" ||
              shipment.status === "cancelled"
            }
            className="h-12 rounded-2xl border border-amber-400/20 bg-amber-400/10 text-sm font-black text-amber-200 disabled:opacity-50"
          >
            {cancellingShipment ? "Bekor qilinmoqda..." : "Bekor qilish"}
          </button>

          <button
            onClick={onDeleteShipment}
            disabled={deletingShipment || shipment.status === "in_transit"}
            className="h-12 rounded-2xl border border-red-400/20 bg-red-400/10 text-sm font-black text-red-300 disabled:opacity-50"
          >
            {deletingShipment ? "O‘chirilmoqda..." : "O‘chirish"}
          </button>
        </div>
      </div>

      {acceptedOffer ? (
        <div className="mt-5 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-300">
            Tanlangan tashuvchi
          </div>

          <div className="mt-2 text-2xl font-black text-white">
            {acceptedOffer.price.toLocaleString("uz-UZ")} so‘m
          </div>

          <div className="mt-1 text-sm text-slate-300">
            {acceptedOffer.delivery_time}
          </div>

          <button
            onClick={onOpenChat}
            className="mt-4 h-12 w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-200"
          >
            Suhbatni ochish
          </button>

          {shipment.status === "in_transit" ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={onCompleteShipment}
                className="h-12 rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d]"
              >
                Yetkazildi
              </button>

              <button
                onClick={onCancelShipment}
                disabled={cancellingShipment}
                className="h-12 rounded-2xl border border-red-400/20 bg-red-400/10 text-sm font-black text-red-300 disabled:opacity-60"
              >
                {cancellingShipment ? "Bekor qilinmoqda..." : "Bekor qilish"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Suhbatlar</h2>

          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
            {conversations.length} ta
          </span>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Tashuvchilar yozgan xabarlar shu yerda ko‘rinadi. Uygun odamni
          tanlab yetkazishni boshlang.
        </p>

        <div className="mt-5 space-y-3">
          {conversations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-black text-white">
                Hozircha xabar kelmadi
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Tashuvchi sizga yozganda bu yerda suhbat sifatida ko‘rinadi.
              </p>
            </div>
          ) : (
            conversations.map((offer) => (
              <div
                key={offer.id}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-sm font-black text-emerald-300">
                    T
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-white">
                          Tashuvchi xabari
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">
                          {offer.note || "Xabar yozilmagan."}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-slate-300">
                        {getOfferStatus(offer.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                      <span>{offer.price.toLocaleString("uz-UZ")} so‘m</span>
                      <span>{offer.delivery_time}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={onOpenChat}
                    className="h-11 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-200"
                  >
                    Suhbat
                  </button>

                  {offer.status === "pending" && shipment.status === "open" ? (
                    <button
                      onClick={() => onSelectCarrier(offer)}
                      disabled={selectingCarrierId === offer.id}
                      className="h-11 rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d] disabled:opacity-60"
                    >
                      {selectingCarrierId === offer.id
                        ? "Tanlanmoqda..."
                        : "Tanlash"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-slate-500"
                    >
                      {getOfferStatus(offer.status)}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function CarrierContent({
  shipment,
  alreadyStartedConversation,
  sendingMessage,
  messagePrice,
  messageTime,
  messageText,
  onPriceChange,
  onTimeChange,
  onTextChange,
  onStartConversation,
  onOpenChat,
}: {
  shipment: Shipment;
  alreadyStartedConversation: boolean;
  sendingMessage: boolean;
  messagePrice: string;
  messageTime: string;
  messageText: string;
  onPriceChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onStartConversation: () => void;
  onOpenChat: () => void;
}) {
  if (alreadyStartedConversation) {
    return (
      <div className="mt-5 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
        <h2 className="text-2xl font-black">Suhbat boshlangan</h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Bu yuk egasi bilan suhbat allaqachon ochilgan. Yangi xabar yozish
          uchun suhbat ekraniga o‘ting.
        </p>

        <button
          onClick={onOpenChat}
          className="mt-5 h-14 w-full rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d]"
        >
          Suhbatni davom ettirish
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-2xl font-black">Yuk egasiga yozish</h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Narx, vaqt va xabaringiz bitta suhbat sifatida yuboriladi.
      </p>

      <div className="mt-5 space-y-4">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Narx, masalan 45000"
          value={messagePrice}
          onChange={(event) => onPriceChange(event.target.value)}
          disabled={shipment.status !== "open"}
          className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none focus:border-emerald-400/40 disabled:opacity-50"
        />

        <input
          type="text"
          maxLength={60}
          placeholder="Vaqt, masalan Bugun 18:00"
          value={messageTime}
          onChange={(event) => onTimeChange(event.target.value)}
          disabled={shipment.status !== "open"}
          className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none focus:border-emerald-400/40 disabled:opacity-50"
        />

        <textarea
          maxLength={400}
          placeholder="Masalan: Assalomu alaykum, bugun yo‘lga chiqaman. Shu narxda olib boraman."
          value={messageText}
          onChange={(event) => onTextChange(event.target.value)}
          disabled={shipment.status !== "open"}
          className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 outline-none focus:border-emerald-400/40 disabled:opacity-50"
        />

        <button
          onClick={onStartConversation}
          disabled={sendingMessage || shipment.status !== "open"}
          className="h-14 w-full rounded-2xl bg-emerald-400 text-sm font-black text-[#03120d] disabled:opacity-60"
        >
          {sendingMessage ? "Yuborilmoqda..." : "Xabar yuborish"}
        </button>
      </div>
    </div>
  );
}

function createFirstChatMessage({
  text,
  price,
  time,
}: {
  text: string;
  price: number;
  time: string;
}) {
  return [
    text.trim(),
    "",
    `Narx: ${price.toLocaleString("uz-UZ")} so‘m`,
    `Vaqt: ${time.trim()}`,
  ].join("\n");
}

function getShipmentStatus(status: string | null) {
  if (status === "in_transit") return "Yo‘lda";
  if (status === "completed") return "Yetkazildi";
  if (status === "cancelled") return "Bekor qilingan";

  return "Ochiq";
}

function getOfferStatus(status: string) {
  if (status === "accepted") return "Tanlangan";
  if (status === "rejected") return "Rad etildi";
  if (status === "cancelled") return "Bekor qilindi";

  return "Kutilmoqda";
}
