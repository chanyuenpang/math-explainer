import type { GeoPoint, GeoConnection, AngleArcConfig } from '../types';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category = '几何' | '代数' | '函数' | '概率' | '其他';

/**
 * 统一连接类型 - 对象格式
 * 从 JSON 的 string[][] 转换而来
 */
export interface Connection {
  from: string;
  to: string;
}

/**
 * 将 JSON 中的 string[][] 格式转换为 Connection[] 对象格式
 * @param connections 原始连接数组 [['A', 'B'], ['B', 'C']]
 * @returns 转换后的对象数组 [{from: 'A', to: 'B'}, {from: 'B', to: 'C'}]
 */
export function normalizeConnections(connections: string[][]): Connection[] {
  return connections.map(([from, to]) => ({ from, to }));
}

// 内部使用更详细的 point 结构（包含 label）
interface ProblemPoint extends GeoPoint {}

export interface Problem {
  id: string;
  title: string;
  source?: string;
  difficulty: Difficulty;
  tags: string[];
  category?: Category;
  image?: string;
  geometry: {
    points: ProblemPoint[];
    /**
     * 连接数组，支持两种格式：
     * 1. string[][] 格式（JSON 原始格式）: [['A', 'B'], ['B', 'C']]
     * 2. Connection[] 对象格式（处理后）: [{from: 'A', to: 'B'}, ...]
     * registry.ts 加载时自动将 string[][] 转换为 Connection[]
     */
    connections: string[][] | Connection[];
    edgeColors?: Record<string, string>;
    rightAngles: string[];
    angleArcs?: AngleArcConfig[];
    equalPairs?: Record<string, string>;
    triangles?: string[];
  };
  steps: Array<{
    id: number;
    title: string;
    content: string;
    conclusion: string;
  }>;
  stepAnimations: Array<Record<string, unknown>>;
  question: {
    text: string;
    diagram: Record<string, unknown>;
  };
  solution: {
    text: string;
  };
  created_at: string;
}

export interface ProblemSummary {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  category?: Category;
}
