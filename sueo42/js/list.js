// [① 단어 목록] 카테고리 버튼과 검색창으로 단어를 골라 볼 수 있는 화면이에요.

let selectedCategory = "전체";

// 단어 카드 하나의 HTML (지역 점으로 어떤 지역 표현이 있는지 보여줘요)
function wordCardHTML(word) {
  const dots = word.signs.map(function (sign) {
    return '<i class="dot" style="background:' + regionColor(sign.region) + '" title="' + esc(sign.region) + '"></i>';
  }).join("");

  return '<button class="word-card" data-meaning="' + esc(word.meaning) + '">' +
    '<span class="word-category">' + esc(word.category) + '</span>' +
    '<strong>' + esc(word.meaning) + '</strong>' +
    '<span class="dots">' + dots + '</span>' +
    '</button>';
}

// 카드를 누르면 상세 화면으로 가게 연결해요. (지역 화면에서도 같이 사용)
function connectWordCards(box) {
  box.querySelectorAll(".word-card").forEach(function (card) {
    card.addEventListener("click", function () {
      showDetail(card.dataset.meaning, card.dataset.region);
    });
  });
}

function renderList() {
  // 진행률: 목표 단어 수 중 몇 개가 준비됐는지
  const done = APP_DATA.words.length;
  document.getElementById("progress-text").textContent =
    "단어 " + CONFIG.TOTAL_WORDS + "개 중 " + done + "개 준비됨";
  document.getElementById("progress-fill").style.width =
    Math.min(100, (done / CONFIG.TOTAL_WORDS) * 100) + "%";

  // 카테고리 버튼
  const categories = ["전체"];
  APP_DATA.words.forEach(function (word) {
    if (categories.indexOf(word.category) === -1) categories.push(word.category);
  });

  const chipBox = document.getElementById("category-chips");
  chipBox.innerHTML = categories.map(function (cat) {
    return '<button class="chip' + (cat === selectedCategory ? " active" : "") + '" data-cat="' + esc(cat) + '">' + esc(cat) + '</button>';
  }).join("");

  chipBox.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      selectedCategory = chip.dataset.cat;
      renderList();
    });
  });

  // 검색어 + 카테고리로 거르기
  const keyword = document.getElementById("search").value.trim();
  const shown = APP_DATA.words.filter(function (word) {
    const okCategory = selectedCategory === "전체" || word.category === selectedCategory;
    const okKeyword = keyword === "" || word.meaning.indexOf(keyword) !== -1;
    return okCategory && okKeyword;
  });

  const listBox = document.getElementById("word-list");
  if (shown.length === 0) {
    listBox.innerHTML = '<p class="empty">찾는 단어가 없어요.</p>';
    return;
  }
  listBox.innerHTML = shown.map(wordCardHTML).join("");
  connectWordCards(listBox);
}

// 글자를 칠 때마다 목록 다시 그리기
document.getElementById("search").addEventListener("input", renderList);
