import { type Page, type Locator, expect } from '@playwright/test';

export const SELECTORS = {
  pointLabel: (label: string) => `text=${label}`,
  edge: (id: string) => `#${id}`,
  triangle: (id: string) => `#triangle-${id}`,
  arc: (id: string) => `#${id}`,
  arcFill: (id: string) => `#${id}-fill`,
  nextButton: 'button:has-text("下一步")',
  prevButton: 'button:has-text("上一步")',
  stepIndicator: '.step-indicator',
};

export async function waitForGsapAnimation(page: Page, duration: number = 500): Promise<void> {
  await page.waitForTimeout(duration + 100);
}

export async function getSVGElement(page: Page, id: string): Promise<Locator> {
  return page.locator(`#${id}`);
}

export async function assertPointLabel(page: Page, label: string): Promise<void> {
  const labelEl = page.locator(SELECTORS.pointLabel(label));
  await expect(labelEl).toBeVisible();
}

export async function assertEdgePath(page: Page, edgeId: string): Promise<void> {
  const edge = page.locator(SELECTORS.edge(edgeId));
  await expect(edge).toBeAttached();
}

export async function assertAngleArc(page: Page, arcId: string): Promise<void> {
  const arc = page.locator(SELECTORS.arc(arcId));
  await expect(arc).toBeAttached();
}

export async function assertFillTriangle(page: Page, triangleId: string): Promise<void> {
  const triangle = page.locator(SELECTORS.triangle(triangleId));
  await expect(triangle).toBeAttached();
}

export async function triggerStep(page: Page, stepIndex: number): Promise<void> {
  const currentStep = await getCurrentStep(page);
  const diff = stepIndex - currentStep;
  
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      await page.click(SELECTORS.nextButton);
    }
  } else if (diff < 0) {
    for (let i = 0; i < Math.abs(diff); i++) {
      await page.click(SELECTORS.prevButton);
    }
  }
  
  await waitForGsapAnimation(page, 300);
}

async function getCurrentStep(page: Page): Promise<number> {
  const stepBadge = page.locator('span:has-text("第")');
  const text = await stepBadge.textContent();
  const match = text?.match(/第\s*(\d+)\s*步/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function assertEdgeCoordinates(
  page: Page,
  edgeId: string,
  expected: { x1: number; y1: number; x2: number; y2: number }
): Promise<void> {
  const edge = page.locator(SELECTORS.edge(edgeId));
  await expect(edge).toHaveAttribute('x1', String(expected.x1));
  await expect(edge).toHaveAttribute('y1', String(300 - expected.y1));
  await expect(edge).toHaveAttribute('x2', String(expected.x2));
  await expect(edge).toHaveAttribute('y2', String(300 - expected.y2));
}