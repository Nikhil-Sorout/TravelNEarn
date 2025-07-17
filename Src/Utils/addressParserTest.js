import { parseAddress } from './addressResolver';

// Test function to demonstrate the improved address parsing
export const testAddressParsing = () => {
  const testAddresses = [
    // Single part addresses
    "Mumbai, Maharashtra 400001",
    "Delhi 110001",
    "Bangalore",
    
    // Two part addresses
    "Mumbai, Maharashtra",
    "Delhi, Delhi",
    "Chennai, Tamil Nadu",
    
    // Three part addresses
    "Andheri, Mumbai, Maharashtra",
    "Koramangala, Bangalore, Karnataka",
    "T Nagar, Chennai, Tamil Nadu",
    
    // Four or more part addresses
    "123 Main Street, Andheri West, Mumbai, Maharashtra, India",
    "456 Park Avenue, Koramangala 1st Block, Bangalore, Karnataka, India",
    "789 Gandhi Road, T Nagar, Chennai, Tamil Nadu, India",
    
    // Addresses with missing pincodes
    "Andheri, Mumbai, Maharashtra",
    "Koramangala, Bangalore",
    "T Nagar, Chennai",
    
    // Complex addresses
    "Flat 101, Building A, Andheri West, Mumbai, Maharashtra 400058",
    "House No. 45, Street 5, Koramangala, Bangalore, Karnataka 560034",
    "Shop No. 12, Market Complex, T Nagar, Chennai, Tamil Nadu 600017"
  ];

  console.log("=== Address Parsing Test Results ===\n");
  
  testAddresses.forEach((address, index) => {
    const result = parseAddress(address);
    console.log(`Test ${index + 1}: "${address}"`);
    console.log(`  Area: "${result.area}"`);
    console.log(`  City: "${result.city}"`);
    console.log(`  State: "${result.state}"`);
    console.log(`  Pincode: "${result.pincode}"`);
    console.log(`  Country: "${result.country}"`);
    console.log("---");
  });
};

// Function to test specific problematic addresses
export const testProblematicAddresses = () => {
  const problematicAddresses = [
    // Addresses with less than 4 parts
    "Mumbai",
    "Delhi, Delhi",
    "Andheri, Mumbai, Maharashtra",
    
    // Addresses without pincodes
    "Andheri, Mumbai, Maharashtra",
    "Koramangala, Bangalore, Karnataka",
    
    // Addresses with unusual formats
    "123 Main St Mumbai Maharashtra 400001",
    "Koramangala Bangalore Karnataka",
    "T Nagar Chennai Tamil Nadu 600017"
  ];

  console.log("=== Problematic Address Test Results ===\n");
  
  problematicAddresses.forEach((address, index) => {
    const result = parseAddress(address);
    console.log(`Problematic Test ${index + 1}: "${address}"`);
    console.log(`  Parsed Result:`, result);
    console.log(`  Has Area: ${!!result.area}`);
    console.log(`  Has City: ${!!result.city}`);
    console.log(`  Has State: ${!!result.state}`);
    console.log(`  Has Pincode: ${!!result.pincode}`);
    console.log("---");
  });
};

// Export the test functions
export default {
  testAddressParsing,
  testProblematicAddresses
}; 