// [시작] 앱을 켜면 데이터를 불러오고, 하단 탭을 누를 때 화면을 바꿔요.

// 글자 안의 < > & " 를 안전하게 바꿔요. (시트 내용을 화면에 넣을 때 사용)
function esc(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 지금 보이는 화면 이름과, 상세 화면에서 "뒤로" 누르면 돌아갈 화면
let currentScreen = "list";
let previousScreen = "list";

// 화면 하나만 보이게 해요. name: list, detail, region, quiz, lab
function showScreen(name) {
  if (name === "detail") {
    previousScreen = currentScreen;
  } else {
    stopAllVideos();
  }
  currentScreen = name;

  document.querySelectorAll(".screen").forEach(function (screen) {
    screen.classList.toggle("show", screen.id === "screen-" + name);
  });

  // 상세 화면일 땐 탭 표시를 원래 화면에 그대로 둬요.
  const tabName = name === "detail" ? previousScreen : name;
  document.querySelectorAll(".tabbar button").forEach(function (button) {
    button.classList.toggle("active", button.dataset.screen === tabName);
  });

  if (name !== "lab") stopCamera();
  window.scrollTo(0, 0);
}

// 다른 화면으로 갈 때 재생 중인 영상을 멈추려고 영상 칸을 비워요.
function stopAllVideos() {
  document.getElementById("detail").innerHTML = "";
}

// 하단 탭 버튼 연결
document.querySelectorAll(".tabbar button").forEach(function (button) {
  button.addEventListener("click", function () {
    showScreen(button.dataset.screen);
  });
});

document.getElementById("back-button").addEventListener("click", function () {
  showScreen(previousScreen);
});

// 앱 시작
async function startApp() {
  const status = document.getElementById("status");
  try {
    await loadData();
    status.textContent = CONFIG.SHEET_CSV_URL ? "" : "지금은 예시 데이터로 보고 있어요.";
    status.classList.toggle("hide", !!CONFIG.SHEET_CSV_URL);
    renderList();
    renderRegion();
    newQuestion();
    renderLab();
    showScreen("list");
  } catch (error) {
    status.innerHTML = "데이터를 불러오지 못했어요 😢<br><small>" + esc(error.message) +
      "<br>index.html을 더블클릭해서 열었다면, README의 '실행 방법'처럼 Live Server로 열어 주세요.</small>";
    status.classList.add("error");
  }
}

startApp();
