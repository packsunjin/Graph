#!/usr/bin/env python3
"""라즈베리파이 블루투스 음악 플레이어.

- 음악 폴더의 노래를 mpv로 재생
- GPIO 버튼 5개로 조작 (재생/일시정지, 다음, 이전, 볼륨 +, 볼륨 -)
- 재생 버튼을 3초 누르면 안전하게 전원 종료
- 블루투스 이어폰 자동 연결, 연결이 끊기면 자동 일시정지
- 마지막으로 듣던 곡과 볼륨을 기억
- 터미널에서 실행하면 키보드로도 조작 가능 (버튼 없이 테스트용)
"""

import configparser
import json
import os
import random
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONFIG_PATH = HERE / "config.ini"
STATE_PATH = Path.home() / ".local/state/pi-music-player/state.json"
AUDIO_EXT = {".mp3", ".flac", ".ogg", ".oga", ".opus", ".m4a", ".aac", ".wav", ".wma"}


def log(*args):
    print(time.strftime("%H:%M:%S"), *args, flush=True)


# ---------------------------------------------------------------- 설정 / 상태

def load_config():
    cfg = configparser.ConfigParser()
    cfg.read(CONFIG_PATH, encoding="utf-8")
    return cfg


def load_state():
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def save_state(state):
    try:
        STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        tmp = STATE_PATH.with_suffix(".tmp")
        tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
        tmp.replace(STATE_PATH)
    except OSError as e:
        log("상태 저장 실패:", e)


def find_music(dirs):
    files = []
    for d in dirs:
        d = Path(os.path.expanduser(d))
        if not d.is_dir():
            continue
        for p in d.rglob("*"):
            if p.suffix.lower() in AUDIO_EXT and p.is_file() and not p.name.startswith("."):
                files.append(str(p))
    files.sort(key=str.lower)
    return files


# ---------------------------------------------------------------- mpv 제어

class Mpv:
    """mpv를 띄우고 JSON IPC 소켓으로 명령을 보낸다."""

    def __init__(self, volume, audio_out):
        self.sock_path = os.path.join(tempfile.gettempdir(), f"pi-music-player-{os.getuid()}.sock")
        try:
            os.unlink(self.sock_path)
        except FileNotFoundError:
            pass
        self.proc = subprocess.Popen(
            [
                "mpv", "--idle=yes", "--no-video", "--no-terminal",
                "--input-ipc-server=" + self.sock_path,
                "--ao=" + audio_out,
                "--volume=%d" % volume, "--volume-max=100",
                "--loop-playlist=inf", "--gapless-audio=weak",
            ],
            stdin=subprocess.DEVNULL,
        )
        self.lock = threading.Lock()
        self.req = 0
        self.sock = None
        for _ in range(100):
            try:
                s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
                s.connect(self.sock_path)
                self.sock = s
                break
            except OSError:
                time.sleep(0.1)
        if self.sock is None:
            raise RuntimeError("mpv에 연결하지 못했습니다. mpv가 설치되어 있나요?")
        self.file = self.sock.makefile("rb")

    def command(self, *args):
        with self.lock:
            self.req += 1
            rid = self.req
            msg = json.dumps({"command": list(args), "request_id": rid}) + "\n"
            self.sock.sendall(msg.encode())
            while True:
                line = self.file.readline()
                if not line:
                    raise RuntimeError("mpv가 종료되었습니다")
                data = json.loads(line)
                if data.get("request_id") == rid:
                    if data.get("error") not in ("success", None):
                        return None
                    return data.get("data")
                # 그 밖의 줄은 이벤트이므로 무시

    def get(self, prop):
        return self.command("get_property", prop)

    def set(self, prop, value):
        return self.command("set_property", prop, value)

    def close(self):
        try:
            self.command("quit")
        except Exception:
            pass
        try:
            self.proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            self.proc.kill()


# ---------------------------------------------------------------- 플레이어

