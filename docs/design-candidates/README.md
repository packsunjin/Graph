# 수어42 디자인 후보 20개 (2026-11-03)

- 기준: 시안 3 "트루 블랙" (taste-skill 앱 스타일 `true-black-flat`)
  - 바탕 #0c0d0f, 카드 #15171a
  - 라임 #c6f24e는 데이터(해 본 칸)에만, 주 버튼은 흰색
  - 글꼴: Inter + Pretendard
- 화면 구조가 서로 다른 20개. 시안마다 홈 + 직접 해보기 결과 화면
- `sueo42-b20-00-overview.png`: 홈 첫 화면 모음
- `sueo42-b20-NN.png`: 시안별 보드
- `html/NN/home.html`, `html/NN/result.html`: 각 화면의 HTML (브라우저로 열면 됨)
- `list.json`: 번호·이름·한 줄 설명
- `build.js`: 20개를 만든 스크립트
- 사전 영상: 국립국어원 한국수어사전(저작자표시-비영리-변경금지), 원격 주소로 재생
- "민지, 28/42, 연속 6일, 80점"은 화면을 채운 예시 값
- taste-skill 검사기(inspect.mjs)는 이 20개에 끝까지 돌리지 못함. 고른 시안만 다시 검사할 것
