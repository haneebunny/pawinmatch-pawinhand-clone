"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { animals } from "../../data/animals";
import { shelters } from "../../data/shelters";

function AnimalDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = decodeURIComponent(params.id);
  const showRecommend = searchParams.get("recommend") === "true";

  // Find animal
  const animal = animals.find((a) => a.id === id);

  // Carousel State
  const [photoIndex, setPhotoIndex] = useState(0);

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
  let matchScore = null;
  let recommendReason = "활동성과 성격 면에서 보호자님의 주거환경 및 산책 스케줄과 가장 조화로운 궁합을 보입니다.";

  if (typeof window !== "undefined") {
    const savedMatches = localStorage.getItem("pawinhand_match_results");
    if (savedMatches) {
      const matches = JSON.parse(savedMatches);
      const matchDetail = matches.find((m) => m.animal_id === id || m.id === id);
      if (matchDetail) {
        matchScore = matchDetail.match_score;
        recommendReason = matchDetail.recommend_reason;
      }
    }
  }

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
            className={`h-2.5 w-8 rounded-sm ${
              i < value ? "bg-[#FF7A50]" : "bg-[#F5F0EB]"
            }`}
          />
        ))}
      </div>
    );
  };

  const neuteredText = animal.neutered === "예" || animal.neutered === "완료" ? "완료" : animal.neutered === "아니오" || animal.neutered === "미완료" ? "미완료" : "알 수 없음";

  return (
    <div className="min-h-screen pb-[120px] bg-brand-ivory">
      <main className="max-w-[1024px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">
        
        {/* 1. Header Row (Shelter Name & Status) */}
        <section className="flex justify-between items-center bg-white border border-brand-border px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">domain</span>
            <span className="font-bold text-[18px] text-on-surface">{shelter.name}</span>
            <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
          </div>
          <span className="bg-[#2c694e] text-white text-caption font-semibold px-3 py-1 rounded-md">
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
                    className={`w-[70px] h-[70px] rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      idx === photoIndex ? "border-[#FF7A50] scale-95" : "border-transparent opacity-75 hover:opacity-100"
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
                  {animal.name || "이름 없음. 지어주세요!"}
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
                {animal.animal_sex} ({neuteredText}) · {animal.animal_age} · {animal.animal_weight}kg
              </p>
            </div>

            {/* 6 Grids Core info */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">품종</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{animal.breeds}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">나이</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{animal.animal_age}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">성별</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{animal.animal_sex}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">체중</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{animal.animal_weight}kg</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">중성화 여부</span>
                <span className="text-body font-body font-bold text-zinc-800 text-[14px]">{neuteredText}</span>
              </div>
              <div className="bg-white border border-brand-border p-3.5 rounded-xl flex flex-col gap-0.5 shadow-sm">
                <span className="text-caption font-caption text-zinc-400 text-[11px] font-semibold">공고기한</span>
                <span className="text-body font-body font-bold text-primary text-[13px] truncate">
                  {animal.notice_start} ~ {animal.notice_end.includes("상시") ? "상시" : animal.notice_end}
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
                  {animal.name}이는 {recommendReason}
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
              현재 건강 상태는 5단계 중 {animal.health_state}단계로 매우 안정적이며 양호합니다. 기본 전염병 진단 키트 검사를 마쳤고 모두 음성 판정을 받았습니다. {animal.neutered === "완료" || animal.neutered === "예" ? "중성화 수술이 완료되어 추가적인 수술 절차가 필요 없습니다." : "중성화 수술이 예정되어 있거나 미완료된 상태입니다."} 예방 접종 기록 카드와 상세한 진단 결과지는 센터 방문 및 서류 작성 시 함께 전달해 드립니다.
            </p>
          </div>
          
          {/* Personality Card (Personality Description + Visual Scores + Emoji Tags Integrated) */}
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_satisfied</span>
              <h3 className="text-[18px] font-semibold text-on-surface font-semibold">성향 정보</h3>
            </div>
            
            {/* Personality comment text */}
            <p className="text-body font-body text-zinc-700 leading-relaxed mb-4">
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
                      😊 {cleanTag}
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
            <div className="bg-[#FFFDFB] border border-[#FFE2D6] p-4 rounded-xl text-caption text-[#FF7A50] font-semibold">
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

      {/* Bottom Fixed CTA Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-brand-border z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-[768px] mx-auto px-6 py-4 flex gap-3">
          <Link
            href="/shelter-questionnaire"
            className="flex-1 h-[52px] border-2 border-brand-primary text-brand-primary rounded-xl font-button-lg hover:bg-brand-primary-light transition-colors active:scale-[0.98] flex items-center justify-center font-bold"
          >
            보호소 질문지 복사하기
          </Link>
          <Link
            href="/shelter-questionnaire"
            className="flex-1 h-[52px] bg-brand-primary text-white rounded-xl font-button-lg shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center font-bold"
          >
            입양 문의 준비하기 (질문지)
          </Link>
        </div>
      </footer>
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
