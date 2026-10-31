// [⑤ 직접 해보기] 사전 영상을 보고 내 카메라 앞에서 따라 해 보는 화면이에요.
// [동작 기록]을 누르면 몇 초 동안 손 좌표를 저장하고, 비슷해 보이는 동작의 "순위"와 근거(영상)만 보여줘요.
// 중요: AI는 맞다/틀리다를 판정하지 않아요. 점수·확률도 보여주지 않아요. 고르는 건 사용자예요.

const lab = {
  word: null,      // 지금 따라 하는 단어 (의미)
  frames: [],      // 기록한 손 좌표 [{ t, hands }]
  ranking: [],     // 비슷해 보이는 단어 순위 (의미 목록)
  showWord: null,  // 결과 화면 왼쪽에 보여주는 사전 영상 단어
  picked: null     // [다른 동작이었어요]에서 사용자가 고른 단어
};

// 직접 해보기 단어 목록 (config.js의 LAB_WORDS 중 데이터에 있는 단어만)
function labWordList() {
  const list = CONFIG.LAB_WORDS.filter(function (meaning) {
    return APP_DATA.words.some(function (w) { return w.meaning === meaning; });
  });
  if (list.length > 0) return list;
  return APP_DATA.words.slice(0, 5).map(function (w) { return w.meaning; });
}

// 단어의 대표 표현 (표준 수어가 있으면 표준, 없으면 첫 번째 표현)
function labSignOf(meaning) {
  const word = APP_DATA.words.find(function (w) { return w.meaning === meaning; });
  if (!word) return null;
  return word.signs.find(function (s) { return s.region === CONFIG.STANDARD_REGION; }) || word.signs[0];
}

// 사전 영상 칸 (영상 + 출처)
function labVideoPanelHTML(meaning, title) {
  const sign = labSignOf(meaning);
  const source = sign ? (sign.source || "-") : "-";
  const region = sign ? sign.region : "";
  return '<h3>' + esc(title) + '</h3>' +
    makeVideoHTML(sign ? sign.video : "", meaning) +
    '<p class="source">출처: ' + esc(source) + (region ? ' · ' + esc(region) : '') + '</p>';
}

// AI가 비슷해 보이는 단어를 순서대로 고르는 자리예요.
// ★ 지금은 학습한 모델이 없어서 손이 잡혔는지만 보고, 순서는 무작위로 정해요. (시험용)
// ★ 나중에 AI-Hub 수어 영상으로 학습한 모델로 바꿀 자리예요. 바꿔도 "순위(의미 목록)"만 돌려주세요.
//   점수·확률은 돌려주지도, 화면에 보여주지도 않아요.
function guessSimilar(frames) {
  const handFrames = frames.filter(function (f) { return f.hands.length > 0; });
  if (handFrames.length === 0) return [];

  const words = labWordList().slice();
  for (let i = words.length - 1; i > 0; i--) { // 섞기
    const j = Math.floor(Math.random() * (i + 1));
    const temp = words[i];
    words[i] = words[j];
    words[j] = temp;
  }
  return words.slice(0, 2);
}

// 처음 그리기 (app.js가 데이터를 불러온 뒤 불러요)
function renderLab() {
  stopCamera();
  const words = labWordList();
  if (words.indexOf(lab.word) === -1) lab.word = words[0] || null;

  const box = document.getElementById("lab");
  if (!lab.word) {
    box.innerHTML = '<p class="empty">직접 해 볼 단어가 아직 없어요.</p>';
    return;
  }

  const chips = words.map(function (meaning) {
    return '<button class="chip' + (meaning === lab.word ? " active" : "") + '" data-word="' + esc(meaning) + '">' + esc(meaning) + '</button>';
  }).join("");

  box.innerHTML =
    '<p class="privacy">🔒 카메라 영상은 이 기기 안에서만 처리하고, 서버로 보내지 않아요.</p>' +
    '<p class="lab-step">따라 할 단어</p>' +
    '<div class="chips">' + chips + '</div>' +
    '<div class="compare">' +
    '<div class="panel">' + labVideoPanelHTML(lab.word, "사전 영상 · " + lab.word) + '</div>' +
    '<div class="panel"><h3>내 카메라</h3>' +
    '<div class="cam"><video id="lab-video" muted playsinline></video><canvas id="lab-canvas"></canvas>' +
    '<div id="cam-cover" class="cam-cover">카메라가 꺼져 있어요</div></div>' +
    '<p id="lab-msg" class="lab-msg"></p>' +
    '<div class="row"><button class="primary" id="cam-button">카메라 켜기</button>' +
    '<button class="rec" id="rec-button" disabled>● 동작 기록 (' + CONFIG.LAB_RECORD_SECONDS + '초)</button></div>' +
    '</div></div>';

  box.querySelectorAll(".chip").forEach(function (chip) {
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

// [카메라 켜기] → 카메라 켜고 손 인식 모델 불러오기
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
  const seconds = CONFIG.LAB_RECORD_SECONDS;

  camera.onHands = function (hands) {
    lab.frames.push({
      t: performance.now() - startTime,
      hands: hands.map(function (points) {
        return points.map(function (p) { return { x: p.x, y: p.y, z: p.z }; });
      })
    });
  };

  let left = seconds;
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
    drawLabResult();
  }, 1000);
}

