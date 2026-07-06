"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { animals } from "../../data/animals";
import { shelters } from "../../data/shelters";
import { MatchCardSkeleton } from "../../components/Skeleton";

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

const HighlightText = ({ text }) => {
  if (!text) return null;
  const parts = text.split("==");
  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <span
              key={index}
              className="px-1.5 py-0.5 rounded-md font-bold"
              style={{ backgroundColor: "#FFE7D9", color: "#FF7A50" }}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

function MatchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRelaxedParam = searchParams.get("relaxed") === "true";

  const [matchedList, setMatchedList] = useState([]);
  const [surveyInput, setSurveyInput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegionRelaxed, setIsRegionRelaxed] = useState(isRelaxedParam); // 전국 매칭 상태

  useEffect(() => {
    // Read survey responses from localStorage
    const savedSurvey = localStorage.getItem("pawinhand_survey_input");
    if (!savedSurvey) {
      setLoading(false);
      return;
    }

    const survey = JSON.parse(savedSurvey);
    setSurveyInput(survey);

    // Check cache according to the current region relaxation state
    const cacheKey = isRegionRelaxed ? "pawinhand_match_results_relaxed" : "pawinhand_match_results";
    const savedMatches = localStorage.getItem(cacheKey);
    if (savedMatches) {
      try {
        const parsed = JSON.parse(savedMatches);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMatchedList(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached match results", e);
      }
    }

    setLoading(true);

    // Collect currently recommended animal IDs to exclude them from the next recommendation
    let currentIds = [];
    if (isRegionRelaxed) {
      const localMatches = localStorage.getItem("pawinhand_match_results");
      if (localMatches) {
        try {
          const parsedLocal = JSON.parse(localMatches);
          if (Array.isArray(parsedLocal)) {
            currentIds = parsedLocal.map((a) => a.id);
          }
        } catch (e) {
          console.warn("Failed to parse local matches for exclusion", e);
        }
      }
      if (currentIds.length === 0 && matchedList.length > 0) {
        currentIds = matchedList.map((a) => a.id);
      }
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://pawinhand-clone-production-9194.up.railway.app";

    const fetchMatches = async () => {
      try {
        const requestBody = {
          ...survey,
          exclude_ids: currentIds,
          is_relaxed: isRegionRelaxed
        };

        const response = await fetch(`${API_BASE}/api/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json(); // { results: [{ animal_id, match_score, recommend_reason }] }
          
          // Fetch live animals dataset first to use up-to-date names/photos from backend
          let liveAnimalsList = animals;
          try {
            const liveRes = await fetch(`${API_BASE}/api/animals`);
            if (liveRes.ok) {
              const liveData = await liveRes.json();
              if (Array.isArray(liveData) && liveData.length > 0) {
                liveAnimalsList = liveData;
              }
            }
          } catch (e) {
            console.warn("Failed to fetch live animals for match results mapping, using local static data", e);
          }

          // Map backend match results to local animals data
          const matched = data.results.map((res) => {
            // 프론트엔드에서도 중복 추천 방지를 위해 이미 추천 리스트에 나타났던 ID는 안전하게 필터링합니다.
            if (currentIds.includes(res.animal_id)) return null;
            
            const info = liveAnimalsList.find((a) => a.id === res.animal_id);
            if (info) {
              return {
                ...info,
                match_score: res.match_score,
                recommend_reason: res.recommend_reason
              };
            }
            return null;
          }).filter(Boolean);

          setMatchedList(matched);
          localStorage.setItem(cacheKey, JSON.stringify(matched));
          setLoading(false);
        } else {
          throw new Error("API response not ok");
        }
      } catch (error) {
        console.warn("FastAPI Server not available for matching. Simulating locally.", error);
        
        // Fallback: Local match calculation logic (runs with 1s delay to feel natural)
        setTimeout(() => {
          // Filter out already recommended animals
          const availableAnimals = animals.filter((a) => !currentIds.includes(a.id));

          const scoredAnimals = availableAnimals.map((animal) => {
            let score = 7; // Base score
            let reasons = [];

            // 1. Walk Time vs Activity Level
            if (survey.walk_time === "30분 미만") {
              if (animal.activity >= 4) {
                score -= 2;
                reasons.push("활동량이 높은 편이라 매일 30분 이상의 활발한 산책이 권장돼요");
              } else {
                score += 1;
                reasons.push("산책 시간이 다소 짧아도 스트레스를 잘 받지 않는 얌전한 성격이에요");
              }
            } else if (survey.walk_time === "1시간 이상") {
              if (animal.activity >= 4) {
                score += 2;
                reasons.push("매일 1시간 이상 함께 힘차게 뛰놀아 줄 수 있어 이상적인 파트너예요");
              } else {
                score += 0.5;
                reasons.push("체력이 좋은 편이라 함께 장시간 산책이나 가벼운 등산을 즐길 수 있어요");
              }
            }

            // 2. Out Hours vs Sociability
            if (survey.out_hours === "8시간 이상") {
              if (animal.sociability >= 4) {
                score -= 1.5;
                reasons.push("사람을 몹시 그리워하는 성격으로 혼자 오래 두면 쓸쓸해할 수 있어요");
              } else {
                score += 1.5;
                reasons.push("독립성이 강해 보호자 부재 시에도 혼자만의 시간을 비교적 의연하게 잘 보내요");
              }
            } else {
              if (animal.sociability >= 4) {
                score += 1.5;
                reasons.push("함께 보내는 시간이 많아 사랑을 듬뿍 주며 깊이 교감할 수 있는 궁합이에요");
              }
            }

            // 3. Housing vs Size
            if (survey.housing === "원룸·오피스텔") {
              if (animal.size === "대형") {
                score -= 3;
                reasons.push("체구가 큰 편이라 다소 좁은 원룸 공간에서는 활동에 제약이 있을 수 있어요");
              } else {
                score += 1;
                reasons.push("체구가 작아 오피스텔이나 좁은 주거 공간에서도 잘 지낼 수 있습니다");
              }
            } else if (survey.housing === "단독주택") {
              if (animal.size === "대형") {
                score += 1.5;
                reasons.push("마당이 있거나 넓은 주택에 적절한 듬직하고 멋진 대형 반려견입니다");
              }
            }

            // 4. Keywords matching
            const matchingKeywords = (animal.tags || []).filter((tag) => survey.keywords.includes(tag));
            if (matchingKeywords.length > 0) {
              score += matchingKeywords.length * 1.0;
              reasons.push(`당신이 선호하는 '${matchingKeywords.join(", ")}' 성향을 완벽히 가지고 있어요`);
            }

            // 5. Region matching (only when NOT region relaxed)
            if (!isRegionRelaxed && survey.preferred_cities && survey.preferred_cities.length > 0 && !survey.preferred_cities.includes("전체")) {
              const animalCity = animal.city || "";
              const noticeNo = animal.notice_no || "";
              const noticePrefix = noticeNo.split("-")[0] || "";
              
              const isMatched = survey.preferred_cities.some(prefCity => 
                animalCity.includes(prefCity) || noticePrefix.includes(prefCity)
              );
              if (isMatched) {
                score += 3;
              } else {
                score -= 2.5; // Filter non-matching regions out of top matches
              }
            }

            // Final clamping of scores
            let finalScore = Math.round(score);
            if (finalScore > 10) finalScore = 10;
            if (finalScore < 4) finalScore = 4;

            const recommend_reason = reasons.length > 0 
              ? reasons[reasons.length - 1] 
              : "당신의 라이프스타일과 전반적인 성향이 잘 어우러지는 친구예요";

            return {
              ...animal,
              match_score: finalScore,
              recommend_reason
            };
          });

          const sortedMatches = scoredAnimals.sort((a, b) => b.match_score - a.match_score);
          const topMatches = sortedMatches.slice(0, 4);
          
          setMatchedList(topMatches);
          localStorage.setItem(cacheKey, JSON.stringify(topMatches));
          setLoading(false);
        }, 1000);
      }
    };

    fetchMatches();
  }, [isRegionRelaxed]);

  if (!surveyInput) {
    return (
      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-giant min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[48px] text-gray-300">warning</span>
        <h3 className="text-[18px] font-semibold leading-normal text-on-surface">입양진단 이력이 없습니다</h3>
        <p className="text-[13px] leading-normal text-on-surface-variant">먼저 AI 적합도 진단을 진행해 주세요.</p>
        <Link href="/diagnose" className="bg-primary-container text-white px-6 h-[44px] rounded-lg font-button-lg flex items-center justify-center hover:opacity-90 transition-opacity">
          진단 시작하기
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-brand-ivory min-h-screen pt-4 pb-8">
        <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-8">
          <header className="mb-8">
            <div className="h-7 w-64 bg-zinc-200 rounded-md mb-2 animate-pulse" />
            <div className="h-4.5 w-80 bg-zinc-200 rounded-md animate-pulse" />
          </header>

          <div className="flex flex-col gap-5">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-ivory min-h-screen pt-4 pb-8">
      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-8">
        {/* Header Section */}
        <header className="mb-8">
          <h2 className="text-[22px] font-bold tracking-tight leading-snug text-on-surface font-bold">당신과 잘 맞는 아이들이에요</h2>
          <p className="text-[13px] leading-normal text-on-surface-variant mt-1">생활환경과 선호도를 바탕으로 추천한 결과예요.</p>
        </header>

        {/* Relaxed Region Notification Banner */}
        {isRegionRelaxed && (
          <div className="mb-6 bg-[#FFF5F0] border border-[#FFD9C7] rounded-2xl p-4 text-[#FF7A50] font-bold text-[14px] flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-[20px] text-[#FF7A50]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <span>지역 필터를 전국으로 완화하여 나에게 가장 잘 맞는 궁합의 아이들을 매칭했습니다!</span>
          </div>
        )}

        {/* Card List */}
        <div className="flex flex-col gap-5">
          {matchedList.map((animal) => (
            <Link
              key={animal.id}
              href={`/animals/${animal.id}?recommend=true${isRegionRelaxed ? "&relaxed=true" : ""}`}
              className="bg-white border border-border-line rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 relative cursor-pointer group shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-[2px] transition-all duration-300 overflow-hidden"
            >
              {/* Animal Photo & Match Score (Badge positioned below the photo) */}
              <div className="flex flex-col items-center gap-2.5 shrink-0 w-full sm:w-[130px]">
                <div className="relative w-full sm:w-[130px] h-[180px] sm:h-[130px] rounded-xl overflow-hidden bg-surface-container-low border border-border-line shadow-inner">
                  <img
                    src={animal.photos && animal.photos.length > 0 ? animal.photos[0] : (animal.photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400")}
                    alt={animal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Match Score Badge below photo */}
                <div className="bg-[#FFF1EC] text-[#FF7A50] font-extrabold text-[11.5px] px-3 py-1 rounded-full border border-[#FFE2D6] shadow-sm whitespace-nowrap shrink-0">
                  매칭 점수 {animal.match_score}점
                </div>
              </div>

              {/* Text Content */}
              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-center gap-1 text-on-surface-variant mb-1.5">
                    <span className="material-symbols-outlined text-[16px] text-zinc-400">location_on</span>
                    <span className="text-[13px] leading-normal text-zinc-400 font-medium">
                      {(() => {
                        const shelter = shelters.find(s => s.shelter_id === animal.shelter_id) || shelters[0];
                        return shelter.address ? shelter.address.split(" ").slice(0, 2).join(" ") : "보호소";
                      })()}
                    </span>
                  </div>
                  
                  {/* Title & Breed & Age (Wrap safety for mobile) */}
                  <h3 className="text-[18px] font-bold tracking-tight text-on-surface flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 leading-tight">
                    <span className="font-extrabold text-[18px] text-zinc-800">{animal.name && animal.name.trim() !== "" ? animal.name : "이름 짓는 중!"}</span>
                    <span className="text-[13.5px] text-zinc-500 font-bold">[{animal.breeds}]</span>
                    <span className="text-[13px] text-zinc-400 font-normal">· {formatAge(animal.animal_age)}</span>
                  </h3>
 
                  {/* Animal Personality Tags */}
                  {animal.tags && animal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {animal.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="bg-[#FAF6F2] border border-[#F0E5DD]/60 text-zinc-600 text-[11px] px-2.5 py-1 rounded-md font-semibold shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3.5 bg-[#FFFDFB] border border-[#FFE2D6]/40 p-3 rounded-xl">
                  <p className="text-[13px] leading-relaxed text-zinc-600 flex items-start gap-1.5">
                    <span
                      className="material-symbols-outlined text-[18px] text-[#FF7A50] mt-[1px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      recommend
                    </span>
                    <span className="font-medium"><HighlightText text={animal.recommend_reason} /></span>
                  </p>
                </div>
                
                <div className="mt-3.5 flex justify-end">
                  <span className="text-[#FF7A50] font-bold text-[13.5px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    자세히 보기 
                    <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Relax Region Action Button */}
        {!isRegionRelaxed && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                setIsRegionRelaxed(true);
                const params = new URLSearchParams(searchParams.toString());
                params.set("relaxed", "true");
                router.push(`/match/results?${params.toString()}`, { scroll: false });
              }}
              className="bg-white border border-[#FFE2D6] hover:bg-[#FFFDFB] text-[#FF7A50] font-bold text-[14.5px] px-6 py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:scale-[1.01] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>explore</span>
              다른 지역의 잘 맞는 아이도 볼래요
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchResultsPage() {
  return (
    <Suspense fallback={
      <div className="bg-brand-ivory min-h-screen pt-4 pb-8 flex items-center justify-center">
        <div className="text-[#FF7A50] font-bold">매칭 결과를 분석하고 있습니다...</div>
      </div>
    }>
      <MatchResultsContent />
    </Suspense>
  );
}
