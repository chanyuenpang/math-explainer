import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeometryEngine, COLORS, convertStepAnimationToIntents } from '../geometry-engine';
import type { GeometryConfig } from '../geometry-engine';

// Mock GSAP - track calls per element
const gsapCalls = new Map<string, any[]>();

function mockGsapSet(element: any, props: any) {
  const id = element?.id || 'unknown';
  if (!gsapCalls.has(id)) {
    gsapCalls.set(id, []);
  }
  gsapCalls.get(id)!.push({ type: 'set', props });
}

function mockGsapTo(element: any, props: any) {
  const id = element?.id || 'unknown';
  if (!gsapCalls.has(id)) {
    gsapCalls.set(id, []);
  }
  gsapCalls.get(id)!.push({ type: 'to', props });
}

function mockGsapFromTo(element: any, fromProps: any, toProps: any) {
  const id = element?.id || 'unknown';
  if (!gsapCalls.has(id)) {
    gsapCalls.set(id, []);
  }
  gsapCalls.get(id)!.push({ type: 'fromTo', fromProps, toProps });
}

vi.mock('gsap', () => ({
  gsap: {
    set: mockGsapSet,
    to: mockGsapTo,
    fromTo: mockGsapFromTo,
  },
}));

// Helper to create mock SVG element
function createMockSVG(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  // Add mock line elements (edges)
  const lines = ['AB', 'BC', 'CA', 'DE', 'EC', 'DC'];
  lines.forEach(id => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', id);
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', '100');
    line.setAttribute('y2', '100');
    svg.appendChild(line);
  });

  // Add mock path elements (angle arcs)
  const arcs = ['arc-A', 'arc-B', 'arc-C', 'arc-D', 'arc-E'];
  arcs.forEach(id => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', id);
    svg.appendChild(path);
  });

  return svg;
}

// Test configuration
const testConfig: GeometryConfig = {
  points: [
    { id: 'A', x: 50, y: 250, label: 'A' },
    { id: 'B', x: 50, y: 50, label: 'B' },
    { id: 'C', x: 250, y: 50, label: 'C' },
    { id: 'D', x: 250, y: 150, label: 'D' },
    { id: 'E', x: 150, y: 150, label: 'E' },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
    { from: 'D', to: 'E' },
    { from: 'E', to: 'C' },
    { from: 'D', to: 'C' },
  ],
  angleArcs: [
    { id: 'arc-A', vertex: 'A', from: 'B', to: 'C' },
    { id: 'arc-B', vertex: 'B', from: 'A', to: 'C' },
    { id: 'arc-C', vertex: 'C', from: 'A', to: 'B' },
    { id: 'arc-D', vertex: 'D', from: 'E', to: 'C' },
    { id: 'arc-E', vertex: 'E', from: 'D', to: 'C' },
  ],
};

