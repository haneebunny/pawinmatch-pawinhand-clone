"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { shelters } from "../data/shelters";
import { animals } from "../data/animals";

const CATEGORIES = ["건강상태", "행동/성격", "산책/활동", "사회성", "입양절차"];

const DEFAULT_QUESTIONS = {
  "건강상태": [
    "예방접종 기록이 최신 상태이며 증빙이 가능한가요?",
    "현재 앓고 있는 질병이나 정기적으로 복용해야 하는 약이 있나요?",
    "최근 진행한 심장사상충 검사 결과와 예방 현황은 어떤가요?",
    "보호소에 온 이후 특별히 진단받거나 치료한 내역이 있나요?"
  ],
  "행동/성격": [
    "평소 짖음이나 하울링이 어느 정도인가요?",
    "실내 배변과 실외 배변 중 어느 쪽에 더 익숙한가요?",
    "특정 물건이나 소리(예: 청소기, 천둥 소리)에 대한 공포 반응이 있나요?",
    "분리불안 증세(칭얼거림, 하울링, 물건 파괴)가 관찰된 적이 있나요?"
  ],
  "산책/활동": [
    "산책할 때 줄당김이 심한 편인가요? 리드줄 적응도는 어떤가요?",
    "장난감이나 공놀이에 흥미를 보이는 편인가요?",
    "평소 적절한 하루 산책 빈도와 권장 산책 시간은 어떻게 되나요?",
    "산책 시 다른 사람이나 자전거 등을 보고 돌발 행동을 하나요?"
  ],
  "사회성": [
    "낯선 사람이나 어린아이를 만났을 때 반응이 어떤가요?",
    "다른 강아지나 고양이와 만났을 때 공격성을 보이거나 잘 어울리나요?",
    "만졌을 때 싫어하거나 민감하게 반응하는 신체 부위가 있나요?",
    "간식이나 장난감에 대해 소유욕(가드 행동)이 있는 편인가요?"
  ],
  "입양절차": [
    "입양 심사 기간은 보통 며칠 정도 소요되나요?",
    "입양 확정 후 당일에 바로 데려갈 수 있나요, 아니면 추가 방문이 필요한가요?",
    "입양 시 발생하는 책임비나 지원받을 수 있는 지자체 지원금이 있나요?",
    "입양 이후 보호소로의 모니터링 방문이나 후속 보고 절차가 있나요?"
  ]
};

const DEFAULT_CHECKLIST_ITEMS = [
  "동물을 평생 책임지고 키울 수 있는 경제적 여건이 마련되었나요?",
  "가족 구성원 전원이 입양에 동의했나요?",
  "소음이나 알레르기 등으로 인한 이웃과의 마찰 대비책이 있나요?",
  "동물이 혼자 지낼 시간의 한계를 알고 있으며, 이에 대비하셨나요?",
  "반려동물이 거주할 공간 내 위험 물질 및 탈출 경로를 차단하셨나요?"
];

