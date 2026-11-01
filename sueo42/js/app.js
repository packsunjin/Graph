// [시작] 앱을 켜면 데이터를 불러오고, 하단 탭을 누를 때 화면을 바꿔요.

// 글자 안의 < > & " ' 를 안전하게 바꿔요. (시트 내용을 화면에 넣을 때 사용)
function esc(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 화면마다 아래 탭 중 어느 탭에 불을 켤지 (detail은 들어오기 전 탭 그대로)
const SCREEN_TAB = { search: "search", learn: "learn", quiz: "learn", lab: "lab", records: "" };

let currentScreen = "search";
let previousScreen = "search";

// 화면 하나만 보이게 해요. name: search, detail, learn, quiz, lab, records
function showScreen(name) {
  pauseAllVideos();
  if (name !== "lab") stopCamera();
  if (name === "detail" && currentScreen !== "detail") previousScreen = currentScreen;
  currentScreen = name;

  document.querySelectorAll(".screen").forEach(function (screen) {
    screen.classList.toggle("show", screen.id === "screen-" + name);
  });

  const tab = name === "detail" ? SCREEN_TAB[previousScreen] : SCREEN_TAB[name];
  document.querySelectorAll(".tabbar button").forEach(function (button) {
    button.classList.toggle("active", button.dataset.screen === tab);
  });

  // 들어갈 때마다 최신 기록으로 다시 그려요.
  if (name === "search") renderSearch();
  if (name === "learn") renderLearn();
  if (name === "lab") renderLab();
  if (name === "records") renderRecords();
  window.scrollTo(0, 0);
}

// 하단 탭 버튼 연결
document.querySelectorAll(".tabbar button").forEach(function (button) {
  button.addEventListener("click", function () {
    if (button.dataset.screen === "lab") lab.stage = currentStage();
    showScreen(button.dataset.screen);
  });
});

document.getElementById("back-button").addEventListener("click", function () {
  showScreen(previousScreen);
});

document.getElementById("top-status").addEventListener("click", function () {
  showScreen("records");
});

// 앱 시작
async function startApp() {
  const status = document.getElementById("status");
  try {
    await loadData();
    status.classList.add("hide");
    lab.stage = currentStage();
    renderTopStatus();
    showScreen("search");
  } catch (error) {
    status.innerHTML = "데이터를 불러오지 못했어요 😢<br><small>" + esc(error.message) +
      "<br>index.html을 더블클릭해서 열었다면, README의 '실행 방법'처럼 python3 -m http.server로 열어 주세요.</small>";
    status.classList.add("error");
  }
}

startApp();
