"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { animals } from "../../data/animals";
import { shelters } from "../../data/shelters";

function AnimalDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const showRecommend = searchParams.get("recommend") === "true";

  // Find animal
  const animal = animals.find((a) => a.id === id);

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
      const matchDetail = matches.find((m) => m.id === id);
      if (matchDetail) {
        matchScore = matchDetail.match_score;
        recommendReason = matchDetail.recommend_reason;
      }
    }
  }

  return (
    <div className="min-h-screen pb-[120px]">
      <main className="max-w-[1024px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
        {/* 1. 16:9 Hero Photo + Name */}
        <section className="flex flex-col gap-4">
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border border-brand-border relative bg-zinc-100">
            <img
              className="w-full h-full object-cover"
              src={animal.photo}
              alt={animal.name}
            />
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-3">
              <h1 className="text-h1 font-h1 text-on-surface font-bold text-[32px]">{animal.name || animal.breeds}</h1>
              {matchScore && showRecommend && (
                <span className="bg-[#FFF1EC] text-primary-container px-md py-1 rounded-full font-bold text-caption">
                  매칭 점수 {matchScore}점
                </span>
              )}
            </div>
            <p className="text-h3 font-h3 text-on-surface-variant">{animal.breeds}</p>
          </div>
        </section>

        {/* 2. Core Info Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="bg-white border border-brand-border p-3 rounded-xl flex flex-col gap-1 shadow-sm">
            <span className="text-caption font-caption text-on-surface-variant">품종</span>
            <span className="text-body font-body font-semibold">{animal.breeds}</span>
          </div>
          <div className="bg-white border border-brand-border p-3 rounded-xl flex flex-col gap-1 shadow-sm">
            <span className="text-caption font-caption text-on-surface-variant">나이</span>
            <span className="text-body font-body font-semibold">{animal.animal_age}</span>
          </div>
          <div className="bg-white border border-brand-border p-3 rounded-xl flex flex-col gap-1 shadow-sm">
            <span className="text-caption font-caption text-on-surface-variant">성별</span>
            <span className="text-body font-body font-semibold">{animal.animal_sex}</span>
          </div>
          <div className="bg-white border border-brand-border p-3 rounded-xl flex flex-col gap-1 shadow-sm">
            <span className="text-caption font-caption text-on-surface-variant">체중</span>
            <span className="text-body font-body font-semibold">{animal.animal_weight}kg</span>
          </div>
          <div className="bg-white border border-brand-border p-3 rounded-xl flex flex-col gap-1 shadow-sm">
            <span className="text-caption font-caption text-on-surface-variant">중성화 여부</span>
            <span className="text-body font-body font-semibold">{animal.neutered}</span>
          </div>
          <div className="bg-white border border-brand-border p-3 rounded-xl flex flex-col gap-1 shadow-sm">
            <span className="text-caption font-caption text-on-surface-variant">공고기한</span>
            <span className="text-body font-body font-semibold text-primary">
              {animal.notice_start} ~ {animal.notice_end.includes("상시") ? "상시" : animal.notice_end}
            </span>
          </div>
        </section>

        {/* 3. AI Recommendation Box (Conditional Display) */}
        {showRecommend && (
          <section
            id="ai-recommendation-box"
            className="bg-brand-primary-light p-4 rounded-2xl border border-[#FFE2D6] flex gap-3 items-start animate-fade-in"
          >
            <span
              className="material-symbols-outlined text-brand-primary mt-1 shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <div>
              <h4 className="text-body font-bold text-on-primary-container mb-1">왜 이 아이를 추천했나요?</h4>
              <p className="text-body font-body text-on-primary-container leading-relaxed">
                {animal.name}이는 {recommendReason}
              </p>
            </div>
          </section>
        )}

        {/* 4. Adoption Decision Sections */}
        <section className="flex flex-col gap-3">
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">medical_services</span>
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface font-semibold">건강 정보</h3>
            </div>
            <p className="text-body font-body text-on-surface-variant leading-relaxed">
              건강 상태 {animal.health_state}/5 단계. 기본 전염병 진단 키트 음성 판정 완료. {animal.neutered === "완료" ? "중성화 수술이 완료되었습니다." : "중성화 수술이 예정되어 있습니다."} 예방 접종 이력을 포함한 자세한 건강 기록은 보호센터에서 서류로 교부 가능합니다.
            </p>
          </div>
          
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface font-semibold">성향 정보</h3>
            </div>
            <p className="text-body font-body text-on-surface-variant leading-relaxed">
              {animal.personality_comment} 활동량 지수({animal.activity}/5), 친화성 및 사교성 지수({animal.sociability}/5)로 분류되며, 태그 키워드로는 [{animal.tags.join(", ")}] 등으로 요약할 수 있습니다.
            </p>
          </div>
          
          <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">info</span>
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface font-semibold">특이사항 및 지원금</h3>
            </div>
            <p className="text-body font-body text-on-surface-variant leading-relaxed">
              {animal.adoption_support 
                ? `본 동물을 입양할 시 지자체 및 본 플랫폼의 특별 입양 지원 혜택(${animal.adoption_support_detail})을 받으실 수 있습니다.`
                : "등록된 특이사항이 없습니다. 센터 방문 시 담당 훈련사로부터 소상한 안내를 받으실 수 있습니다."}
            </p>
          </div>
        </section>

        {/* 5. Notice & Shelter Info */}
        <section className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          <h3 className="text-[18px] font-semibold leading-normal text-on-surface border-b border-brand-border pb-3 font-bold">공고 및 보호 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-caption font-caption text-on-surface-variant">공고번호</span>
              <p className="text-body font-body">{animal.notice_no}</p>
            </div>
            <div>
              <span className="text-caption font-caption text-on-surface-variant">발견장소</span>
              <p className="text-body font-body">{animal.found_location}</p>
            </div>
            <div>
              <span className="text-caption font-caption text-on-surface-variant">보호센터</span>
              <p className="text-body font-body font-semibold">{shelter.name}</p>
            </div>
            <div>
              <span className="text-caption font-caption text-on-surface-variant">문의처</span>
              <p className="text-body font-body">{shelter.phone}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-caption font-caption text-on-surface-variant">주소</span>
              <p className="text-body font-body">{shelter.address}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-caption font-caption text-on-surface-variant">보호센터 운영 시간 및 안내</span>
              <p className="text-body font-body text-gray-600 mt-1">{shelter.hours}</p>
              <p className="text-caption font-caption text-zinc-500 mt-1">{shelter.guide}</p>
            </div>
          </div>
        </section>

        {/* 6. Comments/Feedback Section */}
        <section className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
          <h3 className="text-[18px] font-semibold leading-normal text-on-surface mb-4 font-bold">댓글 및 문의</h3>
          <div className="flex flex-col items-center justify-center py-giant gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-outline-variant text-[48px]">chat_bubble_outline</span>
            <p className="text-body font-body">아직 등록된 댓글이 없어요.</p>
          </div>
        </section>

        {/* 7. Pre-Adoption Checklist */}
        <section className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm">
          <h3 className="text-[18px] font-semibold leading-normal text-on-surface mb-4 font-bold">입양 전 확인 사항</h3>
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-3">
              <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container">
                <span className="material-symbols-outlined text-[16px] text-secondary font-bold">check</span>
              </div>
              <span className="text-body font-body text-on-surface-variant">가족 구성원 모두의 동의가 있었나요?</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container">
                <span className="material-symbols-outlined text-[16px] text-secondary font-bold">check</span>
              </div>
              <span className="text-body font-body text-on-surface-variant">반려동물을 위한 경제적 여건이 준비되었나요?</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container">
                <span className="material-symbols-outlined text-[16px] text-secondary font-bold">check</span>
              </div>
              <span className="text-body font-body text-on-surface-variant">매일 산책과 교감을 위한 충분한 시간이 있나요?</span>
            </li>
          </ul>
        </section>
      </main>

      {/* 8. Bottom Fixed CTA */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-brand-border z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-[768px] mx-auto px-6 py-4 flex gap-3">
          <Link
            href="/shelter-questionnaire"
            className="flex-1 h-[52px] border-2 border-brand-primary text-brand-primary rounded-xl font-button-lg hover:bg-brand-primary-light transition-colors active:scale-[0.98] flex items-center justify-center"
          >
            보호소 질문지 보기
          </Link>
          <Link
            href="/shelter-questionnaire"
            className="flex-1 h-[52px] bg-brand-primary text-white rounded-xl font-button-lg shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center"
          >
            입양 문의 준비하기
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
