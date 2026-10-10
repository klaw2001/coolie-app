// Renders chosen moments of the composition to PNG for review.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const times = process.argv.slice(3).map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../composition/index.html');
  await page.evaluate(() => window.READY);
  for (const t of times) {
    await page.evaluate((t) => window.render(t), t);
    await page.screenshot({ path: `${process.argv[2]}/still-${t.toFixed(2)}.png` });
  }
  if (errs.length) console.log(errs.join('\n'));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
