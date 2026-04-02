# MathExplainer 动画脚本 v4 - 方法论升级版

## 设计原则（必须遵守！）

1. **图文严格对应** — 文字提到的每个元素，图上必须有对应的视觉标注
2. **一步一动作** — 每步只做一个动作（画一条边/高亮一个角/移动一个元素）
3. **渐进式显示** — 只显示当前需要的标注，不要信息过载
4. **移动重叠证明相等** — 证明AB=DE：把AB边"移动"到DE上重叠；证明全等：把△ABC整个移过去重叠
5. **颜色区分归属** — 红色=△ABC，绿色=△EDC，橙色=过渡

---

## 动画流程（重新设计）

### 基础图形绘制（步骤0-1）

**Step 0：绘制四边形**
- 动画：依次绘制 A→B→C→D→A 边，每条边0.3s淡入
- 标注：A点画直角，C点画直角
- 标注：BC和CD中间画≡（相等），用小号文字
- 文字：四边形ABCD，∠A=90°，∠BCD=90°，BC=DC

**Step 1：延伸E点**
- 动画：D→E 边绘制（虚线变实线）
- 标注：A、D、E三点标注
- 文字：E在AD延长线上，DE=AB

---

### 第一问：证明∠ABC = ∠EDC（步骤2-5）

**Step 2：高亮∠A**
- 动画：A点直角标记闪烁（橙色3次）
- 文字：∠A = 90°

**Step 3：高亮∠BCD**
- 动画：恢复Step2 → C点直角标记闪烁（橙色3次）
- 文字：∠BCD = 90°

**Step 4：显示∠ABC弧线**
- 动画：在B点画∠ABC弧线（红色，1/4圆）
- 文字：标注∠ABC

**Step 5：显示∠EDC弧线**（这是关键！）
- 动画：等等，先显示∠ADC弧线作为过渡
- 在D点画∠ADC弧线（橙色）
- 文字：∵ A、D、E共线，∴ ∠ADC + ∠CDE = 180°
- 然后显示∠CDE弧线（绿色）
- 最后同时高亮∠ABC和∠CDE弧线（橙色+绿色）
- 文字：∴ ∠ABC = ∠EDC ✓

---

### 第二问：证明全等（步骤6-10）

**Step 6：显示△ABC**
- 动画：在图形左侧绘制虚线框出△ABC区域，填充淡红色
- 文字：这是△ABC

**Step 7：显示△EDC**
- 动画：在图形右侧绘制虚线框出△EDC区域，填充淡绿色
- 文字：这是△EDC

**Step 8：证明AB=DE（关键改进！）**
- 动画：**移动重叠**
  - AB边变成虚线轮廓
  - 虚线轮廓从原位置"移动"到DE位置
  - 与DE完全重叠
- 文字：AB = DE（已知），把AB移到DE上对比

**Step 9：证明BC=DC**
- 动画：**移动重叠**
  - BC边变成虚线轮廓
  - 移动到DC位置，重叠
- 文字：BC = DC（已知）

**Step 10：证明∠A=∠EDC**
- 动画：∠A弧线（红色）闪烁 → ∠EDC弧线（绿色）闪烁
- 文字：∠A = 90° = ∠EDC

---

### 结论（步骤11）

**Step 11：全等动画**
- 动画：整个△ABC（红色区域+边框）移动到△EDC位置
- 旋转180°（或平移）后完全重叠
- 文字：SAS三组条件全部满足
- 结论：△ABC ≌ △EDC 证毕！🎉

---

## 关键技术实现

### 移动重叠动画

