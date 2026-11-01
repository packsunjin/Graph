// [검색] 검색창과 단계 버튼으로 42개 단어를 찾아보는 화면이에요. 카드를 누르면 단어 상세로 가요.

let searchStage = "전체"; // "전체" 또는 단계 번호

// 단어 카드 하나 (해 본 단어는 ✓ 표시)
function wordCardHTML(word) {
  return '<button class="word-card' + (isTried(word.name) ? " tried" : "") + '" data-name="' + esc(word.name) + '">' +
    '<span class="word-category">단계 ' + word.stage + (word.category ? ' · ' + esc(word.category) : '') + '</span>' +
    '<strong>' + esc(word.name) + '</strong>' +
    '<span class="card-foot">' + (hasVideo(word) ? '🎬 사전 영상' : '사전 영상 준비 중') +
    (isTried(word.name) ? ' <b class="check">✓ 해 봄</b>' : '') + '</span>' +
    '</button>';
}

// 홈 맨 위: 레벨·연속 학습 큰 카드 + 메뉴 타일
function renderHome() {
  const info = levelInfo();
  const stage = currentStage();
  const box = document.getElementById("home");
  box.innerHTML =
    '<div class="hero">' +
    '<div class="hero-top"><span>해 본 단어 ' + info.tried + ' / ' + APP_DATA.words.length + '</span>' +
    '<span class="hero-pill">🔥 ' + streakDays() + '일 연속' + (learnedToday() ? ' ✅' : '') + '</span></div>' +
    '<p class="hero-level">Lv.' + info.level + ' <small>지금 단계 ' + stage + '</small></p>' +
    '<div class="stage-bar"><i style="width:' + (info.isMax ? 100 : info.inLevel / info.step * 100) + '%"></i></div>' +
    '</div>' +
    '<div class="tiles">' +
    '<button class="tile" data-go="quiz"><i>🎯</i>뜻 맞히기</button>' +
    '<button class="tile" data-go="lab"><i>✋</i>직접 해보기</button>' +
    '<button class="tile" data-go="learn"><i>🗺️</i>단계</button>' +
    '<button class="tile" data-go="records"><i>🏅</i>내 기록</button>' +
    '</div>';

  box.querySelectorAll(".tile").forEach(function (tile) {
    tile.addEventListener("click", function () {
      const go = tile.dataset.go;
      if (go === "quiz") startQuiz(currentStage());
      else if (go === "lab") openLab(currentStage());
      else showScreen(go);
    });
  });
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
    "수어 " + APP_DATA.words.length + "개 중 " + shown.length + "개 · 해 본 단어 " + triedCount() + "개";

  const listBox = document.getElementById("word-list");
  if (shown.length === 0) {
    listBox.innerHTML = '<p class="empty">찾는 단어가 없어요.</p>';
    return;
  }
  listBox.innerHTML = shown.map(wordCardHTML).join("");
  listBox.querySelectorAll(".word-card").forEach(function (card) {
    card.addEventListener("click", function () { showDetail(card.dataset.name); });
  });
}

// 글자를 칠 때마다 목록 다시 그리기
document.getElementById("search").addEventListener("input", renderSearch);
