// 시안 3(트루 블랙) 기반, 화면 구조 자체가 다른 20개 (홈 + 직접 해보기 결과)
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out4');

const words = ['괜찮다','좋다','가다','안되다','보다','힘들다','알다','지하철','가능','모르다','내키다','잘하다','어지럽다','만족','반갑다','신중','맞다','잃어버리다','찾다','사용','없다','화장실','건너다','돈','시간','빨리','있다','지금','다시','필요','다르다','따뜻하다','버스','택시','기다리다','춥다','사다','받다','급하다','병원','천천히','학교'];
const DONE = 28, T = words[DONE], STREAK = 6, BEST = 80, LV = 5;
const cells = words.map((w, i) => ({ w, done: i < DONE, today: i === DONE, st: Math.floor(i / 6) + 1 }));
const stages = Array.from({ length: 7 }, (_, s) => cells.slice(s * 6, s * 6 + 6));
const sd = stages.map(st => st.filter(c => c.done).length);
console.assert(sd.reduce((a, b) => a + b, 0) === DONE);
const week = [{ d: '수', n: 3 }, { d: '목', n: 5 }, { d: '금', n: 0 }, { d: '토', n: 4 }, { d: '일', n: 6 }, { d: '월', n: 2 }, { d: '화', n: 4 }];
const WK = week.reduce((a, b) => a + b.n, 0);
const DESC = '오른 주먹의 5지 바닥을 1·2지의 손톱에 가볍게 대고 손등이 밖으로 향하게 하여 왼쪽 아래로 내리며 1·2지를 편다.';
const VIDEO = 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20200811/727508/MOV000246514_700X466.mp4#t=1.4';
const POSTER = 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20200811/727508/MOV000246514_215X161.jpg';
const SRC = '국립국어원 한국수어사전';
const R1 = '다시', R2 = '지금';
const ASK = "AI는 이 동작을 '① 다시'로 봤어요. 맞나요?";
const EST = 'AI가 추측한 가장 비슷해 보이는 동작';

const V = (cls = 'media') => `<div class="${cls}"><video src="${VIDEO}" poster="${POSTER}" muted playsinline preload="auto" aria-label="사전 영상: ${T}"></video></div>`;
const H = (cls = 'media hand') => `<div class="${cls}"><svg role="img" aria-label="내 손 좌표" viewBox="0 0 100 120" fill="none" stroke="var(--hue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M50 112 L50 76 M50 76 L31 60 L24 44 M50 76 L43 49 L41 28 M50 76 L56 46 L58 25 M50 76 L65 51 L71 35 M50 76 L72 70 L85 62"/><g fill="var(--hue)" stroke="none"><circle cx="24" cy="44" r="3.5"/><circle cx="41" cy="28" r="3.5"/><circle cx="58" cy="25" r="3.5"/><circle cx="71" cy="35" r="3.5"/><circle cx="85" cy="62" r="3.5"/><circle cx="50" cy="112" r="3.5"/></g></svg></div>`;
const ico = { home: '<path d="M3 10.5 12 4l9 6.5V20h-6v-6H9v6H3z"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>', learn: '<path d="M4 5h16v12H9l-5 4z"/>', cam: '<rect x="3" y="7" width="13" height="11" rx="2"/><path d="m16 11 5-3v9l-5-3"/>', rec: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM12 14v4M8 21h8"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', back: '<path d="m15 6-6 6 6 6"/>', chev: '<path d="m9 6 6 6-6 6"/>', check: '<path d="m5 12 5 5 9-10"/>', play: '<path d="M8 5v14l11-7z"/>' };
const I = (n, s = 20) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ico[n]}</svg>`;
const NAV = a => `<nav class="nav" aria-label="주 메뉴">${[['home', '홈'], ['search', '검색'], ['learn', '학습하기'], ['cam', '직접 해보기'], ['rec', '내 기록']].map(([k, l]) => `<a href="#${k}" ${k === a ? 'aria-current="page"' : ''}>${I(k)}<span>${l}</span></a>`).join('')}</nav>`;
const TOP = (t) => t ? `<header class="bar"><button class="ib" aria-label="뒤로">${I('back', 22)}</button><span class="bt">${t}</span><span style="width:44px"></span></header>` : `<header class="bar"><span class="logo"><i>42</i>수어42</span><button class="ib" aria-label="메뉴">${I('menu', 22)}</button></header>`;
const B3 = (cls = '') => `<div class="b3 ${cls}"><button class="p inv">맞아요</button><button class="p dim">다른 동작이었어요</button><button class="p dim full">다시 해보기</button></div>`;
const PAIR = (cls = '') => `<div class="pair ${cls}"><figure>${V('media tall')}<figcaption>사전 영상 · ${SRC}</figcaption></figure><figure>${H('media tall hand')}<figcaption>내 동작 · 손 좌표</figcaption></figure></div>`;
const g42 = (h = 26, words = false) => words ? `<div class="gw">${cells.map(c => `<span class="${c.done ? 'd' : c.today ? 't' : ''}">${c.w}</span>`).join('')}</div>` : `<div class="g">${cells.map(c => `<i class="${c.done ? 'd' : c.today ? 't' : ''}" style="height:${h}px"></i>`).join('')}</div>`;

// ------------------------------------------------------------------ 20 designs
const D = [];
const add = (name, idea, home, result) => D.push({ name, idea, home, result });

add('오늘 카드', '오늘의 수어 영상 카드가 맨 위, 기록과 42칸은 아래',
  () => `${TOP()}<main><h1>오늘의 수어</h1><section class="card">${V()}<p class="word">${T}</p><p class="m">${DESC}</p><p class="f">사전 영상 · ${SRC}</p><div class="row"><button class="p inv">직접 해보기</button><button class="p dim">뜻 맞히기</button></div></section>
