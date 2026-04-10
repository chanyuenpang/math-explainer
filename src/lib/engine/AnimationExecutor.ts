/**
 * AnimationExecutor - 几何动画执行器
 * 从 GeometryEngine 提取的动画执行方法
 */

import { gsap } from 'gsap';
import { normalizeEdgeId, type TopologyGraph } from '../topology';
import { ColorManager } from './ColorManager';
import { SVGQueryHelper } from './SVGQueryHelper';
import { COLORS } from '../colors';
import type { AngleArcConfig } from '../types';

// Re-export AngleArcConfig for backward compatibility
export type { AngleArcConfig };

export class AnimationExecutor {
  constructor(
    private svgHelper: SVGQueryHelper,
    private colorManager: ColorManager,
    private points: Array<{ id: string; x: number; y: number }>,
    private topology: TopologyGraph,
    private angleArcs: AngleArcConfig[] = [],
  ) {}

  // ===== 辅助方法 =====

  private get svgElement() {
    return this.svgHelper.getSVGElement();
  }

  private getPos(pointId: string): { x: number; y: number } {
    const point = this.points.find(p => p.id === pointId);
    if (!point) return { x: 0, y: 0 };
    return { x: point.x, y: 300 - point.y };
  }

  private getPointCoords(pointId: string): { x: number; y: number } {
    const point = this.points.find(p => p.id === pointId);
    if (!point) return { x: 0, y: 0 };
    return { x: point.x, y: point.y };
  }

  // ===== 底层 Unit 动画方法 =====

  /** 设置边颜色和宽度 */
  private unitSetEdge(edgeId: string, color: string, width: number = 3): void {
    const el = this.svgElement?.querySelector(`#${normalizeEdgeId(edgeId)}`);
    if (!el) {
      console.warn(`[AnimationExecutor] unitSetEdge: edge element not found for id "${edgeId}"`);
      return;
    }
    gsap.set(el, { stroke: color, strokeWidth: width });
  }

  /** 元素属性闪烁动画 */
  private unitFlashElement(selector: string, prop: string, from: number, to: number, duration: number = 0.2, repeat: number = 2): void {
    const el = this.svgElement?.querySelector(selector);
    if (!el) {
      console.warn(`[AnimationExecutor] unitFlashElement: element not found for selector "${selector}"`);
      return;
    }
    gsap.to(el, { [prop]: to, duration, yoyo: true, repeat, ease: 'power2.inOut' });
  }

  /** 设置弧线颜色和可见性 */
  private unitSetArc(arcId: string, color: string): void {
    const el = this.svgElement?.querySelector(`#${arcId}`);
    if (!el) {
      console.warn(`[AnimationExecutor] unitSetArc: arc element not found for id "${arcId}"`);
    } else {
      gsap.set(el, { stroke: color, strokeWidth: 2, opacity: 1 });
    }
    const fillEl = this.svgElement?.querySelector(`#${arcId}-fill`);
    if (fillEl) gsap.set(fillEl, { fill: color, fillOpacity: 0.3 });
  }

  /** 填充图形 */
  private unitFillShape(shapeId: string, color: string, opacity: number = 0.3): void {
    const candidates = [shapeId];
    if (shapeId.startsWith('triangle-')) {
      const triName = shapeId.replace('triangle-', '');
      candidates.push(`triangle-${triName.split('').reverse().join('')}`);
      const chars = triName.split('');
      const perms = this.getPermutations(chars);
      perms.forEach(p => candidates.push(`triangle-${p.join('')}`));
    }

    for (const id of candidates) {
      const el = this.svgElement?.querySelector(`#${id}`);
      if (el) {
        gsap.to(el, { fill: color, fillOpacity: opacity, opacity: 1, duration: 0.5 });
        return;
      }
    }
    console.warn(`[AnimationExecutor] unitFillShape: shape element not found for id "${shapeId}" (tried ${candidates.length} candidates)`);
  }

  /** 生成数组的所有排列 */
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

