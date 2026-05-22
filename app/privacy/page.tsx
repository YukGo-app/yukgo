"use client";

import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";

export default function PrivacyPage() {
  const router = useRouter();

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
            <p className="text-xs font-semibold text-emerald-300/80">
              YukGo
            </p>
            <h1 className="text-2xl font-black tracking-tight">
              Maxfiylik siyosati
            </h1>
          </div>
        </header>

        <section className="rounded-[1.6rem] border border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 via-white/[0.04] to-cyan-400/8 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-xl">
            🔐
          </div>

          <h2 className="text-xl font-black">Shaxsiy ma’lumotlaringiz himoyada</h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            YukGo foydalanuvchilarga yuk, kichik paket, hujjat va shaxsiy
            buyumlarni yo‘nalishi mos tashuvchilar bilan bog‘lashga yordam
            beruvchi marketplace platformasidir. Biz foydalanuvchilardan
            pasport, selfie, hujjat rasmi yoki KYC ma’lumotlarini so‘ramaymiz.
          </p>
        </section>

        <PolicyBlock
          title="Qanday ma’lumotlar olinadi?"
          items={[
            "Ro‘yxatdan o‘tish uchun email yoki telefon raqami.",
            "Profil nomi, reyting, faol holat va xizmat tarixi.",
            "Yuk e’lonlari, yo‘nalishlar, takliflar va chat xabarlari.",
            "Xavfsizlik, spam va firibgarlikdan himoya qilish uchun texnik ma’lumotlar.",
          ]}
        />

        <PolicyBlock
          title="Ma’lumotlar nima uchun ishlatiladi?"
          items={[
            "Foydalanuvchini hisobga kiritish va profilni ko‘rsatish.",
            "Yuk yuboruvchi va tashuvchini moslashtirish.",
            "Taklif, chat, bildirishnoma va yetkazish jarayonini yuritish.",
            "Shikoyat, qo‘llab-quvvatlash va xavfsizlik tekshiruvlarini boshqarish.",
          ]}
        />

        <PolicyBlock
          title="Biz so‘ramaydigan ma’lumotlar"
          items={[
            "Pasport yoki shaxsni tasdiqlovchi hujjat rasmi.",
            "Selfie verification yoki yuzni tekshirish.",
            "Bank karta paroli, karta PIN kodi yoki maxfiy to‘lov ma’lumotlari.",
            "Keraksiz galereya, kontaktlar yoki fayllarga ruxsat.",
          ]}
        />

        <PolicyBlock
          title="Joylashuv va bildirishnomalar"
          items={[
            "Agar ilovada joylashuv funksiyasi ishlatilsa, u faqat yuk yoki yo‘nalish tajribasini yaxshilash uchun ishlatiladi.",
            "Bildirishnomalar takliflar, chat javoblari, yetkazish holati va xavfsizlik xabarlari uchun yuborilishi mumkin.",
            "Foydalanuvchi qurilma sozlamalari orqali ruxsatlarni o‘chirishi mumkin.",
          ]}
        />

        <PolicyBlock
          title="Hisobni o‘chirish"
          items={[
            "Foydalanuvchi istalgan vaqtda profil sahifasidan hisobni o‘chirish so‘rovini yuborishi mumkin.",
            "So‘rov yuborilgandan so‘ng hisob tekshiriladi va shaxsiy ma’lumotlar xizmat qoidalariga muvofiq o‘chiriladi yoki anonimlashtiriladi.",
            "Firibgarlik, shikoyat yoki qonuniy majburiyatlar bo‘yicha kerakli yozuvlar cheklangan muddat saqlanishi mumkin.",
          ]}
        />

        <section className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-base font-black text-white">Bog‘lanish</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Maxfiylik bo‘yicha savollar uchun ilova ichidagi Yordam markazi
            orqali murojaat yuboring.
          </p>
        </section>
      </section>

      <BottomNavbar />
    </main>
  );
}

function PolicyBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
      <h2 className="text-base font-black text-white">{title}</h2>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6 text-slate-400">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}