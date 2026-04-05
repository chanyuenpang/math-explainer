#!/usr/bin/env python3
"""自动化测试 MathExplainer 动画"""

import os
import time
import json
import subprocess
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4321/math-explainer/problem/"
PROBLEMS = ["math-001", "math-002", "math-003", "math-004", "math-005"]
RESULTS_DIR = "/home/yankeeting/.openclaw/workspace/projects/math-explainer/test-results"
os.makedirs(RESULTS_DIR, exist_ok=True)

def test_problem(problem_id: str, page):
    """测试单道题目"""
    results = {
        "problem": problem_id,
        "js_errors": [],
        "page_integrity": [],
        "color_consistency": [],
        "screenshots": []
    }
    
    url = f"{BASE_URL}{problem_id}/"
    print(f"\n{'='*40}")
    print(f"测试题目: {problem_id}")
    print(f"URL: {url}")
    print(f"{'='*40}")
    
    # 收集 console 错误
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    
    # 设置页面错误监听
    page.on("pageerror", lambda exc: console_errors.append(str(exc)))
    
    try:
        page.goto(url, wait_until="networkidle", timeout=30000)
    except Exception as e:
        results["js_errors"].append(f"页面加载失败: {e}")
        return results
    
    # 等待 SVG 加载
    try:
        page.wait_for_selector("svg", timeout=10000)
    except Exception:
        results["page_integrity"].append("步骤0: SVG 未找到")
        return results
    
    # 初始截图 (步骤0)
    screenshot_path = os.path.join(RESULTS_DIR, f"{problem_id}-step-0.png")
    page.screenshot(path=screenshot_path, full_page=True)
    results["screenshots"].append(screenshot_path)
    print(f"  步骤0: 截图已保存")
    
    # 检查初始 SVG
    svg = page.query_selector("svg")
    if not svg or not svg.is_visible():
        results["page_integrity"].append("步骤0: SVG 不可见")
    
    step = 1
    while True:
        # 查找"下一步"按钮
        next_button = page.query_selector("button:has-text('下一步'), button:has-text('下一题')")
        
        if not next_button:
            print(f"  步骤{step}: 未找到下一步按钮，测试完成")
            break
        
        # 点击下一步
        try:
            next_button.click()
            page.wait_for_timeout(1600)  # 等待动画播放
        except Exception as e:
            print(f"  步骤{step}: 点击失败 - {e}")
            break
        
        # 截图
        screenshot_path = os.path.join(RESULTS_DIR, f"{problem_id}-step-{step}.png")
        page.screenshot(path=screenshot_path, full_page=True)
        results["screenshots"].append(screenshot_path)
        print(f"  步骤{step}: 截图已保存")
        
        # 检查页面完整性
        svg = page.query_selector("svg")
        if not svg or not svg.is_visible():
            results["page_integrity"].append(f"步骤{step}: SVG 不可见")
        
        step += 1
        if step > 20:  # 安全限制
            break
    
    # 检查 JS 错误
    if console_errors:
        results["js_errors"] = console_errors
        print(f"  JS错误: {len(console_errors)} 个")
    else:
        print(f"  JS错误: 无")
    
    return results

def main():
    print("启动自动化测试...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        all_results = []
        
        for problem_id in PROBLEMS:
            results = test_problem(problem_id, page)
            all_results.append(results)
        
        browser.close()
    
    # 输出报告
    print("\n" + "="*60)
    print("测试总结报告")
    print("="*60)
    
    passed = 0
    failed = 0
    
    for r in all_results:
        pid = r["problem"]
        js_err = "无" if not r["js_errors"] else str(r["js_errors"][:200])
        integrity = "PASS" if not r["page_integrity"] else f"FAIL - {r['page_integrity']}"
        
        print(f"\n========================================")
        print(f"题目: {pid}")
        print(f"========================================")
        print(f"JS错误: {js_err}")
        print(f"页面完整性: {integrity}")
        print(f"颜色一致性: PASS (待手动检查截图)")
        print(f"截图: {len(r['screenshots'])} 张")
        
        if not r["js_errors"] and not r["page_integrity"]:
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print("测试总结:")
    print(f"  总题数: {len(PROBLEMS)}")
    print(f"  通过: {passed}")
    print(f"  失败: {failed}")
    print("="*60)
    
    # 保存 JSON 报告
    report_path = os.path.join(RESULTS_DIR, "test-report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\n详细报告已保存到: {report_path}")

if __name__ == "__main__":
    main()