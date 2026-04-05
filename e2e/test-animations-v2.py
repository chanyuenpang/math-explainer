#!/usr/bin/env python3
"""MathExplainer 完整动画测试脚本 v2 - 使用 production preview"""

import os
import json
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4321/math-explainer/problem/"
PROBLEMS = ["math-001", "math-002", "math-003", "math-004", "math-005"]
RESULTS_DIR = "/home/yankeeting/.openclaw/workspace/projects/math-explainer/test-results"
os.makedirs(RESULTS_DIR, exist_ok=True)

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
    
    # 收集 console 错误
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: console_errors.append(str(exc)))
    
    # 加载页面
    try:
        page.goto(url, wait_until="load", timeout=30000)
        page.wait_for_timeout(3000)  # 等待 React 渲染
    except Exception as e:
        results["js_errors"].append(f"页面加载失败: {e}")
        return results
    
    # 检查 SVG 是否存在
    svg = page.query_selector("svg")
    if not svg:
        results["page_integrity"].append("步骤0: SVG 未找到")
        return results
    
    # 步骤 0 截图
    step_num = 0
    screenshot_path = os.path.join(RESULTS_DIR, f"{problem_id}-step-{step_num}.png")
    page.screenshot(path=screenshot_path, full_page=True)
    step_result = check_step(page, step_num)
    results["steps"].append(step_result)
    print(f"  步骤{step_num}: {step_result['status']} | 截图已保存")
    
    # 循环点击下一步
    max_steps = 25
    for step_num in range(1, max_steps + 1):
        # 查找按钮 - 尝试多种选择器
        next_btn = (
            page.query_selector("button:has-text('下一步')") or
            page.query_selector("button:has-text('Next')") or
            page.query_selector("button.next-step") or
            page.query_selector('button[data-action="next"]')
        )
        
        if not next_btn:
            # 也检查按钮是否被禁用
            disabled_btn = page.query_selector("button:has-text('下一步'):disabled")
            if disabled_btn:
                print(f"  步骤{step_num}: 已到最后一步")
            else:
                print(f"  步骤{step_num}: 未找到下一步按钮，结束")
            break
        
        # 检查按钮是否禁用
        is_disabled = next_btn.is_disabled()
        if is_disabled:
            print(f"  步骤{step_num}: 按钮已禁用，结束")
            break
        
        try:
            next_btn.click()
            page.wait_for_timeout(1800)  # 等待动画
        except Exception as e:
            print(f"  步骤{step_num}: 点击失败 - {e}")
            break
        
        # 截图
        screenshot_path = os.path.join(RESULTS_DIR, f"{problem_id}-step-{step_num}.png")
        page.screenshot(path=screenshot_path, full_page=True)
        
        step_result = check_step(page, step_num)
        results["steps"].append(step_result)
        print(f"  步骤{step_num}: {step_result['status']} | 截图已保存")
    
    # 记录 JS 错误
    results["js_errors"] = console_errors
    
    return results

def check_step(page, step_num):
    """检查单步的状态"""
    step_result = {
        "step": step_num,
        "status": "PASS",
        "issues": []
    }
    
    # A. 页面完整性 - SVG 是否存在且可见
    svg = page.query_selector("svg")
    if not svg:
        step_result["status"] = "FAIL"
        step_result["issues"].append("SVG 不存在")
        return step_result
    
    if not svg.is_visible():
        step_result["status"] = "FAIL"
        step_result["issues"].append("SVG 不可见")
    
    # B. 颜色一致性检查 - 检查弧线和边的颜色
    color_issues = page.evaluate("""() => {
        const issues = [];
        const svg = document.querySelector('svg');
        if (!svg) return issues;
        
        // 找所有 id 以 bad- 或 angle- 开头的 path/arc 元素
        const arcs = svg.querySelectorAll('path[id^="bad-"], path[id^="angle-"]');
        
        for (const arc of arcs) {
            const opacity = parseFloat(arc.getAttribute('opacity') || '1');
            if (opacity <= 0) continue; // 跳过不可见的
            
            const arcId = arc.id;
            const arcStroke = arc.getAttribute('stroke') || '';
            
            // 提取角度名
            let angleName = '';
            if (arcId.startsWith('bad-')) {
                angleName = arcId.replace('bad-', '');
            } else if (arcId.startsWith('angle-')) {
                angleName = arcId.replace('angle-', '');
            }
            
            if (!angleName) continue;
            
            // 查找对应颜色的边
            // 需要根据角度名找到相关的边
            // 简单策略：检查所有可见边的 stroke
            const lines = svg.querySelectorAll('line[opacity="1"], line:not([opacity])');
            const edgeStrokes = new Set();
            for (const line of lines) {
                const lineOp = parseFloat(line.getAttribute('opacity') || '1');
                if (lineOp > 0) {
                    edgeStrokes.add(line.getAttribute('stroke') || '');
                }
            }
            
            if (!edgeStrokes.has(arcStroke) && arcStroke) {
                issues.push({
                    angle: angleName,
                    arcId: arcId,
                    arcColor: arcStroke,
                    edgeColors: Array.from(edgeStrokes)
                });
            }
        }
        
        // C. 直角符号检查
        const rightAngleRects = svg.querySelectorAll('rect[id*="right"], rect[id*="90"], path[id*="right"], path[id*="90"]');
        for (const rect of rightAngleRects) {
            const rectOp = parseFloat(rect.getAttribute('opacity') || '1');
            if (rectOp <= 0) continue;
            const rectStroke = rect.getAttribute('stroke') || rect.getAttribute('fill') || '';
            if (rectStroke && !edgeStrokes.has(rectStroke)) {
                issues.push({
                    angle: 'right-angle',
                    arcId: rect.id,
                    arcColor: rectStroke,
                    edgeColors: Array.from(edgeStrokes),
                    note: '直角符号颜色与边不一致'
                });
            }
        }
        
        return issues;
    }""")
    
    for issue in color_issues:
        step_result["status"] = "FAIL"
        step_result["issues"].append(f"角{issue.get('angle', '?')} 弧线={issue['arcColor']} 边={issue.get('edgeColors', [])}")
        results_color = issue  # just for debugging
    
    return step_result

