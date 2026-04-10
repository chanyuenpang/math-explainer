import { gsap } from 'gsap';
import { TopologyGraph, type Point, type Connection, type Edge, type Angle, normalizeEdgeId } from './topology';
import { COLORS } from './colors';
import { AnimationExecutor } from './engine/AnimationExecutor';
import type { AngleArcConfig } from './types';
import { ColorManager } from './engine/ColorManager';
import { SVGQueryHelper } from './engine/SVGQueryHelper';

// Re-export AngleArcConfig for external use
export type { AngleArcConfig };

export interface GeometryConfig {
  points: Point[];
  connections: Connection[];
  edgeColors?: Record<string, string>;
  rightAngles?: string[];
  angleArcs?: AngleArcConfig[];
  equalPairs?: Record<string, string>;
  triangles?: string[];
}

// --- Discriminated union types for AnimationIntent ---

interface HighlightEdgeIntent {
  type: 'highlightEdge';
  edge: string;
  color?: string;
}

interface HighlightEdgesIntent {
  type: 'highlightEdges';
  edges: string[] | Array<{ edge: string; color?: string }>;
  color?: string;
}

interface ShowAngleIntent {
  type: 'showAngle';
  angle: string;
}

interface ShowAnglesIntent {
  type: 'showAngles';
  angles: string[];
}

interface FlashAngleIntent {
  type: 'flashAngle';
  angle: string;
  color?: string;
}

interface FlashAnglesIntent {
  type: 'flashAngles';
  angles: string[];
  color?: string;
}

interface FillTriangleIntent {
  type: 'fillTriangle';
  triangle: string;
  color?: string;
}

interface FillTrianglesIntent {
  type: 'fillTriangles';
  triangles: string[];
  colors?: Record<string, string>;
  color?: string;
}

interface LabelIntent {
  type: 'label';
}

interface LabelsIntent {
  type: 'labels';
}

interface DrawEdgeIntent {
  type: 'drawEdge';
  edge: string;
}

interface DrawEdgesIntent {
  type: 'drawEdges';
  edges: string[];
}

interface HideEdgeIntent {
  type: 'hideEdge';
  edge: string;
}

interface HideEdgesIntent {
  type: 'hideEdges';
  edges: string[];
}

interface ShowEqualIntent {
  type: 'showEqual';
}

interface FlyoutCompareIntent {
  type: 'flyoutCompare';
  edges: [string, string];
  label: string;
}

interface MoveEdgeIntent {
  type: 'moveEdge';
  edge: string;
  targetEdge: string;
}

interface MoveTriangleIntent {
  type: 'moveTriangle';
  triangle: string;
  targetTriangle: string;
}

interface ShowRightAngleIntent {
  type: 'showRightAngle';
  point: string;
}

interface ShowRightAnglesIntent {
  type: 'showRightAngles';
  points: string[];
}

interface HighlightsIntent {
  type: 'highlights';
  highlights: Array<{ target: string; color?: string }>;
}

interface CompareEdgesIntent {
  type: 'compareEdges';
  edge1: string;
  edge2: string;
  label?: string;
}

interface CompareAnglesIntent {
  type: 'compareAngles';
  angle1: string;
  angle2: string;
}

interface ShowEqualMarkIntent {
  type: 'showEqualMark';
  pairs: string[];
}

interface ProveCongruentPairEdge {
  type: 'edge';
  items: string[];
}

interface ProveCongruentPairAngle {
  type: 'angle';
  items: string[];
}

type ProveCongruentPair = ProveCongruentPairEdge | ProveCongruentPairAngle;

interface ProveCongruentIntent {
  type: 'proveCongruent';
  method?: string;
  triangle1: string;
  triangle2: string;
  pairs: ProveCongruentPair[];
}

export type AnimationIntent =
  | HighlightEdgeIntent
  | HighlightEdgesIntent
  | ShowAngleIntent
  | ShowAnglesIntent
  | FlashAngleIntent
  | FlashAnglesIntent
  | FillTriangleIntent
  | FillTrianglesIntent
  | LabelIntent
  | LabelsIntent
  | DrawEdgeIntent
  | DrawEdgesIntent
  | HideEdgeIntent
  | HideEdgesIntent
  | ShowEqualIntent
  | FlyoutCompareIntent
  | MoveEdgeIntent
  | MoveTriangleIntent
  | ShowRightAngleIntent
  | ShowRightAnglesIntent
  | HighlightsIntent
  | CompareEdgesIntent
  | CompareAnglesIntent
  | ShowEqualMarkIntent
  | ProveCongruentIntent;

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
  | 'showRightAngle'
  | 'showRightAngles'
  | 'highlights'
  | 'compareEdges'
  | 'compareAngles'
  | 'showEqualMark'
  | 'proveCongruent';