// 결과 화면 왼쪽에 사전 영상 보여주기 (meaning: 보여줄 단어)
function drawLabCompareVideo(meaning) {
  lab.showWord = meaning;
  const rank = lab.ranking.indexOf(meaning);
  let title = "사전 영상 · " + meaning;
  if (meaning === lab.picked) title += " (내가 고른 동작)";
  else if (meaning === lab.word) title += " (따라 한 단어)";
  else if (rank !== -1) title += " (" + (rank + 1) + "번째로 비슷해 보이는 동작)";
  document.getElementById("result-video").innerHTML = labVideoPanelHTML(meaning, title);
}

// 결과 화면 아래 선택 버튼 칸 (1순위가 없으면 [다시 해보기]만)
function labChoicesHTML() {
  if (lab.ranking.length === 0) {
    return '<div class="choices"><button class="primary" id="choice-retry">다시 해보기</button></div>';
  }
  return '<p class="lab-ask">AI는 이 동작을 \'① ' + esc(lab.ranking[0]) + '\'로 봤어요. 맞나요?</p>' +
    '<div class="choices">' +
    '<button class="primary" id="choice-yes">맞아요</button>' +
    '<button class="ghost" id="choice-other">다른 동작이었어요</button>' +
    '<button class="ghost" id="choice-retry">다시 해보기</button>' +
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
    rankHTML = '<p class="lab-step">가장 비슷해 보이는 동작 <small>(AI 추정)</small></p>' +
      '<div class="rank">' + lab.ranking.map(function (meaning, i) {
        return '<button class="rank-item" data-word="' + esc(meaning) + '">' + marks[i] + ' ' + esc(meaning) + '</button>';
      }).join("") + '</div>';
  }

  box.innerHTML =
    '<p class="test-banner">🧪 시험용 — 아직 학습 전<br><small>아래 순위는 학습한 AI가 아니라 임시로(무작위) 정한 순서예요.</small></p>' +
    rankHTML +
    '<div class="compare">' +
    '<div class="panel" id="result-video"></div>' +
    '<div class="panel"><h3>내 동작 (손 좌표 다시 보기)</h3>' +
    '<div class="cam"><canvas id="replay-canvas"></canvas></div>' +
    '<p class="source">이 기기에만 잠깐 저장된 좌표예요 · 장면 ' + lab.frames.length + '개</p></div>' +
    '</div>' +
    labChoicesHTML() +
    '<div id="choice-msg"></div>';

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

// [맞아요] → 확인 문구 + 다음 단어 버튼 (칭찬·점수 없이)
function labChoiceYes() {
  document.getElementById("choice-msg").innerHTML =
    '<p class="note">확인했어요. 다음 단어도 해 볼까요?</p>' +
    '<button class="ghost" id="choice-next">다음 단어 해보기</button>';
  document.getElementById("choice-next").addEventListener("click", function () {
    const words = labWordList();
    lab.word = words[(words.indexOf(lab.word) + 1) % words.length];
    renderLab();
  });
}

// [다른 동작이었어요] → 단어 목록에서 내가 실제로 한 동작을 고르면, 그 사전 영상을 내 동작 옆에 보여줌
function labChoiceOther() {
  const chips = labWordList().map(function (meaning) {
    return '<button class="chip" data-word="' + esc(meaning) + '">' + esc(meaning) + '</button>';
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
