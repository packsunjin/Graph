# FC 온라인 골 클립 → 유튜브 쇼츠

Medal로 녹화한 FC 온라인 골 클립 여러 개를 세로 쇼츠(1080×1920) 한 편으로 만드는 스크립트입니다.
FFmpeg와 Python(Pillow)만 씁니다.

## 결과물 모양

- 클립마다 **슈팅 3.5초 전 ~ 골 1.3초 뒤**만 잘라 `clips.json` 순서대로 이어 붙임 (골이 들어가기 전에 다음 클립으로 넘어가지 않음)
- 원본(1738×720 울트라와이드)에서 **골대 쪽 960×720**만 잘라 1080×810으로 키워 검은 배경 가운데에 배치
- 위쪽 자막: 연두색 라벨 + 큰 흰 글씨 (Pretendard)
- 소리: 게임 소리 그대로(라우드니스 -16 LUFS) + **발이 공에 닿는 순간 "휙 → 쿵" 효과음**
- 마지막 2.5초: 스쿼드 사진 + 강조 자막 (사진 파일이 없으면 자동으로 빠짐)

## 준비물

```bash
# FFmpeg, Python 3, Pillow, numpy
pip install pillow numpy
# 폰트 (이 폴더에서)
npm pack pretendard@1.3.9 && tar xzf pretendard-1.3.9.tgz
```

## 순서

1. **클립 받기**: `clips/` 폴더에 영상과 마지막 장면 사진(`squad.png`)을 넣습니다.
   구글 드라이브 공유 링크면 `clips.json`의 `drive_id`로 받을 수 있습니다.
   ```bash
   mkdir -p clips && python3 - <<'EOF'
   import json, subprocess
   for c in json.load(open("clips.json", encoding="utf-8"))["clips"]:
       subprocess.run(["curl", "-sSL", "-o", f"clips/{c['file']}",
           f"https://drive.usercontent.google.com/download?id={c['drive_id']}&export=download&confirm=t"], check=True)
   EOF
   ```
2. **골/슈팅 시점 찾기**: `python3 find_goals.py clips/*.mp4`
   - 골 = 왼쪽 위 스코어가 바뀌는 순간 (0.1초 단위)
   - 슈팅 = 소리 피크 후보. 실제 발이 공에 닿는 순간은 보통 이보다 0.05~0.12초 빠르니,
     0.05초 간격 프레임을 직접 보고 정해서 `clips.json`의 `kick`에 적습니다.
   - `crop_x`: 골대가 화면 안에 들어오게 잘라낼 왼쪽 x (0~778). 골대가 오른쪽이면 480~520, 왼쪽이면 150 정도.
3. **자막·효과음 만들기**: `python3 make_assets.py` → `build/title.png`, `build/outro_text.png`, `build/sfx_kick.wav`
4. **영상 만들기**: `python3 make_short.py` → `build/short.mp4`

## clips.json

| 항목 | 뜻 |
|---|---|
| `title.tag` / `title.main` | 위쪽 연두색 라벨 / 큰 글씨 |
| `pre` / `tail` | 슈팅 전 / 골 뒤에 남길 초 |
| `clips[].kick` | 발이 공에 닿는 시점(초, 원본 기준) — 효과음이 여기에 들어감 |
| `clips[].goal` | 스코어가 바뀌는 시점(초) |
| `clips[].crop_x` | 잘라낼 영역의 왼쪽 x |
| `outro` | 마지막 장면: 사진 파일, 길이(초), 라벨, 큰 글씨(`\n` 줄바꿈) |

순서를 바꾸려면 `clips` 배열 순서를 바꾸면 됩니다. (지금은 홀란 골 5개 → 나머지 3개)
