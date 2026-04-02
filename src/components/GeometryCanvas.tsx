import { useEffect, useRef } from 'react';
// GSAP 通过 CDN 全局引入，不使用 import

declare const gsap: any; // 全局 gsap 声明

interface Point { x: number; y: number; label: string }
interface AngleArc {
  vertex: string;
  id: string;
  from: string;
  to: string;
  color?: string;  // 可选的颜色
  path?: string;    // 预计算的 SVG 路径（硬编码，避免算法错误）
  isRightAngle?: boolean;  // 是否为直角
}

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
  highlightEdges?: string[] // 高亮边（edge ID）
  drawArcs?: string[]       // 绘制角度弧线
  
  // === v4 新增动画类型 ===
  drawEdge?: string[]       // 逐条绘制边
  showRightAngles?: string[] // 显示直角标记
  showEqualMarks?: boolean  // 显示相等标记
  showLabels?: string[]     // 显示顶点标签
  flashAngle?: string[]     // 闪烁角度（直角标记）
  flashColor?: string       // 闪烁颜色（orange=∠，red=△ABC，green=△EDC）
  drawArc?: string          // 绘制单个弧线
  arcColor?: string         // 弧线颜色（red/green/orange）
  highlightArcs?: string[]  // 高亮弧线
  fillTriangle?: string     // 填充三角形（ABC/EDC）
  fillColor?: string        // 填充颜色
  moveEdge?: string         // 移动边到目标边位置（重叠动画）
  targetEdge?: string       // 目标边ID
  moveTriangle?: string     // 移动三角形到目标位置
  targetTriangle?: string   // 目标三角形
  flashArcs?: string[]      // 闪烁弧线
  
  // === v5 新增动画类型 ===
  flyoutCompare?: Array<{edges: [string, string], label: string}>  // 飞出对比动画
  flashTriangle?: string[]  // 闪烁三角形
}

interface Step {
  id: number;
  title: string;         // 做什么
  content: string;       // 为什么（详细讲解）
  conclusion?: string;   // 得出什么（结论）
}

interface GeometryCanvasProps {
  points: Point[]
  edges: { from: string; to: string; id: string }[]
  rightAngles?: string[]    // 直角顶点
  angleArcs?: AngleArc[]    // 角度弧线配置
  equalPairs?: Record<string, string>  // 相等线段对: {[edgeId: string]: string}
  currentStep: number
  stepAnimations: StepAnimation[]
  currentStepData?: Step   // 当前步骤的完整数据
}

const COLORS = {
  default: '#D1D5DB',     // 浅灰色 - 跟高亮形成强对比
  defaultPoint: '#6B7280', // 点用稍深灰
  highlight: '#3B82F6',    // 亮蓝色高亮
  highlightWidth: 4,       // 高亮时线宽
  triangle1: 'rgba(239,68,68,0.15)', // 红色半透明
  triangle2: 'rgba(16,185,129,0.15)', // 绿色半透明
  angle: '#F59E0B',        // 角度标记
  angleHighlight: '#3B82F6', // 角度高亮色
  text: '#374151',         // 文字深灰
  background: '#F9FAFB'    // 背景
};

