// [검색(홈)] 맨 위 인사말(오늘 해 볼 단어), 숫자 줄(레벨·연속 학습·해 본 단어·최고 점수),
// 그리고 '나의 42칸'(단계별 6칸씩, 검색창으로 거르기)을 보여줘요. 칸을 누르면 단어 상세로 가요.

let searchStage = "전체"; // "전체" 또는 단계 번호

// 다음에 해 볼 단어: 지금 단계에서 아직 안 해 본 첫 단어 (다 했으면 null)
function nextWord() {
  const stage = currentStage();
  return stageWords(stage).find(function (w) { return !isTried(w.name); }) || null;
}

// 맨 위: 인사말 + 버튼 + 숫자 줄
function renderHome() {
  const info = levelInfo();
  const next = nextWord();
  const stage = currentStage();
  const total = APP_DATA.words.length;

  const title = next
    ? "오늘은 '" + esc(next.name) + "' 차례예요"
    : total + "개를 모두 해 봤어요";
  const sub = "단계 " + stage + " · " + stageWords(stage).length + "개 중 " + stageTriedCount(stage) + "개 해 봄 · " +
    (learnedToday() ? "오늘 학습함" : "오늘은 아직 학습 전");

  document.getElementById("home").innerHTML =
    '<div class="greeting">' +
    '<h1 class="title">' + title + '</h1>' +
    '<p class="subline">' + sub + '</p>' +
    '<div class="row">' +
    '<button class="primary" id="home-lab">직접 해보기</button>' +
    '<button class="secondary" id="home-quiz">뜻 맞히기</button>' +
    '</div></div>' +
    '<div class="stats">' +
    '<div class="stat"><small>레벨</small><b>' + info.level + '</b></div>' +
    '<div class="stat"><small>연속 학습</small><b>' + streakDays() + '<span> 일</span></b></div>' +
    '<div class="stat"><small>해 본 단어</small><b>' + info.tried + '<span> / ' + total + '</span></b></div>' +
    '<div class="stat"><small>뜻 맞히기 최고</small><b>' + progress.quizBest + '<span> 점</span></b></div>' +
    '</div>';

  document.getElementById("home-lab").addEventListener("click", function () {
    openLab(stage, next ? next.name : null);
  });
  document.getElementById("home-quiz").addEventListener("click", function () { startQuiz(stage); });
}

// 단어 칸 하나 (해 본 단어는 청록, 잠긴 단계는 흐리게)
function wordCellHTML(word) {
  const tried = isTried(word.name);
  const open = isStageOpen(word.stage);
  let state = "아직";
  if (tried) state = "해 봄";
  else if (!open) state = "";
  return '<button class="cell' + (tried ? " tried" : "") + (open ? "" : " locked") + '" data-name="' + esc(word.name) + '">' +
    '<strong>' + esc(word.name) + '</strong><small>' + state + '</small></button>';
}

function renderSearch() {
  renderHome();

  // 단계 버튼
  const chips = ["전체"].concat(stageList());
  const chipBox = document.getElementById("stage-chips");
  chipBox.innerHTML = chips.map(function (stage) {
    const label = stage === "전체" ? "전체" : "단계 " + stage;
    return '<button class="chip' + (String(stage) === String(searchStage) ? " active" : "") + '" data-stage="' + stage + '">' + label + '</button>';
  }).join("");
  chipBox.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      searchStage = chip.dataset.stage === "전체" ? "전체" : parseInt(chip.dataset.stage, 10);
      renderSearch();
    });
  });

  // 검색어(대표 단어·사전 표제어) + 단계로 거르기
  const keyword = document.getElementById("search").value.trim();
  const shown = APP_DATA.words.filter(function (word) {
    const okStage = searchStage === "전체" || word.stage === searchStage;
    const okKeyword = keyword === "" || (word.name + "," + word.headword).indexOf(keyword) !== -1;
    return okStage && okKeyword;
  });

  document.getElementById("search-count").textContent =
    (keyword || searchStage !== "전체") ? shown.length + "개 찾음" : triedCount() + " / " + APP_DATA.words.length + " 해 봄";

  const listBox = document.getElementById("word-list");
  if (shown.length === 0) {
    listBox.innerHTML = '<p class="empty">\'' + esc(keyword) + '\'(이)라는 단어는 42개 안에 없어요.</p>';
    return;
  }

  // 단계별로 묶어서 그리기
  listBox.innerHTML = stageList().map(function (stage) {
    const words = shown.filter(function (w) { return w.stage === stage; });
    if (words.length === 0) return "";
    return '<div class="stage-group">' +
      '<div class="stage-label"><b>단계 ' + stage + '</b><span class="num">' +
      (isStageOpen(stage) ? stageTriedCount(stage) + ' / ' + stageWords(stage).length : '잠김') + '</span></div>' +
      '<div class="cells">' + words.map(wordCellHTML).join("") + '</div></div>';
  }).join("");

  listBox.querySelectorAll(".cell").forEach(function (cell) {
    cell.addEventListener("click", function () { showDetail(cell.dataset.name); });
  });
}

// 글자를 칠 때마다 목록 다시 그리기
document.getElementById("search").addEventListener("input", renderSearch);
