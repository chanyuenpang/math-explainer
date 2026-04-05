import { test, expect } from '@playwright/test';
import {
  SELECTORS,
  waitForGsapAnimation,
  getSVGElement,
  assertPointLabel,
  assertEdgePath,
  assertAngleArc,
  assertFillTriangle,
  triggerStep,
  assertEdgeCoordinates
} from './helpers/geometry';

test.describe('Geometry Canvas - math-001', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/problem/math-001/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test.describe('Initial Render', () => {
    test('page loads and SVG renders', async ({ page }) => {
      const svg = page.locator('svg');
      await expect(svg).toBeVisible();
      
      const viewBox = await svg.getAttribute('viewBox');
      expect(viewBox).toBe('0 0 500 500');
    });

    test('all 5 point labels exist (A,B,C,D,E)', async ({ page }) => {
      for (const label of ['A', 'B', 'C', 'D', 'E']) {
        await assertPointLabel(page, label);
      }
    });

    test('all 6 edges exist with correct IDs', async ({ page }) => {
      const edges = ['AB', 'BC', 'CD', 'AD', 'DE', 'CE'];
      for (const edgeId of edges) {
        await assertEdgePath(page, edgeId);
      }
    });

    test('right angle arcs render at A and C', async ({ page }) => {
      await assertAngleArc(page, 'bad-A');
      await assertAngleArc(page, 'bad-BCD');
    });

    test('equal pair markers exist', async ({ page }) => {
      const markers = page.locator('text=≡');
      await expect(markers).toHaveCount(2);
    });
  });

  test.describe('Edge Coordinate Validation', () => {
    test('AB edge coordinates are correct', async ({ page }) => {
      await assertEdgeCoordinates(page, 'AB', {
        x1: 100, y1: 100, x2: 100, y2: 200
      });
    });

    test('BC edge coordinates are correct', async ({ page }) => {
      await assertEdgeCoordinates(page, 'BC', {
        x1: 100, y1: 200, x2: 200, y2: 200
      });
    });

    test('CD edge coordinates are correct', async ({ page }) => {
      await assertEdgeCoordinates(page, 'CD', {
        x1: 200, y1: 200, x2: 200, y2: 100
      });
    });

    test('AD edge coordinates are correct', async ({ page }) => {
      await assertEdgeCoordinates(page, 'AD', {
        x1: 100, y1: 100, x2: 200, y2: 100
      });
    });
  });

  test.describe('Step Animations', () => {
    test('step 0: initial draw animation', async ({ page }) => {
      await waitForGsapAnimation(page, 600);
      
      for (const edgeId of ['AB', 'BC', 'CD', 'AD']) {
        const edge = page.locator(SELECTORS.edge(edgeId));
        await expect(edge).toBeVisible();
      }
    });

    test('step 1: flash angle A', async ({ page }) => {
      await triggerStep(page, 1);
      
      const arcA = page.locator(SELECTORS.arc('bad-A'));
      await expect(arcA).toBeVisible();
    });

    test('step 2: flash angle BCD', async ({ page }) => {
      await triggerStep(page, 2);
      
      const arcBCD = page.locator(SELECTORS.arc('bad-BCD'));
      await expect(arcBCD).toBeVisible();
    });

    test('step 4: draw DE edge', async ({ page }) => {
      await triggerStep(page, 4);
      
      const de = page.locator(SELECTORS.edge('DE'));
      await expect(de).toBeVisible();
      await expect(de).toHaveAttribute('x1', '200');
      await expect(de).toHaveAttribute('x2', '300');
    });

    test('step 10: fill triangles', async ({ page }) => {
      await triggerStep(page, 10);
      await waitForGsapAnimation(page, 800);
      
      const abc = page.locator(SELECTORS.triangle('ABC'));
      const edc = page.locator(SELECTORS.triangle('EDC'));
      
      await expect(abc).toHaveCSS('fill-opacity', '0.3');
      await expect(edc).toHaveCSS('fill-opacity', '0.3');
    });
  });

  test.describe('Navigation', () => {
    test('next and prev buttons work', async ({ page }) => {
      const nextBtn = page.locator(SELECTORS.nextButton);
      const prevBtn = page.locator(SELECTORS.prevButton);
      
      await expect(nextBtn).toBeVisible();
      await expect(prevBtn).toBeVisible();
      
      await nextBtn.click();
      await waitForGsapAnimation(page, 300);
      
      const stepBadge = page.locator('span:has-text("第")');
      await expect(stepBadge).toContainText('第 2 步');
    });
  });
});