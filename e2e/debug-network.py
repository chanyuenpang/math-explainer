#!/usr/bin/env python3
"""获取更详细的网络请求信息"""

from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4321/math-explainer/problem/math-001/"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        # Track all failed requests
        failed_requests = []
        def on_response(response):
            if response.status >= 400:
                failed_requests.append(f"{response.status} {response.url}")
        
        page.on("response", on_response)
        
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(5000)
        
        print("Failed requests:")
        for req in failed_requests:
            print(f"  {req}")
        
        # Check combined-root innerHTML
        root = page.query_selector("#combined-root")
        if root:
            print(f"\nRoot innerHTML length: {len(root.inner_html())}")
            print(f"Root innerText: '{root.inner_text()[:200]}'")
        else:
            print("\nRoot not found!")
        
        # Check for any React-related scripts
        scripts = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('script')).map(s => s.src || s.textContent?.substring(0, 100));
        }""")
        print(f"\nScripts found: {len(scripts)}")
        for s in scripts:
            print(f"  {s}")
        
        browser.close()

if __name__ == "__main__":
    main()