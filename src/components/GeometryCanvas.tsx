import { useEffect, useRef } from 'react';
// GSAP 通过 CDN 全局引入，不使用 import

declare const gsap: any; // 全局 gsap 声明

interface Point { x: number; y: number; label: string }
interface StepAnimation {
  highlight?: string[]      // 要高亮的元素 ID
  draw?: string[]           // 要绘制的元素 ID  
  hide?: string[]           // 要隐藏的元素 ID
  pulse?: string[]          // 要闪烁的元素 ID
  fill?: Record<string, string>  // 填充三角形 {[triangleId]: color}
  transform?: Record<string, string>  // 变换动画 {[triangleId]: target}
  color?: string            // 高亮颜色
  rightAngles?: string[]    // 标注直角
  angles?: string[]         // 标注一般角度（弧线）
}

interface GeometryCanvasProps {
  points: Point[]
  edges: { from: string; to: string; id: string }[]
  rightAngles?: string[]    // 直角顶点
  equalPairs?: Record<string, string>  // 相等线段对: {[edgeId: string]: string}
  currentStep: number
  stepAnimations: StepAnimation[]
  explanation?: string      // 当前步骤的详细讲解
}

const COLORS = {
  default: '#374151',
  highlight: '#3B82F6',    // 蓝色高亮
  triangle1: '#EF4444',    // 红色 - ABC
  triangle2: '#10B981',    // 绿色 - EDC
  angle: '#F59E0B',        // 橙色 - 角度
  background: '#F9FAFB'
};

