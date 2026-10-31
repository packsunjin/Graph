# 수어42

지역과 지역 "사이"의 한국수어(수어 사투리)를 찾아보고, 직접 따라 해 보는 웹앱이에요.
HTML·CSS·JS만 쓰고 서버 없이 GitHub Pages로 올려요.

## 실행 방법
`index.html`을 더블클릭하면 데이터(CSV)를 못 불러와요. 아래 중 하나로 여세요.
- VS Code: 확장 "Live Server" 설치 → `index.html` 오른쪽 클릭 → "Open with Live Server"
- 터미널: `sueo42` 폴더에서 `python3 -m http.server` → 브라우저에서 http://localhost:8000
- 카메라('직접 해보기')는 `localhost` 또는 `https` 주소(GitHub Pages)에서만 켜져요.

## 데이터 바꾸기
- 구글 시트 → 파일 → 공유 → 웹에 게시 → CSV 링크를 `config.js`의 `SHEET_CSV_URL`에 붙여 넣기
- 비어 있으면 `data/sample.csv`(예시, 실제 근거 아님)를 보여줘요.
- "검수 여부"가 "검수 완료"인 줄만 앱에 나와요.
- '직접 해보기' 단어는 `config.js`의 `LAB_WORDS` (시트 "42개 단어" 탭 J열 체크된 단어로 바꾸기)

## 파일 안내
| 파일 | 하는 일 |
|---|---|
| `index.html` | 모든 화면의 뼈대 |
| `config.js` | 시트 링크, 열 이름, 지역, 직접 해보기 단어 |
| `css/style.css` | 디자인 |
| `js/data.js` | CSV 불러오기·정리 |
| `js/video.js` | 유튜브·드라이브·mp4 링크 → 영상 |
| `js/list.js` / `js/detail.js` | 단어 목록 / 단어 상세(표준·지역 비교) |
| `js/region.js` / `js/quiz.js` | 지역 모아보기 / 퀴즈 |
| `js/hands.js` | 카메라 + MediaPipe 손 인식(좌표 21개 그리기) |
| `js/lab.js` | 직접 해보기 화면 (기록 → 비슷한 동작 순위 → 사용자가 선택) |
| `js/app.js` | 시작, 탭 바꾸기 |

## 직접 해보기 원칙
- AI는 판정하지 않아요. 점수·확률·"정답/오답"을 보여주지 않고, **비슷해 보이는 순위 + 근거 영상 + 선택지**만 보여줘요.
- 지금 순위는 `js/lab.js`의 `guessSimilar(frames)`가 임시로(무작위) 정해요. 화면에 "시험용 — 아직 학습 전"이라고 나와요.
  AI-Hub 수어 영상으로 학습한 모델이 생기면 이 함수만 바꾸면 돼요.
- 카메라 영상은 기기 안에서만 처리하고 서버로 보내지 않아요. API 키 같은 비밀 정보는 코드에 넣지 않아요.
- 손 인식: MediaPipe Tasks Vision `@mediapipe/tasks-vision@0.10.14` (jsDelivr CDN), 모델 `hand_landmarker.task` (float16/1)
