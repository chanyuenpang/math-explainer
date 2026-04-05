# MathExplainer 动画测试规范 v1

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
