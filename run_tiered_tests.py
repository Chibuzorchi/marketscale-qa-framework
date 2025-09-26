#!/usr/bin/env python3
"""
MarketScale QA Test Runner - Comprehensive Testing Framework
Demonstrates advanced QA capabilities for B2B video content platform
"""
import subprocess
import sys
import time
import os
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse
from datetime import datetime

class MarketScaleTestRunner:
    def __init__(self):
        self.results = {}
        self.start_time = time.time()
        self.test_report = {
            'timestamp': datetime.now().isoformat(),
            'platform': 'MarketScale QA Framework',
            'version': '1.0.0',
            'tests': {}
        }
    
    def run_command(self, cmd, component, tier, test_type='functional'):
        """Run a test command and capture results"""
        print(f"🚀 Running {tier} {test_type} tests for {component}...")
        start = time.time()
        
        try:
            result = subprocess.run(
                cmd, 
                shell=True, 
                capture_output=True, 
                text=True, 
                cwd=f"./{component}" if component != '.' else "."
            )
            duration = time.time() - start
            
            test_result = {
                'component': component,
                'tier': tier,
                'test_type': test_type,
                'duration': duration,
                'returncode': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'success': result.returncode == 0,
                'timestamp': datetime.now().isoformat()
            }
            
            self.results[f"{component}_{tier}_{test_type}"] = test_result
            
            status = "✅ PASSED" if result.returncode == 0 else "❌ FAILED"
            print(f"   {status} {component} ({tier}) - {duration:.2f}s")
            
            if not test_result['success'] and result.stderr:
                print(f"    Error: {result.stderr[:200]}...")
            
            return test_result
            
        except Exception as e:
            duration = time.time() - start
            test_result = {
                'component': component,
                'tier': tier,
                'test_type': test_type,
                'duration': duration,
                'returncode': 1,
                'stdout': '',
                'stderr': str(e),
                'success': False,
                'timestamp': datetime.now().isoformat()
            }
            
            self.results[f"{component}_{tier}_{test_type}"] = test_result
            print(f"   ❌ ERROR {component} ({tier}) - {duration:.2f}s: {e}")
            return test_result

    def run_tier1_critical(self, parallel=True):
        """Run Tier 1 Critical tests - Every commit"""
        print("\n🔥 TIER 1 CRITICAL TESTS (Every Commit)")
        print("=" * 60)
        
        commands = [
            # Frontend Tests (Cypress)
            ("npx cypress run --spec 'cypress/e2e/video-recording.cy.js' --headless", "frontend", "tier1", "e2e"),
            ("npx cypress run --spec 'cypress/e2e/content-requests.cy.js' --headless", "frontend", "tier1", "e2e"),
            ("npx cypress run --spec 'cypress/e2e/api-testing.cy.js' --headless", "frontend", "tier1", "api"),
            
            # Backend Tests (PHPUnit)
            ("php artisan test --testsuite=Unit", "backend", "tier1", "unit"),
            ("php artisan test --testsuite=Feature", "backend", "tier1", "feature"),
            
            # API Tests (Newman)
            ("newman run postman/collections/marketscale-api.json -e postman/environments/local.json", "api", "tier1", "contract"),
        ]
        
        if parallel:
            with ThreadPoolExecutor(max_workers=6) as executor:
                futures = [executor.submit(self.run_command, cmd, comp, tier, test_type) for cmd, comp, tier, test_type in commands]
                for future in as_completed(futures):
                    future.result()
        else:
            for cmd, comp, tier, test_type in commands:
                self.run_command(cmd, comp, tier, test_type)

    def run_tier2_important(self, parallel=True):
        """Run Tier 2 Important tests - Schema changes"""
        print("\n⚡ TIER 2 IMPORTANT TESTS (Schema Changes)")
        print("=" * 60)
        
        commands = [
            # Cross-browser Testing (Playwright)
            ("npx playwright test --project=chromium", "cross-browser", "tier2", "e2e"),
            ("npx playwright test --project=firefox", "cross-browser", "tier2", "e2e"),
            ("npx playwright test --project=webkit", "cross-browser", "tier2", "e2e"),
            
            # Mobile Testing
            ("npx playwright test --project='Mobile Chrome'", "mobile", "tier2", "e2e"),
            ("npx playwright test --project='Mobile Safari'", "mobile", "tier2", "e2e"),
            
            # Integration Tests
            ("php artisan test --testsuite=Integration", "backend", "tier2", "integration"),
            
            # Visual Regression Tests
            ("npx playwright test --grep='visual regression'", "visual", "tier2", "regression"),
        ]
        
        if parallel:
            with ThreadPoolExecutor(max_workers=6) as executor:
                futures = [executor.submit(self.run_command, cmd, comp, tier, test_type) for cmd, comp, tier, test_type in commands]
                for future in as_completed(futures):
                    future.result()
        else:
            for cmd, comp, tier, test_type in commands:
                self.run_command(cmd, comp, tier, test_type)

    def run_tier3_secondary(self, parallel=True):
        """Run Tier 3 Secondary tests - Weekly"""
        print("\n TIER 3 SECONDARY TESTS (Weekly)")
        print("=" * 60)
        
        commands = [
            # Performance Testing (k6)
            ("k6 run k6-tests/video-processing-load.js", "performance", "tier3", "load"),
            ("k6 run k6-tests/api-stress-test.js", "performance", "tier3", "stress"),
            
            # Security Testing
            ("php artisan test --testsuite=Security", "security", "tier3", "security"),
            
            # Accessibility Testing
            ("npx playwright test --grep='accessibility'", "accessibility", "tier3", "a11y"),
            
            # End-to-End Workflows
            ("npx cypress run --spec 'cypress/e2e/complete-workflow.cy.js' --headless", "e2e", "tier3", "workflow"),
        ]
        
        if parallel:
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(self.run_command, cmd, comp, tier, test_type) for cmd, comp, tier, test_type in commands]
                for future in as_completed(futures):
                    future.result()
        else:
            for cmd, comp, tier, test_type in commands:
                self.run_command(cmd, comp, tier, test_type)

    def run_smoke_tests(self):
        """Run quick smoke tests for basic functionality"""
        print("\n💨 SMOKE TESTS (Quick Validation)")
        print("=" * 60)
        
        commands = [
            ("npx cypress run --spec 'cypress/e2e/smoke-tests.cy.js' --headless", "smoke", "smoke", "e2e"),
            ("php artisan test --filter=SmokeTest", "smoke", "smoke", "unit"),
            ("curl -f http://localhost:8000/api/health", "smoke", "smoke", "health"),
        ]
        
        for cmd, comp, tier, test_type in commands:
            self.run_command(cmd, comp, tier, test_type)

    def run_regression_suite(self):
        """Run full regression test suite"""
        print("\n🔄 FULL REGRESSION SUITE")
        print("=" * 60)
        
        # Run all tiers
        self.run_tier1_critical(parallel=True)
        self.run_tier2_important(parallel=True)
        self.run_tier3_secondary(parallel=True)

    def run_performance_tests(self):
        """Run comprehensive performance testing"""
        print("\n⚡ PERFORMANCE TESTING SUITE")
        print("=" * 60)
        
        commands = [
            ("k6 run k6-tests/video-processing-load.js", "performance", "performance", "load"),
            ("k6 run k6-tests/api-stress-test.js", "performance", "performance", "stress"),
            ("npx lighthouse http://localhost:8000 --output=json --output-path=./test-results/lighthouse.json", "performance", "performance", "lighthouse"),
        ]
        
        for cmd, comp, tier, test_type in commands:
            self.run_command(cmd, comp, tier, test_type)

    def run_security_tests(self):
        """Run security testing suite"""
        print("\n🔒 SECURITY TESTING SUITE")
        print("=" * 60)
        
        commands = [
            ("php artisan test --testsuite=Security", "security", "security", "security"),
            ("npx cypress run --spec 'cypress/e2e/security-tests.cy.js' --headless", "security", "security", "e2e"),
        ]
        
        for cmd, comp, tier, test_type in commands:
            self.run_command(cmd, comp, tier, test_type)

    def generate_report(self):
        """Generate comprehensive test report"""
        total_time = time.time() - self.start_time
        successful = sum(1 for r in self.results.values() if r['success'])
        total = len(self.results)
        
        # Calculate metrics by tier
        tier_metrics = {}
        for tier in ['tier1', 'tier2', 'tier3', 'smoke', 'performance', 'security']:
            tier_tests = [r for r in self.results.values() if r['tier'] == tier]
            if tier_tests:
                tier_metrics[tier] = {
                    'total': len(tier_tests),
                    'passed': sum(1 for r in tier_tests if r['success']),
                    'failed': sum(1 for r in tier_tests if not r['success']),
                    'success_rate': (sum(1 for r in tier_tests if r['success']) / len(tier_tests)) * 100,
                    'avg_duration': sum(r['duration'] for r in tier_tests) / len(tier_tests)
                }
        
        # Generate HTML report
        html_report = self.generate_html_report(total_time, successful, total, tier_metrics)
        
        # Save reports
        os.makedirs('test-results', exist_ok=True)
        
        with open('test-results/test-report.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total,
                    'successful': successful,
                    'failed': total - successful,
                    'success_rate': (successful/total)*100,
                    'total_time': total_time
                },
                'tier_metrics': tier_metrics,
                'test_results': self.results
            }, f, indent=2)
        
        with open('test-results/test-report.html', 'w') as f:
            f.write(html_report)
        
        return {
            'total_tests': total,
            'successful': successful,
            'failed': total - successful,
            'success_rate': (successful/total)*100,
            'total_time': total_time,
            'tier_metrics': tier_metrics
        }

    def generate_html_report(self, total_time, successful, total, tier_metrics):
        """Generate HTML test report"""
        success_rate = (successful/total)*100 if total > 0 else 0
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>MarketScale QA Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .metric {{ background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }}
        .metric h3 {{ margin: 0 0 10px 0; color: #333; }}
        .metric .value {{ font-size: 2em; font-weight: bold; color: #007bff; }}
        .tier-section {{ margin-bottom: 30px; }}
        .tier-header {{ background: #007bff; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }}
        .tier-content {{ background: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
        .test-item {{ display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: white; border-radius: 5px; }}
        .test-item.passed {{ border-left: 4px solid #28a745; }}
        .test-item.failed {{ border-left: 4px solid #dc3545; }}
        .status {{ font-weight: bold; }}
        .status.passed {{ color: #28a745; }}
        .status.failed {{ color: #dc3545; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 MarketScale QA Test Report</h1>
            <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">{total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value" style="color: #28a745;">{successful}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value" style="color: #dc3545;">{total - successful}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value" style="color: {'#28a745' if success_rate >= 90 else '#ffc107' if success_rate >= 70 else '#dc3545'};">{success_rate:.1f}%</div>
            </div>
            <div class="metric">
                <h3>Total Time</h3>
                <div class="value">{total_time:.2f}s</div>
            </div>
        </div>
"""
        
        # Add tier sections
        for tier, metrics in tier_metrics.items():
            tier_name = tier.replace('tier', 'Tier ').title()
            html += f"""
        <div class="tier-section">
            <div class="tier-header">
                <h2>{tier_name} Tests</h2>
                <p>Success Rate: {metrics['success_rate']:.1f}% | Avg Duration: {metrics['avg_duration']:.2f}s</p>
            </div>
            <div class="tier-content">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                        <strong>{metrics['total']}</strong><br>Total
                    </div>
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                        <strong style="color: #28a745;">{metrics['passed']}</strong><br>Passed
                    </div>
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                        <strong style="color: #dc3545;">{metrics['failed']}</strong><br>Failed
                    </div>
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                        <strong>{metrics['success_rate']:.1f}%</strong><br>Success Rate
                    </div>
                </div>
            </div>
        </div>
"""
        
        html += """
    </div>
</body>
</html>
"""
        return html

    def print_summary(self, report):
        """Print test execution summary"""
        print("\n" + "=" * 80)
        print("📊 MARKETSCALE QA TEST EXECUTION SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {report['total_tests']}")
        print(f"Successful: {report['successful']}")
        print(f"Failed: {report['failed']}")
        print(f"Success Rate: {report['success_rate']:.1f}%")
        print(f"Total Time: {report['total_time']:.2f}s")
        
        print("\n📋 TIER BREAKDOWN:")
        for tier, metrics in report['tier_metrics'].items():
            print(f"  {tier.upper()}: {metrics['passed']}/{metrics['total']} passed ({metrics['success_rate']:.1f}%)")
        
        print(f"\n📄 Detailed reports saved to:")
        print(f"  - test-results/test-report.json")
        print(f"  - test-results/test-report.html")

def main():
    parser = argparse.ArgumentParser(description='MarketScale QA Test Runner')
    parser.add_argument('--tier', choices=['1', '2', '3', 'smoke', 'regression', 'performance', 'security', 'all'], 
                       default='1', help='Which tier to run')
    parser.add_argument('--parallel', action='store_true', default=True, 
                       help='Run tests in parallel')
    parser.add_argument('--sequential', action='store_true', 
                       help='Run tests sequentially')
    
    args = parser.parse_args()
    
    runner = MarketScaleTestRunner()
    
    if args.sequential:
        args.parallel = False
    
    print("🎬 MarketScale QA Test Runner")
    print("=" * 80)
    print("Advanced QA framework for B2B video content platform")
    print("Demonstrates expertise in modern testing tools and methodologies")
    print("=" * 80)
    
    if args.tier == '1' or args.tier == 'all':
        runner.run_tier1_critical(parallel=args.parallel)
    
    if args.tier == '2' or args.tier == 'all':
        runner.run_tier2_important(parallel=args.parallel)
    
    if args.tier == '3' or args.tier == 'all':
        runner.run_tier3_secondary(parallel=args.parallel)
    
    if args.tier == 'smoke' or args.tier == 'all':
        runner.run_smoke_tests()
    
    if args.tier == 'performance' or args.tier == 'all':
        runner.run_performance_tests()
    
    if args.tier == 'security' or args.tier == 'all':
        runner.run_security_tests()
    
    if args.tier == 'regression' or args.tier == 'all':
        runner.run_regression_suite()
    
    # Generate and display report
    report = runner.generate_report()
    runner.print_summary(report)

if __name__ == "__main__":
    main()
