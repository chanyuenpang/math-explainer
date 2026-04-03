import { useEffect, useRef, useMemo } from 'react';
import { TopologyGraph } from '../lib/topology';
import { GeometryEngine, convertStepAnimationToIntents, COLORS } from '../lib/geometry-engine';
import type { Point as TopoPoint, Connection as TopoConnection } from '../lib/topology';

declare const gsap: any;

interface Point { x: number; y: number; label: string }
interface AngleArc {
  vertex: string;
  id: string;
  from: string;
  to: string;
  color?: string;
  path?: string;
  isRightAngle?: boolean;
}

interface StepAnimation {
  highlight?: string[];
  draw?: string[];
  hide?: string[];
  pulse?: string[];
  fill?: Record<string, string>;
  transform?: Record<string, string>;
  color?: string;
  rightAngles?: string[];
  angles?: string[];
  highlightEdges?: string[];
  drawArcs?: string[];
  drawEdge?: string[];
  showRightAngles?: string[];
  showEqualMarks?: boolean;
  showLabels?: string[];
  flashAngle?: string[];
  flashColor?: string;
  drawArc?: string;
  arcColor?: string;
  highlightArcs?: string[];
  fillTriangle?: string;
  fillColor?: string;
  moveEdge?: string;
  targetEdge?: string;
  moveTriangle?: string;
  targetTriangle?: string;
  flashArcs?: string[];
  fillColors?: Record<string, string>;
  flyoutCompare?: Array<{edges: [string, string], label: string}>;
  flashTriangle?: string[];
}

interface Step {
  id: number;
  title: string;
  content: string;
  conclusion?: string;
}

interface GeometryCanvasProps {
  points: Point[]
  connections: [string, string][]
  edgeColors?: Record<string, string>
  rightAngles?: string[]
  angleArcs?: AngleArc[]
  equalPairs?: Record<string, string>
  currentStep: number
  stepAnimations: StepAnimation[]
  currentStepData?: Step
}

const CANVAS_COLORS = {
  default: '#D1D5DB',
  defaultPoint: '#6B7280',
  highlight: '#3B82F6',
  highlightWidth: 4,
  triangle1: 'rgba(239,68,68,0.15)',
  triangle2: 'rgba(16,185,129,0.15)',
  angle: '#F59E0B',
  angleHighlight: '#3B82F6',
  text: '#374151',
  background: '#F9FAFB'
};

