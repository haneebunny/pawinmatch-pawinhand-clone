"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Form options defined in AGENTS.md
const HOUSING_OPTIONS = ["아파트", "빌라·다세대", "단독주택", "원룸·오피스텔"];
const OUT_HOURS_OPTIONS = ["4시간 미만", "4~8시간", "8시간 이상"];
const WALK_TIME_OPTIONS = ["30분 미만", "30분~1시간", "1시간 이상"];
const PET_EXP_OPTIONS = ["없음", "있음(현재는 없음)", "있음(현재도 있음)"];
const BUDGET_OPTIONS = ["10만원 미만", "10~20만원", "20~30만원", "30만원 이상"];
const CHILD_PLAN_OPTIONS = ["자녀 없음·계획 없음", "자녀 있음", "계획 있음"];

const ACTIVITY_PREFS = [
  "조용하고 차분한 아이",
  "적당히 활발한 아이",
  "활발하고 에너지 넘치는 아이"
];

const SOCIABILITY_PREFS = [
  "독립적인 편이 좋아요",
  "적당히 붙어있는 게 좋아요",
  "항상 곁에 있고 싶어요"
];

const KEYWORD_OPTIONS = [
  "온순해요",
  "독립적이에요",
  "사람을 좋아해요",
  "산책을 좋아해요",
  "다른 동물과 잘 지내요",
  "초보자와 잘 맞아요"
];

