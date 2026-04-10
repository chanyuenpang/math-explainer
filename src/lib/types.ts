/**
 * 统一几何类型系统
 * 所有几何相关组件使用这些类型以确保兼容性
 */

// 统一点类型 - 包含 id、坐标和标签
export interface GeoPoint {
  id: string;
  x: number;
  y: number;
  label: string;
}

// 统一边类型
export interface GeoEdge {
  id: string;
  from: string;
  to: string;
  color?: string;
}

// 统一角类型 - 使用三个点的 id 数组表示
export interface GeoAngle {
  id: string;
  points: [string, string, string]; // [顶点, 起点, 终点]
  color?: string;
}

// 兼容旧版 Angle 格式（vertex, from, to）
export interface GeoAngleLegacy {
  id: string;
  vertex: string;
  from: string;
  to: string;
  color?: string;
}

// 连接类型
export interface GeoConnection {
  from: string;
  to: string;
}

// 弧角类型（用于渲染）
export interface AngleArcConfig {
  vertex: string;
  id: string;
  from: string;
  to: string;
  color?: string;
  path?: string;
  isRightAngle?: boolean;
}

// 步骤动画类型
export interface StepAnimation {
  highlight?: string[];
  draw?: string[];
  hide?: string[];
  pulse?: string[];
  fill?: Record<string, string>;
  transform?: Record<string, string>;
  color?: string;
  rightAngles?: string[];
  angles?: string[];
  highlightEdges?: string[];
  drawEdge?: string[];
  showRightAngles?: string[];
  showEqualMarks?: boolean;
  showLabels?: string[];
  flashAngle?: string[];
  flashColor?: string;
  fillTriangle?: string;
  fillColor?: string;
  moveEdge?: string;
  targetEdge?: string;
  moveTriangle?: string;
  targetTriangle?: string;
  flashArcs?: string[];
  fillColors?: Record<string, string>;
  flyoutCompare?: Array<{ edges: [string, string]; label: string }>;
  flashTriangle?: string[];
}

// 步骤数据
export interface Step {
  id: number;
  title: string;
  content: string;
  conclusion?: string;
}

/**
 * 将问题格式的点转换为 GeoPoint
 */
export function toGeoPoint(point: { x: number; y: number; label: string }): GeoPoint {
  return {
    id: point.label,
    x: point.x,
    y: point.y,
    label: point.label
  };
}

/**
 * 将 GeometryCanvas 使用的点格式转换为拓扑图用的点
 */
export function toTopoPoint(point: { x: number; y: number; label: string }): { id: string; x: number; y: number } {
  return {
    id: point.label,
    x: point.x,
    y: point.y
  };
}