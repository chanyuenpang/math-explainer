# MathExplainer 项目上下文

> 本文档是工程师小龙虾的上下文恢复文档，每次 session 开始时先读这个。

## 项目位置
- **路径**: `/home/yankeeting/.openclaw/workspace/projects/math-explainer`
- **版本**: v2026.04.03-0218 (14 commits)

## 技术栈
- Astro 6.1.3 + React 19.2.4
- GSAP 3.14.2 (动画)
- KaTeX 0.16.44 (数学公式)
- Tailwind CSS 4.2.2

## 项目结构
```
src/
├── components/
│   ├── GeometryCanvas.tsx  # 核心：SVG 几何渲染 + GSAP 动画引擎 (500+ 行)
│   ├── StepPlayer.tsx      # 步骤播放控制
│   └── Latex.tsx           # KaTeX 渲染封装
├── pages/
│   ├── index.astro         # 首页：题目列表
│   └── problem/[id].astro  # 动态详情页
└── styles/global.css

public/problems/
└── math-001.json           # 唯一测试题：几何证明题
```

## 当前状态
- **阶段**: Phase 1 (MVP)
- **完成功能**: 题目列表、详情页、8步动画播放器、KaTeX渲染、移动端适配
- **待做**: 飞书集成、AI解析、部署
- **测试题目**: 1道 (math-001 - 几何证明)

## 核心问题 (需要重构)
当前架构硬编码严重：
- edges/angleArcs/stepAnimations 手动配置
- 角到边关系靠手动对 from/to
- 边方向不识别 (AB ≠ BA)
- 需要拓扑层自动推导

## 下一步
1. 拓扑层重构 (TODO-002)
2. 继续开发新题目
3. 飞书集成

## Git
- `git log --oneline -20` 查看最近提交
- 当前分支: master