  /** 获取角对应的弧线 ID 和两条边 ID */
  private getAngleArcAndEdgeIds(angleId: string): { arcId: string | null; edge1: string | null; edge2: string | null } {
    const angleArc = this.angleArcs.find(a => {
      if (a.vertex === angleId) return true;
      if (a.id === angleId) return true;
      if (a.id === `angle-${angleId}`) return true;
      if (a.id === `arc-${angleId}`) return true;
      if (a.id && a.id.includes(angleId)) return true;
      return false;
    });

    if (!angleArc) return { arcId: null, edge1: null, edge2: null };

    const edges = this.topology.getEdges();
    const e1 = edges.find(e => (e.from === angleArc.vertex && e.to === angleArc.from) || (e.to === angleArc.vertex && e.from === angleArc.from));
    const e2 = edges.find(e => (e.from === angleArc.vertex && e.to === angleArc.to) || (e.to === angleArc.vertex && e.from === angleArc.to));

    return {
      arcId: angleArc.id,
      edge1: e1?.id || null,
      edge2: e2?.id || null
    };
  }

  /** 获取角对应的两条边 ID（向后兼容） */
  private getAngleEdgeIds(angleId: string): [string | null, string | null] {
    const { edge1, edge2 } = this.getAngleArcAndEdgeIds(angleId);
    return [edge1, edge2];
  }

  // ===== 核心动画方法 =====

  highlightEdge(edgeId: string, color?: string): void {
    if (!this.svgElement) return;
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`) as SVGLineElement;
    if (!el) return;

    const highlightColor = color || this.colorManager.assignColor('edge-' + edgeId);

    // Set the highlight color
    gsap.set(el, { stroke: highlightColor });

    // Flash strokeWidth
    gsap.to(el, { strokeWidth: 4, duration: 0.3 });
    gsap.to(el, {
      strokeWidth: 5,
      duration: 0.2,
      yoyo: true,
      repeat: 2,
      delay: 0.3
    });
  }

  drawEdge(edgeId: string, delay: number = 0): void {
    if (!this.svgElement) return;
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`);
    if (!el) return;

