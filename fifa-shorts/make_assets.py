#!/usr/bin/env python3
"""자막 이미지(title.png)와 슈팅 효과음(sfx_kick.wav)을 만든다.

폰트: Pretendard (npm 패키지에서 받음)
  npm pack pretendard@1.3.9 && tar xzf pretendard-1.3.9.tgz  → package/dist/public/static/*.otf
"""
import argparse, json, os, subprocess
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
LIME = (198, 255, 61, 255)


def make_title(tag, main, font_dir, out, y=250, size=150):
    """연두색 라벨(tag) + 큰 흰 글씨(main, 줄바꿈 가능)를 1080x1920 투명 PNG로 그린다."""
    W, H = 1080, 1920
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    tag_font = ImageFont.truetype(os.path.join(font_dir, "Pretendard-ExtraBold.otf"), 64)
    bb = d.textbbox((0, 0), tag, font=tag_font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    px, py = 34, 18
    pw, ph = tw + 2 * px, th + 2 * py
    x = (W - pw) // 2
    d.rounded_rectangle((x, y, x + pw, y + ph), radius=ph // 2, fill=LIME)
    d.text((x + px - bb[0], y + py - bb[1]), tag, font=tag_font, fill=(10, 10, 10, 255))
    lines = main.split("\n")
    while True:  # 화면 폭에 맞게 큰 글씨 크기 자동 조절
        big = ImageFont.truetype(os.path.join(font_dir, "Pretendard-Black.otf"), size)
        if max(d.textbbox((0, 0), ln, font=big)[2] - d.textbbox((0, 0), ln, font=big)[0] for ln in lines) <= W - 120:
            break
        size -= 4
    ty = y + ph + 28
    for ln in lines:
        bb = d.textbbox((0, 0), ln, font=big)
        d.text(((W - (bb[2] - bb[0])) // 2 - bb[0], ty - bb[1]), ln, font=big, fill=(255, 255, 255, 255))
        ty += int(size * 1.12)
    im.save(out)


def make_sfx(out):
    # 0~0.5초: 점점 커지는 '휙'(노이즈), 0.5초: 묵직한 '쿵'(하강 사인 + 노이즈 버스트) + 약한 잔향
    expr = ("if(lt(t,0.5),0.35*(random(0)*2-1)*pow(t/0.5,3),"
            "0.95*sin(2*PI*(36+170*exp(-25*(t-0.5)))*(t-0.5))*exp(-4*(t-0.5))"
            "+0.3*(random(1)*2-1)*exp(-20*(t-0.5)))")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "lavfi",
                    "-i", f"aevalsrc=exprs='{expr}':d=1.8:s=48000",
                    "-af", "highpass=f=25,lowpass=f=7000,aecho=0.8:0.4:70|140:0.25|0.15",
                    "-ac", "2", out], check=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=os.path.join(HERE, "clips.json"))
    ap.add_argument("--font-dir", default=os.path.join(HERE, "package", "dist", "public", "static"))
    ap.add_argument("--out-dir", default=os.path.join(HERE, "build"))
    a = ap.parse_args()
    os.makedirs(a.out_dir, exist_ok=True)
    cfg = json.load(open(a.config, encoding="utf-8"))
    t = cfg["title"]
    make_title(t["tag"], t["main"], a.font_dir, os.path.join(a.out_dir, "title.png"))
    made = ["title.png"]
    if "outro" in cfg:  # 마지막 강조 장면 자막: 사진 위쪽에 라벨 + 두 줄 큰 글씨
        o = cfg["outro"]
        make_title(o["tag"], o["main"], a.font_dir, os.path.join(a.out_dir, "outro_text.png"), y=120, size=130)
        made.append("outro_text.png")
    make_sfx(os.path.join(a.out_dir, "sfx_kick.wav"))
    made.append("sfx_kick.wav")
    print(", ".join(made), "->", a.out_dir)
