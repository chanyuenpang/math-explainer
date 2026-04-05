# MathExplainer 动画测试规范 v2.3.2

## 测试方法（按优先级）

### 方法 1：注入 JS 脚本（首选）✅

**优势：**
- ⚡ 执行速度快（直接在浏览器环境运行）
- ✅ 内置断言（无需外部工具判断）
- 📊 结构化输出（JSON 格式，易于解析）
- 🔧 调试方便（可在 DevTools 直接测试）

**测试流程：**

1. 打开题目页面：`http://localhost:4321/problem/{题目ID}/`
2. 等待 SVG 加载完成（约 2 秒）
3. 注入测试脚本：`e2e/test-animations-injected.js`
   - 方式 A：在 DevTools Console 粘贴脚本内容
   - 方式 B：browser-agent 使用 `page.evaluate(script)`
4. 脚本自动执行（约 20 秒）：
   - 自动遍历所有步骤
   - 检查颜色一致性
   - 检查页面完整性
   - 输出测试结果
5. 读取 console 输出：
   ```json
   {
     "step": 3,
     "type": "pass|error",
     "message": "角A 弧线颜色=#ff0000 有匹配的边"
   }
   ```
6. 汇报结果：
   - PASS: 所有测试通过
   - FAIL: 有 error 类型结果，记录详细信息

**browser-agent 使用示例：**
```javascript
// 1. 读取脚本文件
const script = fs.readFileSync('e2e/test-animations-injected.js', 'utf8');

// 2. 注入到页面
await page.evaluate(script);

// 3. 监听 console 输出
page.on('console', msg => {
  if (msg.text().startsWith('[TEST]')) {
    console.log('测试结果:', msg.text());
  }
});

// 4. 等待测试完成（约 20 秒）
await page.waitForTimeout(20000);
```

### 方法 2：读取 Console 输出（browser-agent）

**适用场景：** browser-agent 执行自动化测试

**流程：**
1. 使用方法 1 注入脚本
2. 监听 `page.on('console')` 事件
3. 过滤 `[TEST]` 前缀的消息
4. 解析 JSON 结果

### 方法 3：CSS Selector（仅必要时）⚠️

**仅用于：** 检查页面元素是否存在

**示例：**
```javascript
// 检查 SVG 是否存在
const svgExists = await page.$('svg') !== null;

// 检查下一步按钮
const nextBtn = await page.$('button:has-text("下一步")');
```

**注意：** 逻辑判断（颜色一致性、状态检查等）应使用注入 JS，不要用 CSS selector

---

## 前置条件

1. 启动 dev server:
   cd /home/yankeeting/.openclaw/workspace/projects/math-explainer && npm run dev
2. 确认 http://localhost:4321 可访问
3. 如果 dev server 已在运行则跳过

## 测试对象

题目列表: math-001, math-002, math-003, math-004, math-005
页面 URL: http://localhost:4321/problem/{题目ID}

## 测试步骤（每道题重复）

Step 1: 打开 http://localhost:4321/problem/{题目ID}
Step 2: 等待页面加载完成，确认 SVG 元素存在（selector: svg）
Step 3: 开启 console.error 监听
Step 4: 找到"下一步"按钮
Step 5: 点击"下一步"，等待 1.5 秒（动画播放）
Step 6: 截图保存到 test-results/{题目ID}-step-{步骤号}.png
Step 7: 重复 Step 5-6 直到没有更多步骤
Step 8: 收集该题目的所有检查结果

## 检查项

### A. JS 错误检查
- 遍历所有步骤期间，console.error 输出为空 → PASS
- 有任何 console.error → FAIL，记录完整错误信息

### B. 页面完整性
- 每一步 SVG 元素存在且可见 → PASS
- SVG 消失或页面空白 → FAIL，记录哪一步

### C. 颜色一致性（核心检查）
对每一步执行：
1. 获取 SVG 中所有 path 元素（弧线），id 以 "bad-" 或 "angle-" 开头
2. 检查每个 path 的 opacity 属性，只检查 opacity > 0 的（当前步骤可见的弧线）
3. 对每个可见弧线：
   a. 从 id 提取角度名: bad-A → A, bad-BCD → BCD, angle-1 → 1
   b. 读取弧线的 stroke 属性值
   c. 在 SVG 中找到该角对应的两条边（line 元素）
   d. 读取边的 stroke 属性值
   e. 断言: 弧线 stroke === 边 stroke
   f. 不一致 → FAIL，记录: 题目ID、步骤号、角度名、弧线颜色、边颜色

### D. 直角符号检查
- 如果有直角符号（rect 或 path 表示直角），确认其颜色和边一致

## 输出格式

