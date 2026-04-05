#!/usr/bin/env python3
"""更深入的调试 - 捕获所有错误和运行时信息"""

from playwright.sync_api import sync_playwright
import json

BASE_URL = "http://localhost:4321/math-explainer/problem/math-001/"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        # Collect everything
        all_console = []
        all_errors = []
        
        page.on("console", lambda msg: all_console.append({"type": msg.type, "text": msg.text}))
        page.on("pageerror", lambda exc: all_errors.append(str(exc)))
        
        page.goto(BASE_URL, wait_until="load", timeout=30000)
        page.wait_for_timeout(8000)  # 长时间等待 React 可能的渲染
        
        print("=" * 60)
        print("ALL Console Messages:")
        print("=" * 60)
        for msg in all_console:
            print(f"  [{msg['type']}] {msg['text'][:200]}")
        
        print(f"\nPage errors: {len(all_errors)}")
        for e in all_errors:
            print(f"  {e[:300]}")
        
        # Check data attributes on root
        data = page.evaluate("""() => {
            const root = document.getElementById('combined-root');
            if (!root) return 'NO ROOT';
            return {
                steps: root.dataset.steps ? JSON.parse(root.dataset.steps).length + ' steps' : 'none',
                geometry: root.dataset.geometry ? 'present' : 'none',
                animations: root.dataset.animations ? 'present' : 'none',
                innerHTML: root.innerHTML.substring(0, 500),
                childCount: root.childElementCount
            };
        }""")
        print(f"\nRoot data: {json.dumps(data, indent=2)}")
        
        # Check if React is available
        react_check = page.evaluate("""() => {
            try {
                const hasReact = typeof React !== 'undefined';
                const hasReactDOM = typeof ReactDOM !== 'undefined';
                const hasCreateRoot = typeof ReactDOMRoot !== 'undefined';
                return { hasReact, hasReactDOM, hasCreateRoot };
            } catch(e) {
                return { error: e.message };
            }
        }""")
        print(f"\nReact check: {json.dumps(react_check, indent=2)}")
        
        browser.close()

if __name__ == "__main__":
    main()