"""학습지 사진(여러 장)을 한 개의 PDF로 묶어 저장한다.

사용법: python3 study/tools/to_pdf.py 출력.pdf 사진1.jpg 사진2.png ...
"""
import sys
from PIL import Image, ImageOps

if len(sys.argv) < 3:
    sys.exit(__doc__)

out, paths = sys.argv[1], sys.argv[2:]
pages = []
for p in paths:
    img = ImageOps.exif_transpose(Image.open(p))  # 휴대폰 사진 회전 바로잡기
    pages.append(img.convert("RGB"))
pages[0].save(out, save_all=True, append_images=pages[1:], resolution=200)
print(f"{out} 저장 완료 ({len(pages)}쪽)")