```
========================================
题目: math-001
========================================
JS错误: 无 / [错误内容]
页面完整性: PASS / FAIL (步骤X)
颜色一致性: PASS / FAIL

详细检查:
  步骤0: PASS
  步骤1: PASS
  步骤2: FAIL - 角A 弧线=#ff0000 边=#00ff00
  ...

截图: test-results/math-001-step-0.png ~ step-7.png
========================================
```

## 总结格式

```
测试总结:
  总题数: 5
  通过: X
  失败: Y

失败详情:
  - math-00X 步骤X: [具体问题]
```

---

## 🚀 推荐测试方式：注入 JS 脚本（v2 新增）

### 为什么使用注入脚本？

相比 Python + Playwright 或 browser-agent 手动操作，注入 JS 脚本具有明显优势：

| 方式 | 执行速度 | 结果可靠性 | 调试便利性 | 输出结构化 |
|------|----------|------------|------------|------------|
| **注入 JS** | ⚡⚡⚡⚡⚡ | ✅ 最可靠 | ✅ DevTools 直接测试 | ✅ JSON + DOM |
| Python + Playwright | ⚡⚡⚡ | ⚠️ 依赖浏览器驱动 | ⚠️ 需要额外工具 | ✅ JSON |
| browser-agent 手动 | ⚡ | ❌ 不确定性强 | ❌ 难以复现 | ❌ 非结构化 |

### 快速开始

**1. 启动开发服务器**
```bash
cd /home/yankeeting/.openclaw/workspace/projects/math-explainer
npm run dev
```

**2. 在浏览器中打开测试页面**
```
http://localhost:4321/problem/math-001/
```

**3. 注入测试脚本**
- **方式 A（推荐）：在 DevTools Console 粘贴**
  1. 打开 DevTools (F12)
  2. 切换到 Console 标签
  3. 复制 `e2e/test-animations-injected.js` 的全部内容
  4. 粘贴并回车

- **方式 B：通过 browser-agent 的 page.evaluate()**
  ```javascript
  // browser-agent 执行
  const script = fs.readFileSync('e2e/test-animations-injected.js', 'utf8');
  await page.evaluate(script);
  ```

**4. 启动测试**
```javascript
// 在 Console 中执行
window.__testAnimations.run()
```

**5. 读取测试结果**

测试结果会同时输出到：

- **DOM 元素**（browser-agent 可读）
  ```javascript
  const resultsEl = document.getElementById('test-results');
  const report = JSON.parse(resultsEl.getAttribute('data-report'));
  console.log(report);
  ```

- **Console 输出**（便于人工查看）
  - 实时进度日志（`[TEST] 步骤 X...`）
  - 最终 JSON 报告（可直接复制）

### 测试 API

```javascript
// 运行完整测试（自动遍历所有步骤）
window.__testAnimations.run()

// 检查单步（手动模式）
window.__testAnimations.checkStep(3)

// 获取当前测试结果
const results = window.__testAnimations.getResults()

// 重置测试状态
window.__testAnimations.reset()
```

### 输出格式

**DOM 输出示例：**
```html
<div id="test-results" 
     data-status="complete" 
     data-report='{"status":"complete","currentStep":8,"steps":[...]}'">
  <div>测试状态: complete</div>
  <div>当前步骤: 8</div>
  <div>JS错误: 0</div>
  <div>失败步骤: 0</div>
</div>
```

**JSON 报告结构：**
```json
{
  "status": "complete",
  "currentStep": 8,
  "jsErrors": [],
  "steps": [
    {
      "step": 0,
      "status": "PASS",
      "issues": [],
      "timestamp": 1712345678901
    },
    {
      "step": 1,
      "status": "FAIL",
      "issues": [
        {
          "angle": "A",
          "arcColor": "#ff0000",
          "edgeColors": ["#00ff00", "#0000ff"],
          "message": "角A的弧线颜色(#ff0000)与边颜色不匹配"
        }
      ],
      "timestamp": 1712345679901
    }
  ],
  "summary": {
    "totalSteps": 8,
    "passed": 7,
    "failed": 1,
    "jsErrors": 0
  }
}
```

### Browser-Agent 集成示例

**使用 Playwright 读取测试结果：**
```javascript
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 1. 打开测试页面
  await page.goto('http://localhost:4321/problem/math-001/');
  
  // 2. 注入测试脚本
  const script = fs.readFileSync('e2e/test-animations-injected.js', 'utf8');
  await page.evaluate(script);
  
  // 3. 启动测试
  await page.evaluate(() => window.__testAnimations.run());
  
  // 4. 等待测试完成（轮询 data-status）
  await page.waitForFunction(() => {
    const el = document.getElementById('test-results');
    return el && el.getAttribute('data-status').startsWith('complete');
  }, { timeout: 60000 });
  
  // 5. 读取结果
  const report = await page.evaluate(() => {
    const el = document.getElementById('test-results');
    return JSON.parse(el.getAttribute('data-report'));
  });
  
  console.log('测试结果:', report);
  
  await browser.close();
})();
```

