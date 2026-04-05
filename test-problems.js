import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const problems = ['math-001', 'math-002', 'math-003', 'math-004', 'math-005'];
const baseUrl = 'http://localhost:4322/math-explainer/'; // preview 模式

async function testProblem(browser, problemId) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    problemId,
    errors: [],
    steps: [],
    colorIssues: []
  };

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push(msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', err => {
    results.errors.push(err.message);
  });

  try {
    console.log(`\n=== Testing ${problemId} ===`);
    const url = `${baseUrl}problem/${problemId}/`;
    console.log(`Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for SVG to load
    await page.waitForSelector('svg', { timeout: 10000 });
    console.log('SVG loaded');
    
    // Find the "下一步" button
    const nextButton = page.locator('button:has-text("下一步")');
    
    let stepCount = 0;
    let hasMoreSteps = true;
    
    while (hasMoreSteps) {
      stepCount++;
      console.log(`Step ${stepCount}:`);
      
      // Take screenshot
      const screenshotPath = path.join(__dirname, 'screenshots', `${problemId}-step${stepCount}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  Screenshot: ${screenshotPath}`);
      
      // Check angle arc colors vs line colors
      const svgContent = await page.content();
      const arcColors = await page.evaluate(() => {
        const arcs = document.querySelectorAll('svg .angle-arc, svg [class*="arc"], svg path[d*="M"]');
        const colors = [];
        arcs.forEach(arc => {
          const fill = arc.getAttribute('fill') || arc.style.fill;
          const stroke = arc.getAttribute('stroke') || arc.style.stroke;
          if (fill && fill !== 'none') colors.push({ type: 'fill', color: fill });
          if (stroke && stroke !== 'none') colors.push({ type: 'stroke', color: stroke });
        });
        return colors;
      });
      
      if (arcColors.length > 0) {
        results.steps.push({
          step: stepCount,
          arcColors,
          screenshot: screenshotPath
        });
        console.log(`  Arc colors: ${JSON.stringify(arcColors)}`);
      }
      
      // Check if button is visible and clickable
      const buttonCount = await nextButton.count();
      if (buttonCount > 0 && await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500); // Wait for animation
      } else {
        hasMoreSteps = false;
        console.log('  No more steps (button not visible)');
      }
    }
    
    console.log(`Total steps: ${stepCount}`);
    
  } catch (err) {
    console.error(`Error testing ${problemId}:`, err.message);
    results.errors.push(err.message);
  } finally {
    await context.close();
  }
  
  return results;
}

async function main() {
  console.log('Starting problem animation tests...\n');
  
  const browser = await chromium.launch({ headless: true });
  const allResults = [];
  
  for (const problemId of problems) {
    const result = await testProblem(browser, problemId);
    allResults.push(result);
  }
  
  await browser.close();
  
  // Print summary
  console.log('\n\n=== TEST SUMMARY ===\n');
  
  for (const result of allResults) {
    console.log(`${result.problemId}:`);
    console.log(`  Steps: ${result.steps.length}`);
    console.log(`  Errors: ${result.errors.length > 0 ? result.errors.join(', ') : 'None'}`);
    
    if (result.steps.length > 0) {
      console.log('  Step details:');
      for (const step of result.steps) {
        console.log(`    Step ${step.step}: ${step.arcColors.length} color elements`);
      }
    }
    console.log('');
  }
  
  // Save results to file
  const fs = await import('fs');
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'), 
    JSON.stringify(allResults, null, 2)
  );
  console.log('Results saved to test-results.json');
}

main().catch(console.error);