def main():
    print("=" * 60)
    print("MathExplainer 动画测试 v2 (Production Preview)")
    print("=" * 60)
    
    # 验证 server 可用
    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:4321/math-explainer/", timeout=5)
        print("Server: OK")
    except Exception as e:
        print(f"Server: 不可用 - {e}")
        return
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=1
        )
        page = context.new_page()
        
        all_results = []
        
        for pid in PROBLEMS:
            print(f"\n{'='*50}")
            print(f"题目: {pid}")
            print(f"{'='*50}")
            result = test_problem(pid, page)
            all_results.append(result)
        
        browser.close()
    
    # 输出报告
    print_report(all_results)

def print_report(results):
    print("\n" + "=" * 60)
    print("测试总结报告")
    print("=" * 60)
    
    passed = 0
    failed = 0
    fail_details = []
    
    for r in results:
        pid = r["problem"]
        js_err = "无" if not r["js_errors"] else f"{len(r['js_errors'])} 个错误"
        integrity = "PASS"
        color = "PASS"
        
        if r["page_integrity"]:
            integrity = f"FAIL ({'; '.join(r['page_integrity'][:3])})"
        
        step_issues = []
        for s in r.get("steps", []):
            if s["status"] == "FAIL":
                for issue in s["issues"]:
                    step_issues.append(f"步骤{s['step']}: {issue}")
        
        if step_issues:
            color = "FAIL"
        
        is_pass = (not r["js_errors"] and not r["page_integrity"] and not step_issues)
        
        print(f"\n{'='*50}")
        print(f"题目: {pid}")
        print(f"{'='*50}")
        print(f"JS错误: {js_err}")
        print(f"页面完整性: {integrity}")
        print(f"颜色一致性: {color}")
        
        if r.get("steps"):
            step_summary = ", ".join([f"步骤{s['step']}={s['status']}" for s in r["steps"]])
            print(f"步骤详情: {step_summary}")
        
        if step_issues:
            print("详细检查:")
            for issue in step_issues[:5]:
                print(f"  - {issue}")
        
        print(f"截图: test-results/{pid}-step-0.png ~ step-{len(r.get('steps', []))-1}.png")
        
        if is_pass:
            passed += 1
        else:
            failed += 1
            for issue in step_issues:
                fail_details.append(f"- {pid}: {issue}")
            if r["js_errors"]:
                fail_details.append(f"- {pid}: JS错误 ({len(r['js_errors'])}个)")
    
    print(f"\n{'='*60}")
    print(f"测试总结:")
    print(f"  总题数: {len(results)}")
    print(f"  通过: {passed}")
    print(f"  失败: {failed}")
    
    if fail_details:
        print(f"\n失败详情:")
        for d in fail_details:
            print(f"  {d}")
    
    print(f"{'='*60}")
    
    # 保存 JSON
    report_path = os.path.join(RESULTS_DIR, "test-report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n详细报告已保存到: {report_path}")

if __name__ == "__main__":
    main()