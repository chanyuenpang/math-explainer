/**
 * ColorManager - 统一颜色管理
 * 为几何元素分配和管理颜色
 */

import { COLORS } from '../colors';

export class ColorManager {
  private colorContext: Map<string, string> = new Map();
  private autoColorIndex: number = 0;
  private readonly autoColors: string[] = [
    COLORS.green,
    COLORS.blue,
    COLORS.orange,
    COLORS.purple,
    COLORS.red
  ];

  /**
   * Assign a color for a geometric element (same element returns same color within a step)
   */
  assignColor(elementId: string): string {
    if (this.colorContext.has(elementId)) {
      return this.colorContext.get(elementId)!;
    }
    const color = this.autoColors[this.autoColorIndex % this.autoColors.length];
    this.autoColorIndex++;
    this.colorContext.set(elementId, color);
    return color;
  }

  /**
   * Get color for element if already assigned
   */
  getColor(elementId: string): string | undefined {
    return this.colorContext.get(elementId);
  }

  /**
   * Set specific color for element
   */
  setColor(elementId: string, color: string): void {
    this.colorContext.set(elementId, color);
  }

  /**
   * Reset color context at the beginning of each step
   */
  reset(): void {
    this.colorContext.clear();
    this.autoColorIndex = 0;
  }

  /**
   * Get next auto color without assigning
   */
  peekNextColor(): string {
    return this.autoColors[this.autoColorIndex % this.autoColors.length];
  }

  /**
   * Get all assigned colors as readonly map
   */
  getColorContext(): ReadonlyMap<string, string> {
    return this.colorContext;
  }
}