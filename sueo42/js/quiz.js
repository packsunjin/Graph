// [④ 퀴즈] 지역 수어 영상을 하나 보여주고, 어느 지역 표현인지 맞히는 화면이에요.

const quizScore = { right: 0, total: 0 };
let lastQuizId = null;

function newQuestion() {
  const box = document.getElementById("quiz");

  // 표준이 아닌 지역 표현만 문제로 내요.
  const pool = APP_DATA.signs.filter(function (s) { return s.region !== CONFIG.STANDARD_REGION; });
  if (pool.length === 0) {
    box.innerHTML = '<p class="empty">퀴즈를 낼 지역 표현이 아직 없어요.</p>';
    return;
  }

  // 같은 문제가 연달아 나오지 않게 다시 뽑기
  let sign = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && sign.id + sign.region === lastQuizId) {
    return newQuestion();
  }
  lastQuizId = sign.id + sign.region;

  // 같은 표현 ID를 쓰는 지역은 모두 정답
  const answers = pool.filter(function (s) { return s.id && s.id === sign.id; })
    .map(function (s) { return s.region; });
  if (answers.indexOf(sign.region) === -1) answers.push(sign.region);

  const buttons = CONFIG.REGIONS.map(function (region) {
    return '<button class="answer" data-region="' + esc(region.name) + '" style="--c:' + region.color + '">' + esc(region.name) + '</button>';
  }).join("");

  box.innerHTML =
    '<p class="score">점수 ' + quizScore.right + ' / ' + quizScore.total + '</p>' +
    '<p class="question">이 <b>"' + esc(sign.meaning) + '"</b> 표현은 어느 지역 수어일까요?</p>' +
    makeVideoHTML(sign.video, "문제 영상") +
    '<p class="note">영상을 보고 손 모양을 따라 해 본 다음 골라 보세요 ✋</p>' +
    '<div class="answers">' + buttons + '</div>' +
    '<div id="quiz-result"></div>';

  box.querySelectorAll(".answer").forEach(function (button) {
    button.addEventListener("click", function () {
      checkAnswer(button.dataset.region, answers, sign);
    });
  });
}

function checkAnswer(picked, answers, sign) {
  const correct = answers.indexOf(picked) !== -1;
  quizScore.total++;
  if (correct) quizScore.right++;

  // 버튼에 정답·오답 색 표시하고 더 못 누르게
  document.querySelectorAll("#quiz .answer").forEach(function (button) {
    button.disabled = true;
    if (answers.indexOf(button.dataset.region) !== -1) button.classList.add("right");
    else if (button.dataset.region === picked) button.classList.add("wrong");
  });

  document.getElementById("quiz-result").innerHTML =
    '<p class="result ' + (correct ? "ok" : "no") + '">' +
    (correct ? "정답! 🎉" : "아쉬워요 😅 정답은 " + esc(answers.join(", "))) + '</p>' +
    '<div class="row">' +
    '<button class="primary" id="next-question">다음 문제</button>' +
    '<button class="ghost" id="see-detail">단어 비교하기</button>' +
    '</div>';

  document.querySelector("#quiz .score").textContent = "점수 " + quizScore.right + " / " + quizScore.total;
  document.getElementById("next-question").addEventListener("click", newQuestion);
  document.getElementById("see-detail").addEventListener("click", function () {
    showDetail(sign.meaning, sign.region);
  });
}
