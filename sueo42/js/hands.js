// [손 인식] 카메라를 켜고, MediaPipe 손 인식 모델로 손가락 마디 21개 좌표를 찾아 캔버스에 점·선으로 그려요.
// 카메라 영상은 이 기기(브라우저) 안에서만 처리하고, 어디에도 보내지 않아요.

// MediaPipe 버전을 고정해 둬요. (버전이 바뀌면 사용법이 달라질 수 있어서)
const MEDIAPIPE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// 손가락 마디를 잇는 선 (0 = 손목, 4 = 엄지 끝, 8 = 검지 끝 …)
const HAND_LINES = [
  [0, 1], [1, 2], [2, 3], [3, 4],         // 엄지
  [0, 5], [5, 6], [6, 7], [7, 8],         // 검지
  [5, 9], [9, 10], [10, 11], [11, 12],    // 중지
  [9, 13], [13, 14], [14, 15], [15, 16],  // 약지
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // 소지
];

const camera = {
  stream: null,       // 카메라 스트림
  video: null,        // 카메라를 보여주는 <video>
  canvas: null,       // 손 좌표를 그리는 <canvas>
  loopId: null,       // 반복 그리기 번호 (멈출 때 사용)
  onHands: null       // 손 좌표를 찾을 때마다 부를 함수 (녹화할 때 사용)
};

let handModel = null; // 한 번 불러온 모델은 계속 써요.

// 모델 불러오기 (처음 한 번만, 몇 초 걸려요)
async function loadHandModel() {
  if (handModel) return handModel;
  const vision = await import(MEDIAPIPE_URL + "/vision_bundle.mjs");
  const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_URL + "/wasm");
  const options = {
    baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 2
  };
  try {
    handModel = await vision.HandLandmarker.createFromOptions(fileset, options);
  } catch (error) {
    // 그래픽(GPU)을 못 쓰는 기기면 CPU로 다시 시도
    options.baseOptions.delegate = "CPU";
    handModel = await vision.HandLandmarker.createFromOptions(fileset, options);
  }
  return handModel;
}

// 카메라 켜기. 실패하면 이유를 한국어 문장으로 던져요.
async function startCamera(video, canvas) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("이 브라우저에서는 카메라를 쓸 수 없어요. https 주소(GitHub Pages)나 localhost로 열어 주세요.");
  }
  try {
    camera.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false
    });
  } catch (error) {
    if (error.name === "NotAllowedError") {
      throw new Error("카메라 권한이 거부됐어요. 주소창 옆 자물쇠(또는 설정)에서 카메라를 '허용'으로 바꾸고 다시 눌러 주세요.");
    }
    if (error.name === "NotFoundError") {
      throw new Error("카메라를 찾지 못했어요. 카메라가 있는 기기에서 열어 주세요.");
    }
    throw new Error("카메라를 켜지 못했어요. 다른 앱이 카메라를 쓰고 있는지 확인해 주세요.");
  }
  camera.video = video;
  camera.canvas = canvas;
  video.srcObject = camera.stream;
  await video.play();
}

// 카메라 끄기 (다른 탭으로 가면 app.js가 불러요)
function stopCamera() {
  if (camera.loopId) cancelAnimationFrame(camera.loopId);
  camera.loopId = null;
  camera.onHands = null;
  if (camera.stream) {
    camera.stream.getTracks().forEach(function (track) { track.stop(); });
  }
  camera.stream = null;
  if (camera.video) camera.video.srcObject = null;
  stopReplay();
}

// 매 화면마다 손 좌표를 찾아서 그려요.
function startHandLoop() {
  function step() {
    if (!camera.stream || !handModel) return;
    const video = camera.video;
    if (video.readyState >= 2) {
      const result = handModel.detectForVideo(video, performance.now());
      drawHands(camera.canvas, result.landmarks, video.videoWidth, video.videoHeight);
      if (camera.onHands) camera.onHands(result.landmarks);
    }
    camera.loopId = requestAnimationFrame(step);
  }
  step();
}

// hands: [[{x,y,z} × 21], …] (x, y는 0~1 사이 비율)
function drawHands(canvas, hands, width, height) {
  canvas.width = width || 640;
  canvas.height = height || 480;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  (hands || []).forEach(function (points) {
    ctx.strokeStyle = "#7cf5d0";
    ctx.lineWidth = 4;
    HAND_LINES.forEach(function (line) {
      const a = points[line[0]];
      const b = points[line[1]];
      ctx.beginPath();
      ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
      ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
      ctx.stroke();
    });
    ctx.fillStyle = "#ff5c8a";
    points.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

// ---- 기록한 좌표 다시 보기 ----
let replayId = null;

// frames: [{ t: 시간(ms), hands: [...] }, …] 를 캔버스에 계속 반복해서 그려요.
function startReplay(canvas, frames) {
  stopReplay();
  if (frames.length === 0) return;
  const total = frames[frames.length - 1].t || 1;
  const startTime = performance.now();

  function step() {
    const now = (performance.now() - startTime) % total;
    const frame = frames.find(function (f) { return f.t >= now; }) || frames[frames.length - 1];
    drawHands(canvas, frame.hands, 640, 480);
    replayId = requestAnimationFrame(step);
  }
  step();
}

function stopReplay() {
  if (replayId) cancelAnimationFrame(replayId);
  replayId = null;
}
