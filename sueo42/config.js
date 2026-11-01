// [설정 파일] 단어 데이터 주소, 열 이름, 게임 규칙(점수·단계)을 바꾸는 곳이에요.
// 시트나 규칙을 바꾸고 싶으면 이 파일만 고치면 돼요.

const CONFIG = {
  // 구글 시트 → 파일 → 공유 → 웹에 게시 → "CSV" 로 게시한 링크를 따옴표 안에 붙여 넣으세요.
  // 비어 있으면 아래 data/words.csv 파일을 사용해요.
  SHEET_CSV_URL: "",

  // 시트 링크가 비어 있을 때 쓰는 파일
  LOCAL_CSV_URL: "data/words.csv",

  // CSV 첫 줄(제목 줄)에 적힌 열 이름이에요. 시트 열 이름을 바꾸면 여기도 똑같이 바꿔 주세요.
  COLUMNS: {
    number: "번호",
    name: "단어",            // 화면에 보일 대표 단어
    headword: "사전 표제어",  // 예: 괜찮다,무방하다
    handshape: "수형 설명",
    video: "영상",            // 사전 mp4 주소 (없으면 빈칸)
    category: "분류",
    page: "항목 페이지",      // 사전 항목 링크
    aihub: "AI-Hub 문장 수",
    stage: "단계"             // 1~7
  },

  // 영상·설명 출처 문구
  DICT_SOURCE: "국립국어원 한국수어사전 (저작자표시-비영리-변경금지)",

  // 단계 하나에 들어가는 단어 수 (단계 칸이 비어 있을 때 번호 순서로 나눌 때 사용)
  WORDS_PER_STAGE: 6,

  // ---- 학습하기 ① 뜻 맞히기 ----
  QUIZ_POINT: 10,    // 맞히면 받는 점수
  QUIZ_CHOICES: 4,   // 보기 개수
  RANKING_SIZE: 10,  // 랭킹에 보여줄 사람 수

  // ---- 학습하기 ② 직접 해보기 ----
  LAB_RECORD_SECONDS: 3, // [동작 기록]을 누르면 몇 초 동안 손 좌표를 기록할지
  LAB_RANK_SIZE: 2,      // 비슷해 보이는 동작을 몇 개까지 보여줄지

  // 학습된 손동작 모델(TensorFlow.js). 아직 없으니 빈칸 → 시험용(무작위 순서)으로 동작해요.
  // 모델을 넣으면 예: MODEL_URL: "model/model.json", MODEL_LABELS_URL: "model/labels.json"
  MODEL_URL: "",
  MODEL_LABELS_URL: "",
  TFJS_URL: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"
};