export { COLORS };

export class GeometryEngine {
  private topology: TopologyGraph;
  private config: GeometryConfig;
  private svgElement: SVGSVGElement | null = null;
  private points: Array<{ id: string; x: number; y: number }>;

  // Managers and executors
  private colorManager: ColorManager;
  private svgHelper: SVGQueryHelper;
  private animationExecutor: AnimationExecutor | null = null;

  constructor(config: GeometryConfig) {
    this.config = config;
    this.points = config.points;
    this.topology = new TopologyGraph(
      config.points,
      config.connections,
      config.edgeColors
    );
    // Initialize managers
    this.colorManager = new ColorManager();
    this.svgHelper = new SVGQueryHelper(null);
  }

  setSVGElement(svg: SVGSVGElement): void {
    this.svgElement = svg;
    this.svgHelper.setSVGElement(svg);
    // Create AnimationExecutor after SVG element is set
    this.animationExecutor = new AnimationExecutor(
      this.svgHelper,
      this.colorManager,
      this.points,
      this.topology,
      this.config.angleArcs || []
    );
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

    // Reset color manager for new step
    this.colorManager.reset();

    svg.querySelectorAll('line').forEach(el => {
      gsap.set(el, { stroke: COLORS.default, strokeWidth: 2, opacity: 1, x: 0, y: 0, strokeDasharray: 'none' });
    });

    svg.querySelectorAll('path[id^="arc-"]').forEach(el => {
      gsap.set(el, { stroke: COLORS.angle, strokeWidth: 2, opacity: 0 });
    });

    svg.querySelectorAll('polygon, path[id^="triangle-"]').forEach(el => {
      gsap.set(el, { fill: 'transparent', fillOpacity: 0, opacity: 0 });
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
    const executor = this.animationExecutor;
    if (!executor) return;
    
    highlights.forEach(({target, color}) => {
      // Auto-assign color if not specified using ColorManager
      const autoColor = color || this.colorManager.assignColor(target);
      
      if (target.startsWith('angle-')) {
        const angleId = target.substring(6); // Remove 'angle-' prefix
        executor.flashAngle(angleId, autoColor);
      } else if (target.startsWith('edge-')) {
        const edgeId = target.substring(5); // Remove 'edge-' prefix
        executor.highlightEdge(edgeId, autoColor);
      } else if (target.startsWith('face-')) {
        const faceId = target.substring(5); // Remove 'face-' prefix
        executor.fillTriangle(faceId, autoColor);
      } else if (target.startsWith('arc-')) {
        const arcId = target.substring(4); // Remove 'arc-' prefix
        executor.highlightArc(arcId, autoColor);
      } else {
        console.warn(`[executeHighlights] Unknown target prefix: ${target}`);
      }
    });
  }

  private executeIntent(intent: AnimationIntent): void {
    if (!this.svgElement) return;
    if (!gsap) return;
    const executor = this.animationExecutor;
    if (!executor) return;

    switch (intent.type) {
      case 'proveCongruent': {
        const { pairs, triangle1, triangle2 } = intent;
        const pairColors = ['#DC2626', '#10B981', '#3B82F6', '#F97316', '#8B5CF6'];
        
        pairs.forEach((pair: ProveCongruentPair, index: number) => {
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
        executor.highlightEdge(intent.edge, intent.color);
        break;
      case 'highlightEdges':

        const edges = intent.edges;
        // Check if new format (array of objects) or old format (array of strings)
        if (edges && edges.length > 0 && typeof edges[0] === 'object') {
          // 新格式：[{edge: "AB", color: "red"}, {edge: "DE", color: "green"}]
          (edges as Array<{ edge: string; color?: string }>).forEach((item) => executor.highlightEdge(item.edge, item.color));
        } else if (Array.isArray(edges)) {
          // 旧格式：["AB", "DE"]，使用统一的 intent.color
          edges.forEach((edgeId) => executor.highlightEdge(edgeId as string, intent.color));
        }
        break;
      case 'showAngle':
        executor.showAngle(intent.angle);
        break;
      case 'showAngles':
        (intent.angles || []).forEach((angleId: string) => executor.showAngle(angleId));
        break;
      case 'flashAngle':
        executor.flashAngle(intent.angle, intent.color);
        break;
      case 'flashAngles':
        (intent.angles || []).forEach((angleId: string) => executor.flashAngle(angleId, intent.color));
        break;
      case 'fillTriangle':
        executor.fillTriangle(intent.triangle, intent.color || this.colorManager.assignColor('triangle-' + intent.triangle));
        break;
      case 'fillTriangles':
        (intent.triangles || []).forEach((triId: string) => {
          const color = intent.colors?.[triId] || intent.color || this.colorManager.assignColor('triangle-' + triId);
          executor.fillTriangle(triId, color);
        });
        break;
      case 'label':
        break;
      case 'labels':
        break;
      case 'drawEdge':
        executor.drawEdge(intent.edge);
        break;
      case 'drawEdges':
        (intent.edges || []).forEach((edgeId: string, i: number) => executor.drawEdge(edgeId, i * 0.25));
        break;
      case 'hideEdge':
        executor.hideEdge(intent.edge);
        break;
      case 'hideEdges':
        (intent.edges || []).forEach((edgeId: string) => executor.hideEdge(edgeId));
        break;
      case 'showEqual':
        break;
      case 'flyoutCompare':
        executor.flyoutCompare(intent.edges, intent.label);
        break;
      case 'moveEdge':
        executor.moveEdge(intent.edge, intent.targetEdge);
        break;
      case 'moveTriangle':
        executor.moveTriangle(intent.triangle, intent.targetTriangle);
        break;
      case 'showRightAngle':
        executor.showRightAngle(intent.point);
        break;
      case 'showRightAngles':
        (intent.points || []).forEach((pointId: string) => executor.showRightAngle(pointId));
        break;
      case 'highlights':
        this.executeHighlights(intent.highlights || []);
        break;
      case 'compareEdges': {
        const edge1 = intent.edge1;
        const edge2 = intent.edge2;
        const label = intent.label || '';
        const color1 = this.colorManager.assignColor('compare-edge1-' + edge1);
        const color2 = this.colorManager.assignColor('compare-edge2-' + edge2);
        // 高亮两条边（不同颜色）
        executor.highlightEdge(edge1, color1);
        executor.highlightEdge(edge2, color2);
        // 飞出对比动画
        executor.flyoutCompare([edge1, edge2], label);
        break;
      }
      case 'compareAngles': {
        const angle1 = intent.angle1;
        const angle2 = intent.angle2;
        // 自动处理弧线+边+闪烁，各自颜色
        executor.showAngle(angle1);
        executor.showAngle(angle2);
        break;
      }
      case 'showEqualMark':
        // 显示等号标记（简化配置）
        if (intent.pairs && Array.isArray(intent.pairs)) {
          // pairs 格式：["AB-DE", "BC-CD"]
          intent.pairs.forEach((pair: string) => {
            const [edge1, edge2] = pair.split('-');
            if (edge1 && edge2) {
              executor.showEqualMarkForPair(edge1, edge2);
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
    if (!el) {
      console.warn(`[GeometryEngine] unitSetEdge: edge element not found for id "${edgeId}" (normalized: "${normalizeEdgeId(edgeId)}")`);
      return;
    }
    gsap.set(el, { stroke: color, strokeWidth: width });
  }

  /** 元素属性闪烁动画 */
  private unitFlashElement(selector: string, prop: string, from: number, to: number, duration: number = 0.2, repeat: number = 2): void {
    const el = this.svgElement!.querySelector(selector);
    if (!el) {
      console.warn(`[GeometryEngine] unitFlashElement: element not found for selector "${selector}"`);
      return;
    }
    gsap.to(el, { [prop]: to, duration, yoyo: true, repeat, ease: 'power2.inOut' });
  }

  /** 设置弧线颜色和可见性 */
  private unitSetArc(arcId: string, color: string): void {
    const el = this.svgElement!.querySelector(`#${arcId}`);
    if (!el) {
      console.warn(`[GeometryEngine] unitSetArc: arc element not found for id "${arcId}"`);
    } else {
      gsap.set(el, { stroke: color, strokeWidth: 2, opacity: 1 });
    }
    const fillEl = this.svgElement!.querySelector(`#${arcId}-fill`);
    if (fillEl) gsap.set(fillEl, { fill: color, fillOpacity: 0.3 });
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
        gsap.to(el, { fill: color, fillOpacity: opacity, opacity: 1, duration: 0.5 });
        return;
      }
    }
    console.warn(`[GeometryEngine] unitFillShape: shape element not found for id "${shapeId}" (tried ${candidates.length} candidates)`);
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
      if (a.id === `arc-${angleId}`) return true;
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
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`) as SVGLineElement;
    if (!el) return;

    const highlightColor = color || this.colorManager.assignColor('edge-' + edgeId);

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
    const normalizedEdgeId = normalizeEdgeId(edgeId);
    const el = this.svgElement.querySelector(`#${normalizedEdgeId}`);
    if (!el) return;

    gsap.to(el, { opacity: 0.2, duration: 0.3 });
  }

  private flashAngle(angleIdOrConfig: string | {id: string, color?: string}, defaultColor?: string): void {
    if (!this.svgElement) return;

    const angleId = typeof angleIdOrConfig === 'string' ? angleIdOrConfig : angleIdOrConfig.id;
    const color = typeof angleIdOrConfig === 'string' ? defaultColor : (angleIdOrConfig.color || defaultColor);

    const arcId = angleId.startsWith('arc-') ? angleId : `arc-${angleId}`;
    const el = this.svgElement.querySelector(`#${arcId}`) || this.svgElement.querySelector(`#angle-${angleId}`);

    // Use provided color or auto-assign via ColorContext
    const flashColor = color || this.colorManager.assignColor('angle-' + angleId);

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

    // Step 1: Assign color for this angle (same angle returns same color within a step)
    const angleColor = color || this.colorManager.assignColor('angle-' + angleId);
    const arcId = angleId.startsWith('arc-') ? angleId : `arc-${angleId}`;

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
    const el = this.svgElement.querySelector(`#${arcId}`);
    if (!el) return;

    const highlightColor = color || this.colorManager.assignColor('arc-' + arcId);

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

    // Use auto color if no color specified
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

  private fillTriangle(triangleId: string, color: string): void {
    if (!this.svgElement) return;
    const el = this.svgElement.querySelector(`#triangle-${triangleId}`);
    if (!el) {
      console.warn(`[GeometryEngine] fillTriangle: triangle element not found for id "triangle-${triangleId}"`);
      return;
    }

    // Bug 3 fix: also set opacity: 1 since reset() sets it to 0
    gsap.to(el, { fill: color, fillOpacity: 0.3, opacity: 1, duration: 0.5 });
  }

  private showRightAngle(pointId: string): void {
    const rightAngleArc = this.config.angleArcs?.find(a => 
      a.vertex === pointId && a.isRightAngle
    );
    const arcId = rightAngleArc?.id || `arc-${pointId}`;
    const rightAngleColor = this.colorManager.assignColor('right-angle-' + pointId);
    this.drawArc(arcId, rightAngleColor);
    this.flashAngle(pointId, rightAngleColor);
  }

  /**
   * 高亮指定的边（用于对比场景，使用 autoColors 分配）
   * @param edges 边 ID 数组，自动分配颜色
   * @returns 返回分配的颜色数组 [color1, color2]
   */
  highlightEdgesForCompare(edges: string[]): [string, string] | null {
    if (!this.svgElement || edges.length < 2) return null;

    // Use assignColor for consistent color assignment
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

  /**
   * 执行飞出对比动画（不复用原始边高亮，只做飞出动画）
   * @param edges 两条边 ID 组成的元组
   * @param label 标签文字
   * @param colors 可选颜色数组 [color1, color2]，不传则使用 autoColors
   */
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

    // 使用传入的颜色或自动分配的颜色
    const [color1, color2] = colors || [
      this.colorManager.assignColor('compare-edge1-' + edgeId1),
      this.colorManager.assignColor('compare-edge2-' + edgeId2)
    ];

    // 创建第一条边的副本
    const copy1 = document.createElementNS(ns, 'line');
    copy1.setAttribute('x1', String(baseX));
    copy1.setAttribute('y1', String(targetY));
    copy1.setAttribute('x2', String(baseX + len1));
    copy1.setAttribute('y2', String(targetY));
    copy1.setAttribute('stroke', color1);
    copy1.setAttribute('stroke-width', '3');
    copy1.setAttribute('class', 'flyout-copy');
    this.svgElement.appendChild(copy1);

    // 创建第二条边的副本
    const copy2 = document.createElementNS(ns, 'line');
    copy2.setAttribute('x1', String(baseX + len1 + 30));
    copy2.setAttribute('y1', String(targetY));
    copy2.setAttribute('x2', String(baseX + len1 + 30 + len2));
    copy2.setAttribute('y2', String(targetY));
    copy2.setAttribute('stroke', color2);
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
    eqText.setAttribute('fill', color2);
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
    // 步骤 1：高亮原始边并获取分配的颜色
    const colors = this.highlightEdgesForCompare(edges);

    // 步骤 2：延迟后执行飞出动画，传递相同的颜色
    setTimeout(() => {
      this.compareEdge(edges, label, colors || undefined);
    }, 600);
  }

  private moveEdge(fromEdgeId: string, toEdgeId: string): void {
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

  private moveTriangle(fromTriangleId: string, toTriangleId: string): void {
    if (!this.svgElement) return;

    const el = this.svgElement.querySelector(`#triangle-${fromTriangleId}`);
    if (!el) return;

    // Derive vertices from triangle ID by splitting into individual point labels
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

  /**
   * 显示等号标记（用于简化 showEqualMarks 配置）
   * @param edge1 第一条边 ID
   * @param edge2 第二条边 ID
   */
  private showEqualMarkForPair(edge1: string, edge2: string): void {
    if (!this.svgElement) return;

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

interface StepAnimationConfig {
  proveCongruent?: {
    method?: string;
    triangle1: string;
    triangle2: string;
    pairs: ProveCongruentPair[];
  };
  highlights?: Array<{ target: string; color?: string }>;
  compareEdges?: { edge1: string; edge2: string; label?: string };
  compareAngles?: string[] | { angle1: string; angle2: string };
  showEqualMark?: string[] | string;
  drawEdge?: string | string[];
  showRightAngles?: string[];
  showEqualMarks?: unknown;
  highlightEdges?: string[] | Array<{ edge: string; color?: string }>;
  color?: string;
  flashAngle?: string[] | Array<string | { angle: string; color?: string }> | string | { angle: string; color?: string };
  fillTriangle?: string | string[];
  fillColors?: Record<string, string>;
  fillColor?: string;
  flyoutCompare?: Array<{ edges: [string, string]; label: string }>;
  moveEdge?: string;
  targetEdge?: string;
  moveTriangle?: string;
  targetTriangle?: string;
  flashTriangle?: string | string[];
}

export function convertStepAnimationToIntents(stepAnimation: StepAnimationConfig): AnimationIntent[] {
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
      // 支持多种格式：字符串或对象 {angle1, angle2}
      const first = angles[0];
      const second = angles[1];
      const angle1 = typeof first === 'string' ? first : (first as { angle1: string }).angle1;
      const angle2 = typeof second === 'string' ? second : (second as { angle2: string }).angle2;
      intents.push({ type: 'compareAngles', angle1, angle2 });
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

  // Merge flashAngle into unified showAngle intent
  if (stepAnimation.flashAngle) {
    const angles = Array.isArray(stepAnimation.flashAngle) ? stepAnimation.flashAngle : [stepAnimation.flashAngle];
    // Convert to showAngle (ignore color field - engine auto-assigns)
    angles.forEach((angleConfig: string | { angle: string; color?: string }) => {
      const angleId = typeof angleConfig === 'string' ? angleConfig : angleConfig.angle;
      intents.push({ type: 'showAngle', angle: angleId });
    });
    // drawArcs/highlightArcs deprecated - replaced by showAngle
  }

  if (stepAnimation.fillTriangle) {
    const triangles = Array.isArray(stepAnimation.fillTriangle) ? stepAnimation.fillTriangle : [stepAnimation.fillTriangle];
    intents.push({ type: 'fillTriangles', triangles, colors: stepAnimation.fillColors, color: stepAnimation.fillColor });
  }

  if (stepAnimation.flyoutCompare) {
    stepAnimation.flyoutCompare.forEach((item: { edges: [string, string]; label: string }) => {
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
