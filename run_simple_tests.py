#!/usr/bin/env python3
"""
MarketScale Simple Test Runner - Demonstrates QA Framework
"""
import subprocess
import sys
import time
import os
import json
from datetime import datetime

class SimpleTestRunner:
    def __init__(self):
        self.results = {}
        self.start_time = time.time()
    
    def run_command(self, cmd, test_name, test_type='functional'):
        """Run a test command and capture results"""
        print(f"🚀 Running {test_name} ({test_type})...")
        start = time.time()
        
        try:
            result = subprocess.run(
                cmd, 
                shell=True, 
                capture_output=True, 
                text=True, 
                cwd="."
            )
            duration = time.time() - start
            
            test_result = {
                'test_name': test_name,
                'test_type': test_type,
                'duration': duration,
                'returncode': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'success': result.returncode == 0,
                'timestamp': datetime.now().isoformat()
            }
            
            self.results[test_name] = test_result
            
            status = "✅ PASSED" if result.returncode == 0 else "❌ FAILED"
            print(f"   {status} {test_name} - {duration:.2f}s")
            
            if not test_result['success'] and result.stderr:
                print(f"    Error: {result.stderr[:200]}...")
            
            return test_result
            
        except Exception as e:
            duration = time.time() - start
            test_result = {
                'test_name': test_name,
                'test_type': test_type,
                'duration': duration,
                'returncode': 1,
                'stdout': '',
                'stderr': str(e),
                'success': False,
                'timestamp': datetime.now().isoformat()
            }
            
            self.results[test_name] = test_result
            print(f"   ❌ ERROR {test_name} - {duration:.2f}s: {e}")
            return test_result

    def run_cypress_tests(self):
        """Run Cypress tests"""
        print("\n🎬 CYPRESS TESTS (Vue3 Frontend)")
        print("=" * 50)
        
        # Check if Cypress is installed
        try:
            subprocess.run("npx cypress --version", shell=True, check=True, capture_output=True)
            print("✅ Cypress is installed")
        except:
            print("❌ Cypress not installed. Installing...")
            subprocess.run("npm install cypress --save-dev", shell=True)
        
        # Run Cypress tests
        self.run_command(
            "npx cypress run --spec 'cypress/e2e/video-recording.cy.js' --headless",
            "Video Recording Tests",
            "e2e"
        )
        
        self.run_command(
            "npx cypress run --spec 'cypress/e2e/content-requests.cy.js' --headless", 
            "Content Requests Tests",
            "e2e"
        )
        
        self.run_command(
            "npx cypress run --spec 'cypress/e2e/api-testing.cy.js' --headless",
            "API Testing",
            "api"
        )

    def run_playwright_tests(self):
        """Run Playwright tests"""
        print("\n🎭 PLAYWRIGHT TESTS (Cross-Browser)")
        print("=" * 50)
        
        # Check if Playwright is installed
        try:
            subprocess.run("npx playwright --version", shell=True, check=True, capture_output=True)
            print("✅ Playwright is installed")
        except:
            print("❌ Playwright not installed. Installing...")
            subprocess.run("npm install @playwright/test", shell=True)
            subprocess.run("npx playwright install", shell=True)
        
        # Run Playwright tests
        self.run_command(
            "npx playwright test --project=chromium",
            "Chrome Browser Tests",
            "cross-browser"
        )
        
        self.run_command(
            "npx playwright test --project=firefox",
            "Firefox Browser Tests", 
            "cross-browser"
        )

    def run_performance_tests(self):
        """Run Performance tests"""
        print("\n⚡ PERFORMANCE TESTS (k6)")
        print("=" * 50)
        
        # Check if k6 is installed
        try:
            subprocess.run("k6 version", shell=True, check=True, capture_output=True)
            print("✅ k6 is installed")
        except:
            print("❌ k6 not installed. Please install k6 first:")
            print("   macOS: brew install k6")
            print("   Ubuntu: sudo apt-get install k6")
            print("   Windows: choco install k6")
            return
        
        # Run performance tests
        self.run_command(
            "k6 run k6-tests/video-processing-load.js",
            "Video Processing Load Test",
            "performance"
        )
        
        self.run_command(
            "k6 run k6-tests/api-stress-test.js",
            "API Stress Test",
            "performance"
        )

    def run_health_checks(self):
        """Run basic health checks"""
        print("\n🏥 HEALTH CHECKS")
        print("=" * 50)
        
        # Check if Laravel server is running
        self.run_command(
            "curl -f http://localhost:8000 || echo 'Server not running'",
            "Laravel Server Health",
            "health"
        )
        
        # Check if Node.js is available
        self.run_command(
            "node --version",
            "Node.js Version Check",
            "health"
        )
        
        # Check if PHP is available
        self.run_command(
            "php --version",
            "PHP Version Check", 
            "health"
        )

    def generate_report(self):
        """Generate test report"""
        total_time = time.time() - self.start_time
        successful = sum(1 for r in self.results.values() if r['success'])
        total = len(self.results)
        
        print("\n" + "=" * 60)
        print("📊 MARKETSCALE QA TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Successful: {successful}")
        print(f"Failed: {total - successful}")
        print(f"Success Rate: {(successful/total)*100:.1f}%" if total > 0 else "0%")
        print(f"Total Time: {total_time:.2f}s")
        
        print("\n📋 TEST BREAKDOWN:")
        for name, result in self.results.items():
            status = "✅" if result['success'] else "❌"
            print(f"  {status} {name} ({result['test_type']}) - {result['duration']:.2f}s")
        
        # Save JSON report
        os.makedirs('test-results', exist_ok=True)
        with open('test-results/simple-test-report.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total,
                    'successful': successful,
                    'failed': total - successful,
                    'success_rate': (successful/total)*100 if total > 0 else 0,
                    'total_time': total_time
                },
                'test_results': self.results
            }, f, indent=2)
        
        print(f"\n📄 Report saved to: test-results/simple-test-report.json")

def main():
    runner = SimpleTestRunner()
    
    print("🎬 MarketScale QA Test Runner")
    print("=" * 60)
    print("Demonstrating multiple testing tools and strategies")
    print("=" * 60)
    
    # Run health checks first
    runner.run_health_checks()
    
    # Run Cypress tests
    runner.run_cypress_tests()
    
    # Run Playwright tests  
    runner.run_playwright_tests()
    
    # Run performance tests
    runner.run_performance_tests()
    
    # Generate report
    runner.generate_report()

if __name__ == "__main__":
    main()
