#!/usr/bin/env python3
"""修复颜色检查 - 区分 stroke 和 fill，改进 JS 错误收集"""

import os
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4321/math-explainer/problem/"
PROBLEMS = ["math-001", "math-002", "math-003", "math-004", "math-005"]
RESULTS_DIR = "/home/yankeeting/.openclaw/workspace/projects/math-explainer/test-results"
os.makedirs(RESULTS_DIR, exist_ok=True)

# 颜色检查的 JS 代码 - 改进版
COLOR_CHECK_JS = """() => {
    const issues = [];
    const svg = document.querySelector('svg');
    if (!svg) return issues;
    
    // 找所有 id 以 bad- 或 angle- 开头的 path 元素
    const arcs = svg.querySelectorAll('path[id^="bad-"], path[id^="angle-"]');
    
    // 收集所有可见边的颜色
    const allLineStrokes = new Set();
    const lines = svg.querySelectorAll('line');
    for (const line of lines) {
        const lineOp = parseFloat(line.getAttribute('opacity') || '1');
        if (lineOp > 0) {
            const stroke = line.getAttribute('stroke');
            if (stroke && stroke !== 'none') {
                allLineStrokes.add(stroke.toLowerCase());
            }
        }
    }
    
    for (const arc of arcs) {
        const opacity = parseFloat(arc.getAttribute('opacity') || '1');
        if (opacity <= 0) continue;
        
        const arcId = arc.id;
        const arcStroke = (arc.getAttribute('stroke') || '').toLowerCase();
        const arcFill = (arc.getAttribute('fill') || '').toLowerCase();
        
        // 提取角度名
        let angleName = '';
        if (arcId.startsWith('bad-')) {
            angleName = arcId.replace('bad-', '');
        } else if (arcId.startsWith('angle-')) {
            angleName = arcId.replace('angle-', '');
        }
        
        if (!angleName) continue;
        
        // 确定弧线的显示颜色
        let arcColor = '';
        if (arcStroke && arcStroke !== 'none') {
            arcColor = arcStroke;
        } else if (arcFill && arcFill !== 'none') {
            arcColor = arcFill;
        }
        
        // 如果弧线有颜色，检查是否有对应颜色的边
        if (arcColor && !allLineStrokes.has(arcColor)) {
            issues.push({
                angle: angleName,
                arcId: arcId,
                arcColor: arcColor,
                arcStroke: arc.getAttribute('stroke'),
                arcFill: arc.getAttribute('fill'),
                edgeColors: Array.from(allLineStrokes)
            });
        }
    }
    
    // 直角符号检查
    const rightAngleEls = svg.querySelectorAll('[id*="right-angle"], [id*="90deg"], rect[class*="right"]');
    for (const el of rightAngleEls) {
        const elOp = parseFloat(el.getAttribute('opacity') || '1');
        if (elOp <= 0) continue;
        const elStroke = (el.getAttribute('stroke') || '').toLowerCase();
        const elFill = (el.getAttribute('fill') || '').toLowerCase();
        let elColor = elStroke !== 'none' && elStroke ? elStroke : (elFill !== 'none' ? elFill : '');
        if (elColor && !allLineStrokes.has(elColor)) {
            issues.push({
                angle: 'right-angle',
                arcId: el.id,
                arcColor: elColor,
                edgeColors: Array.from(allLineStrokes),
                note: '直角符号'
            });
        }
    }
    
    return issues;
}"""

