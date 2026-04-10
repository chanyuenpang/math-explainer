import type { Problem, ProblemSummary, Category, Difficulty, Connection } from './types';
import { normalizeConnections } from './types';

/**
 * 将问题的 connections 从 string[][] 转换为 Connection[] 格式
 */
function convertProblemConnections(problem: Problem): Problem {
  const geometry = problem.geometry;
  
  // 如果 connections 已经是 Connection[] 格式（对象数组），直接返回
  if (geometry.connections.length > 0 && 
      typeof geometry.connections[0] === 'object' && 
      'from' in geometry.connections[0]) {
    return problem;
  }
  
  // 将 string[][] 转换为 Connection[]
  const normalizedConnections = normalizeConnections(geometry.connections as string[][]);
  
  return {
    ...problem,
    geometry: {
      ...geometry,
      connections: normalizedConnections
    }
  };
}

const problems: Map<string, Problem> = new Map();

export async function loadProblems(): Promise<void> {
  const modules = import.meta.glob('../../../src/data/problems/*.json', { eager: true });
  
  for (const path in modules) {
    const module = modules[path] as any;
    const problem = module.default || module;
    if (problem.id) {
      // 转换 connections 格式：string[][] -> Connection[]
      const convertedProblem = convertProblemConnections(problem as Problem);
      problems.set(problem.id, convertedProblem);
    }
  }
}

export function listProblems(): ProblemSummary[] {
  const summaries: ProblemSummary[] = [];
  for (const problem of problems.values()) {
    summaries.push({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags || [],
      category: problem.category
    });
  }
  return summaries.sort((a, b) => a.id.localeCompare(b.id));
}

export function getProblem(id: string): Problem | undefined {
  return problems.get(id);
}

export function getProblemsByCategory(category: Category): ProblemSummary[] {
  return listProblems().filter(p => p.category === category);
}

export function getAllCategories(): Category[] {
  const categories = new Set<Category>();
  for (const problem of problems.values()) {
    if (problem.category) {
      categories.add(problem.category);
    }
  }
  return Array.from(categories).sort();
}

export function getProblemsByDifficulty(difficulty: Difficulty): ProblemSummary[] {
  return listProblems().filter(p => p.difficulty === difficulty);
}
