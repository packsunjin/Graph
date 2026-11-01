// [학습하기 ② 직접 해보기] 사전 영상을 보고 내 카메라 앞에서 따라 해 보는 화면이에요. (핵심 기능, AI)
// [동작 기록]을 누르면 몇 초 동안 손 좌표를 저장하고, 비슷해 보이는 동작의 "순위"와 근거(영상)만 보여줘요.
// 중요: AI는 맞다/틀리다를 판정하지 않아요. 점수·확률도 없어요. 고르는 건 사용자예요.
// 해 본 기록만 레벨·연속 학습·배지에 반영돼요.

const lab = {
  stage: 1,        // 지금 고른 단계
  word: null,      // 지금 따라 하는 단어 이름
  frames: [],      // 기록한 손 좌표 [{ t, hands }]
  ranking: [],     // 비슷해 보이는 단어 순위 (이름 목록)
  picked: null     // [다른 동작이었어요]에서 사용자가 고른 단어
};

// 다른 화면에서 직접 해보기로 올 때 (stage: 단계, name: 단어, 없으면 단계 첫 단어)
function openLab(stage, name) {
  lab.stage = stage;
  lab.word = name || null;
  showScreen("lab");
}

// 사전 영상 칸 (영상 + 출처)
function labVideoPanelHTML(name, title) {
  return '<h3>' + esc(title) + '</h3>' + wordVideoHTML(findWord(name));
}

// 처음 그리기 (탭을 누를 때마다 app.js가 불러요)
function renderLab() {
  stopCamera();
  if (!isStageOpen(lab.stage)) lab.stage = currentStage();
  const words = stageWords(lab.stage).map(function (w) { return w.name; });
  if (words.indexOf(lab.word) === -1) lab.word = words[0] || null;

  const box = document.getElementById("lab");
  if (!lab.word) {
    box.innerHTML = '<p class="empty">직접 해 볼 단어가 아직 없어요.</p>';
    return;
  }

  const stageChips = stageList().map(function (stage) {
    const open = isStageOpen(stage);
    return '<button class="chip' + (stage === lab.stage ? " active" : "") + '" data-stage="' + stage + '"' +
      (open ? '' : ' disabled') + '>단계 ' + stage + (open ? '' : ' 잠김') + '</button>';
  }).join("");

  const wordChips = words.map(function (name) {
    return '<button class="chip' + (name === lab.word ? " active" : "") + (isTried(name) ? " tried" : "") +
      '" data-word="' + esc(name) + '">' + esc(name) + '</button>';
  }).join("");

  box.innerHTML =
    '<p class="subline">사전 영상을 보고 카메라 앞에서 따라 해요. 카메라 영상은 이 기기 안에서만 처리하고, 어디에도 보내지 않아요.</p>' +
    '<div class="chips">' + stageChips + '</div>' +
    '<div class="chips wrap">' + wordChips + '</div>' +
    '<div class="compare">' +
    '<div class="panel">' + labVideoPanelHTML(lab.word, "사전 영상 · " + lab.word) + '</div>' +
    '<div class="panel"><h3>내 카메라</h3>' +
    '<div class="cam"><video id="lab-video" muted playsinline></video><canvas id="lab-canvas"></canvas>' +
    '<div id="cam-cover" class="cam-cover">카메라가 꺼져 있어요</div></div>' +
    '<p id="lab-msg" class="lab-msg"></p>' +
    '<div class="row"><button class="primary" id="cam-button">카메라 켜기</button>' +
    '<button class="secondary rec" id="rec-button" disabled>동작 기록 (' + CONFIG.LAB_RECORD_SECONDS + '초)</button></div>' +
    '</div></div>';

  box.querySelectorAll("[data-stage]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      lab.stage = parseInt(chip.dataset.stage, 10);
      lab.word = null;
      renderLab();
    });
  });
  box.querySelectorAll("[data-word]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      lab.word = chip.dataset.word;
      renderLab();
    });
  });
  document.getElementById("cam-button").addEventListener("click", turnOnLabCamera);
  document.getElementById("rec-button").addEventListener("click", recordMotion);
}

