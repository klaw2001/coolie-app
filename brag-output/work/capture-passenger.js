// Drives the real Coolie app (Expo web build) as the passenger and captures the screens used in the video.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const OUT = __dirname + '/shots';
const taps = {};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = async (name) => { await wait(350); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
  const find = (text, exact = true) => (text instanceof RegExp ? page.getByText(text) : page.getByText(text, { exact })).filter({ visible: true }).first();
  // Remember where a tap lands (in screenshot pixels) so the video can draw a touch ripple there.
  const tap = async (shotName, target, ms = 900) => {
    const loc = typeof target === 'string' || target instanceof RegExp ? find(target) : target;
    const b = await loc.boundingBox();
    if (shotName && b) (taps[shotName] ??= []).push({ x: (b.x + b.width / 2) * 2, y: (b.y + b.height / 2) * 2 });
    await loc.click({ force: true });
    await wait(ms);
  };

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await wait(3500);
  await shot('p01-gateway');
  await tap('p01-gateway', "I'm a passenger", 1300);
  await shot('p02-welcome');
  await tap(null, 'Skip', 1200);
  await shot('p03-login');
  await tap('p03-login', 'Ananya Sharma', 700);
  await shot('p04-otp');
  await wait(3000);
  await shot('p05-home');

  await tap('p05-home', 'Station Gate → Train', 1400);
  await shot('p06-train');
  await tap('p06-train', '2451873690', 1800);
  await shot('p07-train-filled');
  await tap('p07-train-filled', 'Continue', 1400);
  await shot('p08-point');
  await tap('p08-point', 'Main Entrance (Gate 1)', 900);
  await shot('p09-point-chosen');
  await tap('p09-point-chosen', 'Continue', 1300);
  await shot('p10-luggage');
  const inc = page.getByLabel('Increase').filter({ visible: true });
  await tap('p10-luggage', inc.nth(2), 300);
  await tap('p10-luggage', inc.nth(2), 300);
  await tap('p10-luggage', inc.nth(3), 600);
  await shot('p11-luggage-filled');
  await tap('p11-luggage-filled', 'Continue', 1300);
  await shot('p12-when');
  await tap('p12-when', 'Continue', 1400);
  await shot('p13-review');
  await tap('p13-review', 'Cash after trip', 600);
  await shot('p14-review-cash');
  await tap('p14-review-cash', /^Book coolie ·/, 900);
  for (let i = 0; i < 4; i++) await shot(`p15-searching-${i}`);

  // A simulated coolie accepts after ~10 s; then the coolie walks to the gate on the map.
  await find('Coolie is on the way').waitFor({ timeout: 20000 });
  await wait(300);
  for (let i = 0; i < 36; i++) {
    await page.screenshot({ path: `${OUT}/p16-map-${String(i).padStart(2, '0')}.png` });
    await wait(330);
  }
  console.log('map sequence done');
  await tap('p16-map-35', 'Station', 1000);
  await shot('p17-station');
  // Let the trip play out (auto mode), then the rating screen.
  await find('Luggage delivered!').waitFor({ timeout: 150000 }).catch(() => console.log('no rate title'));
  await wait(1200);
  await shot('p18-complete');

  fs.writeFileSync(`${OUT}/taps-passenger.json`, JSON.stringify(taps, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