    gsap.fromTo(el,
      { opacity: 0, strokeDasharray: '200', strokeDashoffset: '200' },
      { opacity: 1, strokeDashoffset: '0', duration: 0.4, delay, ease: 'power2.out' }
    );
  }

  hideEdge(edgeId: string): void {
    if (!this.svgElement) return;
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`);
    if (!el) return;

    gsap.to(el, { opacity: 0.2, duration: 0.3 });
  }

  fillTriangle(triangleId: string, color: string): void {
    if (!this.svgElement) return;
    const el = this.svgElement.querySelector(`#triangle-${triangleId}`);
    if (!el) {
      console.warn(`[AnimationExecutor] fillTriangle: triangle element not found for id "triangle-${triangleId}"`);
      return;
    }

    gsap.to(el, { fill: color, fillOpacity: 0.3, opacity: 1, duration: 0.5 });
  }

  highlightArc(arcId: string, color?: string): void {
    if (!this.svgElement) return;
    const el = this.svgElement.querySelector(`#${arcId}`);
    if (!el) return;

    const highlightColor = color || this.colorManager.assignColor('arc-' + arcId);

    gsap.set(el, { stroke: highlightColor });
    gsap.to(el, { strokeWidth: 4, duration: 0.3 });
    gsap.to(el, {
      strokeWidth: 5,
      duration: 0.2,
      yoyo: true,
      repeat: 2,
      delay: 0.3
    });
  }

  drawArc(arcId: string, color?: string): void {
    if (!this.svgElement) return;

    const arcColor = color || this.colorManager.assignColor('arc-' + arcId);

    const el = this.svgElement.querySelector(`#${arcId}`);
    if (el) {
      gsap.set(el, { stroke: arcColor });
      gsap.fromTo(el,
        { opacity: 0, strokeDasharray: '100', strokeDashoffset: '100' },
        { opacity: 1, strokeDashoffset: '0', duration: 0.6, ease: 'power2.out' }
      );
    }

    const fillEl = this.svgElement.querySelector(`#${arcId}-fill`);
    if (fillEl) {
      gsap.set(fillEl, { fill: arcColor, fillOpacity: 0.15 });
    }
  }

  flashAngle(angleIdOrConfig: string | { id: string; color?: string }, defaultColor?: string): void {
    if (!this.svgElement) return;

    const angleId = typeof angleIdOrConfig === 'string' ? angleIdOrConfig : angleIdOrConfig.id;
    const color = typeof angleIdOrConfig === 'string' ? defaultColor : (angleIdOrConfig.color || defaultColor);

    const arcId = angleId.startsWith('arc-') ? angleId : `arc-${angleId}`;
    const el = this.svgElement.querySelector(`#${arcId}`) || this.svgElement.querySelector(`#angle-${angleId}`);

    const flashColor = color || this.colorManager.assignColor('angle-' + angleId);

    if (el) {
      gsap.set(el, { stroke: flashColor, strokeWidth: 2, opacity: 1 });
      gsap.to(el, { strokeWidth: 4, duration: 0.2, yoyo: true, repeat: 3, ease: 'power2.inOut' });
    }

    const fillEl = this.svgElement.querySelector(`#${arcId}-fill`);
    if (fillEl) {
      gsap.set(fillEl, { fill: flashColor });
      gsap.fromTo(fillEl,
        { fillOpacity: 0.1 },
        { fillOpacity: 0.35, duration: 0.3, yoyo: true, repeat: 3, ease: 'power2.inOut' }
      );
    }

    const angleArc = this.angleArcs.find(a => a.vertex === angleId || a.id === arcId);
    if (angleArc) {
      const fromPoint = this.points.find(p => p.id === angleArc.from);
      const toPoint = this.points.find(p => p.id === angleArc.to);
      const vertexPoint = this.points.find(p => p.id === angleArc.vertex);

      if (fromPoint && toPoint && vertexPoint) {
        const edges = this.topology.getEdges();
        const edge1 = edges.find(e =>
          (e.from === angleArc.vertex && e.to === fromPoint.id) ||
          (e.to === angleArc.vertex && e.from === fromPoint.id)
        );
        const edge2 = edges.find(e =>
          (e.from === angleArc.vertex && e.to === toPoint.id) ||
          (e.from === toPoint.id && e.to === angleArc.vertex)
        );

        [edge1, edge2].forEach(edge => {
          if (!edge) return;
          const edgeEl = this.svgElement!.querySelector(`#${edge.id}`) as SVGLineElement;
          if (!edgeEl) return;

          gsap.set(edgeEl, { stroke: flashColor, strokeWidth: 3.5 });
          gsap.to(edgeEl, {
            strokeWidth: 4.5,
            duration: 0.2,
            yoyo: true,
            repeat: 2,
            delay: 0.3
          });
        });
      }
    }
  }

  showAngle(angleId: string, color?: string): void {
    if (!this.svgElement) return;

    const angleColor = color || this.colorManager.assignColor('angle-' + angleId);
    const arcId = angleId.startsWith('arc-') ? angleId : `arc-${angleId}`;

    const arcEl = this.svgElement.querySelector(`#${arcId}`);
    if (arcEl) {
      gsap.set(arcEl, { stroke: angleColor, strokeWidth: 2, opacity: 1 });
      gsap.to(arcEl, { strokeWidth: 4, duration: 0.2, yoyo: true, repeat: 3, ease: 'power2.inOut' });
    }

    const fillEl = this.svgElement.querySelector(`#${arcId}-fill`);
    if (fillEl) {
      gsap.set(fillEl, { fill: angleColor });
      gsap.fromTo(fillEl,
        { fillOpacity: 0.1 },
        { fillOpacity: 0.35, duration: 0.3, yoyo: true, repeat: 3, ease: 'power2.inOut' }
      );
    }

    const angleArc = this.angleArcs.find(a => a.vertex === angleId || a.id === arcId);
    if (angleArc) {
      const fromPoint = this.points.find(p => p.id === angleArc.from);
      const toPoint = this.points.find(p => p.id === angleArc.to);
      const vertexPoint = this.points.find(p => p.id === angleArc.vertex);

      if (fromPoint && toPoint && vertexPoint) {
        const edges = this.topology.getEdges();
        const edge1 = edges.find(e =>
          (e.from === angleArc.vertex && e.to === fromPoint.id) ||
          (e.to === angleArc.vertex && e.from === fromPoint.id)
        );
        const edge2 = edges.find(e =>
          (e.from === angleArc.vertex && e.to === toPoint.id) ||
          (e.from === toPoint.id && e.to === angleArc.vertex)
        );

        [edge1, edge2].forEach(edge => {
          if (!edge) return;
          const edgeEl = this.svgElement!.querySelector(`#${edge.id}`) as SVGLineElement;
          if (!edgeEl) return;

          gsap.set(edgeEl, { stroke: angleColor, strokeWidth: 3.5 });
          gsap.to(edgeEl, {
            strokeWidth: 4.5,
            duration: 0.2,
            yoyo: true,
            repeat: 2,
            delay: 0.3
          });
        });
      }
    }
  }

  // ===== 高级动画方法 =====

  showRightAngle(pointId: string): void {
    const rightAngleArc = this.angleArcs.find(a => 
      a.vertex === pointId && a.isRightAngle
    );
    const arcId = rightAngleArc?.id || `arc-${pointId}`;
    const rightAngleColor = this.colorManager.assignColor('right-angle-' + pointId);
    this.drawArc(arcId, rightAngleColor);
    this.flashAngle(pointId, rightAngleColor);
  }

  highlightEdgesForCompare(edges: string[]): [string, string] | null {
    if (!this.svgElement || edges.length < 2) return null;

    const [edgeId1, edgeId2] = edges;
    const color1 = this.colorManager.assignColor('compare-edge1-' + edgeId1);
    const color2 = this.colorManager.assignColor('compare-edge2-' + edgeId2);

    const normalizedEdgeId1 = normalizeEdgeId(edgeId1);
    const normalizedEdgeId2 = normalizeEdgeId(edgeId2);
    const el1 = this.svgElement.querySelector(`#${normalizedEdgeId1}`);
    const el2 = this.svgElement.querySelector(`#${normalizedEdgeId2}`);
    if (!el1 || !el2) return null;

    gsap.to(el1, { stroke: color1, strokeWidth: 3, duration: 0.3 });
    gsap.to(el2, { stroke: color2, strokeWidth: 3, duration: 0.3 });

    return [color1, color2];
  }

  compareEdge(edges: [string, string], label: string, colors?: [string, string]): void {
    if (!this.svgElement) return;

    const [edgeId1, edgeId2] = edges;
    const normalizedEdgeId1 = normalizeEdgeId(edgeId1);
    const normalizedEdgeId2 = normalizeEdgeId(edgeId2);
    const el1 = this.svgElement.querySelector(`#${normalizedEdgeId1}`);
    const el2 = this.svgElement.querySelector(`#${normalizedEdgeId2}`);
    if (!el1 || !el2) return;

    const x1 = parseFloat(el1.getAttribute('x1') || '0');
    const y1 = parseFloat(el1.getAttribute('y1') || '0');
    const x2 = parseFloat(el1.getAttribute('x2') || '0');
    const y2 = parseFloat(el1.getAttribute('y2') || '0');
    const len1 = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    const x3 = parseFloat(el2.getAttribute('x1') || '0');
    const y3 = parseFloat(el2.getAttribute('y1') || '0');
    const x4 = parseFloat(el2.getAttribute('x2') || '0');
    const y4 = parseFloat(el2.getAttribute('y2') || '0');
    const len2 = Math.sqrt((x4 - x3) ** 2 + (y4 - y3) ** 2);

    const ns = 'http://www.w3.org/2000/svg';
    const baseX = 100;
    const targetY = 50;

    const [color1, color2] = colors || [
      this.colorManager.assignColor('compare-edge1-' + edgeId1),
      this.colorManager.assignColor('compare-edge2-' + edgeId2)
    ];

    const copy1 = document.createElementNS(ns, 'line');
    copy1.setAttribute('x1', String(baseX));
    copy1.setAttribute('y1', String(targetY));
    copy1.setAttribute('x2', String(baseX + len1));
    copy1.setAttribute('y2', String(targetY));
    copy1.setAttribute('stroke', color1);
    copy1.setAttribute('stroke-width', '3');
    copy1.setAttribute('class', 'flyout-copy');
    this.svgElement.appendChild(copy1);

    const copy2 = document.createElementNS(ns, 'line');
    copy2.setAttribute('x1', String(baseX + len1 + 30));
    copy2.setAttribute('y1', String(targetY));
    copy2.setAttribute('x2', String(baseX + len1 + 30 + len2));
    copy2.setAttribute('y2', String(targetY));
    copy2.setAttribute('stroke', color2);
    copy2.setAttribute('stroke-width', '3');
    copy2.setAttribute('class', 'flyout-copy');
    this.svgElement.appendChild(copy2);

    gsap.fromTo(copy1, { opacity: 0.3, y: y1 - targetY }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
    gsap.fromTo(copy2, { opacity: 0.3, y: y3 - targetY }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 });

    const eqText = document.createElementNS(ns, 'text');
    eqText.setAttribute('x', String(baseX + len1 + 15));
    eqText.setAttribute('y', String(targetY + 5));
    eqText.setAttribute('text-anchor', 'middle');
    eqText.setAttribute('font-size', '16');
    eqText.setAttribute('fill', color2);
    eqText.setAttribute('font-weight', 'bold');
    eqText.setAttribute('class', 'flyout-copy');
    eqText.textContent = '=';
    this.svgElement.appendChild(eqText);
    gsap.fromTo(eqText, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.8 });
  }

  flyoutCompare(edges: [string, string], label: string): void {
    const colors = this.highlightEdgesForCompare(edges);
    setTimeout(() => {
      this.compareEdge(edges, label, colors || undefined);
    }, 600);
  }

  moveEdge(fromEdgeId: string, toEdgeId: string): void {
    if (!this.svgElement) return;

    const fromEdge = this.topology.getEdge(fromEdgeId);
    const toEdge = this.topology.getEdge(toEdgeId);
    if (!fromEdge || !toEdge) return;

    const fromStart = this.points.find(p => p.id === fromEdge.from);
    const fromEnd = this.points.find(p => p.id === fromEdge.to);
    const toStart = this.points.find(p => p.id === toEdge.from);
    const toEnd = this.points.find(p => p.id === toEdge.to);
    if (!fromStart || !fromEnd || !toStart || !toEnd) return;

    const normalizedFromEdgeId = normalizeEdgeId(fromEdgeId);
    const fromEl = this.svgElement.querySelector(`#${normalizedFromEdgeId}`);
    if (!fromEl) return;

    const dx = toEnd.x - fromEnd.x;
    const dy = toEnd.y - fromEnd.y;

    gsap.to(fromEl, { strokeDasharray: '8,4', duration: 0.3 });
    gsap.to(fromEl, { x: dx, y: -dy, duration: 1, ease: 'power2.inOut', delay: 0.3 });
    gsap.to(fromEl, { strokeDasharray: '0', duration: 0.3, delay: 1.3 });
  }

  moveTriangle(fromTriangleId: string, toTriangleId: string): void {
    if (!this.svgElement) return;

    const el = this.svgElement.querySelector(`#triangle-${fromTriangleId}`);
    if (!el) return;

    const fromVertices = fromTriangleId.split('');
    const toVertices = toTriangleId.split('');

    if (fromVertices.length !== 3 || toVertices.length !== 3) return;

    const sourcePoints = fromVertices.map(id => this.getPointCoords(id));
    const targetPoints = toVertices.map(id => this.getPointCoords(id));
    if (!sourcePoints || !targetPoints) return;

    const sourceCenter = {
      x: (sourcePoints[0].x + sourcePoints[1].x + sourcePoints[2].x) / 3,
      y: 300 - (sourcePoints[0].y + sourcePoints[1].y + sourcePoints[2].y) / 3
    };
    const targetCenter = {
      x: (targetPoints[0].x + targetPoints[1].x + targetPoints[2].x) / 3,
      y: 300 - (targetPoints[0].y + targetPoints[1].y + targetPoints[2].y) / 3
    };

    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;

    gsap.to(el, { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.6, duration: 1.5, ease: 'power2.inOut' });
  }

  showEqualMarkForPair(edge1: string, edge2: string): void {
    if (!this.svgElement) return;

    const normalizedEdgeId1 = normalizeEdgeId(edge1);
    const normalizedEdgeId2 = normalizeEdgeId(edge2);
    const el1 = this.svgElement.querySelector(`#${normalizedEdgeId1}`) as SVGLineElement;
    const el2 = this.svgElement.querySelector(`#${normalizedEdgeId2}`) as SVGLineElement;
    if (!el1 || !el2) return;

    const x1 = (parseFloat(el1.getAttribute('x1') || '0') + parseFloat(el1.getAttribute('x2') || '0')) / 2;
    const y1 = (parseFloat(el1.getAttribute('y1') || '0') + parseFloat(el1.getAttribute('y2') || '0')) / 2;
    const x2 = (parseFloat(el2.getAttribute('x1') || '0') + parseFloat(el2.getAttribute('x2') || '0')) / 2;
    const y2 = (parseFloat(el2.getAttribute('y1') || '0') + parseFloat(el2.getAttribute('y2') || '0')) / 2;

    const ns = 'http://www.w3.org/2000/svg';
    const eqText = document.createElementNS(ns, 'text');
    eqText.setAttribute('x', String((x1 + x2) / 2));
    eqText.setAttribute('y', String((y1 + y2) / 2 + 5));
    eqText.setAttribute('text-anchor', 'middle');
    eqText.setAttribute('font-size', '14');
    eqText.setAttribute('fill', COLORS.green);
    eqText.setAttribute('font-weight', 'bold');
    eqText.setAttribute('class', 'equal-mark flyout-copy');
    eqText.textContent = '=';
    this.svgElement.appendChild(eqText);

    gsap.fromTo(eqText, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
  }
}