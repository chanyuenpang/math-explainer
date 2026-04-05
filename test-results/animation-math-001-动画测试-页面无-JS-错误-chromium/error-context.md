# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: animation.spec.ts >> math-001 动画测试 >> 页面无 JS 错误
- Location: tests/e2e/animation.spec.ts:16:5

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
  2   | import { waitForGsapAnimation } from './helpers/geometry';
  3   | 
  4   | const problems = ['math-001', 'math-002', 'math-003', 'math-004', 'math-005'];
  5   | 
  6   | for (const problemId of problems) {
  7   |   test.describe(`${problemId} 动画测试`, () => {
> 8   |     test.beforeEach(async ({ page }) => {
      |          ^ Test timeout of 30000ms exceeded while running "beforeEach" hook.
  9   |       await page.goto(`problem/${problemId}/`);  // Relative path to work with baseURL
  10  |       // Wait for React to hydrate and render the SVG with edges
  11  |       // Use a generic selector that matches any line in the geometry SVG
  12  |       await page.waitForSelector('svg[viewBox] line', { state: 'attached', timeout: 10000 });
  13  |       await page.waitForTimeout(500);
  14  |     });
  15  | 
  16  |     test('页面无 JS 错误', async ({ page }) => {
  17  |       const errors: string[] = [];
  18  |       page.on('console', msg => {
  19  |         if (msg.type() === 'error') {
  20  |           errors.push(msg.text());
  21  |         }
  22  |       });
  23  | 
  24  |       // 点下一步按钮遍历所有步骤
  25  |       const nextBtn = page.locator('button:has-text("下一步")');
  26  |       const stepCount = await page.locator('[data-step]').count();
  27  |       
  28  |       // 如果没有 data-step 标记，尝试最多点击 20 次
  29  |       const maxSteps = stepCount > 0 ? stepCount : 20;
  30  |       
  31  |       for (let i = 0; i < maxSteps; i++) {
  32  |         try {
  33  |           const isDisabled = await nextBtn.getAttribute('disabled');
  34  |           if (isDisabled !== null) break;
  35  |           
  36  |           await nextBtn.click({ timeout: 2000 });
  37  |           await page.waitForTimeout(500);
  38  |         } catch (e) {
  39  |           // 按钮可能已经禁用或不可见
  40  |           break;
  41  |         }
  42  |       }
  43  | 
  44  |       expect(errors).toHaveLength(0);
  45  |     });
  46  | 
  47  |     test('角的颜色一致性', async ({ page }) => {
  48  |       const nextBtn = page.locator('button:has-text("下一步")');
  49  |       const stepCount = await page.locator('[data-step]').count();
  50  |       const maxSteps = stepCount > 0 ? stepCount : 20;
  51  |       
  52  |       for (let i = 0; i < maxSteps; i++) {
  53  |         try {
  54  |           const isDisabled = await nextBtn.getAttribute('disabled');
  55  |           if (isDisabled !== null) break;
  56  |           
  57  |           await nextBtn.click({ timeout: 2000 });
  58  |           await page.waitForTimeout(500);
  59  |           
  60  |           // 获取所有可见的弧线元素
  61  |           const arcs = await page.locator('svg path[id^="bad-"], svg path[id^="angle-"]').all();
  62  |           
  63  |           for (const arc of arcs) {
  64  |             const opacity = await arc.evaluate(el => {
  65  |               const styleOpacity = (el as SVGPathElement).style.opacity;
  66  |               const attrOpacity = el.getAttribute('opacity');
  67  |               return styleOpacity || attrOpacity || '1';
  68  |             });
  69  |             
  70  |             if (opacity && parseFloat(opacity) > 0) {
  71  |               const arcStroke = await arc.evaluate(el => {
  72  |                 return (el as SVGPathElement).getAttribute('stroke') || 
  73  |                        (el as SVGPathElement).style.stroke || '';
  74  |               });
  75  |               
  76  |               // 从弧线 ID 提取角度名
  77  |               const arcId = await arc.getAttribute('id') || '';
  78  |               const angleName = arcId.replace(/^(bad-|angle-)/, '');
  79  |               
  80  |               // 提取角对应的顶点（如 bad-A -> A, bad-BCD -> C）
  81  |               const vertex = angleName.length === 1 ? angleName : angleName[1];
  82  |               
  83  |               // 找到该角对应的两条边
  84  |               // 例如：角 A 通常由 AB 和 AD 边组成
  85  |               const edges = await page.locator(`svg line[id*="${vertex}"], svg path[id*="${vertex}"]`).all();
  86  |               
  87  |               for (const edge of edges) {
  88  |                 const edgeStroke = await edge.evaluate(el => {
  89  |                   return (el as SVGPathElement).getAttribute('stroke') || 
  90  |                          (el as SVGPathElement).style.stroke || '';
  91  |                 });
  92  |                 
  93  |                 // 如果弧线和边都有颜色，检查它们是否一致
  94  |                 if (arcStroke && edgeStroke) {
  95  |                   expect(arcStroke).toBe(edgeStroke);
  96  |                 }
  97  |               }
  98  |             }
  99  |           }
  100 |         } catch (e) {
  101 |           // 按钮可能已经禁用或不可见
  102 |           break;
  103 |         }
  104 |       }
  105 |     });
  106 | 
  107 |     test('每步截图', async ({ page }) => {
  108 |       const nextBtn = page.locator('button:has-text("下一步")');
```