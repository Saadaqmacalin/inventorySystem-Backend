// Basic script to verifying API using fetch (Node 18+)
// Usage: node backend/scripts/verify_products.js

const BASE_URL = "http://localhost:5000/api/products";

async function runTests() {
  console.log("Starting verification...");

  // 1. Invalid Product (Validation Error)
  console.log("\nTest 1: Create Invalid Product (Expect 400)");
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: "" }) // Invalid
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log("Response:", data);
  } catch (err) {
    console.error("Test 1 Failed:", err);
  }

  // 2. Valid Product
  let productId = "";
  console.log("\nTest 2: Create Valid Product (Expect 201)");
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: "Test Product",
        categoryId: "65badf123456789012345678", // Mock ID
        supplierId: "65badf123456789012345678", // Mock ID
        description: "A test product",
        price: 100,
        costPrice: 50
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log("Response:", data);
    if (res.ok) productId = data.product._id;
  } catch (err) {
    console.error("Test 2 Failed:", err);
  }

  if (!productId) {
      console.log("Skipping remaining tests as product creation failed.");
      return;
  }

  // 3. Update Product (Invalid: Price < Cost)
  console.log("\nTest 3: Update Invalid Price (Expect 400)");
  try {
    const res = await fetch(`${BASE_URL}/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: 40, 
        costPrice: 50
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log("Response:", data);
  } catch (err) {
    console.error("Test 3 Failed:", err);
  }

  // 4. Delete Product
  console.log("\nTest 4: Delete Product (Expect 200)");
  try {
    const res = await fetch(`${BASE_URL}/${productId}`, {
      method: "DELETE"
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log("Response:", data);
  } catch (err) {
    console.error("Test 4 Failed:", err);
  }
}

runTests();
