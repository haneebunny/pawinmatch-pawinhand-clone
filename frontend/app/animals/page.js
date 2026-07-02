"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { animals } from "../data/animals";
import { shelters } from "../data/shelters";

function AnimalsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shelterIdFilter = searchParams.get("shelter_id");

  // Filter animals by shelter_id if query exists
  const filteredAnimals = shelterIdFilter
    ? animals.filter((a) => a.shelter_id === shelterIdFilter)
    : animals;

  // Find shelter name for heading
  const activeShelter = shelterIdFilter
    ? shelters.find((s) => s.shelter_id === shelterIdFilter)
    : null;

  const handleClearFilter = () => {
    router.push("/animals");
  };

  return (
    <main className="pb-8">
      {/* Page Title and Filters */}
      <section className="max-w-[1024px] mx-auto px-4 md:px-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-6">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight text-on-surface font-bold">유기동물 보호 목록</h1>
            <p className="text-[13px] leading-normal text-on-surface-variant mt-1">
              {activeShelter 
                ? `[${activeShelter.name}]에서 보호 중인 아이들을 보여드려요.`
                : "새로운 보호자를 애타게 기다리고 있는 아이들을 만나보세요."
              }
            </p>
          </div>
          <Link
            href="/map"
            className="flex items-center gap-1 bg-white border border-surface-variant/50 px-4 py-2 rounded-lg text-[16px] font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">map</span>지도로 보기
          </Link>
        </div>

        {/* Filter and Reset Badge */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-surface-variant/20 pb-3 items-center">
          <button className="flex items-center gap-1 bg-white border border-surface-variant/50 px-4 py-2 rounded-full font-body text-[14px] text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">
            지역: 전국 <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
          <button className="flex items-center gap-1 bg-white border border-surface-variant/50 px-4 py-2 rounded-full font-body text-[14px] text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">
            축종: 전체 <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
          <button className="flex items-center gap-1 bg-white border border-surface-variant/50 px-4 py-2 rounded-full font-body text-[14px] text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">
            공고 상태: 전체 <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>

          {shelterIdFilter && activeShelter && (
            <div className="flex items-center gap-1 bg-[#FFF1EC] border border-[#ffb59f] px-4 py-2 rounded-full font-body text-[14px] text-primary-container">
              <span>필터: {activeShelter.name}</span>
              <button 
                onClick={handleClearFilter}
                className="material-symbols-outlined text-[16px] text-primary hover:text-black cursor-pointer ml-xs"
                title="필터 해제"
              >
                close
              </button>
            </div>
          )}
        </div>

        {/* 4x3 Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {filteredAnimals.map((animal) => (
            <Link
              key={animal.id}
              href={`/animals/${animal.id}`}
              className="bg-white rounded-xl border border-surface-variant/30 overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-all duration-300"
            >
              {/* Image aspect-square */}
              <div className="relative aspect-square overflow-hidden bg-surface-container">
                <img
                  src={animal.photos && animal.photos[0] ? animal.photos[0] : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400"}
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
                    {animal.bell_count || 0}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-on-surface text-[18px] font-bold leading-normal truncate max-w-[120px]">
                    {animal.name && animal.name.trim() !== "" ? animal.name : "이름 없음"}
                  </span>
                  <span className="text-on-surface-variant text-[13px] leading-normal">
                    {animal.animal_sex === "수컷" ? "♂️" : animal.animal_sex === "암컷" ? "♀️" : "❓"}
                  </span>
                </div>
                <p className="text-on-surface-variant text-[13px] leading-normal mb-3 truncate">
                  {animal.breeds} • {animal.animal_age}
                </p>
                <div className="pt-2 border-t border-surface-variant/20">
                  <p className="font-caption text-[11px] text-on-surface-variant truncate">
                    {(animal.notice_no && animal.notice_no.split("-")[0]) || "보호"}보호소
                  </p>
                  <p className="font-caption text-[11px] text-primary-container font-bold">
                    {(animal.notice_start || "").slice(2)}~{(animal.notice_end || "").slice(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredAnimals.length === 0 && (
          <div className="text-center py-giant text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[48px] text-gray-300">location_off</span>
            <p className="text-[16px] leading-relaxed font-semibold">보호 중인 동물이 없습니다.</p>
            <button 
              onClick={handleClearFilter}
              className="text-primary-container hover:underline text-caption"
            >
              전체 보기로 돌아가기
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AnimalsListPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8 font-body text-on-surface-variant max-w-[1024px] mx-auto px-4 mt-8">
        보호 목록을 불러오는 중입니다...
      </div>
    }>
      <AnimalsList />
    </Suspense>
  );
}


