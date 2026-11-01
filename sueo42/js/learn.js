// [학습하기] 단계 1~7을 줄로 보여주고, 단계마다 ① 뜻 맞히기 / ② 직접 해보기를 고르는 화면이에요.
// 앞 단계 단어를 모두 '해 보면'(뜻 맞히기를 풀거나 직접 해보기를 시도하면) 다음 단계가 열려요.

function stageRowHTML(stage) {
  const words = stageWords(stage);
  const open = isStageOpen(stage);
  const done = isStageDone(stage);
  const triedHere = stageTriedCount(stage);
  const isNow = stage === currentStage() && !done;

  const names = words.map(function (w) {
    return '<span' + (isTried(w.name) ? ' class="on"' : '') + '>' + esc(w.name) + '</span>';
  }).join(" · ");

  let state = triedHere + " / " + words.length + " 해 봄";
  if (!open) state = "잠김";
  else if (done) state = "완료";

  return '<div class="stage-row' + (open ? "" : " locked") + (isNow ? " now" : "") + '">' +
    '<div class="panel-head"><h2>단계 ' + stage + (isNow ? ' · 지금 단계' : '') + '</h2><span>' + state + '</span></div>' +
    '<p class="words">' + names + '</p>' +
    (open
      ? '<div class="track"><i style="width:' + (triedHere / words.length * 100) + '%"></i></div>' +
        '<div class="row">' +
        '<button class="secondary" data-quiz="' + stage + '">① 뜻 맞히기</button>' +
        '<button class="' + (isNow ? 'primary' : 'secondary') + '" data-lab="' + stage + '">② 직접 해보기</button></div>'
      : '<p class="muted" style="margin:0">단계 ' + (stage - 1) + ' 단어를 모두 해 보면 열려요.</p>') +
    '</div>';
}

function renderLearn() {
  const box = document.getElementById("learn");
  box.innerHTML =
    '<p class="how"><b>① 뜻 맞히기</b>는 사전 영상을 보고 뜻을 골라요. 맞히면 +' + CONFIG.QUIZ_POINT + '점, 랭킹에 이름을 올릴 수 있어요. ' +
    '<b>② 직접 해보기</b>는 카메라 앞에서 따라 해요. 해 본 기록만 남고, AI는 판정하지 않아요.</p>' +
    stageList().map(stageRowHTML).join("");

  box.querySelectorAll("[data-quiz]").forEach(function (button) {
    button.addEventListener("click", function () { startQuiz(parseInt(button.dataset.quiz, 10)); });
  });
  box.querySelectorAll("[data-lab]").forEach(function (button) {
    button.addEventListener("click", function () { openLab(parseInt(button.dataset.lab, 10)); });
  });
}
