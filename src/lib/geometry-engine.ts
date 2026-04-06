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
  | 'showAngle'
  | 'showAngles'
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
  | 'highlights'
  | 'compareEdges'
  | 'compareAngles'
  | 'showEqualMark'
  | 'proveCongruent';

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

  // ColorContext: unified color management for geometric elements
  private colorContext: Map<string, string> = new Map();  // element ID → color
  private autoColorIndex: number = 0;
  private readonly autoColors: string[] = [COLORS.green, COLORS.blue, COLORS.orange, COLORS.purple, COLORS.red];

  /**
   * Assign a color for a geometric element (same element returns same color within a step)
   */
  private assignColor(elementId: string): string {
    if (this.colorContext.has(elementId)) {
      return this.colorContext.get(elementId)!;
    }
    const color = this.autoColors[this.autoColorIndex % this.autoColors.length];
    this.autoColorIndex++;
    this.colorContext.set(elementId, color);
    return color;
  }

  /**
   * Reset color context at the beginning of each step
   */
  private resetColorContext(): void {
    this.colorContext.clear();
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

    // Reset color context for new step
    this.resetColorContext();

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
    
    // Color context already reset in reset(), no need to reset again here
    
    highlights.forEach(({target, color}) => {
      // Auto-assign color if not specified using ColorContext
      const autoColor = color || this.assignColor(target);
      
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
      case 'proveCongruent': {
        const { pairs, triangle1, triangle2 } = intent;
        const pairColors = ['#DC2626', '#10B981', '#3B82F6', '#F97316', '#8B5CF6'];
        
        pairs.forEach((pair: any, index: number) => {
          const color = pairColors[index % pairColors.length];
          
          if (pair.type === 'edge') {
            pair.items.forEach((edgeId: string) => {
              this.unitSetEdge(edgeId, color, 4);
              this.unitFlashElement(`#${normalizeEdgeId(edgeId)}`, 'strokeWidth', 4, 5);
            });
          } else if (pair.type === 'angle') {
            pair.items.forEach((angleId: string) => {
              const { arcId, edge1, edge2 } = this.getAngleArcAndEdgeIds(angleId);
              if (arcId) {
                this.unitSetArc(arcId, color);
                this.unitFlashElement(`#${arcId}`, 'strokeWidth', 2, 4);
              }
              // 角对应的两条边也设同色
              if (edge1) this.unitSetEdge(edge1, color, 3.5);
              if (edge2) this.unitSetEdge(edge2, color, 3.5);
            });
          }
        });
        
        this.unitFillShape(`triangle-${triangle1}`, 'rgba(220,38,38,0.15)');
        this.unitFillShape(`triangle-${triangle2}`, 'rgba(16,185,129,0.15)');
        break;
      }
      case 'highlightEdge':
        this.highlightEdge(intent.edge, intent.color);
        break;
      case 'highlightEdges':

        if (intent.edges && intent.edges.length > 0 && typeof intent.edges[0] === 'object') {
          // 新格式：[{edge: "AB", color: "red"}, {edge: "DE", color: "green"}]
          intent.edges.forEach((item: any) => this.highlightEdge(item.edge, item.color));
        } else {
          // 旧格式：["AB", "DE"]，使用统一的 intent.color
          (intent.edges || []).forEach((edgeId: string) => this.highlightEdge(edgeId, intent.color));
        }
        break;
      case 'showAngle':
        this.showAngle(intent.angle);
        break;
      case 'showAngles':
        (intent.angles || []).forEach((angleId: string) => this.showAngle(angleId));
        break;
      case 'flashAngle':
        this.flashAngle(intent.angle, intent.color);
        break;
      case 'flashAngles':
        (intent.angles || []).forEach((angleId: string) => this.flashAngle(angleId, intent.color));
        break;
      case 'fillTriangle':
        this.fillTriangle(intent.triangle, intent.color || this.assignColor('triangle-' + intent.triangle));
        break;
      case 'fillTriangles':
        (intent.triangles || []).forEach((triId: string) => {
          const color = intent.colors?.[triId] || intent.color || this.assignColor('triangle-' + triId);
          this.fillTriangle(triId, color);
        });
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
        (intent.arcs || []).forEach((arcItem: any) => {
          if (typeof arcItem === 'object') {
            this.drawArc(arcItem.arc, arcItem.color || intent.color);
          } else {
            this.drawArc(arcItem, intent.color);
          }
        });
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
      case 'compareEdges': {
        const edge1 = intent.edge1;
        const edge2 = intent.edge2;
        const label = intent.label;
        const color1 = this.assignColor('compare-edge1-' + edge1);
        const color2 = this.assignColor('compare-edge2-' + edge2);
        // 高亮两条边（不同颜色）
        this.highlightEdge(edge1, color1);
        this.highlightEdge(edge2, color2);
        // 飞出对比动画
        this.flyoutCompare([edge1, edge2], label);
        break;
      }
      case 'compareAngles': {
        const angle1 = intent.angle1;
        const angle2 = intent.angle2;
        // 自动处理弧线+边+闪烁，各自颜色
        this.showAngle(angle1);
        this.showAngle(angle2);
        break;
      }
      case 'showEqualMark':
        // 显示等号标记（简化配置）
        if (intent.pairs && Array.isArray(intent.pairs)) {
          // pairs 格式：["AB-DE", "BC-CD"]
          intent.pairs.forEach((pair: string) => {
            const [edge1, edge2] = pair.split('-');
            if (edge1 && edge2) {
              this.showEqualMarkForPair(edge1, edge2);
            }
          });
        }
        break;
    }
  }

  // ===== 底层 Unit 动画方法 =====

  /** 设置边颜色和宽度 */
  private unitSetEdge(edgeId: string, color: string, width: number = 3): void {
    const el = this.svgElement!.querySelector(`#${normalizeEdgeId(edgeId)}`);
    if (!el) return;
    (window as any).gsap.set(el, { stroke: color, strokeWidth: width });
  }

  /** 元素属性闪烁动画 */
  private unitFlashElement(selector: string, prop: string, from: number, to: number, duration: number = 0.2, repeat: number = 2): void {
    const el = this.svgElement!.querySelector(selector);
    if (!el) return;
    (window as any).gsap.to(el, { [prop]: to, duration, yoyo: true, repeat, ease: 'power2.inOut' });
  }

  /** 设置弧线颜色和可见性 */
  private unitSetArc(arcId: string, color: string): void {
    const el = this.svgElement!.querySelector(`#${arcId}`);
    if (el) (window as any).gsap.set(el, { stroke: color, strokeWidth: 2, opacity: 1 });
    const fillEl = this.svgElement!.querySelector(`#${arcId}-fill`);
    if (fillEl) (window as any).gsap.set(fillEl, { fill: color, fillOpacity: 0.3 });
  }

  /** 填充图形 */
  private unitFillShape(shapeId: string, color: string, opacity: number = 0.3): void {
    // 尝试多种可能的 ID 命名方式
    const candidates = [shapeId];
    if (shapeId.startsWith('triangle-')) {
      const triName = shapeId.replace('triangle-', '');
      // 尝试反转（如 DCE -> ECD）、换位（如 DCE -> DED）等
      candidates.push(`triangle-${triName.split('').reverse().join('')}`);
      // 尝试所有可能的排列
      const chars = triName.split('');
      const perms = this.getPermutations(chars);
      perms.forEach(p => candidates.push(`triangle-${p.join('')}`));
    }
    
    for (const id of candidates) {
      const el = this.svgElement!.querySelector(`#${id}`);
      if (el) {
        (window as any).gsap.to(el, { fill: color, fillOpacity: opacity, opacity: 1, duration: 0.5 });
        return;
      }
    }
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
  private getAngleArcAndEdgeIds(angleId: string): { arcId: string | null, edge1: string | null, edge2: string | null } {
    // 查找对应的 angleArc 配置（通过 vertex 或 id）
    const angleArc = this.config.angleArcs?.find(a => {
      // 尝试多种匹配方式
      if (a.vertex === angleId) return true;
      if (a.id === angleId) return true;
      if (a.id === `angle-${angleId}`) return true;
      if (a.id === `bad-${angleId}`) return true;
      // 尝试匹配 angle 名称（如 BAC -> angle-BAC）
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

  private highlightEdge(edgeId: string, color?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`) as SVGLineElement;
    if (!el) return;

    const highlightColor = color || this.assignColor('edge-' + edgeId);

    // Step 1: Set the highlight color
    gsap.set(el, { stroke: highlightColor });

    // Step 2: Flash only strokeWidth (not restoring width after completion)
    gsap.to(el, { strokeWidth: 4, duration: 0.3 });
    gsap.to(el, {
      strokeWidth: 5,
      duration: 0.2,
      yoyo: true,
      repeat: 2,
      delay: 0.3
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

    const angleId = typeof angleIdOrConfig === 'string' ? angleIdOrConfig : angleIdOrConfig.id;
    const color = typeof angleIdOrConfig === 'string' ? defaultColor : (angleIdOrConfig.color || defaultColor);

    const arcId = angleId.startsWith('bad-') ? angleId : `bad-${angleId}`;
    const el = this.svgElement.querySelector(`#${arcId}`) || this.svgElement.querySelector(`#angle-${angleId}`);

    // Use provided color or auto-assign via ColorContext
    const flashColor = color || this.assignColor('angle-' + angleId);

    // Arc: set color then flash strokeWidth only
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

    // Edges: set color then flash strokeWidth only
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

          // Set color first, then flash strokeWidth (not restoring after completion)
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

  /**
   * NEW: Unified showAngle intent - angle as a whole (arc + two edges) with unified color
   * Auto-assigns color using ColorContext, replacing drawArcs + flashAngle + highlightArcs pattern
   */
  private showAngle(angleId: string, color?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

    // Step 1: Assign color for this angle (same angle returns same color within a step)
    const angleColor = color || this.assignColor('angle-' + angleId);
    const arcId = angleId.startsWith('bad-') ? angleId : `bad-${angleId}`;

    // Step 2: Set arc color and opacity
    const arcEl = this.svgElement.querySelector(`#${arcId}`);
    if (arcEl) {
      gsap.set(arcEl, { stroke: angleColor, strokeWidth: 2, opacity: 1 });
      // Flash animation (strokeWidth only)
      gsap.to(arcEl, { strokeWidth: 4, duration: 0.2, yoyo: true, repeat: 3, ease: 'power2.inOut' });
    }

    // Step 3: Set arc fill color
    const fillEl = this.svgElement.querySelector(`#${arcId}-fill`);
    if (fillEl) {
      gsap.set(fillEl, { fill: angleColor });
      gsap.fromTo(fillEl,
        { fillOpacity: 0.1 },
        { fillOpacity: 0.35, duration: 0.3, yoyo: true, repeat: 3, ease: 'power2.inOut' }
      );
    }

    // Step 4: Set two edges color and flash
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

          // Set color, then flash strokeWidth
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

  private highlightArc(arcId: string, color?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;
    const el = this.svgElement.querySelector(`#${arcId}`);
    if (!el) return;

    const highlightColor = color || this.assignColor('arc-' + arcId);

    // Step 1: Set the highlight color
    gsap.set(el, { stroke: highlightColor });

    // Step 2: Flash only strokeWidth (not restoring width after completion)
    gsap.to(el, { strokeWidth: 4, duration: 0.3 });
    gsap.to(el, {
      strokeWidth: 5,
      duration: 0.2,
      yoyo: true,
      repeat: 2,
      delay: 0.3
    });
  }

  private drawArc(arcId: string, color?: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

    // Use auto color if no color specified
    const arcColor = color || this.assignColor('arc-' + arcId);

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
    const rightAngleColor = this.assignColor('right-angle-' + pointId);
    this.drawArc(arcId, rightAngleColor);
    this.flashAngle(pointId, rightAngleColor);
  }

  /**
   * 高亮指定的边（用于对比场景，自动用红色+绿色区分）
   * @param edges 边 ID 数组，自动分配颜色
   */
  highlightEdgesForCompare(edges: string[]): void {
    if (!this.svgElement || edges.length < 2) return;
    const gsap = (window as any).gsap;

    // Use assignColor for consistent color assignment
    const [edgeId1, edgeId2] = edges;
    const color1 = this.assignColor('compare-edge1-' + edgeId1);
    const color2 = this.assignColor('compare-edge2-' + edgeId2);

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

  /**
   * 显示等号标记（用于简化 showEqualMarks 配置）
   * @param edge1 第一条边 ID
   * @param edge2 第二条边 ID
   */
  private showEqualMarkForPair(edge1: string, edge2: string): void {
    if (!this.svgElement) return;
    const gsap = (window as any).gsap;

    const normalizedEdgeId1 = normalizeEdgeId(edge1);
    const normalizedEdgeId2 = normalizeEdgeId(edge2);
    const el1 = this.svgElement.querySelector(`#${normalizedEdgeId1}`) as SVGLineElement;
    const el2 = this.svgElement.querySelector(`#${normalizedEdgeId2}`) as SVGLineElement;
    if (!el1 || !el2) return;

    // 获取边的中点位置
    const x1 = (parseFloat(el1.getAttribute('x1') || '0') + parseFloat(el1.getAttribute('x2') || '0')) / 2;
    const y1 = (parseFloat(el1.getAttribute('y1') || '0') + parseFloat(el1.getAttribute('y2') || '0')) / 2;
    const x2 = (parseFloat(el2.getAttribute('x1') || '0') + parseFloat(el2.getAttribute('x2') || '0')) / 2;
    const y2 = (parseFloat(el2.getAttribute('y1') || '0') + parseFloat(el2.getAttribute('y2') || '0')) / 2;

    // 创建等号标记元素
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

    // 动画：从透明到显示
    gsap.fromTo(eqText, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
  }
}

export function convertStepAnimationToIntents(stepAnimation: Record<string, any>): AnimationIntent[] {
  const intents: AnimationIntent[] = [];

  // NEW: proveCongruent - Triangle congruence visualization
  if (stepAnimation.proveCongruent) {
    const config = stepAnimation.proveCongruent;
    intents.push({
      type: 'proveCongruent',
      method: config.method,
      triangle1: config.triangle1,
      triangle2: config.triangle2,
      pairs: config.pairs
    });
  }

  // NEW: Unified highlights format
  if (stepAnimation.highlights) {
    intents.push({ type: 'highlights', highlights: stepAnimation.highlights });
  }

  // NEW: compareEdges - 简化边对比配置
  if (stepAnimation.compareEdges) {
    const { edge1, edge2, label } = stepAnimation.compareEdges;
    intents.push({ type: 'compareEdges', edge1, edge2, label });
  }

  // NEW: compareAngles - 简化角对比配置
  if (stepAnimation.compareAngles) {
    const angles = Array.isArray(stepAnimation.compareAngles) ? stepAnimation.compareAngles : [stepAnimation.compareAngles];
    if (angles.length >= 2) {
      intents.push({ type: 'compareAngles', angle1: angles[0], angle2: angles[1] });
    }
  }

  // NEW: showEqualMark - 简化等号标记配置
  if (stepAnimation.showEqualMark) {
    const pairs = Array.isArray(stepAnimation.showEqualMark) ? stepAnimation.showEqualMark : [stepAnimation.showEqualMark];
    intents.push({ type: 'showEqualMark', pairs });
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

  // NEW: Merge drawArcs + flashAngle + highlightArcs into unified showAngle intent
  if (stepAnimation.flashAngle) {
    const angles = Array.isArray(stepAnimation.flashAngle) ? stepAnimation.flashAngle : [stepAnimation.flashAngle];
    // Convert to showAngle (ignore color field - engine auto-assigns)
    angles.forEach((angleConfig: any) => {
      const angleId = typeof angleConfig === 'string' ? angleConfig : angleConfig.angle;
      intents.push({ type: 'showAngle', angle: angleId });
    });
    // Skip separate drawArcs/highlightArcs for these angles (handled by showAngle)
  } else if (stepAnimation.drawArcs || stepAnimation.highlightArcs) {
    // Fallback: if no flashAngle, use drawArcs/highlightArcs separately
    if (stepAnimation.drawArcs) {
      const arcs = stepAnimation.drawArcs;
      arcs.forEach((arcId: string) => {
        const angleName = arcId.replace('bad-', '');
        let arcColor: string | undefined;
        if (stepAnimation.flashAngle) {
          const angles = Array.isArray(stepAnimation.flashAngle) ? stepAnimation.flashAngle : [stepAnimation.flashAngle];
          const match = angles.find((a: any) => (typeof a === 'object' ? a.angle : a) === angleName);
          if (match && typeof match === 'object' && match.color) {
            arcColor = match.color;
          }
        }
        intents.push({ type: 'drawArc', arc: arcId, color: arcColor });
      });
    }

    if (stepAnimation.highlightArcs) {
      const arcs = stepAnimation.highlightArcs;
      arcs.forEach((arcId: string) => {
        const angleName = arcId.replace('bad-', '');
        let arcColor: string | undefined;
        if (stepAnimation.flashAngle) {
          const angles = Array.isArray(stepAnimation.flashAngle) ? stepAnimation.flashAngle : [stepAnimation.flashAngle];
          const match = angles.find((a: any) => (typeof a === 'object' ? a.angle : a) === angleName);
          if (match && typeof match === 'object' && match.color) {
            arcColor = match.color;
          }
        }
        intents.push({ type: 'highlightArc', arc: arcId, color: arcColor });
      });
    }
  }

  if (stepAnimation.drawArcs) {
    const arcs = stepAnimation.drawArcs;
    arcs.forEach((arcId: string) => {
      const angleName = arcId.replace('bad-', '');
      let arcColor: string | undefined;
      if (stepAnimation.flashAngle) {
        const angles = Array.isArray(stepAnimation.flashAngle) ? stepAnimation.flashAngle : [stepAnimation.flashAngle];
        const match = angles.find((a: any) => (typeof a === 'object' ? a.angle : a) === angleName);
        if (match && typeof match === 'object' && match.color) {
          arcColor = match.color;
        }
      }
      intents.push({ type: 'drawArc', arc: arcId, color: arcColor });
    });
  }

  if (stepAnimation.highlightArcs) {
    const arcs = stepAnimation.highlightArcs;
    arcs.forEach((arcId: string) => {
      const angleName = arcId.replace('bad-', '');
      let arcColor: string | undefined;
      if (stepAnimation.flashAngle) {
        const angles = Array.isArray(stepAnimation.flashAngle) ? stepAnimation.flashAngle : [stepAnimation.flashAngle];
        const match = angles.find((a: any) => (typeof a === 'object' ? a.angle : a) === angleName);
        if (match && typeof match === 'object' && match.color) {
          arcColor = match.color;
        }
      }
      intents.push({ type: 'highlightArc', arc: arcId, color: arcColor });
    });
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
