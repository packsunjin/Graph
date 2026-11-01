// [게임 기록] 해 본 단어, 학습한 날짜, 뜻 맞히기 점수·랭킹을 이 기기(localStorage)에 저장해요.
// 단계·레벨·연속 학습·배지는 맞고 틀림이 아니라 "해 본 기록(참여)"으로 정해요.

const PROGRESS_KEY = "sueo42-progress";

// 저장 모양
// tried: { "괜찮다": { quiz: 2, lab: 1 } }  → 단어마다 뜻 맞히기 푼 횟수, 직접 해보기 횟수
// days: ["2026-11-01", ...]                 → 학습한 날짜
// quizBest: 이번 기기 최고 점수(한 판), quizTotal: 지금까지 모은 점수
// ranking: [{ name, score, stage, date }]   → 이름별 랭킹
let progress = loadProgress();

function emptyProgress() {
  return { tried: {}, days: [], quizBest: 0, quizTotal: 0, ranking: [] };
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (saved && saved.tried) return Object.assign(emptyProgress(), saved);
  } catch (error) {
    // 저장된 값이 망가졌으면 새로 시작
  }
  return emptyProgress();
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    // 저장 공간을 못 쓰는 브라우저(시크릿 모드 등)면 이번에만 기억해요.
  }
}

function resetProgress() {
  progress = emptyProgress();
  saveProgress();
}

// 오늘 날짜 "2026-11-01" (이 기기 시간 기준)
function dateString(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + m + "-" + d;
}

function todayString() {
  return dateString(new Date());
}

// ---- 해 본 기록 ----

// kind: "quiz"(뜻 맞히기를 풂) 또는 "lab"(직접 해보기를 시도함)
function markTried(name, kind) {
  const before = earnedBadges();
  if (!progress.tried[name]) progress.tried[name] = { quiz: 0, lab: 0 };
  progress.tried[name][kind]++;
  if (progress.days.indexOf(todayString()) === -1) progress.days.push(todayString());
  saveProgress();
  announceNewBadges(before);
  renderTopStatus();
}

function isTried(name) {
  return !!progress.tried[name];
}

function triedCount() {
  return APP_DATA.words.filter(function (w) { return isTried(w.name); }).length;
}

// 모든 단어의 횟수 합 (kind: "quiz" 또는 "lab")
function totalTries(kind) {
  let sum = 0;
  Object.keys(progress.tried).forEach(function (name) { sum += progress.tried[name][kind] || 0; });
  return sum;
}

// ---- 단계 ----

function stageTriedCount(stage) {
  return stageWords(stage).filter(function (w) { return isTried(w.name); }).length;
}

function isStageDone(stage) {
  const words = stageWords(stage);
  return words.length > 0 && stageTriedCount(stage) === words.length;
}

// 첫 단계는 늘 열려 있고, 앞 단계 단어를 다 해 보면 다음 단계가 열려요.
function isStageOpen(stage) {
  const list = stageList();
  const index = list.indexOf(stage);
  if (index <= 0) return true;
  return isStageDone(list[index - 1]);
}

// 지금 해 볼 단계 (열린 단계 중 아직 다 안 한 첫 단계)
function currentStage() {
  const list = stageList();
  const open = list.filter(isStageOpen);
  const notDone = open.filter(function (s) { return !isStageDone(s); });
  return notDone.length ? notDone[0] : open[open.length - 1];
}

// ---- 레벨: 해 본 단어 6개마다 1레벨 ----

function levelInfo() {
  const tried = triedCount();
  const step = CONFIG.WORDS_PER_STAGE;
  const level = Math.floor(tried / step) + 1;
  const maxLevel = Math.floor(APP_DATA.words.length / step) + 1;
  return {
    level: Math.min(level, maxLevel),
    tried: tried,
    inLevel: tried % step,          // 이번 레벨에서 해 본 수
    step: step,
    isMax: level >= maxLevel
  };
}

// ---- 연속 학습 ----

function learnedToday() {
  return progress.days.indexOf(todayString()) !== -1;
}

