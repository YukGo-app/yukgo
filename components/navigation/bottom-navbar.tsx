"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, House, MessageCircle, Plus, Route, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

const items = [
  {
    href: "/home",
    label: "Asosiy",
    icon: House,
  },
  {
    href: "/courier",
    label: "Kurye",
    icon: Bike,
  },
  {
    href: "/messages",
    label: "Xabarlar",
    icon: MessageCircle,
    badge: true,
  },
  {
    href: "/create",
    label: "Yuborish",
    icon: Plus,
    special: true,
  },
  {
    href: "/routes",
    label: "Yo‘l",
    icon: Route,
  },
  {
    href: "/profile",
    label: "Profil",
    icon: User,
  },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  const [currentUserId, setCurrentUserId] = useState("");
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const previousUnreadCountRef = useRef(0);
  const firstLoadRef = useRef(true);
  const soundUnlockedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unlockSound = () => {
      soundUnlockedRef.current = true;
    };

    window.addEventListener("pointerdown", unlockSound, { once: true });
    window.addEventListener("keydown", unlockSound, { once: true });

    const playMessageSound = () => {
      if (!soundUnlockedRef.current) return;

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext;

        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          520,
          audioContext.currentTime + 0.12
        );

        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.08,
          audioContext.currentTime + 0.02
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          audioContext.currentTime + 0.16
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.17);

        setTimeout(() => {
          audioContext.close().catch(() => {});
        }, 250);
      } catch {
        // Sessiz geç.
      }
    };

    const loadUnreadMessages = async (options?: { playSound?: boolean }) => {
      if (loadingRef.current) return;

      loadingRef.current = true;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        loadingRef.current = false;
        return;
      }

      if (!session) {
        setCurrentUserId("");
        setUnreadMessagesCount(0);
        previousUnreadCountRef.current = 0;
        firstLoadRef.current = false;
        loadingRef.current = false;
        return;
      }

      setCurrentUserId(session.user.id);

      const { count, error } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", session.user.id)
        .is("read_at", null);

      if (!mounted) {
        loadingRef.current = false;
        return;
      }

      if (error) {
        console.error("Unread messages count error:", error.message);
        loadingRef.current = false;
        return;
      }

      const nextCount = count ?? 0;
      const previousCount = previousUnreadCountRef.current;

      setUnreadMessagesCount(nextCount);

      if (
        options?.playSound &&
        !firstLoadRef.current &&
        nextCount > previousCount
      ) {
        playMessageSound();
      }

      previousUnreadCountRef.current = nextCount;
      firstLoadRef.current = false;
      loadingRef.current = false;
    };

    const scheduleUnreadRefresh = (playSound: boolean) => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        loadUnreadMessages({ playSound });
      }, 350);
    };

    loadUnreadMessages({ playSound: false });

    const authListener = supabase.auth.onAuthStateChange(() => {
      firstLoadRef.current = true;
      scheduleUnreadRefresh(false);
    });

    const channel = supabase
      .channel("bottom-navbar-incoming-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const message = payload.new as {
            receiver_id?: string | null;
            sender_id?: string | null;
          };

          if (!message.receiver_id || message.receiver_id !== currentUserId) {
            return;
          }

          if (message.sender_id === currentUserId) {
            return;
          }

          scheduleUnreadRefresh(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const message = payload.new as {
            receiver_id?: string | null;
          };

          if (!message.receiver_id || message.receiver_id !== currentUserId) {
            return;
          }

          scheduleUnreadRefresh(false);
        }
      )
      .subscribe();

    return () => {
      mounted = false;

      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }

      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);

      authListener.data.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#050816] via-[#050816]/95 to-transparent px-3 pb-4 pt-5">
      <div className="mx-auto flex h-[76px] max-w-md items-center justify-between rounded-[2rem] border border-white/10 bg-[#111827]/95 px-2 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/home" && pathname.startsWith(item.href));

          const Icon = item.icon;
          const showBadge =
            item.badge && currentUserId && unreadMessagesCount > 0;

          if (item.special) {
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="relative -mt-8 flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-[1.8rem] bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#03120d] shadow-[0_12px_34px_rgba(16,185,129,0.35)] active:scale-95"
              >
                <Icon size={28} strokeWidth={3} />

                <span className="mt-1 text-[10px] font-black leading-none">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`relative flex h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[10px] font-bold transition active:scale-95 ${
                active
                  ? "bg-emerald-400 text-[#03120d]"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="relative">
                <Icon size={19} strokeWidth={active ? 2.8 : 2.3} />

                {showBadge ? (
                  <span
                    className={`absolute -right-2.5 -top-2 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9px] font-black leading-none shadow-[0_0_12px_rgba(16,185,129,0.75)] ${
                      active
                        ? "bg-[#03120d] text-emerald-300"
                        : "bg-emerald-400 text-[#03120d]"
                    }`}
                  >
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                ) : null}
              </div>

              <span className="max-w-[48px] truncate leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}