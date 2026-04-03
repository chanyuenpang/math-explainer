import type { Problem, ProblemSummary, Category, Difficulty } from './types';

const problems: Map<string, Problem> = new Map();

export async function loadProblems(): Promise<void> {
  const modules = import.meta.glob('../../../src/data/problems/*.json', { eager: true });
  
  for (const path in modules) {
    const module = modules[path] as any;
    const problem = module.default || module;
    if (problem.id) {
      problems.set(problem.id, problem as Problem);
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
