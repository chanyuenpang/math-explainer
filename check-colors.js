const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/math-explainer/problem/math-003/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  for (let i = 0; i < 6; i++) {
    const btn = await page.$('button:has-text("下一步")');
    if (btn && !await btn.getAttribute('disabled')) { await btn.click(); await page.waitForTimeout(1500); }
  }
  const colors = await page.evaluate(() => {
    const result = { edges: {}, arcs: {} };
    document.querySelectorAll('svg line[id]').forEach(el => {
      const s = el.style.stroke || el.getAttribute('stroke');
      if (s && s !== '#D1D5DB' && s !== 'rgb(209, 213, 219)') result.edges[el.id] = s;
    });
    document.querySelectorAll('svg path[id^="bad-"], svg path[id^="angle-"]').forEach(el => {
      const s = el.style.stroke || el.getAttribute('stroke');
      const o = el.style.opacity || el.getAttribute('opacity');
      if (s && parseFloat(o) > 0.1) result.arcs[el.id] = s;
    });
    return result;
  });
  console.log('边颜色:', JSON.stringify(colors.edges, null, 2));
  console.log('弧线颜色:', JSON.stringify(colors.arcs, null, 2));
  await browser.close();
})();
