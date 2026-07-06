"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { animals } from "../../data/animals";
import { shelters } from "../../data/shelters";

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

function formatSex(sex) {
  if (sex === "수컷" || sex === "수" || sex === "남아") {
    return "남아";
  }
  if (sex === "암컷" || sex === "암" || sex === "여아") {
    return "여아";
  }
  return "알 수 없음";
}

function formatNameWithSubjectJosa(name) {
  if (!name) return "";
  const lastChar = name.charCodeAt(name.length - 1);
  if (lastChar >= 0xac00 && lastChar <= 0xd7a3) {
    const hasBatchim = (lastChar - 0xac00) % 28 !== 0;
    if (name.endsWith("이")) {
      return `${name}는`;
    }
    return hasBatchim ? `${name}이는` : `${name}는`;
  }
  return `${name}는`;
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

function AnimalDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = decodeURIComponent(params.id);
  const showRecommend = searchParams.get("recommend") === "true";

  // Find animal
  const animal = animals.find((a) => a.id === id);

  // Carousel State
  const [photoIndex, setPhotoIndex] = useState(0);

  // 이름 투표 관련 상태 및 함수
  const [votesInfo, setVotesInfo] = useState({ confirmed_name: null, candidates: [] });
  const [displayName, setDisplayName] = useState("");
  const [recommendInput, setRecommendInput] = useState("");
  const [hasVoted, setHasVoted] = useState({});

  useEffect(() => {
    if (!animal) return;
    setDisplayName(animal.name || "이름 짓는 중!");

    const origName = animal.name || "";
    const isNameless = !origName.trim() || origName.includes("이름 짓는 중") || origName.includes("지어주세요");

    if (isNameless) {
      const fetchVotes = async () => {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
          const res = await fetch(`${apiBase}/api/animals/${id}/votes`);
          if (res.ok) {
            const data = await res.json();
            setVotesInfo(data);
            if (data.confirmed_name) {
              setDisplayName(data.confirmed_name);
            }
          }
        } catch (e) {
          console.error("Failed to load name votes", e);
        }
      };
      fetchVotes();
    }
  }, [id, animal]);

  const handleVote = async (name) => {
    if (hasVoted[name]) {
      alert("이미 이 이름에 투표하셨습니다!");
      return;
    }
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/animals/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        setVotesInfo(data);
        setHasVoted(prev => ({ ...prev, [name]: true }));
        if (data.confirmed_name) {
          setDisplayName(data.confirmed_name);
          alert(`🎉 축하합니다! "${data.confirmed_name}" 이름이 5표를 얻어 공식 이름으로 확정되었습니다!`);
        }
      }
    } catch (e) {
      console.error("Failed to submit name vote", e);
    }
  };

  const handleRecommend = async (e) => {
    e.preventDefault();
    const cleanName = recommendInput.trim();
    if (!cleanName) return;
    if (cleanName.length > 10) {
      alert("이름은 10자 이내로 입력해 주세요.");
      return;
    }
    await handleVote(cleanName);
    setRecommendInput("");
  };

  if (!animal) {
    return (
      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-giant min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[48px] text-gray-300">warning</span>
        <h3 className="text-[18px] font-semibold leading-normal text-on-surface">동물 정보를 찾을 수 없습니다</h3>
        <p className="text-[13px] leading-normal text-on-surface-variant">존재하지 않거나 삭제된 공고입니다.</p>
        <Link href="/animals" className="bg-primary-container text-white px-6 h-[44px] rounded-lg font-button-lg flex items-center justify-center hover:opacity-90">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // Find matching shelter
  const shelter = shelters.find((s) => s.shelter_id === animal.shelter_id) || shelters[0];

  // Retrieve matching details if available
  const isNameless = !animal.name || animal.name.trim() === "" || animal.name.includes("이름 짓는 중") || animal.name.includes("지어주세요") || animal.name.includes("없음");

  const [matchScore, setMatchScore] = useState(null);
  const [recommendReason, setRecommendReason] = useState(
    isNameless
      ? "==온화하고 영리한 성격==을 지니고 있어 새로운 보호자님의 환경에 빠르게 적응할 가능성이 매우 큽니다. 보호자님의 생활 스케줄 및 주거 성향과 아주 조화로운 균형을 이루며, ==작은 관심과 따뜻한 손길==을 베풀어 주신다면 금세 마음의 문을 열고 평생의 잊지 못할 가장 든든하고 사랑스러운 가족이자 동반자가 되어줄 것입니다."
      : "==활동성과 차분함의 균형==이 아주 잘 잡혀 있어 보호자님의 주거 환경에 어색함 없이 스며들 수 있습니다. 특히 ==사람과의 교감을 무척 좋아하는 성향==이라, 서로 마주하는 시간 속에서 깊은 유대감을 선사하며 평생의 길을 동행하는 둘도 없는 다정하고 든든한 짝꿍이 되어줄 아이입니다."
  );

  useEffect(() => {
    try {
      localStorage.setItem("pawinhand_last_viewed_animal_id", id);
    } catch (e) {
      console.warn("Failed to save last viewed animal ID", e);
    }

    try {
      let matchDetail = null;

      // Try relaxed matches first
      const savedMatchesRelaxed = localStorage.getItem("pawinhand_match_results_relaxed");
      if (savedMatchesRelaxed) {
        const matches = JSON.parse(savedMatchesRelaxed);
        matchDetail = matches.find((m) => m.animal_id === id || m.id === id);
      }

      // If not found, try local matches
      if (!matchDetail) {
        const savedMatches = localStorage.getItem("pawinhand_match_results");
        if (savedMatches) {
          const matches = JSON.parse(savedMatches);
          matchDetail = matches.find((m) => m.animal_id === id || m.id === id);
        }
      }

      if (matchDetail) {
        setMatchScore(matchDetail.match_score);
        setRecommendReason(matchDetail.recommend_reason);
      }
    } catch (e) {
      console.warn("Failed to load match results from localStorage", e);
    }
  }, [id]);

  // Handle image list (fallback to single photo if photos array is empty or undefined)
  const photos = animal.photos && animal.photos.length > 0 ? animal.photos : [animal.photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400"];

  const handlePrevPhoto = () => {
    setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Helper component to render score bars
  const ScoreBars = ({ value }) => {
    const totalBars = 5;
    return (
      <div className="flex gap-1.5 items-center">
        {[...Array(totalBars)].map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-8 rounded-sm ${i < value ? "bg-[#FF7A50]" : "bg-[#F5F0EB]"
              }`}
          />
        ))}
      </div>
    );
  };

  const neuteredText = animal.neutered === "예" || animal.neutered === "완료" || animal.neutered === true ? "완료" : animal.neutered === "아니오" || animal.neutered === "미완료" || animal.neutered === false ? "미완료" : "알 수 없음";

  return (
    <div className="min-h-screen pb-[120px] bg-brand-ivory">
      <main className="max-w-[1024px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">

        {/* 1. Header Row (Shelter Name & Status) */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-brand-border px-4 py-3.5 sm:px-6 sm:py-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">domain</span>
            <span className="font-bold text-[15px] sm:text-[18px] text-on-surface leading-tight break-all">{shelter.name}</span>
            <span className="material-symbols-outlined text-[16px] text-green-500 shrink-0">check_circle</span>
          </div>
          <span className="bg-[#2c694e] text-white text-[12px] font-semibold px-3 py-1 rounded-md shrink-0 self-start sm:self-auto">
            보호중
          </span>
        </section>

        {/* 2. Top Two-Column Grid (Left: 1:1 Carousel, Right: Core Cards & CTA) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Left Column: 1:1 Square Carousel */}
          <section className="flex flex-col gap-3">
            <div className="aspect-square w-full rounded-2xl overflow-hidden shadow-sm border border-brand-border relative bg-zinc-50 group">
              <img
                className="w-full h-full object-cover"
                src={photos[photoIndex]}
                alt={`${animal.name || animal.breeds} - ${photoIndex + 1}`}
              />

              {/* Carousel Navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              )}

              {/* Slide Number Badge */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-caption px-3 py-1 rounded-full font-medium">
                {photoIndex + 1} / {photos.length}
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
                {photos.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPhotoIndex(idx)}
                    className={`w-[70px] h-[70px] rounded-lg overflow-hidden border-2 shrink-0 transition-all ${idx === photoIndex ? "border-[#FF7A50] scale-95" : "border-transparent opacity-75 hover:opacity-100"
                      }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Title, 6 Grids & CTA buttons */}
          <section className="flex flex-col gap-4">
            {/* Title Block */}
            <div className="flex flex-col gap-1 bg-white border border-brand-border p-5 rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[28px] font-bold tracking-tight text-on-surface leading-tight">
                  {displayName}
                </h1>
                <span className="text-zinc-400 text-[20px] font-light">·</span>
                <span className="text-[16px] text-zinc-500 font-medium">
                  [{animal.species}] {animal.breeds}
                </span>
                {matchScore && showRecommend && (
                  <span className="bg-[#FFF1EC] text-[#FF7A50] px-3 py-1 rounded-full font-bold text-caption self-center">
                    매칭 {matchScore}점
                  </span>
                )}
              </div>
              <p className="text-[14px] text-zinc-400 mt-1">
                {formatSex(animal.animal_sex)} ({neuteredText}) · {formatAge(animal.animal_age)} · {animal.animal_weight}kg
              </p>
            </div>

            {/* 이름 지어주기 투표소 미니 카드 */}
            {!votesInfo.confirmed_name && (!animal.name || animal.name.includes("이름 짓는 중") || animal.name.includes("지어주세요")) && (
              <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[#FF7A50]">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_vote</span>
                  <h4 className="font-bold text-[16px] text-on-surface">🗳️ 이름 지어주기 투표소</h4>
                </div>
                <p className="text-caption text-zinc-500 leading-normal">
                  아직 이름이 없는 친구예요. 예쁜 이름을 직접 추천하거나, 다른 추천된 마음에 드는 이름 후보에 투표해 주세요! (5표 이상 획득 시 공식 이름으로 지정됩니다)
                </p>

                {/* 후보군 목록 */}
                <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {votesInfo.candidates.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-50 border border-brand-border/40 px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-3">
                        {idx === 0 && votesInfo.candidates.length > 0 && (
                          <span className="text-[12px] bg-[#FF7A50] text-white px-2 py-0.5 rounded-md font-bold">🔥 1등</span>
                        )}
                        <span className="text-[14px] font-bold text-zinc-800">"{c.name}"</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] text-zinc-500 font-semibold">{c.votes}표</span>
                        <button
                          onClick={() => handleVote(c.name)}
                          disabled={hasVoted[c.name]}
                          className={`h-7 px-3 text-[12px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${hasVoted[c.name]
                            ? "bg-zinc-200 text-zinc-400"
                            : "bg-[#FFF1EC] text-[#FF7A50] hover:bg-[#FFE2D6]"
                            }`}
                        >
                          👍 투표
                        </button>
                      </div>
                    </div>
                  ))}
                  {votesInfo.candidates.length === 0 && (
                    <p className="text-center py-4 text-zinc-400 text-caption">아직 등록된 후보 이름이 없습니다.</p>
                  )}
                </div>

                {/* 추천 제출 폼 */}
                <form onSubmit={handleRecommend} className="flex gap-2 border-t border-brand-border/40 pt-4">
                  <input
                    type="text"
                    value={recommendInput}
                    onChange={(e) => setRecommendInput(e.target.value)}
                    placeholder="새로운 이름 후보를 추천해 보세요..."
                    className="flex-1 px-3.5 h-[38px] rounded-lg border border-brand-border/60 text-caption focus:outline-[#FF7A50]"
                    maxLength={10}
                  />
                  <button
                    type="submit"
                    className="h-[38px] px-4 bg-[#FF7A50] hover:bg-[#e08420] text-white rounded-lg text-caption font-bold flex items-center justify-center transition-colors cursor-pointer"
                  >
                    추천하기
                  </button>
                </form>
              </div>
            )}

            {/* 6 Grids Core info */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">품종</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{animal.breeds}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">나이</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{formatAge(animal.animal_age)}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">성별</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{formatSex(animal.animal_sex)}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">체중</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{animal.animal_weight}kg</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">중성화 여부</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{neuteredText}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm overflow-hidden">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">공고기한</span>
                <span className="text-body font-body font-bold text-primary text-[11px] sm:text-[13px] whitespace-nowrap">
                  {(animal.notice_start || "").replace(/-/g, ".").slice(2)} ~ {animal.notice_end && animal.notice_end.includes("상시") ? "상시" : (animal.notice_end || "").replace(/-/g, ".").slice(2)}
                </span>
              </div>
            </div>

            {/* Custom CTA Action Buttons */}
            <div className="flex gap-3.5">
              <a
                href={`tel:${shelter.phone}`}
                className="flex-1 h-[48px] bg-[#FF9A2E] hover:bg-[#e08420] text-white rounded-xl text-caption font-bold flex items-center justify-center transition-colors shadow-sm"
              >
                전화 문의하기
              </a>
              <Link
                href="/shelter-questionnaire"
                className="flex-1 h-[48px] bg-[#3CB371] hover:bg-[#2e8b57] text-white rounded-xl text-caption font-bold flex items-center justify-center transition-colors shadow-sm"
              >
                입양 준비/신청
              </Link>
            </div>
          </section>

        </div>

        {/* 3. Bottom Grid: Full Width details */}
        <section className="flex flex-col gap-4">

          {/* AI Recommendation Box (Wider & high readability space for long text) */}
          {showRecommend && (
            <section
              id="ai-recommendation-box"
              className="bg-brand-primary-light p-6 rounded-2xl border border-[#FFE2D6] flex gap-4 items-start w-full shadow-sm animate-fade-in"
            >
              <span
                className="material-symbols-outlined text-brand-primary mt-1 shrink-0 text-[24px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <div className="flex-1">
                <h4 className="text-body font-bold text-on-primary-container mb-2 text-[16px]">왜 이 아이를 추천했나요?</h4>
                <p className="text-[15px] font-body text-zinc-800 leading-relaxed">
                  {(() => {
                    if (matchScore) {
                      return <HighlightText text={recommendReason} />;
                    }
                    const subject = isNameless ? "이 아이는" : formatNameWithSubjectJosa(displayName);
                    return <HighlightText text={`${subject} ${recommendReason}`} />;
                  })()}
                </p>
              </div>
            </section>
          )}

          {/* Health Card */}
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-secondary">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              <h3 className="text-[18px] font-semibold text-on-surface font-semibold">건강 정보</h3>
            </div>
            <p className="text-body font-body text-zinc-700 leading-relaxed">
              현재 건강 상태는 5단계 중 {animal.health_state}단계로 매우 안정적이며 양호합니다. 기본 전염병 진단 키트 검사를 마쳤고 모두 음성 판정을 받았습니다. {animal.neutered === "완료" || animal.neutered === "예" || animal.neutered === true ? "중성화 수술이 완료되어 추가적인 수술 절차가 필요 없습니다." : "중성화 수술이 예정되어 있거나 미완료된 상태입니다."} 예방 접종 기록 카드와 상세한 진단 결과지는 센터 방문 및 서류 작성 시 함께 전달해 드립니다.
            </p>
          </div>

          {/* Personality Card (Personality Description + Visual Scores + Emoji Tags Integrated) */}
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_satisfied</span>
              <h3 className="text-[18px] font-semibold text-on-surface font-semibold">성향 정보</h3>
            </div>

            {/* Personality comment text */}
            <p className="text-body font-body text-zinc-700 leading-relaxed mb-4" style={{ whiteSpace: "pre-wrap" }}>
              {animal.personality_comment}
            </p>

            {/* Separator line */}
            <div className="border-t border-[#F0E5DD] pt-4 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[14px] text-zinc-500 font-medium">건강상태</span>
                  <ScoreBars value={animal.health_state} />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[14px] text-zinc-500 font-medium">활동성</span>
                  <ScoreBars value={animal.activity} />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[14px] text-zinc-500 font-medium">사회성</span>
                  <ScoreBars value={animal.sociability} />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[14px] text-zinc-500 font-medium">친화도</span>
                  <ScoreBars value={animal.aggression} />
                </div>
              </div>
            </div>

            {/* Custom bubble tags */}
            {animal.tags && animal.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-[#F0E5DD]">
                {animal.tags.map((tag, idx) => {
                  const cleanTag = tag.startsWith("#") ? tag.substring(1) : tag;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-ivory border border-[#F0E5DD] rounded-full text-caption text-zinc-700 shadow-sm font-semibold"
                    >
                      {cleanTag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adoption Procedures & Support */}
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm relative">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[18px] font-semibold text-on-surface font-semibold">입양 절차 및 지원</h3>
              {animal.adoption_support && (
                <span className="bg-[#E2F5EC] text-[#2c694e] font-semibold text-caption px-2.5 py-1 rounded-md">
                  의료비 지원 대상
                </span>
              )}
            </div>

            {/* Step Timeline */}
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-[#FF7A50] text-white flex items-center justify-center font-bold text-caption shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 text-[15px]">보호소 문의</h4>
                  <p className="text-caption text-zinc-500 leading-normal mt-0.5">온라인 질문지를 제출하고 상담을 요청하세요.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-[#FF7A50] text-white flex items-center justify-center font-bold text-caption shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 text-[15px]">담당자 상담</h4>
                  <p className="text-caption text-zinc-500 leading-normal mt-0.5">보호소 방문 날짜를 잡고 대면 인터뷰를 진행합니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-[#FF7A50] text-white flex items-center justify-center font-bold text-caption shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 text-[15px]">입양 확정</h4>
                  <p className="text-caption text-zinc-500 leading-normal mt-0.5">최종 입양 서류를 작성하고 아이와 가족이 됩니다.</p>
                </div>
              </div>
            </div>

            {/* Support Info Box */}
            <div className="bg-[#FFFDFB] border border-[#FFE2D6] p-4 rounded-xl text-caption text-[#FF7A50] font-semibold" style={{ whiteSpace: "pre-wrap" }}>
              🎁 지원 정보: {animal.adoption_support && animal.adoption_support_detail
                ? animal.adoption_support_detail
                : "기초 건강검진비 지원 및 내장형 인식칩 삽입 비용 전액 지원"}
            </div>
          </div>

          {/* Notice & Shelter Info Card (2-column layout) */}
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h3 className="text-[18px] font-semibold leading-normal text-on-surface border-b border-brand-border pb-3 font-bold">공고 및 보호 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-caption font-caption text-zinc-400 font-semibold block mb-0.5">공고번호</span>
                <p className="text-body font-body font-semibold text-zinc-800">{animal.notice_no}</p>
              </div>
              <div>
                <span className="text-caption font-caption text-zinc-400 font-semibold block mb-0.5">발견장소</span>
                <p className="text-body font-body text-zinc-800">{animal.found_location}</p>
              </div>
              <div>
                <span className="text-caption font-caption text-zinc-400 font-semibold block mb-0.5">보호센터</span>
                <p className="text-body font-body font-semibold text-zinc-800">{shelter.name}</p>
              </div>
              <div>
                <span className="text-caption font-caption text-zinc-400 font-semibold block mb-0.5">문의처</span>
                <p className="text-body font-body text-zinc-800">{shelter.phone}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-caption font-caption text-zinc-400 font-semibold block mb-0.5">주소</span>
                <p className="text-body font-body text-zinc-800">{shelter.address}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-caption font-caption text-zinc-400 font-semibold block mb-0.5">보호센터 운영 시간 및 안내</span>
                <p className="text-body font-body text-zinc-700 mt-1">{shelter.hours}</p>
                <p className="text-caption font-caption text-zinc-500 mt-1">{shelter.guide}</p>
              </div>
            </div>
          </div>

          {/* Comments & Feedback Card */}
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-[18px] font-semibold leading-normal text-on-surface mb-4 font-bold border-b border-brand-border pb-3">댓글 및 문의</h3>
            {animal.comments && animal.comments.length > 0 ? (
              <div className="flex flex-col gap-4">
                {animal.comments.map((comment, idx) => (
                  <div key={idx} className="flex flex-col gap-1 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-bold text-zinc-700">🧑‍💻 {comment.user_id}</span>
                      <span className="text-[11px] text-zinc-400">{comment.update_time}</span>
                    </div>
                    <p className="text-body text-zinc-600 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-outline-variant text-[48px]">chat_bubble_outline</span>
                <p className="text-body font-body text-zinc-500">아직 등록된 댓글이 없어요.</p>
              </div>
            )}
          </div>

          {/* Pre-Adoption Checklist Card */}
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-[18px] font-semibold leading-normal text-on-surface mb-4 font-bold border-b border-brand-border pb-3">입양 전 확인 사항</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container">
                  <span className="material-symbols-outlined text-[16px] text-secondary font-bold">check</span>
                </div>
                <span className="text-body font-body text-zinc-700">가족 구성원 모두의 동의가 있었나요?</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container">
                  <span className="material-symbols-outlined text-[16px] text-secondary font-bold">check</span>
                </div>
                <span className="text-body font-body text-zinc-700">반려동물을 위한 경제적 여건이 준비되었나요?</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container">
                  <span className="material-symbols-outlined text-[16px] text-secondary font-bold">check</span>
                </div>
                <span className="text-body font-body text-zinc-700">매일 산책과 교감을 위한 충분한 시간이 있나요?</span>
              </li>
            </ul>
          </div>

        </section>

      </main>


    </div>
  );
}

export default function AnimalDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-giant min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[16px] leading-relaxed text-on-surface-variant mt-2">동물 프로필 정보를 불러오는 중입니다...</p>
      </div>
    }>
      <AnimalDetail />
    </Suspense>
  );
}
