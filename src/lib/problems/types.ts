export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category = '几何' | '代数' | '函数' | '概率' | '其他';

export interface Problem {
  id: string;
  title: string;
  source?: string;
  difficulty: Difficulty;
  tags: string[];
  category?: Category;
  image?: string;
  geometry: {
    points: Array<{ x: number; y: number; label: string }>;
    connections: string[][];
    edgeColors?: Record<string, string>;
    rightAngles: string[];
    angleArcs?: Array<{
      id: string;
      vertex: string;
      from: string;
      to: string;
      color: string;
      path: string;
      isRightAngle: boolean;
    }>;
    equalPairs?: Record<string, string>;
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
