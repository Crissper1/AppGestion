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
        self.token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authorization header if token is available and auth is required
        if auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
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

    def test_login(self, username="admin", password="admin123"):
        """Test login endpoint"""
        # For OAuth2PasswordRequestForm, we need to use form data instead of JSON
        data = {
            "username": username,
            "password": password
        }
        
        url = f"{self.base_url}/api/auth/token"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing Login...")
        
        try:
            # Use requests.post with data parameter (not json) for form data
            response = requests.post(url, data=data, headers=headers)
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2, default=str)[:500]}...")
                
                if "access_token" in result:
                    self.token = result["access_token"]
                    print(f"✅ Successfully obtained authentication token")
                else:
                    print(f"❌ Token not found in response")
                    success = False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"Response: {response.text[:500]}...")
        
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            success = False
            
        self.test_results["login"] = success
        return success

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.token:
            print("❌ Cannot test user profile without authentication token")
            self.test_results["get_current_user"] = False
            return False, None
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200,
            auth=True
        )
        self.test_results["get_current_user"] = success
        return success, response

    def test_get_resources(self):
        """Test resources endpoint"""
        success, response = self.run_test(
            "Get Resources",
            "GET",
            "api/resources",
            200
        )
        self.test_results["get_resources"] = success
        return success, response
        
    def test_create_resource(self, resource_data):
        """Test creating a resource"""
        success, response = self.run_test(
            "Create Resource",
            "POST",
            "api/resources",
            200,
            data=resource_data
        )
        self.test_results["create_resource"] = success
        return success, response
        
    def test_get_inventory(self):
        """Test inventory endpoint"""
        success, response = self.run_test(
            "Get Inventory",
            "GET",
            "api/inventory",
            200
        )
        self.test_results["get_inventory"] = success
        return success, response
        
    def test_create_inventory_item(self, item_data):
        """Test creating an inventory item"""
        success, response = self.run_test(
            "Create Inventory Item",
            "POST",
            "api/inventory",
            200,
            data=item_data
        )
        self.test_results["create_inventory_item"] = success
        return success, response
        
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

def main():
    # Setup
    tester = WorkManagementAPITester()
    
    # Run tests
    print("=== Testing Work Management System API ===")
    
    # Test health check
    tester.test_health_check()
    
    # Test authentication
    login_success = tester.test_login(username="admin", password="admin123")
    if login_success:
        user_success, user_data = tester.test_get_current_user()
    
    # Test dashboard
    dashboard_success, dashboard_data = tester.test_get_dashboard()
    
    # Test clients
    clients_success, clients_data = tester.test_get_clients()
    
    # Test work orders
    work_orders_success, work_orders_data = tester.test_get_work_orders()
    
    # Test invoices
    invoices_success, invoices_data = tester.test_get_invoices()
    
    # Test resources
    resources_success, resources_data = tester.test_get_resources()
    
    # Create a test resource if none exist
    if resources_success and len(resources_data) == 0:
        test_resource = {
            "name": "Test Resource",
            "type": "personnel",
            "status": "available",
            "description": "Test resource created by automated test",
            "identification": "TEST-ID-123",
            "hourly_cost": 25.0,
            "specialties": ["Testing", "Automation"]
        }
        resource_create_success, new_resource = tester.test_create_resource(test_resource)
    
    # Test inventory
    inventory_success, inventory_data = tester.test_get_inventory()
    
    # Create a test inventory item if none exist
    if inventory_success and len(inventory_data) == 0:
        test_item = {
            "name": "Test Item",
            "category": "material",
            "description": "Test item created by automated test",
            "unit": "unidad",
            "unit_cost": 15.0,
            "minimum_stock": 5,
            "current_stock": 10,
            "location": "Test Location"
        }
        item_create_success, new_item = tester.test_create_inventory_item(test_item)
    
    # Print results
    print("\n=== Test Results ===")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    for test_name, result in tester.test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    # Print data summary
    if clients_success and clients_data:
        print(f"\nClients found: {len(clients_data)}")
        for client in clients_data[:3]:  # Show only first 3 for brevity
            print(f"- {client.get('name')} (ID: {client.get('id')})")
    
    if work_orders_success and work_orders_data:
        print(f"\nWork Orders found: {len(work_orders_data)}")
        for wo in work_orders_data[:3]:  # Show only first 3 for brevity
            print(f"- {wo.get('title')} (Status: {wo.get('status')})")
    
    if invoices_success and invoices_data:
        print(f"\nInvoices found: {len(invoices_data)}")
        for invoice in invoices_data[:3]:  # Show only first 3 for brevity
            print(f"- {invoice.get('invoice_number')} (Total: ${invoice.get('total_amount')})")
    
    if resources_success and resources_data:
        print(f"\nResources found: {len(resources_data)}")
        for resource in resources_data[:3]:  # Show only first 3 for brevity
            print(f"- {resource.get('name')} (Type: {resource.get('type')}, Status: {resource.get('status')})")
    
    if inventory_success and inventory_data:
        print(f"\nInventory Items found: {len(inventory_data)}")
        for item in inventory_data[:3]:  # Show only first 3 for brevity
            print(f"- {item.get('name')} (Category: {item.get('category')}, Stock: {item.get('current_stock')})")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())