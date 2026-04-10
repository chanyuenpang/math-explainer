# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Math Explainer E2E - 核心用户流程 >> 首页加载并显示标题
- Location: tests/e2e/app.spec.ts:4:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "MathExplainer"
Received string:    "404:  Not found"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    9 × locator resolved to <h1>…</h1>
      - unexpected value "404:  Not found"

```

# Page snapshot

```yaml
- main [ref=e2]:
  - img [ref=e3]
  - 'heading "404: Not found" [level=1] [ref=e7]'
  - paragraph [ref=e8]:
    - text: In your
    - code [ref=e9]: site
    - text: you have your base path set to
    - link /math-explainer/ [ref=e10] [cursor=pointer]:
      - /url: /math-explainer/
    - text: . Do you want to go there instead?
  - paragraph [ref=e11]:
    - text: Come to our
    - link "Discord" [ref=e12] [cursor=pointer]:
      - /url: https://astro.build/chat
    - text: if you need help.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Math Explainer E2E - 核心用户流程', () => {
  4   |   test('首页加载并显示标题', async ({ page }) => {
  5   |     await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  6   | 
  7   |     // 验证主标题可见
  8   |     const h1 = page.locator('h1');
  9   |     await expect(h1).toBeVisible();
> 10  |     await expect(h1).toContainText('MathExplainer');
      |                      ^ Error: expect(locator).toContainText(expected) failed
  11  | 
  12  |     // 验证"查看全部题目"链接存在
  13  |     const problemsLink = page.locator('a[href*="/problems"]');
  14  |     await expect(problemsLink).toBeVisible();
  15  |   });
  16  | 
  17  |   test('首页显示题目卡片列表', async ({ page }) => {
  18  |     await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  19  | 
  20  |     // 验证题目卡片存在（链接到具体题目）
  21  |     const cards = page.locator('a[href*="/problem/"]');
  22  |     await expect(cards.first()).toBeVisible();
  23  |     // 至少有 math-001 ~ math-005
  24  |     const count = await cards.count();
  25  |     expect(count).toBeGreaterThanOrEqual(5);
  26  |   });
  27  | 
  28  |   test('题目列表页显示全部题目', async ({ page }) => {
  29  |     await page.goto('problems/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  30  | 
  31  |     // 验证标题
  32  |     const h1 = page.locator('h1');
  33  |     await expect(h1).toBeVisible();
  34  |     await expect(h1).toContainText('全部题目');
  35  | 
  36  |     // 验证题目卡片
  37  |     const cards = page.locator('a[href*="/problem/"]');
  38  |     await expect(cards.first()).toBeVisible();
  39  |     const count = await cards.count();
  40  |     expect(count).toBeGreaterThanOrEqual(5);
  41  | 
  42  |     // 验证返回首页链接
  43  |     const backLink = page.locator('a[href="/"]');
  44  |     await expect(backLink).toBeVisible();
  45  |   });
  46  | 
  47  |   test('题目详情页加载并显示几何图形', async ({ page }) => {
  48  |     await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  49  | 
  50  |     // 等待 React 水合和 SVG 渲染
  51  |     await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
  52  |     await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });
  53  | 
  54  |     // 验证 SVG 画布可见
  55  |     const svg = page.locator('svg[viewBox="0 0 500 420"]');
  56  |     await expect(svg).toBeVisible();
  57  | 
  58  |     // 验证标题显示
  59  |     const h1 = page.locator('h1');
  60  |     await expect(h1).toBeVisible();
  61  |     await expect(h1).toContainText('四边形与全等三角形');
  62  |   });
  63  | 
  64  |   test('题目详情页显示步骤播放器', async ({ page }) => {
  65  |     await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  66  |     await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
  67  |     await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });
  68  | 
  69  |     // 验证步骤指示器
  70  |     const stepIndicator = page.locator('span:has-text("步骤")');
  71  |     await expect(stepIndicator).toBeVisible();
  72  | 
  73  |     // 验证上一步/下一步按钮存在
  74  |     const nextBtn = page.locator('button:has-text("下一步")');
  75  |     const prevBtn = page.locator('button:has-text("上一步")');
  76  |     await expect(nextBtn).toBeVisible();
  77  |     await expect(prevBtn).toBeVisible();
  78  |   });
  79  | 
  80  |   test('步骤导航 - 点击下一步切换步骤', async ({ page }) => {
  81  |     await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  82  |     await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
  83  |     await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });
  84  |     await page.waitForTimeout(1000); // 等待 GSAP 初始化
  85  | 
  86  |     // 记录初始步骤文本
  87  |     const stepIndicator = page.locator('span:has-text("步骤")');
  88  |     await expect(stepIndicator).toContainText('步骤 1 /');
  89  | 
  90  |     // 点击下一步
  91  |     const nextBtn = page.locator('button:has-text("下一步")');
  92  |     await nextBtn.click();
  93  |     await page.waitForTimeout(500);
  94  | 
  95  |     // 验证步骤指示器更新
  96  |     await expect(stepIndicator).toContainText('步骤 2 /');
  97  | 
  98  |     // 点击上一步回到第一步
  99  |     const prevBtn = page.locator('button:has-text("上一步")');
  100 |     await prevBtn.click();
  101 |     await page.waitForTimeout(500);
  102 | 
  103 |     await expect(stepIndicator).toContainText('步骤 1 /');
  104 |   });
  105 | 
  106 |   test('SVG 几何图形渲染 - 边和顶点', async ({ page }) => {
  107 |     await page.goto('problem/math-001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  108 |     await page.waitForSelector('#combined-root > div', { state: 'attached', timeout: 15000 });
  109 |     await page.waitForSelector('svg[viewBox]', { state: 'attached', timeout: 15000 });
  110 |     await page.waitForSelector('line#AB', { state: 'attached', timeout: 15000 });
```