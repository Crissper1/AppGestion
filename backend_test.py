import requests
import sys
from datetime import datetime
import json

class WorkManagementAPITester:
    def __init__(self, base_url="https://fffce0f2-a268-4075-92a3-2fcfce6f1e21.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = {}

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result = response.json()
                    print(f"Response: {json.dumps(result, indent=2, default=str)[:500]}...")
                    return success, result
                except:
                    print(f"Response: {response.text[:500]}...")
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:500]}...")
                return success, None

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_health_check(self):
        """Test API health check endpoint"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "api/health",
            200
        )
        self.test_results["health_check"] = success
        return success

    def test_get_dashboard(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "api/dashboard",
            200
        )
        self.test_results["dashboard"] = success
        return success, response

    def test_get_clients(self):
        """Test clients endpoint"""
        success, response = self.run_test(
            "Get Clients",
            "GET",
            "api/clients",
            200
        )
        self.test_results["get_clients"] = success
        return success, response

    def test_get_work_orders(self):
        """Test work orders endpoint"""
        success, response = self.run_test(
            "Get Work Orders",
            "GET",
            "api/work-orders",
            200
        )
        self.test_results["get_work_orders"] = success
        return success, response

    def test_get_invoices(self):
        """Test invoices endpoint"""
        success, response = self.run_test(
            "Get Invoices",
            "GET",
            "api/invoices",
            200
        )
        self.test_results["get_invoices"] = success
        return success, response

def main():
    # Setup
    tester = WorkManagementAPITester()
    
    # Run tests
    print("=== Testing Work Management System API ===")
    
    # Test health check
    tester.test_health_check()
    
    # Test dashboard
    dashboard_success, dashboard_data = tester.test_get_dashboard()
    
    # Test clients
    clients_success, clients_data = tester.test_get_clients()
    
    # Test work orders
    work_orders_success, work_orders_data = tester.test_get_work_orders()
    
    # Test invoices
    invoices_success, invoices_data = tester.test_get_invoices()
    
    # Print results
    print("\n=== Test Results ===")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    for test_name, result in tester.test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    # Print data summary
    if clients_success and clients_data:
        print(f"\nClients found: {len(clients_data)}")
        for client in clients_data:
            print(f"- {client.get('name')} (ID: {client.get('id')})")
    
    if work_orders_success and work_orders_data:
        print(f"\nWork Orders found: {len(work_orders_data)}")
        for wo in work_orders_data:
            print(f"- {wo.get('title')} (Status: {wo.get('status')})")
    
    if invoices_success and invoices_data:
        print(f"\nInvoices found: {len(invoices_data)}")
        for invoice in invoices_data:
            print(f"- {invoice.get('invoice_number')} (Total: ${invoice.get('total_amount')})")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())