```tsx
// 边移动重叠
function animateEdgeMove(edgeId: string, fromPoints: Point[], toPoints: Point[]) {
  const edge = document.getElementById(edgeId);
  // 1. 把边变成虚线
  gsap.to(edge, { strokeDasharray: "5,5", duration: 0.3 });
  // 2. 计算起点到终点的位移
  const dx = toPoints[1].x - fromPoints[1].x;
  const dy = toPoints[1].y - fromPoints[1].y;
  // 3. 移动到目标位置
  gsap.to(edge, { x: dx, y: dy, duration: 1, ease: "power2.inOut" });
  // 4. 变成实线显示重合
  gsap.to(edge, { strokeDasharray: "0", duration: 0.3, delay: 1 });
}
```

### 角度弧线只画内角

```tsx
function renderInnerAngleArc(vertex: Point, from: Point, to: Point, color: string) {
  // 计算从vertex到from和to的角度
  // 确保画的是两条边之间的内角，不是外角
  // 用叉积判断方向
}
```

### 颜色方案

```
默认边：#D1D5DB（浅灰）
高亮边：#3B82F6（亮蓝）+ 闪烁
△ABC相关：#EF4444（红）
△EDC相关：#10B981（绿）
∠相关：#F59E0B（橙）
```

---

## 待开发项

### [TODO-001] 角度弧线通用算法修复
- **优先级**: medium
- **说明**: 当前使用硬编码路径绘制角度弧线，需要修好通用算法
- **验收标准**: 
  - 通用算法能正确计算任意三点构成的角的内角弧线
  - 添加单元测试：输入顶点和两个方向点 → 验证弧线端点在正确方向
  - 所有角度必须画内角（≤180°），不能画外角
  - 替换掉当前所有硬编码 path
- **预计工作量**: 2-3小时

### [TODO-002] 声明式动画配置系统
- **优先级**: high
- **说明**: 当前手写 stepAnimations JSON 容易出错（ID不匹配、索引错位、同类步骤不统一）
- **目标**: 用意图描述代替手动配置
- **方案**:
  - 定义动画动作类型：showAngle, showEqual, drawEdge, flyoutCompare, fillTriangle, moveEdge, moveTriangle 等
  - 每种动作自动映射到模板，生成正确的 stepAnimations
  - 自动验证 ID 是否存在
- **示例**:
  ```json
  {"action": "showAngle", "angle": "A"}
  → 自动生成: {"drawArcs": ["arc-A"], "flashAngle": ["A"], "highlightEdges": ["AB", "DA"]}
  ```
- **验收标准**: 新增题目时不需要手写 stepAnimations，只需描述意图

### [TODO-003] 配置验证工具
- **优先级**: high
- **说明**: stepAnimations 中引用的边 ID / 弧线 ID 可能不存在，querySelector 静默失败
- **目标**: 构建时自动检测配置错误
- **方案**:
  - 构建脚本验证所有 stepAnimations 中的 ID 在 edges/angleArcs 中存在
  - 不存在则构建报错
  - 运行时 querySelector 返回 null 则 console.warn
- **验收标准**: ID 写错时能在构建阶段发现，不会到线上才发现

### [TODO-004] 边 ID 双向注册
- **优先级**: medium
- **说明**: edges 定义 id="DA" 但动画配置习惯写 "AD"，导致不匹配
- **方案**: 渲染时为每条边同时注册两个方向（AD 和 DA），或统一按字母序命名
- **验收标准**: 无论写 AD 还是 DA 都能找到同一条边

### [TODO-005] 动画预览/测试工具
- **优先级**: medium
- **说明**: 每次改完只能手动在手机上看效果，效率低
- **方案**:
  - 开发模式下添加步骤快进按钮（直接跳到某一步）
  - 自动截图对比每步的预期效果
  - 或者录制每步动画为 GIF 方便审查
- **验收标准**: 不需要手动点每一步就能看到所有步骤的效果

### [TODO-006] 题目模板系统
- **优先级**: medium
- **说明**: 新增题目时需要从零配置 geometry、steps、stepAnimations
- **方案**: 按题型（全等三角形、相似三角形、圆、函数等）创建模板，只需填入具体数据
- **验收标准**: 新增同类型题目只需10分钟配置
