"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { animals } from "../../data/animals";

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

export default function MatchResultsPage() {
  const [matchedList, setMatchedList] = useState([]);
  const [surveyInput, setSurveyInput] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read survey responses from localStorage
    const savedSurvey = localStorage.getItem("pawinhand_survey_input");
    if (!savedSurvey) {
      setLoading(false);
      return;
    }

    const survey = JSON.parse(savedSurvey);
    setSurveyInput(survey);

    // Check if there is already a cached match result
    const savedMatches = localStorage.getItem("pawinhand_match_results");
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

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://pawinhand-clone-production-9194.up.railway.app";

    const fetchMatches = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(survey),
        });

        if (response.ok) {
          const data = await response.json(); // { results: [{ animal_id, match_score, recommend_reason }] }
          
          // Map backend match results to local animals data
          const matched = data.results.map((res) => {
            const info = animals.find((a) => a.id === res.animal_id);
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
          localStorage.setItem("pawinhand_match_results", JSON.stringify(matched));
          setLoading(false);
        } else {
          throw new Error("API response not ok");
        }
      } catch (error) {
        console.warn("FastAPI Server not available for matching. Simulating locally.", error);
        
        // Fallback: Local match calculation logic (runs with 1s delay to feel natural)
        setTimeout(() => {
          const scoredAnimals = animals.map((animal) => {
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
          localStorage.setItem("pawinhand_match_results", JSON.stringify(topMatches));
          setLoading(false);
        }, 1000);
      }
    };

    fetchMatches();
  }, []);

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
      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-giant min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FF7A50] border-t-transparent rounded-full animate-spin"></div>
        <h3 className="text-[18px] font-semibold leading-normal text-on-surface font-semibold">적합한 아이들을 매칭하는 중입니다...</h3>
        <p className="text-[13px] leading-normal text-on-surface-variant">입력해주신 생활환경과 선호도를 기반으로 매칭 중입니다.</p>
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

        {/* Card List */}
        <div className="flex flex-col gap-4">
          {matchedList.map((animal) => (
            <Link
              key={animal.id}
              href={`/animals/${animal.id}?recommend=true`}
              className="bg-white border border-border-line rounded-xl p-5 flex gap-5 relative cursor-pointer group shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] transition-all duration-300"
            >
              {/* Animal Photo & Match Score */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0 self-center">
                <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-lg overflow-hidden bg-surface-container-low border border-border-line shadow-inner">
                  <img
                    src={animal.photos && animal.photos.length > 0 ? animal.photos[0] : (animal.photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400")}
                    alt={animal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Match Score Badge under Photo */}
                <div className="bg-[#FFF1EC] text-[#FF7A50] font-bold text-[12px] px-2.5 py-0.5 rounded-full border border-[#FFE2D6]">
                  매칭 {animal.match_score}점
                </div>
              </div>

              {/* Text Content */}
              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-center gap-1 text-on-surface-variant mb-1">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
                    <span className="text-[13px] leading-normal text-gray-500">
                      {(() => {
                        const city = animal.city || "";
                        const loc = animal.found_location || "";
                        if (city && !loc.startsWith(city) && !loc.includes("서울") && !loc.includes("경기") && !loc.includes("경남")) {
                          return `${city} ${loc}`;
                        }
                        return loc;
                      })()}
                    </span>
                  </div>
                  
                  {/* Title & Breed & Age (Align baseline) */}
                  <h3 className="text-[18px] font-bold tracking-tight text-on-surface flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-extrabold">{animal.name && animal.name.trim() !== "" ? animal.name : "이름 짓는 중!"}</span>
                    <span className="text-[13px] text-zinc-500 font-medium">[{animal.breeds}]</span>
                    <span className="text-[13px] text-zinc-400 font-normal">• {formatAge(animal.animal_age)}</span>
                  </h3>

                  {/* Animal Personality Tags */}
                  {animal.tags && animal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {animal.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="bg-[#F5F0EB] text-zinc-600 text-[11px] px-2 py-0.5 rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-[13px] leading-normal text-on-surface-variant leading-relaxed flex items-start gap-1 text-zinc-600">
                    <span
                      className="material-symbols-outlined text-[16px] text-[#FF7A50] mt-[1px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      recommend
                    </span>
                    <span><HighlightText text={animal.recommend_reason} /></span>
                  </p>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <span className="text-primary-container font-medium text-caption flex items-center gap-1">
                    자세히 보기 
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
