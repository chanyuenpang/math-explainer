# FEAT-007: DOM-based QA Framework for math-explainer

## Overview

This document outlines a DOM-based QA testing framework for the geometry animation engine. Unlike screenshot-based testing, this framework inspects SVG/DOM attributes directly for faster, more reliable assertions.

## Architecture Decisions

### Tool Choice: Playwright

| Criteria | Playwright | Puppeteer |
|----------|-------------|-----------|
| Built-in test runner | ✅ | ❌ |
| Wait utilities | ✅ Excellent | ⚠️ Manual |
| CI integration | ✅ Native | ⚠️ Manual |
| SSR/Next.js/Astro support | ✅ | ⚠️ |
| Element inspection | ✅ | ✅ |
| **Decision** | **Playwright** | |

**Rationale**: Playwright's built-in test runner, auto-waiting, and better Astro/React SSR support make it superior for this use case.

## Test File Structure

```
tests/
├── e2e/
│   ├── playwright.config.ts      # Playwright config
│   ├── geometry.spec.ts          # Main geometry tests
│   └── helpers/
│       ├── server.ts             # Dev server management
│       └── selectors.ts          # CSS/XPath selectors
└── reports/
    └── test-results/
```

## Key Test Cases for math-001

### 1. Initial Render Tests

```typescript
// Verify points exist at correct positions
await expect(page.locator('text=A')).toBeVisible();
await expect(page.locator('text=B')).toBeVisible();
// ... check coordinates via bounding box

// Verify edges render with correct attributes
const abLine = page.locator('#AB');
await expect(abLine).toHaveAttribute('x1', '100');
await expect(abLine).toHaveAttribute('y1', '200'); // 300 - 100 (y inverted)

// Verify right angle arcs exist
await expect(page.locator('#arc-A')).toBeAttached();
await expect(page.locator('#arc-BCD')).toBeAttached();

// Verify equal pair markers
await expect(page.locator('text=≡')).toHaveCount(2);
```

### 2. Animation Step Tests

For step 0 (initial draw):
```typescript
// Check edges have draw animation (stroke-dasharray)
const edgeAB = page.locator('#AB');
await expect(edgeAB).toHaveJSProperty('stroke-dasharray', '200, 200'); // Animated state
```

For step 1 (flash angle A):
```typescript
// After step change
await page.click('button.next-step'); // or navigate to step 1
await waitForAnimation(500); // Allow GSAP to start

// Check arc-A is visible (opacity > 0)
await expect(page.locator('#arc-A')).toBeVisible();
await expect(page.locator('#arc-A')).toHaveCSS('opacity', '1');
```

For step 4 (draw DE edge):
```typescript
// Verify DE edge appears
const deLine = page.locator('#DE');
await expect(deLine).toBeVisible();
await expect(deLine).toHaveAttribute('x1', '200');
await expect(deLine).toHaveAttribute('x2', '300');
```

For step 10 (fill triangles):
```typescript
// Check triangle fills have colors
const triangleABC = page.locator('#triangle-ABC');
await expect(triangleABC).toHaveCSS('fill', 'rgb(239, 68, 68)'); // Red
await expect(triangleABC).toHaveCSS('fill-opacity', '0.3');
```

### 3. GSAP Animation State Tests

```typescript
// Helper to wait for GSAP animations
async function waitForAnimation(ms: number) {
  await page.waitForTimeout(ms);
}

// Test that animation transitions work correctly
await page.click('button.next-step');
await waitForAnimation(100);

// Verify edge transitioned from default to highlighted state
const edge = page.locator('#BC');
const stroke = await edge.evaluate(el => 
  window.getComputedStyle(el).stroke
);
expect(stroke).toBe('#3B82F6'); // COLORS.highlight
```

### 4. Dynamic Element Tests

For flyout-compare (step 4):
```typescript
await waitForAnimation(1000); // Wait for flyout animation
// Check flyout elements created dynamically
await expect(page.locator('.flyout-copy')).toHaveCount(3); // 2 lines + 1 text
```

For moveTriangle (if applicable):
```typescript
// Check transform attribute changes
const triangleABC = page.locator('#triangle-ABC');
await expect(triangleABC).toHaveAttribute('transform', /translate/);
```

## Implementation Steps

### Step 1: Setup Playwright

```bash
npm init playwright@latest -- --quiet --lang=TypeScript --no-browsers
npx playwright install chromium
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  }
}
```

### Step 2: Create Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: ['html', 'json'],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Step 3: Create Test Helpers

```typescript
// tests/e2e/helpers/selectors.ts
export const SELECTORS = {
  // Points
  pointLabel: (label: string) => `text=${label}`,
  
  // Edges
  edge: (id: string) => `#${id}`,
  
  // Triangles
  triangle: (id: string) => `#triangle-${id}`,
  
  // Arcs
  arc: (id: string) => `#${id}`,
  arcFill: (id: string) => `#${id}-fill`,
  
  // Step navigation
  nextButton: 'button:has-text("下一步")',
  prevButton: 'button:has-text("上一步")',
  stepIndicator: '.step-indicator',
};
```

```typescript
// tests/e2e/helpers/assertions.ts
import { expect, type Page } from '@playwright/test';

export async function waitForGsapAnimation(page: Page, duration: number = 500) {
  await page.waitForTimeout(duration + 100); // buffer for GSAP
}

