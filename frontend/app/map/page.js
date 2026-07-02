"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { shelters } from "../data/shelters";
import { animals } from "../data/animals";

const ID_TO_REGION = {
  seoul: "서울",
  gyeonggi: "경기/인천",
  incheon: "경기/인천",
  gangwon: "강원",
  chungnam: "충청",
  chungbuk: "충청",
  daejeon: "충청",
  sejong: "충청",
  jeonbuk: "전북",
  jeonnam: "전남/광주",
  gwangju: "전남/광주",
  gyeongbuk: "경북/대구",
  daegu: "경북/대구",
  gyeongnam: "경남/부산",
  ulsan: "경남/부산",
  busan: "경남/부산",
  jeju: "제주"
};

const REGIONAL_COORDS = [
  { region: "서울", top: "25%", left: "32%" },
  { region: "경기/인천", top: "18%", left: "42%" },
  { region: "강원", top: "17%", left: "66%" },
  { region: "충청", top: "41%", left: "44%" },
  { region: "전북", top: "57%", left: "34%" },
  { region: "경북/대구", top: "48%", left: "74%" },
  { region: "경남/부산", top: "70%", left: "68%" },
  { region: "전남/광주", top: "72%", left: "28%" },
  { region: "제주", top: "86%", left: "24%" }
];

// Determine if animal belongs to a specific region based on address text (Priority-based matching)
const isAnimalInRegion = (animal, regionName) => {
  // 1. If the animal object has a valid 'city' field, trust it as the absolute source of truth
  if (animal.city && animal.city.trim() !== "") {
    const city = animal.city;
    if (regionName === "경기/인천") {
      return (
        city.includes("경기") || city.includes("인천") || 
        city.includes("경기도") || city.includes("인천광역시")
      );
    }
    if (regionName === "경북/대구") {
      return (
        city.includes("경북") || city.includes("대구") || 
        city.includes("경상북도") || city.includes("대구광역시")
      );
    }
    if (regionName === "경남/부산") {
      return (
        city.includes("경남") || city.includes("부산") || city.includes("울산") || 
        city.includes("경상남도") || city.includes("부산광역시") || city.includes("울산광역시")
      );
    }
    if (regionName === "전남/광주") {
      return (
        city.includes("전남") || city.includes("광주") || 
        city.includes("전라남도") || city.includes("광주광역시")
      );
    }
    if (regionName === "충청") {
      return (
        city.includes("충북") || city.includes("충남") || city.includes("대전") || city.includes("세종") ||
        city.includes("충청") || city.includes("대전광역시") || city.includes("세종특별자치시") ||
        city.includes("충청남도") || city.includes("충청북도")
      );
    }
    return city.includes(regionName);
  }

  // 2. If 'city' is missing (e.g. Kongtteok), extract region via notice_no/id prefix
  const noticeNo = animal.notice_no || animal.id || "";
  if (noticeNo.startsWith("서울")) {
    return regionName === "서울";
  }
  if (noticeNo.startsWith("경기") || noticeNo.startsWith("인천")) {
    return regionName === "경기/인천";
  }
  if (noticeNo.startsWith("강원")) {
    return regionName === "강원";
  }
  if (noticeNo.startsWith("제주")) {
    return regionName === "제주";
  }
  if (noticeNo.startsWith("전북")) {
    return regionName === "전북";
  }
  if (noticeNo.startsWith("전남") || noticeNo.startsWith("광주")) {
    return regionName === "전남/광주";
  }
  if (noticeNo.startsWith("경북") || noticeNo.startsWith("대구")) {
    return regionName === "경북/대구";
  }
  if (noticeNo.startsWith("경남") || noticeNo.startsWith("부산") || noticeNo.startsWith("울산")) {
    return regionName === "경남/부산";
  }
  if (
    noticeNo.startsWith("충북") || noticeNo.startsWith("충남") || 
    noticeNo.startsWith("대전") || noticeNo.startsWith("세종") || 
    noticeNo.startsWith("충청")
  ) {
    return regionName === "충청";
  }

  // 3. Fallback: Check protecting shelter address
  const shelter = shelters.find((s) => s.shelter_id === animal.shelter_id);
  if (shelter) {
    return isShelterInRegion(shelter, regionName);
  }

  return false;
};

