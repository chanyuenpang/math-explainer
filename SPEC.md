# MathExplainer - 动态数学题讲解网站 SPEC

## 项目概述

一个动态数学题讲解网站，用户通过飞书发送数学题图片，系统自动生成带逐步讲解动画的网页。

## 核心需求

### 用户故事
1. **学生**：打开网站，浏览题目列表，点击进入查看动态讲解
2. **内容创作者（Yop）**：通过飞书发送题目图片，AI 解析题目内容，生成讲解动画
3. **浏览者**：通过链接直接访问某道题的讲解页面

### 功能模块

#### 1. 题目管理
- 题目列表页：展示所有题目（缩略图 + 标题 + 难度标签）
- 题目详情页：动态讲解动画 + 题目原文
- 新增题目：通过飞书图片或手动输入

#### 2. 数学渲染
- 支持数学公式渲染（LaTeX / KaTeX）
- 支持几何图形（SVG / Canvas）
- 支持坐标系、函数图像

#### 3. 动态讲解引擎
- 逐步展示解题过程（步骤式动画）
- 每步包含：文字说明 + 对应公式/图形变化
- 播放控制：播放/暂停/上一步/下一步/重播
- 动画速度调节

#### 4. 飞书集成
- 接收飞书消息中的图片
- AI 识别题目内容（OCR + 数学理解）
- 自动生成讲解步骤数据
- 回复链接给用户

## 技术选型（建议）

| 层面 | 技术 | 理由 |
|------|------|------|
| 前端框架 | Next.js / Nuxt | SSR + 静态导出，SEO 友好 |
| 数学渲染 | KaTeX | 轻量、快速、支持 LaTeX |
| 动画引擎 | CSS Animation + GSAP | 流畅的逐步动画 |
| 几何图形 | JSXGraph / GeoGebra | 动态几何作图 |
| 样式 | Tailwind CSS | 快速开发 |
| 数据存储 | JSON 文件 / Markdown | 轻量，每道题一个文件 |
| 部署 | Vercel / 静态托管 | 免费、快速 |

## 题目数据结构

```json
{
  "id": "math-001",
  "title": "二次函数求最值",
  "difficulty": "medium",
  "tags": ["二次函数", "最值"],
  "source_image": "problems/math-001.png",
  "question": {
    "text": "已知 f(x) = -x² + 4x + 1，求 f(x) 的最大值",
    "latex": "f(x) = -x^2 + 4x + 1"
  },
  "steps": [
    {
      "order": 1,
      "title": "识别函数类型",
      "content": "这是一个二次函数，开口向下（a = -1 < 0）",
      "animation": {
        "type": "highlight",
        "target": "formula"
      }
    },
    {
      "order": 2,
      "title": "求顶点坐标",
      "content": "顶点 x = -b/(2a) = -4/(2×(-1)) = 2",
      "latex": "x = -\\frac{b}{2a} = -\\frac{4}{2 \\times (-1)} = 2",
      "animation": {
        "type": "formula_step",
        "target": "derivation"
      }
    },
    {
      "order": 3,
      "title": "计算最大值",
      "content": "f(2) = -(2)² + 4×2 + 1 = -4 + 8 + 1 = 5",
      "latex": "f(2) = -(2)^2 + 4 \\times 2 + 1 = 5",
      "animation": {
        "type": "formula_step",
        "target": "result"
      }
    }
  ],
  "created_at": "2026-04-02T16:30:00+08:00"
}
```

## 目录结构

```
math-explainer/
├── SPEC.md              # 项目规格文档
├── src/
│   ├── components/      # UI 组件（播放器、公式渲染器等）
│   ├── pages/           # 页面（首页、题目详情、新增题目）
│   ├── engine/          # 讲解动画引擎
│   ├── utils/           # 工具函数（LaTeX 解析等）
│   └── styles/          # 样式文件
├── public/
│   └── problems/        # 题目图片素材
└── docs/                # 开发文档
```

## 开发阶段

### Phase 1: MVP
- 静态题目页面，手动编写题目数据
- 基础公式渲染（KaTeX）
- 逐步播放讲解动画

### Phase 2: 题目管理
- 题目列表页
- 新增题目（手动输入）

### Phase 3: AI 集成
- 飞书图片识别
- AI 自动生成讲解步骤

### Phase 4: 增强
- 几何图形动画
- 函数图像绘制
- 多种题型模板

## 约束
- 纯前端实现，优先考虑静态部署
- 每道题独立一个 JSON 数据文件
- 动画性能优先（60fps）
- 移动端适配
