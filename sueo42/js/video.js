// [영상] 시트에 적은 유튜브·구글 드라이브 링크를 화면에 재생할 수 있는 HTML로 바꿔요.
// 링크가 비어 있으면 "영상 준비 중" 상자를 보여줘요.

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

// 링크 → 영상 HTML
function makeVideoHTML(url, label) {
  if (url && url.indexOf("youtu") !== -1) {
    const id = getYoutubeId(url);
    if (id) {
      return '<div class="video"><iframe src="https://www.youtube.com/embed/' + id +
        '?rel=0&playsinline=1" allowfullscreen title="' + esc(label) + '"></iframe></div>';
    }
  }

  if (url && url.indexOf("drive.google.com") !== -1) {
    const id = getDriveId(url);
    if (id) {
      return '<div class="video"><iframe src="https://drive.google.com/file/d/' + id +
        '/preview" allow="autoplay" allowfullscreen title="' + esc(label) + '"></iframe></div>';
    }
  }

  if (url && /\.(mp4|webm)$/i.test(url)) {
    return '<div class="video"><video src="' + esc(url) + '" controls playsinline loop></video></div>';
  }

  // 링크가 없거나 알 수 없는 링크
  return '<div class="video video-empty"><span>🎬</span><p>영상 준비 중</p><small>' + esc(label) + '</small></div>';
}
