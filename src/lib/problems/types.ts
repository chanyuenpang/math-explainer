import type { GeoPoint, AngleArcConfig } from '../types';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category = '几何' | '代数' | '函数' | '概率' | '其他';

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
     * 连接数组，JSON 原始格式
     * 例如: [['A', 'B'], ['B', 'C']]
     */
    connections: string[][];
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
