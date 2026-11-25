#!/usr/bin/env bash
# 보조배터리로 오래 쓰기 위한 절전 설정
# 사용법:
#   ./power-save.sh             빨간 LED와 랜선 단자 LED를 끄고, 최고 속도를 낮춤
#   ./power-save.sh --wifi-off  위 설정에 더해 와이파이도 끔 (SSH 접속이 안 되니 주의)
#   ./power-save.sh --undo      절전 설정을 모두 되돌림
# 바꾼 설정은 재부팅해야 적용됩니다.
set -euo pipefail

CFG=/boot/firmware/config.txt
[ -f "$CFG" ] || CFG=/boot/config.txt
BEGIN="# --- pi-music-player 절전 설정 시작 ---"
END="# --- pi-music-player 절전 설정 끝 ---"

# 예전에 넣은 절전 설정이 있으면 먼저 지움
sudo sed -i "/^$BEGIN\$/,/^$END\$/d" "$CFG"

if [ "${1:-}" = "--undo" ]; then
  echo "절전 설정을 되돌렸습니다. 재부팅하면 적용됩니다:  sudo reboot"
  exit 0
fi

WIFI="#dtoverlay=disable-wifi"
[ "${1:-}" = "--wifi-off" ] && WIFI="dtoverlay=disable-wifi"

sudo tee -a "$CFG" >/dev/null <<EOF
$BEGIN
[all]
# 빨간 전원 LED 끄기 (초록 LED는 전원이 꺼졌는지 확인하는 데 쓰므로 그대로 둠)
dtparam=pwr_led_trigger=none
dtparam=pwr_led_activelow=off
# 랜선 단자 LED 끄기
dtparam=eth_led0=4
dtparam=eth_led1=4
# 최고 속도 낮추기 (음악 재생에는 충분하고, 열과 전기 사용이 줄어듦)
arm_freq=1000
# 와이파이 끄기 (켜려면 ./power-save.sh 를 옵션 없이 다시 실행)
$WIFI
$END
EOF

echo "절전 설정을 $CFG 에 넣었습니다."
[ "${1:-}" = "--wifi-off" ] && echo "⚠ 재부팅하면 와이파이가 꺼져서 SSH로 접속할 수 없습니다. 되돌리려면 SD카드를 컴퓨터에 꽂고 config.txt 맨 끝의 절전 설정을 지우세요."
echo "재부팅하면 적용됩니다:  sudo reboot"
