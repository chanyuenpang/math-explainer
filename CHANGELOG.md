# Changelog

## [2.3.0] - 2026-04-05

### Added
- **proveCongruent 意图**：三角形全等高级可视化动画
  - 支持配置 SAS、SSS、ASA、AAS、HL 全等判定方法
  - 自动颜色分配：每个 pair 使用不同颜色（边和角分别高亮）
  - 同一 pair 中的元素使用相同颜色表示对应关系
  - 最后填充两个三角形显示全等结论
- **showAngle 方法增强**：支持传入颜色参数
- **problem.schema.json 扩展**：新增 proveCongruent 字段定义

### Changed
- **math-003.json**：使用 proveCongruent 意图重写步骤 6 和 7
- **版本号**：从 2.2.4 升级到 2.3.0

## [Unreleased]

### Added
- 几何动画引擎规范文档 (docs/GEOMETRY-ENGINE.md)
- QA 测试方法文档 (docs/QA-METHOD.md)
- 项目文档 (docs/PROJECT.md, docs/REFACTOR.md)
- GitHub 私有仓库: chanyuenpang/math-explainer
- Cloudflare Pages 自动部署 (Git Integration)
- 公开地址: https://cloudflare-workers-autoconfig-math-explainer.chanyuenpang.workers.dev/

### Fixed
- flashAngle ID 不匹配问题（使用 arc ID 后缀如 BCD、ABC）
- stepAnimations 和 steps 数组错位（16 条 → 15 条）
- 步骤 13/14 SAS 数学逻辑错误（∠ABC 非 ∠A）
- arc-BCD 直角标记坐标错误（C 点位置修正）
- fillTriangle 支持数组（同时填充多个三角形）
- flashAngle 自动高亮构成角的两条边
- GSAP 动画持久化（高亮不回退）
- Vite allowedHosts 配置（支持外网域名）

### Changed
- 拓扑层重构：edges 数组 → connections 自动推导
- cloudflared 安装到 ~/bin（v2026.3.0，--protocol http2）

## [0.1.0] - 2026-04-02
### Added
- 初始项目搭建（Astro + React）
- GeometryCanvas 组件
- math-001 题目数据
- GSAP 分步动画系统
- topology.ts 拓扑层