// 오늘(또는 어제)까지 며칠 연속으로 학습했는지
function streakDays() {
  const day = new Date();
  if (!learnedToday()) day.setDate(day.getDate() - 1); // 오늘 아직 안 했으면 어제부터 세기
  let count = 0;
  while (progress.days.indexOf(dateString(day)) !== -1) {
    count++;
    day.setDate(day.getDate() - 1);
  }
  return count;
}

// ---- 배지 (조건을 만족하면 자동으로 받아요) ----

const BADGES = [
  { id: "first", icon: "🌱", name: "첫 시도", how: "단어 1개 해 보기", check: function () { return triedCount() >= 1; } },
  { id: "lab", icon: "✋", name: "카메라 앞으로", how: "직접 해보기 1번 하기", check: function () { return totalTries("lab") >= 1; } },
  { id: "stage1", icon: "🥉", name: "단계 1 완료", how: "단계 1 단어 모두 해 보기", check: function () { return isStageDone(1); } },
  { id: "streak3", icon: "🔥", name: "3일 연속", how: "3일 연속 학습", check: function () { return streakDays() >= 3; } },
  { id: "half", icon: "🥈", name: "절반 왔다", how: "단어 21개 해 보기", check: function () { return triedCount() >= 21; } },
  { id: "quiz100", icon: "🎯", name: "뜻 맞히기 100점", how: "뜻 맞히기 점수 100점 모으기", check: function () { return progress.quizTotal >= 100; } },
  { id: "streak7", icon: "🌟", name: "7일 연속", how: "7일 연속 학습", check: function () { return streakDays() >= 7; } },
  { id: "all", icon: "🏆", name: "42개 다 해보기", how: "단어 42개 모두 해 보기", check: function () { return APP_DATA.words.length > 0 && triedCount() >= APP_DATA.words.length; } }
];

function earnedBadges() {
  return BADGES.filter(function (b) { return b.check(); }).map(function (b) { return b.id; });
}

// 새로 받은 배지가 있으면 알림
function announceNewBadges(before) {
  const names = [];
  earnedBadges().forEach(function (id) {
    if (before.indexOf(id) !== -1) return;
    const badge = BADGES.find(function (b) { return b.id === id; });
    names.push(badge.icon + " " + badge.name);
  });
  if (names.length) showToast("배지 받음: " + names.join(", "));
}

// ---- 뜻 맞히기 점수·랭킹 ----

// 한 판이 끝나면 불러요. 최고 점수가 바뀌었으면 true
function saveQuizRound(score) {
  const before = earnedBadges();
  progress.quizTotal += score;
  const isBest = score > progress.quizBest;
  if (isBest) progress.quizBest = score;
  saveProgress();
  announceNewBadges(before);
  return isBest;
}

function addRanking(name, score, stage) {
  progress.ranking.push({ name: name, score: score, stage: stage, date: todayString() });
  progress.ranking.sort(function (a, b) { return b.score - a.score; });
  progress.ranking = progress.ranking.slice(0, CONFIG.RANKING_SIZE);
  saveProgress();
}

function rankingHTML() {
  if (progress.ranking.length === 0) {
    return '<p class="empty small">아직 랭킹이 없어요. 한 판 끝내고 이름을 올려 보세요!</p>';
  }
  return '<ol class="ranking">' + progress.ranking.map(function (r, i) {
    const medal = ["🥇", "🥈", "🥉"][i] || (i + 1) + ".";
    return '<li><span class="medal">' + medal + '</span><b>' + esc(r.name) + '</b>' +
      '<small>단계 ' + esc(r.stage) + ' · ' + esc(r.date) + '</small><span class="pts">' + r.score + '점</span></li>';
  }).join("") + '</ol>';
}

// ---- 화면 맨 위 레벨·연속 학습 표시, 알림 ----

function renderTopStatus() {
  const box = document.getElementById("top-status");
  if (!box) return;
  box.innerHTML = 'Lv.' + levelInfo().level + ' <span class="sep">·</span> 🔥' + streakDays();
  box.classList.toggle("today", learnedToday());
}

let toastTimer = null;
function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
}
