// [학습하기] 단계 1~7 지도를 보여주고, 단계마다 ① 뜻 맞히기 / ② 직접 해보기를 고르는 화면이에요.
// 앞 단계 단어를 모두 '해 보면'(뜻 맞히기를 풀거나 직접 해보기를 시도하면) 다음 단계가 열려요.

function stageCardHTML(stage) {
  const words = stageWords(stage);
  const open = isStageOpen(stage);
  const done = isStageDone(stage);
  const triedHere = stageTriedCount(stage);
  const isNow = stage === currentStage();

  const names = words.map(function (w) {
    return '<span class="mini' + (isTried(w.name) ? " on" : "") + '">' + esc(w.name) + '</span>';
  }).join("");

  let state = "🔒 잠김";
  if (done) state = "✅ 완료";
  else if (open) state = triedHere + " / " + words.length + " 해 봄";

  return '<div class="stage-card' + (open ? "" : " locked") + (isNow ? " now" : "") + '">' +
    '<div class="stage-head"><b>단계 ' + stage + '</b><span>' + state + '</span></div>' +
    '<div class="stage-bar"><i style="width:' + (triedHere / words.length * 100) + '%"></i></div>' +
    '<div class="minis">' + names + '</div>' +
    (open
      ? '<div class="row">' +
        '<button class="primary" data-quiz="' + stage + '">① 뜻 맞히기</button>' +
        '<button class="ghost" data-lab="' + stage + '">② 직접 해보기</button></div>'
      : '<p class="lock-note">단계 ' + (stage - 1) + ' 단어를 모두 해 보면 열려요.</p>') +
    '</div>';
}

function renderLearn() {
  const box = document.getElementById("learn");
  box.innerHTML =
    '<div class="how">' +
    '<p><b>① 뜻 맞히기</b> 사전 영상을 보고 뜻을 골라요. 맞히면 +' + CONFIG.QUIZ_POINT + '점, 랭킹에 이름을 올릴 수 있어요.</p>' +
    '<p><b>② 직접 해보기</b> 카메라 앞에서 따라 해요. 해 본 기록만 남고, AI는 판정하지 않아요.</p>' +
    '</div>' +
    stageList().map(stageCardHTML).join("");

  box.querySelectorAll("[data-quiz]").forEach(function (button) {
    button.addEventListener("click", function () { startQuiz(parseInt(button.dataset.quiz, 10)); });
  });
  box.querySelectorAll("[data-lab]").forEach(function (button) {
    button.addEventListener("click", function () { openLab(parseInt(button.dataset.lab, 10)); });
  });
}
