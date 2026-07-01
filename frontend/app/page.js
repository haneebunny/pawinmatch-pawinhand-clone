"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { animals } from "./data/animals";

const BANNER_SLIDES = [
  {
    id: 1,
    title: "매달, 포인핸드를 응원하는\n가장 쉬운 방법",
    subtitle: "카카오같이가치 ♥ 포인핸드 ♥ 카카오임팩트",
    bgClass: "from-[#FFF8E7] to-[#FFEAD2]",
    btnText: "기부하러 가기",
    btnColor: "bg-[#FF5A5F]",
    imagePlaceholder: "🐶",
  },
  {
    id: 2,
    title: "나에게 딱 맞는 반려동물,\nAI로 매칭받아 보세요",
    subtitle: "6가지 생활 환경 진단 & 원하는 성향 매칭",
    bgClass: "from-[#FFF1EC] to-[#FFE2D6]",
    btnText: "AI 진단 시작하기",
    btnColor: "bg-[#FF7A50]",
    link: "/diagnose",
    imagePlaceholder: "✨",
  },
  {
    id: 3,
    title: "유기동물 보호소의 생생한\n위치 지도를 확인하세요",
    subtitle: "우리 동네 보호소와 보호 중인 동물들 시각화",
    bgClass: "from-[#E8F8F5] to-[#D1F2EB]",
    btnText: "지도로 보기",
    btnColor: "bg-[#1ABC9C]",
    link: "/map",
    imagePlaceholder: "🗺",
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play slides every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  // Display only first 8 animals for recommendation on Home screen
  const recommendedAnimals = animals.slice(0, 8);

  return (
    <main className="pb-8">
      {/* 1. Hero Promotion Banner Carousel */}
      <section className="relative overflow-hidden bg-zinc-50 border-b border-surface-variant/20">
        {/* Slide Wrapper - Reduced Height to 280px / 320px for compact sizing */}
        <div className="relative h-[260px] md:h-[300px] w-full max-w-[1024px] mx-auto">
          {BANNER_SLIDES.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full flex items-center justify-between px-4 md:px-6 transition-all duration-700 ease-in-out bg-gradient-to-r ${slide.bgClass} ${
                  isActive ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-8 -z-10"
                }`}
              >
                {/* Left text block */}
                <div className="max-w-[65%] md:max-w-[60%] shrink-0">
                  <h2 className="font-h1 text-[22px] md:text-[32px] text-on-surface mb-3 leading-tight font-bold whitespace-pre-line">
                    {slide.title}
                  </h2>
                  <div className="flex items-center gap-1 mb-4">
                    <span className="text-[13px] leading-normal text-on-surface-variant">
                      {slide.subtitle}
                    </span>
                  </div>
                  {slide.link ? (
                    <Link
                      href={slide.link}
                      className={`${slide.btnColor} text-white px-4 md:px-6 h-[44px] md:h-[48px] rounded-full font-button-lg text-caption md:text-body hover:shadow-md transition-all active:scale-95 inline-flex items-center justify-center`}
                    >
                      {slide.btnText}
                    </Link>
                  ) : (
                    <button
                      className={`${slide.btnColor} text-white px-4 md:px-6 h-[44px] md:h-[48px] rounded-full font-button-lg text-caption md:text-body hover:shadow-md transition-all active:scale-95 flex items-center justify-center`}
                    >
                      {slide.btnText}
                    </button>
                  )}
                </div>

                {/* Right image/icon placeholder block */}
                <div className="flex items-center justify-center w-[30%] md:w-[35%] h-[80%] relative">
                  <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] rounded-full bg-white/40 flex items-center justify-center text-[48px] md:text-[72px] border border-white/60 shadow-inner select-none">
                    {slide.imagePlaceholder}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Left Arrow */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-sm top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center border border-surface-variant/20 shadow-sm cursor-pointer active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNextSlide}
            className="absolute right-sm top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center border border-surface-variant/20 shadow-sm cursor-pointer active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          {/* Indicators */}
          <div className="absolute bottom-md right-lg md:right-xl z-20 bg-black/40 backdrop-blur-sm px-sm py-[4px] rounded-full flex items-center gap-1">
            <span className="font-caption text-[11px] font-bold text-white tracking-wide">
              {currentSlide + 1} / {BANNER_SLIDES.length}
            </span>
          </div>
        </div>
      </section>

      {/* 2. AI Diagnostic Entry Card */}
      <section className="max-w-[1024px] mx-auto px-4 md:px-6 my-8">
        <div className="bg-white p-8 rounded-2xl border border-surface-variant/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary-container/10 rounded-2xl flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-primary-container text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div>
              <h3 className="text-[22px] font-bold tracking-tight leading-snug mb-1">AI 입양진단</h3>
              <p className="text-[16px] leading-relaxed text-on-surface-variant">
                생활환경을 입력하면 나와 맞는 보호동물을 찾는 데 도움을 받을 수 있어요.
              </p>
            </div>
          </div>
          <Link
            href="/diagnose"
            className="bg-primary-container text-white px-8 h-[52px] rounded-xl text-[16px] font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center whitespace-nowrap"
          >
            진단 시작하기
          </Link>
        </div>
      </section>

      {/* 3. Recommended Animals Grid */}
      <section className="max-w-[1024px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight leading-snug text-on-surface">이달의 추천 입양동물</h2>
            <p className="text-[13px] leading-normal text-on-surface-variant mt-1">
              새로운 가족을 기다리는 특별한 친구들을 소개합니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/animals"
              className="flex items-center gap-1 bg-white border border-surface-variant/50 px-4 py-2 rounded-lg text-[16px] font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              전체보기
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-1 bg-white border border-surface-variant/50 px-4 py-2 rounded-lg text-[16px] font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">map</span>지도로 보기
            </Link>
          </div>
        </div>

        {/* 4x2 Grid of cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {recommendedAnimals.map((animal) => (
            <Link
              key={animal.id}
              href={`/animals/${animal.id}`}
              className="bg-white rounded-xl border border-surface-variant/30 overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-all duration-300"
            >
              {/* Image aspect-square */}
              <div className="relative aspect-square overflow-hidden bg-surface-container">
                <img
                  src={animal.photo}
                  alt={animal.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-sm right-sm bg-black/25 backdrop-blur-md px-sm py-[2px] rounded-full flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-[13px] text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                  <span className="font-caption text-[11px] font-bold text-white">
                    {animal.likes}
                  </span>
                </div>
              </div>
              
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-on-surface text-[18px] font-semibold leading-normal">{animal.breeds}</span>
                  <span className="text-on-surface-variant text-[13px] leading-normal">
                    {animal.animal_sex === "남아" ? "♂️" : "♀️"}
                  </span>
                </div>
                <p className="text-on-surface-variant text-[13px] leading-normal mb-3">
                  {animal.animal_age} • {animal.found_location.split(" ")[0]} {animal.found_location.split(" ")[1] || ""}
                </p>
                <div className="pt-2 border-t border-surface-variant/20">
                  <p className="font-caption text-[11px] text-on-surface-variant truncate">
                    {animal.notice_no.split("-")[0]}보호소
                  </p>
                  <p className="font-caption text-[11px] text-primary-container font-bold">
                    {animal.notice_start.slice(2)}~{animal.notice_end.slice(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
