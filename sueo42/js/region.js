// [③ 지역 모아보기] 지도나 지역 버튼을 누르면 그 지역의 수어 표현만 모아서 보여줘요.

let selectedRegion = CONFIG.REGIONS[0].name;

// 아주 단순하게 그린 한반도 남쪽 지도 (진짜 지도 모양이 아니라 위치만 비슷하게)
const MAP_SHAPES = {
  "서울·경기": { points: "40,20 100,15 105,70 70,85 35,70", labelX: 70, labelY: 50 },
  "충청": { points: "35,70 70,85 105,70 120,95 110,130 50,130 30,105", labelX: 75, labelY: 108 },
  "경상": { points: "105,70 170,80 180,170 150,215 110,205 110,130 120,95", labelX: 145, labelY: 145 },
  "전라": { points: "30,105 50,130 110,130 110,205 70,225 25,210 20,150", labelX: 65, labelY: 175 }
};

function mapHTML() {
  let shapes = "";
  CONFIG.REGIONS.forEach(function (region) {
    const shape = MAP_SHAPES[region.name];
    if (!shape) return; // 설정에 지역을 추가했는데 지도 모양이 없으면 버튼으로만 보여요
    const active = region.name === selectedRegion;
    shapes +=
      '<g class="map-region' + (active ? " active" : "") + '" data-region="' + esc(region.name) + '">' +
      '<polygon points="' + shape.points + '" fill="' + region.color + '"></polygon>' +
      '<text x="' + shape.labelX + '" y="' + shape.labelY + '">' + esc(region.name) + '</text>' +
      '</g>';
  });

  return '<svg class="map" viewBox="0 0 200 260" role="img" aria-label="지역 지도">' +
    // 범위 밖 지역(강원·제주)은 회색
    '<polygon class="map-off" points="100,15 160,10 170,80 105,70"></polygon>' +
    '<ellipse class="map-off" cx="60" cy="248" rx="22" ry="9"></ellipse>' +
    shapes +
    '</svg>';
}

function renderRegion() {
  document.getElementById("region-map").innerHTML = mapHTML();

  const chipBox = document.getElementById("region-chips");
  chipBox.innerHTML = CONFIG.REGIONS.map(function (region) {
    const count = APP_DATA.signs.filter(function (s) { return s.region === region.name; }).length;
    const active = region.name === selectedRegion;
    return '<button class="chip' + (active ? " active" : "") + '" data-region="' + esc(region.name) + '"' +
      (active ? ' style="background:' + region.color + ';border-color:' + region.color + '"' : "") + '>' +
      esc(region.name) + ' <small>' + count + '</small></button>';
  }).join("");

  // 지도 조각과 버튼 모두 눌러서 지역을 바꿀 수 있어요.
  document.querySelectorAll("#region-map [data-region], #region-chips [data-region]").forEach(function (el) {
    el.addEventListener("click", function () {
      selectedRegion = el.dataset.region;
      renderRegion();
    });
  });

  // 선택한 지역의 표현 목록
  const signs = APP_DATA.signs.filter(function (s) { return s.region === selectedRegion; });
  const listBox = document.getElementById("region-list");
  if (signs.length === 0) {
    listBox.innerHTML = '<p class="empty">' + esc(selectedRegion) + ' 표현이 아직 없어요.</p>';
    return;
  }

  listBox.innerHTML = signs.map(function (sign) {
    return '<button class="word-card" data-meaning="' + esc(sign.meaning) + '" data-region="' + esc(sign.region) + '">' +
      '<span class="word-category">' + esc(sign.category) + '</span>' +
      '<strong>' + esc(sign.meaning) + '</strong>' +
      '<span class="dots"><i class="dot" style="background:' + regionColor(sign.region) + '"></i></span>' +
      '</button>';
  }).join("");

  connectWordCards(listBox);
}
