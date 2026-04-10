/**
 * SVGQueryHelper - SVG 元素查询辅助工具
 * 提供统一的 SVG 元素查询和操作方法
 */

import { normalizeEdgeId } from '../topology';

export class SVGQueryHelper {
  constructor(private svgElement: SVGSVGElement | null) {}

  setSVGElement(svg: SVGSVGElement): void {
    this.svgElement = svg;
  }

  getSVGElement(): SVGSVGElement | null {
    return this.svgElement;
  }

  // ===== Edge 查询 =====

  /**
   * 查询边元素
   */
  queryEdge(edgeId: string): SVGLineElement | null {
    if (!this.svgElement) return null;
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    return this.svgElement.querySelector(`#${normalizedEdgeId}`) as SVGLineElement;
  }

  /**
   * 查询多条边
   */
  queryEdges(edgeIds: string[]): SVGLineElement[] {
    return edgeIds
      .map(id => this.queryEdge(id))
      .filter((el): el is SVGLineElement => el !== null);
  }

  // ===== Arc 查询 =====

  /**
   * 查询弧线元素
   */
  queryArc(arcId: string): SVGPathElement | null {
    if (!this.svgElement) return null;
    const normalizedArcId = arcId.startsWith('arc-') ? arcId : `arc-${arcId}`;
    return this.svgElement.querySelector(`#${normalizedArcId}`) as SVGPathElement;
  }

  /**
   * 查询弧线填充元素
   */
  queryArcFill(arcId: string): SVGPathElement | null {
    if (!this.svgElement) return null;
    const normalizedArcId = arcId.startsWith('arc-') ? arcId : `arc-${arcId}`;
    return this.svgElement.querySelector(`#${normalizedArcId}-fill`) as SVGPathElement;
  }

  // ===== Triangle 查询 =====

  /**
   * 查询三角形元素
   */
  queryTriangle(triangleId: string): SVGPolygonElement | SVGPathElement | null {
    if (!this.svgElement) return null;
    
    // 尝试多种可能的 ID 命名方式
    const candidates = [triangleId];
    if (triangleId.startsWith('triangle-')) {
      const triName = triangleId.replace('triangle-', '');
      // 尝试反转
      candidates.push(`triangle-${triName.split('').reverse().join('')}`);
      // 尝试所有可能的排列
      const chars = triName.split('');
      const perms = this.getPermutations(chars);
      perms.forEach(p => candidates.push(`triangle-${p.join('')}`));
    }
    
    for (const id of candidates) {
      const el = this.svgElement.querySelector(`#${id}`);
      if (el) return el as SVGPolygonElement | SVGPathElement;
    }
    
    return null;
  }

  /**
   * 查询多条三角形
   */
  queryTriangles(triangleIds: string[]): (SVGPolygonElement | SVGPathElement)[] {
    return triangleIds
      .map(id => this.queryTriangle(id))
      .filter((el): el is SVGPolygonElement | SVGPathElement => el !== null);
  }

  // ===== Angle 查询 =====

  /**
   * 查询角元素（弧线或两条边）
   */
  queryAngle(angleId: string): { arc: SVGPathElement | null; edges: SVGLineElement[] } {
    if (!this.svgElement) return { arc: null, edges: [] };

    const arcId = angleId.startsWith('arc-') ? angleId : `arc-${angleId}`;
    const arc = this.svgElement.querySelector(`#${arcId}`) || 
                this.svgElement.querySelector(`#angle-${angleId}`);

    return {
      arc: arc as SVGPathElement | null,
      edges: []
    };
  }

  // ===== 通用查询 =====

  /**
   * 通过选择器查询单个元素
   */
  queryOne<T extends Element>(selector: string): T | null {
    if (!this.svgElement) return null;
    return this.svgElement.querySelector(selector) as T | null;
  }

  /**
   * 通过选择器查询多个元素
   */
  queryAll<T extends Element>(selector: string): T[] {
    if (!this.svgElement) return [];
    return Array.from(this.svgElement.querySelectorAll(selector)) as T[];
  }

  /**
   * 查询所有边
   */
  queryAllEdges(): SVGLineElement[] {
    return this.queryAll<SVGLineElement>('line');
  }

  /**
   * 查询所有弧线
   */
  queryAllArcs(): SVGPathElement[] {
    return this.queryAll<SVGPathElement>('path[id^="arc-"]');
  }

  /**
   * 查询所有三角形
   */
  queryAllTriangles(): (SVGPolygonElement | SVGPathElement)[] {
    const polygons = this.queryAll<SVGPolygonElement>('polygon');
    const paths = this.queryAll<SVGPathElement>('path[id^="triangle-"]');
    return [...polygons, ...paths];
  }

  /**
   * 移除所有带有指定类的元素
   */
  removeByClass(className: string): void {
    if (!this.svgElement) return;
    const elements = this.svgElement.querySelectorAll(`.${className}`);
    elements.forEach(el => el.remove());
  }

  // ===== 辅助方法 =====

  /**
   * 生成数组的所有排列
   */
  private getPermutations(arr: string[]): string[][] {
    if (arr.length <= 1) return [arr];
    const result: string[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = this.getPermutations(remaining);
      for (const p of perms) {
        result.push([current, ...p]);
      }
    }
    return result;
  }

  /**
   * 获取元素中心点坐标
   */
  getElementCenter(element: SVGLineElement): { x: number; y: number } {
    const x1 = parseFloat(element.getAttribute('x1') || '0');
    const y1 = parseFloat(element.getAttribute('y1') || '0');
    const x2 = parseFloat(element.getAttribute('x2') || '0');
    const y2 = parseFloat(element.getAttribute('y2') || '0');
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2
    };
  }

  /**
   * 获取元素长度
   */
  getElementLength(element: SVGLineElement): number {
    const x1 = parseFloat(element.getAttribute('x1') || '0');
    const y1 = parseFloat(element.getAttribute('y1') || '0');
    const x2 = parseFloat(element.getAttribute('x2') || '0');
    const y2 = parseFloat(element.getAttribute('y2') || '0');
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
}