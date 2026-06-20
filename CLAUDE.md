# YBM북스 v5 프로젝트 규칙

## UI 규칙
- 모든 UI 텍스트는 한국어로 작성
- 모바일/태블릿/PC 화면 크기에 맞게 반응형 구현
  - 모바일 퍼스트: 기본 스타일 → `@media(min-width:769px)` 태블릿 → `@media(min-width:1025px)` 데스크탑
- 이미지는 `/images` 폴더에 저장 (로컬 서버 기준 `/public/images` 경로)

## 기술 스택
- 순수 HTML / CSS / JavaScript (프레임워크 없음)
- CSS 변수 (`--red`, `--navy`, `--blue` 등) 사용
- 폰트: Pretendard, Noto Sans KR

## 파일 구조
- `index.html` — 메인 홈
- `books.html` — 교재 목록
- `book-detail.html` — 교재 상세
- `cart.html` — 장바구니
- `checkout.html` — 결제
- `login.html` — 로그인/회원가입
- `mypage.html` — 마이페이지
- `customer.html` — 고객센터
- `events.html` — 이벤트
- `resources.html` — 자료실
- `css/style.css` — 공통 스타일
- `js/main.js` — 공통 JS (BOOKS 데이터, renderBookCard 등)
- `images/` — 이미지 파일
