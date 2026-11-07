#!/usr/bin/env python3
"""클립에서 골 시점(왼쪽 위 스코어가 바뀌는 순간)과 슈팅 후보(소리 피크)를 찾는다.

- 골: 스코어 숫자 영역(원본 1738x720 기준 x=205, y=62, 56x26)을 0.1초 간격으로 보고,
      첫 프레임과 비교해 픽셀이 계단처럼 바뀌어 유지되는 첫 시점을 출력한다.
      (스코어보드가 사라지는 축하 장면/리플레이도 크게 바뀌므로, 결과는 눈으로 한 번 확인할 것)
- 슈팅: 골 2.2초 전부터 고음역 소리 피크 2개를 후보로 출력한다.
        실제 발이 공에 닿는 순간은 이보다 0.05~0.12초 빠른 경우가 많아, 0.05초 간격 프레임으로 확인해서
        clips.json 의 kick 값을 정한다.

사용법: python3 find_goals.py clips/*.mp4
"""
import subprocess, sys
import numpy as np

SC_X, SC_Y, SC_W, SC_H = 205, 62, 56, 26


def score_change(path, thresh=5, hold=5):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf",
                          f"fps=10,crop={SC_W}:{SC_H}:{SC_X}:{SC_Y},format=gray",
                          "-f", "rawvideo", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, SC_H, SC_W).astype(float)
    d = np.abs(a - a[0]).mean((1, 2))
    for i in range(len(d) - hold):
        if all(d[j] > thresh for j in range(i, i + hold)):
            return i / 10
    return None


def kick_candidates(path, goal):
    lo = max(0.0, goal - 2.2)
    out = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{lo}", "-t", "2.1", "-i", path, "-map", "0:a:0", "-af",
                          "highpass=f=1200,asetnsamples=960,astats=metadata=1:reset=1,"
                          "ametadata=print:key=lavfi.astats.Overall.Peak_level:file=-",
                          "-f", "null", "-"], capture_output=True, text=True).stdout
    peaks, t = [], None
    for line in out.splitlines():
        if "pts_time" in line:
            t = float(line.split("pts_time:")[1].split()[0])
        elif "Peak_level" in line and t is not None:
            v = line.split("=")[1]
            if v not in ("-inf", "inf"):
                peaks.append((float(v), lo + t))
    peaks.sort(reverse=True)
    return [round(p[1], 2) for p in peaks[:2]]


if __name__ == "__main__":
    for p in sys.argv[1:]:
        g = score_change(p)
        k = kick_candidates(p, g) if g is not None else []
        print(f"{p}: goal≈{g}s  kick 후보={k}")
