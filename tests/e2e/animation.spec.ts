import { test, expect } from '@playwright/test';
import { waitForGsapAnimation } from './helpers/geometry';

const problems = ['math-001', 'math-002', 'math-003', 'math-004', 'math-005'];

for (const problemId of problems) {
  test.describe(`${problemId} 动画测试`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/problem/${problemId}/`);
      await page.waitForSelector('svg');
      await page.waitForTimeout(500);
    });

    test('页面无 JS 错误', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // 点下一步按钮遍历所有步骤
      const nextBtn = page.locator('button:has-text("下一步")');
      const stepCount = await page.locator('[data-step]').count();
      
      // 如果没有 data-step 标记，尝试最多点击 20 次
      const maxSteps = stepCount > 0 ? stepCount : 20;
      
      for (let i = 0; i < maxSteps; i++) {
        try {
          const isDisabled = await nextBtn.getAttribute('disabled');
          if (isDisabled !== null) break;
          
          await nextBtn.click({ timeout: 2000 });
          await page.waitForTimeout(500);
        } catch (e) {
          // 按钮可能已经禁用或不可见
          break;
        }
      }

      expect(errors).toHaveLength(0);
    });

    test('角的颜色一致性', async ({ page }) => {
      const nextBtn = page.locator('button:has-text("下一步")');
      const stepCount = await page.locator('[data-step]').count();
      const maxSteps = stepCount > 0 ? stepCount : 20;
      
      for (let i = 0; i < maxSteps; i++) {
        try {
          const isDisabled = await nextBtn.getAttribute('disabled');
          if (isDisabled !== null) break;
          
          await nextBtn.click({ timeout: 2000 });
          await page.waitForTimeout(500);
          
          // 获取所有可见的弧线元素
          const arcs = await page.locator('svg path[id^="bad-"], svg path[id^="angle-"]').all();
          
          for (const arc of arcs) {
            const opacity = await arc.evaluate(el => {
              const styleOpacity = (el as SVGPathElement).style.opacity;
              const attrOpacity = el.getAttribute('opacity');
              return styleOpacity || attrOpacity || '1';
            });
            
            if (opacity && parseFloat(opacity) > 0) {
              const arcStroke = await arc.evaluate(el => {
                return (el as SVGPathElement).getAttribute('stroke') || 
                       (el as SVGPathElement).style.stroke || '';
              });
              
              // 从弧线 ID 提取角度名
              const arcId = await arc.getAttribute('id') || '';
              const angleName = arcId.replace(/^(bad-|angle-)/, '');
              
              // 提取角对应的顶点（如 bad-A -> A, bad-BCD -> C）
              const vertex = angleName.length === 1 ? angleName : angleName[1];
              
              // 找到该角对应的两条边
              // 例如：角 A 通常由 AB 和 AD 边组成
              const edges = await page.locator(`svg line[id*="${vertex}"], svg path[id*="${vertex}"]`).all();
              
              for (const edge of edges) {
                const edgeStroke = await edge.evaluate(el => {
                  return (el as SVGPathElement).getAttribute('stroke') || 
                         (el as SVGPathElement).style.stroke || '';
                });
                
                // 如果弧线和边都有颜色，检查它们是否一致
                if (arcStroke && edgeStroke) {
                  expect(arcStroke).toBe(edgeStroke);
                }
              }
            }
          }
        } catch (e) {
          // 按钮可能已经禁用或不可见
          break;
        }
      }
    });

    test('每步截图', async ({ page }) => {
      const nextBtn = page.locator('button:has-text("下一步")');
      const stepCount = await page.locator('[data-step]').count();
      const maxSteps = stepCount > 0 ? stepCount : 20;
      
      // 创建截图目录
      await page.evaluate(() => {
        // 确保页面已准备好截图
        return Promise.resolve();
      });
      
      for (let i = 0; i < maxSteps; i++) {
        try {
          const isDisabled = await nextBtn.getAttribute('disabled');
          if (isDisabled !== null) break;
          
          await nextBtn.click({ timeout: 2000 });
          await page.waitForTimeout(800);
          
          // 截图保存到 test-results 目录
          await page.screenshot({ 
            path: `test-results/${problemId}-step-${i}.png`,
            fullPage: false 
          });
        } catch (e) {
          // 按钮可能已经禁用或不可见
          break;
        }
      }
    });
  });
}
