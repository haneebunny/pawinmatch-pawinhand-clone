"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isHomeActive = pathname === "/";
  const isDiagnoseActive = pathname.startsWith("/diagnose") || pathname.startsWith("/match");
  const isAnimalsActive = pathname.startsWith("/animals") || pathname.startsWith("/map");
  const isCareActive = pathname.startsWith("/care");

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white h-[56px] md:h-[72px] flex items-center px-4 md:px-6 border-b border-surface-variant/30">
      <div className="max-w-[1024px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-[18px] md:text-[20px] font-bold text-primary-container tracking-tight cursor-pointer px-2 py-0.5 md:py-1 block">
            PAWINHAND
          </Link>
        </div>
        <nav className="flex items-center gap-3.5 sm:gap-5 md:gap-8">
          <Link
            href="/"
            className={`${
              isHomeActive
                ? "text-black font-bold"
                : "text-gray-400 hover:text-black"
            } transition-colors text-[13.5px] md:text-[16px] leading-relaxed py-1`}
          >
            홈
          </Link>
          <Link
            href="/diagnose"
            className={`${
              isDiagnoseActive
                ? "text-black font-bold"
                : "text-gray-400 hover:text-black"
            } transition-colors text-[13.5px] md:text-[16px] leading-relaxed py-1`}
          >
            AI진단
          </Link>
          <Link
            href="/animals"
            className={`${
              isAnimalsActive
                ? "text-black font-bold"
                : "text-gray-400 hover:text-black"
            } transition-colors text-[13.5px] md:text-[16px] leading-relaxed py-1`}
          >
            보호동물
          </Link>
          <Link
            href="/care"
            className={`${
              isCareActive
                ? "text-black font-bold"
                : "text-gray-400 hover:text-black"
            } transition-colors text-[13.5px] md:text-[16px] leading-relaxed py-1`}
          >
            케어
          </Link>
        </nav>
      </div>
    </header>
  );
}

