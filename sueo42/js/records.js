// [내 기록] 레벨, 연속 학습, 배지, 단계별 진행, 뜻 맞히기 최고 점수·랭킹을 모아 보는 화면이에요.
// 레벨·배지는 맞고 틀림이 아니라 '해 본 기록(참여)'으로 정해요.

function renderRecords() {
  const info = levelInfo();
  const earned = earnedBadges();
  const levelText = info.isMax
    ? "42개를 모두 해 봤어요."
    : "다음 레벨까지 단어 " + (info.step - info.inLevel) + "개 더 해 보면 돼요.";

  const badges = BADGES.map(function (b) {
    const on = earned.indexOf(b.id) !== -1;
    return '<div class="badge-row"><span><b>' + esc(b.name) + '</b><small>' + esc(b.how) + '</small></span>' +
      '<span class="pill' + (on ? " on" : "") + '">' + (on ? "받음" : "아직") + '</span></div>';
  }).join("");

  const stages = stageList().map(function (stage) {
    const n = stageWords(stage).length;
    const t = stageTriedCount(stage);
    return '<div class="stage-line"><span>단계 ' + stage + '</span>' +
      '<div class="track"><i style="width:' + (t / n * 100) + '%"></i></div>' +
      '<small>' + (isStageOpen(stage) ? t + '/' + n : '잠김') + '</small></div>';
  }).join("");

  document.getElementById("records").innerHTML =
    '<p class="subline">' + levelText + ' 레벨·배지는 해 본 횟수와 날짜로만 정해요.</p>' +
    '<div class="stats">' +
    '<div class="stat"><small>레벨</small><b>' + info.level + '</b></div>' +
    '<div class="stat"><small>연속 학습</small><b>' + streakDays() + '<span> 일</span></b>' +
    '<small>' + (learnedToday() ? "오늘 학습함" : "오늘은 아직") + '</small></div>' +
    '<div class="stat"><small>해 본 단어</small><b>' + info.tried + '<span> / ' + APP_DATA.words.length + '</span></b></div>' +
    '<div class="stat"><small>해 본 횟수</small><b>' + (totalTries("quiz") + totalTries("lab")) + '<span> 번</span></b>' +
    '<small>뜻 맞히기 ' + totalTries("quiz") + ' · 직접 해보기 ' + totalTries("lab") + '</small></div>' +
    '</div>' +
    '<div class="detail-grid">' +
    '<div class="panel"><div class="panel-head"><h2>배지</h2><span class="muted">' + earned.length + ' / ' + BADGES.length + '</span></div>' +
    '<div class="badges">' + badges + '</div></div>' +
    '<div class="panel"><h2>단계별 진행</h2>' + stages + '</div>' +
    '</div>' +
    '<div class="panel"><div class="panel-head"><h2>뜻 맞히기 랭킹</h2>' +
    '<span class="muted">내 최고 ' + progress.quizBest + '점 · 모은 점수 ' + progress.quizTotal + '점</span></div>' +
    rankingHTML() +
    '<p class="source">친구끼리 한 기기에서 돌려 쓰는 랭킹이에요. 이 기기에만 저장돼요.</p></div>' +
    '<button class="text-button danger" id="reset-button">이 기기 기록 모두 지우기</button>';

  document.getElementById("reset-button").addEventListener("click", function () {
    if (!confirm("레벨·배지·랭킹 기록을 모두 지울까요?")) return;
    resetProgress();
    renderTopStatus();
    renderRecords();
  });
}
