// [AI 모델] 기록한 손 좌표를 보고 "비슷해 보이는 단어 순위"를 만드는 곳이에요.
// 학습된 모델(TensorFlow.js, config.js의 MODEL_URL)이 있으면 그 모델을 쓰고,
// 없으면 시험용 자리표시(무작위 순서)로 동작해요.
// 중요: 순위(단어 이름 목록)만 돌려줘요. 점수·확률은 돌려주지도, 화면에 보여주지도 않아요.

const aiModel = {
  model: null,  // TensorFlow.js 모델 (없으면 null)
  labels: [],   // 모델 출력 순서대로 적힌 단어 이름 (labels.json)
  tried: false  // 불러오기를 이미 시도했는지
};

// 모델이 준비됐는지 (화면에 "시험용" 표시를 할지 정할 때 사용)
function isModelReady() {
  return !!aiModel.model;
}

// <script> 태그로 TensorFlow.js를 불러와요. (모델이 있을 때만)
function loadScript(url) {
  return new Promise(function (resolve, reject) {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 모델 불러오기. MODEL_URL이 비어 있거나 실패하면 null → 자리표시로 동작
async function loadModel() {
  if (aiModel.tried) return aiModel.model;
  aiModel.tried = true;
  if (!CONFIG.MODEL_URL) return null;

  try {
    if (!window.tf) await loadScript(CONFIG.TFJS_URL);
    aiModel.model = await tf.loadLayersModel(CONFIG.MODEL_URL);
    const response = await fetch(CONFIG.MODEL_LABELS_URL);
    aiModel.labels = await response.json();
  } catch (error) {
    console.warn("손동작 모델을 불러오지 못해서 시험용으로 동작해요.", error);
    aiModel.model = null;
  }
  return aiModel.model;
}

// 손 좌표 → 모델에 넣을 숫자 목록
// 장면 30개로 맞추고, 손마다 손목(0번)을 원점으로, 손 크기(손목~중지 뿌리 9번)로 나눠요.
// ★ 모델을 학습할 때(AI-Hub 키포인트)도 꼭 이 방법과 똑같이 바꿔야 해요.
const MODEL_FRAMES = 30;

function normalizeHand(points) {
  if (!points) return new Array(21 * 2).fill(0);
  const wrist = points[0];
  const size = Math.hypot(points[9].x - wrist.x, points[9].y - wrist.y) || 1;
  const out = [];
  points.forEach(function (p) {
    out.push((p.x - wrist.x) / size, (p.y - wrist.y) / size);
  });
  return out;
}

function framesToFeatures(frames) {
  const features = [];
  for (let i = 0; i < MODEL_FRAMES; i++) {
    const frame = frames[Math.floor(i * frames.length / MODEL_FRAMES)];
    const hands = frame ? frame.hands : [];
    features.push(normalizeHand(hands[0]).concat(normalizeHand(hands[1])));
  }
  return features; // [30][84]
}

// 비슷해 보이는 단어 순위 (단어 이름 목록, 많아야 LAB_RANK_SIZE개)
function guessSimilar(frames) {
  const handFrames = frames.filter(function (f) { return f.hands.length > 0; });
  if (handFrames.length === 0) return []; // 손이 안 잡혔으면 순위 없음

  if (isModelReady()) {
    const input = tf.tensor3d([framesToFeatures(handFrames)]);
    const output = aiModel.model.predict(input);
    const values = Array.from(output.dataSync());
    input.dispose();
    output.dispose();
    // 큰 값 순서대로 단어 이름만 꺼내요. (값 자체는 버려요)
    const order = values.map(function (v, i) { return i; })
      .sort(function (a, b) { return values[b] - values[a]; });
    return order.map(function (i) { return aiModel.labels[i]; })
      .filter(function (name) { return findWord(name); })
      .slice(0, CONFIG.LAB_RANK_SIZE);
  }

  // ★ 시험용 자리표시: 학습한 모델이 없어서 순서를 무작위로 정해요.
  return shuffle(APP_DATA.words.map(function (w) { return w.name; })).slice(0, CONFIG.LAB_RANK_SIZE);
}
