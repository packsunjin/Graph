// [단어 상세] 단어 하나의 사전 영상, 사전 표제어, 수형 설명, 출처를 보여주는 화면이에요.

function showDetail(name) {
  const word = findWord(name);
  if (!word) return;
  showScreen("detail");

  const open = isStageOpen(word.stage);
  const box = document.getElementById("detail");
  box.innerHTML =
    '<span class="word-category">단계 ' + word.stage + (word.category ? ' · ' + esc(word.category) : '') + '</span>' +
    '<h2 class="detail-title">' + esc(word.name) + '</h2>' +
    '<div class="panel">' + wordVideoHTML(word) +
    '<dl class="meta">' +
    '<dt>사전 표제어</dt><dd>' + esc(word.headword || "-") + '</dd>' +
    '<dt>수형 설명</dt><dd>' + esc(word.handshape || "준비 중") + '</dd>' +
    '</dl></div>' +
    '<div class="row">' +
    (open
      ? '<button class="primary" id="detail-lab">✋ 직접 따라 해 보기</button>'
      : '<p class="note">🔒 단계 ' + word.stage + '이(가) 열리면 직접 해 볼 수 있어요.</p>') +
    '</div>';

  if (open) {
    document.getElementById("detail-lab").addEventListener("click", function () {
      openLab(word.stage, word.name);
    });
  }
}
