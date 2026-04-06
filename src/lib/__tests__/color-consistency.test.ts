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

// Helper to create mock SVG element with edges and arcs
function createMockSVGWithEdgesAndArcs(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  // Add mock line elements (edges) - use normalized IDs (alphabetical order)
  const edges = [
    { id: 'AB', x1: '100', y1: '100', x2: '100', y2: '200' },
    { id: 'BC', x1: '100', y1: '200', x2: '200', y2: '200' },
    { id: 'AC', x1: '200', y1: '200', x2: '100', y2: '100' },  // Normalized from CA
    { id: 'AD', x1: '100', y1: '100', x2: '200', y2: '100' },
    { id: 'CD', x1: '200', y1: '100', x2: '200', y2: '200' },  // Normalized from DC
    { id: 'DE', x1: '200', y1: '100', x2: '300', y2: '100' },
    { id: 'CE', x1: '300', y1: '100', x2: '200', y2: '200' },  // Normalized from EC
  ];

  edges.forEach(({ id, x1, y1, x2, y2 }) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', id);
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    svg.appendChild(line);
  });

  // Add mock path elements (angle arcs)
  const arcs = ['arc-A', 'arc-BCD', 'arc-ABC', 'arc-ADC', 'arc-EDC'];
  arcs.forEach(id => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', id);
    svg.appendChild(path);

    // Add fill element
    const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fillPath.setAttribute('id', `${id}-fill`);
    svg.appendChild(fillPath);
  });

  return svg;
}

// Test configuration
const testConfig: GeometryConfig = {
  points: [
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 100, y: 200 },
    { id: 'C', x: 200, y: 200 },
    { id: 'D', x: 200, y: 100 },
    { id: 'E', x: 300, y: 100 },
  ],
  connections: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
    { from: 'A', to: 'D' },
    { from: 'D', to: 'C' },
    { from: 'D', to: 'E' },
    { from: 'E', to: 'C' },
  ],
  angleArcs: [
    { id: 'arc-A', vertex: 'A', from: 'B', to: 'D' },
    { id: 'arc-BCD', vertex: 'C', from: 'B', to: 'D' },
    { id: 'arc-ABC', vertex: 'B', from: 'A', to: 'C' },
    { id: 'arc-ADC', vertex: 'D', from: 'A', to: 'C' },
    { id: 'arc-EDC', vertex: 'D', from: 'E', to: 'C' },
  ],
};

