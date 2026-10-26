// [데이터] 구글 시트 CSV(또는 예시 CSV)를 불러와서 앱에서 쓰기 좋은 모양으로 바꿔요.
// "검수 완료"인 줄만 남기고, 같은 "의미"끼리 묶어서 단어 목록을 만들어요.

// 앱 전체에서 함께 쓰는 데이터
const APP_DATA = {
  signs: [], // 표현 하나하나 (시트의 한 줄 = 표현 하나)
  words: []  // 같은 의미끼리 묶은 단어 목록
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

// 표를 { meaning: "...", region: "..." } 같은 객체 목록으로 바꿔요.
function rowsToSigns(rows) {
  const header = rows[0].map(function (h) { return h.trim(); });
  const cols = CONFIG.COLUMNS;
  const signs = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // 열 이름으로 칸 값을 찾는 작은 함수
    function get(name) {
      const index = header.indexOf(name);
      return index === -1 ? "" : (row[index] || "").trim();
    }

    const sign = {
      meaning: get(cols.meaning),
      id: get(cols.id),
      category: get(cols.category) || "기타",
      region: get(cols.region),
      evidence: get(cols.evidence),
      source: get(cols.source),
      video: get(cols.video),
      review: get(cols.review)
    };

    // 검수 완료 + 의미가 적힌 줄만 사용
    if (sign.meaning && sign.review === CONFIG.APPROVED_TEXT) {
      signs.push(sign);
    }
  }
  return signs;
}

// 같은 의미끼리 묶어서 단어 목록을 만들어요.
function groupWords(signs) {
  const words = [];
  signs.forEach(function (sign) {
    let word = words.find(function (w) { return w.meaning === sign.meaning; });
    if (!word) {
      word = { meaning: sign.meaning, category: sign.category, signs: [] };
      words.push(word);
    }
    word.signs.push(sign);
  });
  return words;
}

// 시트(또는 예시 파일)를 불러와서 APP_DATA를 채워요.
async function loadData() {
  const url = CONFIG.SHEET_CSV_URL || CONFIG.SAMPLE_CSV_URL;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("CSV를 불러오지 못했어요 (" + response.status + ")");
  }
  const text = await response.text();
  APP_DATA.signs = rowsToSigns(parseCSV(text));
  APP_DATA.words = groupWords(APP_DATA.signs);
}

// 지역 이름으로 색깔을 찾아요. (표준은 회색)
function regionColor(name) {
  const region = CONFIG.REGIONS.find(function (r) { return r.name === name; });
  return region ? region.color : "#8a8f98";
}
