export * from './types';
export * from './triangle';
export * from './quadrilateral';

import type { ProblemTemplate, GeometryTemplateConfig, TemplateOptions, GeometryShapeType } from './types';
import { createTriangleTemplate, type TriangleType } from './triangle';
import { createQuadrilateralTemplate, type QuadrilateralType } from './quadrilateral';

export type ShapeType = TriangleType | QuadrilateralType;

interface TemplateDefinition {
  create: (options?: TemplateOptions) => GeometryTemplateConfig;
  getPreset: () => ProblemTemplate;
  shapeType: GeometryShapeType;
}

const templateRegistry: Record<string, TemplateDefinition> = {
  'right-triangle': {
    create: (options) => createTriangleTemplate('right-triangle', options),
    getPreset: () => require('./triangle').getTrianglePresets()['right-triangle'],
    shapeType: 'right-triangle',
  },
  'isosceles-triangle': {
    create: (options) => createTriangleTemplate('isosceles-triangle', options),
    getPreset: () => require('./triangle').getTrianglePresets()['isosceles-triangle'],
    shapeType: 'isosceles-triangle',
  },
  'equilateral-triangle': {
    create: (options) => createTriangleTemplate('equilateral-triangle', options),
    getPreset: () => require('./triangle').getTrianglePresets()['equilateral-triangle'],
    shapeType: 'equilateral-triangle',
  },
  'rectangle': {
    create: (options) => createQuadrilateralTemplate('rectangle', options),
    getPreset: () => require('./quadrilateral').getQuadrilateralPresets()['rectangle'],
    shapeType: 'rectangle',
  },
  'square': {
    create: (options) => createQuadrilateralTemplate('square', options),
    getPreset: () => require('./quadrilateral').getQuadrilateralPresets()['square'],
    shapeType: 'square',
  },
  'parallelogram': {
    create: (options) => createQuadrilateralTemplate('parallelogram', options),
    getPreset: () => require('./quadrilateral').getQuadrilateralPresets()['parallelogram'],
    shapeType: 'parallelogram',
  },
  'trapezoid': {
    create: (options) => createQuadrilateralTemplate('trapezoid', options),
    getPreset: () => require('./quadrilateral').getQuadrilateralPresets()['trapezoid'],
    shapeType: 'trapezoid',
  },
  'quadrilateral': {
    create: (options) => createQuadrilateralTemplate('quadrilateral', options),
    getPreset: () => require('./quadrilateral').getQuadrilateralPresets()['quadrilateral'],
    shapeType: 'quadrilateral',
  },
};

export function getTemplate(shapeType: ShapeType, options?: TemplateOptions): GeometryTemplateConfig {
  const template = templateRegistry[shapeType];
  if (!template) {
    throw new Error(`Unknown template type: ${shapeType}. Available: ${Object.keys(templateRegistry).join(', ')}`);
  }
  return template.create(options);
}

export function getTemplatePreset(shapeType: ShapeType): ProblemTemplate {
  const template = templateRegistry[shapeType];
  if (!template) {
    throw new Error(`Unknown template type: ${shapeType}`);
  }
  return template.getPreset();
}

export function listTemplates(): Array<{ id: string; name: string; nameZh: string; shapeType: GeometryShapeType }> {
  return Object.values(templateRegistry).map(t => {
    const preset = t.getPreset();
    return {
      id: preset.id,
      name: preset.name,
      nameZh: preset.nameZh,
      shapeType: t.shapeType,
    };
  });
}

export function isValidTemplate(shapeType: string): boolean {
  return shapeType in templateRegistry;
}
