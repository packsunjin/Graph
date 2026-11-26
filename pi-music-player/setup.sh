#!/usr/bin/env bash
# 라즈베리파이 음악 플레이어 설치 스크립트
# 사용법:  ./setup.sh      (sudo 없이 평소 사용자로 실행)
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -eq 0 ]; then
  echo "sudo 없이 평소 사용자로 실행해 주세요:  ./setup.sh"
  exit 1
fi

echo "== 1/5 필요한 프로그램 설치 =="
sudo apt-get update
sudo apt-get install -y mpv bluez pipewire pipewire-pulse wireplumber \
  libspa-0.2-bluetooth python3-gpiozero python3-lgpio python3-evdev ir-keytable

echo "== 2/5 블루투스 켜기, 권한 설정 =="
sudo rfkill unblock bluetooth || true
sudo systemctl enable --now bluetooth
sudo usermod -aG bluetooth,gpio,audio,input "$USER"
# 재생 버튼 길게 누르기로 전원을 끌 수 있게 허용 (poweroff 명령만 허용)
RULE="/etc/sudoers.d/010-music-player-poweroff"
echo "$USER ALL=(root) NOPASSWD: /usr/sbin/poweroff" | sudo tee "$RULE" >/dev/null
sudo chmod 440 "$RULE"
sudo visudo -cf "$RULE" >/dev/null

echo "== 3/5 모니터 없이도 블루투스 소리가 나도록 설정 =="
# 로그인 화면이 없는 상태(부팅 직후)에서도 블루투스 이어폰을 쓰게 함
mkdir -p ~/.config/wireplumber/bluetooth.lua.d ~/.config/wireplumber/wireplumber.conf.d
cat > ~/.config/wireplumber/bluetooth.lua.d/80-disable-logind.lua <<'EOF'
-- WirePlumber 0.4 (Raspberry Pi OS Bookworm)
bluez_monitor.properties["with-logind"] = false
EOF
cat > ~/.config/wireplumber/wireplumber.conf.d/80-disable-logind.conf <<'EOF'
# WirePlumber 0.5 이상 (Raspberry Pi OS Trixie)
wireplumber.profiles = {
  main = {
    monitor.bluez.seat-monitoring = disabled
  }
}
EOF

echo "== 적외선 리모컨 설정 (수신기: GPIO18) =="
BOOTCFG=/boot/firmware/config.txt
[ -f "$BOOTCFG" ] || BOOTCFG=/boot/config.txt
if ! grep -q "^dtoverlay=gpio-ir" "$BOOTCFG"; then
  printf '\n[all]\n# pi-music-player 적외선 리모컨 수신기\ndtoverlay=gpio-ir,gpio_pin=18\n' | sudo tee -a "$BOOTCFG" >/dev/null
fi
sudo mkdir -p /etc/rc_keymaps
sudo cp "$DIR/carmp3-remote.toml" /etc/rc_keymaps/carmp3.toml
# 리모컨 수신기가 켜질 때 이 키 배치를 쓰도록 등록 (맨 위 줄이 먼저 적용됨)
if ! grep -q "carmp3.toml" /etc/rc_maps.cfg 2>/dev/null; then
  { echo "gpio_ir_recv * /etc/rc_keymaps/carmp3.toml"; cat /etc/rc_maps.cfg 2>/dev/null || true; } \
    | sudo tee /etc/rc_maps.cfg.new >/dev/null
  sudo mv /etc/rc_maps.cfg.new /etc/rc_maps.cfg
fi

echo "== 4/5 음악 폴더 만들기 =="
mkdir -p ~/Music
chmod +x "$DIR"/*.sh "$DIR/player.py"

echo "== 5/5 전원을 켜면 자동으로 실행되게 설정 =="
mkdir -p ~/.config/systemd/user
sed "s|@DIR@|$DIR|g" "$DIR/music-player.service" > ~/.config/systemd/user/music-player.service
# 로그인하지 않아도 부팅하면 바로 실행되게 함
sudo loginctl enable-linger "$USER"
systemctl --user daemon-reload
systemctl --user enable pipewire.socket pipewire-pulse.socket wireplumber.service || true
systemctl --user enable music-player.service

cat <<EOF

설치가 끝났습니다. 다음 순서로 진행하세요.
  1) ~/Music 폴더에 노래 파일을 넣기
  2) 이어폰 페어링:   $DIR/pair.sh
  3) (선택) 절전 설정: $DIR/power-save.sh
  4) 재부팅:          sudo reboot
EOF
