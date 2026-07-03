import Link from "next/link";
import { shelters } from "../data/shelters";

export default function AnimalCard({ animal }) {
  const shelter = shelters.find(s => s.shelter_id === animal.shelter_id) || shelters[0];
  const shelterRegion = shelter.address ? shelter.address.split(" ").slice(0, 2).join(" ") : "보호소";
  // Helper to format age cleanly
  const formatAge = (ageStr) => {
    if (!ageStr) return "미상";
    if (typeof ageStr === "number") return `${ageStr}살`;
    const cleanAge = String(ageStr).trim();
    if (cleanAge.includes("년") || cleanAge.includes("세") || cleanAge.includes("개월")) {
      return cleanAge;
    }
    return `${cleanAge} 추정`;
  };

  // Helper to format dates using dot notation and shortening years for mobile compatibility
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const clean = dateStr.replace(/-/g, ".");
    return clean.length >= 8 && clean.startsWith("20") ? clean.slice(2) : clean;
  };

  const isNameless = !animal.name ||
    animal.name.trim() === "" ||
    animal.name.includes("없음") ||
    animal.name.includes("지어주세요");

  const displayName = isNameless ? "이름 짓는 중!" : animal.name;

  // Calculate if the animal is actually in an urgent notice period (0 to 3 days left from real-time today)
  const isUrgent = (() => {
    if (!animal.notice_end || animal.notice_end.includes("상시")) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 단위를 0으로 맞춰 날짜 차이만 정확히 계산
    const endDate = new Date(animal.notice_end);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  })();

  return (
    <Link
      href={`/animals/${animal.id}`}
      className="bg-white border border-[#F0E5DD] rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col group relative"
    >
      {/* Animal Photo */}
      <div className="w-full aspect-square bg-[#FAF6F0] relative overflow-hidden">
        <img
          src={animal.photos && animal.photos.length > 0 ? animal.photos[0] : (animal.photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400")}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Urgent Badge if applicable */}
        {isUrgent && (
          <div className="absolute top-2.5 left-2.5 bg-error text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-sm">
            🚨 마감임박
          </div>
        )}
        {/* Bell/Notification Count Badge (Always visible with absolute count) */}
        <div className="absolute top-2.5 right-2.5 bg-white/80 px-1.5 py-1 rounded-full flex items-center gap-0.5 shrink-0 ml-1">
          <span
            className="material-symbols-outlined text-yellow-400"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: "15px" }}
          >
            notifications
          </span>
          <span className="text-yellow-400 text-[11px] font-bold leading-none">
            {animal.bell_count || 0}
          </span>
        </div>
      </div>

      {/* Info Block */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface text-[18px] font-bold leading-normal truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-on-surface-variant text-[13px] leading-normal">
                {animal.animal_sex === "수컷" ? "♂️" : animal.animal_sex === "암컷" ? "♀️" : "❓"}
              </span>
            </div>
          </div>
          <p className="text-on-surface-variant text-[13px] leading-normal mb-3 truncate">
            {animal.breeds} • {formatAge(animal.animal_age)}
          </p>
        </div>
        <div className="pt-2 border-t border-surface-variant/20 flex flex-col gap-1 items-start">
          <p className="font-caption text-[11px] text-on-surface-variant truncate w-full">
            📍 {shelterRegion}
          </p>
          <p className="font-caption text-[10.5px] text-[#FF7A50] font-bold whitespace-nowrap">
            ⏱️ {formatDate(animal.notice_start)} ~ {formatDate(animal.notice_end)}
          </p>
        </div>
      </div>
    </Link>
  );
}
