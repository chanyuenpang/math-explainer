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

export interface PointConfig {
  x: number;
  y: number;
  label: string;
}

export interface ConnectionConfig {
  from: string;
  to: string;
}

export interface AngleArcTemplate {
  id: string;
  vertex: string;
  from: string;
  to: string;
  color?: string;
  isRightAngle?: boolean;
}

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
  drawArcs?: string[];
  highlightArcs?: string[];
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
