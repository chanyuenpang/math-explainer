# MathExplainer 重构计划

## 当前问题

### 硬编码拓扑关系
```json
// 现有数据模型 (问题)
{
  "edges": [
    { "id": "AB", "from": "A", "to": "B" },
    { "id": "BC", "from": "B", "to": "C" }
  ],
  "angleArcs": [
    { "id": "angleABC", "vertex": "B", "from": "A", "to": "C" }
  ],
  "stepAnimations": [
    { "flash": ["AB", "BC"] }
  ]
}
```

**问题**:
1. 角到边关系手动配：angleArcs.from/to 要对上 edges.from/to，错一个字母就不工作
2. 没有自动推导：A-B-C 组成角 ABC，应该自动知道边 AB 和 BC
3. 边方向问题：AD 和 DA 是同一条边，但代码不识别

## 重构目标: 拓扑层 (TODO-002)

### 新数据模型
```json
// 输入：只定义点和连接
{
  "points": [
    { "id": "A", "x": 100, "y": 200 },
    { "id": "B", "x": 200, "y": 200 },
    { "id": "C", "x": 200, "y": 100 }
  ],
  "connections": [
    ["A", "B"], ["B", "C"], ["C", "A"]
  ]
}

// 自动推导 (框架层)
edges: [
  { "id": "AB", "points": ["A", "B"] },
  { "id": "BA", "points": ["B", "A"], "alias": "AB" }  // 双向注册
]
angles: [
  { "id": "angleABC", "vertex": "B", "edges": ["BA", "BC"] }  // 自动推导
]
```

### 核心逻辑
1. **边双向注册**: AB 和 BA 都指向同一条边，自动识别
2. **角自动推导**: ∠ABC → 自动找到 BA (B←A) 和 BC (B→C)
3. **动画意图映射**: stepAnimations 只写 "flashAngleABC" → 自动映射到具体 edge IDs

## 重构范围
- 新增 `src/lib/topology.ts` - 拓扑推导引擎
- 修改 `GeometryCanvas.tsx` - 使用拓扑层 API
- 更新 `math-001.json` - 简化数据格式
- 不碰渲染和动画逻辑

## 执行步骤
1. 分析现有 GeometryCanvas.tsx 拓扑相关代码
2. 实现 topology.ts 推导引擎
3. 迁移 math-001.json 到新格式
4. 修改 GeometryCanvas 使用新 API
5. 测试 math-001 动画正常
6. 验证通过后 commit
