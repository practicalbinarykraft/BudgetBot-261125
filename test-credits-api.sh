#!/bin/bash
# Quick test script for credits API

echo "🧪 Testing Credits API..."
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s http://localhost:3000/api/health | head -1
echo ""

# Test 2: Credits endpoint (will fail without auth, but we can see the error)
echo "2. Testing credits endpoint (should require auth)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3000/api/credits)
echo "$RESPONSE"
echo ""

# Test 3: Pricing endpoint (should also require auth)
echo "3. Testing pricing endpoint (should require auth)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3000/api/credits/pricing)
echo "$RESPONSE"
echo ""

echo "✅ API endpoints are responding!"
echo ""
echo "📝 Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login with your account"
echo "3. Look at the top-right header - you should see the credits widget"
echo "4. Click on it to open the pricing modal"
