# E2E 测试脚本使用指南

## 📦 文件说明

| 文件 | 类型 | 用途 | 推荐度 |
|------|------|------|--------|
| `test-animations-injected.js` | 核心脚本 | 注入到页面中执行测试，结果写入 DOM | ⭐⭐⭐⭐⭐ |
| `run-injected-tests.js` | 自动化脚本 | Node.js 批量测试工具 | ⭐⭐⭐⭐⭐ |
| `test-spec.md` | 测试规范 | 完整测试规范和使用说明 | 📖 必读 |
| `test-animations-v3.py` | Python 脚本 | 旧版 Playwright 测试（备选） | ⭐⭐⭐ |

## 🚀 快速开始

### 方式 1：浏览器控制台（最快）

```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器访问
http://localhost:4321/problem/math-001/

# 3. 在 DevTools Console 粘贴 test-animations-injected.js 内容

# 4. 启动测试
window.__testAnimations.run()
```

### 方式 2：Node.js 自动化（推荐）

```bash
# 1. 确保开发服务器运行中
npm run dev

# 2. 运行自动化测试
node e2e/run-injected-tests.js

# 3. 查看结果
cat test-results/injected-test-report.json
```

### 方式 3：Playwright 集成

```javascript
const script = fs.readFileSync('e2e/test-animations-injected.js', 'utf8');
await page.evaluate(script);
await page.evaluate(() => window.__testAnimations.run());

// 读取结果
const report = await page.evaluate(() => {
  const el = document.getElementById('test-results');
  return JSON.parse(el.getAttribute('data-report'));
});
```

## ✨ 核心优势

### 相比 Python + Playwright

| 特性 | 注入 JS | Python |
|------|---------|--------|
| 执行速度 | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ |
| 启动开销 | 无（直接在页面运行） | 需要启动浏览器驱动 |
| 调试体验 | DevTools 直接调试 | 需要额外工具 |
| 依赖 | 无外部依赖 | 需要 Python 环境 |

### 相比 Browser-Agent 手动

| 特性 | 注入 JS | 手动操作 |
|------|---------|----------|
| 可靠性 | ✅ 稳定 | ❌ 不确定性强 |
| 可重复性 | ✅ 100% 可重复 | ❌ 容易出错 |
| 效率 | ⚡ 高效 | 🐌 低效 |
| 结果格式 | ✅ 结构化 JSON | ❌ 非结构化 |

## 📊 输出说明

### DOM 输出

测试结果实时写入 DOM 元素：

```html
<div id="test-results" data-status="complete" data-report="{...}">
```

- `data-status`: 测试状态（ready | running | complete | complete-with-errors）
- `data-report`: JSON 格式的完整测试报告

### JSON 报告结构

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

### Console 输出

测试过程实时输出到控制台：

```
[TEST] 检查步骤 0...
[TEST] 步骤 0 结果: PASS
[TEST] 检查步骤 1...
[TEST] 步骤 1 结果: FAIL
...
[TEST] ========== 测试完成 ==========
[TEST] 总步骤: 8
[TEST] 失败: 1
```

## 🔧 API 接口

注入脚本提供以下 API：

```javascript
// 运行完整测试（自动遍历所有步骤）
window.__testAnimations.run()

// 检查单步（手动模式）
window.__testAnimations.checkStep(stepNumber)

// 获取当前测试结果
const results = window.__testAnimations.getResults()

// 重置测试状态
window.__testAnimations.reset()
```

## 🎯 测试覆盖

✅ **JS 错误监控**
- 自动捕获 `console.error`
- 自动捕获未处理异常
- 记录错误时间和上下文

✅ **页面完整性检查**
- SVG 元素存在性验证
- 每一步自动检查

✅ **颜色一致性验证**（核心）
- 自动识别弧线元素（`path[id^="bad-"], path[id^="angle-"]`）
- 只检查可见元素（opacity > 0）
- 对比弧线颜色与边颜色
- 支持直角符号检查

✅ **实时进度追踪**
- 每步状态实时更新
- 可视化测试面板

## 📝 更新日志

### v2 (2026-04-05)
- ✨ 新增注入式 JS 测试脚本
- ✨ 支持结果直接写入 DOM（browser-agent 可读）
- ✨ 提供 Node.js 自动化运行脚本
- 📖 更新测试规范，优先推荐注入方式
- 🗑️ 标记 Python 脚本为备选方案

### v1 (2026-04-05)
- 🎉 初始版本：Python + Playwright 测试
- ✅ 基础颜色检查
- ✅ 截图功能

## 📚 相关文档

- [完整测试规范](./test-spec.md)
- [核心注入脚本](./test-animations-injected.js)
- [自动化运行脚本](./run-injected-tests.js)
- [旧版 Python 测试](./test-animations-v3.py)

## 🤝 贡献

如有问题或建议，请查看 `test-spec.md` 或联系开发团队。

---

**推荐使用注入 JS 脚本进行测试，效率更高、结果更可靠！** 🚀