export function GeometryCanvas({ points, connections, edgeColors, rightAngles = [], angleArcs = [], equalPairs = {}, currentStep, stepAnimations, currentStepData }: GeometryCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<GeometryEngine | null>(null);
  const step = stepAnimations[currentStep] || {};

  const topoPoints = useMemo(() => points.map(p => ({ id: p.label, x: p.x, y: p.y })), [points]);
  const topoConnections = useMemo(() => connections.map(([from, to]) => ({ from, to })), [connections]);

  const topology = useMemo(() => new TopologyGraph(topoPoints, topoConnections, edgeColors), [topoPoints, topoConnections, edgeColors]);
  
  const edges = useMemo(() => topology.getEdges(), [topology]);

  useEffect(() => {
    if (!svgRef.current) return;

    const engine = new GeometryEngine({
      points: topoPoints,
      connections: topoConnections,
      edgeColors,
      rightAngles,
      angleArcs,
      equalPairs
    });
    engine.setSVGElement(svgRef.current);
    engineRef.current = engine;
  }, [topoPoints, topoConnections, edgeColors, rightAngles, angleArcs, equalPairs]);

  useEffect(() => {
    if (!engineRef.current || !svgRef.current) return;

    engineRef.current.reset();

    const intents = convertStepAnimationToIntents(step);
    engineRef.current.execute(intents);
  }, [currentStep, step]);

  const getPos = (p: Point) => ({ x: p.x, y: 300 - p.y });

  const renderRightAngle = (point: Point, size: number = 20) => {
    return null;
  };

  const renderAngleArc = (arc: AngleArc, size: number = 25) => {
    const { vertex, from, to, id, color, path, isRightAngle } = arc;
    
    if (isRightAngle) {
      const vertexPoint = points.find(p => p.label === vertex);
      const point1 = points.find(p => p.label === from);
      const point2 = points.find(p => p.label === to);
      
      if (!vertexPoint || !point1 || !point2) return null;
      
      const { x: cx, y: cy } = getPos(vertexPoint);
      const { x: x1, y: y1 } = getPos(point1);
      const { x: x2, y: y2 } = getPos(point2);
      
      const arcColor = color || CANVAS_COLORS.angle;
      const markSize = 15;
      
      const len1 = Math.sqrt((x1 - cx) ** 2 + (y1 - cy) ** 2);
      const len2 = Math.sqrt((x2 - cx) ** 2 + (y2 - cy) ** 2);
      const ux1 = (x1 - cx) / len1;
      const uy1 = (y1 - cy) / len1;
      const ux2 = (x2 - cx) / len2;
      const uy2 = (y2 - cy) / len2;
      
      const p1x = cx + ux1 * markSize;
      const p1y = cy + uy1 * markSize;
      const p2x = cx + ux2 * markSize;
      const p2y = cy + uy2 * markSize;
      const cornerX = p1x + (p2x - cx);
      const cornerY = p1y + (p2y - cy);
      
      return (
        <g key={id}>
          <path
            id={id}
            d={`M ${p1x} ${p1y} L ${cornerX} ${cornerY} L ${p2x} ${p2y}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={2.5}
            opacity={0}
          />
          <path
            id={`${id}-fill`}
            d={`M ${p1x} ${p1y} L ${cornerX} ${cornerY} L ${p2x} ${p2y} L ${cx + ux1 * markSize + ux2 * markSize} ${cy + uy1 * markSize + uy2 * markSize} Z`}
            fill={arcColor}
            fillOpacity={0}
            stroke="none"
          />
        </g>
      );
    }
    
    const vertexPoint = points.find(p => p.label === vertex);
    const point1 = points.find(p => p.label === from);
    const point2 = points.find(p => p.label === to);
    
    if (!vertexPoint || !point1 || !point2) return null;
    
    const { x: cx, y: cy } = getPos(vertexPoint);
    const { x: x1, y: y1 } = getPos(point1);
    const { x: x2, y: y2 } = getPos(point2);
    
    const arcColor = color || CANVAS_COLORS.angle;
    
    if (path) {
      const angle1 = Math.atan2(y1 - cy, x1 - cx);
      const angle2 = Math.atan2(y2 - cy, x2 - cx);
      
      const startX = cx + size * Math.cos(angle1);
      const startY = cy + size * Math.sin(angle1);
      const endX = cx + size * Math.cos(angle2);
      const endY = cy + size * Math.sin(angle2);
      
      return (
        <g key={id}>
          <path
            id={id}
            d={path}
            fill="none"
            stroke={arcColor}
            strokeWidth={2.5}
            opacity={0}
          />
          <path
            id={`${id}-fill`}
            d={`M ${cx} ${cy} L ${startX} ${startY} A ${size} ${size} 0 0 1 ${endX} ${endY} Z`}
            fill={arcColor}
            fillOpacity={0}
            stroke="none"
          />
        </g>
      );
    }
    
    const angle1 = Math.atan2(y1 - cy, x1 - cx);
    const angle2 = Math.atan2(y2 - cy, x2 - cx);
    
    const startX = cx + size * Math.cos(angle1);
    const startY = cy + size * Math.sin(angle1);
    const endX = cx + size * Math.cos(angle2);
    const endY = cy + size * Math.sin(angle2);
    
    const cross = (x1 - cx) * (y2 - cy) - (y1 - cy) * (x2 - cx);
    const sweep = cross >= 0 ? 0 : 1;
    
    let angleDiff = angle2 - angle1;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff <= -Math.PI) angleDiff += 2 * Math.PI;
    
    const largeArc = cross >= 0 
      ? (Math.abs(angleDiff) > Math.PI ? 1 : 0)
      : (Math.abs(angleDiff) < Math.PI ? 1 : 0);
    
    return (
      <g key={id}>
        <path
          id={id}
          d={`M ${startX} ${startY} A ${size} ${size} 0 ${largeArc} ${sweep} ${endX} ${endY}`}
          fill="none"
          stroke={arcColor}
          strokeWidth={2.5}
          opacity={0}
        />
        <path
          id={`${id}-fill`}
          d={`M ${cx} ${cy} L ${startX} ${startY} A ${size} ${size} 0 ${largeArc} ${sweep} ${endX} ${endY} Z`}
          fill={arcColor}
          fillOpacity={0}
          stroke="none"
        />
      </g>
    );
  };

  const renderTriangle = (vertex1: string, vertex2: string, vertex3: string, id: string) => {
    const p1 = points.find(p => p.label === vertex1);
    const p2 = points.find(p => p.label === vertex2);
    const p3 = points.find(p => p.label === vertex3);
    if (!p1 || !p2 || !p3) return null;

    const { x: x1, y: y1 } = getPos(p1);
    const { x: x2, y: y2 } = getPos(p2);
    const { x: x3, y: y3 } = getPos(p3);

    return (
      <path
        key={id}
        id={id}
        d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`}
        fill="transparent"
        stroke="transparent"
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="w-full h-full min-h-0 flex-1">
      <svg ref={svgRef} viewBox="0 0 500 420" preserveAspectRatio="xMidYMid meet" className="w-full h-full min-h-[200px] max-h-[50vh] bg-white rounded-lg shadow-sm border border-gray-100">
        {edges.map(e => {
          const from = points.find(p => p.label === e.from)!;
          const to = points.find(p => p.label === e.to)!;
          const { x: x1, y: y1 } = getPos(from);
          const { x: x2, y: y2 } = getPos(to);
          const edgeColor = e.color || CANVAS_COLORS.default;
          return (
            <line 
              key={e.id} 
              id={e.id}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={edgeColor} 
              strokeWidth={2}
            />
          );
        })}
        
        {points.map(p => {
          const { x, y } = getPos(p);
          return (
            <g key={p.label}>
              <circle cx={x} cy={y} r={4} fill={CANVAS_COLORS.default} />
              <text x={x - 15} y={y - 10} fontSize="16" fontWeight="bold">{p.label}</text>
            </g>
          );
        })}

        {angleArcs.map(arc => renderAngleArc(arc))}

        {renderTriangle('A', 'B', 'C', 'triangle-ABC')}
        {renderTriangle('B', 'C', 'D', 'triangle-BCD')}
        {renderTriangle('E', 'D', 'C', 'triangle-EDC')}

        {Object.entries(equalPairs).map(([edgeA, edgeB]) => {
          const edge1 = edges.find(e => e.id === edgeA);
          const edge2 = edges.find(e => e.id === edgeB);
          if (!edge1 || !edge2) return null;
          
          const p1Start = points.find(p => p.label === edge1.from);
          const p1End = points.find(p => p.label === edge1.to);
          const p2Start = points.find(p => p.label === edge2.from);
          const p2End = points.find(p => p.label === edge2.to);
          if (!p1Start || !p1End || !p2Start || !p2End) return null;
          
          const mid1X = (p1Start.x + p1End.x) / 2;
          const mid1Y = 300 - (p1Start.y + p1End.y) / 2;
          
          const mid2X = (p2Start.x + p2End.x) / 2;
          const mid2Y = 300 - (p2Start.y + p2End.y) / 2;
          
          return (
            <g key={`eq-${edgeA}-${edgeB}`}>
              <text 
                x={mid1X} 
                y={mid1Y} 
                textAnchor="middle" 
                dominantBaseline="middle"
                fontSize="14" 
                fontWeight="bold"
                fill={CANVAS_COLORS.angle}
              >
                ≡
              </text>
              <text 
                x={mid2X} 
                y={mid2Y} 
                textAnchor="middle" 
                dominantBaseline="middle"
                fontSize="14" 
                fontWeight="bold"
                fill={CANVAS_COLORS.angle}
              >
                ≡
              </text>
            </g>
          );
        })}
        
        {currentStepData && (
          <foreignObject x="15" y="300" width="470" height="115">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{fontFamily: 'system-ui, -apple-system, sans-serif', padding: '8px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                <span style={{backgroundColor: '#3B82F6', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>
                  第 {currentStep + 1} 步
                </span>
                <span style={{fontSize: '14px', fontWeight: 'bold', color: '#1F2937'}}>
                  {currentStepData.title}
                </span>
              </div>
              
              <div style={{fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: CANVAS_COLORS.text, marginBottom: '6px'}}>
                {currentStepData.content}
              </div>
              
              {currentStepData.conclusion && (
                <div style={{fontSize: '13px', fontWeight: 'bold', color: '#10B981', borderTop: '1px solid #E5E7EB', paddingTop: '6px'}}>
                  ✓ {currentStepData.conclusion}
                </div>
              )}
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}
