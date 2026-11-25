#!/usr/bin/env bash
# 블루투스 이어폰 페어링 도우미
# 이어폰을 찾아서 연결하고, 주소를 config.ini에 저장한다.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$DIR/config.ini"
SCAN_SECONDS=20

echo "이어폰을 '페어링 모드'로 만들어 주세요."
echo "(보통 케이스를 연 채로 버튼을 길게 누르거나, 전원 버튼을 5초 이상 누르면 불빛이 깜빡입니다)"
read -rp "준비되면 Enter를 누르세요... "

sudo rfkill unblock bluetooth || true
echo "주변 블루투스 기기를 ${SCAN_SECONDS}초 동안 찾는 중..."
{ echo "power on"; echo "scan on"; sleep "$SCAN_SECONDS"; echo "scan off"; echo "quit"; } \
  | bluetoothctl >/dev/null 2>&1 || true

# 이름이 있는 기기만 보여 줌 (이름 없는 기기는 주소만 나와서 구분하기 어려움)
mapfile -t DEVICES < <(bluetoothctl devices | awk '$1=="Device"' \
  | while read -r _ mac name; do
      [ "$name" = "${mac//:/-}" ] && continue
      echo "$mac $name"
    done)

if [ "${#DEVICES[@]}" -eq 0 ]; then
  echo "기기를 찾지 못했습니다. 이어폰이 페어링 모드인지 확인하고 다시 실행하세요."
  exit 1
fi

echo
echo "찾은 기기:"
for i in "${!DEVICES[@]}"; do
  printf "  %d) %s\n" "$((i + 1))" "${DEVICES[$i]}"
done
read -rp "연결할 이어폰 번호를 입력하세요: " PICK
if ! [[ "$PICK" =~ ^[0-9]+$ ]] || [ "$PICK" -lt 1 ] || [ "$PICK" -gt "${#DEVICES[@]}" ]; then
  echo "잘못된 번호입니다."
  exit 1
fi
MAC="${DEVICES[$((PICK - 1))]%% *}"

echo "$MAC 에 연결하는 중..."
{
  echo "agent NoInputNoOutput"; echo "default-agent"
  echo "pair $MAC"; sleep 10
  echo "trust $MAC"; sleep 1
  echo "connect $MAC"; sleep 8
  echo "quit"
} | bluetoothctl >/dev/null 2>&1 || true

INFO="$(bluetoothctl info "$MAC" || true)"
if ! grep -q "Paired: yes" <<<"$INFO"; then
  echo "페어링에 실패했습니다. 이어폰을 다시 페어링 모드로 만들고 한 번 더 실행해 주세요."
  exit 1
fi
bluetoothctl trust "$MAC" >/dev/null 2>&1 || true

sed -i "s/^mac *=.*/mac = $MAC/" "$CONFIG"
echo "페어링 완료! 이어폰 주소를 config.ini에 저장했습니다: $MAC"
if grep -q "Connected: yes" <<<"$INFO"; then
  echo "지금 연결되어 있습니다."
fi

# 플레이어가 이미 실행 중이면 새 설정으로 다시 시작
systemctl --user try-restart music-player.service 2>/dev/null || true
