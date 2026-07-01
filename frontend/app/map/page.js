"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { shelters } from "../data/shelters";

const REGIONAL_MARKERS = [
  { region: "서울", count: 2, top: "22%", left: "28%", shelterIds: ["shelter-1", "shelter-4"] },
  { region: "경기/인천", count: 2, top: "16%", left: "38%", shelterIds: ["shelter-2", "shelter-3"] },
  { region: "강원", count: 1, top: "14%", left: "62%", shelterIds: ["shelter-12"] },
  { region: "충청", count: 1, top: "42%", left: "45%", shelterIds: ["shelter-9"] },
  { region: "전북", count: 1, top: "54%", left: "28%", shelterIds: ["shelter-10"] },
  { region: "경북/대구", count: 2, top: "48%", left: "68%", shelterIds: ["shelter-6", "shelter-11"] },
  { region: "경남/부산", count: 2, top: "72%", left: "60%", shelterIds: ["shelter-5", "shelter-7"] },
  { region: "전남/광주", count: 1, top: "74%", left: "26%", shelterIds: ["shelter-8"] }
];

export default function MapPage() {
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [filteredShelters, setFilteredShelters] = useState(shelters);
  const [activeShelterId, setActiveShelterId] = useState(null);

  useEffect(() => {
    if (selectedRegion === "전체") {
      setFilteredShelters(shelters);
    } else {
      const regionData = REGIONAL_MARKERS.find((r) => r.region === selectedRegion);
      if (regionData) {
        const filtered = shelters.filter((s) => regionData.shelterIds.includes(s.shelter_id));
        setFilteredShelters(filtered);
      }
    }
    setActiveShelterId(null);
  }, [selectedRegion]);

  return (
    <main className="w-full max-w-[1024px] flex flex-col min-h-[calc(100vh-72px)] px-4 md:px-6 mx-auto pb-8">
      {/* 1. Thin Banner */}
      <section className="mt-4">
        <div className="bg-[#FFF1EC] text-[#852400] px-4 py-2 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <p className="text-[13px] leading-normal">지도의 마커를 눌러 우리 동네 유기동물 보호소를 찾아보세요.</p>
        </div>
      </section>

      {/* 2. Two-Column Layout */}
      <section className="mt-6 flex flex-col md:flex-row gap-4 flex-grow">
        {/* Left Column: Offline Interactive Map Area (55% width) */}
        <div className="w-full md:w-[55%] flex flex-col">
          <div className="relative w-full aspect-[4/5] bg-white border border-[#F0E5DD] rounded-2xl overflow-hidden map-bg p-4 shadow-sm">
            {/* Map title overlay */}
            <div className="absolute top-sm left-sm bg-white/80 backdrop-blur-md px-md py-[4px] rounded-lg border border-brand-border z-20">
              <span className="font-caption text-[11px] font-bold text-on-surface-variant">오프라인 위도/경도 매핑 지도</span>
            </div>

            {/* Simulated Geography Outlines */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
              <span className="material-symbols-outlined text-[160px] text-outline">map</span>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setSelectedRegion("전체")}
              className={`absolute bottom-lg left-lg z-20 px-md h-[36px] rounded-full border text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedRegion === "전체"
                  ? "bg-primary-container text-white border-transparent"
                  : "bg-white text-on-surface-variant border-[#dfc0b7] hover:bg-zinc-100"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              필터 초기화
            </button>

            {/* Interactive regional markers */}
            {REGIONAL_MARKERS.map((marker) => {
              const isActive = selectedRegion === marker.region;
              return (
                <button
                  key={marker.region}
                  onClick={() => setSelectedRegion(marker.region)}
                  style={{ top: marker.top, left: marker.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-md py-1 rounded-full font-bold text-[11px] md:text-caption shadow-md cursor-pointer transition-all active:scale-95 z-10 flex items-center gap-1 ${
                    isActive
                      ? "bg-[#FF7A50] text-white border border-[#FF7A50] scale-110 ring-4 ring-primary-container/20"
                      : "bg-white border border-[#FF7A50]/50 text-primary-container hover:bg-zinc-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    location_on
                  </span>
                  <span>{marker.region} <span className="font-normal opacity-85">({marker.count})</span></span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Shelter List / Detailed Side Panel (45% width) */}
        <div className="w-full md:w-[45%] flex flex-col">
          <div className="bg-white border border-[#F0E5DD] rounded-2xl p-4 flex flex-col h-full shadow-sm max-h-[500px] md:max-h-[600px] overflow-hidden">
            {/* Header info */}
            <div className="border-b border-[#F0E5DD] pb-3 mb-3 flex justify-between items-center">
              <div>
                <h3 className="text-[18px] font-semibold leading-normal text-on-surface font-bold">보호소 목록</h3>
                <p className="text-[13px] leading-normal text-on-surface-variant mt-1">
                  {selectedRegion === "전체" ? "전국" : selectedRegion} 지역 {filteredShelters.length}개의 보호소
                </p>
              </div>
            </div>

            {/* List area */}
            <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-2 pr-1">
              {filteredShelters.map((shelter) => {
                const isActive = activeShelterId === shelter.shelter_id;
                return (
                  <div
                    key={shelter.shelter_id}
                    onClick={() => setActiveShelterId(isActive ? null : shelter.shelter_id)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? "border-[#FF7A50] bg-[#FFF1EC]/20 shadow-inner"
                        : "border-[#F0E5DD] bg-[#FFFBF7]/30 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-[16px] leading-relaxed font-bold text-on-surface">{shelter.name}</h4>
                      <span className={`material-symbols-outlined text-zinc-400 transition-transform ${isActive ? "rotate-180 text-primary-container" : ""}`}>
                        expand_more
                      </span>
                    </div>
                    <p className="font-caption text-[12px] text-on-surface-variant truncate">{shelter.address}</p>
                    
                    {/* Collapsible Details */}
                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-[#F0E5DD] flex flex-col gap-3 text-caption animate-fade-in">
                        <div className="flex flex-col gap-2 text-[12px]">
                          <div className="flex justify-between">
                            <span className="text-[#8B716A]">전화번호</span>
                            <a href={`tel:${shelter.phone}`} className="font-semibold text-primary-container hover:underline">{shelter.phone}</a>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8B716A]">운영시간</span>
                            <span className="text-on-surface text-right">{shelter.hours}</span>
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[#8B716A] font-semibold">입양 안내</span>
                            <span className="text-zinc-500 leading-relaxed leading-5">{shelter.guide}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Link
                            href={`/animals?shelter_id=${shelter.shelter_id}`}
                            className="flex-1 h-[36px] bg-primary-container text-white rounded-lg flex items-center justify-center font-button-lg text-caption hover:opacity-90 active:scale-95 transition-all font-bold"
                          >
                            이 보호소 동물 보기
                          </Link>
                          <Link
                            href="/shelter-questionnaire"
                            className="flex-1 h-[36px] border border-[#dfc0b7] bg-white text-[#8b716a] hover:bg-zinc-50 rounded-lg flex items-center justify-center font-button-lg text-caption active:scale-95 transition-all"
                          >
                            질문지 작성하기
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredShelters.length === 0 && (
                <div className="text-center py-giant text-on-surface-variant flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[36px] text-gray-300">location_off</span>
                  <p className="text-[16px] leading-relaxed">해당 지역에 등록된 보호소가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
