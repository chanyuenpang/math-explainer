#!/usr/bin/env python3
"""获取更详细的调试信息"""

import os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4321/math-explainer/problem/math-001/"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        # 收集所有 console 消息
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        
        # 收集页面错误
        page_errors = []
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))
        
        # 访问页面
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)  # 等待 React 渲染
        
        # 检查页面内容
        html = page.content()
        
        # 查找 React root
        root = page.query_selector("#combined-root")
        root_html = root.inner_html() if root else "NOT FOUND"
        
        print("=" * 60)
        print("Console 消息:")
        print("=" * 60)
        for msg in console_messages:
            print(msg)
        
        print("\n" + "=" * 60)
        print("页面错误:")
        print("=" * 60)
        for err in page_errors:
            print(err)
        
        print("\n" + "=" * 60)
        print(f"React Root 内容长度: {len(root_html)}")
        print("=" * 60)
        print(root_html[:2000] if len(root_html) > 2000 else root_html)
        
        browser.close()

if __name__ == "__main__":
    main()