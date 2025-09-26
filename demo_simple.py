#!/usr/bin/env python3
"""
MarketScale QA Framework - Simple Demo
Demonstrates the testing capabilities without full Laravel setup
"""
import subprocess
import time
import json
from datetime import datetime

def run_test(name, command, test_type="functional"):
    """Run a test and return results"""
    print(f"🚀 Running {name} ({test_type})...")
    start = time.time()
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        duration = time.time() - start
        
        success = result.returncode == 0
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"   {status} {name} - {duration:.2f}s")
        
        if not success and result.stderr:
            print(f"    Error: {result.stderr[:100]}...")
        
        return {
            'name': name,
            'type': test_type,
            'duration': duration,
            'success': success,
            'error': result.stderr if not success else None
        }
        
    except Exception as e:
        duration = time.time() - start
        print(f"   ❌ ERROR {name} - {duration:.2f}s: {e}")
        return {
            'name': name,
            'type': test_type,
            'duration': duration,
            'success': False,
            'error': str(e)
        }

def main():
    print("🎬 MarketScale QA Framework - Simple Demo")
    print("=" * 60)
    print("Demonstrating testing capabilities and tools")
    print("=" * 60)
    
    tests = []
    
    # Health Checks
    print("\n🏥 HEALTH CHECKS")
    print("-" * 30)
    tests.append(run_test("Node.js Version", "node --version", "health"))
    tests.append(run_test("PHP Version", "php --version", "health"))
    tests.append(run_test("k6 Version", "k6 version", "health"))
    tests.append(run_test("Cypress Version", "npx cypress --version", "health"))
    tests.append(run_test("Playwright Version", "npx playwright --version", "health"))
    
    # Tool Demonstrations
    print("\n🛠️ TOOL DEMONSTRATIONS")
    print("-" * 30)
    tests.append(run_test("Cypress Config Check", "npx cypress verify", "tool"))
    tests.append(run_test("Playwright Config Check", "npx playwright test --list", "tool"))
    
    # Performance Test Demo
    print("\n⚡ PERFORMANCE TEST DEMO")
    print("-" * 30)
    tests.append(run_test("k6 Load Test", "k6 run k6-tests/video-processing-load.js --duration=10s --vus=1", "performance"))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    successful = sum(1 for t in tests if t['success'])
    total = len(tests)
    success_rate = (successful / total) * 100 if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"Successful: {successful}")
    print(f"Failed: {total - successful}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    print("\n📋 DETAILED RESULTS:")
    for test in tests:
        status = "✅" if test['success'] else "❌"
        print(f"  {status} {test['name']} ({test['type']}) - {test['duration']:.2f}s")
        if not test['success'] and test['error']:
            print(f"    Error: {test['error'][:100]}...")
    
    # Save results
    with open('test-results/demo-results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total': total,
                'successful': successful,
                'failed': total - successful,
                'success_rate': success_rate
            },
            'tests': tests
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: test-results/demo-results.json")
    
    if success_rate >= 70:
        print("\n🎉 Demo completed successfully! The QA framework is working.")
    else:
        print("\n⚠️  Some tests failed, but this demonstrates the testing framework is functional.")

if __name__ == "__main__":
    main()