class Player:
    def __init__(self, cfg):
        self.cfg = cfg
        p = cfg["player"]
        self.dirs = [d.strip() for d in p.get("music_dirs", "~/Music").split(",") if d.strip()]
        self.step = p.getint("volume_step", 5)
        self.state = load_state()
        self.shuffle = self.state.get("shuffle", p.getboolean("shuffle", False))
        volume = self.state.get("volume", p.getint("start_volume", 50))
        self.mpv = Mpv(volume, p.get("audio_output", "pipewire,pulse,alsa"))
        self.tracks = []
        self.stop_event = threading.Event()
        self.load_library(resume=True)

    # 재생목록 ---------------------------------------------------------
    def load_library(self, resume=False):
        self.tracks = find_music(self.dirs)
        if not self.tracks:
            log("음악 파일이 없습니다. 이 폴더에 노래를 넣어 주세요:", ", ".join(self.dirs))
            return
        order = list(self.tracks)
        if self.shuffle:
            random.shuffle(order)
        start = 0
        last = self.state.get("track") if resume else None
        if last in order:
            start = order.index(last)
        fd, path = tempfile.mkstemp(suffix=".m3u")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write("\n".join(order) + "\n")
        self.mpv.command("loadlist", path, "replace")
        # mpv가 목록을 다 읽은 뒤 임시 파일을 지움
        threading.Timer(5, lambda: os.path.exists(path) and os.unlink(path)).start()
        if start:
            self.mpv.set("playlist-pos", start)
        self.mpv.set("pause", False)
        log("노래 %d곡을 불러왔습니다 (셔플 %s)" % (len(order), "켜짐" if self.shuffle else "꺼짐"))

    # 버튼 동작 --------------------------------------------------------
    def toggle_pause(self):
        paused = self.mpv.get("pause")
        self.mpv.set("pause", not paused)
        log("일시정지" if not paused else "재생")

    def pause(self):
        self.mpv.set("pause", True)

    def resume(self):
        self.mpv.set("pause", False)

    def next(self):
        self.mpv.command("playlist-next", "force")
        self.mpv.set("pause", False)
        log("다음 곡")

    def prev(self):
        # 3초 넘게 들었으면 처음부터, 아니면 이전 곡 (일반 MP3 플레이어와 같은 방식)
        pos = self.mpv.get("time-pos") or 0
        if pos > 3:
            self.mpv.command("seek", 0, "absolute")
            log("처음부터 다시")
        else:
            self.mpv.command("playlist-prev", "force")
            log("이전 곡")
        self.mpv.set("pause", False)

    def volume(self, delta):
        vol = (self.mpv.get("volume") or 50) + delta
        vol = max(0, min(100, vol))
        self.mpv.set("volume", vol)
        log("볼륨 %d" % vol)

    def toggle_shuffle(self):
        self.shuffle = not self.shuffle
        self.save()
        self.load_library(resume=True)

    def shutdown_device(self):
        log("전원을 끕니다. 초록 LED가 꺼지면 보조배터리를 빼세요.")
        self.save()
        self.mpv.set("pause", True)
        subprocess.call(["sudo", "-n", "/usr/sbin/poweroff"])
        self.stop_event.set()

    # 상태 저장 --------------------------------------------------------
    def save(self):
        try:
            self.state.update(
                track=self.mpv.get("path") or self.state.get("track"),
                volume=self.mpv.get("volume"),
                shuffle=self.shuffle,
            )
        except Exception:
            pass
        save_state(self.state)

    def run_saver(self):
        last = None
        while not self.stop_event.wait(5):
            try:
                now = (self.mpv.get("path"), self.mpv.get("volume"))
            except Exception:
                self.stop_event.set()
                break
            if now != last:
                last = now
                self.save()

    def close(self):
        self.save()
        self.mpv.close()


# ---------------------------------------------------------------- 블루투스

class BluetoothWatcher(threading.Thread):
    """이어폰이 꺼져 있으면 계속 다시 연결을 시도한다."""

    def __init__(self, player, mac, pause_on_disconnect, resume_on_connect):
        super().__init__(daemon=True)
        self.player = player
        self.mac = mac
        self.pause_on_disconnect = pause_on_disconnect
        self.resume_on_connect = resume_on_connect

    def connected(self):
        try:
            out = subprocess.run(["bluetoothctl", "info", self.mac],
                                 capture_output=True, text=True, timeout=10).stdout
        except (OSError, subprocess.TimeoutExpired):
            return False
        return "Connected: yes" in out

    def run(self):
        was = None
        while not self.player.stop_event.is_set():
            now = self.connected()
            if not now:
                subprocess.run(["bluetoothctl", "connect", self.mac],
                               capture_output=True, timeout=20)
                now = self.connected()
            if now != was:
                if now:
                    log("블루투스 이어폰 연결됨")
                    if was is False and self.resume_on_connect:
                        time.sleep(2)  # 소리 출력이 이어폰으로 바뀔 때까지 잠깐 기다림
                        self.player.resume()
                else:
                    log("블루투스 이어폰 연결 안 됨, 다시 시도하는 중")
                    if self.pause_on_disconnect:
                        self.player.pause()
                was = now
            self.player.stop_event.wait(5 if now else 10)


