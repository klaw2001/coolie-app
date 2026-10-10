// Passenger books, hands off to the Coolie Partner app, and Ramesh (demo partner) accepts. Captures the partner screens.
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
  const tap = async (shotName, target, ms = 900) => {
    const loc = typeof target === 'string' || target instanceof RegExp ? find(target) : target;
    const b = await loc.boundingBox();
    if (shotName && b) (taps[shotName] ??= []).push({ x: (b.x + b.width / 2) * 2, y: (b.y + b.height / 2) * 2 });
    await loc.click({ force: true });
    await wait(ms);
  };

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await wait(3500);
  await tap(null, "I'm a passenger", 1300);
  await tap(null, 'Skip', 1200);
  await tap(null, 'Ananya Sharma', 3800);
  await tap(null, 'Station Gate → Train', 1400);
  await tap(null, '2451873690', 1800);
  await tap(null, 'Continue', 1400);
  await tap(null, 'Main Entrance (Gate 1)', 900);
  await tap(null, 'Continue', 1300);
  const inc = page.getByLabel('Increase').filter({ visible: true });
  await tap(null, inc.nth(2), 300);
  await tap(null, inc.nth(3), 600);
  await tap(null, 'Continue', 1300);
  await tap(null, 'Continue', 1400);
  await tap(null, 'Cash after trip', 600);
  await tap(null, /^Book coolie ·/, 2000);
  await tap(null, 'Open Coolie Partner app', 2800);
  await shot('k01-partner-login');
  await tap('k01-partner-login', 'Ramesh Yadav', 4000);
  await shot('k02-duty-offline');
  await tap('k02-duty-offline', 'Go online', 2500);
  await shot('k03-duty-online');
  await tap('k03-duty-online', /^Accept/, 1800);
  await shot('k04-job');
  await tap('k04-job', "I've arrived", 1200);
  await shot('k05-job-otp');
  await page.goBack();
  await wait(1500);
  await tap(null, 'Earnings', 1600);
  await shot('k06-earnings');
  await tap('k06-earnings', 'Profile', 1400);
  await shot('k07-profile');
  fs.writeFileSync(`${OUT}/taps-partner.json`, JSON.stringify(taps, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
