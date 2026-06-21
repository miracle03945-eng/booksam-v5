/* =============================================
   북샘 - 공통 JS
   ============================================= */

// 시리즈 패널 (books.html에서 오버라이드됨; 다른 페이지에서는 books.html로 이동)
function openSeriesPanel() {
  window.location.href = 'books.html?openSeries=1';
}
function toggleSeriesPanel() {}

// 카트 상태 (localStorage)
const Cart = {
  items: JSON.parse(localStorage.getItem('booksam_cart') || '[]'),

  add(book) {
    const existing = this.items.find(i => i.id === book.id);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ ...book, qty: 1 });
    }
    this.save();
    this.updateBadge();
    Toast.show(`"${book.title}"을(를) 장바구니에 담았습니다.`, 'success');
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.updateBadge();
  },

  updateQty(id, qty) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.qty = Math.max(1, qty);
      this.save();
    }
  },

  total() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  save() {
    localStorage.setItem('booksam_cart', JSON.stringify(this.items));
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.count();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? '' : 'none';
    });
  }
};

// 비로그인 시 잔존 wishlist 데이터 제거
if (localStorage.getItem('isLoggedIn') !== 'true') {
  localStorage.removeItem('booksam_wish');
}

// Wishlist
const Wish = {
  items: localStorage.getItem('isLoggedIn') === 'true'
    ? JSON.parse(localStorage.getItem('booksam_wish') || '[]')
    : [],

  toggle(id) {
    if (this.has(id)) {
      this.items = this.items.filter(i => i !== id);
    } else {
      this.items.push(id);
    }
    localStorage.setItem('booksam_wish', JSON.stringify(this.items));
    return this.has(id);
  },

  has(id) {
    return this.items.includes(id);
  }
};

// ── 하트(관심 교재) 로그인 게이트 ──
function toggleWish(btn, id) {
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!loggedIn) {
    // 기존 모달 중복 방지
    document.getElementById('_wishLoginOv')?.remove();

    const ov = document.createElement('div');
    ov.id = '_wishLoginOv';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:36px 32px;max-width:320px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.18);">
        <div style="font-size:36px;margin-bottom:12px;">🔒</div>
        <div style="font-size:16px;font-weight:800;color:#1a2e44;margin-bottom:8px;">로그인이 필요합니다</div>
        <div style="font-size:13px;color:#888;margin-bottom:24px;line-height:1.7;">관심 교재에 추가하려면<br>로그인이 필요합니다.</div>
        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('_wishLoginOv').remove()"
            style="flex:1;padding:12px;border:1.5px solid #ddd;border-radius:8px;background:#fff;font-size:14px;font-weight:700;cursor:pointer;color:#555;">닫기</button>
          <button onclick="
              localStorage.setItem('redirectAfterLogin', location.href);
              localStorage.setItem('pendingWishId', '${id}');
              location.href='login.html';"
            style="flex:1;padding:12px;border:none;border-radius:8px;background:#dc2626;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">로그인 바로가기</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    return; // 버튼 상태 변경 없음
  }

  // 로그인 상태: 토글
  const active = Wish.toggle(id);
  btn.classList.toggle('active', active);
  btn.textContent = active ? '❤️' : '🤍';
  Toast.show(active ? '관심 교재에 추가되었습니다.' : '관심 교재에서 제거되었습니다.', 'success');
}

// ── 로그인 후 복귀 시 pending 위시 처리 ──
// main.js는 <body> 하단에 로드되므로 즉시 실행 (DOMContentLoaded 이미 완료)
(function _checkPendingWish() {
  const pendingId = localStorage.getItem('pendingWishId');
  if (!pendingId || localStorage.getItem('isLoggedIn') !== 'true') return;
  localStorage.removeItem('pendingWishId');
  const id = parseInt(pendingId);
  if (!Wish.has(id)) {
    Wish.toggle(id); // 카드 렌더 전에 Wish.items 업데이트 → 카드가 ❤️로 그려짐
    setTimeout(() => {
      Toast.show('관심 교재에 추가되었습니다.', 'success');
    }, 400);
  }
})();

// Toast
const Toast = {
  show(msg, type = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> ${msg}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
};

// URL 파라미터 파싱
function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}

// 숫자 포맷 (가격)
function fmtPrice(n) {
  return n.toLocaleString('ko-KR');
}

// 카테고리 라벨 / 색상 매핑
const CAT_INFO = {
  elementary: { label: '초등', color: 'var(--elementary)', tagClass: 'tag-elementary', icon: '📗', emoji: '🎒' },
  middle:     { label: '중학', color: 'var(--middle)',     tagClass: 'tag-middle',     icon: '📘', emoji: '📚' },
  high:       { label: '고등', color: 'var(--high)',       tagClass: 'tag-high',       icon: '📙', emoji: '🎓' },
  resources:  { label: '자료실', color: 'var(--resources)', tagClass: '',              icon: '📁', emoji: '📂' },
  events:     { label: '이벤트', color: 'var(--events)',   tagClass: '',               icon: '🎁', emoji: '🎉' },
};

