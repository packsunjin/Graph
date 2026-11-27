// 학습지 HTML → PDF 두 개 (완성 자습서 + 빈 학습지)
//
// 사용법: node study/tools/render_pdf.js study/digital/2026-11-27_과학_광합성.html
//   → study/digital/2026-11-27_과학_광합성_자습서.pdf   (정답·필기·강조 전부)
//   → study/digital/2026-11-27_과학_광합성_빈학습지.pdf (가리고 채우기 연습용)
//
// 한글 폰트: Google Fonts를 먼저 쓰고, 막히면 로컬 나눔폰트(apt-get install -y fonts-nanum)로 대체.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const src = process.argv[2];
  if (!src) { console.error('사용법: node render_pdf.js <학습지.html>'); process.exit(1); }
  const abs = path.resolve(src);
  const base = abs.replace(/\.html$/, '');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + abs, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const opts = { printBackground: true, preferCSSPageSize: true };
  await page.evaluate(() => document.body.classList.remove('mode-blank'));
  await page.pdf({ ...opts, path: base + '_자습서.pdf' });
  await page.evaluate(() => document.body.classList.add('mode-blank'));
  await page.pdf({ ...opts, path: base + '_빈학습지.pdf' });

  await browser.close();
  console.log('저장 완료:\n  ' + base + '_자습서.pdf\n  ' + base + '_빈학습지.pdf');
})();
