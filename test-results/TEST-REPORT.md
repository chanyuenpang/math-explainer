# MathExplainer 动画测试报告

**测试时间**: 2026-04-05 12:10  
**测试模式**: Production Preview (npm run build + npm run preview)  
**浏览器**: Chromium Headless (Playwright)  
**视口**: 1280×800

---

## 前置说明

由于 `astro dev` 模式下存在 `@vitejs/plugin-react can't detect preamble` 错误导致 React 组件无法渲染，本次测试改用 `npm run build && npm run preview` 的 production 模式执行。Production build 成功，React 组件正常渲染。

---

## 测试总结

```
测试总结:
  总题数: 5
  通过: 0
  失败: 5
```

---

## 各题目详细结果

### math-001: 四边形与全等三角形
```
========================================
题目: math-001
========================================
JS错误: 有 (请求 /math-explainerundefined → 404)
页面完整性: PASS (15步全部 SVG 可见)
颜色一致性: FAIL

步骤数: 15 (步骤0 ~ 步骤14)

颜色问题 (所有步骤):
  - 角A-fill: 弧线 fill=#f59e0b (橙色), 但无任何边的颜色匹配
  - 角BCD-fill: 弧线 fill=#f59e0b, 同上
  - 角ABC-fill: 弧线 fill=#f59e0b, 同上
  - 角ADC-fill: 弧线 fill=#f59e0b, 同上
  - 角EDC-fill: 弧线 fill=#f59e0b, 同上

说明: 弧线使用 fill 着色(#f59e0b 橙色), 而非 stroke。这些弧线的 fill 颜色
      与任何可见边的 stroke 颜色都不一致。初始状态下边颜色只有 #D1D5DB(灰)
      和 #374151(深灰), 步骤3、5中增加了 #EF4444(红)和 #10B981(绿)。

截图: test-results/math-001-step-0.png ~ step-14.png
========================================
```

### math-002: ✅ 唯一颜色 PASS 的题目
```
========================================
题目: math-002
========================================
JS错误: 有 (请求 /math-explainerundefined → 404)
页面完整性: PASS (3步全部 SVG 可见)
颜色一致性: PASS

步骤数: 3 (步骤0 ~ 步骤2)

说明: 此题弧线颜色与边颜色保持一致,所有检查通过。

截图: test-results/math-002-step-0.png ~ step-2.png
========================================
```

### math-003
```
========================================
题目: math-003
========================================
JS错误: 有 (请求 /math-explainerundefined → 404)
页面完整性: PASS (8步全部 SVG 可见)
颜色一致性: FAIL

步骤数: 8 (步骤0 ~ 步骤7)

颜色问题 (所有步骤):
  - 角BAC-fill: 弧线 fill=#f59e0b, 无匹配边
  - 角EDC-fill: 弧线 fill=#f59e0b, 无匹配边

说明: 与 math-001 相同的模式, 弧线使用固定橙色 fill 而非与边匹配的颜色。

截图: test-results/math-003-step-0.png ~ step-7.png
========================================
```

### math-004
```
========================================
题目: math-004
========================================
JS错误: 有 (请求 /math-explainerundefined → 404)
页面完整性: PASS (8步全部 SVG 可见)
颜色一致性: FAIL

步骤数: 8 (步骤0 ~ 步骤7)

颜色问题 (所有步骤):
  - 角1-fill: 弧线 fill=#f59e0b, 无匹配边
  - 角2-fill: 弧线 fill=#f59e0b, 无匹配边
  - 角3-fill: 弧线 fill=#f59e0b, 无匹配边

说明: 同样的固定橙色弧线问题。

截图: test-results/math-004-step-0.png ~ step-7.png
========================================
```

### math-005
```
========================================
题目: math-005
========================================
JS错误: 有 (请求 /math-explainerundefined → 404)
页面完整性: PASS (10步全部 SVG 可见)
颜色一致性: FAIL

步骤数: 10 (步骤0 ~ 步骤9)

颜色问题 (所有步骤):
  - 角B-fill: 弧线 fill=#f59e0b, 无匹配边
  - 角C-fill: 弧线 fill=#f59e0b, 无匹配边
  - 角BAD-fill: 弧线 fill=#f59e0b, 无匹配边
  - 角DAC-fill: 弧线 fill=#f59e0b, 无匹配边

说明: 同样的固定橙色弧线问题。

截图: test-results/math-005-step-0.png ~ step-9.png
========================================
```

---

## 发现的问题汇总

### 🔴 问题1: 弧线颜色不跟随边颜色 (4/5 题目受影响)

**严重程度**: 高  
**影响范围**: math-001, math-003, math-004, math-005  
**问题描述**: 角度弧线 (id 以 `bad-` 或 `angle-` 开头的 path 元素) 使用固定的 `fill=#f59e0b` (橙色) 着色, 没有跟随对应边的 stroke 颜色变化。当动画将边标记为不同颜色 (如红色=#EF4444, 绿色=#10B981, 蓝色=#2563EB) 时, 弧线仍保持橙色, 导致视觉不一致。  
**数学预期**: 标记某角时, 弧线颜色应该与构成该角的两条边的颜色一致。

### 🟡 问题2: JS 404 错误 - undefined URL 拼接 (5/5 题目)

**严重程度**: 中  
**影响范围**: 所有题目  
**问题描述**: 页面会请求 `http://localhost:4321/math-explainerundefined`, 返回 404。这表明某处代码中存在 `undefined` 变量被拼接到 URL 路径中的 bug。可能原因: 某些可选属性 (如 `problem?.image`) 在某些情况下为 `undefined`, 被直接用于模板字符串拼接。  
**具体位置**: `[id].astro` 中有 `/math-explainer${problem?.image}` 这样的模板, 如果 `problem.image` 为 undefined, 就会产生 `/math-explainerundefined`。

### 🟢 正面发现: 页面完整性和动画播放正常

- 所有 5 道题的 SVG 在所有步骤中都正常显示, 无页面空白或崩溃
- "下一步"按钮正常工作, 步骤切换流畅
- 动画播放正常 (GSAP), 无视觉卡顿
- math-002 的颜色一致性完全正确

---

## 截图清单

| 题目 | 截图数量 | 文件范围 |
|------|---------|---------|
| math-001 | 15 | step-0 ~ step-14 |
| math-002 | 3 | step-0 ~ step-2 |
| math-003 | 8 | step-0 ~ step-7 |
| math-004 | 8 | step-0 ~ step-7 |
| math-005 | 10 | step-0 ~ step-9 |
| **总计** | **44** | |

所有截图保存在: `test-results/`

---

## 测试脚本

- 最终测试脚本: `e2e/test-animations-v3.py`
- 调试脚本: `e2e/debug-page.py`, `e2e/debug-network.py`, `e2e/debug-deep.py`