<section class="kp"><div><span class="f">해 본 단어</span><b>${DONE}<small> /42</small></b></div><div><span class="f">연속 학습</span><b>${STREAK}<small> 일</small></b></div><div><span class="f">퀴즈 최고</span><b>${BEST}<small> 점</small></b></div></section>
<section class="card"><div class="hd"><h2>나의 42칸</h2><span class="f">${DONE}/42</span></div>${g42()}</section></main>${NAV('home')}`,
  () => `${TOP('직접 해보기')}<main><h1>'${T}'를 따라 했어요</h1><section class="card"><h2>${EST}</h2><p class="f">(AI 추정)</p><div class="rk on">① ${R1}<span class="f">영상 보는 중</span></div><div class="rk">② ${R2}<span class="f">영상 보기</span></div></section>${PAIR()}<section class="card"><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('단어 42칸 판', '홈 전체가 단어가 적힌 42칸 판. 오늘 칸을 누르면 시작',
  () => `${TOP()}<main><div class="hd"><h1>나의 42칸</h1><span class="m">${DONE} / 42</span></div>${g42(0, true)}<p class="f">채운 칸 = 해 본 단어 · 테두리 = 오늘</p><button class="p inv full">'${T}' 직접 해보기</button></main>${NAV('home')}`,
  () => `${TOP('직접 해보기')}<main><h1>'${T}' 결과</h1>${PAIR('big')}<div><p class="m">${EST} <span class="f">(AI 추정)</span></p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div></div></main><section class="sheet"><p class="ask">${ASK}</p>${B3()}</section>${NAV('cam')}`);

add('세로 영상 피드', '숏폼처럼 화면 가득 사전 영상, 오른쪽에 세로 버튼',
  () => `<div class="feed">${V('media fill')}<header class="bar over"><span class="logo"><i>42</i>수어42</span><span class="tag">연속 ${STREAK}일</span></header><div class="side"><button class="round hot" aria-label="직접 해보기">${I('cam', 22)}<span>해보기</span></button><button class="round" aria-label="뜻 맞히기">${I('learn', 22)}<span>퀴즈</span></button><button class="round" aria-label="다음 단어">${I('chev', 22)}<span>다음</span></button></div>
<div class="capt"><h1 class="word xl">${T}</h1><p>${DESC}</p><p class="f">사전 영상 · ${SRC} · 단계 ${LV}</p></div></div>${NAV('home')}`,
  () => `<div class="feed">${H('media fill hand')}<header class="bar over"><button class="ib" aria-label="뒤로">${I('back', 22)}</button><span class="tag">내 동작 · 손 좌표</span></header>${V('pip')}<p class="f pipcap">사전 영상 · ${SRC}</p>
<section class="float"><h1 class="ask">${ASK}</h1><p class="f">${EST}: ① ${R1} ② ${R2} (AI 추정)</p>${B3()}</section></div>${NAV('cam')}`);

add('여정 지도', '단어 하나가 정거장 하나인 세로 길. 지금 위치가 크게',
  () => { let n = ''; const xs = [70, 150, 230, 290, 230, 150, 70, 110]; const list = cells.slice(24, 32); list.forEach((c, i) => { n += `<div class="node ${c.done ? 'd' : c.today ? 't' : ''}" style="left:${xs[i]}px;top:${560 - i * 66}px">${c.today ? T : c.done ? I('check', 18) : ''}</div>`; });
    return `${TOP()}<main><h1>단계 ${LV} 길</h1><p class="m">정거장 6개 중 ${sd[4]}개 지남 · 다음은 '${T}'</p></main><div class="map"><svg class="road" viewBox="0 0 390 640" aria-hidden="true"><path d="M105 600 C 180 580, 220 540, 265 500 S 320 420, 265 370 S 120 300, 105 240 S 160 120, 140 70" stroke="#2a2a2a" stroke-width="14" fill="none" stroke-linecap="round"/></svg>${n}<button class="p inv mapbtn">'${T}' 직접 해보기</button></div>${NAV('home')}`; },
  () => `${TOP('정거장 · ' + T)}<main><h1>'${T}' 정거장</h1>${PAIR()}</main><section class="sheet"><p class="f">${EST} (AI 추정)</p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div><p class="ask">${ASK}</p>${B3()}</section>${NAV('cam')}`);