// Determine if shelter belongs to a specific region based on address text
const isShelterInRegion = (shelter, regionName) => {
  const addr = shelter.address || "";
  
  if (regionName === "경기/인천") {
    return addr.includes("경기") || addr.includes("인천") || addr.includes("수원") || addr.includes("경기도") || addr.includes("인천광역시");
  }
  if (regionName === "경북/대구") {
    return addr.includes("경북") || addr.includes("대구") || addr.includes("구미") || addr.includes("경상북도") || addr.includes("대구광역시");
  }
  if (regionName === "경남/부산") {
    return addr.includes("경남") || addr.includes("부산") || addr.includes("울산") || addr.includes("창원") || addr.includes("경상남도") || addr.includes("부산광역시") || addr.includes("울산광역시");
  }
  if (regionName === "전남/광주") {
    return addr.includes("전남") || addr.includes("광주") || addr.includes("전라남도") || addr.includes("광주광역시");
  }
  if (regionName === "충청") {
    return (
      addr.includes("충북") || addr.includes("충남") || addr.includes("대전") || addr.includes("세종") || 
      addr.includes("천안") || addr.includes("충청") || addr.includes("충청남도") || addr.includes("충청북도") ||
      addr.includes("대전광역시") || addr.includes("세종특별자치시")
    );
  }
  return addr.includes(regionName);
};

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