export default function ShelterQuestionnairePage() {
  const [activeTab, setActiveTab] = useState("건강상태");
  const [checklist, setChecklist] = useState({});
  const [currentShelter, setCurrentShelter] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [dynamicQuestions, setDynamicQuestions] = useState(DEFAULT_QUESTIONS);
  const [checklistItems, setChecklistItems] = useState(DEFAULT_CHECKLIST_ITEMS);

  useEffect(() => {
    // 1. Load active shelter from last viewed animal if available
    let targetShelterId = "shelter-1";
    let surveyInput = null;

    if (typeof window !== "undefined") {
      const savedMatches = localStorage.getItem("pawinhand_match_results");
      const savedSurvey = localStorage.getItem("pawinhand_survey_input");
      if (savedSurvey) {
        try {
          surveyInput = JSON.parse(savedSurvey);
        } catch (e) {
          console.warn("Failed to parse survey input", e);
        }
      }

      // Check referrer to see if we came from a specific animal
      const pathArray = document.referrer ? new URL(document.referrer).pathname.split("/") : [];
      const isFromAnimalDetail = pathArray.includes("animals");
      const lastAnimalId = isFromAnimalDetail ? pathArray[pathArray.length - 1] : null;

      if (lastAnimalId) {
        const animal = animals.find((a) => a.id === lastAnimalId);
        if (animal) {
          targetShelterId = animal.shelter_id;
        }
      } else if (savedMatches) {
        try {
          const matches = JSON.parse(savedMatches);
          if (matches.length > 0) {
            targetShelterId = matches[0].shelter_id;
          }
        } catch (e) {
          console.warn("Failed to parse match results", e);
        }
      }

      const shelter = shelters.find((s) => s.shelter_id === targetShelterId) || shelters[0];
      setCurrentShelter(shelter);
    }

    // 2. Fetch questionnaire from backend (POST /api/questions) with survey input payload
    const fetchQuestionnaire = async () => {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      try {
        const response = await fetch(`${API_BASE}/api/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(surveyInput || {}),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Map backend questions list to local category mapping
          let mappedQuestions = { ...DEFAULT_QUESTIONS };
          if (data.questions && Array.isArray(data.questions)) {
            CATEGORIES.forEach((cat) => { mappedQuestions[cat] = []; });
            data.questions.forEach((q) => {
              if (mappedQuestions[q.category]) {
                mappedQuestions[q.category].push(q.text);
              }
            });
            setDynamicQuestions(mappedQuestions);
          } else if (data.questions && typeof data.questions === "object") {
            setDynamicQuestions({ ...DEFAULT_QUESTIONS, ...data.questions });
          }

          if (data.checklist && Array.isArray(data.checklist)) {
            setChecklistItems(data.checklist);
          }
        } else {
          throw new Error("Questions API response not ok");
        }
      } catch (error) {
        console.warn("FastAPI Server not available for questions. Simulating locally.", error);
        // Fallback: Default to local constants (dynamicQuestions & checklistItems remain DEFAULT)
      }
    };

    fetchQuestionnaire();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`"${label}" 복사되었습니다!`);
  };

  const copyAllQuestions = () => {
    const list = dynamicQuestions[activeTab] || [];
    const allText = list.map((q, idx) => `${idx + 1}. ${q}`).join("\n");
    copyToClipboard(allText, `${activeTab} 전체 질문`);
  };

  const toggleChecklist = (idx) => {
    setChecklist({
      ...checklist,
      [idx]: !checklist[idx]
    });
  };

  return (
    <main className="pb-8 max-w-[1024px] mx-auto px-4 md:px-6 pt-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-caption px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Section */}
      <section className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight leading-tight text-on-surface mb-1 font-bold">보호소 질문지</h1>
        <p className="text-[16px] leading-relaxed text-on-surface-variant">
          입양 문의 전 보호소에 질문할 목록을 정리하고, 입양 준비 상태를 확인해 보세요.
        </p>
      </section>

      {/* Category Tabs */}
      <nav className="mb-6 overflow-x-auto hide-scrollbar -mx-lg px-4">
        <div className="flex gap-2 w-max">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`h-[36px] px-4 rounded-full flex items-center justify-center font-button-lg text-caption transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#FF7A50] text-white font-semibold"
                    : "bg-[#F5F0EB] text-on-surface-variant hover:bg-zinc-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Question List Box */}
      <section className="bg-white rounded-2xl border border-[#F0E5DD] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 relative mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h2 className="text-[18px] font-semibold leading-normal text-on-surface font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[#FF7A50]">forum</span>
            {activeTab} 추천 질문
          </h2>
          <button
            onClick={copyAllQuestions}
            className="flex items-center gap-1 text-[14px] font-semibold text-[#FF7A50] bg-[#FFF1EC] hover:bg-[#FFE2D6] px-4 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            전체 질문 복사
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {(dynamicQuestions[activeTab] || []).map((q, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-[#FFFBF7] border border-[#F5F0EB] rounded-xl hover:border-primary-container transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#FFE2D6] text-primary-container font-bold text-caption flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-[16px] leading-relaxed text-on-surface pr-sm">{q}</p>
              </div>
              <button
                onClick={() => copyToClipboard(q, "질문이")}
                className="w-8 h-8 rounded-full hover:bg-[#FFF1EC] text-on-surface-variant hover:text-primary-container flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="복사하기"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Preparation Checklist */}
      <section className="bg-white rounded-2xl border border-[#F0E5DD] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 mb-8">
        <h2 className="text-[18px] font-semibold leading-normal text-on-surface font-semibold flex items-center gap-1 mb-6">
          <span className="material-symbols-outlined text-secondary">fact_check</span>
          입양 준비 체크리스트
        </h2>
        <div className="flex flex-col gap-2">
          {checklistItems.map((item, idx) => {
            const isChecked = !!checklist[idx];
            return (
              <label
                key={idx}
                onClick={() => toggleChecklist(idx)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? "bg-secondary-container/10 border-secondary-container"
                    : "bg-white border-[#F5F0EB] hover:border-zinc-200"
                }`}
              >
                <span className={`material-symbols-outlined shrink-0 mt-1 ${isChecked ? "text-secondary font-bold" : "text-gray-300"}`}>
                  {isChecked ? "check_box" : "check_box_outline_blank"}
                </span>
                <span className={`text-[16px] leading-relaxed leading-relaxed ${isChecked ? "text-on-surface font-medium line-through decoration-secondary/35" : "text-on-surface-variant"}`}>
                  {item}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Shelter Info Panel */}
      {currentShelter && (
        <section className="bg-white border border-[#F0E5DD] rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-primary-container/10 rounded-xl flex items-center justify-center shrink-0 border border-brand-primary-light">
              <span className="material-symbols-outlined text-primary-container text-[24px]">call</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary-container bg-brand-primary-light px-sm py-[2px] rounded-full">상담 문의 보호소</span>
              <h3 className="font-h3 text-[18px] text-on-surface font-bold mt-2 mb-1">{currentShelter.name}</h3>
              <p className="text-[13px] leading-normal text-on-surface-variant">{currentShelter.address}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <a
              href={`tel:${currentShelter.phone}`}
              className="flex-1 md:flex-initial bg-primary-container text-white px-6 h-[48px] rounded-xl font-button-lg text-body hover:opacity-90 transition-all flex items-center justify-center whitespace-nowrap gap-1 font-bold active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">phone</span>
              {currentShelter.phone}
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