export function GeometryCanvas({ points, edges, rightAngles = [], angleArcs = [], equalPairs = {}, currentStep, stepAnimations, currentStepData }: GeometryCanvasProps) {
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
    
    // 重置所有角度弧线 - 隐藏所有弧线
    svg.querySelectorAll('path[id^="arc-"]').forEach(el => {
      gsap.set(el, { stroke: COLORS.angle, strokeWidth: 2, opacity: 0 });
    });
    
    // 重置所有三角形（多边形）
    svg.querySelectorAll('polygon').forEach(el => {
      gsap.set(el, { fill: 'transparent', fillOpacity: 0, opacity: 0 });
    });
    
    // 重置所有路径元素（用于角度弧线等）
    svg.querySelectorAll('path').forEach(el => {
      const id = el.getAttribute('id');
      // 如果是弧线，保持隐藏状态
      if (id && id.startsWith('arc-')) {
        gsap.set(el, { opacity: 0 });
      }
    });
    
    // 清理 flyout 复制元素
    svg.querySelectorAll('.flyout-copy').forEach(el => el.remove());
  };

  // 绘制动画
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    // 重置状态
    resetElements(svg);

    const highlightColor = step.color === 'orange' ? COLORS.angle : COLORS.highlight;

    // 高亮动画 - 加闪烁效果
    (step.highlight || []).forEach(id => {
      const el = svg.querySelector(`#${id}`);
      if (el) {
        gsap.to(el, {
          stroke: highlightColor,
          strokeWidth: COLORS.highlightWidth,
          duration: 0.3,
          onComplete: () => {
            gsap.to(el, {
              opacity: 0.5,
              duration: 0.4,
              yoyo: true,
              repeat: 3,
              ease: "power2.inOut"
            });
          }
        });
      }
    });

    // 闪烁动画（脉冲效果）- 用于角度弧线
    (step.pulse || []).forEach(id => {
      const el = svg.querySelector(`#${id}`);
      if (el) {
        gsap.to(el, {
          stroke: COLORS.angleHighlight,
          strokeWidth: 3,
          scale: 1.2,
          transformOrigin: "center center",
          duration: 0.3,
          yoyo: true,
          repeat: 3
        });
      }
    });

    // 高亮边（highlightEdges）- 使用深蓝色强调
    (step.highlightEdges || []).forEach(id => {
      const el = svg.querySelector(`#${id}`) as SVGLineElement;
      if (el) {
        // 深蓝色强调
        gsap.to(el, {
          stroke: '#2563EB',
          strokeWidth: 4,
          duration: 0.3,
          yoyo: true,
          repeat: 1
        });
      }
    });

    // 绘制角度弧线（drawArcs）- 先显示弧线和填充
    (step.drawArcs || []).forEach(arcId => {
      const el = svg.querySelector(`#${arcId}`);
      if (el) {
        // 立即显示弧线
        gsap.set(el, { opacity: 1, strokeDasharray: 'none', strokeDashoffset: '0' });
        // 然后闪烁效果
        gsap.fromTo(el, 
          { strokeWidth: 2.5 },
          { 
            strokeWidth: 5, 
            duration: 0.25,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut',
            delay: 0.1
          }
        );
      }
      
      // 同时显示填充元素（如果有）
      const fillEl = svg.querySelector(`#${arcId}-fill`);
      if (fillEl) {
        const arc = angleArcs.find(a => a.id === arcId);
        const flashColor = arc?.color || COLORS.angle;
        gsap.set(fillEl, { fill: flashColor, fillOpacity: 0.15 });
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

    // ==================== v4 新动画实现 ====================
    
    // 1. 逐条绘制边（drawEdge）
    if (step.drawEdge) {
      step.drawEdge.forEach((edgeId, index) => {
        const el = svg.querySelector(`#${edgeId}`);
        if (el) {
          gsap.fromTo(el, 
            { opacity: 0, strokeDasharray: '200', strokeDashoffset: '200' },
            { opacity: 1, strokeDashoffset: '0', duration: 0.4, delay: index * 0.25, ease: 'power2.out' }
          );
        }
      });
    }

    // 2. 闪烁角度/直角标记（flashAngle）+ 自动高亮边 + 扇形填充
    if (step.flashAngle) {
      const flashColorMap: Record<string, string> = {
        'orange': COLORS.angle,
        'red': '#EF4444',
        'green': '#10B981'
      };
      const flashColor = flashColorMap[step.flashColor || 'orange'] || COLORS.angle;
      
      step.flashAngle.forEach(angleId => {
        // === 修复：使用 arc-A 的 ID 格式（与 angleArcs 配置一致）===
        const el = svg.querySelector(`#arc-${angleId}`) || svg.querySelector(`#angle-${angleId}`);
        if (el) {
          gsap.fromTo(el,
            { stroke: flashColor, strokeWidth: 2, opacity: 1 },
            { 
              strokeWidth: 4,
              duration: 0.2,
              yoyo: true,
              repeat: 3,
              ease: 'power2.inOut'
            }
          );
        }
        
        // === 展示角时：浅蓝色弱化边 ===
        const angleArc = angleArcs.find(arc => arc.vertex === angleId);
        if (angleArc) {
          const fromPoint = points.find(p => p.label === angleArc.from);
          const toPoint = points.find(p => p.label === angleArc.to);
          if (fromPoint && toPoint) {
            const edge1 = edges.find(e => (e.from === angleId && e.to === fromPoint.label) || (e.to === angleId && e.from === fromPoint.label));
            const edge2 = edges.find(e => (e.from === angleId && e.to === toPoint.label) || (e.to === angleId && e.from === toPoint.label));
            
            [edge1, edge2].forEach((edge) => {
              if (!edge) return;
              
              const el = svg.querySelector(`#${edge.id}`) as SVGLineElement;
              if (!el) return;
              
              // 浅蓝色弱化
              gsap.to(el, {
                stroke: '#93C5FD',
                strokeWidth: 3,
                duration: 0.3,
                yoyo: true,
                repeat: 1
              });
            });
          }
        }
        
        // === 填充元素闪烁 ===
        const fillEl = svg.querySelector(`#arc-${angleId}-fill`);
        if (fillEl) {
          gsap.set(fillEl, { fill: flashColor });
          gsap.fromTo(fillEl,
            { fillOpacity: 0.1 },
            {
              fillOpacity: 0.35,
              duration: 0.3,
              yoyo: true,
              repeat: 3,
              ease: 'power2.inOut',
              onComplete: () => {
                gsap.to(fillEl, { fillOpacity: 0.15, duration: 0.5 });
              }
            }
          );
        }
      });
    }

    // 3. 绘制单个弧线（drawArc）
    if (step.drawArc) {
      const arcColorMap: Record<string, string> = {
        'red': '#EF4444',
        'green': '#10B981',
        'orange': COLORS.angle
      };
      const arcColor = arcColorMap[step.arcColor || 'orange'] || COLORS.angle;
      
      const el = svg.querySelector(`#${step.drawArc}`);
      if (el) {
        gsap.fromTo(el,
          { opacity: 0, strokeDasharray: '100', strokeDashoffset: '100' },
          { opacity: 1, strokeDashoffset: '0', duration: 0.6, ease: 'power2.out' }
        );
        // 设置颜色
        gsap.set(el, { stroke: arcColor });
      }
    }

    // 4. 高亮弧线（highlightArcs）
    if (step.highlightArcs) {
      step.highlightArcs.forEach(arcId => {
        const el = svg.querySelector(`#${arcId}`);
        if (el) {
          gsap.to(el, {
            strokeWidth: 4,
            duration: 0.3,
            yoyo: true,
            repeat: 2
          });
        }
      });
    }

    // 5. 填充三角形（fillTriangle）
    if (step.fillTriangle) {
      const el = svg.querySelector(`#triangle-${step.fillTriangle}`);
      if (el) {
        gsap.to(el, {
          fill: step.fillColor || 'rgba(239,68,68,0.2)',
          fillOpacity: 0.3,
          duration: 0.5
        });
      }
    }

    // 6. 移动边重叠动画（moveEdge）- 核心改进！
    if (step.moveEdge && step.targetEdge) {
      const fromEdge = edges.find(e => e.id === step.moveEdge);
      const toEdge = edges.find(e => e.id === step.targetEdge);
      
      if (fromEdge && toEdge) {
        const fromStart = points.find(p => p.label === fromEdge.from);
        const fromEnd = points.find(p => p.label === fromEdge.to);
        const toStart = points.find(p => p.label === toEdge.from);
        const toEnd = points.find(p => p.label === toEdge.to);
        
        if (fromStart && fromEnd && toStart && toEnd) {
          const fromEl = svg.querySelector(`#${step.moveEdge}`);
          
          if (fromEl) {
            // 计算位移
            const dx = toEnd.x - fromEnd.x;
            const dy = (toEnd.y - fromEnd.y); // Y轴方向相反
            
            // 动画序列：
            // 1. 变成虚线
            gsap.to(fromEl, { 
              strokeDasharray: '8,4', 
              duration: 0.3 
            });
            
            // 2. 移动到目标位置
            gsap.to(fromEl, {
              x: dx,
              y: -dy, // 因为Y轴反转
              duration: 1,
              ease: 'power2.inOut',
              delay: 0.3
            });
            
            // 3. 变成实线显示重合
            gsap.to(fromEl, {
              strokeDasharray: '0',
              duration: 0.3,
              delay: 1.3
            });
          }
        }
      }
    }

    // 7. 闪烁弧线（flashArcs）
    if (step.flashArcs) {
      step.flashArcs.forEach(arcId => {
        const el = svg.querySelector(`#${arcId}`);
        if (el) {
          gsap.to(el, {
            strokeWidth: 5,
            stroke: '#F59E0B',
            duration: 0.25,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut'
          });
        }
      });
    }

    // 8. 移动三角形重叠动画（moveTriangle）- 关键全等证明
    if (step.moveTriangle && step.targetTriangle) {
      const fromTriangleId = step.moveTriangle === 'ABC' ? 'triangle-ABC' : 'triangle-EDC';
      const toTriangleId = step.targetTriangle === 'EDC' ? 'triangle-EDC' : 'triangle-ABC';
      
      const el = svg.querySelector(`#${fromTriangleId}`);
      
      if (el) {
        // 计算目标三角形的中心点位移
        let targetPoints: Point[] = [];
        if (step.targetTriangle === 'EDC') {
          targetPoints = [points.find(p => p.label === 'E')!, points.find(p => p.label === 'D')!, points.find(p => p.label === 'C')!];
        } else {
          targetPoints = [points.find(p => p.label === 'A')!, points.find(p => p.label === 'B')!, points.find(p => p.label === 'C')!];
        }
        
        const sourcePoints = step.moveTriangle === 'ABC' 
          ? [points.find(p => p.label === 'A')!, points.find(p => p.label === 'B')!, points.find(p => p.label === 'C')!]
          : [points.find(p => p.label === 'E')!, points.find(p => p.label === 'D')!, points.find(p => p.label === 'C')!];
        
        const sourceCenter = { 
          x: (sourcePoints[0].x + sourcePoints[1].x + sourcePoints[2].x) / 3,
          y: 300 - (sourcePoints[0].y + sourcePoints[1].y + sourcePoints[2].y) / 3
        };
        const targetCenter = {
          x: (targetPoints[0].x + targetPoints[1].x + targetPoints[2].x) / 3,
          y: 300 - (targetPoints[0].y + targetPoints[1].y + targetPoints[2].y) / 3
        };
        
        const dx = targetCenter.x - sourceCenter.x;
        const dy = targetCenter.y - sourceCenter.y;
        
        gsap.to(el, {
          transform: `translate(${dx}px, ${dy}px)`,
          opacity: 0.6,
          duration: 1.5,
          ease: 'power2.inOut'
        });
      }
    }

    // ==================== v5 新增动画实现 ====================
    
    // 9. 飞出对比动画（flyoutCompare）- 用于展示两条边相等
    if (step.flyoutCompare) {
      step.flyoutCompare.forEach(({ edges, label }, index) => {
        const [edgeId1, edgeId2] = edges;
        const el1 = svg.querySelector(`#${edgeId1}`);
        const el2 = svg.querySelector(`#${edgeId2}`);
        if (!el1 || !el2) return;
        
        // 获取两条边的位置信息
        const x1 = parseFloat(el1.getAttribute('x1') || '0');
        const y1 = parseFloat(el1.getAttribute('y1') || '0');
        const x2 = parseFloat(el1.getAttribute('x2') || '0');
        const y2 = parseFloat(el1.getAttribute('y2') || '0');
        const len1 = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        const x3 = parseFloat(el2.getAttribute('x1') || '0');
        const y3 = parseFloat(el2.getAttribute('y1') || '0');
        const x4 = parseFloat(el2.getAttribute('x2') || '0');
        const y4 = parseFloat(el2.getAttribute('y2') || '0');
        const len2 = Math.sqrt((x4 - x3) ** 2 + (y4 - y3) ** 2);
        
        // 先高亮原边
        gsap.to(el1, { stroke: '#3B82F6', strokeWidth: 3, duration: 0.3 });
        gsap.to(el2, { stroke: '#3B82F6', strokeWidth: 3, duration: 0.3 });
        
        // 延迟后创建复制线段飞到上方
        setTimeout(() => {
          const ns = 'http://www.w3.org/2000/svg';
          const baseX = 100 + index * 150; // 如果有多个对比，错开位置
          const targetY = 50; // 上方位置
          
          // 复制线段1 - 飞到上方左侧
          const copy1 = document.createElementNS(ns, 'line');
          copy1.setAttribute('x1', String(baseX));
          copy1.setAttribute('y1', String(targetY));
          copy1.setAttribute('x2', String(baseX + len1));
          copy1.setAttribute('y2', String(targetY));
          copy1.setAttribute('stroke', '#EF4444');
          copy1.setAttribute('stroke-width', '3');
          copy1.setAttribute('class', 'flyout-copy');
          svg.appendChild(copy1);
          
          // 复制线段2 - 飞到上方右侧
          const copy2 = document.createElementNS(ns, 'line');
          copy2.setAttribute('x1', String(baseX + len1 + 30));
          copy2.setAttribute('y1', String(targetY));
          copy2.setAttribute('x2', String(baseX + len1 + 30 + len2));
          copy2.setAttribute('y2', String(targetY));
          copy2.setAttribute('stroke', '#10B981');
          copy2.setAttribute('stroke-width', '3');
          copy2.setAttribute('class', 'flyout-copy');
          svg.appendChild(copy2);
          
          // 动画：从原位飞到上方（使用 gsap.fromTo）
          gsap.fromTo(copy1, 
            { opacity: 0.3, y: y1 - targetY },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
          );
          gsap.fromTo(copy2,
            { opacity: 0.3, y: y3 - targetY },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 }
          );
          
          // 添加等号文字
          const eqText = document.createElementNS(ns, 'text');
          eqText.setAttribute('x', String(baseX + len1 + 15));
          eqText.setAttribute('y', String(targetY + 5));
          eqText.setAttribute('text-anchor', 'middle');
          eqText.setAttribute('font-size', '16');
          eqText.setAttribute('fill', '#10B981');
          eqText.setAttribute('font-weight', 'bold');
          eqText.setAttribute('class', 'flyout-copy');
          eqText.textContent = '=';
          svg.appendChild(eqText);
          gsap.fromTo(eqText,
            { opacity: 0, scale: 0 },
            { opacity: 1, scale: 1, duration: 0.5, delay: 0.8 }
          );
        }, 600);
      });
    }
    
    // 10. 闪烁三角形（flashTriangle）
    if (step.flashTriangle) {
      step.flashTriangle.forEach(triId => {
        const el = svg.querySelector(`#triangle-${triId}`);
        if (el) {
          // 闪烁填充效果
          gsap.to(el, {
            fill: 'rgba(59, 130, 246, 0.2)',
            fillOpacity: 0.3,
            duration: 0.3,
            yoyo: true,
            repeat: 3
          });
        }
      });
    }

  }, [currentStep, step]);

  // 渲染直角标记（L形）- 不再使用，统一通过 angleArcs 配置
  const renderRightAngle = (point: Point, size: number = 20) => {
    return null; // 统一由 angleArcs 渲染，避免 ID 冲突
  };

  // 渲染角度弧线（用于一般角度）- 优先使用预计算路径，避免算法错误
  const renderAngleArc = (arc: AngleArc, size: number = 25) => {
    const { vertex, from, to, id, color, path, isRightAngle } = arc;
    
    // 如果是直角，渲染方块标记
    if (isRightAngle) {
      const vertexPoint = points.find(p => p.label === vertex);
      const point1 = points.find(p => p.label === from);
      const point2 = points.find(p => p.label === to);
      
      if (!vertexPoint || !point1 || !point2) return null;
      
      const { x: cx, y: cy } = getPos(vertexPoint);
      const { x: x1, y: y1 } = getPos(point1);
      const { x: x2, y: y2 } = getPos(point2);
      
      const arcColor = color || COLORS.angle;
      const markSize = 15;
      
      // 计算方向
      const dx1 = Math.sign(x1 - cx) * markSize;
      const dy1 = Math.sign(y1 - cy) * markSize;
      const dx2 = Math.sign(x2 - cx) * markSize;
      const dy2 = Math.sign(y2 - cy) * markSize;
      
      // 渲染方块标记（L形线段）
      return (
        <g key={id}>
          {/* L形线段 */}
          <path
            id={id}
            d={`M ${cx + dx1} ${cy + dy1} L ${cx} ${cy} L ${cx + dx2} ${cy + dy2}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={2.5}
            opacity={0}
          />
          {/* 方块填充（初始透明）*/}
          <path
            id={`${id}-fill`}
            d={`M ${cx} ${cy} L ${cx + dx1} ${cy + dy1} L ${cx + dx1 + dx2} ${cy + dy1 + dy2} L ${cx + dx2} ${cy + dy2} Z`}
            fill={arcColor}
            fillOpacity={0}
            stroke="none"
          />
        </g>
      );
    }
    
    // 非直角：渲染弧线 + 扇形填充
    const vertexPoint = points.find(p => p.label === vertex);
    const point1 = points.find(p => p.label === from);
    const point2 = points.find(p => p.label === to);
    
    if (!vertexPoint || !point1 || !point2) return null;
    
    const { x: cx, y: cy } = getPos(vertexPoint);
    const { x: x1, y: y1 } = getPos(point1);
    const { x: x2, y: y2 } = getPos(point2);
    
    const arcColor = color || COLORS.angle;
    
    // 如果有预计算的路径，直接使用（硬编码方式）
    if (path) {
      // 计算方向角（弧度）
      const angle1 = Math.atan2(y1 - cy, x1 - cx);
      const angle2 = Math.atan2(y2 - cy, x2 - cx);
      
      // 弧线起点和终点
      const startX = cx + size * Math.cos(angle1);
      const startY = cy + size * Math.sin(angle1);
      const endX = cx + size * Math.cos(angle2);
      const endY = cy + size * Math.sin(angle2);
      
      return (
        <g key={id}>
          {/* 弧线 */}
          <path
            id={id}
            d={path}
            fill="none"
            stroke={arcColor}
            strokeWidth={2.5}
            opacity={0}
          />
          {/* 扇形填充（初始透明）*/}
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
    
    // 否则使用通用算法（fallback）
    // 计算方向角（弧度）
    const angle1 = Math.atan2(y1 - cy, x1 - cx);
    const angle2 = Math.atan2(y2 - cy, x2 - cx);
    
    // 弧线起点和终点
    const startX = cx + size * Math.cos(angle1);
    const startY = cy + size * Math.sin(angle1);
    const endX = cx + size * Math.cos(angle2);
    const endY = cy + size * Math.sin(angle2);
    
    // 用叉积判断弧线方向：cross > 0 逆时针，cross < 0 顺时针
    const cross = (x1 - cx) * (y2 - cy) - (y1 - cy) * (x2 - cx);
    const sweep = cross >= 0 ? 0 : 1;  // 0=逆时针, 1=顺时针
    
    // 计算角度差，用于判断是否需要大弧
    let angleDiff = angle2 - angle1;
    // 归一化到 (-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff <= -Math.PI) angleDiff += 2 * Math.PI;
    
    // 总是画小弧（内角），当角度差超过 180° 时才用大弧
    // 根据方向调整判断逻辑
    const largeArc = cross >= 0 
      ? (Math.abs(angleDiff) > Math.PI ? 1 : 0)  // 逆时针：角度差>180°要大弧
      : (Math.abs(angleDiff) < Math.PI ? 1 : 0);  // 顺时针：角度差<180°要大弧（因为sweep反了）
    
    return (
      <g key={id}>
        {/* 弧线 */}
        <path
          id={id}
          d={`M ${startX} ${startY} A ${size} ${size} 0 ${largeArc} ${sweep} ${endX} ${endY}`}
          fill="none"
          stroke={arcColor}
          strokeWidth={2.5}
          opacity={0}
        />
        {/* 扇形填充（初始透明）*/}
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
    <div className="w-full">
      <svg ref={svgRef} viewBox="0 0 500 500" className="w-full bg-white rounded-lg shadow">
      {/* 三角形区域（用于填充）*/}
      {renderTriangle('A', 'B', 'C', 'triangle-ABC')}
      {renderTriangle('B', 'C', 'D', 'triangle-BCD')}
      {renderTriangle('E', 'D', 'C', 'triangle-EDC')}

      {/* 边 */}
      {edges.map(e => {
        const from = points.find(p => p.label === e.from)!;
        const to = points.find(p => p.label === e.to)!;
        const { x: x1, y: y1 } = getPos(from);
        const { x: x2, y: y2 } = getPos(to);
        // 使用边的颜色属性，如果没有则使用默认颜色
        const edgeColor = e.color || COLORS.default;
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

      {/* 角度弧线（包括直角和一般角）- 统一由 angleArcs 配置渲染 */}
      {angleArcs.map(arc => renderAngleArc(arc))}
      
      {/* 一般角度弧线已通过 angleArcs 配置渲染，这里不再重复渲染 */}

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
      
      {/* 讲解文字区域 */}
      {currentStepData && (
        <foreignObject x="20" y="360" width="460" height="130">
          <div xmlns="http://www.w3.org/1999/xhtml" style={{fontFamily: 'system-ui, -apple-system, sans-serif', padding: '10px'}}>
            {/* 标题 */}
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <span style={{backgroundColor: '#3B82F6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>
                第 {currentStep + 1} 步
              </span>
              <span style={{fontSize: '16px', fontWeight: 'bold', color: '#1F2937'}}>
                {currentStepData.title}
              </span>
            </div>
            
            {/* 讲解内容 */}
            <div style={{fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: COLORS.text, marginBottom: '8px'}}>
              {currentStepData.content}
            </div>
            
            {/* 结论 */}
            {currentStepData.conclusion && (
              <div style={{fontSize: '14px', fontWeight: 'bold', color: '#10B981', borderTop: '1px solid #E5E7EB', paddingTop: '8px'}}>
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
