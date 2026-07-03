import "./globals.css";
import Header from "./components/Header";

export const metadata = {
  title: "포인핸드 | 유기동물 입양 - 유기견 입양 & 유기묘 입양 | 전국 동물보호센터 연결",
  description: "포인핸드 클론코딩 + AI 매칭 + 지도 시각화 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="light" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body text-on-surface min-h-screen flex flex-col bg-white">
        <Header />

        {/* Main content wrapper with margin top for the fixed header */}
        <div className="flex-grow pt-[56px] md:pt-[72px]">
          {children}
        </div>

        {/* Unified Footer */}
        <footer className="bg-[#F8F9FA] border-t border-surface-variant/20 pt-giant pb-8 px-4 md:px-6">
          <div className="pt-8 max-w-[1024px] mx-auto">
            <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8">
              <div className="lg:w-1/3">
                <LinkBrand />
                <p className="text-[13px] leading-normal text-on-surface-variant mb-6 leading-relaxed">
                  유기동물 입양의 새로운 기준을 만듭니다.<br />
                  포인핸드는 보호소 아이들의 가족을 찾아주는 국내 1위 유기동물 입양 플랫폼입니다.
                </p>
                <div className="flex flex-col gap-3">
                  {/* 상단: SNS 4종 (인스타, 블로그, 카카오톡, 유튜브) */}
                  <div className="flex items-center gap-3.5">
                    <a 
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-zinc-100" 
                      href="https://www.instagram.com/pawinhand_official" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="포인핸드 인스타그램"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="6.5" fill="url(#ig-grad)"/>
                        <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" stroke="white" strokeWidth="1.8"/>
                        <circle cx="12" cy="12" r="2.8" stroke="white" strokeWidth="1.8"/>
                        <circle cx="16.7" cy="7.3" r="0.9" fill="white"/>
                        <defs>
                          <radialGradient id="ig-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(3.6) rotate(52.7) scale(28.8)">
                            <stop offset="0" stopColor="#FED976"/>
                            <stop offset="0.25" stopColor="#FEB24C"/>
                            <stop offset="0.5" stopColor="#FD8D3C"/>
                            <stop offset="0.75" stopColor="#FC4E2A"/>
                            <stop offset="1" stopColor="#C92BB0"/>
                          </radialGradient>
                        </defs>
                      </svg>
                    </a>
                    <a 
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-zinc-100" 
                      href="https://blog.naver.com/pawinhand" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="포인핸드 네이버 블로그"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="6.5" fill="#03C75A"/>
                        <path d="M16.5 6.5H13.7L10.3 12.3V6.5H7.5V17.5H10.3L13.7 11.7V17.5H16.5V6.5Z" fill="white"/>
                      </svg>
                    </a>
                    <a 
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-zinc-100" 
                      href="https://pf.kakao.com/_vxaxbUxl" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="포인핸드 카카오톡 채널"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="6.5" fill="#FEE500"/>
                        <path d="M12 5C8.134 5 5 7.466 5 10.5C5 12.378 6.208 14.032 8.077 15.076L7.3 17.9C7.2 18.3 7.6 18.6 7.9 18.4L11.2 16.2C11.467 16.254 11.734 16.281 12 16.281C15.866 16.281 19 13.815 19 10.781C19 7.747 15.866 5.281 12 5.281L12 5Z" fill="#3A1D1D"/>
                      </svg>
                    </a>
                    <a 
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-zinc-100" 
                      href="https://www.youtube.com/@pawinhand_official" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="포인핸드 유튜브 채널"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="6.5" fill="#FF0000"/>
                        <path d="M9.5 8.5V15.5L15.5 12L9.5 8.5Z" fill="white"/>
                      </svg>
                    </a>
                  </div>

                  {/* 하단: 앱스토어 2종 (구글플레이, 앱스토어) */}
                  <div className="flex items-center gap-3.5 mt-1 border-t border-zinc-100 pt-2.5">
                    <a 
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-zinc-100" 
                      href="https://play.google.com/store/apps/details?id=lost.animal.main" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="구글 플레이스토어 앱 다운로드"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.25391 2.05469C3.07604 2.23438 2.97266 2.53125 2.97266 2.90625V21.0938C2.97266 2.46875 3.07604 2.76562 3.25391 2.94531L3.32812 3.01953L13.5605 13.252L13.5605 12.752L3.32812 2.51953L3.25391 2.05469Z" fill="#3BCCFF"/>
                        <path d="M16.9688 16.6602L13.5625 13.2539V12.7539L16.9688 9.34766L17.0527 9.39453L21.0859 11.6875C22.2383 12.3438 22.2383 13.4062 21.0859 14.0625L17.0527 16.3555L16.9688 16.6602Z" fill="#FFD000"/>
                        <path d="M17.0527 16.3555L13.5625 12.8652L3.32812 23.1L3.25391 23.0258C3.81641 22.4629 15.3594 15.9336 17.0527 14.9727" fill="#FF3333"/>
                        <path d="M17.0527 9.39453C15.3594 8.43359 3.81641 1.9043 3.25391 1.34141L3.32812 1.26719L13.5625 11.502L17.0527 8.01172" fill="#48FF48"/>
                      </svg>
                    </a>
                    <a 
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-zinc-100 text-zinc-700" 
                      href="https://apps.apple.com/kr/app/%ED%8F%AC%EC%9D%B8%ED%95%B8%EB%93%9C-%EC%9C%A0%EA%B8%B0%EB%8F%99%EB%AC%BC-%EC%9E%85%EC%96%91-%EC%8B%A4%EC%A2%85%EB%8F%99%EB%AC%BC-%EC%B0%BE%EA%B8%B0/id1019549518" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="애플 앱스토어 앱 다운로드"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <h4 className="font-h3 text-[15px] mb-4 text-on-surface font-bold">회사</h4>
                  <ul className="space-y-sm text-[13px] leading-normal text-on-surface-variant">
                    <li><a className="hover:text-primary transition-colors" href="#">소개</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">공지사항</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">후원</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-h3 text-[15px] mb-4 text-on-surface font-bold">서비스</h4>
                  <ul className="space-y-sm text-[13px] leading-normal text-on-surface-variant">
                    <li><a className="hover:text-primary transition-colors" href="/">홈</a></li>
                    <li><a className="hover:text-primary transition-colors" href="/diagnose">AI진단</a></li>
                    <li><a className="hover:text-primary transition-colors" href="/animals">보호동물 보기</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">입양 후 케어</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-h3 text-[15px] mb-4 text-on-surface font-bold">문의</h4>
                  <ul className="space-y-sm text-[13px] leading-normal text-on-surface-variant">
                    <li><a className="hover:text-primary transition-colors" href="#">자주하는 질문</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">제휴 문의</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">고객 센터</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-h3 text-[15px] mb-4 text-on-surface font-bold">법적고지</h4>
                  <ul className="space-y-sm text-[13px] leading-normal text-on-surface-variant">
                    <li><a className="hover:text-primary transition-colors" href="#">이용약관</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">개인정보처리방침</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-surface-variant/20 pt-4 text-center font-caption text-[11px] text-on-surface-variant/60">
              © {new Date().getFullYear()} PAWINHAND. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

// Small subcomponent to avoid loading Client Brand Link in server component
function LinkBrand() {
  return (
    <a href="/" className="text-[24px] font-bold text-primary-container mb-4 block">
      PAWINHAND
    </a>
  );
}
