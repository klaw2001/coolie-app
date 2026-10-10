// Renders the composition frame by frame (each frame is a pure function of time) and pipes it into ffmpeg with the soundtrack.
// Frame 0 is replaced by the poster frame so platforms show it as the thumbnail; duration and sync are unchanged.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const FPS = 30, DUR = 30, POSTER_T = Number(process.env.POSTER_T || 6.5);
(async () => {
  const out = process.argv[2];
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', __dirname + '/soundtrack.wav',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-t', String(DUR), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + __dirname + '/../composition/index.html');
  await page.evaluate(() => window.READY);
  const total = FPS * DUR;
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = i === 0 ? POSTER_T : i / FPS;
    await page.evaluate((t) => window.render(t), t);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  if (errs.length) console.log('page errors:', errs.join('\n'));
  await browser.close();
  console.log('done', out);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
