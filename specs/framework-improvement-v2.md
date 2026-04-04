# MathExplainer 框架改进 Spec v2.0

## 目标
建立可靠的开发基建，确保引擎改动不出错，新题目制作零门槛。

---

## Phase 1: E2E 自动化测试（最高优先级）

### 1.1 测试框架搭建
- 使用 Vitest + jsdom 环境
- 安装依赖：vitest, jsdom, @testing-library/react
- 配置 vitest.config.ts

### 1.2 引擎单元测试
文件：src/lib/__tests__/geometry-engine.test.ts

测试用例：
```
describe('ColorContext')
  - 每个步骤开始时颜色重置
  - 同一元素在同一步骤中获得相同颜色
  - 不同元素获得不同颜色
  - 颜色循环（超过5个元素时从第1个颜色重新开始）

describe('showAngle')
  - 弧线颜色和边颜色一致
  - 直角符号颜色和边颜色一致
  - 多个角在同一时获得不同颜色

describe('flyoutCompare')
  - 两条边获得不同颜色
  - 飞出动画正确创建

describe('convertStepAnimationToIntents')
  - flashAngle 正确转换为 showAngle
  - drawArcs + flashAngle 合并处理
  - highlightArcs + flashAngle 合并处理
```

### 1.3 快照测试
文件：src/lib/__tests__/snapshots.test.ts

- 对 math-001 和 math-002 的每一步生成 intent 快照
- 引擎改动后自动对比，发现不一致立即报错

### 1.4 完成标准
- npm test 全部通过
- 覆盖所有意图类型
- CI 集成（GitHub Actions 每次 push 自动跑）

---

## Phase 2: JSON Schema 校验

### 2.1 Schema 定义
文件：src/schemas/step-animation.schema.json

定义所有 stepAnimation 字段的类型和约束：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "drawEdge": { "$ref": "#/$defs/stringOrArray" },
    "drawArcs": { "type": "array", "items": { "type": "string" } },
    "flashAngle": {
      "oneOf": [
        { "type": "array", "items": { "type": "string" } },
        { "type": "array", "items": { 
          "type": "object",
          "properties": { "angle": { "type": "string" } },
          "required": ["angle"]
        }}
      ]
    },
    "flyoutCompare": { "type": "array" },
    "showRightAngles": { "type": "array" },
    "highlightEdges": { "type": "array" },
    "highlightArcs": { "type": "array" },
    "fillTriangle": { "$ref": "#/$defs/stringOrArray" },
    "flashTriangle": { "$ref": "#/$defs/stringOrArray" },
    "moveEdge": { "type": "string" },
    "targetEdge": { "type": "string" }
  },
  "additionalProperties": false
}
```

### 2.2 构建时校验
- 在 Astro 构建时校验所有 JSON 配置
- 校验失败 → 构建失败 → 立即发现问题

### 2.3 完成标准
- 故意写错配置 → 构建报错
- 正确配置 → 构建通过

---

## Phase 3: 意图系统完善

### 3.1 新增高级意图
```typescript
type IntentType = 
  // 现有
  | 'showAngle' | 'showAngles'
  | 'highlightEdge' | 'highlightEdges'
  | 'drawArc' | 'drawArcs'
  | 'drawEdge' | 'drawEdges'
  | 'hideEdge' | 'hideEdges'
  | 'flyoutCompare'
  | 'moveEdge' | 'moveTriangle'
  | 'fillTriangle' | 'fillTriangles'
  | 'showRightAngle' | 'showRightAngles'
  | 'highlights'
  // 新增
  | 'compareEdges'    // 对比两条边（高亮+飞出）
  | 'compareAngles'   // 对比两个角（高亮弧线+边）
  | 'showEqualMark'   // 显示等号标记
  | 'animateProof'    // 自动证明动画序列
```

### 3.2 compareEdges
一个意图完成两条边的对比：
- 自动分配颜色
- 高亮两条边
- 执行飞出动画
- 显示等号

### 3.3 compareAngles
一个意图完成两个角的对比：
- 自动分配颜色
- 高亮弧线+边
- 闪烁动画

### 3.4 完成标准
- math-001 的配置用新意图重写，更简洁
- 所有测试通过

---

## Phase 4: 步骤动画编排器（UI）

### 4.1 功能
- 可视化编辑步骤动画
- 拖拽排序步骤
- 实时预览动画效果
- 导出 JSON 配置

### 4.2 技术方案
- React 组件，嵌入 Astro 页面
- 左侧步骤列表，右侧画布预览
- /admin 路由，开发模式可用

### 4.3 完成标准
- 能可视化创建一个完整题目
- 导出的 JSON 能直接被引擎使用

---

## Phase 5: 飞书集成闭环

### 5.1 流程
1. 飞书发图片 → OCR 识别题目文字
2. AI 分析几何图形结构（点、边、角）
3. 自动生成 JSON 配置
4. 用户确认后渲染动画

### 5.2 技术方案
- 飞书图片消息 → OpenClaw → Vision Agent 分析
- LLM 生成 JSON 配置
- 自动提交到仓库

### 5.3 完成标准
- 发一张几何题图片 → 1分钟内生成可播放动画

---

## 实施时间线

| Phase | 预计工时 | 依赖 |
|-------|---------|------|
| Phase 1 | 2-3小时 | 无 |
| Phase 2 | 1小时 | Phase 1 |
| Phase 3 | 2小时 | Phase 1, 2 |
| Phase 4 | 4-6小时 | Phase 1, 2, 3 |
| Phase 5 | 3-4小时 | Phase 4 |

## 版本规划

| 版本 | 内容 |
|------|------|
| v2.1.0 | Phase 1 + 2 |
| v2.2.0 | Phase 3 |
| v3.0.0 | Phase 4 + 5 |
