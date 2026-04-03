# MathExplainer 几何动画引擎规范

## 设计目标
从 math-001 实战中抽象出的通用几何题演示引擎，实现"声明式动画意图 → 自动视觉映射"。

## 1. 数据模型

### 输入：题目数据 (JSON)
```json
{
  "id": "math-001",
  "geometry": {
    "points": [
      {"id": "A", "x": 100, "y": 100},
      {"id": "B", "x": 100, "y": 200},
      {"id": "C", "x": 200, "y": 200},
      {"id": "D", "x": 200, "y": 100},
      {"id": "E", "x": 300, "y": 100}
    ],
    "connections": [
      ["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], ["D", "E"], ["C", "E"]
    ],
    "annotations": {
      "rightAngles": ["A", "C"],
      "equalEdges": [["BC", "CD"], ["AB", "DE"]],
      "equalAngles": []
    }
  },
  "steps": [
    {
      "id": 0,
      "title": "绘制图形",
      "intent": "draw_full_geometry",
      "params": {}
    },
    {
      "id": 1,
      "title": "∠A = 90°",
      "intent": "highlight_angle",
      "params": {"angle": "A"}
    },
    {
      "id": 2,
      "title": "∠BCD = 90°",
      "intent": "highlight_angle", 
      "params": {"angle": "C"}
    },
    {
      "id": 9,
      "title": "∠ABC = ∠EDC",
      "intent": "prove_angle_equal",
      "params": {"angle1": "B", "angle2": "D"}
    }
  ]
}
```

### 自动推导层 (Engine)
1. **edges**: connections → 双向边 (AB=BA)
2. **angles**: 遍历所有点，找该点连接的边 → 生成所有角
3. **triangles**: 找闭环的 3 条边 → 生成三角形
4. **annotation lookup**: rightAngles → 对应 arc 渲染参数

### 动画意图层 (Intent → Visual Mapping)
| Intent | 引擎自动映射 |
|--------|-------------|
| `draw_full_geometry` | 依次绘制所有 edges + 显示所有点 + 显示所有 annotations |
| `highlight_angle(X)` | 找到顶点 X 的角 → 闪角弧 + 闪角的两条边（BA, BC） |
| `prove_angle_equal(A, B)` | 闪角 A + 角 A 的两条边 + 闪角 B + 角 B 的两条边 + 高亮对比 |
| `highlight_edges([e1, e2])` | 找到边 e1, e2 → 高亮 + pulse 动画 |
| `show_equal([e1, e2])` | 在边 e1, e2 中点显示 "≡" 标记 |
| `fill_triangle(T, color)` | 找到三角形 T 的 3 个顶点 → 填充颜色 |

## 2. 渲染层 (SVG)

### Z-Order (从下到上)
1. 三角形填充 (polygon, fill-opacity)
2. 边 (line, stroke)
3. 角弧线 (path, fill)
4. 顶点 (circle + text)

### 关键渲染规则
- **角弧线必须在边上面** — 先画边，再画角
- **直角标记用 L 形**，不是弧线
- **高亮效果**: 边颜色变深 + 线宽增加 + 脉冲动画
- **动画持续**: GSAP 动画的 to 状态要设置成最终效果，from 才是初始状态

## 3. 步骤动画执行流程

```
每步执行:
1. resetElements() → 恢复所有元素到默认状态
2. parse intent → 获取 params
3. lookup elements → 自动映射到 SVG IDs
4. apply animations → GSAP 执行动画
5. persist highlights → 高亮状态持续到下一步
```

## 4. 待修复的 math-001 问题清单

- [ ] 第2步: arc-BCD 坐标修复（在 C 点 (200,200)，不是 D 点）
- [ ] 第9/10步: highlight_angle 意图需同时闪边
- [ ] 第12步: BC=DC 应该闪 BC 和 CD 边，不是角 A/EDC
- [ ] 第14步: SAS 结论应闪角 A（直角），不是角 ABC
- [ ] 所有高亮动画 → 设置为 to 状态而非 from→to
