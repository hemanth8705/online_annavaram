"""
API Testing Script for Kana Vindu
Run this script to test all API endpoints after fixes
"""

import requests
import json
from typing import Optional

BASE_URL = "http://127.0.0.1:4000/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} | {name}")
    if details:
        print(f"     {Colors.YELLOW}{details}{Colors.END}")

def test_endpoint(method: str, path: str, expected_status: int, data: Optional[dict] = None, 
                  headers: Optional[dict] = None, description: str = ""):
    """Test a single endpoint"""
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PATCH":
            response = requests.patch(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        passed = response.status_code == expected_status
        details = f"Status: {response.status_code} (expected {expected_status})"
        if not passed and response.status_code >= 400:
            try:
                error_data = response.json()
                details += f" | Error: {error_data.get('message', 'Unknown error')}"
            except:
                details += f" | Response: {response.text[:100]}"
        
        print_test(f"{method} {path} - {description}", passed, details)
        return response
    except requests.exceptions.RequestException as e:
        print_test(f"{method} {path} - {description}", False, f"Network error: {str(e)}")
        return None

def main():
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}Kana Vindu API Testing Suite{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}\n")

    # Test 1: Products endpoint without trailing slash (should work now)
    print(f"\n{Colors.BLUE}--- Testing Products Endpoints (Trailing Slash Fix) ---{Colors.END}")
    test_endpoint("GET", "/products", 200, description="List products (no trailing slash)")
    test_endpoint("GET", "/products/", 200, description="List products (with trailing slash)")
    
    # Test 2: Auth refresh endpoint (should accept empty body)
    print(f"\n{Colors.BLUE}--- Testing Auth Refresh (422 Error Fix) ---{Colors.END}")
    test_endpoint("POST", "/auth/refresh", 401, description="Refresh without token (expect 401)")
    
    # Test 3: Cart endpoints
    print(f"\n{Colors.BLUE}--- Testing Cart Endpoints (Trailing Slash Fix) ---{Colors.END}")
    test_endpoint("GET", "/cart", 401, description="Get cart (no trailing slash, expect 401 - no auth)")
    test_endpoint("GET", "/cart/", 401, description="Get cart (with trailing slash, expect 401 - no auth)")
    
    # Test 4: Wishlist endpoints (NEW)
    print(f"\n{Colors.BLUE}--- Testing Wishlist Endpoints (NEW Feature) ---{Colors.END}")
    test_endpoint("GET", "/wishlist", 401, description="Get wishlist (expect 401 - no auth)")
    test_endpoint("POST", "/wishlist/toggle", 401, 
                  data={"productId": "test123"}, 
                  description="Toggle wishlist (expect 401 - no auth)")
    
    # Test 5: Health check
    print(f"\n{Colors.BLUE}--- Testing Server Health ---{Colors.END}")
    response = test_endpoint("GET", "/..", 200, description="Server health check")
    
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}Testing Complete!{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}\n")
    
    print(f"{Colors.YELLOW}Note: Some tests expect 401 (Unauthorized) as they test protected endpoints{Colors.END}")
    print(f"{Colors.YELLOW}This is correct behavior - it means the endpoint exists and is working.{Colors.END}\n")
    
    print(f"{Colors.GREEN}Next Steps:{Colors.END}")
    print("1. Start the frontend: cd client && npm run dev")
    print("2. Test the full flow with login/signup")
    print("3. Verify wishlist syncs with backend")
    print("4. Check that logout clears all data\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Testing interrupted by user{Colors.END}\n")
    except Exception as e:
        print(f"\n\n{Colors.RED}Error during testing: {str(e)}{Colors.END}\n")
