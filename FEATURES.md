# MathExplainer 功能列表

## ✅ 已完成

### FEAT-001: 基础项目架构
- Astro + React 项目搭建
- 首页题目列表
- 题目详情页（分步讲解）

### FEAT-002: 几何图形渲染 (SVG)
- 点、边、顶点标签渲染
- 角度弧线渲染（直角 L 形 + 弧线）
- 相等标记（≡）
- 坐标映射（逻辑坐标 → SVG 坐标）

### FEAT-003: GSAP 分步动画
- 边绘制动画（drawEdge）
- 角度闪烁动画（flashAngle）
- 边高亮动画（highlightEdges）
- 三角形填充（fillTriangle）
- 飞出对比动画（flyoutCompare）
- 弧线绘制/高亮（drawArcs/highlightArcs）

### FEAT-004: 拓扑层 (topology.ts)
- connections → edges 自动推导
- 双向边识别（AB = BA）
- 角度自动推导

### FEAT-005: math-001 题目数据
- 永州中考题：四边形与全等三角形
- 15 步完整证明动画
- flashAngle ID 匹配修复
- stepAnimations/steps 对齐修复
- SAS 数学逻辑修复（∠ABC 非 ∠A）

## 🔧 进行中

### FEAT-006: 几何动画引擎
- 声明式动画意图 → 自动视觉映射
- 引擎自动推导边、角、三角形
- 不再手动配 stepAnimations JSON
- [规范文档](./docs/GEOMETRY-ENGINE.md)

## 📋 规划中

### FEAT-007: DOM-based QA 框架
- 每步定义 expect schema（元素状态）
- browser agent 执行 JS 读 DOM → 自动对比
- 替代截图 QA，速度快 10x，token 省 30x
- [方法文档](./docs/QA-METHOD.md)

### FEAT-008: 数学题模板
- 从 math-001 提炼通用模板
- 新题目只需填 points + connections + steps
- 支持不同题型（全等、相似、圆、等）

### FEAT-009: 多题目支持
- 题目管理（增删改查）
- 题目难度/标签分类
- 题目搜索

### FEAT-010: 部署与发布
- CI/CD（GitHub Actions）
- 自动部署到 Cloudflare Pages / Vercel
- 无需手动开隧道
