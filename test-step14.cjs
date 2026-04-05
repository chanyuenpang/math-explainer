const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:4324/math-explainer/problem/math-001/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 点击13次到步骤13（索引13，id=13，第14步）
    console.log('点击到步骤13...');
    for (let i = 0; i < 13; i++) {
      const btn = await page.$('button:has-text("下一步")');
      if (btn && !await btn.getAttribute('disabled')) {
        await btn.click();
        await page.waitForTimeout(1500);
      }
    }
    
    await page.waitForTimeout(1000);
    
    // 检查步骤13的弧线状态
    const arcs13 = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('svg path[id^="bad-"], svg path[id^="angle-"]').forEach(el => {
        result.push({
          id: el.id,
          opacity: window.getComputedStyle(el).opacity || el.getAttribute('opacity'),
          stroke: window.getComputedStyle(el).stroke || el.getAttribute('stroke')
        });
      });
      return result;
    });
    
    console.log('步骤13弧线状态:', JSON.stringify(arcs13, null, 2));
    
    // 检查 bad-ABC 和 bad-EDC 是否可见
    const abcArc = arcs13.find(a => a.id === 'bad-ABC');
    const edcArc = arcs13.find(a => a.id === 'bad-EDC');
    
    console.log('\n步骤13验证:');
    if (abcArc && parseFloat(abcArc.opacity) > 0) {
      console.log('✓ bad-ABC 可见，opacity:', abcArc.opacity, 'stroke:', abcArc.stroke);
    } else {
      console.log('✗ bad-ABC 不可见或不存在');
    }
    
    if (edcArc && parseFloat(edcArc.opacity) > 0) {
      console.log('✓ bad-EDC 可见，opacity:', edcArc.opacity, 'stroke:', edcArc.stroke);
    } else {
      console.log('✗ bad-EDC 不可见或不存在');
    }
    
    // 点击到步骤14
    console.log('\n点击到步骤14...');
    const btn14 = await page.$('button:has-text("下一步")');
    if (btn14 && !await btn14.getAttribute('disabled')) {
      await btn14.click();
      await page.waitForTimeout(1500);
    }
    
    await page.waitForTimeout(1000);
    
    // 检查步骤14的弧线状态
    const arcs14 = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('svg path[id^="bad-"], svg path[id^="angle-"]').forEach(el => {
        result.push({
          id: el.id,
          opacity: window.getComputedStyle(el).opacity || el.getAttribute('opacity'),
          stroke: window.getComputedStyle(el).stroke || el.getAttribute('stroke')
        });
      });
      return result;
    });
    
    console.log('\n步骤14弧线状态:', JSON.stringify(arcs14, null, 2));
    
    const abcArc14 = arcs14.find(a => a.id === 'bad-ABC');
    const edcArc14 = arcs14.find(a => a.id === 'bad-EDC');
    
    console.log('\n步骤14验证:');
    if (abcArc14 && parseFloat(abcArc14.opacity) > 0) {
      console.log('✓ bad-ABC 可见，opacity:', abcArc14.opacity, 'stroke:', abcArc14.stroke);
    } else {
      console.log('✗ bad-ABC 不可见或不存在');
    }
    
    if (edcArc14 && parseFloat(edcArc14.opacity) > 0) {
      console.log('✓ bad-EDC 可见，opacity:', edcArc14.opacity, 'stroke:', edcArc14.stroke);
    } else {
      console.log('✗ bad-EDC 不可见或不存在');
    }
    
    // 截图
    await page.screenshot({ path: '/home/yankeeting/.openclaw/workspace/projects/math-explainer/test-step13-after-fix.png' });
    console.log('\n截图已保存到 test-step13-after-fix.png');
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await browser.close();
  }
})();
