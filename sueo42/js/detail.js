// [② 단어 상세] 표준 수어와 지역 수어 영상을 나란히 놓고 비교하는 화면이에요.
// 위쪽 지역 버튼을 누르면 오른쪽(아래쪽) 영상이 그 지역 표현으로 바뀌어요.

// 표현 하나를 보여주는 칸
function signPanelHTML(sign, title) {
  if (!sign) {
    return '<div class="panel">' +
      '<h3>' + esc(title) + '</h3>' +
      makeVideoHTML("", "등록된 영상이 없어요") +
      '</div>';
  }
  return '<div class="panel">' +
    '<h3><i class="dot" style="background:' + regionColor(sign.region) + '"></i>' + esc(title) + '</h3>' +
    makeVideoHTML(sign.video, sign.id) +
    '<dl class="meta">' +
    '<dt>표현 ID</dt><dd>' + esc(sign.id || "-") + '</dd>' +
    '<dt>근거</dt><dd>' + esc(sign.evidence || "-") + '</dd>' +
    '<dt>영상 출처</dt><dd>' + esc(sign.source || "-") + '</dd>' +
    '</dl>' +
    '</div>';
}

// meaning: 보여줄 단어, startRegion: 처음에 비교할 지역 (없으면 첫 번째 지역)
function showDetail(meaning, startRegion) {
  const word = APP_DATA.words.find(function (w) { return w.meaning === meaning; });
  if (!word) return;

  const standard = word.signs.find(function (s) { return s.region === CONFIG.STANDARD_REGION; });
  const regional = word.signs.filter(function (s) { return s.region !== CONFIG.STANDARD_REGION; });

  showScreen("detail");
  const box = document.getElementById("detail");

  // 비교할 지역 표현을 그리는 함수
  function draw(regionName) {
    const picked = regional.find(function (s) { return s.region === regionName; }) || regional[0];

    const chips = regional.map(function (s) {
      const active = picked && s.region === picked.region;
      return '<button class="chip' + (active ? " active" : "") + '" data-region="' + esc(s.region) + '">' + esc(s.region) + '</button>';
    }).join("");

    // 같은 표현 ID를 쓰는 지역이 여러 곳이면 알려줘요.
    let sameNote = "";
    if (picked) {
      const same = word.signs.filter(function (s) { return s.id && s.id === picked.id; })
        .map(function (s) { return s.region; });
      if (same.length > 1) sameNote = '<p class="note">💡 ' + esc(same.join(", ")) + '에서 같은 표현을 써요.</p>';
      if (standard && picked.id && standard.id === picked.id) sameNote = '<p class="note">💡 이 지역은 표준 수어와 같은 표현을 써요.</p>';
    }

    box.innerHTML =
      '<span class="word-category">' + esc(word.category) + '</span>' +
      '<h2 class="detail-title">' + esc(word.meaning) + '</h2>' +
      (regional.length ? '<div class="chips">' + chips + '</div>' : '<p class="note">아직 등록된 지역 표현이 없어요.</p>') +
      '<div class="compare">' +
      signPanelHTML(standard, "표준 수어") +
      signPanelHTML(picked, picked ? picked.region : "지역 수어") +
      '</div>' + sameNote;

    box.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () { draw(chip.dataset.region); });
    });
  }

  draw(startRegion);
}