export function GeometryCanvas({ points, edges, rightAngles = [], equalPairs = {}, currentStep, stepAnimations, explanation }: GeometryCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const step = stepAnimations[currentStep] || {};

  // 坐标映射：将逻辑坐标转为 SVG 坐标（y轴反转）
  const getPos = (p: Point) => ({ x: p.x, y: 300 - p.y });

  // 重置所有元素到默认状态（完全重置）
  const resetElements = (svg: SVGSVGElement) => {
    // 重置所有边
    svg.querySelectorAll('line').forEach(el => {
      gsap.set(el, { stroke: COLORS.default, strokeWidth: 2, opacity: 1 });
    });
    
    // 重置所有三角形（多边形）
    svg.querySelectorAll('polygon').forEach(el => {
      gsap.set(el, { fill: 'transparent', fillOpacity: 0, opacity: 0 });
    });
    
    // 重置所有路径元素（用于角度弧线等）
    svg.querySelectorAll('path').forEach(el => {
      gsap.set(el, { opacity: 1 });
    });
  };

  // 绘制动画
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    // 重置状态
    resetElements(svg);

    const highlightColor = step.color === 'orange' ? COLORS.angle : COLORS.highlight;

    // 高亮动画
    (step.highlight || []).forEach(id => {
      const el = svg.querySelector(`#${id}`);
      if (el) {
        gsap.to(el, { 
          stroke: highlightColor, 
          strokeWidth: 3, 
          duration: 0.3 
        });
      }
    });

    // 闪烁动画（脉冲效果）
    (step.pulse || []).forEach(id => {
      const el = svg.querySelector(`#${id}`);
      if (el) {
        gsap.to(el, { 
          stroke: COLORS.highlight, 
          strokeWidth: 3, 
          duration: 0.5,
          yoyo: true,
          repeat: 3
        });
      }
    });

    // 绘制新元素
    (step.draw || []).forEach(id => {
      const el = svg.querySelector(`#${id}`);
      if (el) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      }
    });

    // 隐藏元素
    (step.hide || []).forEach(id => {
      const el = svg.querySelector(`#${id}`);
      if (el) {
        gsap.to(el, { opacity: 0.2, duration: 0.3 });
      }
    });

    // 填充三角形
    if (step.fill) {
      Object.entries(step.fill).forEach(([triangleId, color]) => {
        const el = svg.querySelector(`#triangle-${triangleId}`);
        if (el) {
          gsap.to(el, { 
            fill: color, 
            fillOpacity: 0.3, 
            duration: 0.6 
          });
        }
      });
    }

    // 变换动画（三角形移动）
    if (step.transform) {
      Object.entries(step.transform).forEach(([triangleId, target]) => {
        const el = svg.querySelector(`#triangle-${triangleId}`);
        if (el && target === 'to-EDC') {
          // 获取 EDC 三角形的中心点
          const ePoint = points.find(p => p.label === 'E');
          const dPoint = points.find(p => p.label === 'D');
          const cPoint = points.find(p => p.label === 'C');
          if (ePoint && dPoint && cPoint) {
            const targetX = (ePoint.x + dPoint.x + cPoint.x) / 3;
            const targetY = 300 - (ePoint.y + dPoint.y + cPoint.y) / 3;
            
            gsap.to(el, {
              opacity: 0.5,
              transform: `translate(${targetX - 100}px, ${targetY - 150}px)`,
              duration: 1.5,
              ease: 'power2.inOut'
            });
          }
        }
      });
    }
  }, [currentStep, step]);

  // 渲染直角标记（L形）
  const renderRightAngle = (point: Point, size: number = 20) => {
    if (!rightAngles.includes(point.label)) return null;
    const { x, y } = getPos(point);
    return (
      <g key={`right-angle-${point.label}`}>
        <path 
          id={`angle-${point.label}`}
          d={`M ${x} ${y - size} L ${x} ${y} L ${x + size} ${y}`}
          fill="none"
          stroke={COLORS.angle}
          strokeWidth={2}
        />
      </g>
    );
  };

  // 渲染角度弧线（用于一般角度）
  const renderAngleArc = (vertex: string, p1: string, p2: string, size: number = 25) => {
    const vertexPoint = points.find(p => p.label === vertex);
    const point1 = points.find(p => p.label === p1);
    const point2 = points.find(p => p.label === p2);
    
    if (!vertexPoint || !point1 || !point2) return null;
    
    const { x: cx, y: cy } = getPos(vertexPoint);
    const { x: x1, y: y1 } = getPos(point1);
    const { x: x2, y: y2 } = getPos(point2);
    
    // 计算角度
    const angle1 = Math.atan2(y1 - cy, x1 - cx);
    const angle2 = Math.atan2(y2 - cy, x2 - cx);
    
    // 转换为度数
    const startAngle = angle1 * 180 / Math.PI;
    const endAngle = angle2 * 180 / Math.PI;
    
    // 计算弧线起点和终点
    const startX = cx + size * Math.cos(angle1);
    const startY = cy + size * Math.sin(angle1);
    const endX = cx + size * Math.cos(angle2);
    const endY = cy + size * Math.sin(angle2);
    
    // 判断是否是大弧
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    
    return (
      <path
        key={`arc-${vertex}-${p1}-${p2}`}
        id={`arc-${vertex}`}
        d={`M ${startX} ${startY} A ${size} ${size} 0 ${largeArc} 1 ${endX} ${endY}`}
        fill="none"
        stroke={COLORS.angle}
        strokeWidth={2}
        opacity={0.7}
      />
    );
  };

  const renderEqualMark = (p1: Point, p2: Point) => {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    return (
      <text x={midX} y={300 - midY} textAnchor="middle" fontSize="14" fill={COLORS.angle}>
        =
      </text>
    );
  };

  // 渲染三角形路径
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
    <div className="relative">
      {/* 顶部讲解区域 */}
      {explanation && (
        <div className="absolute top-0 left-0 right-0 bg-blue-50 border-l-4 border-blue-500 p-3 mb-2 rounded text-sm text-gray-700 z-10">
          <div className="font-semibold text-blue-900 mb-1">💡 为什么：</div>
          <div className="whitespace-pre-wrap">{explanation}</div>
        </div>
      )}
      
      <svg ref={svgRef} viewBox="0 0 500 350" className="w-full max-w-lg mx-auto bg-white rounded-lg shadow" style={{ marginTop: explanation ? '80px' : '0' }}>
      {/* 三角形区域（用于填充）*/}
      {renderTriangle('A', 'B', 'C', 'triangle-ABC')}
      {renderTriangle('E', 'D', 'C', 'triangle-EDC')}

      {/* 边 */}
      {edges.map(e => {
        const from = points.find(p => p.label === e.from)!;
        const to = points.find(p => p.label === e.to)!;
        const { x: x1, y: y1 } = getPos(from);
        const { x: x2, y: y2 } = getPos(to);
        return (
          <line 
            key={e.id} 
            id={e.id}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={COLORS.default} 
            strokeWidth={2}
          />
        );
      })}
      
      {/* 顶点 */}
      {points.map(p => {
        const { x, y } = getPos(p);
        return (
          <g key={p.label}>
            <circle cx={x} cy={y} r={4} fill={COLORS.default} />
            <text x={x - 15} y={y - 10} fontSize="16" fontWeight="bold">{p.label}</text>
          </g>
        );
      })}

      {/* 直角标记 */}
      {points.map(renderRightAngle)}
      
      {/* 一般角度弧线 - 在需要时显示 */}
      {step.angles && step.angles.map(vertex => {
        // 根据顶点找到相邻的两个点
        const adjacentEdges = edges.filter(e => e.from === vertex || e.to === vertex);
        if (adjacentEdges.length >= 2) {
          const p1 = adjacentEdges[0].from === vertex ? adjacentEdges[0].to : adjacentEdges[0].from;
          const p2 = adjacentEdges[1].from === vertex ? adjacentEdges[1].to : adjacentEdges[1].from;
          return renderAngleArc(vertex, p1, p2);
        }
        return null;
      })}

      {/* 相等标记 */}
      {Object.entries(equalPairs).map(([edgeA, edgeB]) => {
        // 找到对应边的中点
        const edge1 = edges.find(e => e.id === edgeA);
        const edge2 = edges.find(e => e.id === edgeB);
        if (!edge1 || !edge2) return null;
        
        const p1Start = points.find(p => p.label === edge1.from);
        const p1End = points.find(p => p.label === edge1.to);
        const p2Start = points.find(p => p.label === edge2.from);
        const p2End = points.find(p => p.label === edge2.to);
        if (!p1Start || !p1End || !p2Start || !p2End) return null;
        
        // 计算第一条边的中点
        const mid1X = (p1Start.x + p1End.x) / 2;
        const mid1Y = 300 - (p1Start.y + p1End.y) / 2;
        
        // 计算第二条边的中点
        const mid2X = (p2Start.x + p2End.x) / 2;
        const mid2Y = 300 - (p2Start.y + p2End.y) / 2;
        
        return (
          <g key={`eq-${edgeA}-${edgeB}`}>
            {/* 第一条边的等号 */}
            <text 
              x={mid1X} 
              y={mid1Y} 
              textAnchor="middle" 
              dominantBaseline="middle"
              fontSize="14" 
              fontWeight="bold"
              fill={COLORS.angle}
            >
              ≡
            </text>
            {/* 第二条边的等号 */}
            <text 
              x={mid2X} 
              y={mid2Y} 
              textAnchor="middle" 
              dominantBaseline="middle"
              fontSize="14" 
              fontWeight="bold"
              fill={COLORS.angle}
            >
              ≡
            </text>
          </g>
        );
      })}
    </svg>
    </div>
  );
}