export default function DiagnosePage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Step 1: Environment, Step 2: Prefs, Step 3: Result
  
  // Step 1 Form State
  const [housing, setHousing] = useState("");
  const [outHours, setOutHours] = useState("");
  const [walkTime, setWalkTime] = useState("");
  const [petExperience, setPetExperience] = useState("");
  const [budget, setBudget] = useState("");
  const [childPlan, setChildPlan] = useState("");

  // Step 2 Form State
  const [activityPref, setActivityPref] = useState("");
  const [sociabilityPref, setSociabilityPref] = useState("");
  const [keywords, setKeywords] = useState([]);

  // Step 3 Result State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleKeyword = (kw) => {
    if (keywords.includes(kw)) {
      setKeywords(keywords.filter((k) => k !== kw));
    } else {
      setKeywords([...keywords, kw]);
    }
  };

  const isStep1Complete = housing && outHours && walkTime && petExperience && budget && childPlan;
  const isStep2Complete = activityPref && sociabilityPref && keywords.length > 0;

  const handleStep1Submit = () => {
    if (isStep1Complete) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleStep2Submit = async () => {
    if (!isStep2Complete) return;

    setLoading(true);
    setStep(3);
    window.scrollTo(0, 0);

    const requestBody = {
      housing,
      out_hours: outHours,
      walk_time: walkTime,
      pet_experience: petExperience,
      budget,
      child_plan: childPlan,
      activity_pref: activityPref,
      sociability_pref: sociabilityPref,
      keywords
    };

    // Store user inputs for the matching page
    localStorage.setItem("pawinhand_survey_input", JSON.stringify(requestBody));

    try {
      // Try hitting FastAPI server
      const response = await fetch("http://localhost:8000/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error("API call failed, falling back to local simulation");
      }
    } catch (error) {
      console.warn("FastAPI Server not available. Simulating evaluation locally.", error);
      
      // Local Evaluation Simulation Algorithm
      setTimeout(() => {
        let grade = "입양 가능";
        let good_points = [];
        let check_points = [];

        // Determine grade and feedback
        if (outHours === "8시간 이상" && walkTime === "30분 미만") {
          grade = "신중히 재고";
          good_points = [
            "월 예산을 고려하고 있어 기본 양육비 계획이 잘 준비되어 있어요.",
            childPlan.includes("없음") ? "자녀 계획 등 양육에 집중할 수 있는 주거 가구 형태입니다." : "가족의 동의를 구하기 편리한 환경입니다."
          ];
          check_points = [
            "하루 외출 시간이 8시간 이상으로 길고 산책 시간도 부족합니다. 강아지의 분리 불안이나 우울증 위험이 매우 높으니, 자동 장난감 구비나 펫시터 채용을 신중히 검토하세요.",
            "주거 형태에 따라 반려동물의 행동 제약이 생길 수 있으니 방음 조치 및 실내 스트레스 해소책을 마련해야 합니다."
          ];
        } else if (outHours === "8시간 이상" || walkTime === "30분 미만" || housing === "원룸·오피스텔") {
          grade = "조건부 가능";
          good_points = [
            walkTime !== "30분 미만" ? "하루 30분 이상 산책 시간을 할애할 준비가 되어 있으십니다." : "반려동물을 위해 예산을 마련하고 계획성을 보이고 있어요.",
            petExperience !== "없음" ? "과거 반려동물을 키워본 경험이 있어 초기 적응 시 대처법을 잘 알고 있습니다." : "새로운 시작을 위해 꼼꼼하게 준비하고 계십니다."
          ];
          check_points = [
            outHours === "8시간 이상" ? "외출 시간이 긴 편이므로 혼자서도 외로움을 덜 타고 얌전한 성격의 아이를 우선 고려해보세요." : "산책 가능 시간이 비교적 짧으므로 활동량이 적은 중소형견 또는 독립적인 고양이 입양을 추천해 드립니다.",
            housing === "원룸·오피스텔" ? "원룸 공간은 대형견이 활동하기 좁을 수 있어, 체구가 작은 소형견이나 고양이가 적합할 수 있습니다." : "이웃 간의 소음 민원에 대비해 기본 예절 훈련 계획을 미리 세워두는 것이 좋습니다."
          ];
        } else {
          grade = "입양 가능";
          good_points = [
            "하루 외출 시간이 짧고 산책 시간이 넉넉하여 동물과 매일 깊은 정서 교감을 나눌 수 있는 이상적인 여건입니다.",
            "주거 형태(단독주택/아파트 등)가 안정적이며 월 예산도 적절히 수립되어 있습니다.",
            "가족 동의 혹은 자녀 계획 여부가 반려동물의 미래 안정을 도울 수 있습니다."
          ];
          check_points = [
            "아이가 입양 초기에 새로운 주거지에 적응할 수 있도록 첫 며칠간은 집안을 조용하게 유지해 주세요.",
            "건강 상태나 예방접종 등 보호소에 미리 질문해볼 사항들을 입양 전 체크리스트와 함께 정리해보시는 것을 권장합니다."
          ];
        }

        // Budget evaluation
        let minCost = 10;
        let maxCost = 15;
        if (budget === "10만원 미만") { minCost = 7; maxCost = 11; }
        else if (budget === "10~20만원") { minCost = 12; maxCost = 19; }
        else if (budget === "20~30만원") { minCost = 20; maxCost = 29; }
        else if (budget === "30만원 이상") { minCost = 30; maxCost = 45; }

        setResult({
          grade,
          good_points,
          check_points,
          monthly_cost: { min: minCost, max: maxCost, gov_support: 20 }
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-8">
      {/* STEP 1: 생활환경 입력 */}
      {step === 1 && (
        <div>
          <div className="mb-8">
            <h1 className="text-[28px] font-bold tracking-tight leading-tight text-on-surface mb-2">입양 적합도 진단</h1>
            <p className="text-[13px] leading-normal text-on-surface-variant">나와 잘 맞는 아이를 찾기 위해 생활환경을 알려주세요.</p>
          </div>
          
          <div className="flex items-center gap-2 mb-12">
            <div className="text-[#FF7A50] font-bold text-body">1 / 2</div>
            <div className="flex-grow h-[4px] bg-[#F5F0EB] rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-[#FF7A50]"></div>
            </div>
          </div>

          <div className="bg-[#F5F0EB] rounded-xl p-4 mb-12 text-center">
            <p className="text-[16px] leading-relaxed text-on-surface">정답은 없어요. 솔직하게 알려주세요.</p>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-6 mb-12">
            {/* 1. 주거형태 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface">주거형태</h3>
              <div className="flex flex-wrap gap-2">
                {HOUSING_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setHousing(opt)}
                    className={`h-[36px] px-4 rounded-full font-medium text-caption transition-colors cursor-pointer ${
                      housing === opt
                        ? "bg-[#FF7A50] text-white"
                        : "bg-[#F5F0EB] text-on-surface-variant hover:bg-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 하루 외출 시간 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface">하루 외출 시간</h3>
              <div className="flex flex-wrap gap-2">
                {OUT_HOURS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setOutHours(opt)}
                    className={`h-[36px] px-4 rounded-full font-medium text-caption transition-colors cursor-pointer ${
                      outHours === opt
                        ? "bg-[#FF7A50] text-white"
                        : "bg-[#F5F0EB] text-on-surface-variant hover:bg-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 산책 가능 시간 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface">산책 가능 시간</h3>
              <div className="flex flex-wrap gap-2">
                {WALK_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setWalkTime(opt)}
                    className={`h-[36px] px-4 rounded-full font-medium text-caption transition-colors cursor-pointer ${
                      walkTime === opt
                        ? "bg-[#FF7A50] text-white"
                        : "bg-[#F5F0EB] text-on-surface-variant hover:bg-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 반려동물 경험 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface">반려동물 경험</h3>
              <div className="flex flex-wrap gap-2">
                {PET_EXP_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPetExperience(opt)}
                    className={`h-[36px] px-4 rounded-full font-medium text-caption transition-colors cursor-pointer ${
                      petExperience === opt
                        ? "bg-[#FF7A50] text-white"
                        : "bg-[#F5F0EB] text-on-surface-variant hover:bg-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. 월 예산 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface">월 예산</h3>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBudget(opt)}
                    className={`h-[36px] px-4 rounded-full font-medium text-caption transition-colors cursor-pointer ${
                      budget === opt
                        ? "bg-[#FF7A50] text-white"
                        : "bg-[#F5F0EB] text-on-surface-variant hover:bg-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. 자녀 계획 여부 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface">자녀 계획 여부</h3>
              <div className="flex flex-wrap gap-2">
                {CHILD_PLAN_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setChildPlan(opt)}
                    className={`h-[36px] px-4 rounded-full font-medium text-caption transition-colors cursor-pointer ${
                      childPlan === opt
                        ? "bg-[#FF7A50] text-white"
                        : "bg-[#F5F0EB] text-on-surface-variant hover:bg-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-[13px] leading-normal text-[#6B7280]">
              {!isStep1Complete && "모든 항목을 선택해야 선호도 입력을 진행할 수 있습니다."}
              {isStep1Complete && "준비 완료! 아래 버튼을 클릭해 원하는 아이의 성향을 선택해 주세요."}
            </p>
            <button
              onClick={handleStep1Submit}
              disabled={!isStep1Complete}
              className={`w-full h-[52px] rounded-xl font-button-lg shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                isStep1Complete ? "bg-[#FF7A50] text-white hover:opacity-90" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              선호도 입력하기
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 원하는 아이 성향 입력 */}
      {step === 2 && (
        <div>
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <h1 className="text-[28px] font-bold tracking-tight leading-tight text-on-surface">어떤 아이와 잘 맞을까요?</h1>
              <span className="text-primary-container font-bold font-body">2 / 2</span>
            </div>
            <div className="w-full h-1 bg-[#F5F0EB] rounded-full overflow-hidden mb-3">
              <div className="w-full h-full bg-primary-container"></div>
            </div>
            <p className="text-on-surface-variant text-[13px] leading-normal">함께 지내고 싶은 아이의 성향을 가볍게 골라주세요.</p>
          </div>

          {/* 활동성 선호 */}
          <section className="mb-8">
            <h3 className="text-[18px] font-semibold leading-normal mb-3 text-on-surface">활동성 선호</h3>
            <div className="space-y-md">
              {ACTIVITY_PREFS.map((pref) => {
                const isActive = activityPref === pref;
                return (
                  <button
                    key={pref}
                    onClick={() => setActivityPref(pref)}
                    className={`w-full p-4 bg-white border rounded-2xl text-left flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-primary-container group transition-all cursor-pointer ${
                      isActive ? "border-primary-container bg-primary-container/5 ring-1 ring-primary-container" : "border-outline-variant"
                    }`}
                  >
                    <span className={`text-[16px] leading-relaxed group-hover:text-primary-container transition-colors ${isActive ? "text-primary-container font-semibold" : "text-on-surface"}`}>
                      {pref}
                    </span>
                    <span className={`material-symbols-outlined transition-colors ${isActive ? "text-primary-container" : "text-outline-variant group-hover:text-primary-container"}`}>
                      {isActive ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 사람 친화도 선호 */}
          <section className="mb-8">
            <h3 className="text-[18px] font-semibold leading-normal mb-3 text-on-surface">사람 친화도 선호</h3>
            <div className="space-y-md">
              {SOCIABILITY_PREFS.map((pref) => {
                const isActive = sociabilityPref === pref;
                return (
                  <button
                    key={pref}
                    onClick={() => setSociabilityPref(pref)}
                    className={`w-full p-4 bg-white border rounded-2xl text-left flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-primary-container group transition-all cursor-pointer ${
                      isActive ? "border-primary-container bg-primary-container/5 ring-1 ring-primary-container" : "border-outline-variant"
                    }`}
                  >
                    <span className={`text-[16px] leading-relaxed group-hover:text-primary-container transition-colors ${isActive ? "text-primary-container font-semibold" : "text-on-surface"}`}>
                      {pref}
                    </span>
                    <span className={`material-symbols-outlined transition-colors ${isActive ? "text-primary-container" : "text-outline-variant group-hover:text-primary-container"}`}>
                      {isActive ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 성향 키워드 다중선택 */}
          <section className="mb-12">
            <h3 className="text-[18px] font-semibold leading-normal mb-3 text-on-surface">성향 키워드 (다중 선택)</h3>
            <div className="flex flex-wrap gap-2">
              {KEYWORD_OPTIONS.map((kw) => {
                const isActive = keywords.includes(kw);
                return (
                  <button
                    key={kw}
                    onClick={() => toggleKeyword(kw)}
                    className={`px-4 py-2 rounded-full font-body text-caption border transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary-container text-white border-transparent font-medium"
                        : "bg-[#F5F0EB] text-on-surface-variant border-transparent hover:border-primary-container"
                    }`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-[13px] leading-normal text-[#6B7280]">
              {!isStep2Complete && "모든 항목을 선택하고 키워드를 최소 1개 골라야 진단을 시작할 수 있습니다."}
              {isStep2Complete && "준비 완료! 아래 버튼을 눌러 AI 진단 결과를 생성하세요."}
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 h-[52px] border-2 border-primary-container text-primary-container rounded-xl font-button-lg hover:bg-[#FFF1EC] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              >
                이전 단계
              </button>
              <button
                onClick={handleStep2Submit}
                disabled={!isStep2Complete}
                className={`flex-1 h-[52px] rounded-xl font-button-lg shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center ${
                  isStep2Complete ? "bg-primary-container text-white hover:opacity-90" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                진단 완료하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 진단 결과 */}
      {step === 3 && (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          {!result ? (
            // Loading Animation
            <div className="text-center py-giant flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
              <h3 className="text-[18px] font-semibold leading-normal text-on-surface">AI 입양 적합도를 진단하는 중입니다...</h3>
              <p className="text-[13px] leading-normal text-on-surface-variant">잠시만 기다려 주세요.</p>
            </div>
          ) : (
            // Result View
            <div className="w-full flex flex-col items-center">
              {/* Result Status Badge */}
              <div className="mb-6">
                <span
                  className={`inline-flex items-center h-[48px] px-6 text-white rounded-full text-[20px] font-bold shadow-lg ${
                    result.grade === "입양 가능"
                      ? "bg-secondary"
                      : result.grade === "조건부 가능"
                      ? "bg-warning-accent"
                      : "bg-[#DC2626]"
                  }`}
                >
                  <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {result.grade === "입양 가능" ? "check_circle" : "info"}
                  </span>
                  {result.grade}
                </span>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-bold tracking-tight leading-tight mb-2">입양 적합도 진단 결과</h1>
                <p className="text-[16px] leading-relaxed text-on-surface-variant">
                  소중한 가족을 맞이하기 위해 지금 준비할 수 있는 부분을 확인해 보세요.
                </p>
              </div>

              {/* Feedback Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
                {/* Good Points */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform hover:scale-[1.01]">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center mr-3">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    </div>
                    <h3 className="text-[18px] font-semibold leading-normal text-secondary font-bold">잘 맞는 점</h3>
                  </div>
                  <ul className="space-y-sm text-[16px] leading-relaxed text-on-surface-variant">
                    {result.good_points.map((pt, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-secondary mr-2 shrink-0">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Check Points / Improvements */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform hover:scale-[1.01]">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center mr-3">
                      <span className="material-symbols-outlined text-warning-accent" style={{ fontVariationSettings: "'FILL' 1" }}>
                        lightbulb
                      </span>
                    </div>
                    <h3 className="text-[18px] font-semibold leading-normal text-warning-accent font-bold">보완하면 좋은 점</h3>
                  </div>
                  <ul className="space-y-sm text-[16px] leading-relaxed text-on-surface-variant">
                    {result.check_points.map((pt, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-warning-accent mr-2 shrink-0">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Monthly Cost Box */}
              <div className="w-full bg-[#F5F0EB] border border-outline-variant rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3 shrink-0 border border-brand-border">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      payments
                    </span>
                  </div>
                  <div>
                    <p className="text-[16px] leading-relaxed font-semibold text-on-surface">
                      월 약 {result.monthly_cost.min}~{result.monthly_cost.max}만원이 예상돼요.
                    </p>
                    <p className="text-[16px] leading-relaxed text-on-surface-variant mt-1 text-[14px]">
                      입양 전 기본 양육비와 병원비를 함께 고려해 보세요.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[500px]">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-[52px] border-2 border-[#FF7A50] text-[#FF7A50] rounded-xl font-button-lg hover:bg-[#FFF1EC] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  다시 진단하기
                </button>
                <Link
                  href="/match/results"
                  className="flex-[2] h-[52px] bg-[#FF7A50] hover:opacity-90 transition-all duration-300 active:scale-95 text-white text-[16px] font-semibold rounded-[12px] shadow-lg flex items-center justify-center group"
                >
                  나와 맞는 아이 보기
                  <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
