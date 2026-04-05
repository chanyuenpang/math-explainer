// test-animations-injected.js - 注入到页面中执行的测试脚本
(function() {
  const results = [];
  let stepIndex = 0;
  
  function log(msg, type = 'info') {
    results.push({ step: stepIndex, type, message: msg });
    console.log(`[TEST] ${type}: ${msg}`);
  }
  
  function assert(condition, message) {
    if (!condition) {
      log(`FAIL: ${message}`, 'error');
    } else {
      log(`PASS: ${message}`, 'pass');
    }
  }
  
  // 检查颜色一致性
  function checkColorConsistency() {
    const svg = document.querySelector('svg');
    if (!svg) { log('No SVG found', 'error'); return; }
    
    // 找所有可见的弧线
    const arcs = svg.querySelectorAll('path[id^="bad-"], path[id^="angle-"]');
    arcs.forEach(arc => {
      const style = window.getComputedStyle(arc);
      const opacity = parseFloat(style.opacity);
      if (opacity > 0.1) {
        const arcId = arc.id;
        const angleName = arcId.replace('bad-', '').replace('angle-', '');
        const arcStroke = style.stroke || arc.getAttribute('stroke');
        
        // 找对应的边
        const edges = svg.querySelectorAll('line');
        let matchedEdgeColor = null;
        edges.forEach(edge => {
          const edgeStyle = window.getComputedStyle(edge);
          const edgeOpacity = parseFloat(edgeStyle.opacity);
          if (edgeOpacity > 0.1 && edgeStyle.stroke === arcStroke) {
            matchedEdgeColor = edgeStyle.stroke;
          }
        });
        
        assert(matchedEdgeColor, `角${angleName} 弧线颜色=${arcStroke} 有匹配的边`);
      }
    });
  }
  
  // 检查页面完整性
  function checkPageIntegrity() {
    assert(document.querySelector('svg') !== null, 'SVG 元素存在');
    assert(document.querySelector('svg').innerHTML.length > 100, 'SVG 内容不为空');
  }
  
  // 监听下一步按钮
  function runAllSteps() {
    const nextBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('下一步'));
    if (!nextBtn) { log('没有找到下一步按钮', 'error'); return; }
    
    const interval = setInterval(() => {
      checkColorConsistency();
      checkPageIntegrity();
      
      if (nextBtn.disabled) {
        clearInterval(interval);
        // 输出最终结果
        console.log('=== TEST RESULTS ===');
        console.log(JSON.stringify(results, null, 2));
        const fails = results.filter(r => r.type === 'error');
        console.log(`TOTAL: ${results.length} PASS: ${results.filter(r => r.type === 'pass').length} FAIL: ${fails.length}`);
        if (fails.length > 0) {
          console.log('FAILURES:');
          fails.forEach(f => console.log(`  Step ${f.step}: ${f.message}`));
        }
        return;
      }
      
      nextBtn.click();
      stepIndex++;
    }, 1500);
  }
  
  // 开始测试
  log('测试开始');
  checkPageIntegrity();
  runAllSteps();
})();
