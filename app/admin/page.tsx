"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Flag,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Pin,
  PinOff,
  Route,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  UserX,
  Users,
  X,
} from "lucide-react";

const DURATIONS = [
  { days: 1, label: "1 gün" },
  { days: 3, label: "3 gün" },
  { days: 5, label: "5 gün" },
  { days: 7, label: "7 gün" },
  { days: 10, label: "10 gün" },
  { days: 15, label: "15 gün" },
  { days: 30, label: "30 gün" },
];

type Shipment = {
  id: number | string;
  user_id?: string | null;
  from_city?: string | null;
  to_city?: string | null;
  description?: string | null;
  price?: number | null;
  status?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  delivery_mode?: string | null;
  is_premium?: boolean | null;
  premium_until?: string | null;
  is_pinned?: boolean | null;
  pinned_until?: string | null;
};

type DriverRoute = {
  id: string;
  user_id?: string | null;
  from_location?: string | null;
  to_location?: string | null;
  departure_time?: string | null;
  vehicle_type?: string | null;
  capacity?: string | number | null;
  status?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  is_premium?: boolean | null;
  premium_until?: string | null;
  is_pinned?: boolean | null;
  pinned_until?: string | null;
};

type Profile = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
  created_at?: string | null;
  is_banned?: boolean | null;
  role?: string | null;
};

type SupportTicket = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  admin_reply?: string | null;
  status: "open" | "in_review" | "answered" | "closed" | string;
  created_at?: string | null;
  updated_at?: string | null;
};

type TabKey =
  | "overview"
  | "support"
  | "shipments"
  | "routes"
  | "sponsored"
  | "pinned"
  | "users"
  | "moderation";

type DetailItem =
  | { type: "shipment"; data: Shipment }
  | { type: "route"; data: DriverRoute }
  | { type: "profile"; data: Profile }
  | { type: "support"; data: SupportTicket }
  | null;

function isActivePremium(item: {
  is_premium?: boolean | null;
  premium_until?: string | null;
}) {
  if (!item?.is_premium || !item?.premium_until) return false;
  return new Date(item.premium_until).getTime() > Date.now();
}

function isActivePinned(item: {
  is_pinned?: boolean | null;
  pinned_until?: string | null;
}) {
  if (!item?.is_pinned || !item?.pinned_until) return false;
  return new Date(item.pinned_until).getTime() > Date.now();
}

function isActiveShipment(item: Shipment) {
  const status = (item.status ?? "").toLowerCase();
  return status === "open" || status === "active";
}

function isActiveRoute(item: DriverRoute) {
  const status = (item.status ?? "").toLowerCase();
  return status === "active" || status === "open";
}

