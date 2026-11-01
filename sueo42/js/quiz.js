// [학습하기 ① 뜻 맞히기] 사전 영상을 보고 보기 4개 중 뜻을 고르는 게임이에요.
// 정답은 국립국어원 한국수어사전에 근거한 사실이라, 정답 옆에 사전 출처를 꼭 보여줘요.
// 점수·랭킹은 이 게임에만 있어요. (직접 해보기에는 없어요)

const quiz = {
  stage: 1,
  questions: [], // 이번 판 문제 단어들
  index: 0,      // 지금 몇 번째 문제인지 (0부터)
  score: 0       // 이번 판 점수
};

// 문제로 낼 수 있는 단어: 영상이 있는 단어. 영상이 하나도 없으면 수형 설명이 있는 단어로.
function quizPool(stage) {
  const words = stageWords(stage);
  const withVideo = words.filter(hasVideo);
  if (withVideo.length > 0) return withVideo;
  return words.filter(function (w) { return w.handshape; });
}

function startQuiz(stage) {
  quiz.stage = stage;
  quiz.questions = shuffle(quizPool(stage));
  quiz.index = 0;
  quiz.score = 0;
  showScreen("quiz");

  if (quiz.questions.length === 0) {
    document.getElementById("quiz").innerHTML =
      '<p class="empty">단계 ' + stage + '에는 아직 문제로 낼 영상·수형 설명이 없어요. 데이터가 채워지면 풀 수 있어요.</p>' +
      '<button class="secondary" id="quiz-back">학습하기로</button>';
    document.getElementById("quiz-back").addEventListener("click", function () { showScreen("learn"); });
    return;
  }
  drawQuestion();
}

// 보기 4개: 정답 1개 + 다른 단어 3개 (42개 전체에서)
function makeChoices(answer) {
  const others = shuffle(APP_DATA.words.filter(function (w) { return w.name !== answer.name; }))
    .slice(0, CONFIG.QUIZ_CHOICES - 1);
  return shuffle(others.concat([answer]));
}

function drawQuestion() {
  const word = quiz.questions[quiz.index];
  const choices = makeChoices(word);

  // 영상이 있으면 영상, 없으면 수형 설명으로 문제를 내요.
  // 출처는 문제 아래에도 적고, 항목 페이지 링크(뜻이 보임)는 고른 뒤에 보여줘요.
  const media = (hasVideo(word)
    ? makeVideoHTML(word.video, "문제 영상")
    : '<div class="desc-question"><p class="muted">수형 설명</p>' + esc(word.handshape) + '</div>') +
    '<p class="source">출처: ' + esc(CONFIG.DICT_SOURCE) + '</p>';

  document.getElementById("quiz").innerHTML =
    '<div class="quiz-top">' +
    '<span>단계 ' + quiz.stage + ' · ' + (quiz.index + 1) + ' / ' + quiz.questions.length + '</span>' +
    '<span>이번 판 <b id="quiz-score">' + quiz.score + '</b>점 · 내 최고 ' + progress.quizBest + '점</span>' +
    '</div>' +
    '<div class="detail-grid">' +
    '<div class="panel">' + media + '</div>' +
    '<div class="panel">' +
    '<h2 class="question">이 수어의 뜻은 무엇일까요?</h2>' +
    '<div class="answers">' + choices.map(function (w) {
      return '<button class="answer" data-name="' + esc(w.name) + '">' + esc(w.name) + '</button>';
    }).join("") + '</div>' +
    '<div id="quiz-result"></div>' +
    '</div></div>';

  document.querySelectorAll("#quiz .answer").forEach(function (button) {
    button.addEventListener("click", function () { checkAnswer(button.dataset.name, word); });
  });
}

function checkAnswer(picked, word) {
  const correct = picked === word.name;
  if (correct) quiz.score += CONFIG.QUIZ_POINT;
  markTried(word.name, "quiz"); // 맞든 틀리든 '해 본 단어'로 기록

  // 정답 버튼은 초록, 내가 고른 다른 버튼은 흐리게
  document.querySelectorAll("#quiz .answer").forEach(function (button) {
    button.disabled = true;
    if (button.dataset.name === word.name) button.classList.add("right");
    else if (button.dataset.name === picked) button.classList.add("wrong");
  });
  document.getElementById("quiz-score").textContent = quiz.score;

  const isLast = quiz.index === quiz.questions.length - 1;
  document.getElementById("quiz-result").innerHTML =
    '<p class="result ' + (correct ? "ok" : "no") + '">' +
    (correct ? "정답! +" + CONFIG.QUIZ_POINT + "점" : "아쉬워요. 정답은 '" + esc(word.name) + "'") + '</p>' +
    '<div class="evidence">' +
    '<b>정답 근거</b> 사전 표제어: ' + esc(word.headword || word.name) +
    dictSourceHTML(word) +
    '</div>' +
    '<div class="row">' +
    '<button class="primary" id="quiz-next">' + (isLast ? "결과 보기" : "다음 문제") + '</button>' +
    '<button class="secondary" id="quiz-detail">단어 자세히</button>' +
    '</div>';

  document.getElementById("quiz-next").addEventListener("click", function () {
    if (isLast) { finishQuiz(); return; }
    quiz.index++;
    drawQuestion();
  });
  document.getElementById("quiz-detail").addEventListener("click", function () { showDetail(word.name); });
}

// 한 판 끝: 점수·최고 점수 저장, 이름 적고 랭킹에 올리기
function finishQuiz() {
  const isBest = saveQuizRound(quiz.score);
  const full = quiz.questions.length * CONFIG.QUIZ_POINT;
  const box = document.getElementById("quiz");

  box.innerHTML =
    '<div class="detail-grid">' +
    '<div class="panel">' +
    '<h2>단계 ' + quiz.stage + ' 결과</h2>' +
    '<p class="final-score">' + quiz.score + '<small> / ' + full + '점</small></p>' +
    (isBest ? '<p class="best">내 최고 점수를 새로 세웠어요</p>' : '<p class="muted">내 최고 점수 ' + progress.quizBest + '점</p>') +
    '<div class="row" style="margin-top:16px">' +
    '<button class="primary" id="quiz-again">한 판 더</button>' +
    '<button class="secondary" id="quiz-learn">학습하기로</button>' +
    '</div></div>' +
    '<div class="panel">' +
    '<h2>랭킹에 이름 올리기</h2>' +
    '<p class="source">친구끼리 한 기기에서 돌려 쓰는 랭킹이에요. 이 기기에만 저장되고 어디에도 보내지 않아요.</p>' +
    '<div class="row"><input id="rank-name" class="search" maxlength="10" placeholder="이름 또는 별명">' +
    '<button class="primary" id="rank-save">올리기</button></div>' +
    '<div id="rank-box">' + rankingHTML() + '</div>' +
    '</div></div>';

  document.getElementById("rank-save").addEventListener("click", function () {
    const name = document.getElementById("rank-name").value.trim();
    if (!name) { document.getElementById("rank-name").focus(); return; }
    addRanking(name, quiz.score, quiz.stage);
    document.getElementById("rank-box").innerHTML = rankingHTML();
    document.getElementById("rank-save").disabled = true;
    showToast("랭킹에 올렸어요!");
  });
  document.getElementById("quiz-again").addEventListener("click", function () { startQuiz(quiz.stage); });
  document.getElementById("quiz-learn").addEventListener("click", function () { showScreen("learn"); });
}
