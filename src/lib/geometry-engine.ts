import { TopologyGraph, type Point, type Connection, type Edge, type Angle, normalizeEdgeId } from './topology';

export interface GeometryConfig {
  points: Point[];
  connections: Connection[];
  edgeColors?: Record<string, string>;
  rightAngles?: string[];
  angleArcs?: AngleArcConfig[];
  equalPairs?: Record<string, string>;
}

export interface AngleArcConfig {
  id: string;
  vertex: string;
  from: string;
  to: string;
  color?: string;
  path?: string;
  isRightAngle?: boolean;
}

export interface AnimationIntent {
  type: IntentType;
  [key: string]: any;
}

export type IntentType = 
  | 'highlightEdge'
  | 'highlightEdges'
  | 'flashAngle'
  | 'flashAngles'
  | 'fillTriangle'
  | 'fillTriangles'
  | 'label'
  | 'labels'
  | 'drawEdge'
  | 'drawEdges'
  | 'hideEdge'
  | 'hideEdges'
  | 'showEqual'
  | 'flyoutCompare'
  | 'moveEdge'
  | 'moveTriangle'
  | 'highlightArc'
  | 'highlightArcs'
  | 'drawArc'
  | 'drawArcs'
  | 'showRightAngle'
  | 'showRightAngles'
  | 'highlights';

export const COLORS = {
  default: '#D1D5DB',
  defaultPoint: '#6B7280',
  highlight: '#3B82F6',
  highlightWidth: 4,
  triangle1: 'rgba(239,68,68,0.15)',
  triangle2: 'rgba(16,185,129,0.15)',
  angle: '#F59E0B',
  angleHighlight: '#3B82F6',
  text: '#374151',
  background: '#F9FAFB',
  blue: '#2563EB',
  red: '#EF4444',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
};

export class GeometryEngine {
  private topology: TopologyGraph;
  private config: GeometryConfig;
  private svgElement: SVGSVGElement | null = null;
  private points: Array<{ id: string; x: number; y: number }>;

  // Auto color allocator
  private autoColorIndex = 0;
  private autoColors = [COLORS.red, COLORS.green, COLORS.blue, COLORS.orange, COLORS.purple];

  private getAutoColor(): string {
    const color = this.autoColors[this.autoColorIndex % this.autoColors.length];
    this.autoColorIndex++;
    return color;
  }

  private resetAutoColor(): void {
    this.autoColorIndex = 0;
  }

  constructor(config: GeometryConfig) {
    this.config = config;
    this.points = config.points;
    this.topology = new TopologyGraph(
      config.points,
      config.connections,
      config.edgeColors
    );
  }

  setSVGElement(svg: SVGSVGElement): void {
    this.svgElement = svg;
  }

  getTopology(): TopologyGraph {
    return this.topology;
  }

  getPoints(): Array<{ id: string; x: number; y: number }> {
    return this.points;
  }

  getEdges(): Edge[] {
    return this.topology.getEdges();
  }

  getAngleArcs(): AngleArcConfig[] {
    return this.config.angleArcs || [];
  }