function formatDate(date?: string | null) {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatRemaining(until?: string | null) {
  if (!until) return "—";

  const ms = new Date(until).getTime() - Date.now();

  if (ms <= 0) return "Süresi doldu";

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}g ${hours}sa kaldı`;
  if (hours > 0) return `${hours}sa ${minutes}dk kaldı`;

  return `${minutes}dk kaldı`;
}

function shortId(id: string | number) {
  const value = String(id);
  return value.length > 10 ? `${value.slice(0, 8)}…` : value;
}

function getProfileName(profile: Profile) {
  return (
    profile.full_name ||
    profile.display_name ||
    profile.name ||
    profile.email ||
    "İsimsiz kullanıcı"
  );
}

function getUntil(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function getSupportCategoryLabel(category: string) {
  if (category === "sponsored_ad") return "Sponsorli reklama";
  if (category === "pinned_ad") return "Sabit reklama";
  if (category === "membership") return "A’zolik va paketlar";
  if (category === "business") return "Biznes hamkorlik";
  if (category === "shipment_issue") return "Yuk bo‘yicha muammo";
  if (category === "complaint") return "Shikoyat";
  if (category === "technical") return "Texnik yordam";

  return category || "Murojaat";
}

function getSupportStatusLabel(status?: string | null) {
  if (status === "answered") return "Cevaplandı";
  if (status === "closed") return "Kapandı";
  if (status === "in_review") return "İnceleniyor";

  return "Yeni";
}

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  const [profilesError, setProfilesError] = useState(false);
  const [supportError, setSupportError] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DetailItem>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAdminData = async () => {
    const [shipmentResult, routeResult, profileResult, supportResult] =
      await Promise.allSettled([
        supabase
          .from("shipments")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("driver_routes")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    if (shipmentResult.status === "fulfilled") {
      const { data, error } = shipmentResult.value;

      if (error) {
        console.error("Admin shipments load error:", error.message);
      } else {
        setShipments((data ?? []) as Shipment[]);
      }
    }

    if (routeResult.status === "fulfilled") {
      const { data, error } = routeResult.value;

      if (error) {
        console.error("Admin routes load error:", error.message);
      } else {
        setRoutes((data ?? []) as DriverRoute[]);
      }
    }

    if (profileResult.status === "fulfilled") {
      const { data, error } = profileResult.value;

      if (error) {
        console.error("Admin profiles load error:", error.message);
        setProfilesError(true);
      } else {
        setProfiles((data ?? []) as Profile[]);
        setProfilesError(false);
      }
    }

    if (supportResult.status === "fulfilled") {
      const { data, error } = supportResult.value;

      if (error) {
        console.error("Admin support tickets load error:", error.message);
        setSupportError(true);
      } else {
        setSupportTickets((data ?? []) as SupportTicket[]);
        setSupportError(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setAdminEmail(session.user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profileError || profile?.role !== "admin") {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      try {
        await loadAdminData();
      } catch (error) {
        console.error("Admin data load failed:", error);
        showToast("error", "Yönetim verileri yüklenirken hata oluştu.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, [router]);

  const makeShipmentSponsored = async (
    shipmentId: number | string,
    days: number
  ) => {
    const until = getUntil(days);

    const { error } = await supabase
      .from("shipments")
      .update({ is_premium: true, premium_until: until })
      .eq("id", shipmentId);

    if (error) {
      showToast("error", "Sponsorlu ilan aktif edilemedi.");
      return;
    }

    setShipments((prev) =>
      prev.map((item) =>
        item.id === shipmentId
          ? { ...item, is_premium: true, premium_until: until }
          : item
      )
    );

    showToast("success", "Sponsorlu ilan aktif edildi.");
  };

  const removeShipmentSponsored = async (shipmentId: number | string) => {
    const { error } = await supabase
      .from("shipments")
      .update({ is_premium: false, premium_until: null })
      .eq("id", shipmentId);

    if (error) {
      showToast("error", "Sponsorlu ilan kaldırılamadı.");
      return;
    }

    setShipments((prev) =>
      prev.map((item) =>
        item.id === shipmentId
          ? { ...item, is_premium: false, premium_until: null }
          : item
      )
    );

    showToast("success", "Sponsorlu ilan kaldırıldı.");
  };

  const makeRouteSponsored = async (routeId: string, days: number) => {
    const until = getUntil(days);

    const { error } = await supabase
      .from("driver_routes")
      .update({ is_premium: true, premium_until: until })
      .eq("id", routeId);

    if (error) {
      showToast("error", "Sponsorlu rota aktif edilemedi.");
      return;
    }

    setRoutes((prev) =>
      prev.map((item) =>
        item.id === routeId
          ? { ...item, is_premium: true, premium_until: until }
          : item
      )
    );

    showToast("success", "Sponsorlu rota aktif edildi.");
  };

  const removeRouteSponsored = async (routeId: string) => {
    const { error } = await supabase
      .from("driver_routes")
      .update({ is_premium: false, premium_until: null })
      .eq("id", routeId);

    if (error) {
      showToast("error", "Sponsorlu rota kaldırılamadı.");
      return;
    }

    setRoutes((prev) =>
      prev.map((item) =>
        item.id === routeId
          ? { ...item, is_premium: false, premium_until: null }
          : item
      )
    );

    showToast("success", "Sponsorlu rota kaldırıldı.");
  };

  const pinShipment = async (shipmentId: number | string, days: number) => {
    const until = getUntil(days);

    const { error } = await supabase
      .from("shipments")
      .update({ is_pinned: true, pinned_until: until })
      .eq("id", shipmentId);

    if (error) {
      showToast("error", "İlan üste sabitlenemedi.");
      return;
    }

    setShipments((prev) =>
      prev.map((item) =>
        item.id === shipmentId
          ? { ...item, is_pinned: true, pinned_until: until }
          : item
      )
    );

    showToast("success", "İlan ana sayfanın üstüne sabitlendi.");
  };

  const unpinShipment = async (shipmentId: number | string) => {
    const { error } = await supabase
      .from("shipments")
      .update({ is_pinned: false, pinned_until: null })
      .eq("id", shipmentId);

    if (error) {
      showToast("error", "Sabit ilan kaldırılamadı.");
      return;
    }

    setShipments((prev) =>
      prev.map((item) =>
        item.id === shipmentId
          ? { ...item, is_pinned: false, pinned_until: null }
          : item
      )
    );

    showToast("success", "Sabit ilan kaldırıldı.");
  };

  const pinRoute = async (routeId: string, days: number) => {
    const until = getUntil(days);

    const { error } = await supabase
      .from("driver_routes")
      .update({ is_pinned: true, pinned_until: until })
      .eq("id", routeId);

    if (error) {
      showToast("error", "Rota üste sabitlenemedi.");
      return;
    }

    setRoutes((prev) =>
      prev.map((item) =>
        item.id === routeId
          ? { ...item, is_pinned: true, pinned_until: until }
          : item
      )
    );

    showToast("success", "Rota ana sayfanın üstüne sabitlendi.");
  };

  const unpinRoute = async (routeId: string) => {
    const { error } = await supabase
      .from("driver_routes")
      .update({ is_pinned: false, pinned_until: null })
      .eq("id", routeId);

    if (error) {
      showToast("error", "Sabit rota kaldırılamadı.");
      return;
    }

    setRoutes((prev) =>
      prev.map((item) =>
        item.id === routeId
          ? { ...item, is_pinned: false, pinned_until: null }
          : item
      )
    );

    showToast("success", "Sabit rota kaldırıldı.");
  };

  const deleteShipment = async (shipmentId: number | string) => {
    const confirmed = window.confirm(
      "Bu işlem geri alınamaz. Devam etmek istiyor musunuz?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", shipmentId);

    if (error) {
      showToast("error", "İlan silinemedi.");
      return;
    }

    setShipments((prev) => prev.filter((item) => item.id !== shipmentId));
    showToast("success", "İlan silindi.");
  };

  const deleteRoute = async (routeId: string) => {
    const confirmed = window.confirm(
      "Bu işlem geri alınamaz. Devam etmek istiyor musunuz?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("driver_routes")
      .delete()
      .eq("id", routeId);

    if (error) {
      showToast("error", "Rota silinemedi.");
      return;
    }

    setRoutes((prev) => prev.filter((item) => item.id !== routeId));
    showToast("success", "Rota silindi.");
  };

  const toggleUserBan = async (profile: Profile) => {
    const nextValue = !profile.is_banned;

    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: nextValue })
      .eq("id", profile.id);

    if (error) {
      showToast(
        "error",
        "Kullanıcı engelleme alanı hazır değil veya işlem yapılamadı."
      );
      return;
    }

    setProfiles((prev) =>
      prev.map((item) =>
        item.id === profile.id ? { ...item, is_banned: nextValue } : item
      )
    );

    showToast(
      "success",
      nextValue ? "Kullanıcı engellendi." : "Kullanıcı engeli kaldırıldı."
    );
  };

  const answerSupportTicket = async (ticketId: string, reply: string) => {
    const cleanReply = reply.trim();

    if (cleanReply.length < 3) {
      showToast("error", "Cevap çok kısa.");
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("support_tickets")
      .update({
        admin_reply: cleanReply,
        status: "answered",
        updated_at: now,
      })
      .eq("id", ticketId);

    if (error) {
      showToast("error", "Cevap kaydedilemedi.");
      return;
    }

    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              admin_reply: cleanReply,
              status: "answered",
              updated_at: now,
            }
          : ticket
      )
    );

    showToast("success", "Cevap gönderildi.");
  };

  const markSuspicious = () => {
    showToast("success", "Şüpheli kayıt moderasyon listesine alındı.");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const stats = useMemo(() => {
    const activeShipments = shipments.filter(isActiveShipment).length;
    const activeRoutes = routes.filter(isActiveRoute).length;

    const sponsoredCount =
      shipments.filter(isActivePremium).length +
      routes.filter(isActivePremium).length;

    const pinnedCount =
      shipments.filter(isActivePinned).length + routes.filter(isActivePinned).length;

    const bannedUsers = profiles.filter((profile) => profile.is_banned).length;

    const openSupportCount = supportTickets.filter(
      (ticket) => ticket.status !== "answered" && ticket.status !== "closed"
    ).length;

    return {
      activeShipments,
      activeRoutes,
      sponsoredCount,
      pinnedCount,
      supportCount: openSupportCount,
      bannedUsers,
    };
  }, [shipments, routes, profiles, supportTickets]);

  const sponsoredShipments = useMemo(
    () => shipments.filter(isActivePremium),
    [shipments]
  );

  const sponsoredRoutes = useMemo(
    () => routes.filter(isActivePremium),
    [routes]
  );

  const pinnedShipments = useMemo(
    () => shipments.filter(isActivePinned),
    [shipments]
  );

  const pinnedRoutes = useMemo(() => routes.filter(isActivePinned), [routes]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070d] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Yönetim paneli yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10">
            <ShieldAlert className="h-8 w-8 text-rose-400" />
          </div>

          <h1 className="text-2xl font-semibold text-white">Yetkiniz yok</h1>

          <p className="mt-2 text-sm text-slate-400">
            Bu sayfayı görüntülemek için yönetici yetkiniz bulunmuyor.
          </p>

          <button
            onClick={() => router.replace("/home")}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-medium text-white transition hover:opacity-90"
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-semibold tracking-tight text-white md:text-xl">
                  YukGo Admin
                </h1>

                <p className="text-xs text-slate-400">
                  Platform Yönetimi · İlan, destek ve moderasyon kontrolü
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 md:flex">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {adminEmail}
              </div>

              <button
                onClick={handleSignOut}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10"
                title="Çıkış"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
            <StatCard icon={<Package className="h-4 w-4" />} label="Aktif Yükler" value={stats.activeShipments} accent="emerald" />
            <StatCard icon={<Route className="h-4 w-4" />} label="Aktif Rotalar" value={stats.activeRoutes} accent="cyan" />
            <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Bekleyen Talepler" value={stats.supportCount} accent="rose" />
            <StatCard icon={<Pin className="h-4 w-4" />} label="Sabit İlanlar" value={stats.pinnedCount} accent="amber" />
            <StatCard icon={<Crown className="h-4 w-4" />} label="Sponsorlu İlanlar" value={stats.sponsoredCount} accent="violet" />
            <StatCard icon={<UserX className="h-4 w-4" />} label="Engelli Kullanıcılar" value={stats.bannedUsers} accent="slate" />
          </section>

          <nav className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2 md:mt-8">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<LayoutDashboard className="h-4 w-4" />} label="Genel" />
            <TabButton active={tab === "support"} onClick={() => setTab("support")} icon={<MessageSquare className="h-4 w-4" />} label="Yardım Talepleri" />
            <TabButton active={tab === "shipments"} onClick={() => setTab("shipments")} icon={<Package className="h-4 w-4" />} label="Yükler" />
            <TabButton active={tab === "routes"} onClick={() => setTab("routes")} icon={<Route className="h-4 w-4" />} label="Rotalar" />
            <TabButton active={tab === "pinned"} onClick={() => setTab("pinned")} icon={<Pin className="h-4 w-4" />} label="Sabitlenenler" />
            <TabButton active={tab === "sponsored"} onClick={() => setTab("sponsored")} icon={<Crown className="h-4 w-4" />} label="Sponsorlu" />
            <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />} label="Kullanıcılar" />
            <TabButton active={tab === "moderation"} onClick={() => setTab("moderation")} icon={<Shield className="h-4 w-4" />} label="Moderasyon" />
          </nav>

          <div className="mt-6">
            {tab === "overview" ? (
              <OverviewTab
                pinnedCount={stats.pinnedCount}
                sponsoredCount={stats.sponsoredCount}
                activeShipments={stats.activeShipments}
                activeRoutes={stats.activeRoutes}
                supportCount={stats.supportCount}
                onOpenTab={setTab}
              />
            ) : null}

            {tab === "support" ? (
              <SupportTab
                tickets={supportTickets}
                hasError={supportError}
                profiles={profiles}
                onAnswer={answerSupportTicket}
              />
            ) : null}

            {tab === "shipments" ? (
              <ShipmentsList
                shipments={shipments}
                onSponsor={makeShipmentSponsored}
                onRemoveSponsor={removeShipmentSponsored}
                onPin={pinShipment}
                onUnpin={unpinShipment}
                onDelete={deleteShipment}
                onDetail={(item) => setSelectedDetail({ type: "shipment", data: item })}
                onSuspicious={markSuspicious}
              />
            ) : null}

            {tab === "routes" ? (
              <RoutesList
                routes={routes}
                onSponsor={makeRouteSponsored}
                onRemoveSponsor={removeRouteSponsored}
                onPin={pinRoute}
                onUnpin={unpinRoute}
                onDelete={deleteRoute}
                onDetail={(item) => setSelectedDetail({ type: "route", data: item })}
                onSuspicious={markSuspicious}
              />
            ) : null}

            {tab === "pinned" ? (
              <PinnedTab
                shipments={pinnedShipments}
                routes={pinnedRoutes}
                onExtendShipment={pinShipment}
                onRemoveShipment={unpinShipment}
                onExtendRoute={pinRoute}
                onRemoveRoute={unpinRoute}
              />
            ) : null}

            {tab === "sponsored" ? (
              <SponsoredTab
                shipments={sponsoredShipments}
                routes={sponsoredRoutes}
                onExtendShipment={makeShipmentSponsored}
                onRemoveShipment={removeShipmentSponsored}
                onExtendRoute={makeRouteSponsored}
                onRemoveRoute={removeRouteSponsored}
              />
            ) : null}

            {tab === "users" ? (
              <UsersTab
                profiles={profiles}
                hasError={profilesError}
                onToggleBan={toggleUserBan}
                onDetail={(item) => setSelectedDetail({ type: "profile", data: item })}
              />
            ) : null}

            {tab === "moderation" ? <ModerationTab /> : null}
          </div>
        </main>
      </div>

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      ) : null}

      {selectedDetail ? (
        <DetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "emerald" | "cyan" | "amber" | "violet" | "rose" | "slate";
}) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
    cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-300",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-300",
    violet: "from-violet-500/20 to-violet-500/0 text-violet-300",
    rose: "from-rose-500/20 to-rose-500/0 text-rose-300",
    slate: "from-slate-500/20 to-slate-500/0 text-slate-300",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${colors[accent]} opacity-50`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            {label}
          </span>

          <div className={colors[accent].split(" ").pop()}>{icon}</div>
        </div>

        <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
        active
          ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white shadow-lg shadow-emerald-500/10"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-start gap-3">
        {icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            {icon}
          </div>
        ) : null}

        <div>
          <h3 className="font-semibold text-white">{title}</h3>

          {description ? (
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  );
}

