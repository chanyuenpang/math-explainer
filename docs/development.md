# Math Explainer 开发指南

## 1. 项目简介

Math Explainer 是一个动态数学题讲解网站，通过动画演示帮助学生理解数学题目的解题过程。

**技术栈：**
- **Astro** - 静态站点生成器
- **React** - UI 组件库
- **TailwindCSS** - 样式框架
- **GSAP** - 动画引擎
- **KaTeX** - 数学公式渲染

---

## 2. 技术栈与依赖

### 环境要求

- **Node.js** >= 22.12.0

### 主要依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| astro | ^6.1.3 | 静态站点生成 |
| @astrojs/react | ^5.0.2 | Astro React 集成 |
| react | ^19.2.4 | UI 组件 |
| tailwindcss | ^4.2.2 | 样式框架 |
| gsap | ^3.14.2 | 动画引擎 |
| katex | ^0.16.44 | 数学公式渲染 |
| @playwright/test | ^1.59.1 | E2E 测试 |

---

## 3. 完整目录结构

```
math-explainer/
├── .github/workflows/deploy.yml   # CI/CD 部署
├── public/                        # 静态资源
├── src/
│   ├── components/
│   │   ├── GeometryCanvas.tsx    # SVG 几何画布 + GSAP 动画
│   │   └── StepPlayer.tsx        # 步进播放控制器
│   ├── data/problems/            # JSON 题库（新增题目放这里）
│   ├── lib/
│   │   ├── geometry-engine.ts    # 动画引擎（GSAP + Intent 系统）
│   │   ├── topology.ts           # 图形拓扑（边、角、正则化）
│   │   └── problems/
│   │       ├── registry.ts       # 题库加载器（import.meta.glob）
│   │       └── types.ts          # TypeScript 类型定义
│   ├── pages/
│   │   ├── index.astro           # 首页（题库列表）
│   │   ├── problems/index.astro  # 全部题目页（分类筛选）
│   │   └── problem/[id].astro    # 题目详情页（静态生成）
│   └── styles/global.css         # Tailwind v4
├── tests/e2e/                    # Playwright E2E 测试
├── astro.config.mjs
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

### 核心文件说明

| 文件/目录 | 说明 |
|-----------|------|
| `src/components/GeometryCanvas.tsx` | SVG 几何画布组件，负责图形渲染和 GSAP 动画 |
| `src/components/StepPlayer.tsx` | 步进播放控制器，控制题目讲解的步骤播放 |
| `src/lib/geometry-engine.ts` | 动画引擎核心，基于 GSAP + Intent 系统 |
| `src/lib/topology.ts` | 图形拓扑工具，处理边、角、正则化等几何计算 |
| `src/lib/problems/registry.ts` | 题库加载器，使用 `import.meta.glob` 动态加载 JSON |
| `src/lib/problems/types.ts` | TypeScript 类型定义，定义 Problem 等核心类型 |
| `src/data/problems/` | JSON 题库存放目录，新增题目在此创建 |

---

## 4. 开发命令

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
npm run dev
```

访问地址：http://localhost:4321/math-explainer

### 构建生产版本

```bash
npm run build
```

构建输出目录：`./dist/`

### 本地预览

```bash
npm run preview
```

预览构建后的生产版本。

### 运行 E2E 测试

```bash
# 先构建项目
npm run build

# 运行测试
npx playwright test
```

### Playwright UI 模式

```bash
npx playwright test --ui
```

打开 Playwright 的交互式测试界面，方便调试测试用例。

---

## 5. 部署

### 线上地址

https://chanyuenpang.github.io/math-explainer/

### 部署流程

1. **触发条件**：推送到 `master` 分支
2. **自动部署**：GitHub Actions 自动执行
3. **配置文件**：`.github/workflows/deploy.yml`

### 部署步骤

```bash
# 1. 确保代码已提交
git add .
git commit -m "描述你的修改"

# 2. 推送到 master 分支
git push origin master

# 3. GitHub Actions 自动构建和部署
# 可在 GitHub 仓库的 Actions 标签页查看部署进度
```

---

## 6. 如何新增题目

### 步骤

1. 在 `src/data/problems/` 目录下创建新的 JSON 文件
2. 文件名建议使用题目编号或描述性名称，如 `problem-001.json`
3. 参考 `src/lib/problems/types.ts` 中的 `Problem` 类型定义填写字段

### 示例

```json
{
  "id": "problem-001",
  "title": "题目标题",
  "category": "几何",
  "difficulty": "中等",
  "steps": [
    {
      "description": "步骤描述",
      "animation": {
        "type": "highlight",
        "target": "line-AB"
      }
    }
  ]
}
```

### 类型定义参考

详细的 `Problem` 类型定义请查看 `src/lib/problems/types.ts` 文件。

---

## 常见问题

### Q: 开发服务器启动失败？

检查 Node.js 版本是否符合要求（>= 22.12.0）：

```bash
node --version
```

### Q: 构建后样式不生效？

Tailwind v4 需要确保 `src/styles/global.css` 中正确导入了 Tailwind：

```css
@import "tailwindcss";
```

### Q: 动画不流畅？

检查 GSAP 动画配置，确保没有重复创建动画实例。

---

## 相关链接

- [Astro 文档](https://docs.astro.build/)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [GSAP 文档](https://gsap.com/docs/)
- [KaTeX 文档](https://katex.org/docs/)
- [Playwright 文档](https://playwright.dev/)