// 샘플 도서 데이터 (영어 전용)
const BOOKS = [
  // ── 초등 ──
  { id: 1,  cat: 'elementary', type: '참고서', subject: '영어', area: '파닉스', title: 'Phonics NOW 1',
    author: 'YBM 편집부',  price: 14000, originalPrice: 16000, badge: 'best',
    img: 'images/phonics-now-1.png', publisher: 'YBM', date: '2024.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000216467389',
    desc: '파닉스의 기초부터 탄탄하게! AR 기반 체험형 학습으로 파닉스를 즐겁게 배우는 시리즈입니다.' },
  { id: 2,  cat: 'elementary', type: '참고서', subject: '영어', area: '파닉스', title: 'Phonics NOW 2',
    author: 'YBM 편집부',  price: 14000, originalPrice: 16000, badge: '',
    img: 'images/phonics-now-2.png', publisher: 'YBM', date: '2024.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000216467391',
    desc: '단모음·장모음 집중 학습! 단계별 워크북으로 파닉스 실력을 완성합니다.' },
  { id: 19, cat: 'elementary', type: '참고서', subject: '영어', area: '파닉스', title: 'Phonics NOW 3',
    author: 'YBM 편집부',  price: 14000, originalPrice: 16000, badge: 'new',
    img: 'images/phonics-now-3.png', publisher: 'YBM', date: '2024.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000216467392',
    desc: '이중모음·사이트워드 완성! 파닉스의 마지막 단계로 독립 읽기를 준비합니다.' },
  { id: 20, cat: 'elementary', type: '참고서', subject: '영어', area: '독해', title: 'Benchmark Reading 1.1',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: 'best',
    img: 'images/benchmark-reading-1-1.png', publisher: 'YBM', date: '2024.05.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000003878305',
    desc: '수준별 읽기의 기준! 균형 잡힌 픽션·논픽션 지문으로 영어 독서 습관을 형성합니다.' },
  { id: 21, cat: 'elementary', type: '참고서', subject: '영어', area: '독해', title: 'Benchmark Reading 1.2',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/benchmark-reading-1-2.png', publisher: 'YBM', date: '2024.05.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000003878306',
    desc: '다양한 장르의 지문으로 읽기 유창성을 높이고 어휘력을 자연스럽게 확장합니다.' },
  { id: 22, cat: 'elementary', type: '참고서', subject: '영어', area: '독해', title: 'Benchmark Reading 1.3',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/benchmark-reading-1-3.png', publisher: 'YBM', date: '2024.05.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000003878307',
    desc: '독해 전략과 비판적 사고력을 함께 키우는 Benchmark Reading 1단계 완성편.' },
  // ── 중학 ──
  { id: 6,  cat: 'middle', type: '참고서', subject: '영어', area: '어휘', title: 'Booster Voca 기본',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: 'best',
    img: 'images/booster-voca-basic.png', publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000218135543',
    desc: '50일로 끝내는 중등 필수 영단어 1000! 최신 교육과정 반영, 내신·수능 대비 필수 어휘 완성.' },
  { id: 7,  cat: 'middle', type: '참고서', subject: '영어', area: '어휘', title: 'Booster Voca 실력',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/booster-voca-power.png', publisher: 'YBM', date: '2024.01.01',
    desc: '50일로 끝내는 중등 필수 영단어 1200! 심화 어휘와 문맥 이해로 실력을 한 단계 높입니다.' },
  { id: 8,  cat: 'middle', type: '참고서', subject: '영어', area: '어휘', title: 'Booster Voca 완성',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/booster-voca-complete.png', publisher: 'YBM', date: '2024.01.01',
    desc: '50일로 끝내는 중등 필수 영단어 1200! 수능 기초까지 완성하는 최고 수준의 어휘 학습.' },
  { id: 16, cat: 'middle', type: '참고서', subject: '영어', area: '독해', title: 'I Love Reading Level 1 (2025)',
    author: 'YBM 편집부', price: 13500, originalPrice: 15000, badge: 'best',
    img: 'images/ilove-reading-1.png', publisher: 'YBM 교육출판', date: '2025.02.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000218082162',
    desc: '2025 개정 교육과정을 완벽 반영한 중학 영어 독해 시리즈.', tags: ['베스트셀러', '중학독해', 'MP3'] },
  { id: 17, cat: 'middle', type: '참고서', subject: '영어', area: '독해', title: 'I Love Reading Level 2 (2025)',
    author: 'YBM 편집부', price: 13500, originalPrice: 15000, badge: 'new',
    img: 'images/ilove-reading-2.png', publisher: 'YBM 교육출판', date: '2025.02.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000218082160',
    desc: '다양한 유형의 지문과 심화 독해 전략으로 수준 높은 독해 능력을 키웁니다.', tags: ['신규', '중학독해', 'MP3'] },
  { id: 18, cat: 'middle', type: '참고서', subject: '영어', area: '독해', title: 'I Love Reading Level 3 (2025)',
    author: 'YBM 편집부', price: 13500, originalPrice: 15000, badge: 'new',
    img: 'images/ilove-reading-3.png', publisher: 'YBM 교육출판', date: '2025.02.01',
    desc: '실전 수준의 지문과 독해 전략으로 내신 최고 등급을 목표로 합니다.', tags: ['중학독해', 'MP3'] },

  // ── 초등 교과서 / 평가문제집 ──
  { id: 28, cat: 'elementary', type: '교과서', subject: '영어', area: '평가문제집',
    title: '초등 영어 자습서 & 평가문제집 3-1 (22개정)',
    author: '김혜리 외', price: 15000, originalPrice: 17000, badge: 'new',
    img: 'images/elementary-workbook-3-1.png', publisher: 'YBM', date: '2026.01.01',
    desc: '22개정 새 교과서를 완벽 반영한 초등학교 3학년 1학기 영어 자습서 & 평가문제집.',
    tags: ['신규', '22개정', '초등영어'],
    sale: 'direct' },

  // ── 고등 참고서 (수능 영어) ──
  { id: 23, cat: 'high', type: '참고서', subject: '영어', area: '모의고사',
    title: 'Reading Booster 영어독해 모의고사 15회 (3rd Edition)',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'best',
    img: 'images/reading-booster-15.png', publisher: 'YBM', date: '2025.01.10',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000218082161',
    desc: '수능 영어 1등급 완성 프로젝트. 고난도 유형 집중 공략 수록, 실전 모의고사 15회 완성.',
    tags: ['베스트셀러', '수능', 'MP3'] },

  { id: 24, cat: 'high', type: '참고서', subject: '영어', area: '어법/어휘',
    title: 'Reading Booster 어법어휘',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'new',
    img: 'images/reading-booster-vocab.png', publisher: 'YBM', date: '2025.01.10',
    desc: '수능영어 1등급 프로젝트. 핵심개념·기출예제·실전문제 한 권으로 완성. MID-TEST 및 모의고사 10회 수록.',
    tags: ['수능', 'MP3'] },

  { id: 25, cat: 'high', type: '참고서', subject: '영어', area: '문법/구문',
    title: 'Reading Booster 구문독해',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'images/reading-booster-grammar.png', publisher: 'YBM', date: '2025.01.10',
    desc: '수능영어 1등급 프로젝트. 44개 핵심구문으로 독해력 완성. 고난도 유형 TEST 3회 수록.',
    tags: ['수능', 'MP3'] },

  { id: 26, cat: 'high', type: '참고서', subject: '영어', area: '독해',
    title: 'Reading Booster 유형독해',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'images/reading-booster-type.png', publisher: 'YBM', date: '2025.01.10',
    desc: '수능영어 1등급 프로젝트. 17개 수능유형 분석 및 32개 유형전략 제시. 실전대비 모의고사 총 9회 수록.',
    tags: ['수능', 'MP3'] },

  { id: 27, cat: 'high', type: '참고서', subject: '영어', area: '모의고사',
    title: 'Reading Booster 영어독해 모의고사 10+2회 기본 (2nd Edition)',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: 'new',
    img: 'images/reading-booster-10plus2.png', publisher: 'YBM', date: '2025.08.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000218082165',
    desc: '수능 독해유형별 전략 수록. 기본 모의고사 10회 + 심화 2회로 실전 감각 완성.',
    tags: ['신규', '수능', 'MP3'],
    sale: 'distributor',
    distributor: { name: '와이비엠 총판', phone: '02-2000-0500', email: 'ybmbooksam@ybm.co.kr' } },

  // ── 초등 · JET 시리즈 ──
  { id: 30, cat: 'elementary', type: '참고서', subject: '영어', area: '검정시험',
    title: 'JET Planet 1·2급',
    author: 'YBM 편집부', price: 12000, originalPrice: 13000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000451052.jpg',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000451052',
    desc: 'JET(주니어영어능력시험) 1·2급 완벽 대비. 핵심 어휘·듣기·읽기 전 영역 집중 훈련.' },
  { id: 31, cat: 'elementary', type: '참고서', subject: '영어', area: '검정시험',
    title: 'JET Planet 3·4급',
    author: 'YBM 편집부', price: 12000, originalPrice: 13000, badge: 'best',
    img: 'images/jet-planet-3-4.jpg',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000451053',
    desc: 'JET 3·4급 핵심 이론 완벽 정리. 실전 모의고사로 실력을 확인합니다.' },
  { id: 32, cat: 'elementary', type: '참고서', subject: '영어', area: '검정시험',
    title: 'JET Planet 5·6급',
    author: 'YBM 편집부', price: 12000, originalPrice: 13000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000451054.jpg',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000451054',
    desc: 'JET 5·6급 입문 완성. 기초 어휘와 기본 문장 학습으로 영어 자신감을 키웁니다.' },
  { id: 33, cat: 'elementary', type: '참고서', subject: '영어', area: '검정시험',
    title: 'JET 공식 기출문제집 1/2급',
    author: 'YBM 편집부', price: 10000, originalPrice: 11000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000451055.jpg',
    publisher: 'YBM', date: '2023.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '역대 JET 1·2급 기출 문제를 완벽 분석한 공식 기출문제집. 실전 감각을 극대화합니다.' },
  { id: 34, cat: 'elementary', type: '참고서', subject: '영어', area: '검정시험',
    title: 'JET 공식 기출문제집 3/4급',
    author: 'YBM 편집부', price: 10000, originalPrice: 11000, badge: 'best',
    img: 'images/jet-workbook-3-4.jpg',
    publisher: 'YBM', date: '2023.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '역대 JET 3·4급 기출 문제 총망라. 출제 경향 분석 및 실전 연습 완벽 제공.' },
  { id: 35, cat: 'elementary', type: '참고서', subject: '영어', area: '검정시험',
    title: 'JET 공식 기출문제집 5/6급',
    author: 'YBM 편집부', price: 10000, originalPrice: 11000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000451057.jpg',
    publisher: 'YBM', date: '2023.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '역대 JET 5·6급 기출 문제 총망라. 초등 영어 기초를 탄탄히 다집니다.' },

  // ── 중학 · 알리GO 올리GO ──
  { id: 36, cat: 'middle', type: '참고서', subject: '영어', area: '문법',
    title: '알리GO 올리GO 문법 1',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'best',
    img: 'images/aligo-oligo-grammar-1.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450441',
    desc: '핵심 문법 포인트를 대표 문장으로 정리! 내신 기출 유형 집중 훈련으로 1등급 완성.' },
  { id: 37, cat: 'middle', type: '참고서', subject: '영어', area: '문법',
    title: '알리GO 올리GO 문법 2',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450442.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450442',
    desc: '중학 문법의 핵심을 체계적으로 정리. 다양한 내신 유형 문제로 실전 완성.' },
  { id: 38, cat: 'middle', type: '참고서', subject: '영어', area: '문법',
    title: '알리GO 올리GO 문법 3',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450443.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450443',
    desc: '중학 고급 문법 완성. 서술형·고난도 유형까지 완벽 대비.' },
  { id: 39, cat: 'middle', type: '참고서', subject: '영어', area: '독해',
    title: '알리GO 올리GO 독해 1',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450438.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450438',
    desc: '교과서 연계 다양한 지문으로 독해 기초 완성. 내신 독해 유형 집중 훈련.' },
  { id: 40, cat: 'middle', type: '참고서', subject: '영어', area: '독해',
    title: '알리GO 올리GO 독해 2',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450439.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450439',
    desc: '다양한 소재의 지문과 심화 독해 전략으로 독해 실력을 한 단계 높입니다.' },
  { id: 41, cat: 'middle', type: '참고서', subject: '영어', area: '독해',
    title: '알리GO 올리GO 독해 3',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450440.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450440',
    desc: '고난도 지문과 실전 독해 전략으로 내신 최고 등급을 목표로 합니다.' },
  { id: 42, cat: 'middle', type: '참고서', subject: '영어', area: '쓰기',
    title: '알리GO 올리GO 서술형 쓰기 1',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450444.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450444',
    desc: '서술형 시험 완벽 대비! 단계별 쓰기 훈련으로 서술형 점수를 끌어올립니다.' },
  { id: 43, cat: 'middle', type: '참고서', subject: '영어', area: '쓰기',
    title: '알리GO 올리GO 서술형 쓰기 2',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450445.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450445',
    desc: '내신 서술형의 모든 유형을 분석하고 집중 훈련하는 중학 쓰기 교재.' },
  { id: 44, cat: 'middle', type: '참고서', subject: '영어', area: '쓰기',
    title: '알리GO 올리GO 서술형 쓰기 3',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450446.jpg',
    publisher: 'YBM', date: '2020.10.26',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450446',
    desc: '고난도 서술형까지 완벽 대비. 영작 실력과 내신 점수를 동시에 올립니다.' },

  // ── 중학 · 문제로 풀자 중학영문법 ──
  { id: 45, cat: 'middle', type: '참고서', subject: '영어', area: '문법',
    title: '문제로 풀자 중학영문법 Level 1',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'new',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000214577069.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000214577069',
    desc: '문제 풀이 중심의 중학 영문법! 핵심 문법을 바로 문제로 확인하며 빠르게 마스터.' },
  { id: 46, cat: 'middle', type: '참고서', subject: '영어', area: '문법',
    title: '문제로 풀자 중학영문법 Level 2',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000214577071.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000214577071',
    desc: '실전 문제 중심으로 중학 문법을 완성하는 Level 2. 내신 서술형까지 완벽 대비.' },
  { id: 47, cat: 'middle', type: '참고서', subject: '영어', area: '문법',
    title: '문제로 풀자 중학영문법 Level 3',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000214577081.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000214577081',
    desc: '중학 영문법의 완성! 고난도 문제로 고등 영어까지 대비합니다.' },

  // ── 중학 · 듣기 ──
  { id: 48, cat: 'middle', type: '참고서', subject: '영어', area: '듣기',
    title: '적중 100% 중학영어듣기 모의고사 20회 Level 1',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: '',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '실제 시험과 동일한 형식의 모의고사 20회로 중학 영어 듣기 Level 1 완벽 대비.' },
  { id: 49, cat: 'middle', type: '참고서', subject: '영어', area: '듣기',
    title: '적중 100% 중학영어듣기 모의고사 20회 Level 2',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: 'best',
    img: 'images/jungdok-listening-level2.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=171617520',
    desc: '중학 2학년 내신 영어듣기 완벽 대비. 최신 출제 경향 반영 모의고사 20회.' },
  { id: 50, cat: 'middle', type: '참고서', subject: '영어', area: '듣기',
    title: '적중 100% 중학영어듣기 모의고사 20회 Level 3',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: '',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '중학 최고 난이도의 듣기 모의고사 20회. 고등 영어 듣기까지 선행 대비.' },

  // ── 중학 · 어휘 ──
  { id: 51, cat: 'middle', type: '참고서', subject: '영어', area: '어휘',
    title: 'Time for VOCA Intermediate',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: '',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '중학~고1 수준의 핵심 어휘를 체계적으로 학습. 예문과 문제로 어휘력을 완성합니다.' },

  // ── 고등 · Grammar Sharp ──
  { id: 52, cat: 'high', type: '참고서', subject: '영어', area: '문법/구문',
    title: 'Grammar Sharp 기초',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: '',
    publisher: 'YBM', date: '2022.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '고등 영어 문법의 시작! 기초부터 체계적으로 정리하는 고등 영문법 입문서.' },
  { id: 53, cat: 'high', type: '참고서', subject: '영어', area: '문법/구문',
    title: 'Grammar Sharp 기본 1',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: '',
    publisher: 'YBM', date: '2022.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '핵심 문법 개념을 명확한 설명과 다양한 예문으로 이해. 내신·수능 완벽 대비.' },
  { id: 54, cat: 'high', type: '참고서', subject: '영어', area: '문법/구문',
    title: 'Grammar Sharp 기본 2',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'best',
    img: 'images/grammar-sharp-basic-2.jpg',
    publisher: 'YBM', date: '2022.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450487',
    desc: '고등 핵심 문법을 완벽 정리! 내신·수능 출제 포인트를 집중 공략합니다.' },
  { id: 55, cat: 'high', type: '참고서', subject: '영어', area: '문법/구문',
    title: 'Grammar Sharp 완성',
    author: 'YBM 편집부', price: 15000, originalPrice: 17000, badge: '',
    img: '',
    publisher: 'YBM', date: '2022.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '고등 영문법의 완성편. 수능 영어 문법 문제를 완벽 마스터합니다.' },

  // ── 고등 · Reading Sharp ──
  { id: 56, cat: 'high', type: '참고서', subject: '영어', area: '독해',
    title: 'Reading Sharp Level 1',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: '',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '수능 영어 독해의 기초! 다양한 지문 유형과 독해 전략으로 실력을 단계적으로 향상.' },
  { id: 57, cat: 'high', type: '참고서', subject: '영어', area: '독해',
    title: 'Reading Sharp Level 2',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'new',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000210734209.jpg',
    publisher: 'YBM', date: '2023.06.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000210734209',
    desc: '수능 독해 고난도 유형 완벽 공략! 실전 감각을 극대화하는 고급 독해 교재.' },

  // ── 고등 · Booster VOCA ──
  { id: 58, cat: 'high', type: '참고서', subject: '영어', area: '어휘',
    title: 'Booster VOCA 수능편',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'best',
    img: 'images/booster-voca-suneung.jpg',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=285076978',
    desc: '수능 빈출 어휘 완벽 정리! 최신 수능·모의고사 기출 어휘를 체계적으로 학습.' },
  { id: 59, cat: 'high', type: '참고서', subject: '영어', area: '어휘',
    title: 'Booster VOCA 어원편',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000214560404.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000214560404',
    desc: '어원으로 단어를 정복! 어근·접두사·접미사를 활용해 어휘력을 폭발적으로 늘립니다.' },

  // ── 고등 · 수직상승 ──
  { id: 60, cat: 'high', type: '참고서', subject: '영어', area: '문법/구문',
    title: '수직상승 빈출구문',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450413.jpg',
    publisher: 'YBM', date: '2022.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450413',
    desc: '수능·내신 빈출 구문 집중 훈련! 핵심 구문을 완전히 내 것으로 만드는 구문 완성서.' },
  { id: 61, cat: 'high', type: '참고서', subject: '영어', area: '어법/어휘',
    title: '수직상승 빈출어법',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450414.jpg',
    publisher: 'YBM', date: '2022.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450414',
    desc: '수능·내신 빈출 어법 포인트 완벽 정리! 기출 문제로 어법 실력을 수직 상승시킵니다.' },

  // ── 교과서 · 초등 ──
  { id: 62, cat: 'elementary', type: '교과서', subject: '영어', area: '자습서',
    title: '초등학교 영어 3-1 자습서 & 평가문제집 (최희경)',
    author: 'YBM 편집부', price: 13000, originalPrice: 14000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450323.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450323',
    desc: 'YBM(최희경) 초등 영어 3학년 1학기 교과서를 완벽 분석한 자습서 & 평가문제집.' },
  { id: 63, cat: 'elementary', type: '교과서', subject: '영어', area: '평가문제집',
    title: '초등학교 영어 4-1 자습서 & 평가문제집 (최희경)',
    author: 'YBM 편집부', price: 13000, originalPrice: 14000, badge: 'best',
    img: 'images/elementary-english-4-1-choihyekyung.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450324',
    desc: 'YBM(최희경) 초등 영어 4학년 1학기 교과서 완벽 대비. 단원별 핵심 정리 및 평가 수록.' },
  { id: 64, cat: 'elementary', type: '교과서', subject: '영어', area: '평가문제집',
    title: '초등학교 영어 6-1 자습서 & 평가문제집 (김혜리)',
    author: 'YBM 편집부', price: 13000, originalPrice: 14000, badge: '',
    img: '',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: 'YBM(김혜리) 초등 영어 6학년 1학기 교과서 완벽 대비. 단원별 핵심 정리 및 평가 수록.' },

  // ── 교과서 · 중학 ──
  { id: 65, cat: 'middle', type: '교과서', subject: '영어', area: '자습서',
    title: '중학교 영어 1 자습서 & 평가문제집 (박준언)',
    author: 'YBM 편집부', price: 15000, originalPrice: 17000, badge: 'best',
    img: 'images/middle-english-1-workbook.png',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://www.yes24.com/Product/UsedShopHub/Hub/179615715',
    desc: 'YBM(박준언) 중학교 영어 1학년 교과서 완벽 분석. 내신 1등급을 위한 자습서 & 평가문제집.' },
  { id: 66, cat: 'middle', type: '교과서', subject: '영어', area: '평가문제집',
    title: '중학교 영어 2-2 평가문제집 (박준언)',
    author: 'YBM 편집부', price: 12000, originalPrice: 14000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450384.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450384',
    desc: 'YBM(박준언) 중학교 영어 2-2 교과서 기반 평가문제집. 단원별 핵심 문법·어휘·독해 총정리.' },
  { id: 67, cat: 'middle', type: '교과서', subject: '영어', area: '평가문제집',
    title: '중학교 영어 3-1 평가문제집 (박준언)',
    author: 'YBM 편집부', price: 12000, originalPrice: 14000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000000450431.jpg',
    publisher: 'YBM', date: '2024.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000000450431',
    desc: 'YBM(박준언) 중학교 영어 3-1 교과서 기반 평가문제집. 내신 시험 완벽 대비.' },

  // ── 교과서 · 고등 ──
  { id: 68, cat: 'high', type: '교과서', subject: '영어', area: '자습서',
    title: '고등학교 영어 자습서 (한상호)',
    author: 'YBM 편집부', price: 16000, originalPrice: 18000, badge: 'best',
    img: 'images/high-english-jaseupseol-hansangho.jpg',
    publisher: 'YBM', date: '2025.01.01',
    kyoboUrl: 'https://www.11st.co.kr/products/2288335715',
    desc: 'YBM(한상호) 고등 영어 교과서 완벽 분석. 본문 해석·문법·어휘·내신 대비 완전 수록.' },
  { id: 69, cat: 'high', type: '교과서', subject: '영어', area: '평가문제집',
    title: '고등학교 영어1 평가문제집 (한상호)',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: '',
    publisher: 'YBM', date: '2025.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: 'YBM(한상호) 고등 영어1 교과서 기반 평가문제집. 단원별 내신 기출 유형 집중 훈련.' },

  // ── ELT · 초등 ──
  { id: 70, cat: 'elementary', type: 'ELT', subject: '영어', area: '파닉스',
    title: 'Phonics Land 1',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'best',
    img: '',
    publisher: 'YBM', date: '2022.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '알파벳 인식부터 단모음까지! 체계적인 파닉스 1단계로 영어 읽기의 기초를 완성합니다.' },
  { id: 71, cat: 'elementary', type: 'ELT', subject: '영어', area: '파닉스',
    title: 'Phonics Land 3',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/S000003878322.jpg',
    publisher: 'YBM', date: '2022.03.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/detail/S000003878322',
    desc: '장모음·이중자음 집중 학습! 다양한 파닉스 패턴으로 영어 읽기 유창성을 키웁니다.' },
  { id: 72, cat: 'elementary', type: 'ELT', subject: '영어', area: '독해',
    title: 'Easy Link Starter 1',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: 'new',
    img: '',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '픽션·논픽션 균형 잡힌 지문으로 초등 영어 독해의 첫걸음을 시작합니다.' },
  { id: 73, cat: 'elementary', type: 'ELT', subject: '영어', area: '독해',
    title: 'Reading Farm Level 1',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: '',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '다양한 소재의 흥미로운 지문으로 읽기 능력과 배경 지식을 동시에 키웁니다.' },
  { id: 74, cat: 'middle', type: 'ELT', subject: '영어', area: '독해',
    title: 'Reading Farm Level 3',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: '',
    img: '',
    publisher: 'YBM', date: '2023.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '중학 수준의 심화 지문과 독해 전략으로 영어 독해 실력을 한 단계 끌어올립니다.' },
  { id: 75, cat: 'elementary', type: 'ELT', subject: '영어', area: '어휘',
    title: 'Smart Phonics 1',
    author: 'YBM 편집부', price: 12000, originalPrice: 14000, badge: 'best',
    img: '',
    publisher: 'YBM', date: '2022.01.01',
    kyoboUrl: 'https://product.kyobobook.co.kr/',
    desc: '스마트하게 파닉스 완성! 재미있는 활동과 노래로 영어 읽기·쓰기 기초를 다집니다.' },
];

// 도서 카드 HTML 생성
function renderBookCard(book) {
  const info = CAT_INFO[book.cat];
  const thumbContent = book.img
    ? `<img src="${book.img}" alt="${book.title}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`
    : `<div class="book-thumb-placeholder">${info.emoji}<small>${book.type}</small></div>`;

  return `
    <div class="book-card" data-id="${book.id}" onclick="location.href='book-detail.html?id=${book.id}'">
      <div class="book-thumb">
        ${thumbContent}
      </div>
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-list-meta">
          <span>${book.author}</span>
          <span>${book.publisher || 'YBM 교육출판'}</span>
          ${book.date ? `<span>${book.date}</span>` : ''}
        </div>
        <div class="book-mat-icon-row">
          <span class="mat-icon-item mp3">🎧<span>MP3</span></span>
          <span class="mat-icon-item errata">📋<span>정오표</span></span>
          <span class="mat-icon-item answer">🎯<span>정답&해설</span></span>
        </div>
      </div>
    </div>
  `;
}

// 목록형 카드 HTML 생성
function renderListCard(book) {
  const info = CAT_INFO[book.cat];
  const isWished = Wish.has(book.id);
  const imgContent = book.img
    ? `<img src="${book.img}" alt="${book.title}">`
    : `<div class="book-list-cover-placeholder">${info.emoji}<small>${book.type}</small></div>`;

  const tagsHtml = [book.type, info.label, book.subject, book.area]
    .filter(Boolean).map(t => `<span class="detail-tag">${t}</span>`).join('');

  const matHtml = `
    <div class="book-mat-icon-row">
      <span class="mat-icon-item mp3">🎧<span>MP3</span></span>
      <span class="mat-icon-item errata">📋<span>정오표</span></span>
      <span class="mat-icon-item answer">🎯<span>정답&해설</span></span>
    </div>`;

  return `
    <div class="book-list-card" onclick="location.href='book-detail.html?id=${book.id}'">
      <div class="book-list-cover">${imgContent}</div>
      <div class="book-list-body">
        <div class="detail-tags">${tagsHtml}</div>
        <div class="book-list-title">${book.title}</div>
        <div class="book-list-meta">
          <span>${book.author}</span>
          <span>${book.publisher || 'YBM 교육출판'}</span>
          ${book.date ? `<span>${book.date}</span>` : ''}
        </div>
        ${book.desc ? `<div class="book-list-desc">${book.desc}</div>` : ''}
        ${matHtml}
      </div>
    </div>
  `;
}

function addToCart(id) {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    document.getElementById('_cartLoginOv')?.remove();
    const ov = document.createElement('div');
    ov.id = '_cartLoginOv';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:36px 32px;max-width:320px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.18);">
        <div style="font-size:36px;margin-bottom:12px;">🛒</div>
        <div style="font-size:16px;font-weight:800;color:#1a2e44;margin-bottom:8px;">로그인이 필요합니다</div>
        <div style="font-size:13px;color:#888;margin-bottom:24px;line-height:1.7;">로그인 후 교재를<br>구매하실 수 있습니다.</div>
        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('_cartLoginOv').remove()"
            style="flex:1;padding:12px;border:1.5px solid #ddd;border-radius:8px;background:#fff;font-size:14px;font-weight:700;cursor:pointer;color:#555;">닫기</button>
          <button onclick="
              localStorage.setItem('redirectAfterLogin', location.href);
              location.href='login.html';"
            style="flex:1;padding:12px;border:none;border-radius:8px;background:#dc2626;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">로그인 바로가기</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    return;
  }
  const book = BOOKS.find(b => b.id === id);
  if (book) Cart.add(book);
}

// 바로구매: 로그인 시 장바구니 담고 결제 화면으로 이동, 비로그인 시 로그인 후 결제화면으로 복귀
function buyNow(id) {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    // 로그인 후 결제 화면으로 바로 진입하도록 예약
    localStorage.setItem('pendingBuyId', String(id));
    localStorage.setItem('redirectAfterLogin', 'checkout.html');
    document.getElementById('_cartLoginOv')?.remove();
    const ov = document.createElement('div');
    ov.id = '_cartLoginOv';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:36px 32px;max-width:320px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.18);">
        <div style="font-size:36px;margin-bottom:12px;">🛒</div>
        <div style="font-size:16px;font-weight:800;color:#1a2e44;margin-bottom:8px;">로그인이 필요합니다</div>
        <div style="font-size:13px;color:#888;margin-bottom:24px;line-height:1.7;">로그인 후 교재를<br>구매하실 수 있습니다.</div>
        <div style="display:flex;gap:10px;">
          <button onclick="localStorage.removeItem('pendingBuyId');document.getElementById('_cartLoginOv').remove()"
            style="flex:1;padding:12px;border:1.5px solid #ddd;border-radius:8px;background:#fff;font-size:14px;font-weight:700;cursor:pointer;color:#555;">닫기</button>
          <button onclick="location.href='login.html';"
            style="flex:1;padding:12px;border:none;border-radius:8px;background:#dc2626;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">로그인 바로가기</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) { localStorage.removeItem('pendingBuyId'); ov.remove(); } });
    return;
  }
  const book = BOOKS.find(b => b.id === id);
  if (book) {
    Cart.add(book);
    location.href = 'checkout.html';
  }
}

// 교보문고 구매 페이지로 이동 (kyoboUrl 지정 시 해당 상품 페이지, 아니면 검색 결과)
function goKyobo(id) {
  const book = BOOKS.find(b => b.id === id);
  if (!book) return;
  const url = book.kyoboUrl
    ? book.kyoboUrl
    : 'https://search.kyobobook.co.kr/search?keyword=' + encodeURIComponent(book.title);
  window.open(url, '_blank');
}

// toggleWish는 Wishlist 블록 위에 정의됨

// 페이지 로드 시 공통 초기화
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();

  // ── 전체 카테고리 메가메뉴 (GNB hover 동일 내용) ──
  const gnbAll = document.querySelector('.gnb-all');
  const gnbBar = document.querySelector('.gnb-bar');
  if (gnbAll && gnbBar) {
    const mega = document.createElement('div');
    mega.className = 'mega-menu';
    const inner = document.createElement('div');
    inner.className = 'mega-menu-inner';

    // 카테고리별 아이콘·색상 매핑
    const COL_META = {
      '초등': { icon: '🎒', color: '#2e7d32', topBg: '#e8f5e9' },
      '중학': { icon: '📚', color: '#1565c0', topBg: '#e3f2fd' },
      '고등': { icon: '🎓', color: '#6a1b9a', topBg: '#f3e5f5' },
      '자료실': { icon: '📂', color: '#e65100', topBg: '#fff3e0' },
      '이벤트': { icon: '🎁', color: '#c62828', topBg: '#ffebee' },
    };

    document.querySelectorAll('.gnb-item').forEach(item => {
      const gnbLink = item.querySelector('.gnb-link');
      const dropBody = item.querySelector('.dropdown-body');
      if (!gnbLink || !dropBody) return;
      const label = gnbLink.textContent.trim();
      const meta = COL_META[label] || { icon: '📌', color: '#333', topBg: '#f5f5f5' };

      const col = document.createElement('div');
      col.className = 'mega-col';
      col.style.borderTop = `4px solid ${meta.color}`;

      const title = document.createElement('div');
      title.className = 'mega-col-title';
      title.style.borderBottomColor = meta.color;
      title.innerHTML = `<span style="font-size:20px">${meta.icon}</span><a href="${gnbLink.href}" style="color:${meta.color}">${label}</a>`;
      col.appendChild(title);
      col.appendChild(dropBody.cloneNode(true));
      inner.appendChild(col);
    });

    // 하단 배너
    const footer = document.createElement('div');
    footer.className = 'mega-footer';
    footer.innerHTML = `
      <a href="books.html?sort=best" class="mega-footer-link">🏆 베스트셀러</a>
      <a href="books.html?badge=new" class="mega-footer-link">✨ 신간 교재</a>
      <a href="resources.html?tab=daily" class="mega-footer-link">📖 데일리 외국어</a>
      <a href="events.html" class="mega-footer-link">🎉 이벤트</a>
    `;
    mega.appendChild(inner);
    mega.appendChild(footer);
    gnbBar.style.position = 'relative';
    gnbBar.appendChild(mega);

    const closeMega = () => { mega.classList.remove('open'); document.body.style.overflow = ''; };
    let megaTimer;

    // 마우스오버 시 열기
    gnbAll.addEventListener('mouseenter', () => {
      clearTimeout(megaTimer);
      mega.classList.add('open');
    });
    // gnbAll에서 마우스 나가면 타이머 시작 (메가메뉴로 이동하면 유지)
    gnbAll.addEventListener('mouseleave', () => {
      megaTimer = setTimeout(closeMega, 180);
    });
    // 메가메뉴 안으로 들어오면 타이머 취소
    mega.addEventListener('mouseenter', () => {
      clearTimeout(megaTimer);
    });
    // 메가메뉴에서 마우스 나가면 닫기
    mega.addEventListener('mouseleave', () => {
      megaTimer = setTimeout(closeMega, 180);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMega(); });

    // 모바일: ☰ 클릭으로 메가메뉴 토글
    gnbAll.addEventListener('click', () => {
      if (window.innerWidth > 768) return;
      const isOpen = mega.classList.contains('open');
      mega.classList.toggle('open');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
    // 모바일: 메가메뉴 외부 탭 시 닫기
    document.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 768) return;
      if (mega.classList.contains('open') && !mega.contains(e.target) && !gnbAll.contains(e.target)) {
        mega.classList.remove('open');
        document.body.style.overflow = '';
      }
    }, {passive: true});

    // 모바일: span.gnb-link(초등·중학·고등)는 <a>가 아니라 클릭 무반응
    // → data-cat 값으로 books.html로 직접 이동
    document.querySelectorAll('.gnb-item').forEach(item => {
      const link = item.querySelector('.gnb-link');
      if (!link || link.tagName === 'A') return; // 이미 <a>면 스킵
      const cat = item.dataset.cat;
      if (!cat) return;
      link.style.cursor = 'pointer';
      link.addEventListener('click', () => {
        if (window.innerWidth > 768) return;
        location.href = `books.html?cat=${cat}`;
      });
    });
  }

  // (구버전 메가메뉴 코드 — 삭제 예정 자리표시자)
  if (false) {
    const mega = null;
    const inner = `
      <div class="mega-menu-inner">
        <div>
          <div class="mega-col-title">🎒 <a href="books.html?cat=elementary">초등</a></div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">참고서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=elementary&type=참고서&subject=영어">영어</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">교과서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=elementary&type=교과서">교과서</a>
              <a href="books.html?cat=elementary&type=평가문제집">평가문제집/자습서</a>
              <a href="books.html?cat=elementary&type=지도서">지도서</a>
              <a href="books.html?cat=elementary&type=자료집">자료집</a>
              <a href="books.html?cat=elementary&type=교구재">교구재</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">ELT · 일반</div>
            <div class="mega-col-links">
              <a href="books.html?cat=elementary&type=ELT">ELT</a>
              <a href="books.html?cat=elementary&type=일반">일반·수험서</a>
            </div>
          </div>
        </div>
        <div>
          <div class="mega-col-title">📚 <a href="books.html?cat=middle">중학</a></div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">참고서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=middle&type=참고서&subject=영어">영어</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">교과서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=middle&type=교과서">교과서</a>
              <a href="books.html?cat=middle&type=평가문제집">평가문제집/자습서</a>
              <a href="books.html?cat=middle&type=지도서">지도서</a>
              <a href="books.html?cat=middle&type=자료집">자료집</a>
              <a href="books.html?cat=middle&type=교구재">교구재</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">ELT · 일반</div>
            <div class="mega-col-links">
              <a href="books.html?cat=middle&type=ELT">ELT</a>
              <a href="books.html?cat=middle&type=일반">일반·수험서</a>
            </div>
          </div>
        </div>
        <div>
          <div class="mega-col-title">🎓 <a href="books.html?cat=high">고등</a></div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">참고서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=high&type=참고서&subject=영어">영어</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">교과서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=high&type=교과서">교과서</a>
              <a href="books.html?cat=high&type=평가문제집">평가문제집/자습서</a>
              <a href="books.html?cat=high&type=지도서">지도서</a>
              <a href="books.html?cat=high&type=자료집">자료집</a>
              <a href="books.html?cat=high&type=교구재">교구재</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">ELT · 일반</div>
            <div class="mega-col-links">
              <a href="books.html?cat=high&type=ELT">ELT</a>
              <a href="books.html?cat=high&type=일반">일반·수험서</a>
            </div>
          </div>
        </div>
        <div>
          <div class="mega-col-title">📂 <a href="resources.html">자료실</a></div>
          <div class="mega-col-links" style="margin-bottom:16px;">
            <a href="resources.html?tab=materials">교재 자료실</a>
            <a href="resources.html?tab=daily">데일리 외국어</a>
            <a href="resources.html?tab=howto">교재 활용법</a>
            <a href="resources.html?tab=curation">큐레이션</a>
          </div>
          <div class="mega-col-title" style="margin-top:8px;">🎁 <a href="events.html">이벤트</a></div>
          <div class="mega-col-links">
            <a href="events.html?status=ongoing">진행중인 이벤트</a>
            <a href="events.html?status=ended">종료된 이벤트</a>
          </div>
        </div>
      </div>`;
  }

  // ── 외부 사이트 스크린샷 미리 생성 요청 (WordPress mshots 캐시) ──
  ['https://ytutor.ybmbooks.com','https://www.ybmbooks.com'].forEach(u => {
    const prefetch = new Image();
    prefetch.src = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(u)}?w=1366`;
  });

  // ── 외부 링크 버튼 → 로컬 이미지 모달 ──
  document.querySelectorAll('.btn-orange').forEach(btn => {
    if (btn.textContent.includes('Y튜터')) {
      btn.setAttribute('href', 'https://my-first-app-drab-one.vercel.app');
      btn.setAttribute('target', '_blank');
      btn.style.cursor = 'pointer';
    }
  });
  document.querySelectorAll('.btn-blue').forEach(btn => {
    if (btn.textContent.includes('YBM북스')) {
      btn.removeAttribute('href');
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openImageModal('images/ybmbooks-preview.png', 'YBM북스-성인');
      }, true);
    }
  });

  // ── 로그인 상태에 따른 상단 헤더 토글 ──
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // 로그인 버튼: 비로그인 시 표시, 로그인 시 '로그아웃' 버튼으로 전환
  document.querySelectorAll('.topbar-login-btn').forEach(btn => {
    if (loggedIn) {
      btn.textContent = '로그아웃';
      btn.href = '#';
      btn.style.cursor = 'pointer';
      btn.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('booksam_user');
        localStorage.removeItem('redirectAfterLogin');
        localStorage.removeItem('pendingMaterialId');
        localStorage.removeItem('pendingMaterialTitle');
        localStorage.removeItem('pendingWishId');
        localStorage.removeItem('booksam_wish');
        location.reload();
      };
    } else {
      btn.textContent = '로그인';
      btn.href = 'login.html';
      btn.onclick = () => { localStorage.setItem('redirectAfterLogin', location.href); };
    }
  });

  // 회원가입 버튼: 비로그인 시만 표시
  document.querySelectorAll('.topbar-join-btn').forEach(btn => {
    btn.style.display = loggedIn ? 'none' : '';
  });

  // 마이페이지 버튼: 로그인 시만 표시
  document.querySelectorAll('.topbar-mypage-btn').forEach(btn => {
    btn.style.display = loggedIn ? '' : 'none';
  });

  // ── 모바일 필터 사이드바 토글 ──
  const filterSidebar = document.querySelector('.filter-sidebar');
  if (filterSidebar) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'filter-mobile-toggle';
    toggleBtn.innerHTML = '⚙ 필터 보기 <span>▼</span>';
    filterSidebar.parentNode.insertBefore(toggleBtn, filterSidebar);
    toggleBtn.addEventListener('click', () => {
      const isOpen = filterSidebar.classList.toggle('mobile-open');
      toggleBtn.innerHTML = isOpen
        ? '⚙ 필터 접기 <span>▲</span>'
        : '⚙ 필터 보기 <span>▼</span>';
    });
  }

  // GNB 현재 페이지 활성화
  const page = location.pathname.split('/').pop() || 'index.html';
  const cat = getParam('cat') || '';
  document.querySelectorAll('.gnb-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkCat = link.closest('.gnb-item')?.dataset.cat;
    if (
      (href.includes(page) && page !== 'index.html') ||
      (cat && linkCat === cat)
    ) {
      link.classList.add('active');
    }
  });

  // FAQ 토글
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.faq-item').classList.toggle('open');
    });
  });

  // Detail tabs
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  // Curation tabs
  document.querySelectorAll('.curation-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.curation-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      document.querySelectorAll('.curation-panel').forEach(p => {
        p.style.display = p.id === target ? '' : 'none';
      });
    });
  });

  // ── GNB 검색 오버레이 ──
  const srchOverlay = document.createElement('div');
  srchOverlay.id = 'gnbSearchOverlay';
  srchOverlay.className = 'gnb-search-overlay';
  srchOverlay.innerHTML = `
    <div class="gnb-search-overlay-inner">
      <select class="gnb-srch-sel" id="gnbSrchCat">
        <option value="">카테고리 전체</option>
        <option value="elementary">초등</option>
        <option value="middle">중학</option>
        <option value="high">고등</option>
      </select>
      <input type="text" class="gnb-srch-inp" id="gnbSrchInput" placeholder="초등, 중등, 고등 교재명을 입력하세요">
      <button class="gnb-srch-go" onclick="doGnbSearch()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
      <button class="gnb-srch-close" onclick="closeGnbSearch()">✕</button>
    </div>`;
  gnbBar?.after(srchOverlay);

  document.getElementById('gnbSearchToggle')?.addEventListener('click', () => {
    const ov = document.getElementById('gnbSearchOverlay');
    if (!ov) return;
    const isOpen = ov.classList.toggle('open');
    if (isOpen) setTimeout(() => document.getElementById('gnbSrchInput')?.focus(), 80);
  });
  document.getElementById('gnbSrchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doGnbSearch();
  });

  // ── GNB 로그인 상태 동기화 (gnb-util-right) ──
  const gnbLoginLink = document.querySelector('.gnb-login-link');
  const gnbJoinLink  = document.querySelector('.gnb-join-link');
  if (gnbJoinLink)  gnbJoinLink.style.display  = loggedIn ? 'none' : '';
  if (gnbLoginLink) {
    if (loggedIn) {
      gnbLoginLink.textContent = '로그아웃';
      gnbLoginLink.removeAttribute('href');
      gnbLoginLink.style.cursor = 'pointer';
      gnbLoginLink.onclick = (e) => {
        e.preventDefault();
        ['isLoggedIn','booksam_user','redirectAfterLogin','pendingMaterialId',
         'pendingMaterialTitle','pendingWishId','booksam_wish'].forEach(k => localStorage.removeItem(k));
        location.reload();
      };
    } else {
      gnbLoginLink.addEventListener('click', () => {
        localStorage.setItem('redirectAfterLogin', location.href);
      });
    }
  }

  // ── 스크롤 시 hero-page gnb 배경 전환 ──
  if (document.body.classList.contains('hero-page')) {
    const gnbEl = document.querySelector('.gnb-bar');
    const onScroll = () => gnbEl?.classList.toggle('gnb-scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }
});

function closeGnbSearch() {
  document.getElementById('gnbSearchOverlay')?.classList.remove('open');
}
function doGnbSearch() {
  const q   = document.getElementById('gnbSrchInput')?.value;
  const cat = document.getElementById('gnbSrchCat')?.value;
  if (!q?.trim()) return;
  const params = new URLSearchParams({q, ...(cat && {cat})});
  location.href = `books.html?${params}`;
}

// ── 로컬 이미지 미리보기 모달 ──
// 사용법: images/ 폴더에 ytutor-preview.png / ybmbooks-preview.png 저장하면 자동 표시
function openImageModal(imgPath, title) {
  document.querySelector('.img-preview-overlay')?.remove();

  const ov = document.createElement('div');
  ov.className = 'img-preview-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:24px;';

  const box = document.createElement('div');
  box.style.cssText = 'background:white;border-radius:12px;overflow:hidden;max-width:900px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,.4);';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #eee;background:#f8f9fb;';
  header.innerHTML = `
    <span style="font-size:14px;font-weight:700;color:#1a2e44;">🖼 ${title}</span>
    <button onclick="this.closest('.img-preview-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;line-height:1;">✕</button>`;

  const body = document.createElement('div');
  body.style.cssText = 'min-height:300px;display:flex;align-items:center;justify-content:center;background:#1a2e44;';

  const img = document.createElement('img');
  img.src = imgPath;
  img.alt = title;
  img.style.cssText = 'max-width:100%;max-height:70vh;display:block;object-fit:contain;';
  img.onerror = () => {
    body.style.cssText = 'min-height:300px;display:flex;align-items:center;justify-content:center;background:#f8f9fb;flex-direction:column;gap:14px;padding:40px;text-align:center;';
    body.innerHTML = `
      <div style="font-size:48px;">🖼</div>
      <div style="font-weight:700;font-size:16px;color:#1a2e44;">${title} 이미지 없음</div>
      <div style="font-size:13px;color:#888;line-height:1.7;">
        아래 폴더에 이미지를 저장하면 자동으로 표시됩니다.<br>
        <code style="background:#e8eaf6;padding:4px 10px;border-radius:4px;font-size:12px;display:inline-block;margin-top:8px;">${imgPath}</code>
      </div>`;
  };

  body.appendChild(img);
  box.appendChild(header);
  box.appendChild(body);
  ov.appendChild(box);
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
  });
}

// 채널톡 플로팅 버튼 (모든 페이지 공통)
(function() {
  var btn = document.createElement('div');
  btn.id = 'ch-plugin-fake';
  btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2C7.373 2 2 7.149 2 13.5c0 2.97 1.14 5.676 3.008 7.718L3.5 25.5l5.02-1.64A11.93 11.93 0 0014 25c6.627 0 12-5.149 12-11.5S20.627 2 14 2z" fill="white"/><circle cx="9" cy="14" r="1.8" fill="#FF6D2D"/><circle cx="14" cy="14" r="1.8" fill="#FF6D2D"/><circle cx="19" cy="14" r="1.8" fill="#FF6D2D"/></svg>';
  btn.style.cssText = 'position:fixed;bottom:40px;right:40px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#FF7744 0%,#FF4E1A 100%);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(255,100,40,.45);z-index:9999;transition:transform .2s,box-shadow .2s;';
  btn.addEventListener('mouseenter', function(){ this.style.transform='scale(1.08)'; this.style.boxShadow='0 6px 28px rgba(255,100,40,.55)'; });
  btn.addEventListener('mouseleave', function(){ this.style.transform='scale(1)'; this.style.boxShadow='0 4px 20px rgba(255,100,40,.45)'; });
  btn.addEventListener('click', function(){
    var toast = document.getElementById('ch-toast');
    if (toast) { toast.remove(); return; }
    var t = document.createElement('div');
    t.id = 'ch-toast';
    t.textContent = '준비 중입니다.';
    t.style.cssText = 'position:fixed;bottom:92px;right:24px;background:#1a2e44;color:#fff;font-size:13px;font-weight:600;padding:10px 18px;border-radius:20px;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:9999;animation:chFadeIn .2s ease;pointer-events:none;font-family:Pretendard,"Noto Sans KR",sans-serif;';
    document.body.appendChild(t);
    setTimeout(function(){ if(t.parentNode) t.remove(); }, 2200);
  });
  var style = document.createElement('style');
  style.textContent = '@keyframes chFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(btn); });
  if (document.readyState !== 'loading') document.body.appendChild(btn);
})();

// 최근 본 교재 플로팅
(function () {
  var STORE_KEY = 'ybm_recent_books';
  var MAX = 5;

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveRecent(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }
  function recordBook(id) {
    if (!id) return;
    var book = (typeof BOOKS !== 'undefined') ? BOOKS.find(function(b){ return String(b.id) === String(id); }) : null;
    if (!book) return;
    var list = getRecent().filter(function(b){ return String(b.id) !== String(id); });
    list.unshift({ id: book.id, title: book.title, img: book.img });
    if (list.length > MAX) list = list.slice(0, MAX);
    saveRecent(list);
    refreshUI();
  }

  var params = new URLSearchParams(location.search);
  var currentId = params.get('id');
  if (currentId && location.pathname.indexOf('book-detail') !== -1) {
    document.addEventListener('DOMContentLoaded', function(){ recordBook(currentId); });
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest('[data-id]');
    if (card) recordBook(card.dataset.id);
  }, true);

  function injectStyle() {
    if (document.getElementById('rcnt-float-style')) return;
    var s = document.createElement('style');
    s.id = 'rcnt-float-style';
    s.textContent = [
      '#rcnt-float{position:fixed;bottom:108px;right:40px;z-index:9998;display:none;}',
      '#rcnt-float.visible{display:block;animation:rcntAppear .25s ease;}',
      '@keyframes rcntAppear{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}',
      '#rcnt-float-btn{width:56px;height:56px;border-radius:50%;overflow:hidden;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.22);border:2.5px solid #fff;background:#f0f4f8;transition:transform .2s,box-shadow .2s;}',
      '#rcnt-float-btn img{width:100%;height:100%;object-fit:cover;display:block;}',
      '#rcnt-float-btn:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,.28);}',
      '#rcnt-panel{position:fixed;bottom:176px;right:40px;width:220px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);z-index:9997;overflow:hidden;display:none;flex-direction:column;}',
      '#rcnt-panel.open{display:flex;animation:rcntSlide .18s ease;}',
      '@keyframes rcntSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
      '#rcnt-panel-head{padding:12px 14px 10px;font-size:12px;font-weight:700;color:#1a2e44;border-bottom:1px solid #eef0f3;font-family:Pretendard,"Noto Sans KR",sans-serif;display:flex;justify-content:space-between;align-items:center;}',
      '#rcnt-panel-head button{background:none;border:none;font-size:14px;cursor:pointer;color:#aaa;line-height:1;padding:0;}',
      '.rcnt-item{display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;transition:background .15s;text-decoration:none;}',
      '.rcnt-item:hover{background:#f5f7fb;}',
      '.rcnt-item-img{width:36px;height:46px;object-fit:cover;border-radius:4px;flex-shrink:0;border:1px solid #e8eaf0;}',
      '.rcnt-item-title{font-size:12px;font-weight:600;color:#1a2e44;line-height:1.4;font-family:Pretendard,"Noto Sans KR",sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}'
    ].join('');
    document.head.appendChild(s);
  }

  function refreshUI() {
    var list = getRecent();
    var wrap = document.getElementById('rcnt-float');
    var btn = document.getElementById('rcnt-float-btn');
    var panel = document.getElementById('rcnt-panel');
    if (!wrap || !btn || !panel) return;

    if (list.length === 0) {
      wrap.classList.remove('visible');
      panel.classList.remove('open');
      return;
    }

    btn.innerHTML = '<img src="' + list[0].img + '" alt="최근 본 교재">';
    wrap.classList.add('visible');

    panel.innerHTML = '<div id="rcnt-panel-head">최근 본 교재 <button id="rcnt-close">✕</button></div>'
      + list.map(function(b){
          return '<a class="rcnt-item" href="book-detail.html?id=' + b.id + '"><img class="rcnt-item-img" src="' + b.img + '" alt=""><span class="rcnt-item-title">' + b.title + '</span></a>';
        }).join('');

    document.getElementById('rcnt-close').addEventListener('click', function(e){
      e.stopPropagation();
      panel.classList.remove('open');
    });
  }

  function buildUI() {
    if (document.getElementById('rcnt-float')) return;
    injectStyle();

    var panel = document.createElement('div');
    panel.id = 'rcnt-panel';
    document.body.appendChild(panel);

    var wrap = document.createElement('div');
    wrap.id = 'rcnt-float';
    wrap.innerHTML = '<div id="rcnt-float-btn"></div>';
    document.body.appendChild(wrap);

    refreshUI();

    document.getElementById('rcnt-float-btn').addEventListener('click', function(e){
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target.id !== 'rcnt-float-btn' && !document.getElementById('rcnt-float-btn').contains(e.target)) {
        panel.classList.remove('open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