export default function MapPage() {
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [filteredShelters, setFilteredShelters] = useState(shelters);
  const [filteredAnimals, setFilteredAnimals] = useState(animals);
  const [activeShelterId, setActiveShelterId] = useState(null);
  const [activeTab, setActiveTab] = useState("animals"); // "animals" | "shelters"
  const [mapSvg, setMapSvg] = useState("");
  
  const svgContainerRef = useRef(null);
  const svgLoadedRef = useRef(false);

  // Load the user's high-quality SVG map dynamically
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch("/data/Map_of_South_Korea.svg");
        if (res.ok) {
          let text = await res.text();
          // Remove hardcoded width/height to make it scale correctly in Tailwind container
          text = text.replace(/width="[^"]*"/g, 'width="100%"');
          text = text.replace(/height="[^"]*"/g, 'height="100%"');
          setMapSvg(text);
        } else {
          console.error("Failed to load map SVG status:", res.status);
        }
      } catch (err) {
        console.error("Failed to fetch map SVG:", err);
      }
    };
    fetchMap();
  }, []);

  // Write HTML to DOM once only and let react skip sub-tree updates
  useEffect(() => {
    if (mapSvg && svgContainerRef.current && !svgLoadedRef.current) {
      svgContainerRef.current.innerHTML = mapSvg;
      svgLoadedRef.current = true;
      // Trigger initial style update
      updateMapStyles(selectedRegion);
    }
  }, [mapSvg]);

  // Live count helper based on animal data
  const getAnimalCount = (regionName) => {
    return animals.filter((animal) => isAnimalInRegion(animal, regionName)).length;
  };

  // Sync selected region to lists and filters
  useEffect(() => {
    if (selectedRegion === "전체") {
      setFilteredShelters(shelters);
      setFilteredAnimals(animals);
    } else {
      const regionShelters = shelters.filter((s) => isShelterInRegion(s, selectedRegion));
      setFilteredShelters(regionShelters);

      const regionAnimals = animals.filter((a) => isAnimalInRegion(a, selectedRegion));
      setFilteredAnimals(regionAnimals);
    }
    setActiveShelterId(null);
  }, [selectedRegion]);

  // Function to apply colors to SVG regions dynamically
  const updateMapStyles = (activeRegion) => {
    if (!svgContainerRef.current) return;
    const elements = svgContainerRef.current.querySelectorAll("polyline, path, polygon");
    elements.forEach((el) => {
      const id = el.getAttribute("id");
      if (!id) return;
      
      const idLower = id.toLowerCase();
      let regionName = null;
      for (const key of Object.keys(ID_TO_REGION)) {
        if (idLower.includes(key)) {
          regionName = ID_TO_REGION[key];
          break;
        }
      }

      // If this element is not part of our 9 regions, do NOT touch it!
      if (!regionName) return;

      // Base Styling - Strip hardcoded inline style for mapped regions only
      el.removeAttribute("style");
      el.style.transition = "fill 0.3s ease, stroke 0.3s ease, filter 0.3s ease";
      el.style.cursor = "pointer";
      el.style.paintOrder = "fill stroke";
      el.style.strokeLinecap = "round";
      el.style.strokeLinejoin = "round";

      const isSelected = activeRegion === regionName;
      if (isSelected) {
        el.style.fill = "#FFDBCF"; // Pawinhand Light Orange (Same as Hover)
        el.style.stroke = "#FFDBCF"; // Match fill exactly to make inner district borders invisible
        el.style.strokeWidth = "1px";
        el.style.filter = "drop-shadow(0px 3px 6px rgba(255, 122, 80, 0.35))";
      } else {
        el.style.fill = "#F2EBE5"; // Premium default warm gray
        el.style.stroke = "#DCD6CE"; // Soft warm gray stroke to make regional outlines visible
        el.style.strokeWidth = "1.2px";
        el.style.filter = "none";
      }
    });
  };

  // Sync selected region state to map styles
  useEffect(() => {
    if (svgLoadedRef.current) {
      updateMapStyles(selectedRegion);
    }
  }, [selectedRegion]);

  // Bind interactive fills and mouse events directly to SVG elements
  useEffect(() => {
    if (!svgContainerRef.current || !mapSvg) return;

    // Track active selection in dataset to prevent state closures from resetting fill colors
    svgContainerRef.current.dataset.selectedRegion = selectedRegion;

    const elements = svgContainerRef.current.querySelectorAll("polyline, path, polygon");

    elements.forEach((el) => {
      const id = el.getAttribute("id");
      if (!id) return;
      
      const idLower = id.toLowerCase();
      let regionName = null;
      for (const key of Object.keys(ID_TO_REGION)) {
        if (idLower.includes(key)) {
          regionName = ID_TO_REGION[key];
          break;
        }
      }

      // Skip elements that don't match our geographic regions (ocean, lines, metadata)
      if (!regionName) return;

      // Base Interaction Styling
      el.style.cursor = "pointer";

      // Hover Interaction handlers
      const handleMouseOver = () => {
        const currentSelected = svgContainerRef.current ? svgContainerRef.current.dataset.selectedRegion : "";
        if (currentSelected !== regionName) {
          el.style.fill = "#FFDBCF"; // Light warm orange hover color
          el.style.stroke = "#FFDBCF"; // Merge inner borders on hover
          el.style.strokeWidth = "1px";
          el.style.filter = "drop-shadow(0px 2px 4px rgba(255, 122, 80, 0.2))";
        }
      };

      const handleMouseOut = () => {
        const currentSelected = svgContainerRef.current ? svgContainerRef.current.dataset.selectedRegion : "";
        if (currentSelected !== regionName) {
          el.style.fill = "#F2EBE5";
          el.style.stroke = "#DCD6CE"; // Restore soft gray border
          el.style.strokeWidth = "1.2px";
          el.style.filter = "none";
        } else {
          el.style.fill = "#FFDBCF";
          el.style.stroke = "#FFDBCF";
          el.style.strokeWidth = "1px";
          el.style.filter = "drop-shadow(0px 3px 6px rgba(255, 122, 80, 0.35))";
        }
      };

      const handleClick = () => {
        setSelectedRegion(regionName);
        if (svgContainerRef.current) {
          svgContainerRef.current.dataset.selectedRegion = regionName;
        }
        updateMapStyles(regionName);
      };

      // Assign events safely
      el.addEventListener("mouseover", handleMouseOver);
      el.addEventListener("mouseout", handleMouseOut);
      el.addEventListener("click", handleClick);

      // Save references on element for cleanup to avoid memory leaks
      el._cleanup = () => {
        el.removeEventListener("mouseover", handleMouseOver);
        el.removeEventListener("mouseout", handleMouseOut);
        el.removeEventListener("click", handleClick);
      };
    });

    return () => {
      elements.forEach((el) => {
        if (el._cleanup) el._cleanup();
      });
    };
  }, [mapSvg]);

  return (
    <main className="w-full max-w-[1024px] flex flex-col min-h-[calc(100vh-72px)] px-4 md:px-6 mx-auto pb-8">
      {/* 1. Thin Banner */}
      <section className="mt-4">
        <div className="bg-[#FFF1EC] text-[#852400] px-4 py-2.5 rounded-xl flex items-center gap-2 border border-[#FFE2D6]">
          <span className="material-symbols-outlined text-[20px]">info</span>
          <p className="text-[13px] leading-normal font-medium">지도의 지역명을 클릭하여 우리 동네 유기동물과 보호소를 실시간 확인해 보세요.</p>
        </div>
      </section>

      {/* 2. Two-Column Layout */}
      <section className="mt-6 flex flex-col md:flex-row gap-6 flex-grow">
        {/* Left Column: Interactive High-Quality SVG Map (55% width) */}
        <div className="w-full md:w-[55%] flex flex-col">
          <div className="relative w-full aspect-[2/3] md:aspect-[4/5] bg-[#FFFDFB] border border-[#F0E5DD] rounded-2xl overflow-hidden p-6 shadow-sm flex items-center justify-center">
            {/* Map title overlay */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#F0E5DD] z-20 shadow-sm">
              <span className="font-caption text-[11px] font-bold text-[#FF7A50] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-ping"></span>
                실시간 지역별 집계 현황
              </span>
            </div>

            {/* Reset Filter Button */}
            <button
              onClick={() => setSelectedRegion("전체")}
              className={`absolute bottom-4 left-4 z-20 px-4 h-[38px] rounded-full border text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                selectedRegion === "전체"
                  ? "bg-[#FF7A50] text-white border-transparent"
                  : "bg-white text-zinc-600 border-[#F0E5DD] hover:bg-zinc-100"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              전국 보기 (초기화)
            </button>

            {/* High-Quality SVG Map Container (Bypasses React DOM reconciliation) */}
            <div 
              ref={svgContainerRef}
              className="w-full h-full p-2 relative flex items-center justify-center"
            />

            {/* Interactive regional markers */}
            {mapSvg && REGIONAL_COORDS.map((marker) => {
              const count = getAnimalCount(marker.region);
              const isActive = selectedRegion === marker.region;
              return (
                <button
                  key={marker.region}
                  onClick={() => setSelectedRegion(marker.region)}
                  style={{ top: marker.top, left: marker.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full font-bold text-[10px] md:text-[11px] shadow-md cursor-pointer transition-all active:scale-95 z-10 flex items-center gap-1 ${
                    isActive
                      ? "bg-[#FF7A50] text-white border border-[#FF7A50] scale-105 ring-4 ring-[#FF7A50]/20"
                      : "bg-white border border-[#FFE2D6] text-[#FF7A50] hover:bg-[#FFFDFB]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    location_on
                  </span>
                  <span>{marker.region} <span className="font-extrabold">{count}</span></span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Side Panel (45% width) */}
        <div className="w-full md:w-[45%] flex flex-col">
          <div className="bg-white border border-[#F0E5DD] rounded-2xl p-5 flex flex-col h-[525px] md:h-[625px] shadow-sm overflow-hidden">
            {/* Header info */}
            <div className="pb-3 border-b border-[#F0E5DD] mb-4 flex flex-col gap-3">
              <div>
                <h3 className="text-[18px] font-bold text-on-surface">
                  {selectedRegion === "전체" ? "전국 정보" : `${selectedRegion} 지역`}
                </h3>
                <p className="text-[13px] text-[#8B716A] mt-0.5">
                  보호소 <strong>{filteredShelters.length}</strong>개 | 동물 <strong>{filteredAnimals.length}</strong>마리
                </p>
              </div>

              {/* Sidebar Tabs */}
              <div className="flex bg-[#F5F0EB] p-0.5 rounded-lg">
                <button
                  onClick={() => setActiveTab("animals")}
                  className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all cursor-pointer ${
                    activeTab === "animals" ? "bg-white text-[#FF7A50] shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  동물 목록 ({filteredAnimals.length})
                </button>
                <button
                  onClick={() => setActiveTab("shelters")}
                  className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all cursor-pointer ${
                    activeTab === "shelters" ? "bg-white text-[#FF7A50] shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  보호소 목록 ({filteredShelters.length})
                </button>
              </div>
            </div>

            {/* Tab content wrapper */}
            <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-3 pr-1">
              
              {/* Tab 1: Animals List */}
              {activeTab === "animals" && (
                <>
                  {filteredAnimals.map((animal) => (
                    <Link
                      key={animal.id}
                      href={`/animals/${animal.id}`}
                      className="flex gap-3 p-3 border border-[#F0E5DD] rounded-xl hover:border-[#FF7A50] transition-colors cursor-pointer group bg-[#FFFBF7]/30"
                    >
                      <div className="w-[72px] h-[72px] rounded-lg overflow-hidden shrink-0 border border-zinc-100">
                        <img
                          src={animal.photos && animal.photos.length > 0 ? animal.photos[0] : (animal.photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200")}
                          alt={animal.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col justify-center min-w-0 flex-grow">
                        <h4 className="text-[15px] font-extrabold text-on-surface leading-tight truncate flex items-center gap-1.5">
                          {animal.name && animal.name.trim() !== "" && !animal.name.includes("없음") ? animal.name : "이름 짓는 중!"}
                          <span className="text-zinc-400 font-normal text-[11px]">
                            {animal.animal_sex === "수컷" || animal.animal_sex === "수" ? "♂️" : "♀️"}
                          </span>
                        </h4>
                        <p className="text-[12px] text-[#8B716A] truncate mt-1">
                          {animal.breeds} • {formatAge(animal.animal_age)}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate mt-1">
                          {(animal.notice_no && animal.notice_no.split("-")[0]) || "보호"}보호소
                        </p>
                      </div>
                    </Link>
                  ))}

                  {filteredAnimals.length === 0 && (
                    <div className="text-center py-12 text-zinc-400 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-gray-300">pets_off</span>
                      <p className="text-[14px]">이 지역에 등록된 동물이 없습니다.</p>
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: Shelters List */}
              {activeTab === "shelters" && (
                <>
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
                          <h4 className="text-[15px] font-bold text-on-surface">{shelter.name}</h4>
                          <span className={`material-symbols-outlined text-zinc-400 transition-transform ${isActive ? "rotate-180 text-[#FF7A50]" : ""}`}>
                            expand_more
                          </span>
                        </div>
                        <p className="font-caption text-[11px] text-zinc-500 truncate">{shelter.address}</p>
                        
                        {/* Collapsible Details */}
                        {isActive && (
                          <div className="mt-3 pt-3 border-t border-[#F0E5DD] flex flex-col gap-2.5 text-[12px] animate-fade-in">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between">
                                <span className="text-zinc-400">전화번호</span>
                                <a href={`tel:${shelter.phone}`} className="font-semibold text-[#FF7A50] hover:underline">{shelter.phone}</a>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">운영시간</span>
                                <span className="text-[#8B716A] text-right">{shelter.hours}</span>
                              </div>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <span className="text-zinc-400 font-semibold">입양 안내</span>
                                <span className="text-zinc-500 leading-relaxed leading-5">{shelter.guide}</span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-1">
                              <Link
                                href={`/animals?shelter_id=${shelter.shelter_id}`}
                                className="flex-1 h-[36px] bg-[#FF7A50] text-white rounded-lg flex items-center justify-center text-[12px] hover:opacity-90 active:scale-95 transition-all font-bold"
                              >
                                이 보호소 동물 보기
                              </Link>
                              <Link
                                href="/shelter-questionnaire"
                                className="flex-1 h-[36px] border border-[#FFE2D6] bg-white text-[#FF7A50] hover:bg-[#FFFDFB] rounded-lg flex items-center justify-center text-[12px] active:scale-95 transition-all font-bold"
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
                    <div className="text-center py-12 text-zinc-400 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-gray-300">location_off</span>
                      <p className="text-[14px]">이 지역에 등록된 보호소가 없습니다.</p>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