describe('GeometryEngine', () => {
  let engine: GeometryEngine;
  let mockSVG: SVGSVGElement;

  beforeEach(() => {
    gsapCalls.clear();
    engine = new GeometryEngine(testConfig);
    mockSVG = createMockSVG();
    engine.setSVGElement(mockSVG);
  });

  describe('ColorContext', () => {
    it('should auto-assign colors to elements', () => {
      const highlights = [
        { target: 'angle-A' },
        { target: 'angle-B' },
        { target: 'angle-C' },
      ];

      engine.reset();
      engine.execute([{ type: 'highlights', highlights }]);

      // First three elements should get different colors from autoColors array
      expect(gsapCalls.size).toBeGreaterThan(0);
    });

    it('should assign same color to same element within a step', () => {
      engine.reset();
      
      // First assignment
      engine.execute([{ type: 'highlightEdge', edge: 'AB' }]);
      const firstCalls = gsapCalls.get('AB');
      const firstSetCalls = firstCalls?.filter(c => c.type === 'set') || [];
      const firstColor = firstSetCalls[firstSetCalls.length - 1]?.props.stroke;
      
      // Clear calls but don't reset engine (simulate same step)
      gsapCalls.clear();
      
      // Second assignment of same element
      engine.execute([{ type: 'highlightEdge', edge: 'AB' }]);
      const secondCalls = gsapCalls.get('AB');
      const secondSetCalls = secondCalls?.filter(c => c.type === 'set') || [];
      const secondColor = secondSetCalls[secondSetCalls.length - 1]?.props.stroke;
      
      // Should be same color (ColorContext preserves it within step)
      expect(firstColor).toBe(secondColor);
    });

    it('should assign different colors to different elements', () => {
      engine.reset();
      
      engine.execute([
        { type: 'highlightEdge', edge: 'AB' },
        { type: 'highlightEdge', edge: 'BC' },
      ]);

      const abCalls = gsapCalls.get('AB');
      const bcCalls = gsapCalls.get('BC');
      
      const abSetCalls = abCalls?.filter(c => c.type === 'set') || [];
      const bcSetCalls = bcCalls?.filter(c => c.type === 'set') || [];
      
      const color1 = abSetCalls[abSetCalls.length - 1]?.props.stroke;
      const color2 = bcSetCalls[bcSetCalls.length - 1]?.props.stroke;
      
      expect(color1).toBeDefined();
      expect(color2).toBeDefined();
      expect(color1).not.toBe(color2);
    });

    it('should cycle through colors when all colors are used', () => {
      engine.reset();
      
      const edges = ['AB', 'BC', 'CA', 'DE', 'EC', 'DC'];
      engine.execute(edges.map(edge => ({ type: 'highlightEdge', edge })));

      const colors = edges.map(edge => {
        const calls = gsapCalls.get(edge);
        return calls?.find(c => c.type === 'set')?.props.stroke;
      });
      
      // Sixth element should reuse first color (cycle)
      expect(colors[5]).toBe(colors[0]);
    });

    it('should reset color context when reset() is called', () => {
      engine.reset();
      engine.execute([{ type: 'highlightEdge', edge: 'AB' }]);
      const firstCalls = gsapCalls.get('AB');
      const firstColor = firstCalls?.find(c => c.type === 'set')?.props.stroke;

      engine.reset();
      engine.execute([{ type: 'highlightEdge', edge: 'AB' }]);
      const secondCalls = gsapCalls.get('AB');
      const secondColor = secondCalls?.find(c => c.type === 'set')?.props.stroke;

      // After reset, same element should get same color (first color in cycle)
      expect(firstColor).toBe(secondColor);
    });
  });

  describe('executeHighlights', () => {
    it('should handle angle highlights', () => {
      engine.reset();
      engine.execute([{ type: 'highlights', highlights: [{ target: 'angle-A' }] }]);
      
      expect(gsapCalls.size).toBeGreaterThan(0);
    });

    it('should handle edge highlights', () => {
      engine.reset();
      engine.execute([{ type: 'highlights', highlights: [{ target: 'edge-AB' }] }]);
      
      expect(gsapCalls.size).toBeGreaterThan(0);
    });

    it('should handle arc highlights', () => {
      engine.reset();
      engine.execute([{ type: 'highlights', highlights: [{ target: 'arc-arc-A' }] }]);
      
      expect(gsapCalls.size).toBeGreaterThan(0);
    });
  });
});

describe('convertStepAnimationToIntents', () => {
  it('should convert highlights to intents', () => {
    const stepAnimation = {
      highlights: [
        { target: 'angle-A' },
        { target: 'edge-AB', color: COLORS.red },
      ],
    };

    const intents = convertStepAnimationToIntents(stepAnimation);
    
    expect(intents).toHaveLength(1);
    expect(intents[0].type).toBe('highlights');
    expect((intents[0] as { highlights: unknown[] }).highlights).toHaveLength(2);
  });

  it('should convert drawEdge to intents', () => {
    const stepAnimation = {
      drawEdge: ['AB', 'BC'],
    };

    const intents = convertStepAnimationToIntents(stepAnimation);
    
    expect(intents).toHaveLength(1);
    expect(intents[0].type).toBe('drawEdges');
    expect((intents[0] as { edges: string[] }).edges).toEqual(['AB', 'BC']);
  });

  it('should convert flashAngle to showAngle intents', () => {
    const stepAnimation = {
      flashAngle: ['A', 'B'],
    };

    const intents = convertStepAnimationToIntents(stepAnimation);
    
    expect(intents).toHaveLength(2);
    expect(intents[0].type).toBe('showAngle');
    expect((intents[0] as { angle: string }).angle).toBe('A');
    expect((intents[1] as { angle: string }).angle).toBe('B');
  });

  it('should convert fillTriangle to intents', () => {
    const stepAnimation = {
      fillTriangle: ['ABC'],
      fillColor: COLORS.red,
    };

    const intents = convertStepAnimationToIntents(stepAnimation);
    
    expect(intents).toHaveLength(1);
    expect(intents[0].type).toBe('fillTriangles');
    expect((intents[0] as { triangles: string[] }).triangles).toEqual(['ABC']);
  });
});
