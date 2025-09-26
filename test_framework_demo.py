#!/usr/bin/env python3
"""
MarketScale QA Framework - Comprehensive Demo
Demonstrates the complete testing framework capabilities
"""
import subprocess
import time
import json
import os
from datetime import datetime

def run_test(name, command, test_type="functional", timeout=30):
    """Run a test and return results"""
    print(f"Running {name} ({test_type})...")
    start = time.time()
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=timeout
        )
        duration = time.time() - start
        
        success = result.returncode == 0
        status = "PASSED" if success else "FAILED"
        print(f"   {status} {name} - {duration:.2f}s")
        
        if not success and result.stderr:
            print(f"    Error: {result.stderr[:200]}...")
        
        return {
            'name': name,
            'type': test_type,
            'duration': duration,
            'success': success,
            'error': result.stderr if not success else None,
            'output': result.stdout
        }
        
    except subprocess.TimeoutExpired:
        duration = time.time() - start
        print(f"   TIMEOUT {name} - {duration:.2f}s")
        return {
            'name': name,
            'type': test_type,
            'duration': duration,
            'success': False,
            'error': f"Test timed out after {timeout}s",
            'output': ""
        }
    except Exception as e:
        duration = time.time() - start
        print(f"   ERROR {name} - {duration:.2f}s: {e}")
        return {
            'name': name,
            'type': test_type,
            'duration': duration,
            'success': False,
            'error': str(e),
            'output': ""
        }

def check_file_exists(filepath, description):
    """Check if a file exists and return result"""
    exists = os.path.exists(filepath)
    status = "EXISTS" if exists else "MISSING"
    print(f"   {status} {description}")
    return {
        'name': description,
        'type': 'file_check',
        'duration': 0,
        'success': exists,
        'error': f"File not found: {filepath}" if not exists else None,
        'output': filepath if exists else ""
    }

