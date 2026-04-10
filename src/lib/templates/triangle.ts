import type { ProblemTemplate, GeometryTemplateConfig, AnimationStepTemplate, TemplateOptions } from './types';

function applyOptions(config: GeometryTemplateConfig, options: TemplateOptions): GeometryTemplateConfig {
  if (!options) return config;

  const { offsetX = 0, offsetY = 0, scale = 1, customPoints = [] } = options;

  const points = config.points.map((p, i) => {
    const custom = customPoints[i];
    if (!custom) {
      return {
        ...p,
        x: p.x * scale + offsetX,
        y: p.y * scale + offsetY,
      };
    }
    return {
      ...p,
      x: (custom.x ?? p.x) * scale + offsetX,
      y: (custom.y ?? p.y) * scale + offsetY,
      label: custom.label ?? p.label,
    };
  });

  return {
    ...config,
    points,
  };
}

const rightTriangleBase: GeometryTemplateConfig = {
  points: [
    { id: 'A', x: 100, y: 200, label: 'A' },
    { id: 'B', x: 100, y: 100, label: 'B' },
    { id: 'C', x: 200, y: 200, label: 'C' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
  ],
  rightAngles: ['A'],
  angleArcs: [
    { id: 'arc-A', vertex: 'A', from: 'B', to: 'C', isRightAngle: true, color: '#F59E0B' },
  ],
};

const isoscelesTriangleBase: GeometryTemplateConfig = {
  points: [
    { id: 'A', x: 150, y: 200, label: 'A' },
    { id: 'B', x: 100, y: 100, label: 'B' },
    { id: 'C', x: 200, y: 100, label: 'C' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
  ],
  equalPairs: { 'AB': 'AC' },
};

const equilateralTriangleBase: GeometryTemplateConfig = {
  points: [
    { id: 'A', x: 150, y: 200, label: 'A' },
    { id: 'B', x: 100, y: 113.4, label: 'B' },
    { id: 'C', x: 200, y: 113.4, label: 'C' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
  ],
  equalPairs: { 'AB': 'BC', 'BC': 'CA' },
};

const trianglePresets: Record<string, ProblemTemplate> = {
  'right-triangle': {
    id: 'right-triangle',
    name: 'Right Triangle',
    nameZh: '直角三角形',
    description: 'A triangle with one 90-degree angle',
    shapeType: 'right-triangle',
    defaultConfig: rightTriangleBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'AC'], showRightAngles: ['A'] },
      { flashAngle: ['A'], flashColor: 'orange' },
    ],
  },
  'isosceles-triangle': {
    id: 'isosceles-triangle',
    name: 'Isosceles Triangle',
    nameZh: '等腰三角形',
    description: 'A triangle with at least two equal sides',
    shapeType: 'isosceles-triangle',
    defaultConfig: isoscelesTriangleBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'CA'], showEqualMarks: true },
    ],
  },
  'equilateral-triangle': {
    id: 'equilateral-triangle',
    name: 'Equilateral Triangle',
    nameZh: '等边三角形',
    description: 'A triangle with all sides equal',
    shapeType: 'equilateral-triangle',
    defaultConfig: equilateralTriangleBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'CA'], showEqualMarks: true },
    ],
  },
};

export function createTriangleTemplate(
  type: 'right-triangle' | 'isosceles-triangle' | 'equilateral-triangle',
  options?: TemplateOptions
): GeometryTemplateConfig {
  const template = trianglePresets[type];
  if (!template) {
    throw new Error(`Unknown triangle type: ${type}`);
  }
  return applyOptions(template.defaultConfig, options ?? {});
}

export function getTrianglePresets(): Record<string, ProblemTemplate> {
  return trianglePresets;
}

export type TriangleType = 'right-triangle' | 'isosceles-triangle' | 'equilateral-triangle';
