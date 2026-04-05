/**
 * MathExplainer 动画测试脚本 - 注入版
 * 
 * 用途：注入到页面中自动执行颜色一致性测试，结果写入 DOM 供 browser-agent 读取
 * 优势：
 *   - ✅ 执行速度快（直接在页面上下文运行）
 *   - ✅ 结果可靠（避免浏览器自动化的不确定性）
 *   - ✅ 调试方便（可在 DevTools 中直接测试）
 *   - ✅ 输出结构化（JSON 格式便于解析）
 * 
 * 使用方法：
 *   1. 在浏览器控制台粘贴整个脚本
 *   2. 或通过 browser-agent 的 page.evaluate() 注入
 *   3. 脚本自动运行并监听"下一步"按钮
 *   4. 测试结果实时写入 <div id="test-results">
 *   5. browser-agent 读取该元素获取结果
 * 
 * 输出位置：
 *   - DOM: <div id="test-results" data-status="running|complete" data-report="...">
 *   - Console: 定期输出进度信息
 */

(function() {
  'use strict';

  // ==================== 配置 ====================
  const CONFIG = {
    resultElementId: 'test-results',
    animationDelay: 1800, // 每步动画等待时间（ms）
    maxSteps: 26,         // 最大步骤数
    debug: true           // 是否输出调试信息
  };

  // ==================== 测试状态 ====================
  const state = {
    currentStep: 0,
    jsErrors: [],
    steps: [],
    isRunning: false
  };

  // ==================== 工具函数 ====================
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[TEST]', ...args);
    }
  }

  function error(...args) {
    console.error('[TEST ERROR]', ...args);
    state.jsErrors.push({
      type: 'error',
      text: args.join(' '),
      timestamp: Date.now()
    });
  }

  // 更新 DOM 结果
  function updateResults(status, extra = {}) {
    let resultEl = document.getElementById(CONFIG.resultElementId);
    
    if (!resultEl) {
      resultEl = document.createElement('div');
      resultEl.id = CONFIG.resultElementId;
      resultEl.style.cssText = 'position:fixed;top:0;right:0;background:#fff;border:2px solid #333;padding:10px;z-index:9999;max-width:400px;max-height:300px;overflow:auto;font-size:12px;font-family:monospace;';
      document.body.appendChild(resultEl);
    }

    const report = {
      status,
      currentStep: state.currentStep,
      totalSteps: state.steps.length,
      jsErrors: state.jsErrors,
      steps: state.steps,
      timestamp: new Date().toISOString(),
      ...extra
    };

    resultEl.setAttribute('data-status', status);
    resultEl.setAttribute('data-report', JSON.stringify(report));
    
    // 可视化显示（便于调试）
    const statusColor = status === 'complete' ? '#4CAF50' : 
                        status === 'running' ? '#2196F3' : '#f44336';
    resultEl.innerHTML = `
      <div style="font-weight:bold;margin-bottom:5px;color:${statusColor}">
        测试状态: ${status}
      </div>
      <div>当前步骤: ${state.currentStep}</div>
      <div>JS错误: ${state.jsErrors.length}</div>
      <div>失败步骤: ${state.steps.filter(s => s.status === 'FAIL').length}</div>
      <hr style="margin:5px 0">
      <div style="font-size:10px;color:#666">
        详细报告见 data-report 属性
      </div>
    `;
  }

  // ==================== 核心检查逻辑 ====================
  
  // 颜色一致性检查（精简版）
  function checkColorConsistency() {
    const issues = [];
    const svg = document.querySelector('svg');
    
    if (!svg) {
      return issues;
    }

    // 1. 收集所有可见边的颜色
    const edgeColors = new Set();
    svg.querySelectorAll('line').forEach(line => {
      const opacity = parseFloat(line.getAttribute('opacity') || '1');
      if (opacity > 0) {
        const stroke = line.getAttribute('stroke');
        if (stroke && stroke !== 'none') {
          edgeColors.add(stroke.toLowerCase());
        }
      }
    });

    // 2. 检查弧线颜色（id 以 bad- 或 angle- 开头）
    svg.querySelectorAll('path[id^="bad-"], path[id^="angle-"]').forEach(arc => {
      const opacity = parseFloat(arc.getAttribute('opacity') || '1');
      if (opacity <= 0) return;

      const arcId = arc.id;
      const arcStroke = (arc.getAttribute('stroke') || '').toLowerCase();
      const arcFill = (arc.getAttribute('fill') || '').toLowerCase();

      // 提取角度名
      const angleName = arcId.replace(/^(bad-|angle-)/, '');
      if (!angleName) return;

      // 确定弧线的显示颜色（stroke 优先，否则 fill）
      let arcColor = '';
      if (arcStroke && arcStroke !== 'none') {
        arcColor = arcStroke;
      } else if (arcFill && arcFill !== 'none') {
        arcColor = arcFill;
      }

      // 如果弧线有颜色，检查是否与边颜色匹配
      if (arcColor && !edgeColors.has(arcColor)) {
        issues.push({
          angle: angleName,
          arcId: arcId,
          arcColor: arcColor,
          edgeColors: Array.from(edgeColors),
          message: `角${angleName}的弧线颜色(${arcColor})与边颜色不匹配`
        });
      }
    });

    // 3. 直角符号检查（如果有）
    svg.querySelectorAll('[id*="right-angle"], [id*="90deg"], rect[class*="right"]').forEach(el => {
      const opacity = parseFloat(el.getAttribute('opacity') || '1');
      if (opacity <= 0) return;

      const stroke = (el.getAttribute('stroke') || '').toLowerCase();
      const fill = (el.getAttribute('fill') || '').toLowerCase();
      const color = (stroke !== 'none' && stroke) ? stroke : 
                    (fill !== 'none' ? fill : '');

      if (color && !edgeColors.has(color)) {
        issues.push({
          angle: 'right-angle',
          arcId: el.id,
          arcColor: color,
          edgeColors: Array.from(edgeColors),
          message: '直角符号颜色与边颜色不匹配'
        });
      }
    });

    return issues;
  }

  // 单步检查
  function checkStep(stepNum) {
    log(`检查步骤 ${stepNum}...`);
    
    const result = {
      step: stepNum,
      status: 'PASS',
      issues: [],
      timestamp: Date.now()
    };

    // 1. SVG 存在性检查
    const svg = document.querySelector('svg');
    if (!svg) {
      result.status = 'FAIL';
      result.issues.push('SVG 元素不存在');
      return result;
    }

    // 2. 颜色一致性检查
    const colorIssues = checkColorConsistency();
    if (colorIssues.length > 0) {
      result.status = 'FAIL';
      result.issues = colorIssues;
    }

    log(`步骤 ${stepNum} 结果:`, result.status);
    return result;
  }

  // ==================== 测试流程控制 ====================
  
  // 运行完整测试
  async function runTest() {
    if (state.isRunning) {
      log('测试已在运行中');
      return;
    }

    state.isRunning = true;
    state.currentStep = 0;
    state.steps = [];
    
    log('========== 开始测试 ==========');
    updateResults('running');

    // 步骤 0（初始状态）
    await new Promise(resolve => setTimeout(resolve, 1000));
    const step0 = checkStep(0);
    state.steps.push(step0);
    updateResults('running');

    // 遍历后续步骤
    for (let step = 1; step < CONFIG.maxSteps; step++) {
      const nextBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('下一步'));

      if (!nextBtn || nextBtn.disabled) {
        log('已到达最后一步');
        break;
      }

      try {
        nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, CONFIG.animationDelay));
        
        state.currentStep = step;
        const stepResult = checkStep(step);
        state.steps.push(stepResult);
        
        updateResults('running');
      } catch (e) {
        error(`步骤 ${step} 执行失败:`, e.message);
        break;
      }
    }

    // 测试完成
    const failedCount = state.steps.filter(s => s.status === 'FAIL').length;
    const finalStatus = (state.jsErrors.length === 0 && failedCount === 0) ? 
                        'complete' : 'complete-with-errors';
    
    log('========== 测试完成 ==========');
    log(`总步骤: ${state.steps.length}`);
    log(`失败: ${failedCount}`);
    log(`JS错误: ${state.jsErrors.length}`);
    
    updateResults(finalStatus, {
      summary: {
        totalSteps: state.steps.length,
        passed: state.steps.length - failedCount,
        failed: failedCount,
        jsErrors: state.jsErrors.length
      }
    });

    state.isRunning = false;

    // 输出到控制台（方便复制）
    console.log('\n========== 测试报告（JSON） ==========');
    console.log(JSON.stringify({
      status: finalStatus,
      jsErrors: state.jsErrors,
      steps: state.steps
    }, null, 2));
  }

  // ==================== 错误监听 ====================
  
  // 捕获 console.error
  const originalError = console.error;
  console.error = function(...args) {
    state.jsErrors.push({
      type: 'error',
      text: args.join(' '),
      timestamp: Date.now()
    });
    originalError.apply(console, args);
  };

  // 捕获未处理异常
  window.addEventListener('error', (event) => {
    state.jsErrors.push({
      type: 'uncaught',
      text: event.message,
      timestamp: Date.now()
    });
  });

  // ==================== API 接口 ====================
  
  // 暴露给外部调用的 API
  window.__testAnimations = {
    // 运行完整测试
    run: runTest,
    
    // 检查单步（手动调用）
    checkStep,
    
    // 获取当前结果
    getResults: () => ({
      currentStep: state.currentStep,
      steps: state.steps,
      jsErrors: state.jsErrors
    }),
    
    // 重置状态
    reset: () => {
      state.currentStep = 0;
      state.steps = [];
      state.jsErrors = [];
      state.isRunning = false;
      updateResults('idle');
      log('测试状态已重置');
    }
  };

  // ==================== 初始化 ====================
  
  log('测试脚本已加载');
  log('调用 window.__testAnimations.run() 开始测试');
  log('或调用 window.__testAnimations.checkStep(n) 检查单步');
  
  updateResults('ready', {
    message: '测试脚本已就绪，调用 run() 开始'
  });

})();
