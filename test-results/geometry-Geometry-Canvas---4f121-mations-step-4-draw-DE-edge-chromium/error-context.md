# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: geometry.spec.ts >> Geometry Canvas - math-001 >> Step Animations >> step 4: draw DE edge
- Location: tests/e2e/geometry.spec.ts:107:5

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - link "← 返回" [ref=e3] [cursor=pointer]:
      - /url: /math-explainer/problems
    - generic [ref=e4]:
      - generic [ref=e5]: MathExplainer
      - generic [ref=e6]: v$2.3.3
  - main [ref=e7]:
    - generic [ref=e8]:
      - heading "几何证明：四边形与全等三角形" [level=1] [ref=e9]
      - paragraph [ref=e11]: 如图，在四边形ABCD中，∠A=∠BCD=90°，BC=DC．延长AD到E点，使DE=AB． （1）求证：∠ABC=∠EDC； （2）求证：△ABC≌△EDC．
      - group [ref=e14]:
        - generic "查看完整答案" [ref=e15] [cursor=pointer]
      - group [ref=e16]:
        - generic "查看原题" [ref=e17] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import {
  3   |   SELECTORS,
  4   |   waitForGsapAnimation,
  5   |   getSVGElement,
  6   |   assertPointLabel,
  7   |   assertEdgePath,
  8   |   assertAngleArc,
  9   |   assertFillTriangle,
  10  |   triggerStep,
  11  |   assertEdgeCoordinates
  12  | } from './helpers/geometry';
  13  | 
  14  | test.describe('Geometry Canvas - math-001', () => {
> 15  |   test.beforeEach(async ({ page }) => {
      |        ^ Test timeout of 30000ms exceeded while running "beforeEach" hook.
  16  |     await page.goto('problem/math-001/');  // Relative path to work with baseURL
  17  |     // Wait for React to hydrate and render the SVG with edges
  18  |     await page.waitForSelector('line#AB', { state: 'attached', timeout: 10000 });
  19  |     await page.waitForTimeout(500);  // Extra time for animations
  20  |   });
  21  | 
  22  |   test.describe('Initial Render', () => {
  23  |     test('page loads and SVG renders', async ({ page }) => {
  24  |       // Target the specific geometry SVG with the correct viewBox
  25  |       const svg = page.locator('svg[viewBox="0 0 500 420"]');
  26  |       await expect(svg).toBeVisible();
  27  |       
  28  |       const viewBox = await svg.getAttribute('viewBox');
  29  |       expect(viewBox).toBe('0 0 500 420');  // 修正：实际 viewBox 高度是 420
  30  |     });
  31  | 
  32  |     test('all 5 point labels exist (A,B,C,D,E)', async ({ page }) => {
  33  |       for (const label of ['A', 'B', 'C', 'D', 'E']) {
  34  |         await assertPointLabel(page, label);
  35  |       }
  36  |     });
  37  | 
  38  |     test('all 6 edges exist with correct IDs', async ({ page }) => {
  39  |       const edges = ['AB', 'BC', 'CD', 'AD', 'DE', 'CE'];
  40  |       for (const edgeId of edges) {
  41  |         await assertEdgePath(page, edgeId);
  42  |       }
  43  |     });
  44  | 
  45  |     test('right angle arcs render at A and C', async ({ page }) => {
  46  |       await assertAngleArc(page, 'A');  // 修正：传 A，不是 bad-A
  47  |       await assertAngleArc(page, 'BCD');
  48  |     });
  49  | 
  50  |     test('equal pair markers exist', async ({ page }) => {
  51  |       // 注意：实际有 4 个 ≡ 符号（每条边可能有两个标记）
  52  |       const markers = page.locator('svg[viewBox="0 0 500 420"] text:has-text("≡")');
  53  |       await expect(markers).toHaveCount(4);  // 修正：实际数量是 4
  54  |     });
  55  |   });
  56  | 
  57  |   test.describe('Edge Coordinate Validation', () => {
  58  |     test('AB edge coordinates are correct', async ({ page }) => {
  59  |       await assertEdgeCoordinates(page, 'AB', {
  60  |         x1: 100, y1: 100, x2: 100, y2: 200
  61  |       });
  62  |     });
  63  | 
  64  |     test('BC edge coordinates are correct', async ({ page }) => {
  65  |       await assertEdgeCoordinates(page, 'BC', {
  66  |         x1: 100, y1: 200, x2: 200, y2: 200
  67  |       });
  68  |     });
  69  | 
  70  |     test('CD edge coordinates are correct', async ({ page }) => {
  71  |       await assertEdgeCoordinates(page, 'CD', {
  72  |         x1: 200, y1: 200, x2: 200, y2: 100
  73  |       });
  74  |     });
  75  | 
  76  |     test('AD edge coordinates are correct', async ({ page }) => {
  77  |       await assertEdgeCoordinates(page, 'AD', {
  78  |         x1: 200, y1: 100, x2: 100, y2: 100  // 修正：边是从 D 到 A，不是 A 到 D
  79  |       });
  80  |     });
  81  |   });
  82  | 
  83  |   test.describe('Step Animations', () => {
  84  |     test('step 0: initial draw animation', async ({ page }) => {
  85  |       await waitForGsapAnimation(page, 600);
  86  |       
  87  |       for (const edgeId of ['AB', 'BC', 'CD', 'AD']) {
  88  |         const edge = page.locator(SELECTORS.edge(edgeId));
  89  |         await expect(edge).toBeAttached();  // 修正：检查 attached 而不是 visible
  90  |       }
  91  |     });
  92  | 
  93  |     test('step 1: flash angle A', async ({ page }) => {
  94  |       await triggerStep(page, 1);
  95  |       
  96  |       const arcA = page.locator(SELECTORS.arc('A'));  // 修正：传 'A' 不是 'bad-A'
  97  |       await expect(arcA).toBeVisible();
  98  |     });
  99  | 
  100 |     test('step 2: flash angle BCD', async ({ page }) => {
  101 |       await triggerStep(page, 2);
  102 |       
  103 |       const arcBCD = page.locator(SELECTORS.arc('BCD'));  // 修正：传 'BCD' 不是 'bad-BCD'
  104 |       await expect(arcBCD).toBeVisible();
  105 |     });
  106 | 
  107 |     test('step 4: draw DE edge', async ({ page }) => {
  108 |       await triggerStep(page, 4);
  109 |       
  110 |       const de = page.locator(SELECTORS.edge('DE'));
  111 |       await expect(de).toBeAttached();  // 修正：检查 attached 而不是 visible
  112 |       await expect(de).toHaveAttribute('x1', '200');
  113 |       await expect(de).toHaveAttribute('x2', '300');
  114 |     });
  115 | 
```