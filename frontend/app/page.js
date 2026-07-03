"use client";

import Link from "next/link";
import AnimalCard from "./components/AnimalCard";
import { animals } from "./data/animals";

function formatAge(age) {
  if (typeof age === "number") {
    if (age >= 12) {
      const years = Math.floor(age / 12);
      const months = age % 12;
      return months > 0 ? `${years}살 ${months}개월` : `${years}살`;
    }
    return `${age}개월`;
  }
  return age;
}

export default function Home() {
  // Display only first 8 animals sorted by closest notice_end (urgent closure first)
  const recommendedAnimals = [...animals]
    .sort((a, b) => {
      const dateA = a.notice_end ? new Date(a.notice_end) : new Date("9999-12-31");
      const dateB = b.notice_end ? new Date(b.notice_end) : new Date("9999-12-31");
      return dateA - dateB;
    })
    .slice(0, 8);

  return (
    <main className="pb-8">
      {/* 1. Hero Promotion Banner (Single Static Image) */}
      <section className="relative mx-auto overflow-hidden w-full max-w-[1024px] border-b border-surface-variant/20">
        <Link href="/diagnose" className="block w-full hover:opacity-95 transition-opacity duration-300">
          <img
            src="/img/banner.png"
            alt="포인핸드 AI 입양 적합도 진단 배너"
            className="w-full h-[160px] sm:h-auto object-cover sm:object-contain"
          />
        </Link>
      </section>

      {/* 2. AI Diagnostic Entry Card */}
      <section className="max-w-[1024px] mx-auto px-4 md:px-6 my-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-brand-border/85 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
          <div className="flex items-start md:items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FFF1EC] rounded-2xl flex items-center justify-center shrink-0 border border-[#FFE2D6]/50">
              <span
                className="material-symbols-outlined text-[#FF7A50] text-[24px] md:text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div>
              <h3 className="text-[18px] md:text-[22px] font-bold tracking-tight leading-snug mb-1 text-on-surface">AI 입양진단</h3>
              <p className="text-[13px] md:text-[16px] leading-relaxed text-on-surface-variant">
                생활환경을 입력하면 나와 맞는 보호동물을 찾는 데 도움을 받을 수 있어요.
              </p>
            </div>
          </div>
          <Link
            href="/diagnose"
            className="w-full md:w-auto bg-[#FF7A50] hover:bg-[#e08420] text-white px-8 h-[52px] rounded-xl text-[15px] md:text-[16px] font-bold hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center whitespace-nowrap gap-2 shadow-md shadow-[#FF7A50]/20"
          >
            진단 시작하기
            <span className="material-symbols-outlined text-[18px] font-bold">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* 3. Recommended Animals Grid */}
      <section className="max-w-[1024px] mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight leading-snug text-on-surface">이달의 추천 입양동물</h2>
            <p className="text-[13px] leading-normal text-on-surface-variant mt-1">
              새로운 가족을 기다리는 특별한 친구들을 소개합니다
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/map"
              className="flex items-center gap-1.5 bg-white border border-surface-variant/50 px-3.5 py-2 rounded-lg text-[14px] md:text-[16px] font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">map</span>지도로 보기
            </Link>
            <Link
              href="/animals"
              className="flex items-center gap-1.5 bg-white border border-surface-variant/50 px-3.5 py-2 rounded-lg text-[14px] md:text-[16px] font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors whitespace-nowrap shrink-0"
            >
              전체보기
            </Link>
          </div>
        </div>

        {/* 4x2 Grid of cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {recommendedAnimals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      </section>
    </main>
  );
}
