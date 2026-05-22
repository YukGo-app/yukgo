"use client";

import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/navigation/bottom-navbar";

export default function TermsPage() {
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
              Foydalanish shartlari
            </h1>
          </div>
        </header>

        <section className="rounded-[1.6rem] border border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 via-white/[0.04] to-cyan-400/8 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-xl">
            📄
          </div>

          <h2 className="text-xl font-black">YukGo xizmat qoidalari</h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            YukGo klassik kargo yoki yetkazib berish kompaniyasi emas. Platforma
            yuk yuboruvchilarni shu yo‘nalishda ketayotgan tashuvchilar bilan
            bog‘laydi. Tashish shartlari foydalanuvchilar o‘rtasida kelishiladi.
          </p>
        </section>

        <TermsBlock
          title="Platforma vazifasi"
          items={[
            "YukGo foydalanuvchilar o‘rtasida marketplace sifatida ishlaydi.",
            "Platforma o‘z transporti bilan yuk tashimaydi.",
            "Yuboruvchi va tashuvchi taklif, chat va yetkazish jarayonini o‘zaro kelishadi.",
          ]}
        />

        <TermsBlock
          title="Foydalanuvchi majburiyatlari"
          items={[
            "To‘g‘ri aloqa ma’lumotlari va haqiqiy e’lon kiritish.",
            "Yuk tafsilotlarini aniq yozish.",
            "Taqiqlangan, xavfli yoki noqonuniy buyumlarni joylashtirmaslik.",
            "Boshqa foydalanuvchilarga hurmat bilan munosabatda bo‘lish.",
          ]}
        />

        <TermsBlock
          title="Taqiqlangan yuklar"
          items={[
            "Noqonuniy mahsulotlar, qurol, narkotik yoki xavfli moddalar.",
            "Katta miqdordagi naqd pul, qimmatbaho zargarlik buyumlari.",
            "Yuqori xavfli elektronika, telefon, laptop va juda qimmat buyumlar.",
            "Qonun bilan cheklangan yoki tashish xavfli bo‘lgan mahsulotlar.",
          ]}
        />

        <TermsBlock
          title="Xavfsizlik va tasdiqlash"
          items={[
            "YukGo foydalanuvchi xavfsizligi uchun profil, reyting, chat, shikoyat va admin nazorat mexanizmlaridan foydalanadi.",
            "Yetkazish holati foydalanuvchilar o‘rtasidagi kelishuv, chat yozishmalari va platformadagi buyurtma holati asosida yuritiladi.",
            "Kelajakda qo‘shimcha tasdiqlash mexanizmlari qo‘shilishi mumkin, lekin ular joriy etilmaguncha foydalanuvchidan talab qilinmaydi.",
          ]}
        />

        <TermsBlock
          title="To‘lov va kelishuv"
          items={[
            "YukGo foydalanuvchi pullarini saqlovchi escrow yoki bank xizmati emas.",
            "To‘lov shartlari yuboruvchi va tashuvchi o‘rtasida kelishiladi.",
            "Kelajakda xavfsiz to‘lov qo‘shilsa ham, foydalanuvchi mablag‘lari qonuniy va xavfsiz tartibda boshqariladi.",
          ]}
        />

        <TermsBlock
          title="Hisobni cheklash"
          items={[
            "Spam, soxta e’lon, firibgarlik yoki qoida buzilishi aniqlansa hisob cheklanishi mumkin.",
            "Shikoyatlar admin tomonidan ko‘rib chiqiladi.",
            "Platforma xavfsizligini buzadigan foydalanuvchilar bloklanishi mumkin.",
          ]}
        />

        <section className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-base font-black text-white">Qo‘llab-quvvatlash</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Savol, shikoyat yoki hamkorlik bo‘yicha profil sahifasidagi Yordam
            markazi orqali murojaat yuborishingiz mumkin.
          </p>
        </section>
      </section>

      <BottomNavbar />
    </main>
  );
}

function TermsBlock({ title, items }: { title: string; items: string[] }) {
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