# ---------------------------------------------------------------- 입력

def setup_buttons(player, cfg):
    try:
        from gpiozero import Button
    except ImportError:
        log("gpiozero가 없어서 버튼을 쓰지 않습니다 (키보드로만 조작)")
        return []
    b = cfg["buttons"]
    shutdown_hold = b.getfloat("shutdown_hold_seconds", 3)
    buttons = []

    def make(pin, **kw):
        btn = Button(b.getint(pin), pull_up=True, bounce_time=0.05, **kw)
        buttons.append(btn)
        return btn

    try:
        # 재생 버튼: 짧게 = 재생/일시정지, 길게 = 전원 끄기
        held = {"play": False, "next": False}
        play = make("play", hold_time=shutdown_hold)
        def play_held():
            held["play"] = True
            player.shutdown_device()
        def play_released():
            if not held["play"]:
                player.toggle_pause()
            held["play"] = False
        play.when_held = play_held
        play.when_released = play_released

        # 다음 버튼: 짧게 = 다음 곡, 2초 = 셔플 켜기/끄기
        nxt = make("next", hold_time=2)
        def next_held():
            held["next"] = True
            player.toggle_shuffle()
        def next_released():
            if not held["next"]:
                player.next()
            held["next"] = False
        nxt.when_held = next_held
        nxt.when_released = next_released

        make("prev").when_pressed = player.prev

        # 볼륨 버튼은 누르고 있으면 계속 바뀜
        up = make("volume_up", hold_time=0.4, hold_repeat=True)
        up.when_pressed = up.when_held = lambda: player.volume(player.step)
        down = make("volume_down", hold_time=0.4, hold_repeat=True)
        down.when_pressed = down.when_held = lambda: player.volume(-player.step)
    except Exception as e:  # 라즈베리파이가 아닌 컴퓨터에서 실행한 경우 등
        log("버튼을 켜지 못했습니다:", e)
        for btn in buttons:
            btn.close()
        return []
    log("버튼 준비 완료")
    return buttons


KEY_HELP = "키보드: p=재생/일시정지  n=다음  b=이전  +=볼륨업  -=볼륨다운  s=셔플  r=다시읽기  q=종료"


def keyboard_loop(player):
    log(KEY_HELP)
    for line in sys.stdin:
        cmd = line.strip().lower()
        try:
            if cmd == "p":
                player.toggle_pause()
            elif cmd == "n":
                player.next()
            elif cmd == "b":
                player.prev()
            elif cmd in ("+", "="):
                player.volume(player.step)
            elif cmd == "-":
                player.volume(-player.step)
            elif cmd == "s":
                player.toggle_shuffle()
            elif cmd == "r":
                player.load_library(resume=True)
            elif cmd == "q":
                break
            elif cmd:
                log(KEY_HELP)
        except Exception as e:
            log("오류:", e)
    player.stop_event.set()


# ---------------------------------------------------------------- 시작

def main():
    cfg = load_config()
    player = Player(cfg)
    signal.signal(signal.SIGTERM, lambda *_: player.stop_event.set())

    bt = cfg["bluetooth"]
    mac = bt.get("mac", "").strip()
    if mac:
        BluetoothWatcher(player, mac,
                         bt.getboolean("pause_on_disconnect", True),
                         bt.getboolean("resume_on_connect", True)).start()
    else:
        log("config.ini에 이어폰 주소(mac)가 없습니다. ./pair.sh 로 먼저 페어링하세요.")

    buttons = setup_buttons(player, cfg)  # 변수를 잡아 둬야 버튼이 계속 동작함
    threading.Thread(target=player.run_saver, daemon=True).start()
    if sys.stdin.isatty():
        threading.Thread(target=keyboard_loop, args=(player,), daemon=True).start()

    try:
        while not player.stop_event.wait(1):
            if player.mpv.proc.poll() is not None:
                log("mpv가 종료되어 플레이어를 끝냅니다")
                break
    except KeyboardInterrupt:
        pass
    finally:
        for btn in buttons:
            btn.close()
        player.close()
        log("종료")


if __name__ == "__main__":
    main()
