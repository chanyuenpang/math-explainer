import type { ProblemTemplate, GeometryTemplateConfig, TemplateOptions } from './types';

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

const rectangleBase: GeometryTemplateConfig = {
  points: [
    { x: 100, y: 200, label: 'A' },
    { x: 100, y: 100, label: 'B' },
    { x: 250, y: 100, label: 'C' },
    { x: 250, y: 200, label: 'D' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'A' },
  ],
  rightAngles: ['A', 'B', 'C', 'D'],
  edgeColors: {
    'AB': '#374151',
    'BC': '#374151',
    'CD': '#374151',
    'DA': '#374151',
  },
};

const squareBase: GeometryTemplateConfig = {
  points: [
    { x: 100, y: 200, label: 'A' },
    { x: 100, y: 100, label: 'B' },
    { x: 200, y: 100, label: 'C' },
    { x: 200, y: 200, label: 'D' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'A' },
  ],
  rightAngles: ['A', 'B', 'C', 'D'],
  equalPairs: { 'AB': 'BC', 'BC': 'CD', 'CD': 'DA' },
};

const parallelogramBase: GeometryTemplateConfig = {
  points: [
    { x: 100, y: 200, label: 'A' },
    { x: 100, y: 100, label: 'B' },
    { x: 250, y: 100, label: 'C' },
    { x: 250, y: 200, label: 'D' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'A' },
  ],
  equalPairs: { 'AB': 'CD', 'BC': 'DA' },
};

const trapezoidBase: GeometryTemplateConfig = {
  points: [
    { x: 100, y: 200, label: 'A' },
    { x: 150, y: 100, label: 'B' },
    { x: 250, y: 100, label: 'C' },
    { x: 300, y: 200, label: 'D' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'A' },
  ],
};

const quadrilateralBase: GeometryTemplateConfig = {
  points: [
    { x: 100, y: 200, label: 'A' },
    { x: 100, y: 100, label: 'B' },
    { x: 200, y: 100, label: 'C' },
    { x: 200, y: 200, label: 'D' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'A' },
  ],
};

const quadrilateralPresets: Record<string, ProblemTemplate> = {
  'rectangle': {
    id: 'rectangle',
    name: 'Rectangle',
    nameZh: '矩形',
    description: 'A quadrilateral with four right angles',
    shapeType: 'rectangle',
    defaultConfig: rectangleBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'CD', 'DA'], showRightAngles: ['A', 'B', 'C', 'D'] },
    ],
  },
  'square': {
    id: 'square',
    name: 'Square',
    nameZh: '正方形',
    description: 'A quadrilateral with four equal sides and right angles',
    shapeType: 'square',
    defaultConfig: squareBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'CD', 'DA'], showRightAngles: ['A', 'B', 'C', 'D'], showEqualMarks: true },
    ],
  },
  'parallelogram': {
    id: 'parallelogram',
    name: 'Parallelogram',
    nameZh: '平行四边形',
    description: 'A quadrilateral with opposite sides parallel',
    shapeType: 'parallelogram',
    defaultConfig: parallelogramBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'CD', 'DA'] },
    ],
  },
  'trapezoid': {
    id: 'trapezoid',
    name: 'Trapezoid',
    nameZh: '梯形',
    description: 'A quadrilateral with at least one pair of parallel sides',
    shapeType: 'trapezoid',
    defaultConfig: trapezoidBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'CD', 'DA'] },
    ],
  },
  'quadrilateral': {
    id: 'quadrilateral',
    name: 'Quadrilateral',
    nameZh: '四边形',
    description: 'A general quadrilateral',
    shapeType: 'quadrilateral',
    defaultConfig: quadrilateralBase,
    animationPresets: [
      { drawEdges: ['AB', 'BC', 'CD', 'DA'] },
    ],
  },
};

export function createQuadrilateralTemplate(
  type: 'rectangle' | 'square' | 'parallelogram' | 'trapezoid' | 'quadrilateral',
  options?: TemplateOptions
): GeometryTemplateConfig {
  const template = quadrilateralPresets[type];
  if (!template) {
    throw new Error(`Unknown quadrilateral type: ${type}`);
  }
  return applyOptions(template.defaultConfig, options ?? {});
}

export function getQuadrilateralPresets(): Record<string, ProblemTemplate> {
  return quadrilateralPresets;
}

export type QuadrilateralType = 'rectangle' | 'square' | 'parallelogram' | 'trapezoid' | 'quadrilateral';
