// [영상] 사전 mp4 주소를 <video>로 보여주고, 그 아래에 사전 출처를 붙여요.
// 주소가 비어 있으면 "영상 준비 중" 상자를 보여줘요. (유튜브·구글 드라이브 링크도 돼요)

// http/https 로 시작하는 주소만 써요. (이상한 주소가 링크로 들어가지 않게)
function safeUrl(url) {
  return /^https?:\/\//i.test(url || "") ? url : "";
}

// 유튜브 링크에서 영상 ID만 꺼내요. (youtu.be/ID, watch?v=ID, shorts/ID, embed/ID 모두 가능)
function getYoutubeId(url) {
  const match = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

// 구글 드라이브 링크에서 파일 ID만 꺼내요. (/file/d/ID/... 또는 ?id=ID)
function getDriveId(url) {
  const match = url.match(/\/file\/d\/([A-Za-z0-9_-]+)/) || url.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// 영상 주소가 있는 단어인지
function hasVideo(word) {
  return !!(word && safeUrl(word.video));
}

// 링크 → 영상 HTML
function makeVideoHTML(url, label) {
  url = safeUrl(url);

  if (url && url.indexOf("youtu") !== -1 && getYoutubeId(url)) {
    return '<div class="video"><iframe src="https://www.youtube.com/embed/' + getYoutubeId(url) +
      '?rel=0&playsinline=1" allowfullscreen title="' + esc(label) + '"></iframe></div>';
  }

  if (url && url.indexOf("drive.google.com") !== -1 && getDriveId(url)) {
    return '<div class="video"><iframe src="https://drive.google.com/file/d/' + getDriveId(url) +
      '/preview" allow="autoplay" allowfullscreen title="' + esc(label) + '"></iframe></div>';
  }

  if (url) {
    // 사전 mp4: 소리 없이 반복 재생
    return '<div class="video"><video src="' + esc(url) + '" controls playsinline loop muted autoplay></video></div>';
  }

  // 주소가 없을 때
  return '<div class="video video-empty"><p>영상 준비 중</p><small>' + esc(label) + '</small></div>';
}

// 영상 아래 출처 한 줄 (국립국어원 한국수어사전 + 항목 페이지 링크)
function dictSourceHTML(word) {
  const page = safeUrl(word && word.page);
  return '<p class="source">출처: ' + esc(CONFIG.DICT_SOURCE) +
    (page ? ' · <a href="' + esc(page) + '" target="_blank" rel="noopener">사전에서 보기</a>' : '') +
    '</p>';
}

// 단어 하나의 영상 + 출처
function wordVideoHTML(word) {
  return makeVideoHTML(word ? word.video : "", word ? word.name : "") + dictSourceHTML(word);
}

// 다른 화면으로 갈 때 재생 중인 사전 영상을 멈춰요. (카메라 화면은 건드리지 않아요)
function pauseAllVideos() {
  document.querySelectorAll(".video video").forEach(function (video) { video.pause(); });
}