export async function assertEdgeCoordinates(
  page: Page,
  edgeId: string,
  expected: { x1: number; y1: number; x2: number; y2: number }
) {
  const edge = page.locator(`#${edgeId}`);
  await expect(edge).toHaveAttribute('x1', String(expected.x1));
  await expect(edge).toHaveAttribute('y1', String(300 - expected.y1)); // Y inverted
  await expect(edge).toHaveAttribute('x2', String(expected.x2));
  await expect(edge).toHaveAttribute('y2', String(300 - expected.y2));
}

export async function assertPointLabel(
  page: Page,
  label: string,
  expectedPosition: { x: number; y: number }
) {
  const labelEl = page.locator(`text=${label}`);
  await expect(labelEl).toBeVisible();
  
  const bbox = await labelEl.boundingBox();
  expect(bbox).not.toBeNull();
  expect(Math.abs(bbox!.x - (expectedPosition.x - 15))).toBeLessThan(5);
  expect(Math.abs(bbox!.y - (300 - expectedPosition.y - 10))).toBeLessThan(5);
}
```

### Step 4: Write Main Test Suite

```typescript
// tests/e2e/geometry.spec.ts
import { test, expect } from '@playwright/test';
import { SELECTORS } from './helpers/selectors';
import { waitForGsapAnimation, assertEdgeCoordinates } from './helpers/assertions';

test.describe('Geometry Canvas - math-001', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/problems/math-001');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Initial Render', () => {
    test('should render all 5 points', async ({ page }) => {
      for (const label of ['A', 'B', 'C', 'D', 'E']) {
        await expect(page.locator(`text=${label}`)).toBeVisible();
      }
    });

    test('should render all 6 edges', async ({ page }) => {
      const edges = ['AB', 'BC', 'CD', 'AD', 'DE', 'CE'];
      for (const edgeId of edges) {
        await expect(page.locator(`#${edgeId}`)).toBeAttached();
      }
    });

    test('should render right angle arcs at A and C', async ({ page }) => {
      await expect(page.locator('#arc-A')).toBeAttached();
      await expect(page.locator('#arc-BCD')).toBeAttached();
    });

    test('should render equal pair markers', async ({ page }) => {
      // BC=CD and AB=DE should have ≡ markers
      await expect(page.locator('text=≡')).toHaveCount(2);
    });
  });

  test.describe('Step Animations', () => {
    test('step 0: initial draw with edges animated', async ({ page }) => {
      await waitForGsapAnimation(page, 600);
      // All main edges should be visible
      for (const edgeId of ['AB', 'BC', 'CD', 'AD']) {
        const edge = page.locator(`#${edgeId}`);
        await expect(edge).toBeVisible();
      }
    });

    test('step 1: flash angle A', async ({ page }) => {
      // Navigate to step 1 (via UI or direct)
      await page.click(SELECTORS.nextButton);
      await waitForGsapAnimation(page, 500);
      
      // arc-A should become visible
      await expect(page.locator('#arc-A')).toBeVisible();
    });

    test('step 4: draw DE edge', async ({ page }) => {
      // Navigate to step 4
      for (let i = 0; i < 4; i++) {
        await page.click(SELECTORS.nextButton);
      }
      await waitForGsapAnimation(page);
      
      // DE should be visible
      const de = page.locator('#DE');
      await expect(de).toBeVisible();
      await expect(de).toHaveAttribute('x1', '200');
      await expect(de).toHaveAttribute('x2', '300');
    });

    test('step 10: fill triangles', async ({ page }) => {
      // Navigate to step 10
      for (let i = 0; i < 10; i++) {
        await page.click(SELECTORS.nextButton);
      }
      await waitForGsapAnimation(page, 800);
      
      // Triangle fills should have colors
      const abc = page.locator('#triangle-ABC');
      const edc = page.locator('#triangle-EDC');
      
      await expect(abc).toHaveCSS('fill', /rgb\(239/); // Red tint
      await expect(edc).toHaveCSS('fill', /rgb\(16/);  // Green tint
    });
  });

  test.describe('Edge Coordinate Validation', () => {
    test('AB edge coordinates', async ({ page }) => {
      await assertEdgeCoordinates(page, 'AB', {
        x1: 100, y1: 100, x2: 100, y2: 200
      });
    });

    test('BC edge coordinates', async ({ page }) => {
      await assertEdgeCoordinates(page, 'BC', {
        x1: 100, y1: 200, x2: 200, y2: 200
      });
    });
  });
});
```

### Step 5: Run Tests

```bash
npm test                    # Run all tests
npm run test:ui            # Run with UI for debugging
npm test -- --reporter=html # Generate HTML report
```

## Integration with Build Process

### Option A: CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
```

### Option B: Pre-commit Hook (Optional)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "playwright test --project=chromium"
    }
  }
}
```

## Test Report Generation

Playwright generates HTML reports by default. Configure custom reporter for CI:

```typescript
// playwright.config.ts
reporter: [
  ['html', { outputFolder: 'reports/test-results' }],
  ['json', { outputFile: 'reports/test-results/results.json' }],
  ['list'], // Console output
],
```

## Future Enhancements

1. **Visual Regression Testing**: Add `playwright-visual-regression` for comparing SVG snapshots
2. **Accessibility Testing**: Use `axe-playwright` for a11y validation
3. **Performance Testing**: Measure GSAP animation durations
4. **Cross-browser Testing**: Add Firefox and WebKit to projects
5. **Page Object Pattern**: Refactor tests into PO classes for maintainability

## Summary

This QA framework provides:
- ✅ Fast DOM-based assertions (no screenshots)
- ✅ Direct inspection of SVG attributes and coordinates
- ✅ Animation state validation via GSAP
- ✅ Easy debugging with Playwright UI
- ✅ CI-ready with HTML/JSON reports
- ✅ Extensible for more geometry problems