  getEqualPairs(): Record<string, string> {
    return this.config.equalPairs || {};
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

  reset(): void {
    if (!this.svgElement) return;
    const svg = this.svgElement;

    svg.querySelectorAll('line').forEach(el => {
      (window as any).gsap.set(el, { stroke: COLORS.default, strokeWidth: 2, opacity: 1, x: 0, y: 0, strokeDasharray: 'none' });
    });

    svg.querySelectorAll('path[id^="bad-"]').forEach(el => {
      (window as any).gsap.set(el, { stroke: COLORS.angle, strokeWidth: 2, opacity: 0 });
    });

    svg.querySelectorAll('polygon, path[id^="triangle-"]').forEach(el => {
      (window as any).gsap.set(el, { fill: 'transparent', fillOpacity: 0, opacity: 0 });
    });

    svg.querySelectorAll('.flyout-copy').forEach(el => el.remove());
  }

  execute(intents: AnimationIntent[]): void {
    intents.forEach(intent => this.executeIntent(intent));
  }

  /**
   * Unified highlights interface - auto-detects target type and executes appropriate animation
   * @param highlights Array of {target, color} where target uses prefix convention:
   *   - "angle-*" → highlightAngle (arc + its 2 edges, same color, flash)
   *   - "edge-*" → highlightEdge (single edge flash)
   *   - "face-*" → highlightFace (triangle fill)
   */
  executeHighlights(highlights: Array<{target: string, color?: string}>): void {
    if (!this.svgElement) return;
    
    // Reset auto color allocator for this batch
    this.resetAutoColor();
    
    highlights.forEach(({target, color}) => {
      // Auto-assign color if not specified
      const autoColor = color || this.getAutoColor();
      
      if (target.startsWith('angle-')) {
        const angleId = target.substring(6); // Remove 'angle-' prefix
        this.flashAngle(angleId, autoColor);
      } else if (target.startsWith('edge-')) {
        const edgeId = target.substring(5); // Remove 'edge-' prefix
        this.highlightEdge(edgeId, autoColor);
      } else if (target.startsWith('face-')) {
        const faceId = target.substring(5); // Remove 'face-' prefix
        this.fillTriangle(faceId, autoColor);
      } else if (target.startsWith('arc-')) {
        const arcId = target.substring(4); // Remove 'arc-' prefix
        this.highlightArc(arcId, autoColor);
      } else {
        console.warn(`[executeHighlights] Unknown target prefix: ${target}`);
      }
    });
  }

  private executeIntent(intent: AnimationIntent): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    if (!gsap) return;

    switch (intent.type) {
      case 'highlightEdge':
        this.highlightEdge(intent.edge, intent.color);
        break;
      case 'highlightEdges':
        console.log('[highlightEdges] called with edges:', intent.edges, 'color:', intent.color);
        if (intent.edges && intent.edges.length > 0 && typeof intent.edges[0] === 'object') {
          // 新格式：[{edge: "AB", color: "red"}, {edge: "DE", color: "green"}]
          intent.edges.forEach((item: any) => this.highlightEdge(item.edge, item.color));
        } else {
          // 旧格式：["AB", "DE"]，使用统一的 intent.color
          (intent.edges || []).forEach((edgeId: string) => this.highlightEdge(edgeId, intent.color));
        }
        break;
      case 'flashAngle':
        this.flashAngle(intent.angle, intent.color);
        break;
      case 'flashAngles':
        (intent.angles || []).forEach((angleId: string) => this.flashAngle(angleId, intent.color));
        break;
      case 'fillTriangle':
        this.fillTriangle(intent.triangle, intent.color || this.getAutoColor());
        break;
      case 'fillTriangles':
        (intent.triangles || []).forEach((triId: string) => this.fillTriangle(triId, intent.colors?.[triId] || intent.color));
        break;
      case 'label':
        break;
      case 'labels':
        break;
      case 'drawEdge':
        this.drawEdge(intent.edge);
        break;
      case 'drawEdges':
        (intent.edges || []).forEach((edgeId: string, i: number) => this.drawEdge(edgeId, i * 0.25));
        break;
      case 'hideEdge':
        this.hideEdge(intent.edge);
        break;
      case 'hideEdges':
        (intent.edges || []).forEach((edgeId: string) => this.hideEdge(edgeId));
        break;
      case 'showEqual':
        break;
      case 'flyoutCompare':
        this.flyoutCompare(intent.edges, intent.label);
        break;
      case 'moveEdge':
        this.moveEdge(intent.edge, intent.targetEdge);
        break;
      case 'moveTriangle':
        this.moveTriangle(intent.triangle, intent.targetTriangle);
        break;
      case 'highlightArc':
        this.highlightArc(intent.arc, intent.color);
        break;
      case 'highlightArcs':
        if (intent.arcs && intent.arcs.length > 0 && typeof intent.arcs[0] === 'object') {
          intent.arcs.forEach((item: any) => this.highlightArc(item.arc, item.color));
        } else {
          (intent.arcs || []).forEach((arcId: string) => this.highlightArc(arcId, intent.color));
        }
        break;
      case 'drawArc':
        this.drawArc(intent.arc, intent.color);
        break;
      case 'drawArcs':
        (intent.arcs || []).forEach((arcId: string) => this.drawArc(arcId, intent.color));
        break;
      case 'showRightAngle':
        this.showRightAngle(intent.point);
        break;
      case 'showRightAngles':
        (intent.points || []).forEach((pointId: string) => this.showRightAngle(pointId));
        break;
      case 'highlights':
        this.executeHighlights(intent.highlights || []);
        break;
    }
  }

