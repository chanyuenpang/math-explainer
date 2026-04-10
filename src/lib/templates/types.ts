import type { GeoPoint, GeoConnection, AngleArcConfig } from '../types';

export type GeometryShapeType = 
  | 'triangle'
  | 'right-triangle'
  | 'isosceles-triangle'
  | 'equilateral-triangle'
  | 'quadrilateral'
  | 'rectangle'
  | 'square'
  | 'parallelogram'
  | 'trapezoid'
  | 'circle';

// 使用统一点类型
export type PointConfig = GeoPoint;

// 使用统一连接类型
export type ConnectionConfig = GeoConnection;

// 使用统一弧角类型
export type AngleArcTemplate = AngleArcConfig;

export interface GeometryTemplateConfig {
  points: PointConfig[];
  connections: ConnectionConfig[];
  edgeColors?: Record<string, string>;
  rightAngles?: string[];
  angleArcs?: AngleArcTemplate[];
  equalPairs?: Record<string, string>;
}

export interface AnimationStepTemplate {
  drawEdges?: string[];
  showRightAngles?: string[];
  showEqualMarks?: boolean;
  highlightEdges?: string[];
  color?: string;
  flashAngle?: string[];
  flashColor?: string;
  fillTriangle?: string[];
  fillColors?: Record<string, string>;
  flyoutCompare?: Array<{ edges: [string, string]; label: string }>;
  moveEdge?: string;
  targetEdge?: string;
  moveTriangle?: string;
  targetTriangle?: string;
  flashTriangle?: string[];
}

export interface ProblemTemplate {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  shapeType: GeometryShapeType;
  defaultConfig: GeometryTemplateConfig;
  animationPresets: AnimationStepTemplate[];
}

export interface TemplateOptions {
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  customPoints?: Partial<PointConfig>[];
  customConnections?: string[];
  overrides?: Partial<GeometryTemplateConfig>;
}