function setLabMessage(text, isError) {
  const msg = document.getElementById("lab-msg");
  if (!msg) return;
  msg.textContent = text;
  msg.classList.toggle("error", !!isError);
}

// [카메라 켜기] → 카메라 켜고 손 인식 모델(MediaPipe) + 학습된 모델(있으면) 불러오기
async function turnOnLabCamera() {
  const camButton = document.getElementById("cam-button");
  const cover = document.getElementById("cam-cover");
  camButton.disabled = true;

  try {
    cover.textContent = "카메라 켜는 중…";
    await startCamera(document.getElementById("lab-video"), document.getElementById("lab-canvas"));
    cover.classList.add("hide");
  } catch (error) {
    cover.textContent = "카메라가 꺼져 있어요";
    setLabMessage(error.message, true);
    camButton.disabled = false;
    return;
  }

  try {
    setLabMessage("손 인식 모델 불러오는 중… (처음 한 번은 몇 초 걸려요)");
    await loadHandModel();
    await loadModel();
    if (!camera.stream) return; // 그 사이 다른 탭으로 갔으면 멈춤
    setLabMessage("손을 화면 안에 보여 주세요. 준비되면 [동작 기록]을 눌러요.");
    document.getElementById("rec-button").disabled = false;
    camButton.textContent = "카메라 켜짐";
    startHandLoop();
  } catch (error) {
    setLabMessage("손 인식 모델을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요. (카메라 화면은 볼 수 있지만 동작 기록은 할 수 없어요)", true);
  }
}

// [동작 기록] → 정해진 초 동안 손 좌표를 저장하고 결과 화면으로
function recordMotion() {
  const recButton = document.getElementById("rec-button");
  recButton.disabled = true;
  recButton.classList.add("on");
  lab.frames = [];
  const startTime = performance.now();

  camera.onHands = function (hands) {
    lab.frames.push({
      t: performance.now() - startTime,
      hands: hands.map(function (points) {
        return points.map(function (p) { return { x: p.x, y: p.y, z: p.z }; });
      })
    });
  };

  let left = CONFIG.LAB_RECORD_SECONDS;
  setLabMessage("기록 중… " + left + "초");
  const timer = setInterval(function () {
    left--;
    if (!camera.stream) { clearInterval(timer); return; } // 다른 탭으로 가면 그만
    if (left > 0) {
      setLabMessage("기록 중… " + left + "초");
      return;
    }
    clearInterval(timer);
    stopCamera();
    lab.ranking = guessSimilar(lab.frames);
    markTried(lab.word, "lab"); // 해 본 기록만 남겨요 (판정 없음)
    drawLabResult();
  }, 1000);
}

// 결과 화면 왼쪽에 사전 영상 보여주기 (name: 보여줄 단어)
function drawLabCompareVideo(name) {
  const rank = lab.ranking.indexOf(name);
  let title = "사전 영상 · " + name;
  if (name === lab.picked) title += " (내가 고른 동작)";
  else if (name === lab.word) title += " (따라 한 단어)";
  else if (rank !== -1) title += " (" + (rank + 1) + "번째로 비슷해 보이는 동작)";
  document.getElementById("result-video").innerHTML = labVideoPanelHTML(name, title);
}

// 결과 화면 아래 선택 버튼 칸 (1순위가 없으면 [다시 해보기]만)
function labChoicesHTML() {
  if (lab.ranking.length === 0) {
    return '<div class="choices"><button class="primary" id="choice-retry">다시 해보기</button></div>';
  }
  return '<p class="lab-ask">AI는 이 동작을 \'① ' + esc(lab.ranking[0]) + '\'로 봤어요. 맞나요?</p>' +
    '<div class="choices">' +
    '<button class="primary" id="choice-yes">맞아요</button>' +
    '<button class="secondary" id="choice-other">다른 동작이었어요</button>' +
    '<button class="secondary" id="choice-retry">다시 해보기</button>' +
    '</div>';
}