  private highlightEdge(edgeId: string, color?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    
    // Normalize edgeId to canonical form (e.g., "BA" -> "AB")
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`) as SVGLineElement;
    if (!el) return;

    // Store original color from config to restore after animation (Bug 1 fix)
    const originalColor = this.config.edgeColors?.[normalizedEdgeId] || COLORS.default;
    const originalWidth = parseFloat(el.getAttribute('stroke-width') || '2');
    // Use auto color if no color specified
    const highlightColor = color || this.getAutoColor();

    console.log('[highlightEdge] animating edge:', normalizedEdgeId, 'with color:', highlightColor, 'original:', originalColor);
    gsap.to(el, { stroke: highlightColor, strokeWidth: 4, duration: 0.3 });
    gsap.to(el, {
      strokeWidth: 5,
      duration: 0.2,
      yoyo: true,
      repeat: 2,
      delay: 0.3,
      onComplete: () => {
        // Restore original edge color after animation
        gsap.set(el, { stroke: originalColor, strokeWidth: originalWidth });
        console.log('[highlightEdge] animation complete for edge:', normalizedEdgeId, 'restored color:', originalColor);
      }
    });
  }

  private drawEdge(edgeId: string, delay: number = 0): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`);
    if (!el) return;

    gsap.fromTo(el,
      { opacity: 0, strokeDasharray: '200', strokeDashoffset: '200' },
      { opacity: 1, strokeDashoffset: '0', duration: 0.4, delay, ease: 'power2.out' }
    );
  }

  private hideEdge(edgeId: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`);
    if (!el) return;

    gsap.to(el, { opacity: 0.2, duration: 0.3 });
  }

  private flashAngle(angleIdOrConfig: string | {id: string, color?: string}, defaultColor?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

    const colorMap: Record<string, string> = {
      'orange': COLORS.orange,
      'red': COLORS.red,
      'green': COLORS.green,
      'blue': COLORS.blue,
      'purple': COLORS.purple,
    };

    const angleId = typeof angleIdOrConfig === 'string' ? angleIdOrConfig : angleIdOrConfig.id;
    const color = typeof angleIdOrConfig === 'string' ? defaultColor : (angleIdOrConfig.color || defaultColor);
    // Use auto color if no color specified
    const flashColor = color ? (colorMap[color] || color) : this.getAutoColor();

    console.log('[flashAngle] animating angle:', angleId, 'with color:', flashColor, 'colorParam:', color);

    const arcId = angleId.startsWith('bad-') ? angleId : `bad-${angleId}`;
    const el = this.svgElement.querySelector(`#${arcId}`) || this.svgElement.querySelector(`#angle-${angleId}`);
    
    if (el) {
      gsap.fromTo(el,
        { stroke: flashColor, strokeWidth: 2, opacity: 1 },
        { strokeWidth: 4, duration: 0.2, yoyo: true, repeat: 3, ease: 'power2.inOut' }
      );
    }

    const fillEl = this.svgElement.querySelector(`#${arcId}-fill`);
    if (fillEl) {
      gsap.set(fillEl, { fill: flashColor });
      gsap.fromTo(fillEl,
        { fillOpacity: 0.1 },
        { fillOpacity: 0.35, duration: 0.3, yoyo: true, repeat: 3, ease: 'power2.inOut' }
      );
    }

    const angleArc = this.config.angleArcs?.find(a => a.vertex === angleId || a.id === arcId);
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

          // Store original color to restore after animation
          const originalColor = edgeEl.getAttribute('stroke') || COLORS.default;

          console.log('[flashAngle] animating edge:', edge.id, 'with color:', flashColor, 'original:', originalColor);
          gsap.to(edgeEl, { stroke: flashColor, strokeWidth: 3.5, duration: 0.3 });
          gsap.to(edgeEl, {
            strokeWidth: 4.5,
            duration: 0.2,
            yoyo: true,
            repeat: 2,
            delay: 0.3,
            onComplete: () => {
              // Restore original edge color after animation
              gsap.set(edgeEl, { stroke: originalColor, strokeWidth: 3 });
              console.log('[flashAngle] animation complete for edge:', edge.id, 'restored color:', originalColor);
            }
          });
        });
      }
    }
  }

  private highlightArc(arcId: string, color?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    const el = this.svgElement.querySelector(`#${arcId}`);
    if (!el) return;

    // Store original color to restore after animation
    const originalColor = el.getAttribute('stroke') || COLORS.angle;
    const originalWidth = parseFloat(el.getAttribute('stroke-width') || '2');
    // Use auto color if no color specified
    const arcColor = color || this.getAutoColor();

    console.log('[highlightArc] animating arc:', arcId, 'with color:', arcColor, 'original:', originalColor);
    // Bug 2 fix: separate highlight animation from restoration
    gsap.to(el, { stroke: arcColor, strokeWidth: 4, duration: 0.3 });
    gsap.to(el, {
      strokeWidth: 5,
      duration: 0.2,
      yoyo: true,
      repeat: 2,
      delay: 0.3,
      onComplete: () => {
        // Restore original arc color after animation
        gsap.set(el, { stroke: originalColor, strokeWidth: originalWidth });
        console.log('[highlightArc] animation complete for arc:', arcId, 'restored color:', originalColor);
      }
    });
  }

  private drawArc(arcId: string, color?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

    const colorMap: Record<string, string> = {
      'red': COLORS.red,
      'green': COLORS.green,
      'orange': COLORS.orange,
      'blue': COLORS.blue,
      'purple': COLORS.purple,
    };
    // Use auto color if no color specified
    const arcColor = color ? (colorMap[color] || color) : this.getAutoColor();

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
      const arcConfig = this.config.angleArcs?.find(a => a.id === arcId);
      const flashColor = arcConfig?.color || arcColor;
      gsap.set(fillEl, { fill: flashColor, fillOpacity: 0.15 });
    }
  }

  private fillTriangle(triangleId: string, color: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    const el = this.svgElement.querySelector(`#triangle-${triangleId}`);
    if (!el) return;

    // Bug 3 fix: also set opacity: 1 since reset() sets it to 0
    gsap.to(el, { fill: color, fillOpacity: 0.3, opacity: 1, duration: 0.5 });
  }

  private showRightAngle(pointId: string): void {
    const rightAngleArc = this.config.angleArcs?.find(a => 
      a.vertex === pointId && a.isRightAngle
    );
    const arcId = rightAngleArc?.id || `bad-${pointId}`;
    this.drawArc(arcId, 'orange');
    this.flashAngle(pointId, 'orange');
  }

  /**
   * 高亮指定的边（用于对比场景，自动用红色+绿色区分）
   * @param edges 边 ID 数组，自动分配颜色
   */
  highlightEdgesForCompare(edges: string[]): void {
    console.log('[DEBUG] highlightEdgesForCompare called with edges:', edges);
    if (!this.svgElement || edges.length < 2) return;
    const gsap = (window as any).gsap;

    // Reset and get auto colors for compare
    this.resetAutoColor();
    const color1 = this.getAutoColor();
    const color2 = this.getAutoColor();

    const [edgeId1, edgeId2] = edges;
    const normalizedEdgeId1 = normalizeEdgeId(edgeId1);
    const normalizedEdgeId2 = normalizeEdgeId(edgeId2);
    const el1 = this.svgElement.querySelector(`#${normalizedEdgeId1}`);
    const el2 = this.svgElement.querySelector(`#${normalizedEdgeId2}`);
    if (!el1 || !el2) return;

    gsap.to(el1, { stroke: color1, strokeWidth: 3, duration: 0.3 });
    gsap.to(el2, { stroke: color2, strokeWidth: 3, duration: 0.3 });
  }

  /**
   * 执行飞出对比动画（不复用原始边高亮，只做飞出动画）
   * @param edges 两条边 ID 组成的元组
   * @param label 标签文字
   */
  compareEdge(edges: [string, string], label: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

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

    // 创建第一条边的副本
    const copy1 = document.createElementNS(ns, 'line');
    copy1.setAttribute('x1', String(baseX));
    copy1.setAttribute('y1', String(targetY));
    copy1.setAttribute('x2', String(baseX + len1));
    copy1.setAttribute('y2', String(targetY));
    copy1.setAttribute('stroke', COLORS.red);
    copy1.setAttribute('stroke-width', '3');
    copy1.setAttribute('class', 'flyout-copy');
    this.svgElement.appendChild(copy1);

    // 创建第二条边的副本
    const copy2 = document.createElementNS(ns, 'line');
    copy2.setAttribute('x1', String(baseX + len1 + 30));
    copy2.setAttribute('y1', String(targetY));
    copy2.setAttribute('x2', String(baseX + len1 + 30 + len2));
    copy2.setAttribute('y2', String(targetY));
    copy2.setAttribute('stroke', COLORS.green);
    copy2.setAttribute('stroke-width', '3');
    copy2.setAttribute('class', 'flyout-copy');
    this.svgElement.appendChild(copy2);

    // 飞出动画
    gsap.fromTo(copy1, { opacity: 0.3, y: y1 - targetY }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
    gsap.fromTo(copy2, { opacity: 0.3, y: y3 - targetY }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 });

    // 创建等号标签
    const eqText = document.createElementNS(ns, 'text');
    eqText.setAttribute('x', String(baseX + len1 + 15));
    eqText.setAttribute('y', String(targetY + 5));
    eqText.setAttribute('text-anchor', 'middle');
    eqText.setAttribute('font-size', '16');
    eqText.setAttribute('fill', COLORS.green);
    eqText.setAttribute('font-weight', 'bold');
    eqText.setAttribute('class', 'flyout-copy');
    eqText.textContent = '=';
    this.svgElement.appendChild(eqText);
    gsap.fromTo(eqText, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.8 });
  }

  /**
   * 飞出对比动画（组合调用：先高亮边，再执行飞出动画）
   * 保持向后兼容
   */
  private flyoutCompare(edges: [string, string], label: string): void {
    console.log('[DEBUG] flyoutCompare called with edges:', edges);
    // 步骤 1：高亮原始边（红色+绿色）
    this.highlightEdgesForCompare(edges);

    // 步骤 2：延迟后执行飞出动画
    setTimeout(() => {
      this.compareEdge(edges, label);
    }, 600);
  }

  private moveEdge(fromEdgeId: string, toEdgeId: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

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

  private moveTriangle(fromTriangleId: string, toTriangleId: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

    const fromId = fromTriangleId === 'ABC' ? 'ABC' : fromTriangleId;
    const toId = toTriangleId === 'EDC' ? 'EDC' : toTriangleId;

    const el = this.svgElement.querySelector(`#triangle-${fromId}`);
    if (!el) return;

    const trianglePoints: Record<string, string[]> = {
      'ABC': ['A', 'B', 'C'],
      'EDC': ['E', 'D', 'C'],
    };

    const sourcePoints = trianglePoints[fromId]?.map(id => this.getPointCoords(id));
    const targetPoints = trianglePoints[toId]?.map(id => this.getPointCoords(id));
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
}

export function convertStepAnimationToIntents(stepAnimation: Record<string, any>): AnimationIntent[] {
  const intents: AnimationIntent[] = [];

  // NEW: Unified highlights format
  if (stepAnimation.highlights) {
    intents.push({ type: 'highlights', highlights: stepAnimation.highlights });
  }

  if (stepAnimation.drawEdge) {
    const edges = Array.isArray(stepAnimation.drawEdge) ? stepAnimation.drawEdge : [stepAnimation.drawEdge];
    intents.push({ type: 'drawEdges', edges });
  }

  if (stepAnimation.showRightAngles) {
    intents.push({ type: 'showRightAngles', points: stepAnimation.showRightAngles });
  }

  if (stepAnimation.showEqualMarks) {
    intents.push({ type: 'showEqual' });
  }

  if (stepAnimation.highlightEdges) {
    const edges = stepAnimation.highlightEdges;
    if (edges.length > 0 && typeof edges[0] === 'object') {
      // 对象数组格式：[{edge, color}]，直接传递
      intents.push({ type: 'highlightEdges', edges: edges });
    } else {
      // 字符串数组格式：["AB", "DE"]，使用统一 color
      intents.push({ type: 'highlightEdges', edges: edges, color: stepAnimation.color });
    }
  }

  if (stepAnimation.flashAngle) {
    const angles = Array.isArray(stepAnimation.flashAngle) ? stepAnimation.flashAngle : [stepAnimation.flashAngle];
    // Check if angles are objects with color (new format) or strings (old format)
    if (angles.length > 0 && typeof angles[0] === 'object') {
      // New format: each angle has its own color
      angles.forEach((angleConfig: any) => {
        intents.push({ type: 'flashAngle', angle: angleConfig.angle, color: angleConfig.color });
      });
    } else {
      // Old format: all angles share the same color
      intents.push({ type: 'flashAngles', angles: angles as string[], color: stepAnimation.flashColor });
    }
  }

  if (stepAnimation.drawArcs) {
    intents.push({ type: 'drawArcs', arcs: stepAnimation.drawArcs });
  }

  if (stepAnimation.highlightArcs) {
    const arcs = stepAnimation.highlightArcs;
    if (arcs.length > 0 && typeof arcs[0] === 'object') {
      intents.push({ type: 'highlightArcs', arcs: arcs });
    } else {
      intents.push({ type: 'highlightArcs', arcs: arcs, color: stepAnimation.color });
    }
  }

  if (stepAnimation.fillTriangle) {
    const triangles = Array.isArray(stepAnimation.fillTriangle) ? stepAnimation.fillTriangle : [stepAnimation.fillTriangle];
    intents.push({ type: 'fillTriangles', triangles, colors: stepAnimation.fillColors, color: stepAnimation.fillColor });
  }

  if (stepAnimation.flyoutCompare) {
    stepAnimation.flyoutCompare.forEach((item: any) => {
      intents.push({ type: 'flyoutCompare', edges: item.edges, label: item.label });
    });
  }

  if (stepAnimation.moveEdge && stepAnimation.targetEdge) {
    intents.push({ type: 'moveEdge', edge: stepAnimation.moveEdge, targetEdge: stepAnimation.targetEdge });
  }

  if (stepAnimation.moveTriangle && stepAnimation.targetTriangle) {
    intents.push({ type: 'moveTriangle', triangle: stepAnimation.moveTriangle, targetTriangle: stepAnimation.targetTriangle });
  }

  if (stepAnimation.flashTriangle) {
    const triangles = Array.isArray(stepAnimation.flashTriangle) ? stepAnimation.flashTriangle : [stepAnimation.flashTriangle];
    triangles.forEach(triId => {
      intents.push({ type: 'fillTriangle', triangle: triId });
    });
  }

  return intents;
}
