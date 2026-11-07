#!/usr/bin/env python3
"""FC 온라인 클립 → 유튜브 쇼츠(1080x1920) 만들기.

clips.json 순서대로 각 클립을 [슈팅 - pre, 골 + tail] 구간만 잘라 이어 붙인다.
- 화면: 원본(1738x720)에서 골대 쪽 960x720을 잘라 1080x810으로 키워 검은 배경 가운데(y=560)에 배치
- 자막: Pretendard로 그린 라벨 + 큰 글씨(title.png)를 위에 얹음
- 소리: 게임 소리(오디오 트랙 0번, 라우드니스 -16 LUFS) + 슈팅 순간 효과음(휙 → 쿵)

사용법:
  python3 make_short.py --clips-dir clips --out short.mp4
"""
import argparse, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920
VW, VH, VY = 1080, 810, 560
CROP_W, CROP_H = 960, 720
SFX_LEAD = 0.5          # 효과음 파일에서 '쿵'이 0.5초 지점에 있음


def sh(*args):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *args], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=os.path.join(HERE, "clips.json"))
    ap.add_argument("--clips-dir", default=os.path.join(HERE, "clips"))
    ap.add_argument("--title", default=os.path.join(HERE, "build", "title.png"))
    ap.add_argument("--sfx", default=os.path.join(HERE, "build", "sfx_kick.wav"))
    ap.add_argument("--out", default=os.path.join(HERE, "build", "short.mp4"))
    a = ap.parse_args()

    cfg = json.load(open(a.config, encoding="utf-8"))
    pre, tail = cfg["pre"], cfg["tail"]
    out_dir = os.path.dirname(os.path.abspath(a.out))
    tmp = os.path.join(out_dir, "tmp")
    os.makedirs(tmp, exist_ok=True)

    # 1) 클립별 게임 소리를 구간 길이에 정확히 맞춘 wav로 먼저 뽑는다
    #    (한 그래프 안에서 영상과 같이 concat 하면 오디오가 짧게 잘리는 문제가 있었음)
    inputs, g, cat, kicks, wavs = [], [], "", [], []
    off = 0.0
    for i, c in enumerate(cfg["clips"]):
        src = os.path.join(a.clips_dir, c["file"])
        st = max(0.0, c["kick"] - pre)
        dur = c["goal"] + tail - st
        wav = os.path.join(tmp, f"a{i}.wav")
        sh("-ss", f"{st:.3f}", "-t", f"{dur:.3f}", "-i", src, "-map", "0:a:0",
           "-af", f"aresample=48000,apad,atrim=0:{dur:.3f}", "-ac", "2", "-c:a", "pcm_s16le", wav)
        wavs.append(wav)
        inputs += ["-ss", f"{st:.3f}", "-t", f"{dur:.3f}", "-i", src]
        g.append(
            f"[{i}:v]setpts=PTS-STARTPTS,fps=30,crop={CROP_W}:{CROP_H}:{c['crop_x']}:0,"
            f"scale={VW}:{VH}:flags=lanczos,setsar=1[f{i}];"
            f"color=c=0x0a0a0a:s={W}x{H}:r=30:d={dur:.3f}[bk{i}];"
            f"[bk{i}][f{i}]overlay=0:{VY}:shortest=1[v{i}]")
        cat += f"[v{i}]"
        kicks.append(off + c["kick"] - st)
        off += dur
    n = len(cfg["clips"])

    # 2) 영상: 이어 붙이고 자막 얹기
    inputs += ["-loop", "1", "-framerate", "30", "-i", a.title]
    g.append(f"{cat}concat=n={n}:v=1:a=0[vc]")
    outro = cfg.get("outro")
    outro_img = os.path.join(a.clips_dir, outro["image"]) if outro else None
    if outro and not os.path.exists(outro_img):
        print(f"(마지막 장면 사진 {outro_img} 이 없어 마지막 장면은 빼고 만듭니다)")
        outro = None
    if not outro:
        g.append(f"[{n}:v]format=rgba[tt];[vc][tt]overlay=0:0:shortest=1,format=yuv420p[vout]")
    else:
        # 마지막 강조 장면: 스쿼드 사진(폭 1080, y=600) 고정, 위에 강조 자막
        sec = outro["seconds"]
        outro_text = os.path.join(os.path.dirname(a.title), "outro_text.png")
        inputs += ["-loop", "1", "-framerate", "30", "-t", f"{sec}", "-i", outro_img,
                   "-loop", "1", "-framerate", "30", "-t", f"{sec}", "-i", outro_text]
        g.append(f"[{n}:v]format=rgba[tt];[vc][tt]overlay=0:0:shortest=1,format=yuv420p,setsar=1[vmain]")
        g.append(f"[{n + 1}:v]scale=1080:-2:flags=lanczos,setsar=1[img]")
        g.append(f"color=c=0x0a0a0a:s={W}x{H}:r=30:d={sec}[obk]")
        g.append(f"[obk][img]overlay=0:600:shortest=1[o1]")
        g.append(f"[{n + 2}:v]format=rgba[otxt];[o1][otxt]overlay=0:0:shortest=1,"
                 f"fade=t=in:st=0:d=0.2,format=yuv420p,setsar=1[vout2]")
        g.append("[vmain][vout2]concat=n=2:v=1:a=0[vout]")
        off += sec
    script = os.path.join(tmp, "video_graph.txt")
    open(script, "w").write(";\n".join(g))
    video = os.path.join(tmp, "video.mp4")
    sh(*inputs, "-filter_complex_script", script, "-map", "[vout]",
       "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", video)

    # 3) 소리: 게임 소리 이어 붙여 라우드니스 맞추고, 슈팅 순간 효과음 섞기
    if outro:  # 마지막 장면 동안은 무음
        sil = os.path.join(tmp, "outro_silence.wav")
        sh("-f", "lavfi", "-t", f"{outro['seconds']}", "-i", "anullsrc=r=48000:cl=stereo", "-c:a", "pcm_s16le", sil)
        wavs.append(sil)
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{w}'\n" for w in wavs))
    game = os.path.join(tmp, "game.wav")
    sh("-f", "concat", "-safe", "0", "-i", lst, "-af", "loudnorm=I=-16:TP=-2", "-ar", "48000", game)
    ainputs, ag, mix = ["-i", game], [], "[0:a]"
    for j, k in enumerate(kicks):
        d = max(0, int((k - SFX_LEAD) * 1000))
        ainputs += ["-i", a.sfx]
        ag.append(f"[{j + 1}:a]adelay={d}|{d},volume=0.9[s{j}]")
        mix += f"[s{j}]"
    ag.append(f"{mix}amix=inputs={len(kicks) + 1}:normalize=0:duration=first,alimiter=limit=0.9[aout]")
    audio = os.path.join(tmp, "audio.m4a")
    sh(*ainputs, "-filter_complex", ";".join(ag), "-map", "[aout]", "-c:a", "aac", "-b:a", "192k", audio)

    # 4) 합치기
    sh("-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", "-c", "copy", "-movflags", "+faststart", a.out)
    print(f"done: {a.out} ({off:.1f}s)")
    for c, k in zip(cfg["clips"], kicks):
        print(f"  {c['scorer']}: 슈팅 {k:.2f}s")


if __name__ == "__main__":
    sys.exit(main())