def main():
    print("MarketScale QA Framework - Comprehensive Demo")
    print("=" * 60)
    print("Demonstrating complete testing framework capabilities")
    print("=" * 60)
    
    tests = []
    
    # Environment Health Checks
    print("\nENVIRONMENT HEALTH CHECKS")
    print("-" * 30)
    tests.append(run_test("Node.js Version", "node --version", "health"))
    tests.append(run_test("NPM Version", "npm --version", "health"))
    tests.append(run_test("PHP Version", "php --version", "health"))
    tests.append(run_test("Composer Version", "composer --version", "health"))
    tests.append(run_test("k6 Version", "k6 version", "health"))
    tests.append(run_test("Python Version", "python3 --version", "health"))
    
    # Tool Installation Checks
    print("\nTOOL INSTALLATION CHECKS")
    print("-" * 30)
    tests.append(run_test("Cypress Installation", "npx cypress --version", "tool"))
    tests.append(run_test("Playwright Installation", "npx playwright --version", "tool"))
    tests.append(run_test("Vite Installation", "npx vite --version", "tool"))
    
    # File Structure Validation
    print("\nFILE STRUCTURE VALIDATION")
    print("-" * 30)
    tests.append(check_file_exists("package.json", "Package.json"))
    tests.append(check_file_exists("composer.json", "Composer.json"))
    tests.append(check_file_exists("cypress.config.js", "Cypress Config"))
    tests.append(check_file_exists("playwright.config.js", "Playwright Config"))
    tests.append(check_file_exists("vite.config.js", "Vite Config"))
    tests.append(check_file_exists("run_tiered_tests.py", "Tiered Test Runner"))
    tests.append(check_file_exists("run_simple_tests.py", "Simple Test Runner"))
    tests.append(check_file_exists("demo_simple.py", "Demo Script"))
    tests.append(check_file_exists(".github/workflows/qa-tests.yml", "GitHub Actions Workflow"))
    
    # Laravel Structure Validation
    print("\nLARAVEL STRUCTURE VALIDATION")
    print("-" * 30)
    tests.append(check_file_exists("artisan", "Laravel Artisan"))
    tests.append(check_file_exists("bootstrap/app.php", "Laravel Bootstrap"))
    tests.append(check_file_exists("app/Http/Kernel.php", "HTTP Kernel"))
    tests.append(check_file_exists("app/Console/Kernel.php", "Console Kernel"))
    tests.append(check_file_exists("app/Exceptions/Handler.php", "Exception Handler"))
    tests.append(check_file_exists("routes/web.php", "Web Routes"))
    tests.append(check_file_exists("routes/api.php", "API Routes"))
    tests.append(check_file_exists("resources/views/welcome.blade.php", "Welcome View"))
    
    # Vue.js Structure Validation
    print("\nVUE.JS STRUCTURE VALIDATION")
    print("-" * 30)
    tests.append(check_file_exists("resources/js/app.js", "Vue App Entry"))
    tests.append(check_file_exists("resources/js/components/App.vue", "App Component"))
    tests.append(check_file_exists("resources/js/components/VideoRecorder.vue", "VideoRecorder Component"))
    tests.append(check_file_exists("resources/js/stores/video.js", "Video Store"))
    tests.append(check_file_exists("resources/js/stores/contentRequest.js", "ContentRequest Store"))
    tests.append(check_file_exists("resources/css/app.css", "App CSS"))
    
    # Test Files Validation
    print("\nTEST FILES VALIDATION")
    print("-" * 30)
    tests.append(check_file_exists("cypress/e2e/video-recording.cy.js", "Cypress Video Test"))
    tests.append(check_file_exists("cypress/e2e/content-requests.cy.js", "Cypress Content Test"))
    tests.append(check_file_exists("cypress/e2e/api-testing.cy.js", "Cypress API Test"))
    tests.append(check_file_exists("playwright-tests/video-recording.spec.js", "Playwright Video Test"))
    tests.append(check_file_exists("k6-tests/video-processing-load.js", "k6 Load Test"))
    tests.append(check_file_exists("k6-tests/api-stress-test.js", "k6 Stress Test"))
    
    # Dependency Resolution Test
    print("\nDEPENDENCY RESOLUTION TEST")
    print("-" * 30)
    tests.append(run_test("NPM Install Test", "npm install --legacy-peer-deps --dry-run", "dependency", 60))
    tests.append(run_test("Composer Install Test", "composer install --dry-run", "dependency", 60))
    
    # Configuration Validation
    print("\nCONFIGURATION VALIDATION")
    print("-" * 30)
    tests.append(run_test("Cypress Config Validation", "npx cypress verify", "config", 30))
    tests.append(run_test("Playwright Config Validation", "npx playwright test --list", "config", 30))
    
    # Performance Test (without server)
    print("\nPERFORMANCE TEST DEMO")
    print("-" * 30)
    tests.append(run_test("k6 Load Test Demo", "k6 run k6-tests/video-processing-load.js --duration=10s --vus=1", "performance", 20))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    successful = sum(1 for t in tests if t['success'])
    total = len(tests)
    success_rate = (successful / total) * 100 if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"Successful: {successful}")
    print(f"Failed: {total - successful}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    # Categorize results
    health_tests = [t for t in tests if t['type'] == 'health']
    tool_tests = [t for t in tests if t['type'] == 'tool']
    file_tests = [t for t in tests if t['type'] == 'file_check']
    config_tests = [t for t in tests if t['type'] == 'config']
    dependency_tests = [t for t in tests if t['type'] == 'dependency']
    performance_tests = [t for t in tests if t['type'] == 'performance']
    
    print(f"\nHealth Checks: {sum(1 for t in health_tests if t['success'])}/{len(health_tests)}")
    print(f"Tool Installation: {sum(1 for t in tool_tests if t['success'])}/{len(tool_tests)}")
    print(f"File Structure: {sum(1 for t in file_tests if t['success'])}/{len(file_tests)}")
    print(f"Configuration: {sum(1 for t in config_tests if t['success'])}/{len(config_tests)}")
    print(f"Dependencies: {sum(1 for t in dependency_tests if t['success'])}/{len(dependency_tests)}")
    print(f"Performance: {sum(1 for t in performance_tests if t['success'])}/{len(performance_tests)}")
    
    print("\nDETAILED RESULTS:")
    for test in tests:
        status = "PASS" if test['success'] else "FAIL"
        print(f"  {status} {test['name']} ({test['type']}) - {test['duration']:.2f}s")
        if not test['success'] and test['error']:
            print(f"    Error: {test['error'][:100]}...")
    
    # Save comprehensive results
    os.makedirs('test-results', exist_ok=True)
    with open('test-results/comprehensive-results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total': total,
                'successful': successful,
                'failed': total - successful,
                'success_rate': success_rate,
                'categories': {
                    'health': f"{sum(1 for t in health_tests if t['success'])}/{len(health_tests)}",
                    'tools': f"{sum(1 for t in tool_tests if t['success'])}/{len(tool_tests)}",
                    'files': f"{sum(1 for t in file_tests if t['success'])}/{len(file_tests)}",
                    'config': f"{sum(1 for t in config_tests if t['success'])}/{len(config_tests)}",
                    'dependencies': f"{sum(1 for t in dependency_tests if t['success'])}/{len(dependency_tests)}",
                    'performance': f"{sum(1 for t in performance_tests if t['success'])}/{len(performance_tests)}"
                }
            },
            'tests': tests
        }, f, indent=2)
    
    print(f"\nResults saved to: test-results/comprehensive-results.json")
    
    if success_rate >= 80:
        print("\nSUCCESS: Framework is working excellently!")
    elif success_rate >= 60:
        print("\nGOOD: Framework is working well with minor issues.")
    else:
        print("\nNEEDS ATTENTION: Some components need fixing.")
    
    return success_rate >= 60

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
