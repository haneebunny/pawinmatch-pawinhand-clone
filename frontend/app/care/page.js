"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CarePage() {
  const [productsData, setProductsData] = useState(null);
  const [insuranceData, setInsuranceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Block A - Personalization selections (User circumstances)
  const [outHoursLong, setOutHoursLong] = useState(false);
  const [highActivity, setHighActivity] = useState(false);
  const [walkTimeLong, setWalkTimeLong] = useState(false);
  const [firstAdoption, setFirstAdoption] = useState(false);
  const [catAdoption, setCatAdoption] = useState(false);

  // Checked items list (State strictly managed in React useState as requested)
  const [checkedItems, setCheckedItems] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({
      ...prev,
      [itemId]: true,
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, insRes] = await Promise.all([
          fetch("/data/care_products.json"),
          fetch("/data/care_insurance.json"),
        ]);

        if (!prodRes.ok || !insRes.ok) {
          throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
        }

        const prods = await prodRes.json();
        const ins = await insRes.json();

        setProductsData(prods);
        setInsuranceData(ins);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <main className="w-full max-w-[1024px] px-4 md:px-6 mx-auto py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#FFE2D6] border-t-[#FF7A50] rounded-full animate-spin"></div>
        <p className="mt-4 text-zinc-500 font-medium text-[14px]">입양 후 케어 정보를 가져오는 중...</p>
      </main>
    );
  }

  if (error || !productsData || !insuranceData) {
    return (
      <main className="w-full max-w-[1024px] px-4 md:px-6 mx-auto py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <span className="material-symbols-outlined text-[48px] text-red-400">warning</span>
        <h2 className="text-[20px] font-bold text-zinc-800 mt-2">데이터 로드 실패</h2>
        <p className="text-zinc-500 text-[14px] mt-1">{error || "지정한 JSON 파일이 존재하지 않습니다."}</p>
      </main>
    );
  }

  const { meta: prodMeta, items: prodItems, personalization_rules: prodRules } = productsData;
  const { meta: insMeta, insurers: insInsurers } = insuranceData;

  // Toggle checklist item checked state
  const handleToggleCheck = (itemId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Helper to determine all personalization badges an item matches (Multiple support)
  const getItemBadges = (itemId) => {
    if (!prodRules) return [];
    const activeBadges = [];

    if (firstAdoption) {
      const rule = prodRules.find((r) => r.rule_id === "first_adoption");
      if (rule && rule.item_ids.includes(itemId)) {
        activeBadges.push({ badge: rule.badge, reason: rule.badge_reason });
      }
    }
    if (outHoursLong) {
      const rule = prodRules.find((r) => r.rule_id === "long_absence");
      if (rule && rule.item_ids.includes(itemId)) {
        activeBadges.push({ badge: rule.badge, reason: rule.badge_reason });
      }
    }
    if (highActivity) {
      const rule = prodRules.find((r) => r.rule_id === "high_activity");
      if (rule && rule.item_ids.includes(itemId)) {
        activeBadges.push({ badge: rule.badge, reason: rule.badge_reason });
      }
    }
    if (walkTimeLong) {
      const rule = prodRules.find((r) => r.rule_id === "long_walk");
      if (rule && rule.item_ids.includes(itemId)) {
        activeBadges.push({ badge: rule.badge, reason: rule.badge_reason });
      }
    }
    if (catAdoption) {
      const rule = prodRules.find((r) => r.rule_id === "cat_adoption");
      if (rule && rule.item_ids.includes(itemId)) {
        activeBadges.push({ badge: rule.badge, reason: rule.badge_reason });
      }
    }

    return activeBadges;
  };

  return (
    <main className="w-full max-w-[1024px] px-4 md:px-6 mx-auto pb-16 pt-6 flex flex-col min-h-screen">
      
      {/* 0. Page Header */}
      <section className="border-b border-[#F0E5DD] pb-6 mb-8">
        <span className="font-caption text-[11px] font-bold text-[#FF7A50] bg-[#FFF1EC] px-2.5 py-1 rounded-full uppercase tracking-wider">
          💡 Pawinhand Premium Care Guide
        </span>
        <h1 className="text-[28px] md:text-[32px] font-black text-zinc-800 mt-3 leading-tight">
          입양 후 케어
        </h1>
        <p className="text-[14px] md:text-[15px] text-[#8B716A] mt-1.5 font-medium">
          입양이 끝이 아니에요. 새 가족과의 첫 시작을 도와드려요.
        </p>
      </section>

      {/* ================================================================ */}
      {/* BLOCK A: 입양 준비물 체크리스트 */}
      {/* ================================================================ */}
      <section className="bg-white border border-[#F0E5DD] rounded-2xl p-6 shadow-sm mb-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#F5ECE5] pb-4 mb-6 gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-zinc-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#FF7A50]">fact_check</span>
              {prodMeta?.title || "입양 준비물 체크리스트"}
            </h2>
            <p className="text-[13px] text-zinc-400 mt-1">
              {prodMeta?.subtitle || "○○이와의 새 생활, 이것만 준비하면 돼요"}
            </p>
          </div>

          <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            최종 업데이트: {prodMeta?.verified_date || "2026-07-02"}
          </div>
        </div>

        {/* Dynamic Personalization Toggles */}
        <div className="bg-[#FFFBF7]/80 border border-[#F6EFEA] rounded-xl p-4 mb-6">
          <span className="text-[12px] font-bold text-[#8B716A] flex items-center gap-1.5 mb-3 font-sans">
            <span className="material-symbols-outlined text-[16px] text-[#FF7A50] align-middle">psychology</span>
            나의 생활 환경과 입양할 아이의 성향을 켜보세요 (추천 뱃지가 표시됩니다):
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFirstAdoption(!firstAdoption)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                firstAdoption
                  ? "bg-[#FF7A50] text-white border-transparent shadow-sm"
                  : "bg-white text-zinc-600 border-[#E8DEC9] hover:bg-zinc-50"
              }`}
            >
              👶 첫 입양
            </button>
            <button
              onClick={() => setOutHoursLong(!outHoursLong)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                outHoursLong
                  ? "bg-[#FF7A50] text-white border-transparent shadow-sm"
                  : "bg-white text-zinc-600 border-[#E8DEC9] hover:bg-zinc-50"
              }`}
            >
              🕒 외출 8시간 이상
            </button>
            <button
              onClick={() => setHighActivity(!highActivity)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                highActivity
                  ? "bg-[#FF7A50] text-white border-transparent shadow-sm"
                  : "bg-white text-zinc-600 border-[#E8DEC9] hover:bg-zinc-50"
              }`}
            >
              ⚡ 활발한 아이
            </button>
            <button
              onClick={() => setWalkTimeLong(!walkTimeLong)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                walkTimeLong
                  ? "bg-[#FF7A50] text-white border-transparent shadow-sm"
                  : "bg-white text-zinc-600 border-[#E8DEC9] hover:bg-zinc-50"
              }`}
            >
              🐕 산책 1시간 이상
            </button>
            <button
              onClick={() => setCatAdoption(!catAdoption)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                catAdoption
                  ? "bg-[#FF7A50] text-white border-transparent shadow-sm"
                  : "bg-white text-zinc-600 border-[#E8DEC9] hover:bg-zinc-50"
              }`}
            >
              🐱 고양이 입양
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {prodItems?.map((item) => {
            const isChecked = !!checkedItems[item.id];
            const activeBadges = getItemBadges(item.id);

            return (
              <div
                key={item.id}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all relative ${
                  isChecked
                    ? "border-zinc-200 bg-zinc-50/50 opacity-60"
                    : "border-[#F0E5DD] hover:border-[#FF7A50]/60 hover:shadow-md bg-[#FFFBF7]/30"
                }`}
              >
                {/* 1. Item Header (Checkbox + Name) */}
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCheck(item.id)}
                        className="w-4 h-4 rounded border-[#F0E5DD] text-[#FF7A50] focus:ring-[#FF7A50] cursor-pointer"
                      />
                      <span className={`text-[15px] font-extrabold truncate ${
                        isChecked ? "line-through text-zinc-400 font-semibold" : "text-zinc-800"
                      }`}>
                        {item.name}
                      </span>
                    </label>

                    {/* Completion Stamp overlay */}
                    {isChecked && (
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full shrink-0">
                        준비 완료
                      </span>
                    )}
                  </div>

                  {/* 2. Image loader / Placeholder */}
                  <div className="mt-3 aspect-[16/10] w-full rounded-lg bg-[#F5ECE5] flex flex-col items-center justify-center text-[#B0A096] overflow-hidden border border-[#E9DFD8] relative">
                    {!imageErrors[item.id] ? (
                      <img
                        src={item.image_url || `/img/care_${item.id}.png`}
                        alt={item.name}
                        onError={() => handleImageError(item.id)}
                        className="w-full h-full object-contain p-2 bg-white"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[28px] text-[#A09086]">
                          {item.id === 8 ? "videocam" : item.id === 7 ? "schedule" : item.id === 9 ? "sports_tennis" : "shopping_bag"}
                        </span>
                        <span className="text-[11px] font-medium">이미지 준비중</span>
                      </div>
                    )}
                  </div>

                  {/* Why Description */}
                  <p className="mt-3 text-[12.5px] text-[#8B716A] leading-relaxed">
                    {item.why}
                  </p>
                </div>

                {/* Card Footer (Personalization Badge & CTA) */}
                <div className="mt-4 pt-3 border-t border-[#F5ECE5]">
                  {/* Badge Reasons (Multiple support) */}
                  {activeBadges.length > 0 && (
                    <div className="mb-2 flex flex-col gap-1.5">
                      {activeBadges.map((badgeInfo, idx) => (
                        <div key={idx} className="bg-[#FFF1EC] border border-[#FFE2D6] px-2.5 py-1.5 rounded-lg flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-pulse"></span>
                            <span className="text-[10px] font-extrabold text-[#FF7A50] uppercase tracking-wide">
                              {badgeInfo.badge}
                            </span>
                          </div>
                          <span className="text-[10.5px] font-semibold text-[#852400]">
                            {badgeInfo.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Advertisement CTA label */}
                  <a
                    href={item.coupang_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-[36px] w-full rounded-lg flex items-center justify-center text-[12px] font-bold transition-all gap-1 border ${
                      isChecked
                        ? "bg-zinc-200 text-zinc-400 border-zinc-200 cursor-not-allowed"
                        : "bg-white border-[#FFE2D6] text-[#FF7A50] hover:bg-[#FFFDFB] active:scale-98 cursor-pointer shadow-sm"
                    }`}
                  >
                    <span>{prodMeta?.cta_label || "준비하러 가기"}</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Partners Disclosure Footer */}
        <div className="mt-6 border-t border-[#F5ECE5] pt-4 text-center">
          <p className="text-[11px] text-zinc-400 leading-normal">
            ℹ️ {prodMeta?.footer_disclosure}
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* BLOCK B: 맞춤 펫보험 */}
      {/* ================================================================ */}
      <section className="bg-white border border-[#F0E5DD] rounded-2xl p-6 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#F5ECE5] pb-4 mb-6 gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-zinc-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#FF7A50]">health_and_safety</span>
              {insMeta?.title || "맞춤 펫보험"}
            </h2>
            <p className="text-[13px] text-zinc-400 mt-1">
              {insMeta?.headline || "유기동물도 대부분 가입할 수 있어요"}
            </p>
          </div>

          <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            기준 일자: {insMeta?.verified_date || "2026-07-02"}
          </div>
        </div>

        {/* Headline notice banner */}
        <div className="bg-[#EBF7F2] text-[#0D6A42] px-4 py-3 rounded-xl border border-[#D5EFE3] mb-6 flex gap-2.5 items-start">
          <span className="material-symbols-outlined text-[20px] text-[#059669] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            info
          </span>
          <div className="text-[13px] leading-relaxed">
            <strong className="font-bold">안내사항:</strong> {insMeta?.headline} ({insMeta?.product_year || "2026년 상품 기준"})
          </div>
        </div>

        {/* Premium basis info block */}
        <div className="bg-[#F5F0EB]/40 border border-[#F0E5DD] rounded-xl p-3 mb-6 text-[12px] text-[#8B716A] leading-relaxed flex gap-2">
          <span className="material-symbols-outlined text-[18px] text-zinc-400 shrink-0">calculate</span>
          <p>{insMeta?.premium_basis}</p>
        </div>

        {/* Insurers list container (Order is preserved strictly as requested) */}
        <div className="flex flex-col gap-4">
          {insInsurers?.map((insurer) => {
            return (
              <div
                key={insurer.id}
                className="border border-[#F0E5DD] rounded-xl p-5 hover:border-[#FF7A50]/60 hover:shadow-md transition-all bg-[#FFFBF7]/10 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center"
              >
                {/* Left col: Logo, Name & Product */}
                <div className="flex gap-4 items-center min-w-0">
                  {/* Favicon / Logo container with onError safety fallbacks */}
                  <div className="w-[52px] h-[52px] rounded-xl bg-white border border-[#F0E5DD] flex items-center justify-center shrink-0 overflow-hidden p-1">
                    <img
                      src={insurer.logo_url}
                      alt={insurer.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "flex";
                        }
                      }}
                      className="w-full h-full object-contain"
                    />
                    <div className="hidden w-full h-full bg-[#FF7A50]/15 text-[#FF7A50] font-bold text-[16px] rounded-lg items-center justify-center uppercase">
                      {insurer.name ? insurer.name.substring(0, 2) : "보험"}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[16px] font-black text-zinc-800 leading-tight">
                      {insurer.name}
                    </h3>
                    <p className="text-[13px] text-[#8B716A] mt-1 truncate">
                      {insurer.product}
                    </p>
                    
                    {/* Badge Pill containers */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {insurer.badges?.map((badgeText, idx) => (
                        <span
                          key={idx}
                          className="bg-[#FFF1EC] text-[#FF7A50] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FFE2D6]"
                        >
                          {badgeText}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center col: Financials (Premium, Coverage, Deductible) */}
                <div className="flex-1 md:px-6 w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-b md:border-t-0 md:border-b-0 border-[#F5ECE5] py-4 md:py-0">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-zinc-400">월 예상 보험료</span>
                    <strong className="text-[17px] font-extrabold text-[#FF7A50] mt-0.5">
                      {insurer.monthly_premium_krw ? `월 ${insurer.monthly_premium_krw.toLocaleString()}원~` : insurer.premium_display}
                    </strong>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[11px] text-zinc-400">보상비율 / 자기부담금</span>
                    <span className="text-[13.5px] font-semibold text-zinc-700 mt-1">
                      {insurer.coverage_rate_percent}% / {(insurer.deductible_krw || 30000).toLocaleString()}원
                    </span>
                  </div>

                  <div className="sm:col-span-2 md:col-span-1 flex flex-col min-w-0">
                    <span className="text-[11px] text-zinc-400">보장 요약</span>
                    <p className="text-[12px] text-[#8B716A] leading-tight mt-1 truncate md:whitespace-normal line-clamp-2 font-medium">
                      {insurer.coverage_summary}
                    </p>
                  </div>
                </div>

                {/* Right col: Specialized Badges & Detail CTA */}
                <div className="w-full md:w-[220px] shrink-0 flex flex-col gap-2.5">
                  
                  {/* Abandoned Eligible Indicator */}
                  {insurer.abandoned_eligible && (
                    <div className="bg-[#EBF7F2] border border-[#D5EFE3] p-2 rounded-lg flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-[#0D6A42]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse"></span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide">유기동물 가입 가능</span>
                      </div>
                      <span className="text-[10.5px] text-[#0D6A42] leading-tight font-medium">
                        {insurer.abandoned_note}
                      </span>
                    </div>
                  )}

                  {/* Adoption Discount Indicator */}
                  {insurer.adoption_discount_percent && (
                    <div className="bg-[#FFF1EC] border border-[#FFE2D6] p-2 rounded-lg flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-[#852400]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-pulse"></span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide">
                          입양 할인 {insurer.adoption_discount_percent}%
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#852400] leading-tight font-medium">
                        {insurer.adoption_discount_note}
                      </span>
                    </div>
                  )}

                  {/* Details CTA Link */}
                  <a
                    href={insurer.detail_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[38px] w-full bg-white border border-[#FFE2D6] hover:bg-[#FFFDFB] text-[#FF7A50] rounded-lg flex items-center justify-center text-[12.5px] font-bold active:scale-98 cursor-pointer transition-all shadow-sm gap-1"
                  >
                    <span>{insMeta?.cta_label || "자세히 보기"}</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-8 border-t border-[#F5ECE5] pt-4 text-center">
          <p className="text-[11px] text-zinc-400 leading-normal max-w-[800px] mx-auto">
            ⚠ {insMeta?.footer_disclaimer}
          </p>
        </div>
      </section>

    </main>
  );
}
