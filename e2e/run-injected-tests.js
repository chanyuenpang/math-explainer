#!/usr/bin/env node
/**
 * 自动化运行注入测试 - Node.js 脚本
 * 
 * 用途：批量测试多道题目，使用注入 JS 脚本提高效率
 * 
 * 使用方法：
 *   node e2e/run-injected-tests.js
 * 
 * 输出：
 *   - test-results/injected-test-report.json - 汇总报告
 *   - test-results/{题目ID}-step-{步骤号}.png - 截图（可选）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const BASE_URL = 'http://localhost:4321/problem';
const PROBLEMS = ['math-001', 'math-002', 'math-003', 'math-004', 'math-005'];
const RESULTS_DIR = path.join(__dirname, '../test-results');
const INJECTED_SCRIPT = fs.readFileSync(
  path.join(__dirname, 'test-animations-injected.js'), 
  'utf8'
);

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// ==================== 测试单道题 ====================
async function testProblem(browser, problemId) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`题目: ${problemId}`);
  console.log('='.repeat(50));

  const page = await browser.newPage();
  
  try {
    // 1. 打开页面
    await page.goto(`${BASE_URL}/${problemId}/`, { 
      waitUntil: 'load', 
      timeout: 30000 
    });
    
    // 2. 注入测试脚本
    await page.evaluate(INJECTED_SCRIPT);
    
    // 3. 启动测试
    await page.evaluate(() => window.__testAnimations.run());
    
    // 4. 等待测试完成
    await page.waitForFunction(() => {
      const el = document.getElementById('test-results');
      return el && el.getAttribute('data-status').startsWith('complete');
    }, { timeout: 60000 });
    
    // 5. 读取结果
    const report = await page.evaluate(() => {
      const el = document.getElementById('test-results');
      return JSON.parse(el.getAttribute('data-report'));
    });
    
    // 6. 截图（可选，保存最后一步）
    const screenshotPath = path.join(RESULTS_DIR, `${problemId}-final.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    console.log(`步骤数: ${report.summary.totalSteps}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    console.log(`JS错误: ${report.summary.jsErrors}`);
    console.log(`状态: ${report.status}`);
    
    return {
      problem: problemId,
      url: `${BASE_URL}/${problemId}/`,
      ...report
    };
    
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    return {
      problem: problemId,
      url: `${BASE_URL}/${problemId}/`,
      status: 'error',
      error: error.message
    };
  } finally {
    await page.close();
  }
}

// ==================== 主函数 ====================
async function main() {
  console.log('='.repeat(60));
  console.log('MathExplainer 动画测试 - 注入版');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  // 批量测试
  for (const problemId of PROBLEMS) {
    const result = await testProblem(browser, problemId);
    results.push(result);
  }
  
  await browser.close();
  
  // 生成汇总报告
  const summary = {
    timestamp: new Date().toISOString(),
    totalProblems: results.length,
    passed: results.filter(r => r.status === 'complete').length,
    failed: results.filter(r => r.status !== 'complete').length,
    results
  };
  
  const reportPath = path.join(RESULTS_DIR, 'injected-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8');
  
  // 打印汇总
  console.log('\n' + '='.repeat(60));
  console.log('测试汇总');
  console.log('='.repeat(60));
  console.log(`总题数: ${summary.totalProblems}`);
  console.log(`通过: ${summary.passed}`);
  console.log(`失败: ${summary.failed}`);
  console.log(`\n详细报告: ${reportPath}`);
  console.log('='.repeat(60));
  
  // 列出失败详情
  const failed = results.filter(r => r.status !== 'complete');
  if (failed.length > 0) {
    console.log('\n失败详情:');
    failed.forEach(r => {
      console.log(`  - ${r.problem}: ${r.status}`);
      if (r.error) {
        console.log(`    错误: ${r.error}`);
      }
      if (r.steps) {
        const failedSteps = r.steps.filter(s => s.status === 'FAIL');
        failedSteps.forEach(s => {
          console.log(`    步骤${s.step}: ${s.issues.length} 个问题`);
        });
      }
    });
  }
}

// ==================== 执行 ====================
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