def test_problem(problem_id: str, page):
    """测试单道题目的所有步骤"""
    url = f"{BASE_URL}{problem_id}/"
    results = {
        "problem": problem_id,
        "url": url,
        "js_errors": [],
        "page_integrity": [],
        "color_issues": [],
        "steps": []
    }
    
    # 收集 console 消息（包含非 error 类型）
    console_errors = []
    all_console = []
    page.on("console", lambda msg: (
        console_errors.append({"type": msg.type, "text": msg.text}) if msg.type == "error" else None,
        all_console.append({"type": msg.type, "text": msg.text})
    ))
    page.on("pageerror", lambda exc: console_errors.append({"type": "pageerror", "text": str(exc)}))
    
    # 加载页面
    try:
        page.goto(url, wait_until="load", timeout=30000)
        page.wait_for_timeout(3000)
    except Exception as e:
        results["js_errors"].append({"type": "load-error", "text": str(e)})
        return results
    
    # 检查 SVG
    svg = page.query_selector("svg")
    if not svg:
        results["page_integrity"].append("步骤0: SVG 未找到")
        return results
    
    # 步骤 0
    step_num = 0
    screenshot_path = os.path.join(RESULTS_DIR, f"{problem_id}-step-{step_num}.png")
    page.screenshot(path=screenshot_path, full_page=True)
    step_result = check_step(page, step_num)
    results["steps"].append(step_result)
    print(f"  步骤{step_num}: {step_result['status']}")
    
    # 遍历后续步骤
    for step_num in range(1, 26):
        next_btn = page.query_selector("button:has-text('下一步')")
        if not next_btn:
            print(f"  步骤{step_num}: 未找到下一步按钮，结束")
            break
        if next_btn.is_disabled():
            print(f"  步骤{step_num}: 已到最后一步")
            break
        
        try:
            next_btn.click()
            page.wait_for_timeout(1800)
        except Exception:
            break
        
        screenshot_path = os.path.join(RESULTS_DIR, f"{problem_id}-step-{step_num}.png")
        page.screenshot(path=screenshot_path, full_page=True)
        step_result = check_step(page, step_num)
        results["steps"].append(step_result)
        print(f"  步骤{step_num}: {step_result['status']}")
    
    results["js_errors"] = console_errors
    return results

def check_step(page, step_num):
    step_result = {"step": step_num, "status": "PASS", "issues": []}
    
    svg = page.query_selector("svg")
    if not svg:
        step_result["status"] = "FAIL"
        step_result["issues"].append("SVG 不存在")
        return step_result
    
    color_issues = page.evaluate(COLOR_CHECK_JS)
    for issue in color_issues:
        step_result["status"] = "FAIL"
        step_result["issues"].append(
            f"角{issue['angle']} 弧线={issue['arcColor']} 边={issue.get('edgeColors', [])}"
        )
    
    return step_result

def main():
    print("=" * 60)
    print("MathExplainer 动画测试 v3")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        all_results = []
        for pid in PROBLEMS:
            print(f"\n{'='*50}")
            print(f"题目: {pid}")
            print(f"{'='*50}")
            result = test_problem(pid, page)
            all_results.append(result)
        
        browser.close()
    
    print_report(all_results)

def print_report(results):
    passed = 0
    failed = 0
    fail_details = []
    
    for r in results:
        pid = r["problem"]
        
        # JS 错误
        js_err_count = len(r["js_errors"])
        js_err_str = "无" if js_err_count == 0 else f"{js_err_count} 个"
        
        # 页面完整性
        integrity = "PASS" if not r["page_integrity"] else f"FAIL ({'; '.join(r['page_integrity'][:3])})"
        
        # 颜色一致性
        color_issues_all = []
        for s in r.get("steps", []):
            for issue in s["issues"]:
                color_issues_all.append(f"步骤{s['step']}: {issue}")
        color = "PASS" if not color_issues_all else "FAIL"
        
        is_pass = (js_err_count == 0 and not r["page_integrity"] and not color_issues_all)
        
        print(f"\n{'='*50}")
        print(f"题目: {pid}")
        print(f"{'='*50}")
        print(f"JS错误: {js_err_str}")
        print(f"页面完整性: {integrity}")
        print(f"颜色一致性: {color}")
        
        if r.get("steps"):
            print(f"步骤数: {len(r['steps'])}")
        
        if color_issues_all:
            print("颜色问题:")
            # 只显示唯一的颜色问题（避免每步重复）
            seen = set()
            for issue in color_issues_all:
                if issue not in seen:
                    print(f"  - {issue}")
                    seen.add(issue)
            print(f"  ... 共 {len(color_issues_all)} 个")
        
        if r["js_errors"]:
            print("JS错误详情:")
            seen_errors = set()
            for e in r["js_errors"]:
                key = e["text"]
                if key not in seen_errors:
                    print(f"  [{e['type']}] {e['text'][:200]}")
                    seen_errors.add(key)
        
        print(f"截图: {pid}-step-0.png ~ step-{len(r.get('steps', []))-1}.png")
        
        if is_pass:
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"测试总结:")
    print(f"  总题数: {len(results)}")
    print(f"  通过: {passed}")
    print(f"  失败: {failed}")
    print(f"{'='*60}")
    
    # 保存 JSON
    report_path = os.path.join(RESULTS_DIR, "test-report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n报告已保存: {report_path}")

if __name__ == "__main__":
    main()