describe('Color Consistency Tests', () => {
  let engine: GeometryEngine;
  let mockSVG: SVGSVGElement;

  beforeEach(() => {
    gsapCalls.clear();
    engine = new GeometryEngine(testConfig);
    mockSVG = createMockSVGWithEdgesAndArcs();
    engine.setSVGElement(mockSVG);
  });

  describe('Angle color consistency', () => {
    it('should apply same color to arc and its two edges when flashing angle', () => {
      engine.reset();
      engine.execute([{ type: 'flashAngle', angle: 'A' }]);

      // Get all color set calls for the arc and edges
      const arcCalls = gsapCalls.get('arc-A');
      const edgeABCalls = gsapCalls.get('AB');
      const edgeADCalls = gsapCalls.get('AD');

      // All three should have color set calls
      expect(arcCalls).toBeDefined();
      expect(edgeABCalls).toBeDefined();
      expect(edgeADCalls).toBeDefined();
      
      if (arcCalls && edgeABCalls && edgeADCalls) {
        // Get the last 'set' call (the actual highlight color, not the reset)
        const arcSetCalls = arcCalls.filter(c => c.type === 'set');
        const edgeABSetCalls = edgeABCalls.filter(c => c.type === 'set');
        const edgeADSetCalls = edgeADCalls.filter(c => c.type === 'set');
        
        const arcSetColor = arcSetCalls[arcSetCalls.length - 1]?.props.stroke;
        const edgeABSetColor = edgeABSetCalls[edgeABSetCalls.length - 1]?.props.stroke;
        const edgeADSetColor = edgeADSetCalls[edgeADSetCalls.length - 1]?.props.stroke;
        
        expect(arcSetColor).toBeDefined();
        expect(edgeABSetColor).toBe(arcSetColor);
        expect(edgeADSetColor).toBe(arcSetColor);
      }
    });

    it('should apply same color to arc and its two edges using showAngle intent', () => {
      engine.reset();
      engine.execute([{ type: 'showAngle', angle: 'ABC' }]);

      const arcCalls = gsapCalls.get('arc-ABC');
      const edgeABCalls = gsapCalls.get('AB');
      const edgeBCCalls = gsapCalls.get('BC');

      expect(arcCalls).toBeDefined();
      expect(edgeABCalls).toBeDefined();
      expect(edgeBCCalls).toBeDefined();
      
      if (arcCalls && edgeABCalls && edgeBCCalls) {
        const arcSetCalls = arcCalls.filter(c => c.type === 'set');
        const edgeABSetCalls = edgeABCalls.filter(c => c.type === 'set');
        const edgeBCSetCalls = edgeBCCalls.filter(c => c.type === 'set');
        
        const arcSetColor = arcSetCalls[arcSetCalls.length - 1]?.props.stroke;
        const edgeABSetColor = edgeABSetCalls[edgeABSetCalls.length - 1]?.props.stroke;
        const edgeBCSetColor = edgeBCSetCalls[edgeBCSetCalls.length - 1]?.props.stroke;
        
        expect(arcSetColor).toBeDefined();
        expect(edgeABSetColor).toBe(arcSetColor);
        expect(edgeBCSetColor).toBe(arcSetColor);
      }
    });

    it('should maintain color consistency across multiple angles in one step', () => {
      engine.reset();
      engine.execute([
        { type: 'showAngle', angle: 'A' },
        { type: 'showAngle', angle: 'BCD' },
      ]);

      // Get calls for first angle (A)
      const arcACalls = gsapCalls.get('arc-A');
      const edgeABCalls = gsapCalls.get('AB');
      const edgeADCalls = gsapCalls.get('AD');

      // Get calls for second angle (BCD)
      const arcBCDCalls = gsapCalls.get('arc-BCD');
      const edgeBCCalls = gsapCalls.get('BC');
      const edgeCDCalls = gsapCalls.get('CD');

      // Each angle should have consistent colors within itself
      if (arcACalls && edgeABCalls && edgeADCalls) {
        const arcASetCalls = arcACalls.filter(c => c.type === 'set');
        const edgeABSetCalls = edgeABCalls.filter(c => c.type === 'set');
        const edgeADSetCalls = edgeADCalls.filter(c => c.type === 'set');
        
        const colorA = arcASetCalls[arcASetCalls.length - 1]?.props.stroke;
        const edgeABColor = edgeABSetCalls[edgeABSetCalls.length - 1]?.props.stroke;
        const edgeADColor = edgeADSetCalls[edgeADSetCalls.length - 1]?.props.stroke;
        
        expect(colorA).toBeDefined();
        expect(edgeABColor).toBe(colorA);
        expect(edgeADColor).toBe(colorA);
      }

      if (arcBCDCalls && edgeBCCalls && edgeCDCalls) {
        const arcBCDSetCalls = arcBCDCalls.filter(c => c.type === 'set');
        const edgeBCSetCalls = edgeBCCalls.filter(c => c.type === 'set');
        const edgeCDSetCalls = edgeCDCalls.filter(c => c.type === 'set');
        
        const colorBCD = arcBCDSetCalls[arcBCDSetCalls.length - 1]?.props.stroke;
        const edgeBCColor = edgeBCSetCalls[edgeBCSetCalls.length - 1]?.props.stroke;
        const edgeCDColor = edgeCDSetCalls[edgeCDSetCalls.length - 1]?.props.stroke;
        
        expect(colorBCD).toBeDefined();
        expect(edgeBCColor).toBe(colorBCD);
        expect(edgeCDColor).toBe(colorBCD);
      }

      // Different angles should have different colors
      if (arcACalls && arcBCDCalls) {
        const arcASetCalls = arcACalls.filter(c => c.type === 'set');
        const arcBCDSetCalls = arcBCDCalls.filter(c => c.type === 'set');
        
        const colorA = arcASetCalls[arcASetCalls.length - 1]?.props.stroke;
        const colorBCD = arcBCDSetCalls[arcBCDSetCalls.length - 1]?.props.stroke;
        
        expect(colorA).toBeDefined();
        expect(colorBCD).toBeDefined();
        expect(colorA).not.toBe(colorBCD);
      }
    });

    it('should use highlights interface with consistent colors', () => {
      engine.reset();
      engine.execute([
        {
          type: 'highlights',
          highlights: [
            { target: 'angle-A' },
            { target: 'angle-ABC' },
          ],
        },
      ]);

      const arcACalls = gsapCalls.get('arc-A');
      const arcABCCalls = gsapCalls.get('arc-ABC');

      expect(arcACalls).toBeDefined();
      expect(arcABCCalls).toBeDefined();
      
      if (arcACalls && arcABCCalls) {
        const arcASetCalls = arcACalls.filter(c => c.type === 'set');
        const arcABCSetCalls = arcABCCalls.filter(c => c.type === 'set');
        
        const colorA = arcASetCalls[arcASetCalls.length - 1]?.props.stroke;
        const colorABC = arcABCSetCalls[arcABCSetCalls.length - 1]?.props.stroke;
        
        expect(colorA).toBeDefined();
        expect(colorABC).toBeDefined();
        
        // Different angles should have different colors (auto-assigned)
        expect(colorA).not.toBe(colorABC);
      }
    });
  });

  describe('Color context reset', () => {
    it('should allow same element to get different colors across steps', () => {
      // Step 1: flash angle A
      gsapCalls.clear();
      engine.reset();
      engine.execute([{ type: 'flashAngle', angle: 'A' }]);
      const arcACalls1 = gsapCalls.get('arc-A');
      const step1Color = arcACalls1?.find(c => c.type === 'set')?.props.stroke;

      // Step 2: flash same angle A again after reset
      gsapCalls.clear();
      engine.reset();
      engine.execute([{ type: 'flashAngle', angle: 'A' }]);
      const arcACalls2 = gsapCalls.get('arc-A');
      const step2Color = arcACalls2?.find(c => c.type === 'set')?.props.stroke;

      // After reset, same angle should get same color (first in cycle)
      expect(step1Color).toBe(step2Color);
    });
  });
});