function OverviewTab({
  pinnedCount,
  sponsoredCount,
  activeShipments,
  activeRoutes,
  supportCount,
  onOpenTab,
}: {
  pinnedCount: number;
  sponsoredCount: number;
  activeShipments: number;
  activeRoutes: number;
  supportCount: number;
  onOpenTab: (tab: TabKey) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SectionCard
        title="Destek ve Murojaatlar"
        description="Kullanıcılardan gelen reklam, üyelik, şikayet ve yardım talepleri"
        icon={<MessageSquare className="h-4 w-4" />}
      >
        <button
          onClick={() => onOpenTab("support")}
          className="w-full rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-left transition hover:bg-rose-500/15"
        >
          <div className="text-2xl font-semibold text-rose-200">
            {supportCount}
          </div>
          <div className="mt-1 text-sm font-medium text-white">
            Bekleyen yardım talebi
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Profildeki yardım merkezinden gelen mesajları yanıtlayın.
          </div>
        </button>
      </SectionCard>

      <SectionCard
        title="Öne Çıkarma Yönetimi"
        description="Ana sayfada görünen reklam ve sabitleme alanları"
        icon={<Star className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onOpenTab("pinned")}
            className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-left transition hover:bg-amber-500/15"
          >
            <div className="text-2xl font-semibold text-amber-200">
              {pinnedCount}
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              Üste Sabitlenen
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Ana sayfanın en üstünde görünür.
            </div>
          </button>

          <button
            onClick={() => onOpenTab("sponsored")}
            className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4 text-left transition hover:bg-violet-500/15"
          >
            <div className="text-2xl font-semibold text-violet-200">
              {sponsoredCount}
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              Sponsorlu
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Liste içinde reklam gibi gösterilir.
            </div>
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Platform Özeti"
        description="Aktif ilan ve rota durumu"
        icon={<Activity className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-2xl font-semibold text-emerald-200">
              {activeShipments}
            </div>
            <div className="mt-1 text-sm text-white">Aktif Yük</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="text-2xl font-semibold text-cyan-200">
              {activeRoutes}
            </div>
            <div className="mt-1 text-sm text-white">Aktif Rota</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Hızlı İşlemler"
        description="Sık kullanılan yönetim kısayolları"
        icon={<Activity className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-2">
          <QuickAction icon={<MessageSquare className="h-4 w-4" />} label="Yardım Talepleri" onClick={() => onOpenTab("support")} />
          <QuickAction icon={<Package className="h-4 w-4" />} label="Yükleri Yönet" onClick={() => onOpenTab("shipments")} />
          <QuickAction icon={<Route className="h-4 w-4" />} label="Rotaları Yönet" onClick={() => onOpenTab("routes")} />
          <QuickAction icon={<Crown className="h-4 w-4" />} label="Sponsorlu İlanlar" onClick={() => onOpenTab("sponsored")} />
        </div>
      </SectionCard>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:bg-white/5 active:scale-[0.98]"
    >
      <div className="flex items-center gap-2 text-sm text-slate-300">
        {icon}
        {label}
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function SupportTab({
  tickets,
  hasError,
  profiles,
  onAnswer,
}: {
  tickets: SupportTicket[];
  hasError: boolean;
  profiles: Profile[];
  onAnswer: (ticketId: string, reply: string) => void;
}) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets[0]?.id || null
  );

  useEffect(() => {
    if (!selectedTicketId && tickets[0]?.id) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [selectedTicketId, tickets]);

  if (hasError) {
    return (
      <SectionCard
        title="Yardım Talepleri"
        description="Destek verilerine ulaşılamadı"
        icon={<MessageSquare className="h-4 w-4" />}
      >
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-200">
          Destek talepleri görüntülenemiyor. Supabase RLS admin okuma/yazma
          yetkisi eksik olabilir.
        </div>
      </SectionCard>
    );
  }

  if (tickets.length === 0) {
    return <EmptyState text="Henüz yardım talebi bulunmuyor." />;
  }

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) || tickets[0];

  const selectedProfile = profiles.find(
    (profile) => profile.id === selectedTicket.user_id
  );

  const selectedUserName = selectedProfile
    ? getProfileName(selectedProfile)
    : shortId(selectedTicket.user_id);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-sm font-semibold text-white">Gelen talepler</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Kullanıcı mesajları
            </p>
          </div>

          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
            {tickets.length}
          </span>
        </div>

        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {tickets.map((ticket) => {
            const profile = profiles.find((item) => item.id === ticket.user_id);
            const userName = profile ? getProfileName(profile) : shortId(ticket.user_id);
            const active = selectedTicket.id === ticket.id;
            const answered = ticket.status === "answered" || Boolean(ticket.admin_reply?.trim());

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicketId(ticket.id)}
                className={[
                  "w-full rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                  active
                    ? "border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_32px_-22px_rgba(52,211,153,1)]"
                    : "border-white/10 bg-black/20 hover:bg-white/[0.055]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                        {getSupportCategoryLabel(ticket.category)}
                      </span>

                      <span
                        className={[
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          answered
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                            : "border-amber-500/25 bg-amber-500/10 text-amber-200",
                        ].join(" ")}
                      >
                        {answered ? "Cevaplandı" : "Bekliyor"}
                      </span>
                    </div>

                    <h4 className="mt-2 truncate text-sm font-semibold text-white">
                      {ticket.subject || "Yardım talebi"}
                    </h4>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {userName}
                    </p>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                      {ticket.message}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] text-slate-600">
                    {formatDate(ticket.created_at)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <SupportTicketCard
        ticket={selectedTicket}
        userName={selectedUserName}
        onAnswer={onAnswer}
      />
    </div>
  );
}

function SupportTicketCard({
  ticket,
  userName,
  onAnswer,
}: {
  ticket: SupportTicket;
  userName: string;
  onAnswer: (ticketId: string, reply: string) => void;
}) {
  const [reply, setReply] = useState(ticket.admin_reply || "");

  useEffect(() => {
    setReply(ticket.admin_reply || "");
  }, [ticket.id, ticket.admin_reply]);

  const answered = ticket.status === "answered" || Boolean(ticket.admin_reply?.trim());

  return (
    <section className="min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-black/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                {getSupportCategoryLabel(ticket.category)}
              </span>

              <span
                className={[
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  answered
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-200",
                ].join(" ")}
              >
                {answered ? "Cevaplandı" : "Cevap bekliyor"}
              </span>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-white">
              {ticket.subject || "Yardım talebi"}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Gönderen: {userName} · {formatDate(ticket.created_at)}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-lg">
            💬
          </div>
        </div>
      </div>

      <div className="flex min-h-[360px] flex-col justify-between p-4">
        <div className="space-y-4">
          <div className="max-w-[82%] rounded-2xl rounded-tl-md border border-white/10 bg-[#0b1220] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Kullanıcı mesajı
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
              {ticket.message}
            </p>
          </div>

          {ticket.admin_reply?.trim() ? (
            <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-md border border-emerald-400/25 bg-emerald-500/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                Gönderilen cevap
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-50">
                {ticket.admin_reply}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-3">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Cevap yaz
          </label>

          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={4}
            maxLength={700}
            placeholder="Kullanıcıya gönderilecek cevabı yazın..."
            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/40"
          />

          <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-500">{reply.trim().length}/700</span>
            <span className="text-slate-500">
              Cevap kullanıcı destek sayfasında görünür
            </span>
          </div>

          <button
            onClick={() => onAnswer(ticket.id, reply)}
            className="mt-3 h-11 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-sm font-semibold text-[#03120d] transition hover:opacity-90 active:scale-[0.99]"
          >
            Cevabı gönder
          </button>
        </div>
      </div>
    </section>
  );
}

function SponsoredBadge({ until }: { until?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200">
      <Crown className="h-3 w-3" />
      Sponsorlu · {formatRemaining(until)}
    </span>
  );
}

function PinnedBadge({ until }: { until?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
      <Pin className="h-3 w-3" />
      Sabit · {formatRemaining(until)}
    </span>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  const value = status ?? "active";
  const active = value === "active" || value === "open";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-slate-500/30 bg-slate-500/10 text-slate-300"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

function DurationPicker({
  onPick,
  label,
  tone = "amber",
}: {
  onPick: (days: number) => void;
  label: string;
  tone?: "amber" | "violet";
}) {
  const [open, setOpen] = useState(false);

  const color =
    tone === "violet"
      ? "border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
      : "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${color}`}
      >
        {tone === "violet" ? (
          <Crown className="h-3.5 w-3.5" />
        ) : (
          <Pin className="h-3.5 w-3.5" />
        )}
        {label}
      </button>

      {open ? (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Menüyü kapat"
          />

          <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-white/10 bg-[#0a0d16]/95 p-1 shadow-2xl backdrop-blur-xl">
            {DURATIONS.map((duration) => (
              <button
                key={duration.days}
                onClick={() => {
                  setOpen(false);
                  onPick(duration.days);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5"
              >
                {duration.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ActionIconButton({
  icon,
  onClick,
  title,
  tone = "default",
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  title: string;
  tone?: "default" | "danger" | "warning";
}) {
  const tones: Record<string, string> = {
    default: "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg border p-2 transition ${tones[tone]}`}
    >
      {icon}
    </button>
  );
}

function ShipmentsList({
  shipments,
  onSponsor,
  onRemoveSponsor,
  onPin,
  onUnpin,
  onDelete,
  onDetail,
  onSuspicious,
}: {
  shipments: Shipment[];
  onSponsor: (id: number | string, days: number) => void;
  onRemoveSponsor: (id: number | string) => void;
  onPin: (id: number | string, days: number) => void;
  onUnpin: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onDetail: (item: Shipment) => void;
  onSuspicious: () => void;
}) {
  if (shipments.length === 0) {
    return <EmptyState text="Hiç yük ilanı bulunamadı." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {shipments.map((item) => (
        <ListingCard
          key={String(item.id)}
          kind="shipment"
          item={item}
          title={`${item.from_city ?? "—"} → ${item.to_city ?? "—"}`}
          description={item.description ?? "Açıklama yok."}
          meta={item.delivery_mode ?? "marketplace"}
          status={item.status}
          createdAt={item.created_at}
          expiresAt={item.expires_at}
          isSponsored={isActivePremium(item)}
          sponsoredUntil={item.premium_until}
          isPinned={isActivePinned(item)}
          pinnedUntil={item.pinned_until}
          onSponsor={(days) => onSponsor(item.id, days)}
          onRemoveSponsor={() => onRemoveSponsor(item.id)}
          onPin={(days) => onPin(item.id, days)}
          onUnpin={() => onUnpin(item.id)}
          onDelete={() => onDelete(item.id)}
          onDetail={() => onDetail(item)}
          onSuspicious={onSuspicious}
        />
      ))}
    </div>
  );
}

function RoutesList({
  routes,
  onSponsor,
  onRemoveSponsor,
  onPin,
  onUnpin,
  onDelete,
  onDetail,
  onSuspicious,
}: {
  routes: DriverRoute[];
  onSponsor: (id: string, days: number) => void;
  onRemoveSponsor: (id: string) => void;
  onPin: (id: string, days: number) => void;
  onUnpin: (id: string) => void;
  onDelete: (id: string) => void;
  onDetail: (item: DriverRoute) => void;
  onSuspicious: () => void;
}) {
  if (routes.length === 0) {
    return <EmptyState text="Hiç rota ilanı bulunamadı." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {routes.map((item) => (
        <ListingCard
          key={item.id}
          kind="route"
          item={item}
          title={`${item.from_location ?? "—"} → ${item.to_location ?? "—"}`}
          description={`${item.vehicle_type ?? "Araç"} · Kapasite: ${
            item.capacity ?? "—"
          }`}
          meta={formatDate(item.departure_time)}
          status={item.status}
          createdAt={item.created_at}
          expiresAt={item.expires_at}
          isSponsored={isActivePremium(item)}
          sponsoredUntil={item.premium_until}
          isPinned={isActivePinned(item)}
          pinnedUntil={item.pinned_until}
          onSponsor={(days) => onSponsor(item.id, days)}
          onRemoveSponsor={() => onRemoveSponsor(item.id)}
          onPin={(days) => onPin(item.id, days)}
          onUnpin={() => onUnpin(item.id)}
          onDelete={() => onDelete(item.id)}
          onDetail={() => onDetail(item)}
          onSuspicious={onSuspicious}
        />
      ))}
    </div>
  );
}

function ListingCard({
  kind,
  item,
  title,
  description,
  meta,
  status,
  createdAt,
  expiresAt,
  isSponsored,
  sponsoredUntil,
  isPinned,
  pinnedUntil,
  onSponsor,
  onRemoveSponsor,
  onPin,
  onUnpin,
  onDelete,
  onDetail,
  onSuspicious,
}: {
  kind: "shipment" | "route";
  item: Shipment | DriverRoute;
  title: string;
  description: string;
  meta: string;
  status?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  isSponsored: boolean;
  sponsoredUntil?: string | null;
  isPinned: boolean;
  pinnedUntil?: string | null;
  onSponsor: (days: number) => void;
  onRemoveSponsor: () => void;
  onPin: (days: number) => void;
  onUnpin: () => void;
  onDelete: () => void;
  onDetail: () => void;
  onSuspicious: () => void;
}) {
  return (
    <div
      className={`rounded-2xl p-4 backdrop-blur-xl ${
        isPinned
          ? "border-2 border-amber-400/60 bg-amber-500/10 shadow-[0_0_35px_-18px_rgba(251,191,36,1)]"
          : isSponsored
          ? "border border-violet-400/35 bg-violet-500/10"
          : "border border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium text-white">
            {kind === "shipment" ? (
              <MapPin className="h-4 w-4 text-emerald-300" />
            ) : (
              <Route className="h-4 w-4 text-cyan-300" />
            )}
            <span className="truncate">{title}</span>
          </div>

          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="whitespace-nowrap text-right text-[11px] text-slate-500">
          #{shortId(item.id)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={status} />

        <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
          {meta || "—"}
        </span>

        {isPinned ? <PinnedBadge until={pinnedUntil} /> : null}
        {isSponsored ? <SponsoredBadge until={sponsoredUntil} /> : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Oluşturuldu: {formatDate(createdAt)}
        </div>

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Süre: {formatDate(expiresAt)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {isPinned ? (
            <button
              onClick={onUnpin}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
            >
              <PinOff className="h-3.5 w-3.5" />
              Sabiti kaldır
            </button>
          ) : (
            <DurationPicker onPick={onPin} label="Üste sabitle" tone="amber" />
          )}

          {isSponsored ? (
            <button
              onClick={onRemoveSponsor}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
            >
              <PinOff className="h-3.5 w-3.5" />
              Sponsorluğu kaldır
            </button>
          ) : (
            <DurationPicker onPick={onSponsor} label="Sponsorlu yap" tone="violet" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <ActionIconButton icon={<Eye className="h-3.5 w-3.5" />} title="Detay" onClick={onDetail} />
          <ActionIconButton icon={<Flag className="h-3.5 w-3.5" />} title="Şüpheli olarak işaretle" tone="warning" onClick={onSuspicious} />
          <ActionIconButton icon={<Trash2 className="h-3.5 w-3.5" />} title="Sil" tone="danger" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}

function SponsoredTab({
  shipments,
  routes,
  onExtendShipment,
  onRemoveShipment,
  onExtendRoute,
  onRemoveRoute,
}: {
  shipments: Shipment[];
  routes: DriverRoute[];
  onExtendShipment: (id: number | string, days: number) => void;
  onRemoveShipment: (id: number | string) => void;
  onExtendRoute: (id: string, days: number) => void;
  onRemoveRoute: (id: string) => void;
}) {
  return (
    <SpecialTab
      title="Sponsorlu İlanlar"
      description="Ana listede reklam mantığıyla gösterilen ilanlar"
      emptyText="Aktif sponsorlu ilan bulunmuyor."
      shipments={shipments}
      routes={routes}
      badgeType="sponsored"
      onExtendShipment={onExtendShipment}
      onRemoveShipment={onRemoveShipment}
      onExtendRoute={onExtendRoute}
      onRemoveRoute={onRemoveRoute}
    />
  );
}

function PinnedTab({
  shipments,
  routes,
  onExtendShipment,
  onRemoveShipment,
  onExtendRoute,
  onRemoveRoute,
}: {
  shipments: Shipment[];
  routes: DriverRoute[];
  onExtendShipment: (id: number | string, days: number) => void;
  onRemoveShipment: (id: number | string) => void;
  onExtendRoute: (id: string, days: number) => void;
  onRemoveRoute: (id: string) => void;
}) {
  return (
    <SpecialTab
      title="Üste Sabitlenen İlanlar"
      description="Ana sayfanın en üstünde özel alan içinde gösterilen ilanlar"
      emptyText="Aktif sabit ilan bulunmuyor."
      shipments={shipments}
      routes={routes}
      badgeType="pinned"
      onExtendShipment={onExtendShipment}
      onRemoveShipment={onRemoveShipment}
      onExtendRoute={onExtendRoute}
      onRemoveRoute={onRemoveRoute}
    />
  );
}

function SpecialTab({
  title,
  description,
  emptyText,
  shipments,
  routes,
  badgeType,
  onExtendShipment,
  onRemoveShipment,
  onExtendRoute,
  onRemoveRoute,
}: {
  title: string;
  description: string;
  emptyText: string;
  shipments: Shipment[];
  routes: DriverRoute[];
  badgeType: "sponsored" | "pinned";
  onExtendShipment: (id: number | string, days: number) => void;
  onRemoveShipment: (id: number | string) => void;
  onExtendRoute: (id: string, days: number) => void;
  onRemoveRoute: (id: string) => void;
}) {
  const total = shipments.length + routes.length;

  return (
    <SectionCard
      title={title}
      description={description}
      icon={badgeType === "pinned" ? <Pin className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
    >
      {total === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {shipments.map((item) => (
            <SpecialCard
              key={`shipment-${item.id}`}
              title={`${item.from_city ?? "—"} → ${item.to_city ?? "—"}`}
              subtitle="Yük ilanı"
              until={badgeType === "pinned" ? item.pinned_until : item.premium_until}
              badgeType={badgeType}
              onExtend={(days) => onExtendShipment(item.id, days)}
              onRemove={() => onRemoveShipment(item.id)}
            />
          ))}

          {routes.map((item) => (
            <SpecialCard
              key={`route-${item.id}`}
              title={`${item.from_location ?? "—"} → ${item.to_location ?? "—"}`}
              subtitle="Rota ilanı"
              until={badgeType === "pinned" ? item.pinned_until : item.premium_until}
              badgeType={badgeType}
              onExtend={(days) => onExtendRoute(item.id, days)}
              onRemove={() => onRemoveRoute(item.id)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function SpecialCard({
  title,
  subtitle,
  until,
  badgeType,
  onExtend,
  onRemove,
}: {
  title: string;
  subtitle: string;
  until?: string | null;
  badgeType: "sponsored" | "pinned";
  onExtend: (days: number) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${
        badgeType === "pinned"
          ? "border-2 border-amber-400/40 bg-amber-500/10"
          : "border border-violet-400/30 bg-violet-500/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white">{title}</div>
          <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
        </div>

        {badgeType === "pinned" ? (
          <PinnedBadge until={until} />
        ) : (
          <SponsoredBadge until={until} />
        )}
      </div>

      <div className="mt-3 text-xs text-slate-400">
        Bitiş: {formatDate(until)}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <DurationPicker
          onPick={onExtend}
          label="Süreyi uzat"
          tone={badgeType === "pinned" ? "amber" : "violet"}
        />

        <button
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
        >
          <PinOff className="h-3.5 w-3.5" />
          Kaldır
        </button>
      </div>
    </div>
  );
}

function UsersTab({
  profiles,
  hasError,
  onToggleBan,
  onDetail,
}: {
  profiles: Profile[];
  hasError: boolean;
  onToggleBan: (profile: Profile) => void;
  onDetail: (profile: Profile) => void;
}) {
  if (hasError) {
    return (
      <SectionCard
        title="Kullanıcılar"
        description="Profil verilerine ulaşılamadı"
        icon={<Users className="h-4 w-4" />}
      >
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-200">
          Kullanıcı verileri şu anda görüntülenemiyor.
        </div>
      </SectionCard>
    );
  }

  if (profiles.length === 0) {
    return <EmptyState text="Hiç kullanıcı kaydı bulunamadı." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => {
        const name = getProfileName(profile);
        const banned = Boolean(profile.is_banned);

        return (
          <div
            key={profile.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-semibold text-white">
                  {name.slice(0, 1).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{name}</div>
                  <div className="text-[11px] text-slate-500">
                    #{shortId(profile.id)}
                  </div>
                </div>
              </div>

              {banned ? (
                <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300">
                  Engelli
                </span>
              ) : (
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
                  Aktif
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1 text-xs text-slate-400">
              <div>E-posta: {profile.email ?? "—"}</div>
              <div>Kayıt: {formatDate(profile.created_at)}</div>
              {profile.role ? <div>Rol: {profile.role}</div> : null}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onDetail(profile)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
              >
                <Eye className="h-3.5 w-3.5" />
                Detay
              </button>

              <button
                onClick={() => onToggleBan(profile)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                  banned
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                }`}
              >
                {banned ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Engeli kaldır
                  </>
                ) : (
                  <>
                    <Ban className="h-3.5 w-3.5" />
                    Engelle
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModerationTab() {
  const items = [
    {
      title: "Şikayetler",
      desc: "Kullanıcı şikayetleri ve geri bildirimler burada listelenecek.",
      icon: <Flag className="h-4 w-4" />,
    },
    {
      title: "Riskli İlanlar",
      desc: "Otomatik tespit edilen şüpheli ilanlar moderatör onayına düşecek.",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      title: "Mesaj Güvenliği",
      desc: "Spam, dolandırıcılık ve uygunsuz içerik filtreleme paneli.",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      title: "Yasaklı Ürün Kontrolü",
      desc: "Taşınması yasak olan ürünlerin tespiti ve müdahale alanı.",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      title: "Spam ve Sahte Hesaplar",
      desc: "Yapay aktivite ve şüpheli kayıt tespiti yakında eklenecek.",
      icon: <UserX className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100 md:col-span-2 lg:col-span-3">
        Şikayet ve raporlama sistemi yardım talepleriyle birlikte panele
        bağlandı. Ek otomatik risk analizi daha sonra eklenecek.
      </div>

      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-300">
            {item.icon}
          </div>

          <h4 className="font-semibold text-white">{item.title}</h4>

          <p className="mt-1 text-xs text-slate-400">{item.desc}</p>

          <div className="mt-4">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400">
              İzleniyor
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailModal({
  item,
  onClose,
}: {
  item: DetailItem;
  onClose: () => void;
}) {
  if (!item) return null;

  const title =
    item.type === "shipment"
      ? "Yük Detayı"
      : item.type === "route"
      ? "Rota Detayı"
      : item.type === "support"
      ? "Yardım Talebi Detayı"
      : "Kullanıcı Detayı";

  const rows =
    item.type === "shipment"
      ? [
          ["ID", String(item.data.id)],
          ["Kullanıcı", item.data.user_id ?? "—"],
          ["Başlangıç", item.data.from_city ?? "—"],
          ["Varış", item.data.to_city ?? "—"],
          ["Açıklama", item.data.description ?? "—"],
          ["Fiyat", item.data.price ? `${item.data.price} so‘m` : "—"],
          ["Durum", item.data.status ?? "—"],
          ["Oluşturuldu", formatDate(item.data.created_at)],
          ["Bitiş", formatDate(item.data.expires_at)],
          ["Sabit", isActivePinned(item.data) ? "Aktif" : "Pasif"],
          ["Sabit Bitiş", formatDate(item.data.pinned_until)],
          ["Sponsorlu", isActivePremium(item.data) ? "Aktif" : "Pasif"],
          ["Sponsorlu Bitiş", formatDate(item.data.premium_until)],
        ]
      : item.type === "route"
      ? [
          ["ID", item.data.id],
          ["Kullanıcı", item.data.user_id ?? "—"],
          ["Başlangıç", item.data.from_location ?? "—"],
          ["Varış", item.data.to_location ?? "—"],
          ["Araç", item.data.vehicle_type ?? "—"],
          ["Kapasite", String(item.data.capacity ?? "—")],
          ["Kalkış", formatDate(item.data.departure_time)],
          ["Durum", item.data.status ?? "—"],
          ["Oluşturuldu", formatDate(item.data.created_at)],
          ["Bitiş", formatDate(item.data.expires_at)],
          ["Sabit", isActivePinned(item.data) ? "Aktif" : "Pasif"],
          ["Sabit Bitiş", formatDate(item.data.pinned_until)],
          ["Sponsorlu", isActivePremium(item.data) ? "Aktif" : "Pasif"],
          ["Sponsorlu Bitiş", formatDate(item.data.premium_until)],
        ]
      : item.type === "support"
      ? [
          ["ID", item.data.id],
          ["Kullanıcı", item.data.user_id],
          ["Kategori", getSupportCategoryLabel(item.data.category)],
          ["Başlık", item.data.subject],
          ["Durum", getSupportStatusLabel(item.data.status)],
          ["Mesaj", item.data.message],
          ["Cevap", item.data.admin_reply || "—"],
          ["Oluşturuldu", formatDate(item.data.created_at)],
          ["Güncellendi", formatDate(item.data.updated_at)],
        ]
      : [
          ["ID", item.data.id],
          ["Ad", getProfileName(item.data)],
          ["E-posta", item.data.email ?? "—"],
          ["Rol", item.data.role ?? "—"],
          ["Engel Durumu", item.data.is_banned ? "Engelli" : "Aktif"],
          ["Kayıt", formatDate(item.data.created_at)],
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0d16] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-xs text-slate-400">
              Kayıt bilgileri ve yönetim incelemesi
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                {label}
              </div>

              <div className="mt-1 break-words text-sm text-slate-200">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}