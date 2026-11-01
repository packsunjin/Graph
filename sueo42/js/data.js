// [데이터] 단어 CSV(구글 시트 또는 data/words.csv)를 불러와서 앱에서 쓰기 좋은 모양으로 바꿔요.
// 한 줄 = 단어 하나. 단어마다 단계(1~7)가 있어요.

// 앱 전체에서 함께 쓰는 데이터
const APP_DATA = {
  words: [] // { number, name, headword, handshape, video, category, page, aihub, stage }
};

// CSV 글자를 표(줄 → 칸)로 바꿔요. 따옴표로 감싼 칸 안의 쉼표·줄바꿈도 처리해요.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'; // "" 는 따옴표 한 개
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  // 마지막 줄 처리
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// 표를 단어 목록으로 바꿔요.
function rowsToWords(rows) {
  const header = rows[0].map(function (h) { return h.replace(/^﻿/, "").trim(); });
  const cols = CONFIG.COLUMNS;
  const words = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // 열 이름으로 칸 값을 찾는 작은 함수
    function get(name) {
      const index = header.indexOf(name);
      return index === -1 ? "" : (row[index] || "").trim();
    }

    const name = get(cols.name);
    if (!name) continue; // 단어가 비어 있는 줄은 건너뛰기

    const order = words.length; // 0부터 세는 순서
    words.push({
      number: parseInt(get(cols.number), 10) || order + 1,
      name: name,
      headword: get(cols.headword),
      handshape: get(cols.handshape),
      video: get(cols.video),
      category: get(cols.category),
      page: get(cols.page),
      aihub: get(cols.aihub),
      // 단계 칸이 비어 있으면 순서대로 6개씩 나눠요.
      stage: parseInt(get(cols.stage), 10) || Math.floor(order / CONFIG.WORDS_PER_STAGE) + 1
    });
  }
  return words;
}

// 시트(또는 data/words.csv)를 불러와서 APP_DATA를 채워요.
async function loadData() {
  const url = CONFIG.SHEET_CSV_URL || CONFIG.LOCAL_CSV_URL;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("CSV를 불러오지 못했어요 (" + response.status + ")");
  }
  const text = await response.text();
  APP_DATA.words = rowsToWords(parseCSV(text));
  if (APP_DATA.words.length === 0) {
    throw new Error("CSV에 단어가 한 줄도 없어요. 첫 줄 열 이름이 config.js의 COLUMNS와 같은지 확인해 주세요.");
  }
}

// 단어 이름으로 단어 찾기
function findWord(name) {
  return APP_DATA.words.find(function (w) { return w.name === name; }) || null;
}

// 단계 번호 목록 (예: [1, 2, 3, 4, 5, 6, 7])
function stageList() {
  const list = [];
  APP_DATA.words.forEach(function (w) {
    if (list.indexOf(w.stage) === -1) list.push(w.stage);
  });
  return list.sort(function (a, b) { return a - b; });
}

// 그 단계의 단어들
function stageWords(stage) {
  return APP_DATA.words.filter(function (w) { return w.stage === stage; });
}

// 배열 섞기 (원래 배열은 그대로 두고 새 배열을 돌려줘요)
function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}
