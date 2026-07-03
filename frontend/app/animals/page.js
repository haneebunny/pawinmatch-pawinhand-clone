"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import AnimalCard from "../components/AnimalCard";
import { useSearchParams, useRouter } from "next/navigation";
import { animals } from "../data/animals";
import { shelters } from "../data/shelters";

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

// Determine if shelter belongs to a specific region based on address text (Identical to Map tab logic)
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

// 3-tier cascade location matching (Identical to Map tab algorithm for 100% data consistency)
const isAnimalInRegion = (animal, regionName) => {
  if (regionName === "전체") return true;

  // 1. Direct city mapping (Highest priority)
  const city = animal.city || "";
  if (city) {
    if (regionName === "경기/인천") {
      return city.includes("경기") || city.includes("인천") || city.includes("경기도") || city.includes("인천광역시");
    }
    if (regionName === "경북/대구") {
      return city.includes("경북") || city.includes("대구") || city.includes("경상북도") || city.includes("대구광역시");
    }
    if (regionName === "경남/부산") {
      return city.includes("경남") || city.includes("부산") || city.includes("울산") || city.includes("경상남도") || city.includes("부산광역시") || city.includes("울산광역시");
    }
    if (regionName === "전남/광주") {
      return city.includes("전남") || city.includes("광주") || city.includes("전라남도") || city.includes("광주광역시");
    }
    if (regionName === "충청") {
      return (
        city.includes("충북") || city.includes("충남") || city.includes("대전") || city.includes("세종") ||
        city.includes("충청") || city.includes("충청남도") || city.includes("충청북도") ||
        city.includes("대전광역시") || city.includes("세종특별자치시")
      );
    }
    return city.includes(regionName);
  }

  // 2. Notice number prefix parsing if city is missing
  const noticeNo = animal.notice_no || "";
  if (noticeNo) {
    const prefix = noticeNo.split("-")[0];
    if (regionName === "경기/인천") {
      return prefix.includes("경기") || prefix.includes("인천");
    }
    if (regionName === "경북/대구") {
      return prefix.includes("경북") || prefix.includes("대구");
    }
    if (regionName === "경남/부산") {
      return prefix.includes("경남") || prefix.includes("부산") || prefix.includes("울산");
    }
    if (regionName === "전남/광주") {
      return prefix.includes("전남") || prefix.includes("광주");
    }
    if (regionName === "충청") {
      return prefix.includes("충북") || prefix.includes("충남") || prefix.includes("대전") || prefix.includes("세종");
    }
    return prefix.includes(regionName);
  }

  // 3. Fallback to matched shelter address
  const shelter = shelters.find((s) => s.shelter_id === animal.shelter_id);
  if (shelter) {
    return isShelterInRegion(shelter, regionName);
  }

  return false;
};

function AnimalsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shelterIdFilter = searchParams.get("shelter_id");

  const [currentPage, setCurrentPage] = useState(1);
  const [regionFilter, setRegionFilter] = useState("전체");
  const [speciesFilter, setSpeciesFilter] = useState("전체");
  const [sortBy, setSortBy] = useState("최신순");

  // Custom dropdown open state ('region' | 'species' | 'sort' | null)
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownContainerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtering & Sorting Pipeline
  const getProcessedAnimals = () => {
    let filtered = animals;

    // Filter by shelter_id if query exists
    if (shelterIdFilter) {
      filtered = filtered.filter((a) => a.shelter_id === shelterIdFilter);
    }

    // Filter by Region
    if (regionFilter !== "전체") {
      filtered = filtered.filter((a) => isAnimalInRegion(a, regionFilter));
    }

    // Filter by Species
    if (speciesFilter !== "전체") {
      filtered = filtered.filter((a) => {
        const sp = a.species || "";
        if (speciesFilter === "개") {
          return sp.includes("개");
        }
        if (speciesFilter === "고양이") {
          return sp.includes("고양이");
        }
        if (speciesFilter === "기타") {
          return !sp.includes("개") && !sp.includes("고양이");
        }
        return true;
      });
    }

    // Sort matching requirements
    return [...filtered].sort((a, b) => {
      if (sortBy === "공고마감순") {
        const dateA = a.notice_end ? new Date(a.notice_end) : new Date("9999-12-31");
        const dateB = b.notice_end ? new Date(b.notice_end) : new Date("9999-12-31");
        return dateA - dateB;
      }
      if (sortBy === "최신순") {
        const dateA = a.notice_start ? new Date(a.notice_start) : new Date("1970-01-01");
        const dateB = b.notice_start ? new Date(b.notice_start) : new Date("1970-01-01");
        return dateB - dateA; // Newest first
      }
      if (sortBy === "알림받기 많은 순") {
        const countA = a.bell_count || 0;
        const countB = b.bell_count || 0;
        return countB - countA; // Highest notification count first
      }
      return 0;
    });
  };

  const filteredAnimals = getProcessedAnimals();

  // Reset to page 1 if any filter or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [shelterIdFilter, regionFilter, speciesFilter, sortBy]);

  const totalPages = Math.ceil(filteredAnimals.length / 20);
  const paginatedAnimals = filteredAnimals.slice((currentPage - 1) * 20, currentPage * 20);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Find shelter name for heading
  const activeShelter = shelterIdFilter
    ? shelters.find((s) => s.shelter_id === shelterIdFilter)
    : null;

  const handleClearFilter = () => {
    router.push("/animals");
    setRegionFilter("전체");
    setSpeciesFilter("전체");
    setSortBy("최신순");
    setOpenDropdown(null);
  };

  const REGIONS = ["전체", "서울", "경기/인천", "강원", "충청", "전북", "전남/광주", "경북/대구", "경남/부산", "제주"];
  const SPECIES = ["전체", "개", "고양이", "기타"];
  const SORT_OPTIONS = [
    { value: "최신순", label: "최신순" },
    { value: "공고마감순", label: "공고마감순" },
    { value: "알림받기 많은 순", label: "알림받기 많은 순" }
  ];

  return (
    <main className="pb-8">
      {/* Page Title and Filters */}
      <section className="max-w-[1024px] mx-auto px-4 md:px-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-8 border-b border-[#F0E5DD] pb-6 w-full">
          <div>
            <span className="font-caption text-[11px] font-bold text-[#FF7A50] bg-[#FFF1EC] px-2.5 py-1 rounded-full uppercase tracking-wider">
              🐾 ADOPTION SEARCH DIRECTORY
            </span>
            <h1 className="text-[28px] md:text-[32px] font-black text-zinc-800 mt-3 leading-tight">
              유기동물 보호 목록
            </h1>
            <p className="text-[14px] md:text-[15px] text-[#8B716A] mt-1.5 font-medium">
              {activeShelter
                ? `[${activeShelter.name}]에서 보호 중인 아이들을 보여드려요.`
                : "새로운 보호자를 애타게 기다리고 있는 아이들을 만나보세요."
              }
            </p>
          </div>
          <Link
            href="/map"
            className="flex items-center gap-1.5 bg-white border border-[#FFE2D6] hover:bg-[#FFFDFB] text-[#FF7A50] px-4.5 py-2.5 rounded-xl text-[13.5px] font-bold active:scale-98 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>지도로 보기
          </Link>
        </div>

        {/* Custom Filter and Reset Chips (Outside clicks target dropdownContainerRef) */}
        <div ref={dropdownContainerRef} className="flex flex-wrap gap-2.5 mb-8 border-b border-surface-variant/20 pb-4 items-center relative z-20">

          {/* Region Dropdown */}
          <div className="relative w-[130px]">
            <button
              onClick={() => setOpenDropdown(openDropdown === "region" ? null : "region")}
              className={`flex items-center justify-between w-full border px-4 py-2 rounded-xl font-body text-[14px] transition-all cursor-pointer ${openDropdown === "region"
                ? "bg-[#FFF1EC] border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm"
                : regionFilter !== "전체"
                  ? "bg-[#FFF1EC]/30 border-[#FF7A50] text-[#FF7A50] font-bold"
                  : "bg-white border-surface-variant/50 text-on-surface-variant hover:bg-zinc-50 hover:border-zinc-300"
                }`}
            >
              <span className="truncate">지역: {regionFilter}</span>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 shrink-0">
                {openDropdown === "region" ? "expand_less" : "expand_more"}
              </span>
            </button>

            {openDropdown === "region" && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-surface-variant/30 rounded-xl shadow-lg z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegionFilter(r);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[13.5px] cursor-pointer transition-colors ${regionFilter === r
                      ? "bg-[#FFF1EC] text-[#FF7A50] font-bold"
                      : "text-zinc-700 hover:bg-[#FFF1EC]/50 hover:text-[#FF7A50]"
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Species Dropdown */}
          <div className="relative w-[115px]">
            <button
              onClick={() => setOpenDropdown(openDropdown === "species" ? null : "species")}
              className={`flex items-center justify-between w-full border px-4 py-2 rounded-xl font-body text-[14px] transition-all cursor-pointer ${openDropdown === "species"
                ? "bg-[#FFF1EC] border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm"
                : speciesFilter !== "전체"
                  ? "bg-[#FFF1EC]/30 border-[#FF7A50] text-[#FF7A50] font-bold"
                  : "bg-white border-surface-variant/50 text-on-surface-variant hover:bg-zinc-50 hover:border-zinc-300"
                }`}
            >
              <span className="truncate">축종: {speciesFilter}</span>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 shrink-0">
                {openDropdown === "species" ? "expand_less" : "expand_more"}
              </span>
            </button>

            {openDropdown === "species" && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-surface-variant/30 rounded-xl shadow-lg z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {SPECIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSpeciesFilter(s);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[13.5px] cursor-pointer transition-colors ${speciesFilter === s
                      ? "bg-[#FFF1EC] text-[#FF7A50] font-bold"
                      : "text-zinc-700 hover:bg-[#FFF1EC]/50 hover:text-[#FF7A50]"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="relative w-[190px]">
            <button
              onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
              className={`flex items-center justify-between w-full border px-4 py-2 rounded-xl font-body text-[14px] transition-all cursor-pointer ${openDropdown === "sort"
                ? "bg-[#FFF1EC] border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm"
                : sortBy !== "최신순"
                  ? "bg-[#FFF1EC]/30 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm"
                  : "bg-white border-surface-variant/50 text-on-surface-variant hover:bg-zinc-50 hover:border-zinc-300"
                }`}
            >
              <span className="truncate">정렬: {sortBy}</span>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 shrink-0">
                {openDropdown === "sort" ? "expand_less" : "expand_more"}
              </span>
            </button>

            {openDropdown === "sort" && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-surface-variant/30 rounded-xl shadow-lg z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[13.5px] cursor-pointer transition-colors ${sortBy === opt.value
                      ? "bg-[#FFF1EC] text-[#FF7A50] font-bold"
                      : "text-zinc-700 hover:bg-[#FFF1EC]/50 hover:text-[#FF7A50]"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear button if any filter is active */}
          {(regionFilter !== "전체" || speciesFilter !== "전체" || sortBy !== "최신순" || (shelterIdFilter && activeShelter)) && (
            <button
              onClick={handleClearFilter}
              className="text-[12.5px] font-bold text-[#8B716A] hover:text-[#FF7A50] transition-colors cursor-pointer flex items-center gap-0.5 ml-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>필터 초기화
            </button>
          )}

          {shelterIdFilter && activeShelter && (
            <div className="flex items-center gap-1 bg-[#FFF1EC] border border-[#ffb59f] px-4 py-2 rounded-full font-body text-[14px] text-primary-container">
              <span>보호소: {activeShelter.name}</span>
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

        {/* 4x5 Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {paginatedAnimals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center text-[14px] font-bold transition-all cursor-pointer ${currentPage === 1
                ? "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                : "bg-white border-[#F0E5DD] text-zinc-600 hover:bg-zinc-50"
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {(() => {
              const PAGE_BLOCK_SIZE = 5;
              const currentBlock = Math.floor((currentPage - 1) / PAGE_BLOCK_SIZE);
              const startPage = currentBlock * PAGE_BLOCK_SIZE + 1;
              const endPage = Math.min(startPage + PAGE_BLOCK_SIZE - 1, totalPages);
              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
              }
              return pages.map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-lg border text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center ${isActive
                      ? "bg-[#FF7A50] text-white border-transparent shadow-sm"
                      : "bg-white border-[#F0E5DD] text-zinc-600 hover:bg-zinc-50"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center text-[14px] font-bold transition-all cursor-pointer ${currentPage === totalPages
                ? "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                : "bg-white border-[#F0E5DD] text-zinc-600 hover:bg-zinc-50"
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}

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