add('이번 달 잔디', '날마다 해 본 횟수를 칸 색 진하기로. 연속 학습이 주인공',
  () => { const days = Array.from({ length: 30 }, (_, i) => { const n = i < 24 ? [2, 0, 3, 4, 1, 0, 5, 2, 3, 0, 4, 1][i % 12] : i < 30 ? [0, 4, 6, 2, 4, 0][i - 24] : 0; return n; }); days[29] = 0;
    return `${TOP()}<main><h1>연속 ${STREAK}일</h1><p class="m">11월 · 이번 달 ${days.reduce((a, b) => a + b, 0)}번 해 봤어요</p><section class="card"><div class="cal">${['월', '화', '수', '목', '금', '토', '일'].map(d => `<span class="f">${d}</span>`).join('')}${days.map((n, i) => `<i style="opacity:${n ? 0.25 + n * 0.125 : 1};background:${n ? 'var(--hue)' : 'var(--raised)'}" ${i === 2 ? 'class="now"' : ''}></i>`).join('')}</div><p class="f">진할수록 그날 많이 해 봄 · 테두리 = 오늘</p></section>
<section class="card row2">${V('media sq')}<div><span class="f">오늘의 수어</span><p class="word">${T}</p><button class="p inv">직접 해보기</button></div></section></main>${NAV('home')}`; },
  () => `${TOP('직접 해보기')}<main><h1>오늘 기록에 추가됐어요</h1><p class="m">11월 3일 · '${T}' · 오늘 5번째</p>${PAIR()}<section class="card"><p class="f">${EST} (AI 추정)</p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('진행 링', '42칸을 큰 원 하나로. 원 안에 오늘 단어',
  () => { const segs = cells.map((c, i) => { const a0 = (i / 42) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 0.78) / 42) * 2 * Math.PI - Math.PI / 2, r = 130; const p = (a) => `${160 + r * Math.cos(a)} ${160 + r * Math.sin(a)}`; return `<path d="M${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}" stroke="${c.done ? 'var(--hue)' : c.today ? '#fff' : '#2a2a2a'}" stroke-width="22" fill="none"/>`; }).join('');
    return `${TOP()}<main><h1 class="center">42개 중 ${DONE}개</h1><div class="ring"><svg viewBox="0 0 320 320" role="img" aria-label="42칸 중 ${DONE}칸 해 봄">${segs}</svg><div class="ringin"><span class="f">오늘</span><p class="word xl">${T}</p><span class="f">단계 ${LV}</span></div></div><div class="row"><button class="p inv">직접 해보기</button><button class="p dim">뜻 맞히기</button></div><p class="f center">흰 칸 = 오늘 · 연속 학습 ${STREAK}일 · 퀴즈 최고 ${BEST}점</p></main>${NAV('home')}`; },
  () => `${TOP('직접 해보기')}<main><h1 class="center">${ASK}</h1><p class="f center">${EST} · ① ${R1} ② ${R2} (AI 추정)</p>${PAIR()}${B3()}</main>${NAV('cam')}`);

add('단계 탭', '위에 단계 1~7 탭, 아래 그 단계 단어 6개 목록',
  () => `${TOP()}<main><h1>단계 ${LV}</h1><div class="tabs">${stages.map((st, s) => `<button class="tab ${s === 4 ? 'on' : ''} ${sd[s] === 6 ? 'd' : ''}">${s + 1}</button>`).join('')}</div><section class="card list">${stages[4].map(c => `<div class="li"><span class="mk ${c.done ? 'd' : c.today ? 't' : ''}"></span><span class="grow">${c.w}</span>${c.today ? '<button class="p inv sm">해보기</button>' : `<span class="f">${c.done ? '해 봄' : '아직'}</span>`}</div>`).join('')}</section><section class="card row2">${V('media sq')}<div><span class="f">오늘 차례</span><p class="word">${T}</p><p class="f">사전 영상 · ${SRC}</p></div></section></main>${NAV('learn')}`,
  () => `${TOP('단계 ' + LV)}<main><div class="tabs">${stages.map((st, s) => `<button class="tab ${s === 4 ? 'on' : ''} ${sd[s] === 6 ? 'd' : ''}">${s + 1}</button>`).join('')}</div><h1>'${T}' 결과</h1>${PAIR()}<section class="card"><p class="f">${EST} (AI 추정)</p><div class="rk on">① ${R1}</div><div class="rk">② ${R2}</div><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('플래시카드', '카드 한 장을 넘기며 배우기. 뒤에 카드 더미',
  () => `${TOP()}<main><div class="hd"><h1>오늘의 카드</h1><span class="m">${DONE + 1} / 42</span></div><div class="stack"><div class="cardx b2"></div><div class="cardx b1"></div><div class="cardx">${V('media')}<p class="word xl">${T}</p><p class="m">${DESC}</p><p class="f">사전 영상 · ${SRC}</p></div></div><div class="swipe"><button class="round" aria-label="이전 카드">${I('back', 22)}</button><button class="p inv">직접 해보기</button><button class="round" aria-label="다음 카드">${I('chev', 22)}</button></div></main>${NAV('learn')}`,
  () => `${TOP('카드 뒷면')}<main><h1>'${T}' 카드 뒷면</h1><section class="cardx flat"><p class="f">${EST} (AI 추정)</p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div>${PAIR()}<p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('대화형 안내', '안내와 메신저처럼 대화. 메뉴가 답장 버튼',
  () => `${TOP()}<main class="chat"><h1 class="sr">수어42 안내</h1><p class="bub">어제 '${words[27]}'까지 해 봤어요. 오늘은 이 수어 어때요?</p><div class="bub">${V('media')}<p class="word">${T}</p><p class="f">사전 영상 · ${SRC}</p></div><p class="bub me">따라 해볼래</p><p class="bub">좋아요. 연속 학습 ${STREAK}일째예요.</p></main><div class="quick"><button class="p inv">직접 해보기</button><button class="p dim">뜻 맞히기</button><button class="p dim">단어 검색</button></div>${NAV('home')}`,
  () => `${TOP('수어42 안내')}<main class="chat"><h1 class="sr">직접 해보기 결과</h1><p class="bub me">(3초 동안 기록함)</p><div class="bub">${EST}이에요. <b>① ${R1} ② ${R2}</b> <span class="f">(AI 추정)</span>${PAIR('small')}</div><p class="bub">${ASK}</p></main><div class="quick">${B3('row3')}</div>${NAV('cam')}`);

add('큰 글자', '단어를 화면 절반 크기 글자로. 꾸밈 없이 글자가 주인공',
  () => `${TOP()}<main><p class="f">오늘의 수어 · 단계 ${LV}</p><h1 class="giant">${T}</h1><p class="m">${DESC}</p>${V()}<p class="f">사전 영상 · ${SRC}</p><div class="row"><button class="p inv">직접 해보기</button><button class="p dim">뜻 맞히기</button></div><p class="m">${DONE}/42 해 봄 · 연속 ${STREAK}일</p></main>${NAV('home')}`,
  () => `${TOP('직접 해보기')}<main><p class="f">${EST} (AI 추정)</p><h1 class="giant sm">① ${R1}</h1><p class="m">② ${R2}</p>${PAIR()}<p class="ask">${ASK}</p>${B3()}</main>${NAV('cam')}`);

add('위아래 분할', '위 절반은 영상, 아래 절반은 고정된 조작판',
  () => `<div class="split">${V('media top')}<section class="panel"><span class="logo"><i>42</i>수어42</span><h1 class="word xl">${T}</h1><p class="m">${DESC}</p><p class="f">사전 영상 · ${SRC} · ${DONE}/42 해 봄</p><div class="row"><button class="p inv">직접 해보기</button><button class="p dim">뜻 맞히기</button></div></section></div>${NAV('home')}`,
  () => `<div class="split"><div class="halves">${V('media')}${H('media hand')}</div><section class="panel"><p class="f">위 왼쪽 사전 영상(${SRC}) · 오른쪽 내 동작</p><p class="f">${EST} (AI 추정)</p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div><h1 class="ask">${ASK}</h1>${B3()}</section></div>${NAV('cam')}`);

add('오늘의 타임라인', '오늘 한 일을 시간순으로. 다음 할 일이 맨 아래',
  () => `${TOP()}<main><h1>오늘</h1><p class="m">11월 3일 · 4번 해 봄</p><ol class="tl"><li><span class="f">08:12</span><p>'${words[24]}' 직접 해보기</p></li><li><span class="f">08:15</span><p>'${words[25]}' 직접 해보기</p></li><li><span class="f">12:40</span><p>뜻 맞히기 한 판 · 60점</p></li><li><span class="f">12:44</span><p>'${words[26]}', '${words[27]}' 직접 해보기</p></li><li class="next"><span class="f">다음</span><div class="card row2">${V('media sq')}<div><p class="word">${T}</p><button class="p inv">직접 해보기</button></div></div></li></ol></main>${NAV('home')}`,
  () => `${TOP('직접 해보기')}<main><h1>타임라인에 추가할까요?</h1><ol class="tl"><li><span class="f">12:44</span><p>'${words[27]}' 직접 해보기</p></li><li class="next"><span class="f">지금</span><div class="card"><p class="f">${EST} (AI 추정): ① ${R1} ② ${R2}</p>${PAIR()}<p class="ask">${ASK}</p>${B3()}</div></li></ol></main>${NAV('cam')}`);

add('가로 캐러셀', '단계를 옆으로 넘기는 큰 카드 줄',
  () => `${TOP()}<main><h1>단계를 골라요</h1><div class="car">${stages.slice(3, 6).map((st, j) => { const s = j + 3; return `<section class="slide ${s === 4 ? 'on' : ''}"><p class="f">단계 ${s + 1} · ${sd[s]}/6</p><p class="word">${st.map(c => c.w).slice(0, 3).join(' ')}</p><p class="m">${st.map(c => c.w).slice(3).join(' ')}</p><div class="dots">${st.map(c => `<i class="${c.done ? 'd' : c.today ? 't' : ''}"></i>`).join('')}</div>${s === 4 ? `<button class="p inv full">'${T}' 해보기</button>` : ''}</section>`; }).join('')}</div><section class="card row2">${V('media sq')}<div><span class="f">오늘 차례</span><p class="word">${T}</p><p class="f">사전 영상 · ${SRC}</p></div></section></main>${NAV('learn')}`,
  () => `${TOP('직접 해보기')}<main><h1>${EST}</h1><p class="f">(AI 추정) · 옆으로 넘겨 비교</p><div class="car"><section class="slide on"><p class="word">① ${R1}</p>${PAIR('small')}</section><section class="slide"><p class="word">② ${R2}</p><p class="m">사전 영상 보기</p></section></div><p class="ask">${ASK}</p>${B3()}</main>${NAV('cam')}`);

add('오늘 할 일 3개', '체크리스트. 끝내면 줄이 그어짐',
  () => `${TOP()}<main><h1>오늘 할 일</h1><p class="m">3개 중 1개 끝 · 연속 ${STREAK}일</p><section class="card list"><div class="li done"><span class="cb d">${I('check', 16)}</span><span class="grow">뜻 맞히기 한 판</span><span class="f">60점</span></div><div class="li"><span class="cb"></span><span class="grow">'${T}' 직접 해보기</span><button class="p inv sm">시작</button></div><div class="li"><span class="cb"></span><span class="grow">단계 ${LV} 남은 단어 '${words[29]}'</span><span class="f">아직</span></div></section><section class="card">${V()}<p class="word">${T}</p><p class="f">사전 영상 · ${SRC}</p></section></main>${NAV('home')}`,
  () => `${TOP('직접 해보기')}<main><h1>할 일을 체크할까요?</h1><section class="card list"><div class="li"><span class="cb t"></span><span class="grow">'${T}' 직접 해보기</span></div></section>${PAIR()}<section class="card"><p class="f">${EST} (AI 추정): ① ${R1} ② ${R2}</p><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('벤토 타일', '크기가 다른 타일에 오늘·기록·42칸을 한 화면',
  () => `${TOP()}<main><h1>안녕, 민지</h1><div class="bento"><section class="tile w2 row2">${V('media sq')}<div><span class="f">오늘의 수어</span><p class="word">${T}</p><button class="p inv sm">직접 해보기</button></div></section><section class="tile"><span class="f">연속 학습</span><b class="big">${STREAK}<small>일</small></b></section><section class="tile"><span class="f">해 본 단어</span><b class="big">${DONE}<small>/42</small></b></section><section class="tile w2"><div class="hd"><h2>나의 42칸</h2><span class="f">퀴즈 최고 ${BEST}점</span></div>${g42(18)}</section></div></main>${NAV('home')}`,
  () => `${TOP('직접 해보기')}<main><h1>'${T}' 결과</h1><div class="bento"><section class="tile">${V('media tall')}<p class="f">사전 영상 · ${SRC}</p></section><section class="tile">${H('media tall hand')}<p class="f">내 동작</p></section><section class="tile w2"><p class="f">${EST} (AI 추정)</p><div class="rk on">① ${R1}</div><div class="rk">② ${R2}</div></section><section class="tile w2"><p class="ask">${ASK}</p>${B3()}</section></div></main>${NAV('cam')}`);

add('한 가지만', '홈에 단어 하나와 버튼 하나뿐. 나머지는 메뉴 안',
  () => `${TOP()}<main class="mono1"><h1 class="word xl center">${T}</h1>${V()}<p class="f center">사전 영상 · ${SRC}</p><button class="p inv full lg">직접 해보기</button><p class="m center">${DONE}/42 · 연속 ${STREAK}일</p></main>${NAV('home')}`,
  () => `${TOP('')}<main class="mono1"><h1 class="ask center">${ASK}</h1>${B3()}<details open class="card"><summary>근거 보기 · ${EST} (AI 추정)</summary><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div>${PAIR()}</details></main>${NAV('cam')}`);

add('검색 먼저', '큰 검색창이 맨 위. 최근 본 단어와 오늘 단어',
  () => `${TOP()}<main><h1>어떤 수어를 찾아요?</h1><label class="search">${I('search', 20)}<input placeholder="단어 검색 (예: 병원)" aria-label="단어 검색"></label><div class="hd"><h2>최근 본 단어</h2></div><div class="chips wrap">${words.slice(24, 28).map(w => `<span class="chip">${w}</span>`).join('')}</div><section class="card row2">${V('media sq')}<div><span class="f">오늘 차례</span><p class="word">${T}</p><button class="p inv sm">직접 해보기</button></div></section><div class="hd"><h2>단계 ${LV} 단어</h2><span class="f">${sd[4]}/6</span></div><div class="chips wrap">${stages[4].map(c => `<span class="chip ${c.done ? 'on' : ''}">${c.w}</span>`).join('')}</div></main>${NAV('search')}`,
  () => `${TOP('직접 해보기')}<main><h1>'${T}' 결과</h1><label class="search">${I('search', 20)}<input placeholder="다른 동작이었으면 여기서 찾기" aria-label="실제로 한 동작 검색"></label>${PAIR()}<section class="card"><p class="f">${EST} (AI 추정)</p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('퀴즈 랭킹', '홈에 뜻 맞히기 랭킹(퀴즈에만 점수). 직접 해보기는 기록만',
  () => `${TOP()}<main><h1>이번 주 뜻 맞히기</h1><section class="card list">${[['1', '서연', 120], ['2', '민지 (나)', BEST], ['3', '도윤', 70]].map(([r, n, s]) => `<div class="li ${n.includes('나') ? 'me' : ''}"><span class="rkn">${r}</span><span class="grow">${n}</span><b>${s}점</b></div>`).join('')}</section><button class="p dim full">뜻 맞히기 한 판</button><section class="card row2">${V('media sq')}<div><span class="f">직접 해보기 · 점수 없음</span><p class="word">${T}</p><button class="p inv sm">해보기</button></div></section></main>${NAV('learn')}`,
  () => `${TOP('직접 해보기')}<main><h1>'${T}' 결과</h1><p class="m">직접 해보기는 점수를 매기지 않아요</p>${PAIR()}<section class="card"><p class="f">${EST} (AI 추정)</p><div class="rk on">① ${R1}</div><div class="rk">② ${R2}</div><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('카메라가 홈', '앱을 열면 바로 카메라 뷰. 따라 할 단어가 위에',
  () => `<div class="feed cam">${H('media fill hand')}<header class="bar over"><span class="logo"><i>42</i>수어42</span><span class="tag">${DONE}/42</span></header>${V('pip')}<div class="capt"><p class="f">따라 할 단어 · 단계 ${LV}</p><h1 class="word xl">${T}</h1><p class="f">작은 창: 사전 영상 · ${SRC}</p></div><button class="shutter" aria-label="3초 기록 시작"></button></div>${NAV('cam')}`,
  () => `<div class="feed cam">${H('media fill hand')}<header class="bar over"><button class="ib" aria-label="뒤로">${I('back', 22)}</button><span class="tag">방금 3초</span></header>${V('pip pt')}<section class="float"><p class="f">${EST} (AI 추정)</p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div><h1 class="ask">${ASK}</h1>${B3()}</section></div>${NAV('cam')}`);

add('사전형 목록', '42개를 단계별 목록으로. 각 줄에 해 봄 표시',
  () => `${TOP()}<main><h1>수어 42개</h1><div class="idx">${stages.slice(4, 6).map((st, j) => `<h2 class="sh">단계 ${j + 5} <span class="f">${sd[j + 4]}/6</span></h2>${st.map(c => `<div class="li"><span class="mk ${c.done ? 'd' : c.today ? 't' : ''}"></span><span class="grow ${c.today ? 'b' : ''}">${c.w}</span>${c.today ? '<button class="p inv sm">해보기</button>' : `<span class="f">${c.done ? '해 봄' : ''}</span>`}${I('chev', 18)}</div>`).join('')}`).join('')}</div></main>${NAV('search')}`,
  () => `${TOP(T)}<main><h1>'${T}' 사전 항목</h1>${V()}<p class="m">${DESC}</p><p class="f">${SRC}</p><section class="card"><h2>방금 내 동작</h2><p class="f">${EST} (AI 추정): ① ${R1} ② ${R2}</p>${H('media wide hand')}<p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('주간 막대', '지난 7일 해 본 횟수 막대가 맨 위. 오늘 막대만 색',
  () => { const mx = Math.max(...week.map(x => x.n)); return `${TOP()}<main><h1>이번 주 ${WK}번</h1><section class="card"><div class="bars">${week.map((x, i) => `<div><span class="f">${x.n}</span><i style="height:${x.n ? x.n / mx * 110 : 2}px" class="${i === 6 ? 'now' : ''}"></i><span class="f ${i === 6 ? 'w' : ''}">${i === 6 ? '오늘' : x.d}</span></div>`).join('')}</div></section><section class="kp"><div><span class="f">연속 학습</span><b>${STREAK}<small> 일</small></b></div><div><span class="f">해 본 단어</span><b>${DONE}<small> /42</small></b></div><div><span class="f">퀴즈 최고</span><b>${BEST}<small> 점</small></b></div></section><section class="card row2">${V('media sq')}<div><span class="f">오늘의 수어</span><p class="word">${T}</p><button class="p inv sm">직접 해보기</button></div></section></main>${NAV('rec')}`; },
  () => `${TOP('직접 해보기')}<main><h1>오늘 막대가 1 올라가요</h1><p class="m">'${T}' 기록 · 오늘 5번째</p>${PAIR()}<section class="card"><p class="f">${EST} (AI 추정)</p><div class="chips"><span class="chip on">① ${R1}</span><span class="chip">② ${R2}</span></div><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

add('비교 슬라이더', '결과에서 사전 영상과 내 동작을 한 화면에 겹쳐 비교',
  () => `${TOP()}<main><h1>오늘의 수어</h1><section class="card"><div class="cmp">${V('media cmpv')}<div class="cmph">${H('media hand cmpin')}</div><span class="knob"></span></div><p class="f">왼쪽 사전 영상 · ${SRC} / 오른쪽 내 동작이 들어갈 자리</p><p class="word">${T}</p><button class="p inv full">직접 해보기</button></section><section class="kp"><div><span class="f">해 본 단어</span><b>${DONE}<small> /42</small></b></div><div><span class="f">연속 학습</span><b>${STREAK}<small> 일</small></b></div><div><span class="f">퀴즈 최고</span><b>${BEST}<small> 점</small></b></div></section></main>${NAV('home')}`,
  () => `${TOP('직접 해보기')}<main><h1>겹쳐서 비교해 보세요</h1><div class="cmp big">${V('media cmpv')}<div class="cmph">${H('media hand cmpin')}</div><span class="knob"></span></div><p class="f">가운데 막대를 밀면 사전 영상(${SRC})과 내 동작이 바뀌어요</p><section class="card"><p class="f">${EST} (AI 추정): ① ${R1} ② ${R2}</p><p class="ask">${ASK}</p>${B3()}</section></main>${NAV('cam')}`);

const CSS = `:root{--ground:#0c0d0f;--surface:#15171a;--raised:#2a2c30;--hue:#c6f24e;--muted:#b4b4b4}
*{box-sizing:border-box;margin:0;padding:0}button,input{font:inherit;color:inherit;border:0;background:none}button{cursor:pointer}
body{background:var(--ground);color:#fff;font:400 15px/1.5 "Inter","Pretendard",sans-serif;padding-bottom:84px;min-height:100vh}
header,main{max-width:480px;margin-left:auto;margin-right:auto}
.bar{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 16px}.bt{font-weight:600}
.bar.over{position:absolute;top:0;left:0;right:0;z-index:3}
.logo{font-weight:600;font-size:16px;display:flex;gap:8px;align-items:center}.logo i{width:24px;height:24px;border-radius:7px;background:var(--hue);color:#000;font-style:normal;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center}
.ib{width:44px;height:44px;border-radius:999px;display:flex;align-items:center;justify-content:center}
main{padding:4px 16px 16px;display:grid;gap:14px}
h1{font-size:24px;font-weight:600;letter-spacing:-.01em;line-height:1.3}h2{font-size:16px;font-weight:600}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.center{text-align:center}.m{color:var(--muted)}.f{color:var(--muted);font-size:13px}.w{color:#fff;font-weight:600}.b{font-weight:600}.grow{flex:1}
.word{font-size:28px;font-weight:600;letter-spacing:-.02em;line-height:1.15}.word.xl{font-size:44px}
.giant{font-size:96px;font-weight:600;letter-spacing:-.05em;line-height:.95;margin-top:4px}.giant.sm{font-size:64px}
.card{background:var(--surface);border-radius:20px;padding:18px;display:grid;gap:10px}
.media{border-radius:14px;overflow:hidden;aspect-ratio:700/466;background:#000;position:relative}.media video{display:block;width:100%;height:100%;object-fit:cover}
.media.tall{aspect-ratio:3/4}.media.sq{aspect-ratio:1;width:120px;flex:none}.media.wide{aspect-ratio:16/9}
.hand{display:flex;align-items:center;justify-content:center}.hand svg{width:58%;height:auto;max-height:86%}
.row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.row2{display:flex!important;gap:14px;align-items:center}.row2>div{display:grid;gap:6px;flex:1}
.p{height:48px;border-radius:999px;padding:0 18px;font-weight:600;font-size:15px}.p.sm{height:44px;padding:0 16px;font-size:14px}.p.lg{height:56px;font-size:17px}.full{width:100%}
.inv{background:#fff;color:#000}.dim{background:var(--raised);color:#fff}
.b3{display:grid;grid-template-columns:1fr 1fr;gap:8px}.b3 .full{grid-column:span 2}.b3.row3{grid-template-columns:auto 1fr auto;width:100%}.b3.row3 .full{grid-column:auto}
.kp{display:grid;grid-template-columns:repeat(3,1fr);background:var(--surface);border-radius:20px;padding:14px 0}.kp div{padding:0 14px}.kp div+div{border-left:1px solid #26282c}.kp b{display:block;font-size:24px;font-weight:500}.kp small{font-size:13px;color:var(--muted);font-weight:400}
.hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.g{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.g i{border-radius:7px;background:var(--raised)}.g i.d{background:var(--hue)}.g i.t{background:transparent;box-shadow:inset 0 0 0 2px #fff}
.gw{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.gw span{height:42px;border-radius:12px;background:var(--surface);color:var(--muted);display:flex;align-items:center;justify-content:center;font-size:15px}.gw span.d{background:var(--hue);color:#000;font-weight:600}.gw span.t{color:#fff;box-shadow:inset 0 0 0 2px #fff;font-weight:600}
.rk{display:flex;justify-content:space-between;align-items:center;height:52px;padding:0 16px;border-radius:12px;background:var(--raised);font-size:16px}.rk.on{box-shadow:inset 3px 0 0 var(--hue)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pair figure{display:grid;gap:6px}figcaption{font-size:13px;color:var(--muted)}.pair.big .media{aspect-ratio:9/15}.pair.small .media{aspect-ratio:1}.pair.small figcaption{display:none}
.ask{font-size:20px;font-weight:600;line-height:1.4}
.chips{display:flex;gap:8px;flex-wrap:nowrap}.chips.wrap{flex-wrap:wrap}.chip{min-height:44px;padding:0 16px;border-radius:999px;background:var(--raised);display:inline-flex;align-items:center;font-weight:600;font-size:15px}.chip.on{background:var(--hue);color:#000}
.sheet{position:fixed;left:0;right:0;bottom:68px;background:var(--surface);border-radius:22px 22px 0 0;padding:18px 16px;display:grid;gap:10px;max-width:480px;margin:0 auto;z-index:4}
.feed{position:relative;height:calc(100vh - 68px);min-height:776px;overflow:hidden}.media.fill{position:absolute;inset:0;border-radius:0;aspect-ratio:auto;height:100%}
.feed.cam .media.fill{background:#000}
.tag{font-size:13px;background:rgba(21,23,26,.85);padding:6px 12px;border-radius:999px}
.side{position:absolute;right:12px;bottom:190px;display:grid;gap:14px;z-index:2}.round{width:60px;height:60px;border-radius:50%;background:rgba(42,44,48,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;gap:2px}.round.hot{background:#fff;color:#000}
.capt{position:absolute;left:0;right:0;bottom:0;padding:80px 90px 22px 16px;background:linear-gradient(transparent,rgba(0,0,0,.85));z-index:1}.capt p{color:#ddd;font-size:14px}
.feed.cam .capt{top:56px;bottom:auto;padding:12px 16px;background:none}
.pip{position:absolute;right:14px;top:70px;width:36%;aspect-ratio:3/4;border-radius:14px;overflow:hidden;box-shadow:0 0 0 2px #fff;z-index:2}.pip video{width:100%;height:100%;object-fit:cover;display:block}.pipcap{position:absolute;right:14px;top:264px;z-index:2}
.feed .hand svg{width:46%;margin-top:150px}
.pip.pt{top:70px!important;bottom:auto!important}
.feed.cam .pip{top:auto;bottom:120px}
.float{position:absolute;left:12px;right:12px;bottom:12px;background:rgba(21,23,26,.96);border-radius:22px;padding:16px;display:grid;gap:10px;z-index:3}
.shutter{position:absolute;left:50%;bottom:24px;width:76px;height:76px;margin-left:-38px;border-radius:50%;background:#fff;box-shadow:0 0 0 6px rgba(255,255,255,.25);z-index:3}
.map{position:relative;height:660px;max-width:480px;margin:0 auto}.road{position:absolute;inset:0;width:100%;height:640px}
.node{position:absolute;width:56px;height:56px;margin-left:-28px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:var(--muted)}.node.d{background:var(--hue);color:#000}.node.t{width:92px;height:92px;margin-left:-46px;background:#fff;color:#000;font-size:18px;margin-top:-18px}
.mapbtn{position:absolute;left:16px;right:16px;bottom:0}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center}.cal i{aspect-ratio:1;border-radius:8px}.cal i.now{box-shadow:inset 0 0 0 2px #fff}
.ring{position:relative;width:300px;height:300px;margin:0 auto}.ring svg{width:100%;height:100%}.ringin{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tabs{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.tab{height:44px;border-radius:12px;background:var(--surface);color:var(--muted);font-weight:600}.tab.d{color:var(--hue)}.tab.on{background:#fff;color:#000}
.list{gap:0;padding:4px 18px}.li{display:flex;align-items:center;gap:12px;min-height:56px;font-size:16px}.li+.li{border-top:1px solid #222428}.li.done .grow{text-decoration:line-through;color:var(--muted)}.li.me{color:var(--hue)}
.mk{width:14px;height:14px;border-radius:50%;background:var(--raised);flex:none}.mk.d{background:var(--hue)}.mk.t{box-shadow:inset 0 0 0 2px #fff;background:none}
.cb{width:24px;height:24px;border-radius:7px;box-shadow:inset 0 0 0 2px #444;display:flex;align-items:center;justify-content:center;flex:none}.cb.d{background:var(--hue);color:#000;box-shadow:none}.cb.t{box-shadow:inset 0 0 0 2px #fff}
.rkn{width:24px;color:var(--muted);font-variant-numeric:tabular-nums}
.stack{position:relative;height:600px}.cardx{position:absolute;inset:0;background:var(--surface);border-radius:26px;padding:18px;display:grid;gap:8px;align-content:start}.cardx.b2{transform:translateY(-18px) scale(.9);background:#1d1f23}.cardx.b1{transform:translateY(-9px) scale(.95);background:#191b1e}.cardx.flat{position:static}
.swipe{display:grid;grid-template-columns:60px 1fr 60px;gap:12px;align-items:center}.swipe .round{width:56px;height:56px}
.chat{gap:10px}.bub{background:var(--surface);border-radius:18px 18px 18px 6px;padding:12px 14px;max-width:86%;display:grid;gap:6px}.bub.me{justify-self:end;background:#fff;color:#000;border-radius:18px 18px 6px 18px}
.quick{position:fixed;left:0;right:0;bottom:68px;padding:12px 16px;background:var(--ground);display:flex;gap:8px;max-width:480px;margin:0 auto}.quick .p{flex:1;padding:0 10px;font-size:14px}
.split{display:grid;grid-template-rows:auto 1fr;min-height:calc(100vh - 68px)}.split .media.top{border-radius:0;aspect-ratio:4/3}.panel{background:var(--surface);border-radius:24px 24px 0 0;margin-top:-20px;padding:20px 16px;display:grid;gap:10px;align-content:start;position:relative}
.halves{display:grid;grid-template-columns:1fr 1fr}.halves .media{border-radius:0;aspect-ratio:3/4}
.tl{list-style:none;display:grid;gap:0;border-left:2px solid var(--raised);margin-left:6px}.tl li{position:relative;padding:0 0 18px 18px}.tl li::before{content:"";position:absolute;left:-7px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--hue)}.tl li.next::before{background:#fff}.tl li p{font-size:16px}
.car{display:grid;grid-auto-flow:column;grid-auto-columns:78%;gap:10px;overflow:hidden;margin-right:-16px}.slide{background:var(--surface);border-radius:22px;padding:18px;display:grid;gap:10px;align-content:start}.slide.on{box-shadow:inset 0 0 0 2px var(--hue)}
.dots{display:flex;gap:6px}.dots i{width:14px;height:14px;border-radius:50%;background:var(--raised)}.dots i.d{background:var(--hue)}.dots i.t{box-shadow:inset 0 0 0 2px #fff;background:none}
.bento{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tile{background:var(--surface);border-radius:20px;padding:16px;display:grid;gap:8px;align-content:start}.tile.w2{grid-column:span 2}.big{font-size:36px;font-weight:500;line-height:1}.big small{font-size:14px;color:var(--muted)}
.mono1{min-height:calc(100vh - 140px);align-content:center}
details summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}
.search{display:flex;align-items:center;gap:10px;height:56px;border-radius:16px;background:var(--surface);padding:0 16px;color:var(--muted)}.search input{flex:1;font-size:16px;color:#fff}.search input::placeholder{color:var(--muted)}
.idx .sh{display:flex;justify-content:space-between;margin:10px 0 2px;font-size:15px}.idx .li{border-top:1px solid #222428}
.bars{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;align-items:end;height:160px}.bars div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%}.bars i{width:100%;border-radius:6px 6px 0 0;background:#3a3c40}.bars i.now{background:var(--hue)}
.cmp{position:relative;aspect-ratio:4/3;border-radius:16px;overflow:hidden}.cmp.big{aspect-ratio:3/4}.cmp .media{position:absolute;inset:0;aspect-ratio:auto;border-radius:0}.cmph{position:absolute;inset:0 0 0 50%;overflow:hidden;background:#000}.cmph .media{left:-100%;width:200%}
.knob{position:absolute;left:50%;top:0;bottom:0;width:4px;margin-left:-2px;background:#fff}.knob::after{content:"";position:absolute;top:50%;left:50%;width:36px;height:36px;margin:-18px;border-radius:50%;background:#fff}
.nav{position:fixed;left:0;right:0;bottom:0;height:68px;background:var(--ground);display:flex;z-index:5;border-top:1px solid #1c1e21}.nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:11px;color:#bbb;text-decoration:none}.nav a[aria-current]{color:#fff;font-weight:600}`;

const page = (title, body) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${CSS}</style></head><body>${body}</body></html>`;

const KEEP = D.filter(d => !['여정 지도', '주간 막대'].includes(d.name));
const list = KEEP.map((d, i) => {
  const id = String(i + 1).padStart(2, '0');
  const dir = path.join(OUT, id); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'home.html'), page(`수어42 홈 · ${d.name}`, d.home()));
  fs.writeFileSync(path.join(dir, 'result.html'), page(`수어42 직접 해보기 결과 · ${d.name}`, d.result()));
  return { id, name: d.name, idea: d.idea };
});
fs.writeFileSync(path.join(OUT, 'list.json'), JSON.stringify(list, null, 1));
console.log(list.length, 'designs');