function drawLabResult() {
  const box = document.getElementById("lab");
  const marks = ["①", "②", "③", "④", "⑤"];
  lab.picked = null;

  let rankHTML;
  if (lab.ranking.length === 0) {
    rankHTML = '<p class="note">기록하는 동안 손이 화면에 잡히지 않았어요. 손이 화면 안에 들어오게 하고 다시 해 보세요.</p>';
  } else {
    rankHTML = '<p class="lab-step">AI가 추측한 가장 비슷해 보이는 동작: ' +
      lab.ranking.map(function (name, i) { return marks[i] + ' ' + esc(name); }).join(" ") +
      ' <small>(AI 추정)</small></p>' +
      '<div class="rank-items">' + lab.ranking.map(function (name, i) {
        return '<button class="rank-item" data-word="' + esc(name) + '">' + marks[i] + ' ' + esc(name) + '</button>';
      }).join("") + '</div>' +
      '<p class="source">순위 버튼을 누르면 그 단어의 사전 영상을 내 동작 옆에 보여줘요.</p>';
  }

  const banner = isModelReady()
    ? '<p class="notice model"><b>AI 추정</b> — AI 허브 「수어 영상」으로 학습한 모델이 고른 순서예요. 판단은 내가 해요.</p>'
    : '<p class="notice"><b>시험용 — 아직 학습 전</b><br>아래 순위는 학습한 AI가 아니라 임시로(무작위) 정한 순서예요.</p>';

  box.innerHTML =
    banner +
    rankHTML +
    '<div class="compare">' +
    '<div class="panel" id="result-video"></div>' +
    '<div class="panel"><h3>내 동작 (손 좌표 다시 보기)</h3>' +
    '<div class="cam"><canvas id="replay-canvas"></canvas></div>' +
    '<p class="source">이 기기에만 잠깐 저장된 좌표예요 · 장면 ' + lab.frames.length + '개</p></div>' +
    '</div>' +
    labChoicesHTML() +
    '<div id="choice-msg"></div>' +
    '<p class="note">\'' + esc(lab.word) + '\' 해 본 기록이 남았어요.</p>';

  drawLabCompareVideo(lab.word);
  startReplay(document.getElementById("replay-canvas"), lab.frames);

  box.querySelectorAll(".rank-item").forEach(function (item) {
    item.addEventListener("click", function () { drawLabCompareVideo(item.dataset.word); });
  });
  document.getElementById("choice-retry").addEventListener("click", renderLab); // 같은 단어로 다시 기록
  if (lab.ranking.length === 0) return;
  document.getElementById("choice-yes").addEventListener("click", labChoiceYes);
  document.getElementById("choice-other").addEventListener("click", labChoiceOther);
}

// [맞아요] → 확인 문구 + 다음 단어 버튼 (칭찬·평가 없이)
function labChoiceYes() {
  document.getElementById("choice-msg").innerHTML =
    '<p class="note">확인했어요. 다음 단어도 해 볼까요?</p>' +
    '<button class="secondary" id="choice-next" style="margin-top:8px">다음 단어 해보기</button>';
  document.getElementById("choice-next").addEventListener("click", function () {
    // 이 단계의 다음 단어, 단계 끝이면 다음 단계(열렸으면) 첫 단어
    const list = APP_DATA.words.filter(function (w) { return isStageOpen(w.stage); });
    const index = list.findIndex(function (w) { return w.name === lab.word; });
    const next = list[(index + 1) % list.length];
    lab.stage = next.stage;
    lab.word = next.name;
    renderLab();
  });
}

// [다른 동작이었어요] → 단어 목록에서 내가 실제로 한 동작을 고르면, 그 사전 영상을 내 동작 옆에 보여줌
function labChoiceOther() {
  const chips = APP_DATA.words.map(function (w) {
    return '<button class="chip" data-word="' + esc(w.name) + '">' + esc(w.name) + '</button>';
  }).join("");
  const msg = document.getElementById("choice-msg");
  msg.innerHTML = '<p class="lab-step">내가 실제로 한 동작을 골라 주세요</p>' +
    '<div class="chips wrap">' + chips + '</div>';

  msg.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      lab.picked = chip.dataset.word;
      msg.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === chip); });
      drawLabCompareVideo(lab.picked);
      document.getElementById("result-video").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}
