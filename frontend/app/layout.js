import "./globals.css";
import Header from "./components/Header";

export const metadata = {
  title: "포인핸드 | 유기동물 입양",
  description: "포인핸드 클론코딩 + AI 매칭 + 지도 시각화 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="light">
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
        <div className="flex-grow pt-[72px]">
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
                <div className="flex items-center gap-3 flex-wrap">
                  <a className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border border-surface-variant/20" href="#">
                    <span className="material-symbols-outlined text-[20px]">public</span>
                  </a>
                  <a className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border border-surface-variant/20" href="#">
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  </a>
                  <a className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border border-surface-variant/20" href="#">
                    <span className="material-symbols-outlined text-[20px]">smart_display</span>
                  </a>
                  <div className="w-px h-4 bg-surface-variant/40 mx-xs"></div>
                  <a className="px-md py-1 bg-white rounded-full border border-surface-variant/20 font-caption text-[11px] hover:bg-surface-container transition-colors" href="#">Google Play</a>
                  <a className="px-md py-1 bg-white rounded-full border border-surface-variant/20 font-caption text-[11px] hover:bg-surface-container transition-colors" href="#">App Store</a>
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