### 核心特性

✅ **自动错误监控**
- 捕获 `console.error`
- 捕获未处理异常 `window.onerror`
- 实时记录到 `state.jsErrors`

✅ **颜色一致性检查**
- 自动识别弧线（`path[id^="bad-"], path[id^="angle-"]`)）
- 检查 opacity（只检查可见元素）
- 对比弧线颜色与边颜色
- 支持直角符号检查

✅ **实时 DOM 输出**
- 测试状态实时更新（`data-status`）
- JSON 报告实时写入（`data-report`）
- 可视化面板（便于调试）

✅ **灵活的 API**
- 支持完整测试（`run()`）
- 支持单步检查（`checkStep(n)`）
- 支持状态重置（`reset()`）

---

## 备选测试方式

### 方式 1: Python + Playwright（旧版）

详见 `e2e/test-animations-v3.py`，适合需要截图和复杂报告的场景。

### 方式 2: Browser-Agent 手动测试（旧版）

以下为旧版测试规范，仅作为参考。

---

## 测试执行最佳实践（旧版）

### 注入 JS 脚本测试规范（旧版示例）

**测试脚本文件：** `e2e/test-animations-injected.js`

该脚本实现了基于注入 JS 的自动化测试，相比 browser-agent 手动操作 DOM，具有以下优势：
- ✅ 执行速度更快（直接在页面上下文运行）
- ✅ 结果更可靠（避免浏览器自动化工具的不确定性）
- ✅ 调试更方便（可以直接在 DevTools 中测试）
- ✅ 输出结构化（JSON 格式便于解析）

**使用方式：**
```bash
# 1. 启动 dev server
cd /home/yankeeting/.openclaw/workspace/projects/math-explainer
npm run dev

# 2. 运行注入测试脚本
node e2e/test-animations-injected.js

# 3. 查看测试结果
cat test-results/injected-test-report.json
```

**测试覆盖：**
- ✅ JS 错误监控（自动捕获 console.error）
- ✅ 页面完整性检查（SVG 元素存在性）
- ✅ 颜色一致性验证（弧线与边的颜色匹配）
- ✅ 直角符号检查（如适用）
- ✅ 自动截图（每步保存截图）

**输出文件：**
- `test-results/injected-test-report.json` - 结构化测试报告
- `test-results/{题目ID}-step-{步骤号}.png` - 每步截图

---

### 注入 JS 脚本（优先方式）

对于逻辑检查（颜色一致性、元素状态等），优先注入 JS 脚本到页面中执行，而不是让 browser-agent 手动遍历 DOM。

**颜色一致性检查脚本示例：**
```javascript
// 注入到页面，遍历每一步后执行
const results = [];
document.querySelectorAll('svg path[id^="bad-"]').forEach(arc => {
  const opacity = arc.style.opacity || arc.getAttribute('opacity');
  if (opacity && parseFloat(opacity) > 0) {
    const stroke = arc.getAttribute('stroke') || arc.style.stroke;
    const fill = arc.getAttribute('fill') || arc.style.fill;
    results.push({ id: arc.id, stroke, fill, visible: true });
  }
});
console.log('COLOR_CHECK_RESULT:', JSON.stringify(results));
```

**JS 错误检查脚本示例：**
```javascript
window.__testErrors = [];
const origError = console.error;
console.error = function(...args) {
  window.__testErrors.push(args.join(' '));
  origError.apply(console, args);
};
console.log('ERROR_MONITOR_READY');
```

**元素存在性检查脚本示例：**
```javascript
const svg = document.querySelector('svg');
const svgVisible = svg && window.getComputedStyle(svg).display !== 'none';
const nextBtn = document.querySelector('button');
console.log('PAGE_CHECK:', JSON.stringify({ svgVisible, nextBtnExists: !!nextBtn }));
```

### Browser-Agent 指令规范

1. **先注入监听脚本** — 在开始测试前注入 error monitor
2. **用 JS 断言** — 每步注入检查脚本，读 console.log 返回值
3. **打 log** — 在注入脚本中 console.log 关键信息，browser-agent 能读到
4. **只操作页面时给 selector** — 点击按钮、截图等操作才指定 CSS selector
5. **给超时限制** — 每个操作设定超时时间，避免卡住

### 指令示例

```
1. 打开 http://localhost:4321/math-explainer/problem/math-001/
2. 等待 SVG 加载（selector: svg，超时10秒）
3. 注入 JS: [错误监听脚本]
4. 找到"下一步"按钮并点击（selector: button，超时5秒）
5. 等待 1.5 秒（动画播放）
6. 注入 JS: [颜色检查脚本]，读取 console.log 中的 COLOR_CHECK_RESULT
7. 断言：所有 visible 弧线的 stroke 和 fill 一致
8. 截图保存
9. 重复 4-8 直到没有更多步骤
```
