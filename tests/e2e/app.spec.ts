import { test, expect } from '@playwright/test';

test.describe('Math Explainer E2E - 核心用户流程', () => {
  test('首页加载并显示标题', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 验证主标题可见
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('MathExplainer');

    // 验证"查看全部题目"链接存在
    const problemsLink = page.locator('a[href*="/problems"]');
    await expect(problemsLink).toBeVisible();
  });

  test('首页显示题目卡片列表', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 验证题目卡片存在（链接到具体题目）
    const cards = page.locator('a[href*="/problem/"]');
    await expect(cards.first()).toBeVisible();
    // 至少有 math-001 ~ math-005
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('题目列表页显示全部题目', async ({ page }) => {
    await page.goto('problems/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 验证标题
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('全部题目');

    // 验证题目卡片
    const cards = page.locator('a[href*="/problem/"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // 验证返回首页链接
    const backLink = page.locator('a[href="/"]');
    await expect(backLink).toBeVisible();
  });

  test('题目详情页加载并显示几何图形', async ({ page }) => {
    await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 等待 React 水合和 SVG 渲染
    await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
    await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });

    // 验证 SVG 画布可见
    const svg = page.locator('svg[viewBox="0 0 500 420"]');
    await expect(svg).toBeVisible();

    // 验证标题显示
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('四边形与全等三角形');
  });

  test('题目详情页显示步骤播放器', async ({ page }) => {
    await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
    await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });

    // 验证步骤指示器
    const stepIndicator = page.locator('span:has-text("步骤")');
    await expect(stepIndicator).toBeVisible();

    // 验证上一步/下一步按钮存在
    const nextBtn = page.locator('button:has-text("下一步")');
    const prevBtn = page.locator('button:has-text("上一步")');
    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();
  });

  test('步骤导航 - 点击下一步切换步骤', async ({ page }) => {
    await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
    await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });
    await page.waitForTimeout(1000); // 等待 GSAP 初始化

    // 记录初始步骤文本
    const stepIndicator = page.locator('span:has-text("步骤")');
    await expect(stepIndicator).toContainText('步骤 1 /');

    // 点击下一步
    const nextBtn = page.locator('button:has-text("下一步")');
    await nextBtn.click();
    await page.waitForTimeout(500);

    // 验证步骤指示器更新
    await expect(stepIndicator).toContainText('步骤 2 /');

    // 点击上一步回到第一步
    const prevBtn = page.locator('button:has-text("上一步")');
    await prevBtn.click();
    await page.waitForTimeout(500);

    await expect(stepIndicator).toContainText('步骤 1 /');
  });

  test('SVG 几何图形渲染 - 边和顶点', async ({ page }) => {
    await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
    await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });
    await page.waitForSelector('line#AB', { state: 'attached', timeout: 15000 });

    // 验证 SVG 中有线条元素
    const lines = page.locator('svg line');
    const lineCount = await lines.count();
    expect(lineCount).toBeGreaterThanOrEqual(4);

    // 验证顶点标签
    for (const label of ['A', 'B', 'C', 'D']) {
      const pointLabel = page.locator(`svg text:has-text("${label}")`);
      await expect(pointLabel).toBeVisible();
    }
  });

  test('从首页导航到题目列表再到详情', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 点击"查看全部题目"链接
    const problemsLink = page.locator('a[href*="/problems"]');
    await problemsLink.click();
    await page.waitForLoadState('domcontentloaded');

    // 验证在题目列表页
    await expect(page.locator('h1')).toContainText('全部题目');

    // 点击第一个题目卡片
    const firstCard = page.locator('a[href*="/problem/"]').first();
    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');

    // 等待 React 水合
    await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
    await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });

    // 验证在题目详情页
    const svg = page.locator('svg[viewBox="0 0 500 420"]');
    await expect(svg).toBeVisible();
  });

  test('题目详情页返回列表', async ({ page }) => {
    await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 点击返回链接
    const backLink = page.locator('a[href*="/problems"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForLoadState('domcontentloaded');

    // 验证返回题目列表页
    await expect(page.locator('h1')).toContainText('全部题目');
  });

  test('多个题目详情页均可加载', async ({ page }) => {
    const problemIds = ['math-001', 'math-002', 'math-003'];

    for (const id of problemIds) {
      await page.goto(`problem/${id}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 等待 React 水合
      await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
      await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });

      // 验证 SVG 和标题
      const svg = page.locator('svg[viewBox="0 0 500 420"]');
      await expect(svg).toBeVisible();

      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
    }
  });
});
