// [단어 상세] 단어 하나의 사전 영상, 사전 표제어, 수형 설명, 출처를 보여주는 화면이에요.

function showDetail(name) {
  const word = findWord(name);
  if (!word) return;
  showScreen("detail");

  const open = isStageOpen(word.stage);
  const box = document.getElementById("detail");
  box.innerHTML =
    '<h1 class="title">' + esc(word.name) + '</h1>' +
    '<p class="subline">단계 ' + word.stage + (word.category ? ' · ' + esc(word.category) : '') +
    (isTried(word.name) ? ' · 해 봄' : '') + '</p>' +
    '<div class="detail-grid">' +
    '<div class="panel">' + wordVideoHTML(word) + '</div>' +
    '<div class="panel">' +
    '<h2>수형 설명</h2>' +
    '<p>' + esc(word.handshape || "-") + '</p>' +
    '<dl class="meta">' +
    '<dt>사전 표제어</dt><dd>' + esc(word.headword || "-") + '</dd>' +
    '<dt>AI-Hub 문장</dt><dd class="num">' + (word.aihub ? esc(word.aihub) + '개' : '-') + '</dd>' +
    '</dl>' +
    '<div class="row" style="margin-top:16px">' +
    (open
      ? '<button class="primary" id="detail-lab">직접 따라 해 보기</button>'
      : '<p class="muted">단계 ' + word.stage + '이(가) 열리면 직접 해 볼 수 있어요.</p>') +
    '</div></div></div>';

  if (open) {
    document.getElementById("detail-lab").addEventListener("click", function () {
      openLab(word.stage, word.name);
    });
  }
}
