// [내 기록] 레벨, 연속 학습, 배지, 단계별 진행, 뜻 맞히기 최고 점수·랭킹을 모아 보는 화면이에요.
// 레벨·배지는 맞고 틀림이 아니라 '해 본 기록(참여)'으로 정해요.

function renderRecords() {
  const info = levelInfo();
  const streak = streakDays();
  const earned = earnedBadges();

  const levelBar = info.isMax ? 100 : (info.inLevel / info.step * 100);
  const levelText = info.isMax
    ? "42개를 모두 해 봤어요!"
    : "다음 레벨까지 단어 " + (info.step - info.inLevel) + "개 더 해 보기";

  const badges = BADGES.map(function (b) {
    const on = earned.indexOf(b.id) !== -1;
    return '<div class="badge-item' + (on ? " on" : "") + '">' +
      '<span class="badge-icon">' + (on ? b.icon : "🔒") + '</span>' +
      '<b>' + esc(b.name) + '</b><small>' + esc(b.how) + '</small></div>';
  }).join("");

  const stages = stageList().map(function (stage) {
    const n = stageWords(stage).length;
    const t = stageTriedCount(stage);
    return '<div class="stage-line"><span>단계 ' + stage + (isStageOpen(stage) ? '' : ' 🔒') + '</span>' +
      '<div class="stage-bar"><i style="width:' + (t / n * 100) + '%"></i></div><small>' + t + '/' + n + '</small></div>';
  }).join("");

  document.getElementById("records").innerHTML =
    '<div class="stats">' +
    '<div class="stat big"><small>레벨</small><b>Lv.' + info.level + '</b>' +
    '<div class="stage-bar"><i style="width:' + levelBar + '%"></i></div><small>' + levelText + '</small></div>' +
    '<div class="stat"><small>연속 학습</small><b>🔥 ' + streak + '일</b><small>' + (learnedToday() ? "오늘 학습 완료 ✅" : "오늘은 아직이에요") + '</small></div>' +
    '<div class="stat"><small>해 본 단어</small><b>' + info.tried + '<span>/' + APP_DATA.words.length + '</span></b>' +
    '<small>뜻 맞히기 ' + totalTries("quiz") + '번 · 직접 해보기 ' + totalTries("lab") + '번</small></div>' +
    '</div>' +
    '<h3 class="section">배지</h3><div class="badges">' + badges + '</div>' +
    '<h3 class="section">단계별 진행</h3><div class="panel">' + stages + '</div>' +
    '<h3 class="section">뜻 맞히기 랭킹</h3>' +
    '<div class="panel"><p class="sub">내 최고 점수 <b>' + progress.quizBest + '점</b> · 모은 점수 ' + progress.quizTotal + '점</p>' +
    rankingHTML() +
    '<p class="source">친구끼리 한 기기에서 돌려 쓰는 랭킹이에요. 이 기기에만 저장돼요.</p></div>' +
    '<button class="ghost danger" id="reset-button">이 기기 기록 모두 지우기</button>';

  document.getElementById("reset-button").addEventListener("click", function () {
    if (!confirm("레벨·배지·랭킹 기록을 모두 지울까요?")) return;
    resetProgress();
    renderTopStatus();
    renderRecords();
  });
}
